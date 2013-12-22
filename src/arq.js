var express = require('express'),
  mongoose = require('mongoose'),
  MongoStore = require('connect-mongo')(express),
  app = express(),
  config = require('./config'),
  reddit = require('./reddit'),
  User = require('./user'),
  Post = require('./post'),
  helpers = require('./helpers');

// Base Setup
app.configure(function() {
  // Logger.
  app.use(function(request, response, next) {
    console.log('[%s] [%s] %s %s', Date(), (request.headers['x-forwarded-for'] || request.ip), request.method, request.url);
    next();
  });

  // Use EJS
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');

  // To enable CORS, i.e. enabling cross-domain AJAX requests.
  app.use(function(request, response, next) {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    response.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // Serve static content from public.
  app.use(express.static(__dirname + '/public'));

  // Parses POST requests as parameters.
  app.use(express.bodyParser());
  
  // Enable sessions.
  app.use(express.cookieParser('shhhh, very secret'));

  // Use mongodb for retaining session store across node restarts.
  app.use(express.session({
    secret: 'shhhh, very secret',
    maxAge: new Date(Date.now() + 3600000),
    store: new MongoStore({
      url: config.mongodbUrl
    })
  }));

  // Connect mongoose to the DB
  mongoose.connect(config.mongodbUrl);

  // From the session, load the user & messages
  app.use(function(request, response, next) {
    response.locals.user = request.session.user;
    response.locals.msg = request.session.msg;
    delete request.session.msg;
    next();
  });

  // Provide access to helper methods from templates
  app.use(function(request, response, next) {  
    response.locals.formatTime = helpers.formatTime;
    next();
  });
});

// App Endpoints
app.get('/', function(request, response) {
  if(request.session.user) {
    Post.find({username: request.session.user.name}, function(err, posts) {
      response.locals.posts = posts;
      response.render('index');
    });
  } else {
    response.render('index');
  }
});

app.get('/login', function(request, response) {
  reddit.login(request, response);
});

app.get('/logout', function(request, response) {
  request.session.destroy();
  response.redirect(config.mountPath);
});

app.get('/callback', function(request, response) {
  var code = request.query.code;
  if(!code) return response.send('Invalid Response!');

  reddit.fetchAccessTokens(code, function(res) {
    if(res.error || !res.access_token) return response.send('Failed to fetch tokens!');
    var tokens = {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresIn: res.expires_in,
      fetchDate: new Date()
    };
    reddit.userDetails(tokens.accessToken, function(res) {
      if(res.error || !res.name) return response.send('Failed to fetch user details!');
      User.findOne({name: res.name}, function(err, user) {
        if(!user) {
          console.log('User(%s) not found!', res.name);
          user = new User({name: res.name});
        }
        user.tokens = tokens;
        user.save(function(err) {
          request.session.regenerate(function() {
            request.session.user = user;
            response.redirect(config.mountPath);
          });
        });
      });
    });
  });
});

app.post('/schedule', function(request, response) {
  if(!request.session.user) return response.send('Invalid Request!');

  Post.create({
    username: request.session.user.name,
    title: request.body.title,
    link: request.body.link,
    subreddit: request.body.subreddit,
    timezoneOffset: parseInt(request.body.timezoneOffset, 10),
    scheduledTime: helpers.parseDate(request.body.date, request.body.time, request.body.timezoneOffset)
  }, function(err) {
    if(err) request.session.msg = err;
    else request.session.msg = 'Link has been scheduled!';
    response.redirect(config.mountPath);
  });
});

// Submit the scheduled posts
app.submitScheduledPosts = function() {
  Post.find({submitted: false, scheduledTime: {$lt: new Date()}}, function(err, posts) {
    if(err) return console.error('SubmitScheduledPosts: Error(%s)', err);
    if(posts.length === 0) return console.log('SubmitScheduledPosts: No Posts in Queue!');
    
    posts.forEach(function(post) {
      User.findOne({name: post.username}, function(err, user) {
        reddit.submit(user.tokens.accessToken, post, function(res) {
          if(res.error) return console.error('SubmitScheduledPosts: Failed(%s by %s) - Error(%s)', post.title, post.username, res.error);
          post.submitted = true;
          post.save();
          console.log('SubmitScheduledPosts: Successful(%s by %s)', post.title, post.username);
        });
      });
    });
  });
};

// Refresh access tokens if the user has a post scheduled in the next 30 minutes
app.refreshUserTokens = function() {
  var currentTime = new Date(),
    threshold = new Date(currentTime.getTime() + 30*60*1000);

  User.find(function(err, users) {
    users.forEach(function(user) {
      // If the token has not expired, skip the user.
      if((user.tokens.fetchDate.getTime() + user.tokens.expiresIn * 1000) > currentTime.getTime()) return;

      // Check if there is a post scheduled in the next 30 minutes for the user.
      Post.findOne({username: user.name, submitted: false, scheduledTime: {$lt: threshold}}, function(err, post) {
        if(err) return console.error('RefreshUserTokens: Error(%s)', err);
        if(!post) return console.log('RefreshUserTokens: No scheduled post found for user %s', user.name);

        // If a post is found, then refresh the user's token.
        reddit.refreshAccessToken(user.tokens.refreshToken, function(res) {
          if(res.error || !res.access_token) return console.error('RefreshUserTokens: Failed to refresh tokens for user %s!', user.name);
          var tokens = {
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            expiresIn: res.expires_in,
            fetchDate: new Date()
          };
          user.tokens = tokens;
          user.save();
          console.log('RefreshUserTokens: User %s successful!', user.name);
        });
      });
    });
  });
};

app.start = function() {
  this.listen(config.port, function() {
    console.log('Listening on port', config.port);
  });
  setInterval(this.refreshUserTokens, 60 * 1000);
  setInterval(this.submitScheduledPosts, 60 * 1000);
};

module.exports = app;
