#!/usr/bin/env node

var mvm = require('../'),
  yargs = require('yargs')
    .usage('Usage: $0 [options] [COMMAND]')
    .describe('stable', 'Print latest stable version of MongoDB')
    .describe('unstable', 'Print latest unstable version of MongoDB')
    .describe('version', 'Any semver version string or query')
    .describe('url', 'Print the download URL')
    .example('$0 --stable --url', 'Print download URL for the latest stable version')
    .example('$0 --unstable', 'Print latest unstable version')
    .example('$0 stable [config]', 'Install or activate the latest stable MongoDB release')
    .example('$0 latest [config]', 'Install or activate the latest unstable MongoDB release')
    .example('$0 <version> [config]', 'Install or activate MongoDB <version>')
    .example('$0 --version="2.4.*"', 'Print latest 2.4 series version')

    ,
  argv = yargs.argv;

if(argv.h || argv.help || (argv._[0] && argv._[0] === 'help')) return yargs.showHelp();

var version = argv.version;
if(argv.stable) version = 'stable';
if(argv.unstable) version = 'unstable';

if(version){
  return mvm.resolve(version, function(err, v){
    if(err) return console.error(err);
    console.log(argv.url ? v.url : v.version);
  });
}
else if(argv._[0] && (argv._[0] !== 'ls')){
  return mvm.use(argv._[0], function(err){
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
