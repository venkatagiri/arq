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
  call: function(url, accessToken, callback) {
    agent.get(url)
      .set('Authorization', 'Bearer ' + accessToken)
      .end(function(res) {
        callback(JSON.parse(res.text));
      });
  },
  userDetails: function(accessToken, callback) {
    this.call(config.url.details, accessToken, callback);
  }
};
