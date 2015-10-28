/* eslint no-sync: 0 */
process.env.silent = '1';

var assert = require('assert');
var exec = require('child_process').exec;
var path = require('path');
var which = require('which');
var fs = require('fs-extra');
var debug = require('debug')('mongodb-version-manager:test');

process.env.MONGODB_VERSIONS = path.join(__dirname, '.versions');

var mvm = require('../');

var M = path.resolve(__dirname, '../bin/m.js');
var NODE = which.sync('node');

debug('path to m bin is %s', M);
debug('path to node bin is %s', NODE);

var run = function(args, done) {
  /* eslint no-sync:0 no-console:0 */
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
  describe('config', function() {
    it('should use the right directory', function() {
      assert.equal(mvm.config.cache, path.join(__dirname, '.versions'));
    });
  });
  describe('functional', function() {
    function bin(name, platform) {
      if (platform !== 'windows') {
        return name;
      }
      return name + '.exe';
    }
    var downloadedSuccessfully = function(version, platform, done) {
      var dest = path.join(
        mvm.config.cache,
        ['mongodb', version, platform, '64'].join('-'),
        'bin',
        bin('mongod', platform)
      );

      fs.exists(dest, function(exists) {
        assert(exists, dest + ' does not exist');
        done();
      });
    };

    var use = function(version, platform, done) {
      mvm.use({
        version: version,
        platform: platform
      }, function(err) {
        if (err) {
          return done(err);
        }
        downloadedSuccessfully(version, platform, done);
      });
    };

    var inPATH = function() {
      var dest = mvm.config.CURRENT_BIN_DIRECTORY;
      if (process.env.PATH.split(path.delimiter).indexOf(dest) === -1) {
        console.log('`%s` not in PATH: ', dest, JSON.stringify(process.env.PATH.split(path.delimiter), null, 2));
      }
      assert(process.env.PATH.split(path.delimiter).indexOf(dest) !== -1);
    };

    var shouldHaveCurrent = function(version, platform, done) {
      if (platform === 'windows') {
        process.env.PATHEXT = '.exe';
      }
      mvm.current(function(err, v) {
        if (platform === 'windows') {
          process.env.PATHEXT = undefined;
        }
        if (err) {
          return done(err);
        }
        assert.equal(version, v);
        done();
      });
    };

    var shouldHaveExecutable = function(name, version, platform, done) {
      var dest = path.join(
        mvm.config.cache,
        ['mongodb', version, platform, '64'].join('-'),
        'bin',
        bin(name, platform)
      );

      fs.exists(dest, function(exists) {
        if (!exists) {
          return done(new Error('File does not exist at ' + dest));
        }
        done();
      // @todo (imlucas): Ensure `which` returns the right path.
      // var symlink = path.join(
      //   mvm.config.cache,
      //   ['mongodb', 'current'].join('-'),
      //   'bin',
      //   bin(name, platform)
      // );
      // if (platform === 'windows') {
      //   process.env.PATHEXT = '.exe';
      // }
      //
      // which(name, {
      //   all: true
      // }, function(_err, res) {
      //   if (platform === 'windows') {
      //     process.env.PATHEXT = undefined;
      //   }
      //   if (_err) return done(_err);
      //
      //   assert.equal(res[0], symlink);
      //   done();
      // });
      });
    };

    // afterEach(function(done) {
    //   fs.remove(mvm.config.cache, done);
    // });
    describe('osx', function() {
      it('should install 2.6.11 #slow', function(done) {
        this.slow(25000);
        use('2.6.11', 'osx', done);
      });
      it('should have current symlink in $PATH', function() {
        inPATH('current', 'osx');
      });
      it('should symlink 2.6.11 as current', function(done) {
        if (process.platform !== 'darwin') {
          this.skip();
          return;
        }
        shouldHaveCurrent('2.6.11', 'osx', done);
      });
      it('should have an executable shell binary', function(done) {
        shouldHaveExecutable('mongo', '2.6.11', 'osx', done);
      });
      it('should have an executable store binary', function(done) {
        shouldHaveExecutable('mongod', '2.6.11', 'osx', done);
      });
      it('should have an executable router binary', function(done) {
        shouldHaveExecutable('mongos', '2.6.11', 'osx', done);
      });
    });
    describe('linux', function() {
      it('should install 2.6.11 #slow', function(done) {
        this.slow(25000);
        use('2.6.11', 'linux', done);
      });
      it('should have current symlink in $PATH', function() {
        inPATH('current', 'linux');
      });
      it('should symlink 2.6.11 as current', function(done) {
        if (process.platform !== 'linux') {
          this.skip();
          return;
        }
        shouldHaveCurrent('2.6.11', 'linux', done);
      });
      it('should have an executable shell binary', function(done) {
        shouldHaveExecutable('mongo', '2.6.11', 'linux', done);
      });
      it('should have an executable store binary', function(done) {
        shouldHaveExecutable('mongod', '2.6.11', 'linux', done);
      });
      it('should have an executable router binary', function(done) {
        shouldHaveExecutable('mongos', '2.6.11', 'linux', done);
      });
    });
    describe('windows', function() {
      it('should install 2.6.11 [#15] #slow', function(done) {
        this.slow(25000);
        use('2.6.11', 'windows', done);
      });
      it('should have current symlink in $PATH', function() {
        inPATH('current', 'windows');
      });
      it('should symlink 2.6.11 as current', function(done) {
        if (process.platform !== 'win32') {
          this.skip();
          return;
        }
        shouldHaveCurrent('2.6.11', 'windows', done);
      });
      it('should have an executable shell binary', function(done) {
        shouldHaveExecutable('mongo', '2.6.11', 'windows', done);
      });
      it('should have an executable store binary', function(done) {
        shouldHaveExecutable('mongod', '2.6.11', 'windows', done);
      });
      it('should have an executable router binary', function(done) {
        shouldHaveExecutable('mongos', '2.6.11', 'windows', done);
      });
    });

    describe('enterprise', function() {
      it('should install 2.6.11 enterprise');
      it('should install have 2.6.11 and a separate 2.6.11 enterprise');
    });
    describe('debug', function() {
      it('should install 2.6.11 debug');
      it('should install have 2.6.11 and a separate 2.6.11 debug');
    });
  });
});
