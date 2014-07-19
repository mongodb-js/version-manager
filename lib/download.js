var debug = require('debug')('mvm:download'),
  path = require('./path'),
  fs = require('fs-extra'),
  request = require('request'),
  config = require('./config'),
  createCleanupCrew = require('./cleanup');

// @todo: how to checksum?
module.exports = function(pkg, fn){
  var dest = path.artifact(pkg),
    url = pkg.url,
    start = Date.now(),
    cleanup = createCleanupCrew('remove incomplete artifact', fs.unlinkSync.bind(null, dest));

  fs.mkdirs(path.artifacts(), function(err){
    if(err) return fn(err);

      fs.exists(dest, function(exists){
        if(exists){
          debug('already have artifact ' + dest);
          cleanup.clear();
          return fn();
        }

        debug('downloading ' + url);
        var out = fs.createWriteStream(dest)
          .on('error', fn)
          .on('finish', function(){
            var secs = Math.round((Date.now() - start)/1000, 2);
            debug('downloaded ' + dest + ' in ' + secs   + ' seconds');
            cleanup.clear();
            fn(null, dest);
          }),
          req = request(url);
        req.pipe(out);
        req.on('error', fn);
      });
  });
}
