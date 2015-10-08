var path = require('path');
var fs = require('fs');
var untildify = require('untildify');

module.exports = {};

var dest;
var module_path = path.join(process.cwd(), 'node_modules', 'mongodb-version-manager');
if (process.env.MONGODB_VERSIONS) {
  dest = untildify(process.env.MONGODB_VERSIONS);
} else {
  try {
    /* eslint no-sync:0 */
    isLocal = fs.statSync(module_path).isDirectory();
    if (isLocal) {
      dest = path.join(process.cwd(), '.mongodb');
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
