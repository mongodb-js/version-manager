var async = require('async');
var chalk = require('chalk');
var fs = require('fs-extra');
var tildify = require('tildify');
var figures = require('figures');
var dl = require('download');
var debug = require('debug')('mongodb-version-manager:download');

function download(model, done) {
  debug('downloading artifact from `%s` to `%s`...',
    model.url, tildify(model.download_path));

  var quiet = process.env.silent;
  var options = {
    extract: true
  };
  dl(model.url, model.download_directory, options).then(function() {
    debug('successfully downloaded MongoDB version v%s to %s',
      model.version, model.download_path);
    if (!quiet) {
      console.log(chalk.bold.green(figures.tick),
        ' Downloaded MongoDB', model.version);
    }
    done();
  })
  .catch(function(err) {
    debug('error downloading!', err);

    debug('removing incomplete artifact from `%s`',
      model.download_path);

    fs.unlink(model.download_path, function() {
      done(err);
    });
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
