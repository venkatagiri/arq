var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  username: {type: String},
  title: {type: String},
  link: {type: String},
  subreddit: {type: String},
  scheduledTime: {type: Date},
  timezoneOffset: {type: Number},
  submitted: {type: Boolean, default: false},
  redditId: {type: String}
});

PostSchema.path('title').validate(function(value) {
  return (/^[\w \(\)\-!]+$/).test(value);
}, 'Invalid Title');

PostSchema.path('link').validate(function(value) {
  return (/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i).test(value);
}, 'Invalid Link');

PostSchema.path('subreddit').validate(function(value) {
  return (/^[A-Za-z0-9][A-Za-z0-9_]{2,20}$/).test(value);
}, 'Invalid Subreddit');

PostSchema.path('scheduledTime').validate(function(value) {
  return Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime());
}, 'Invalid Scheduled Time');

module.exports = mongoose.model('Post', PostSchema);
