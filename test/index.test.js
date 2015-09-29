/* eslint no-sync: 0 */
var mvm = require('../');
var assert = require('assert');
var exec = require('child_process').exec;
var path = require('path');
var which = require('which');
var fs = require('fs');
var debug = require('debug')('mongodb-version-manager:test');

var M = path.resolve(__dirname, '../bin/m.js');
var NODE = which.sync('node');

debug('path to m bin is %s', M);
debug('path to node bin is %s', NODE);

var run = function(args, done) {
  if (typeof args === 'function') {
    done = args;
    args = '';
  }

  var cmd = '"' + NODE + '" ' + M + ' ' + args;
  debug('running `%s`', cmd);
  assert(fs.existsSync(M), M + ' does not exist');
  assert(fs.existsSync(NODE), NODE + ' does not exist');

  exec(cmd, function(err, stdout, stderr) {
    debug('result of `%s`', cmd, JSON.stringify({
      stdout: stdout.toString('utf-8'),
      stderr: stderr.toString('utf-8')
    }, null, 2));

    if (err) {
      debug('failed to run `%s`', cmd);
      console.error('exec failed: ', err);
      return done(err);
    }
    debug('completed successfully `%s`', cmd);
    done();
  });
};

describe('mongodb-version-manager', function() {
  describe('bin', function() {
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
          return parseInt(v.split('.')[1], 10) % 2 > 0;
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
          return parseInt(v.split('.')[1], 10) % 2 === 0;
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
  describe('regressions', function() {
    it.skip('@todo: times out on appveyor? should install 2.4.x [#15]', function(done) {
      run('2.4.x', done);
    });
  });
});
