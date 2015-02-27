#!/usr/bin/env node

var mvm = require('../'),
  which = require('which'),
  fs = require('fs'),
  docopt = require('docopt').docopt,
  pkg = require('../package.json'),
  argv = docopt(fs.readFileSync(__dirname + '/m.docopt', 'utf-8'), {
    version: pkg.version
  }),
  spawn = require('child_process').spawn,
  _ = require('underscore'),
  debug = require('debug')('mongodb-version-manager');

var cmd;

function printVersions(versions, fn) {
  mvm.current(function(err, current) {
    if (err) return fn(err);

    console.log(versions.map(function(v) {
      if (v === current) {
        return ' \033[32mο ' + v + '\033[0m \033[90m \033[0m';
      } else {
        return '   ' + v + '\033[90m \033[0m';
      }
    }).join('\n'));

    fn();
  });
}

var abortIfError = function(err) {
  if (err) {
    console.error(err);
    console.error('----');
    console.error('Try running your command again with debugging on:');
    console.error('  DEBUG=* m ' + cmd);
    console.error('Bug reports welcome at http://github.com/imlucas/mongodb-version-manager');
    console.error('----');
    return process.exit(1);
  }
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

    mvm.installed(function(err, installed) {
      abortIfError(err);

      mvm.available(opts, function(err, versions) {
        abortIfError(err);

        if (!versions || versions.length === 0) {
          return abortIfError(new Error('No available versions?'));
        }

        if (opts.pokemon) {
          console.log(title + ' versions you haven\'t installed yet:');
          versions = _.difference(versions, installed);
        }
        printVersions(versions, function(err) {
          abortIfError(err);
        });
      });
    });
  },
  path: function() {
    mvm.path(function(err, p) {
      console.log(p);
    });
  },
  kill: function() {
    mvm.kill(function() {});
  },
  shell: function() {
    mvm.path(function() {
      spawn(which.sync('mongo'), [], {
        stdio: 'inherit'
      });
    });
  },
  d: function() {
    spawn(which.sync('mongod'), [], {
      stdio: 'inherit'
    });
  },
  use: function(opts) {
    mvm.use(opts, function(err) {
      abortIfError(err);
      mvm.current(function(err, v) {
        abortIfError(err);
        console.log('switched to ' + v);
      });
    });
  },
  list: function() {
    mvm.installed(function(err, versions) {
      abortIfError(err);

      if (versions.length > 0) {
        return printVersions(versions, function(err) {
          if (err) return console.log(err) && process.exit(1);
        });
      }

      console.log('0 versions installed.  Run one of:');

      mvm.resolve([{
        version: 'unstable'
        }, {
        version: 'stable'
      }], function(err, data) {
          abortIfError(err);

          console.log('    m use stable; # installs MongoDB v' + data.stable.version);
          console.log('    m use unstable; # installs MongoDB v' + data.unstable.version);
        });
    });
  }
};

var opts = {
  version: argv['<version>'],
  branch: argv['--branch']
};

cmd = Object.keys(commands).filter(function(name) {
  return argv[name] === true;
})[0] || (argv['<version>'] ? 'use' : 'list');
debug('cmd is `%s` with opts `%j`', cmd, opts);

commands[cmd](opts);
