var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  name: String,
  joinDate: {type: Date, default: Date.now},
  tokens: {
    fetchDate: {type: Date, default: Date.now},
    accessToken: String,
    refreshToken: String,
    expiresIn: Number
  },
  posts: [{
    title: {type: String, required: true},
    link: {type: String, required: true},
    subreddit: {type: String, required: true},
    scheduledTime: {type: Date, required: true},
    submitted: false
  }]
});

userSchema.methods.schedulePost = function(post, callback) {
  this.posts.push(post);
  this.save(function(err) {
    if(err) return callback(err);
    callback();
  });
};

module.exports = mongoose.model('User', userSchema);
