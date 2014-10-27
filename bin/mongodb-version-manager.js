#!/usr/bin/env node

var mvm = require('../'),
  which = require('which'),
  fs = require('fs'),
  docopt = require('docopt').docopt,
  pkg = require('../package.json'),
  argv = docopt(fs.readFileSync(__dirname + '/m.docopt', 'utf-8'), {version: pkg.version}),
  spawn = require('child_process').spawn,
  chalk = require('chalk');

var commands = {
  show: function(opts){
    mvm.resolve(opts, function(err, v){
      if(err) return console.error(err);
      console.log(argv['--url'] ? v.url : v.version);
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
      if(err) return console.error(err);
      mvm.current(function(err, v){
        if(err) return console.error(err);
        console.log('switched to ' + v);
      });
    });
  },
  _default: function(){
    mvm.current(function(err, current){
      mvm.installed(function(err, versions){
        if(err) return console.error(err);

        if(versions.length > 0){
          return console.log(versions.map(function(v){
            if(v === current){
              return '  \033[32mο\033[0m '+v+' \033[90m \033[0m';
            }
            else {
              return '  ' + v + '\033[90m \033[0m';
            }
          }).join('\n'));
        }

        console.log('  '+chalk.yellow('0 versions installed.  Run one of:'));

        mvm.resolve([{version: 'unstable'}, {version: 'stable'}], function(err, data){
          if(err) return console.error(err);

          console.log('    m use stable' + chalk.gray('; # installs MongoDB v' + data.stable.version));
          console.log('    m use unstable' + chalk.gray('; # installs MongoDB v' + data.unstable.version));
        });

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
