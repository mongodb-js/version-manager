var mvm = require('../');

describe('mvm', function(){
  it('should provide the current version', function(done){
    mvm.current(function(err, v){
      done(err);
    });
  });
});
