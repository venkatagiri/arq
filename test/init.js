var should = require('should'),
    assert = require('assert'),
    request = require('supertest'),
    mongoose = require('mongoose'),
    User = require('../src/user');

mongoose.connect('mongodb://localhost/test');

describe('User', function() {
  before(function(done) {
    User.remove({}, function(doc) {
      done();
    });
  });
  it('should create new user', function(done) {
    User.create({
      name: 'test',
      tokens: {
        accessToken: 'foo',
        refreshToken: 'bar',
        expiresIn: 3600
      }
    }, function(err, user) {
      if(err) throw(err);
      user.should.have.property('name', 'test');
      user.should.have.property('tokens');
      user.tokens.should.have.property('accessToken', 'foo');
      user.tokens.should.have.property('refreshToken', 'bar');
      user.tokens.should.have.property('expiresIn', 3600);
      done();
    });
  });
  it('should schedule a new post', function(done) {
    User.findOne({
      name: 'test'
    }, function(err, user) {
      if(err) throw(err);
      user.schedulePost({}, function(err) {
        err.should.not.be.empty;
        var errorCount = 0;
        for(var attr in err.errors) errorCount++;
        errorCount.should.equal(4);
        done();
      });
    });
  });
});
