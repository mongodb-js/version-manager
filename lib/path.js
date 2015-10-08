var path = require('path');
var config = require('./config');

function base(pkg) {
  return path.resolve(config.cache + '/' + pkg.name);
}

function dest(pkg) {
  return path.resolve(base(pkg) + '/' + pkg.version);
}

function artifacts() {
  return path.resolve(config.cache + '/.artifacts');
}

function artifact(pkg) {
  return path.resolve(artifacts(pkg) + '/' + pkg.artifact);
}

function bin(pkg) {
  return path.resolve(dest(pkg) + '/bin');
}

function current(pkg) {
  if (!pkg) {
    pkg = {
      name: 'mongodb'
    };
  }
  return path.resolve(base(pkg) + '/current');
}

module.exports.dest = dest;
module.exports.base = base;
module.exports.artifacts = artifacts;
module.exports.artifact = artifact;
module.exports.bin = bin;
module.exports.current = current;
module.exports.resolve = path.resolve;
module.exports.join = path.join;
