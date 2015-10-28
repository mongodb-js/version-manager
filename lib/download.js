var async = require('async');
var chalk = require('chalk');
var fs = require('fs-extra');
var request = require('request');
var tildify = require('tildify');
var ProgressBar = require('progress');
var figures = require('figures');
var format = require('util').format;
var debug = require('debug')('mongodb-version-manager:download');

function progressbar(pkg, res, totalSize) {
  var bar = new ProgressBar('  Downloading MongoDB v'
    + pkg.version + ' [:bar] :percent :etasec', {
      complete: '=',
      incomplete: ' ',
      width: 40,
      total: totalSize
    });

  res.on('data', function(chunk) {
    bar.tick(chunk.length);
  });
}

function download(model, done) {
  debug('downloading artifact from `%s` to `%s`...',
    model.url, tildify(model.download_path));

  var out = fs.createWriteStream(model.download_path);
  var onFinish;
  var onError = function(err) {
    out.removeListener('finish', onFinish);
    debug('removing incomplete artifact from `%s`',
      model.download_path);
    fs.unlink(model.download_path, function() {
      done(err);
    });
  };

  onFinish = function() {
    /* eslint no-console:0 */
    out.removeListener('error', onError);
    debug('successfully downloaded MongoDB version v%s to %s',
      model.version, model.download_path);
    if (!process.env.silent) {
      console.log(chalk.bold.green(figures.tick),
        ' Downloaded MongoDB', model.version);
    }
    done();
  };
  out.once('error', onError).once('finish', onFinish);

  var req = request(model.url);
  req.on('response', function(res) {
    var totalSize = parseInt(res.headers['content-length'], 10);
    debug('total size %dMB', (totalSize / 1024 / 1024).toFixed(2));

    if (!totalSize || totalSize < 10 * 1024 * 1024) {
      var msg = format('Download looks too small! %s is only %s bytes!',
        model.url, totalSize);
      return onError(new Error(msg));
    }

    if (process.env.silent) {
      debug('Downloading `%s`...', model.url);
    } else if (!process.env.CI) {
      progressbar(model, res, totalSize);
    } else {
      console.log('Downloading `%s`...', model.url);
    }
  });
  req.pipe(out);
  req.on('error', function(err) {
    onError(err);
  });
}

module.exports = function(model, done) {
  debug('downloading', model.serialize({
    props: true,
    derived: true
  }));
  async.series([
    fs.mkdirs.bind(null, model.download_directory),
    fs.exists.bind(null, model.download_path),
    download.bind(null, model)
  ], function(err) {
    if (err === true) {
      debug('already have artifact at `%s`', model.download_path);
      return done();
    }
    if (err) {
      return done(err);
    }
    done();
  });
};
