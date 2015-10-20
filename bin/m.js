#!/usr/bin/env node

/* eslint no-sync:0, no-octal-escape:0, no-console:0, no-path-concat:0 */
var fs = require('fs');
var async = require('async');
var docopt = require('docopt').docopt;
var pkg = require('../package.json');
var argv = docopt(fs.readFileSync(__dirname + '/m.docopt', 'utf-8'), {
  version: pkg.version
});

if (argv['--debug']) {
  process.env.DEBUG = '*';
}

var mvm = require('../');
var difference = require('lodash.difference');
var chalk = require('chalk');
var figures = require('figures');
var debug = require('debug')('mongodb-version-manager');
var cmd;

function printVersions(versions, fn) {
  mvm.current(function(err, current) {
    if (err) return fn(err);

    console.log(versions.map(function(v) {
      if (v === current) {
        return ' \033[32mο ' + v + '\033[0m \033[90m \033[0m';
      }
      return '   ' + v + '\033[90m \033[0m';
    }).join('\n'));

    fn();
  });
}

var abortIfError = function(err) {
  if (err) {
    console.error(chalk.bold.red(figures.cross),
      ' Error:', chalk.bold.red(err.message));

    console.error('We apologize for this issue and welcome your bug reports.');
    console.error('Please visit: https://github.com/mongodb-js/version-manager/issues');
    console.error();
    console.error('Try running your command again with debugging on:');
    console.error('   m ' + cmd + ' --debug');
    console.error();
    console.error(chalk.bold('Stack Trace'));
    err.stack.split('\n').map(function(line) {
      console.error('  ', chalk.gray(line));
    });
    return process.exit(1);
  }
};

var onNoVersionsInstalled = function(cb) {
  console.log('0 versions installed.  Run one of:');

  mvm.resolve([{
    version: 'unstable'
  }, {
    version: 'stable'
  }], function(err, data) {
    if (err) return cb(err);

    if (!data || !data.stable || data.unstable) {
      return cb(new Error('Unknown error'));
    }

    console.log('    m use stable; # installs MongoDB v' + data.stable.version);
    console.log('    m use unstable; # installs MongoDB v' + data.unstable.version);
    cb();
  });
};

var commands = {
  available: function() {
    var title = '';
    if (!argv['--rc'] && !argv['--stable'] && !argv['--unstable']) {
      argv['--all'] = true;
    }
    if (argv['--all']) {
      argv['--stable'] = true;
      argv['--unstable'] = true;
      argv['--rc'] = true;
      title = 'All';
    } else {
      var includes = [];
      if (argv['--stable']) {
        includes.push('Stable');
      }
      if (argv['--unstable']) {
        includes.push('Unstable');
      }
      if (argv['--rc']) {
        includes.push('Release Candidates');
      }
      title = includes.join('|');
    }

    var opts = {
      stable: argv['--stable'],
      unstable: argv['--unstable'],
      rc: argv['--rc'],
      pokemon: argv['--pokemon']
    };

    async.waterfall([
      mvm.installed.bind(null),
      function(installedVersion, cb) {
        opts.installedVersion = installedVersion;
        cb();
      },
      mvm.available.bind(null, opts),
      function(versions, cb) {
        if (!versions || versions.length === 0) {
          return cb(new Error('No available versions?'));
        }

        if (opts.pokemon) {
          console.log(title + ' versions you haven\'t installed yet:');
          versions = difference(versions, opts.installedVersion);
        }
        cb(null, versions);
      },
      printVersions.bind(null)
    ], function(err) {
      abortIfError(err);
      process.exit(0);
    });
  },
  path: function() {
    mvm.path(function(err, p) {
      abortIfError(err);
      console.log(p);
      process.exit(0);
    });
  },
  use: function(opts) {
    async.series([
      mvm.use.bind(null, opts),
      mvm.current
    ], function(err, res) {
      abortIfError(err);

      var version = res[res.length - 1];
      console.log('switched to %s', version);
      process.exit(0);
    });
  },
  list: function() {
    async.waterfall([
      mvm.installed.bind(null),
      function(versions, cb) {
        if (versions.length > 0) {
          printVersions(versions, cb);
          return;
        }
        onNoVersionsInstalled(cb);
      }
    ], function(err) {
      abortIfError(err);
      process.exit(0);
    });
  }
};

var opts = {
  version: argv['<version>'],
  branch: argv['--branch'],
  distro: argv['--distro']
};

cmd = Object.keys(commands)
  .filter(function(name) {
    return argv[name] === true;
  })[0];

if (!cmd) {
  cmd = argv['<version>'] ? 'use' : 'list';
}
debug('cmd is `%s` with opts `%j`', cmd, opts);

commands[cmd](opts);
