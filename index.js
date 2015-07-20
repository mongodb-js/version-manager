var async = require('async'),
  which = require('which'),
  windows = require('os').platform() === 'win32',
  exec = require('child_process').exec,
  fs = require('fs-extra'),
  resolve = require('./lib/resolve'),
  path = require('./lib/path'),
  config = require('./lib/config'),
  activate = require('./lib/activate'),
  download = require('./lib/download'),
  extract = require('./lib/extract'),
  versions = require('./lib/versions'),
  semver = require('semver'),
  debug = require('debug')('mongodb-version-manager'),
  _ = require('underscore');

var VERSION = /[0-9]+\.[0-9]+\.[0-9]+([-_\.][a-zA-Z0-9]+)?/;

var bin = path.resolve(path.current({
    name: 'mongodb'
  }) + '/bin');
if (process.env.PATH.indexOf(bin) === -1) {
  process.env.PATH = bin + ':' + process.env.PATH;
}

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
  fn(null, path.resolve(path.current({
      name: 'mongodb'
    }) + '/bin'));
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

module.exports.resolve = function(opts, fn) {
  resolve(opts, fn);
};

module.exports.is = function(s, fn) {
  module.exports.current(function(err, v) {
    fn(null, semver.satisfies(v, s));
  });
};

module.exports.available = function(opts, fn) {
  opts = _.defaults(opts || {}, {
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

module.exports.is = function(s, fn) {
  module.exports.current(function(err, v) {
    fn(null, semver.satisfies(v, s));
  });
};

module.exports.current = function(fn) {
  which('mongod', function(err, mongod_bin) {
    if (err || !mongod_bin) {
      return fn(null);
    }
    exec(mongod_bin + ' --version', function(err, stdout) {
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

module.exports.install = function(version, fn) {
  resolve({
    version: version
  }, function(err, pkg) {
    async.series([download.bind(null, pkg), extract.bind(null, pkg)], fn);
  });
};

module.exports.use = function(opts, fn) {
  if (!opts.version) {
    var existing = which.sync('mongod');
    debug('noop. using existing mongo install at %s', existing);
    return process.nextTick(function() {
      fn(null, null);
    });
  }

  resolve(opts, function(err, pkg) {
    module.exports.current(function(err, v) {
      if (pkg.version === v) {
        debug('already using ' + v);
        return fn();
      }
      async.series([
        download.bind(null, pkg),
        extract.bind(null, pkg),
        activate.bind(null, pkg)
      ], function(err) {
        if (err) return fn(err);
        return fn(null, pkg);
      });
    });
  });
};
