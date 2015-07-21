var path = require('path');
var untildify = require('untildify');

module.exports = {};
module.exports.cache = path.resolve(untildify(process.env.MONGODB_VERSIONS || '~/.mongodb/versions'));

// expire versions cache page every hour
module.exports.expire = 60 * 60 * 1000;
