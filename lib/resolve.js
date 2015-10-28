var resolve = require('mongodb-download-url');
var Model = require('./model');
var debug = require('debug')('mongodb-version-manager:resolve');

module.exports = function(opts, done) {
  resolve(opts, function(err, res) {
    if (err) {
      return done(err);
    }
    var model = new Model(res);
    debug('resolved', model.serialize({
      props: true,
      derived: true
    }));
    done(null, model);
  });
};
