# mongodb-version-manager

[![build status](https://secure.travis-ci.org/imlucas/mongodb-version-manager.png)](http://travis-ci.org/imlucas/mongodb-version-manager)

## Example

Download and install the current unstable and two previous stable releases:

```shell
npm install -g mongodb-version-manager
export PATH="`m path`:$PATH"
m 2.7.x && npm test && mongod --version
m 2.6.x && npm test && mongod --version
m 2.4.x && npm test && mongod --version
```

## Testing multiple versions of MongoDB with travisci

With a `.travis.yml` like

```yaml
language: node_js
node_js:
  - "0.10"
env:
  - MONGODB_VERSION=2.4.x
  - MONGODB_VERSION=2.6.x
  - MONGODB_VERSION=2.7.x
  - MONGODB_VERSION=2.8.x
```

`npm install --save-dev mongodb-version-manager` and in your test runner js file:

```javascript
var m = require('mongodb-version-manager');
// ...other setup
m(function(err, installed){
  if(err) return console.error(err) && process.exit(1);
  if(installed) console.log('Installed MongoDB %s', installed.version);
  // ...run your tests
});
```

You can also just update your `package.json` if you don't care about windows:

```json
"test": "m kill && m ${MONGODB_VERSION} && mocha",
```

Now you'll have a sweet [matrix build on travis](https://travis-ci.org/imlucas/mongodb-runner)

![mongodb matrix build](https://i.cloudup.com/kv3VmH1zKO-2000x2000.png)

## License

MIT
