var path = require('path');
var untildify = require('untildify');

module.exports = {};
module.exports.cache = path.resolve(untildify(process.env.MONGODB_VERSIONS || '~/.mongodb/versions'));

// expire versions cache page every 24 hours
module.exports.expire = 24 * 60 * 60 * 1000;
