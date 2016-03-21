var async = require('async');
var chalk = require('chalk');
var fs = require('fs-extra');
var tildify = require('tildify');
var figures = require('figures');
var debug = require('debug')('mongodb-version-manager:download');
var nugget = require('nugget');

function download(model, done) {
  debug('downloading artifact from `%s` to `%s`...',
    model.url, tildify(model.download_path));

  var quiet = process.env.silent;
  var verbose = process.env.VERBOSE;
  var nuggetOpts = {target: model.filename, dir: model.download_directory, resume: true, verbose: verbose, quiet: quiet};
  nugget(model.url, nuggetOpts, function(errors) {
    if (errors) {
      var error = errors[0]; // nugget returns an array of errors but we only need 1st because we only have 1 url
      debug('removing incomplete artifact from `%s`',
        model.download_path);
      fs.unlink(model.download_path, function() {
        done(error);
      });
      return;
    }
    debug('successfully downloaded MongoDB version v%s to %s',
      model.version, model.download_path);
    if (!process.env.silent) {
      console.log(chalk.bold.green(figures.tick),
        ' Downloaded MongoDB', model.version);
    }
    done();
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
