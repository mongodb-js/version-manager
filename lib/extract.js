var fs = require('fs-extra');
var zlib = require('zlib');
var unzip = require('unzip');
var tar = require('tar');
var createCleanupCrew = require('./cleanup');
var path = require('./path');
var tildify = require('tildify');
var debug = require('debug')('mvm::extract');

/* eslint no-sync:0, new-cap:0 */
module.exports = function extract(pkg, fn) {
  var archive = path.artifact(pkg);
  var dest = path.dest(pkg);
  var cleanup = createCleanupCrew('remove incomplete extraction', function() {
    fs.removeSync(dest);
    debug('removed %s', tildify(dest));

    fs.removeSync(archive);
    debug('removed bad archive %s', tildify(archive));
  });

  fs.exists(dest, function(exists) {
    if (exists) {
      debug('already extracted %s', tildify(dest));
      cleanup.clear();
      return fn(null, dest);
    }

    debug('reading %s', tildify(archive));
    var input = fs.createReadStream(archive);
    var extractor;

    if (archive.indexOf('zip') > -1) {
      extractor = unzip.Extract({
        path: dest
      });
      input.pipe(extractor);
    } else {
      var ungzip = zlib.createGunzip();
      extractor = tar.Extract({
        path: dest,
        strip: 1
      });

      input.pipe(ungzip);
      ungzip.on('finished', function() {
        debug('ungzipped');
      });

      debug('untar-ing....');
      ungzip.pipe(extractor);
    }

    extractor.on('error', function(err) {
      console.error(err);
    });
    var onEnd = function() {
      debug('created %s', tildify(dest));
      cleanup.clear();
      extractor.removeListener('readable', onClose);
      fn(null, dest);
    };
    var onClose = function() {
      debug('created %s', tildify(dest));
      cleanup.clear();
      extractor.removeListener('readable', onEnd);
      fn(null, dest);
    };
    extractor.once('end', onEnd).once('close', onClose);

  });
};
