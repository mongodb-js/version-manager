var os = require('os');
var PLATFORM = os.platform() === 'darwin' ? 'osx' : os.platform();
var ARCH = os.arch() === 'x64' ? 'x86_64' : os.arch();
var versions = require('./versions');
var semver = require('semver');
var request = require('request');
var async = require('async');
var defaults = require('lodash.defaults');
var debug = require('debug')('mongodb-version-manager:resolve');

function mci(opts, fn) {
  if (!opts.distro) {
    return fn(new Error('Missing required parameter `distro`'));
  }
  var url = 'http://mci-motu.10gen.cc:9090/rest/v1/projects/mongodb-mongo-'
    + opts.branch + '/revisions/' + opts.version;
  debug('resolving version via MCI `%s`', url);
  request.get({
    url: url,
    json: true
  }, function(err, res, body) {
    if (err) return fn(err);

    if (res.statusCode === 404) return fn(new Error(body.message));
    debug('got body', body);
    var dl = 'https://s3.amazonaws.com/mciuploads/mongodb-mongo-' + opts.branch
      + '/' + opts.distro + '/' + opts.version + '/binaries';

    var s = 'mongodb_mongo_' + opts.branch + '_' + opts.distro;
    var basename = body.builds.filter(function(b) {
      return b.indexOf(s) > -1;
    })[0];

    // @todo: test across all distros as I believe this may be different for some.
    basename = 'binaries-' + basename;
    fn(null, {
      name: 'mongodb',
      version: opts.version,
      artifact: basename + opts.ext,
      url: dl + '/' + basename + opts.ext
    });
  });
}

function search(query, fn) {
  versions(function(err, res) {
    if (err) return fn(err);

    var found = false;
    for (var i = 0; i < res.length; i++) {
      if (!found && semver.satisfies(res[i].version, query.version)) {
        found = true;
        fn(null, res[i].version);
      }
    }
    if (!found) {
      fn(new Error('No matches'));
    }
  });
}

function latest(fn) {
  versions(function(err, res) {
    if (err) return fn(err);
    fn(null, res[0].version);
  });
}

function stable(fn) {
  versions(function(err, res) {
    if (err) return fn(err);

    fn(null, res.filter(function(v) {
      return v.prerelease.length === 0 && v.minor % 2 === 0;
    }).map(function(v) {
      return v.version;
    })[0]);
  });
}

module.exports = function(opts, fn) {
  if (Array.isArray(opts)) {
    var tasks = {};

    opts.map(function(opt) {
      tasks[opt.version] = module.exports.bind(null, opt);
    });

    return async.parallel(tasks, fn);
  }

  if (typeof opts === 'string') {
    opts = {
      version: opts
    };
  }
  var handler = versions;

  defaults(opts, {
    arch: ARCH,
    platform: PLATFORM,
    branch: 'master',
    bits: '64',
    debug: false
  });

  // 64bit -> 64
  opts.bits = opts.bits.replace(/[^0-9]/g, '');

  if (opts.platform === 'darwin') {
    opts.platform = 'osx';
  }
  if (opts.platform === 'windows') {
    opts.platform = 'win32';
  }

  opts.ext = opts.platform === 'win32' ? '.zip' : '.tgz';
  // @todo: get list of distros from mci and make sure passed in is valid.
  opts.distro = opts.distro || null;

  if (opts.version.length === 40) {
    // A commit hash
    return mci(opts, fn);
  }

  if (opts.version === 'latest' || opts.version === 'unstable') {
    handler = latest;
  } else if (opts.version === 'stable') {
    handler = stable;
  } else {
    handler = search.bind(null, opts);
  }

  handler(function(err, v) {
    if (err) return fn(err);

    var basename = 'mongodb-' + opts.platform + '-' + opts.arch
      + (opts.debug ? '-debugsymbols' : '') + '-' + v;
    var pkg = {
      name: 'mongodb',
      version: v,
      artifact: basename + opts.ext,
      url: 'http://fastdl.mongodb.org/' + opts.platform + '/' + basename + opts.ext
    };

    fn(null, pkg);
  });
};
