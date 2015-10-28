var fs = require('fs-extra');
var zlib = require('zlib');
var tar = require('tar');
var path = require('path');
var unzip = require('unzip');
var tildify = require('tildify');
var debug = require('debug')('mongodb-version-manager::extract');

function unzipWrapper(model, done) {
  var extractor = new unzip.Extract({
    path: model.download_directory
  });
  var src = fs.createReadStream(model.download_path);

  var tmp = path.join(model.download_directory,
    model.filename.replace('.zip', ''));
  var onSuccess = function() {
    debug('unzipped to `%s`', tildify(tmp));

    debug('relocating to `%s`', tildify(model.root_directory));
    fs.move(tmp, model.root_directory, function(err) {
      if (err) {
        debug('move failed', err);
        done(err);
        return;
      }
      done();
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

function untar(model, done) {
  var ungzip = zlib.createGunzip();
  var extractor = new tar.Extract({
    path: model.root_directory,
    strip: 1
  });

  var onSuccess = function() {
    debug('created %s', tildify(model.root_directory));
    done();
  };

  fs.createReadStream(model.download_path).pipe(ungzip);
  debug('untar-ing....');
  ungzip.pipe(extractor);
  extractor.on('end', onSuccess);
  extractor.on('error', function(err) {
    extractor.removeListener('end', onSuccess);
    done(err);
  });
}

module.exports = function extract(model, done) {
  var onError = function(err) {
    fs.remove(model.root_directory, function() {
      debug('removed `%s`', tildify(model.root_directory));

      fs.remove(model.download_path, function() {
        debug('removed archive `%s`', tildify(model.download_path));
        done(err);
      });
    });
  };

  fs.exists(model.root_directory, function(exists) {
    if (exists) {
      debug('already extracted %s', tildify(model.root_directory));
      return done();
    }

    var transform = model.filename.indexOf('zip') > -1 ? unzipWrapper : untar;
    transform(model, function(err) {
      if (err) {
        return onError(err);
      }
      done();
    });
  });
};
