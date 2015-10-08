var path = require('./path');
var fs = require('fs-extra');
var tildify = require('tildify');
var async = require('async');
var delimiter = require('path').delimiter;
var debug = require('debug')('mongodb-version-manager:activate');

/**
 * Make sure the bin directory for the current version
 * is in `$PATH`.
 * @param {String} directory
 *
 * @todo (imlucas): :axe: env helper from `mongodb-js/mj`
 * and use it here.
 */
function addToPath(directory) {
  if (process.env.PATH.indexOf(directory) === -1) {
    process.env.PATH = [directory, process.env.PATH].join(delimiter);
    debug('added `%s` to $PATH', tildify(directory));
  }
}

module.exports = function(pkg, done) {
  addToPath(path.join(path.current(pkg), 'bin'));

  async.series([function(cb) {
    debug('removing old symlink if it exists...');
    fs.remove(path.current(pkg), function() {
      cb();
    });
  }, function(cb) {
    debug('symlinking `%s` -> `%s`...', path.dest(pkg), path.current(pkg));
    fs.symlink(path.dest(pkg), path.current(pkg), cb);
  }
  ], done);
};

module.exports.addToPath = addToPath;
