var downcache = require('downcache'),
  cheerio = require('cheerio'),
  semver = require('semver'),
  cacheDir = require('os').tmpdir();

var VERSION = /[0-9]+\.[0-9]+\.[0-9]+([-_\.][a-zA-Z0-9]+)?/;

module.exports = function(fn){
  downcache('http://dl.mongodb.org/dl/src/', {dir: cacheDir}, function(err, res, body){
    if(err) return fn(err);
    var $ = cheerio.load(body),
      urls = [], versions = {};

    var versions = {};
    $('tr a').map(function(i, el){
      var url = $(this).attr('href'),
        matches = VERSION.exec(url);
      if(!matches) return;

      versions[matches[0].replace(/\.zip|\.tar/, '').replace('_', '-').replace('.rc', '-rc')] = 1;
    });

    versions = Object.keys(versions).filter(semver.lt.bind(null, '2.0.0'));
    versions.sort(semver.rcompare);
    fn(null, versions.map(semver.parse.bind(null)));
  });
};
