if (process.env.CI) {
  process.env.DEBUG = '*';
}

var mvm = require('../'),
  assert = require('assert'),
  exec = require('child_process').exec,
  path = require('path'),
  debug = require('debug')('mongodb-version-manager:test');

var M = path.resolve(__dirname, '../bin/m.js');

debug('path to bin is %s', M);

var run = function(args, done) {
  if (typeof args === 'function') {
    done = args;
    args = '';
  }
  var cmd = 'node ' + M + ' ' + args;
  debug('running `%s`', cmd);

  exec(M, function(err, stdout, stderr) {
    debug('`%s` exec result', cmd, err, stdout, stderr);
    if (err) return done(err);
    done();
  });

};

describe('mvm', function() {
  describe('bin', function() {
    it('should work if i just run `m`', function(done) {
      run(done);
    });

    it('should work if i run `m ls`', function(done) {
      run('ls', done);
    });

    it('should work if i run `m available`', function(done) {
      run('available', done);
    });

    it('should work if i run `m path`', function(done) {
      run('path', done);
    });
  });
  describe('current', function() {
    it('should provide the current version', function(done) {
      mvm.current(function(err) {
        done(err);
      });
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
