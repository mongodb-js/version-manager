var os = require('os'),
  PLATFORM = (os.platform() === 'darwin') ? 'osx' : os.platform(),
  ARCH = (os.arch() === 'x64') ? 'x86_64' : os.arch(),
  versions = require('./versions'),
  semver = require('semver');

module.exports = function(opts, fn){
  var arch = opts.arch || ARCH,
    platform = opts.platform || PLATFORM,
    handler = versions;

  if(opts.version === 'latest' || opts.version === 'unstable'){
    handler = latest;
  }
  else if(opts.version === 'stable'){
    handler = stable;
  }
  else {
    handler = search.bind(null, opts);
  }

  handler(function(err, v){
    var basename = 'mongodb-'+platform+'-' + arch+'-'+v,
      pkg = {
        name: 'mongodb',
        version: v,
        artifact: basename+'.tgz',
        url: 'http://fastdl.mongodb.org/'+platform+'/'+basename+'.tgz'
      };

    fn(null, pkg);
  });
};

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
};

function latest(fn){
  versions(function(err, res){
    if(err) return fn(err);
    fn(null, res[0].version);
  });
};

function stable(fn){
  versions(function(err, res){
    if(err) return fn(err);

    fn(null, res.filter(function(v){
      return v.prerelease.length === 0 && (v.minor % 2) === 0;
    }).map(function(v){
      return v.version;
    })[0]);
  });
};
