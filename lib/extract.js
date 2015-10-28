var fs = require('fs-extra');
var zlib = require('zlib');
var tar = require('tar');
var unzip = require('unzip');
var path = require('./path');
var tildify = require('tildify');
var async = require('async');
var isExecutable = require('./is-executable');
var debug = require('debug')('mongodb-version-manager::extract');

function chmod(pkg, src, dest, done) {
  var bins = {};
  fs.walk(path.join(dest, 'bin'))
    .on('data', function(item) {
      if (!item.stats.isFile()) {
        return;
      }
      bins[item.path] = item.stats;
    })
    .on('end', function() {
      var opts = {};
      if (pkg.artifact.indexOf('.zip') > -1) {
        opts.platform = 'windows';
      }

      var tasks = Object.keys(bins).map(function(k) {
        return function(cb) {
          isExecutable(bins[k], function(err, yep) {
            if (err) {
              return cb(err);
            }

            if (yep) {
              return cb();
            }

            debug('making `%s` executable', src);
            fs.chmod(src, 755, cb);
          });
        };
      });

      async.parallel(tasks, done);
    });
}

function unzipWrapper(pkg, src, dest, done) {
  var extractor = new unzip.Extract({
    path: path.base(pkg)
  });

  var tmp = path.join(path.base(pkg), pkg.artifact.replace('.zip', ''));

  var onSuccess = function() {
    debug('unzipped to `%s`', tildify(tmp));

    debug('relocating to `%s`', tildify(dest));
    fs.move(tmp, dest, function(err) {
      if (err) {
        debug('move failed', err);
        done(err);
        return;
      }
      done(null, dest);
    });
  };

  src.pipe(extractor);
  extractor.once('close', onSuccess);
  extractor.once('error', function(err) {
    debug('unzip error', err);
    extractor.removeListener('close', onSuccess);
    done(err);
  });
}

function untar(pkg, src, dest, done) {
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
    transform(pkg, src, dest, function(err) {
      if (err) {
        return onError(err);
      }
      chmod(pkg, src, dest, function(chmodErr) {
        if (chmodErr) {
          return onError(chmodErr);
        }
        done(null, dest);
      });
    });
  });
};
