var path = require('path'),
  untildify = require('untildify');

module.exports = {};
module.exports.cache = path.resolve(untildify((process.env.CI_CACHE || '~/.mongoscope-ci')));
