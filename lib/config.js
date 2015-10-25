var path = require('path');
var fs = require('fs');
var untildify = require('untildify');

module.exports = {};

var dest;
var modulePath = path.join(process.cwd(), 'node_modules', 'mongodb-version-manager');
if (process.env.MONGODB_VERSIONS) {
  dest = untildify(process.env.MONGODB_VERSIONS);
} else {
  try {
    /* eslint no-sync:0 */
    var isLocal = fs.statSync(modulePath).isDirectory();
    if (isLocal) {
      dest = path.join(modulePath, '.mongodb');
    } else {
      dest = untildify('~/.mongodb/versions');
    }
  } catch (err) {
    dest = untildify('~/.mongodb/versions');
  }
}

module.exports.cache = path.resolve(dest);

// expire versions cache page every hour
module.exports.expire = 60 * 60 * 1000;
