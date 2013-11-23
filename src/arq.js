var express = require('express'),
  mongoose = require('mongoose'),
  MongoStore = require('connect-mongo')(express),
  app = express(),
  config = require('./config'),
  reddit = require('./reddit'),
  User = require('./user');

// Base Setup
app.configure(function() {
  // Logger.
  app.use(function(request, response, next) {
    console.log('[%s] [%s] %s %s', Date(), request.ip, request.method, request.url);
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

  // Load the user from the session.
  app.use(function(request, response, next) {
    response.locals.user = request.session.user;
    next();
  });
});

// App Endpoints
app.get('/', function(request, response) {
  response.render('index');
});

app.get('/login', function(request, response) {
  reddit.login(request, response);
});

app.get('/callback', function(request, response) {
  var code = request.query.code;
  if(!code) return response.send('Invalid Response!');

  reddit.fetchAccessTokens(code, function(res) {
    if(res.error || !res.access_token) return response.send('Failed to fetch tokens!');
    var tokens = {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresIn: res.expires_in
    };
    reddit.userDetails(tokens.accessToken, function(res) {
      if(res.error || !res.name) return response.send('Failed to fetch user details!');
      User.findOne({name: res.name}, function(err, user) {
        if(!user) {
          console.log('User not found!', res.name);
          user = new User({name: res.name});
        }
        user.tokens = tokens;
        user.save(function(err) {
          request.session.regenerate(function() {
            request.session.user = user;
            response.redirect('arq/'); //TODO
          });
        });
      });
    });
  });
});

app.start = function() {
  this.listen(config.port, function() {
    console.log('Listening on port', config.port);
  });
};

module.exports = app;
