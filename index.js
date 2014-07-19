var async = require('async'),
  which = require('which'),
  windows = require('os').platform() === 'win32',
  exec = require('child_process').exec,
  resolve = require('./lib').resolve,
  path = require('./lib').path,
  activate = require('./lib').activate,
  download = require('./lib').download,
  extract = require('./lib').extract,
  versions = require('./lib').versions,
  fs = require('fs-extra'),
  debug = require('debug')('mvm');

var VERSION = /[0-9]+\.[0-9]+\.[0-9]+([-_\.][a-zA-Z0-9]+)?/;

var bin = path.resolve(path.current({name: 'mongodb'}) + '/bin');
if(process.env.PATH.indexOf(bin) === -1){
  process.env.PATH = bin + ':' + process.env.PATH;
}

module.exports.path = function(fn){
  fn(null, path.resolve(path.current({name: 'mongodb'}) + '/bin'));
};

module.exports.installed = function(fn){
  fs.readdir(path.base({name: 'mongodb'}), function(err, files){
    if(err) return fn(err);
    fn(null, files.filter(function(f){
      return VERSION.test(f);
    }));
  });
};

module.exports.resolve = function(s, fn){
  resolve({version: s}, fn);
};

module.exports.versions = function(fn){
  versions(function(err, res){
    if(err) return fn(err);

    fn(null, res.map(function(v){
      return v.version;
    }));
  });
};

module.exports.kill = function(fn){
  async.parallel(['mongod', 'mongo', 'mongos'].map(function(name){
    var cmd = (windows) ? 'taskkill /F /IM '+name+'.exe' : 'killall -9 ' + name;
    return function(cb){
      exec(cmd, function(){
        cb();
      });
    };
  }), fn);
};

module.exports.is = function(s, fn){
  var semver = require('semver');
  module.exports.current(function(err, v){
    fn(null, semver.satisfies(v, s));
  });
};

module.exports.current = function(fn){
  exec(which.sync('mongod') +' --version', function(err, stdout){
    if(err) return fn(err);
    fn(null, VERSION.exec(stdout.toString('utf-8'))[0]);
  });
};

module.exports.install = function(version, fn){
  resolve({version: version}, function(err, pkg){
    async.series([download.bind(null, pkg), extract.bind(null, pkg)], fn);
  });
};

module.exports.use = function(version, fn){
  resolve({version: version}, function(err, pkg){
    module.exports.current(function(err, v){
      if(pkg.version === v){
        console.log('already using ' + v);
        return fn();
      }
      async.series([
        download.bind(null, pkg),
        extract.bind(null, pkg),
        activate.bind(null, pkg)
      ], fn);
    });
  });
};
