var path = require('path');
var untildify = require('untildify');

module.exports = {};

var dest = untildify(process.env.MONGODB_VERSIONS || '~/.mongodb/versions');
module.exports.cache = path.resolve(dest);

// expire versions cache page every hour
module.exports.expire = 60 * 60 * 1000;
