var os = require('os'),
  PLATFORM = (os.platform() === 'darwin') ? 'osx' : os.platform(),
  ARCH = (os.arch() === 'x64') ? 'x86_64' : os.arch(),
  versions = require('./versions'),
  semver = require('semver'),
  request = require('request'),
  async = require('async');

module.exports = function(opts, fn){
  if(Array.isArray(opts)){
    var tasks = {};

    opts.map(function(opt){
      tasks[opt.version] = module.exports.bind(null, opt);
    });

    return async.parallel(tasks, fn);
  }

  if(typeof opts === 'string'){
    opts = {version: opts};
  }

  var arch = opts.arch || ARCH,
    platform = opts.platform || PLATFORM,
    handler = versions;

  opts.branch = opts.branch || 'master';
  opts.platform = opts.platform || PLATFORM;
  opts.bits = opts.bits || '64';
  opts.ext = (platform === 'win32' ? '.zip' : '.tgz');
  opts.distro = opts.distro || null;

  if(opts.version === 'latest' || opts.version === 'unstable'){
    handler = latest;
  }
  else if(opts.version === 'stable'){
    handler = stable;
  }
  else if(opts.version.length === 40 || opts.version.length === 8){
    // A commit hash
    return mci(opts, fn);
  }
  else {
    handler = search.bind(null, opts);
  }

  handler(function(err, v){
    var basename = 'mongodb-' + platform+'-' + arch + (opts.debug ? '-debugsymbols' : '') + '-' + v,
      pkg = {
        name: 'mongodb',
        version: v,
        artifact: basename + opts.ext,
        url: 'http://fastdl.mongodb.org/'+platform+'/' + basename + opts.ext
      };

    fn(null, pkg);
  });
};

function mci(opts, fn){
  if(!opts.distro){
    return fn(new Error('Missing required paramater `distro`'));
  }
  var url = 'http://mci-motu.10gen.cc:9090/rest/v1/projects/mongodb-mongo-'+opts.branch+'/revisions/' + opts.version;
  request.get({url: url, json: true}, function(err, res, body){
    if(err) return fn(err);

    if(res.statusCode === 404) return fn(new Error(body.message));

    var dl = 'https://s3.amazonaws.com/mciuploads/mongodb-mongo-' + opts.branch +
      '/'+opts.distro +'/'+opts.version+'/binaries';

    var s = 'mongodb_mongo_' + opts.branch + '_' + opts.distro,
      basename = body.builds.filter(function(b){
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



function search(query, fn){
  versions(function(err, res){
    if(err) return fn(err);

    var found = false;
    for(var i = 0; i < res.length; i++){
      if(!found && semver.satisfies(res[i].version, query.version)){
        found = true;
        fn(null, res[i].version);
      }
    }
    if(!found) fn(new Error('No matches'));
  });
}

function latest(fn){
  versions(function(err, res){
    if(err) return fn(err);
    fn(null, res[0].version);
  });
}

function stable(fn){
  versions(function(err, res){
    if(err) return fn(err);

    fn(null, res.filter(function(v){
      return v.prerelease.length === 0 && (v.minor % 2) === 0;
    }).map(function(v){
      return v.version;
    })[0]);
  });
}
