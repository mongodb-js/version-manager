var debug = require('debug')('mvm:download'),
  path = require('./path'),
  fs = require('fs-extra'),
  request = require('request'),
  createCleanupCrew = require('./cleanup'),
  tildify = require('tildify'),
  ProgressBar = require('progress');

module.exports = function(pkg, fn){
  var dest = path.artifact(pkg),
    url = pkg.url,
    cleanup = createCleanupCrew('remove incomplete artifact', fs.unlinkSync.bind(null, dest));

  fs.mkdirs(path.artifacts(), function(err){
    if(err) return fn(err);

      fs.exists(dest, function(exists){
        if(exists){
          debug('already have artifact ' + dest);
          cleanup.clear();
          return fn();
        }

        debug('downloading %s to %s', url, tildify(dest));
        var out = fs.createWriteStream(dest)
          .on('error', fn)
          .on('finish', function(){
            cleanup.clear();
            fn(null, dest);
          }),
          req = request(url);
        req.on('response', function(res){
          var total = parseInt(res.headers['content-length'], 10);
          debug('total size %dMB', (total/1024/1024).toFixed(2));
          console.log();
          var bar = new ProgressBar('  Downloading MongoDB v' + pkg.version + ' [:bar] :percent :etasec', {
            complete: '=',
            incomplete: ' ',
            width: 40,
            total: total
          });

          res.on('data', function (chunk) {
            bar.tick(chunk.length);
          });

          res.on('end', function () {
            console.log('\n');
          });
        });
        req.pipe(out);
        req.on('error', fn);
      });
  });
};
