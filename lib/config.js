var path = require('path'),
  untildify = require('untildify');

module.exports = {};
module.exports.cache = path.resolve(untildify((process.env.MONGODB_VERSIONS || '~/.mongodb/versions')));
