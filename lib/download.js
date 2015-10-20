var chalk = require('chalk');
var fs = require('fs-extra');
var request = require('request');
var tildify = require('tildify');
var ProgressBar = require('progress');
var figures = require('figures');
var format = require('util').format;
var path = require('./path');
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

// @todo (kangas): Needs cleanup
module.exports = function(pkg, fn) {
  var dest = path.artifact(pkg);
  var url = pkg.url;
  var version = pkg.version;

  fs.mkdirs(path.artifacts(), function(err) {
    /* eslint no-console:0, no-shadow:0 */
    if (err) {
      return fn(err);
    }

    fs.exists(dest, function(exists) {
      if (exists) {
        debug('already have artifact at `%s`', dest);
        return fn();
      }

      debug('downloading artifact from `%s` to `%s`...', url, tildify(dest));

      var out = fs.createWriteStream(dest);
      var onFinish;
      var onError = function(err) {
        out.removeListener('finish', onFinish);
        debug('removing incomplete artifact from `%s`', dest);
        fs.unlink(dest, function() {
          fn(err);
        });
      };

      onFinish = function() {
        out.removeListener('error', onError);
        console.log(chalk.bold.green(figures.tick),
          ' Downloaded MongoDB', version);
        fn(null, dest);
      };
      out.once('error', onError).once('finish', onFinish);

      var req = request(url);
      req.on('response', function(res) {
        var totalSize = parseInt(res.headers['content-length'], 10);
        debug('total size %dMB', (totalSize / 1024 / 1024).toFixed(2));

        if (!totalSize || totalSize < 10 * 1024 * 1024) {
          var msg = format('Download looks too small! %s is only %s bytes!',
            url, totalSize);
          return onError(new Error(msg));
        }
        if (!process.env.CI) {
          progressbar(pkg, res, totalSize);
        } else {
          console.log('Downloading `%s`...', url);
        }
      });
      req.pipe(out);
      req.on('error', function(err) {
        onError(err);
      });
    });
  });
};
