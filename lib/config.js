var path = require('path');
var fs = require('fs');
var untildify = require('untildify');
var pkg = require('../package.json');

module.exports = {};

var pkgDirectory = path.join(process.cwd(), 'node_modules', pkg.name);

/* eslint no-sync:0 */
var isLocal = fs.existsSync(pkgDirectory);

// We're installed globally so keep artifacts at the user level.
var versionsDirectory = untildify('~/.mongodb/versions');

if (process.env.MONGODB_VERSIONS) {
  versionsDirectory = untildify(process.env.MONGODB_VERSIONS);
} else if (process.cwd() === __dirname) {
  versionsDirectory = path.join(__dirname, '.mongodb', 'versions');
} else if (isLocal) {
  // We're probably a devDependency so keep client builds local
  // which is great for taking advantage of Travis and Evergreen
  // directory caching between builds.
  versionsDirectory = path.join(pkgDirectory, '.mongodb', 'versions');
}

module.exports.cache = path.resolve(versionsDirectory);

// expire versions cache page every hour
module.exports.expire = 60 * 60 * 1000;
