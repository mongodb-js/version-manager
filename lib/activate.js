var debug = require('debug')('mvm:activate'),
  path = require('./path'),
  fs = require('fs-extra'),
  tildify = require('tildify');

module.exports = function(pkg, fn){
  var bin = path.resolve(path.current(pkg) + '/bin');

  if(process.env.PATH.indexOf(bin) === -1){
    process.env.PATH = bin + ':' + process.env.PATH;
    debug('added to PATH %s', tildify(bin));
  }

  fs.remove(path.current(pkg), function(){
    fs.symlink(path.dest(pkg), path.current(pkg), function(err){
      if(err) return fn(err);
      debug('symlinked %s -> %s', tildify(path.current(pkg)), tildify(path.dest(pkg)));
      fn();
    });
  });
};
