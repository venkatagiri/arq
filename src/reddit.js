var config = require('./config'),
  agent = require('superagent');

// Prepare the login parameters just once
var loginParams = {
  response_type: 'code',
  client_id: config.redditKey,
  scope: 'identity,submit',
  duration: 'permanent',
  state: 'WHO',
  redirect_uri: config.redditCallback
}, params = [];
for(var p in loginParams){
  if (loginParams.hasOwnProperty(p)) {
    params.push(encodeURIComponent(p) + "=" + encodeURIComponent(loginParams[p]));
  }
}

// reddit API
module.exports = {
  login: function(request, response) {
    response.redirect(config.url.authorization+"?"+params.join('&'));
  },
  fetchAccessTokens: function(code, callback) {
    agent.post(config.url.accessToken)
      .type('form')
      .send({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: config.redditCallback
      })
      .set('Authorization', 'Basic ' + (new Buffer(config.redditKey+':'+config.redditSecret).toString('base64')))
      .end(function(res) {
        callback(JSON.parse(res.text));
      });
  },
  refreshAccessToken: function(refreshToken, callback) {
    agent.post(config.url.accessToken)
      .type('form')
      .send({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        redirect_uri: config.redditCallback
      })
      .set('Authorization', 'Basic ' + (new Buffer(config.redditKey+':'+config.redditSecret).toString('base64')))
      .end(function(res) {
        callback(JSON.parse(res.text));
      });
  },
  get: function(accessToken, url, callback) {
    agent.get(url)
      .set('Authorization', 'Bearer ' + accessToken)
      .end(function(res) {
        callback(JSON.parse(res.text));
      });
  },
  post: function(accessToken, url, params, callback) {
    agent
      .post(url)
      .type('form')
      .send(params)
      .set('Authorization', 'Bearer ' + accessToken)
      .end(function(res) {
        callback(JSON.parse(res.text));
      });
  },
  userDetails: function(accessToken, callback) {
    this.get(accessToken, config.url.details, callback);
  },
  submit: function(accessToken, data, callback) {
    var params = {
      api_type: 'json',
      kind: 'link',
      sr: data.subreddit,
      title: data.title,
      url: data.link
    };
    this.post(accessToken, config.url.submit, params, callback);
  }
};
