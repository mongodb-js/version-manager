var fs = require('fs-extra');
var zlib = require('zlib');
var tar = require('tar');
var path = require('./path');
var tildify = require('tildify');
var debug = require('debug')('mongodb-version-manager::extract');

// @todo (kangas): this is broken
function unzipWrapper(src, dest, done) {
  return done(new Error('unzipWrapper not implemented'));

  // var extractor = unzip.Extract({
  //   path: dest
  // });

  // var onSuccess = function() {
  //   debug('unzipped `%s`', tildify(dest));
  //   var full = path.join(dest, nodePath.basename(pkg.artifact, '.zip'));
  //   fs.move(full, dest, function(err) {
  //     if (err) {
  //       return done(err, null);
  //     }
  //     done(null, dest);
  //   });
  // };

  // src.pipe(extractor);
  // extractor.once('close', onSuccess);
  // extractor.once('error', function(err) {
  //   extractor.removeListener('close', onSuccess);
  //   done(err);
  // });
}

function untar(src, dest, done) {
  var ungzip = zlib.createGunzip();
  var extractor = new tar.Extract({
    path: dest,
    strip: 1
  });
  var onSuccess = function() {
    debug('created %s', tildify(dest));
    done(null, dest);
  };
  src.pipe(ungzip);
  debug('untar-ing....');
  ungzip.pipe(extractor);
  extractor.on('end', onSuccess);
  extractor.on('error', function(err) {
    extractor.removeListener('end', onSuccess);
    done(err);
  });
}

module.exports = function extract(pkg, done) {
  var archive = path.artifact(pkg);
  var dest = path.dest(pkg);

  var onError = function(err) {
    fs.remove(dest, function() {
      debug('removed `%s`', tildify(dest));

      fs.remove(archive, function() {
        debug('removed archive `%s`', tildify(archive));
        done(err);
      });
    });
  };

  fs.exists(dest, function(exists) {
    if (exists) {
      debug('already extracted %s', tildify(dest));
      return done(null, dest);
    }

    debug('reading %s', tildify(archive));
    var src = fs.createReadStream(archive);

    var transform = archive.indexOf('zip') > -1 ? unzipWrapper : untar;
    transform(src, dest, function(err) {
      if (err) {
        return onError(err);
      }
      done(null, dest);
    });
  });
};
