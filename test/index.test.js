var mvm = require('../'),
  assert = require('assert');

describe('mvm', function() {
  it('should provide the current version', function(done) {
    mvm.current(function(err) {
      console.log('current returned', arguments);
      done(err);
    });
  });
  describe('available', function() {
    it('should list stable versions', function(done) {
      mvm.available({
        stable: true
      }, function(err, versions) {
          assert.ifError(err);
          var unstable = versions.filter(function(v) {
            return (parseInt(v.split('.')[1], 10) % 2) > 0;
          });
          assert.equal(unstable.length, 0);
          done();
        });
    });
    it('should list unstable versions', function(done) {
      mvm.available({
        unstable: true
      }, function(err, versions) {
          assert.ifError(err);
          var stable = versions.filter(function(v) {
            return (parseInt(v.split('.')[1], 10) % 2) === 0;
          });
          assert.equal(stable.length, 0);
          done();
        });
    });
    it('should list rc versions', function(done) {
      mvm.available({
        rc: true
      }, function(err, versions) {
          assert.ifError(err);
          var stable = versions.filter(function(v) {
            return v.indexOf('rc') === -1;
          });
          assert.equal(stable.length, 0);
          done();
        });
    });
  });
});
