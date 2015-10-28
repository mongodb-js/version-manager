var fs = require('fs');
var async = require('async');
var Mode = require('stat-mode');

function isExecutable(file, opts, done) {
  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }

  opts.platform = opts.platform || process.platform;

  if (typeof file === 'string') {
    fs.stat(file, function(err, stats) {
      if (err) {
        return done(err);
      }

      isExecutable(stats, opts, done);
    });
    return;
  }

  if (Array.isArray(file)) {
    async.parallel(file.map(function(p) {
      return isExecutable.bind(null, p, opts);
    }), done);
    return;
  }


  if (!(file instanceof fs.Stats)) {
    done(new TypeError('dont know what to do with ' + JSON.stringify(file)));
    return;
  }

  if (!file.isFile()) {
    done(null, false);
    return;
  }

  if (opts.platform.indexOf('win') === 0) {
    done(null, file.toLowerCase().indexOf('.exe') !== -1);
    return;
  }

  var mode = new Mode(file);
  done(null, mode.user.execute || mode.group.execute || mode.others.execute || false);
}

module.exports = isExecutable;
