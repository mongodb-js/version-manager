#!/usr/bin/env node

var mvm = require('../'),
  which = require('which'),
  fs = require('fs'),
  docopt = require('docopt').docopt,
  pkg = require('../package.json'),
  argv = docopt(fs.readFileSync(__dirname + '/m.docopt', 'utf-8'), {version: pkg.version}),
  spawn = require('child_process').spawn,
  chalk = require('chalk'),
  without = require('lodash.without'),
  pluck = require('lodash.pluck');

function printVersions(versions, fn){
  mvm.current(function(err, current){
    if(err) return fn(err);

    console.log(versions.map(function(v){
      if(v === current){
        return '  \033[32mο\033[0m '+v+' \033[90m \033[0m';
      }
      else {
        return '  ' + v + '\033[90m \033[0m';
      }
    }).join('\n'));

    fn();
  });
}

var abort = function(err){
  console.error(err);
  process.exit(1);
};

var commands = {
  show: function(opts){
    mvm.resolve(opts, function(err, v){
      if(err) return abort(err);
      console.log(argv['--url'] ? v.url : v.version);
    });
  },
  available: function(){
    var title = '';
    if(!argv['--rc'] && !argv['--stable'] && !argv['--unstable']){
      argv['--all'] = true;
    }
    if(argv['--all']){
      argv['--stable'] = true;
      argv['--unstable'] = true;
      argv['--rc'] = true;
      title = 'All';
    }
    else {
      var includes = [];
      if(argv['--stable']) includes.push('Stable');
      if(argv['--unstable']) includes.push('Unstable');
      if(argv['--rc']) includes.push('Release Candidates');
      title = includes.join('|');
    }

    var opts = {
      stable: argv['--stable'],
      unstable: argv['--unstable'],
      rc: argv['--rc'],
      pokemon: argv['--pokemon']
    };

    mvm.installed(function(err, installed){
      if(err) return abort(err);

      mvm.available(opts, function(err, versions){
        if(err) return abort(err);

        if(opts.pokemon){
          console.log(title + ' versions you haven\'t installed yet:');
          versions = without(versions, pluck(installed, 'version'));
        }
        else {
          console.log(title + ' versions you haven\'t installed yet:');
        }
        printVersions(versions, function(err){
          if(err) abort(err);
        });
      });
    });
  },
  path: function(){
    mvm.path(function(err, p){
      console.log(p);
    });
  },
  kill: function(){
    mvm.kill(function(){});
  },
  shell: function(){
    mvm.path(function(){
      spawn(which.sync('mongo'), [], {stdio: 'inherit'});
    });
  },
  d: function(){
    spawn(which.sync('mongod'), [], {stdio: 'inherit'});
  },
  use: function(opts){
    mvm.use(opts, function(err){
      if(err) return abort(err);
      mvm.current(function(err, v){
        if(err) return abort(err);
        console.log('switched to ' + v);
      });
    });
  },
  _default: function(){
    mvm.installed(function(err, versions){
      if(err) return abort(err);

      if(versions.length > 0){
        return printVersions(versions, function(err){
          if(err) return console.log(err) && process.exit(1);
        });
      }

      console.log('  '+chalk.yellow('0 versions installed.  Run one of:'));

      mvm.resolve([{version: 'unstable'}, {version: 'stable'}], function(err, data){
        if(err) return abort(err);

        console.log('    m use stable' + chalk.gray('; # installs MongoDB v' + data.stable.version));
        console.log('    m use unstable' + chalk.gray('; # installs MongoDB v' + data.unstable.version));
      });
    });
  }
};

var opts = {
  version: argv['<v>'],
  branch: argv['--branch']
};

var cmd = Object.keys(commands).filter(function(name){
  return argv[name] === true;
})[0] || (argv['<v>'] ? 'show' : '_default');

commands[cmd](opts);
