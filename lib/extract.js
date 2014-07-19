var fs = require('fs-extra'),
  zlib = require('zlib'),
  tar = require('tar'),
  debug = require('debug')('mvm::extract'),
  createCleanupCrew = require('./cleanup'),
  config = require('./config'),
  path = require('./path');

module.exports = function extract(pkg, fn){
  var tarball = path.artifact(pkg),
    dest = path.dest(pkg),
    cleanup = createCleanupCrew('remove incomplete untar', function(){
      fs.removeSync(dest);
      debug('removed', dest);
    });

  fs.exists(dest, function(exists){
    if(exists){
      debug('already extracted', dest);
      cleanup.clear();
      return fn(null, dest);
    }

    debug('reading ' + tarball);
    var input = fs.createReadStream(tarball),
      ungzip = zlib.createGunzip(),
      extractor = tar.Extract({path: dest, strip: 1});

    extractor.on('end', function(){
      ended = true;
      debug('created', dest, arguments);
      cleanup.clear();
      fn(null, dest);
    });

    input.pipe(ungzip);
    ungzip.on('finished', function(){
      debug('ungzipped');
    });

    debug('untar-ing....');
    ungzip.pipe(extractor);
  });
};
