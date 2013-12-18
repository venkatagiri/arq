var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: String,
  joinDate: {type: Date, default: Date.now},
  tokens: {
    fetchDate: {type: Date, default: Date.now},
    accessToken: String,
    refreshToken: String,
    expiresIn: Number
  }
});

module.exports = mongoose.model('User', UserSchema);
