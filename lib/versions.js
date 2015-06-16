var downcache = require('downcache'),
  cheerio = require('cheerio'),
  semver = require('semver'),
  fs = require('fs-extra'),
  path = require('path'),
  config = require('./config'),
  cacheDir = require('os').tmpdir(),
  debug = require('debug')('mongodb-version-manager:versions');

var VERSION = /[0-9]+\.[0-9]+\.[0-9]+([-_\.][a-zA-Z0-9]+)?/;

var cacheFile = path.resolve(cacheDir + '/dl.mongodb.org/dl/src');

var cacheCleanup = function(fn){
  fs.exists(cacheFile, function(exists){
    if(!exists){
      debug('no cache file');
      return fn();
    }
    fs.stat(cacheFile, function(err, stats){
      if(!stats){
        debug('no stats for cache file');
        return fn();
      }

      debug('cache last modified %d', stats.mtime);
      if((Date.now() - stats.mtime.getTime()) >= config.expire){
        debug('cache is expired');
        return fs.unlink(cacheFile, fn);
      }
      debug('using cached versions html');
      fn();

    });
  });
};

module.exports = function(fn){
  debug('getting versions list');
  debug('versions cache %s/dl.mongodb.org/dl/src', cacheDir);
  cacheCleanup(function(){
    downcache('http://dl.mongodb.org/dl/src/', {dir: cacheDir}, function(err, res, body){
      if(err) return fn(err);
      var $ = cheerio.load(body),
        versions = {},
        $links = $('tr a');

      debug('extracting from %d links in table', $links.length);
      $links.map(function(){
        var url = $(this).attr('href'),
          matches = VERSION.exec(url);
        if(!matches) return;

        versions[
          matches[0]
            .replace(/\.zip|\.tar|\.tgz/, '')
            .replace('_', '-')
            .replace('.rc', '-rc')
        ] = 1;
      });
      debug('filtering out pre 2.2 versions');
      versions = Object.keys(versions).filter(semver.lt.bind(null, '2.2.0'));
      versions.sort(semver.rcompare);
      debug('%d versions of mongodb are available', versions.length);
      debug('latest unstable version is %s', versions[0]);
      fn(null, versions.map(semver.parse.bind(null)));
    });
  });
};
