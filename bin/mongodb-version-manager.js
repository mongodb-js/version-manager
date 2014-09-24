#!/usr/bin/env node

var mvm = require('../'),
  which = require('which'),
  fs = require('fs'),
  docopt = require('docopt').docopt,
  pkg = require('../package.json'),
  argv = docopt(fs.readFileSync(__dirname + '/m.docopt', 'utf-8'), {version: pkg.version});

var COMMANDS = ['use', 'shell', 'path', 'd', 'show', 'kill'];
var cmd,
  args = [];

for(var i=0; i < COMMANDS.length; i++){
  if(argv[COMMANDS[i]] === true){
    cmd = COMMANDS[i];
    break;
  }
}
if(argv['<v>']){
  if(!cmd){
    cmd = 'show';
  }
  args.push(argv['<v>']);
}
else if(!cmd){
  cmd = 'ls';
}

if(cmd === 'show'){
  return mvm.resolve(args[0], function(err, v){
    if(err) return console.error(err);
    console.log(argv['--url'] ? v.url : v.version);
  });
}
else if(cmd === 'path'){
  return mvm.path(function(err, p){
    console.log(p);
  });
}
else if(cmd === 'kill'){
  return mvm.kill(function(){});
}
else if(cmd === 'shell'){
  return require('child_process').spawn(which.sync('mongo'), {stdio: 'inherit'});
}
else if(cmd === 'd'){
  return require('child_process').spawn(which.sync('mongod'), {stdio: 'inherit'});
}
else if(cmd === 'use'){
  mvm.use(args[0], function(err){
    if(err) return console.error(err);
    mvm.current(function(err, v){
      if(err) return console.error(err);
      console.log('switched to ' + v);
    });
  });
}
else {
  mvm.current(function(err, current){
    mvm.installed(function(err, versions){
      console.log(versions.map(function(v){
        if(v === current){
          return '  \033[32mο\033[0m '+v+' \033[90m \033[0m';
        }
        else {
          return '  ' + v + '\033[90m \033[0m';
        }
      }).join('\n'));
    });
  });
}
