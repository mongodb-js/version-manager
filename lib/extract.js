var fs = require('fs-extra'),
  zlib = require('zlib'),
  tar = require('tar'),
  createCleanupCrew = require('./cleanup'),
  path = require('./path'),
  tildify = require('tildify'),
  debug = require('debug')('mvm::extract');

module.exports = function extract(pkg, fn){
  var tarball = path.artifact(pkg),
    dest = path.dest(pkg),
    cleanup = createCleanupCrew('remove incomplete extraction', function(){
      fs.removeSync(dest);
      debug('removed %s', tildify(dest));

      fs.removeSync(tarball);
      debug('removed bad tarball %s', tildify(tarball));
    });

  fs.exists(dest, function(exists){
    if(exists){
      debug('already extracted %s', tildify(dest));
      cleanup.clear();
      return fn(null, dest);
    }

    debug('reading %s', tildify(tarball));
    var input = fs.createReadStream(tarball),
      ungzip = zlib.createGunzip(),
      extractor = tar.Extract({path: dest, strip: 1});

    extractor.on('end', function(){
      debug('created %s', tildify(dest));
      cleanup.clear();
      fn(null, dest);
    });

    input.pipe(ungzip);
    ungzip.on('finished', function(){
      debug('ungzipped');
    });

    extractor.on('error', function(err){
      console.error(err);
    });

    debug('untar-ing....');
    ungzip.pipe(extractor);
  });
};
