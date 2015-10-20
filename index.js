var async = require('async');
var which = require('which');
var exec = require('child_process').exec;
var fs = require('fs-extra');
var resolve = require('mongodb-download-url');
var versions = require('mongodb-version-list');
var semver = require('semver');
var defaults = require('lodash.defaults');
var path = require('./lib/path');
var config = require('./lib/config');
var activate = require('./lib/activate');
var download = require('./lib/download');
var extract = require('./lib/extract');
var debug = require('debug')('mongodb-version-manager');

var VERSION = /[0-9]+\.[0-9]+\.[0-9]+([-_\.][a-zA-Z0-9]+)?/;

activate.addToPath(path.join(path.current(), 'bin'));

module.exports = function(opts, fn) {
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  } else if (typeof opts === 'string') {
    opts = {
      version: opts
    };
  }
  opts.version = opts.version || process.env.MONGODB_VERSION;

  module.exports.use(opts, fn);
};

module.exports.config = config;
module.exports.path = function(fn) {
  fn(null, path.join(path.current({
    name: 'mongodb'
  }), 'bin'));
};

module.exports.installed = function(fn) {
  fs.readdir(path.base({
    name: 'mongodb'
  }), function(err, files) {
    files = files || [];
    if (err) return fn(null, files);

    fn(null, files.filter(function(f) {
      return VERSION.test(f);
    }));
  });
};

module.exports.resolve = resolve;

module.exports.available = function(opts, fn) {
  opts = defaults(opts || {}, {
    stable: false,
    unstable: false,
    rc: false
  });

  debug('options for avilable', opts);
  versions(function(err, res) {
    if (err) return fn(err);
    res = res.map(function(v) {
      return semver.parse(v);
    })
      .filter(function(v) {
        v.stable = v.minor % 2 === 0;
        v.unstable = !v.stable;
        v.rc = v.prerelease.length > 0;

        if (!opts.rc && v.rc) return false;
        if (!opts.stable && v.stable) return false;
        if (!opts.unstable && v.unstable) return false;
        return true;
      })
      .map(function(v) {
        return v.version;
      });
    fn(null, res);
  });
};

module.exports.is = function(s, done) {
  module.exports.current(function(err, v) {
    if (err) return done(err);

    done(null, semver.satisfies(v, s));
  });
};

module.exports.current = function(fn) {
  which('mongod', function(err, mongodBin) {
    /* eslint no-shadow:0 */
    if (err || !mongodBin) {
      return fn(null);
    }
    exec(mongodBin + ' --version', function(err, stdout) {
      if (err) return fn(err);

      var shellVersion = stdout
        .toString('utf-8')
        .split('\n')[0]
        .split(',')[0]
        .replace('db version v', '');

      fn(null, shellVersion);
    });
  });
};

module.exports.install = function(version, done) {
  resolve({
    version: version
  }, function(err, pkg) {
    if (err) return done(err);

    async.series([download.bind(null, pkg), extract.bind(null, pkg)], done);
  });
};

module.exports.use = function(opts, done) {
  resolve(opts, function(err, pkg) {
    if (err) return done(err);

    module.exports.current(function(err, v) {
      if (err) return done(err);

      if (pkg.version === v) {
        debug('already using ' + v);
        return done(null, pkg);
      }
      async.series([
        download.bind(null, pkg),
        extract.bind(null, pkg),
        activate.bind(null, pkg)
      ], function(err) {
        if (err) return done(err);
        return done(null, pkg);
      });
    });
  });
};
