# mongodb-version-manager

[![build status](https://secure.travis-ci.org/imlucas/mongodb-version-manager.png)](http://travis-ci.org/imlucas/mongodb-version-manager)

## Example

Download and install the current unstable and two previous stable releases:

```
npm install -g mongodb-version-manager
export PATH="`m path`:$PATH"
m 2.7.x && npm test && mongod --version
m 2.6.x && npm test && mongod --version
m 2.4.x && npm test && mongod --version
```


## Testing multiple versions of MongoDB with travisci

With a `.travis.yml` like

```
language: node_js
node_js:
  - "0.10"
env:
  - DEBUG=* MONGODB_VERSION=2.4.x
  - DEBUG=* MONGODB_VERSION=2.6.x
  - DEBUG=* MONGODB_VERSION=2.7.x
```

Add `mongodb-version-manager` to your devDependencies and a `test` script in
your package.json like

```
"test": "m kill && m ${MONGODB_VERSION} && mocha",
```

Now you'll have a sweet [matrix build on travis](https://travis-ci.org/imlucas/mongodb-runner)

![mongodb matrix build](https://i.cloudup.com/kv3VmH1zKO-2000x2000.png)

## License

MIT

## Todo

- Pull binaries from MCI https://s3.amazonaws.com/mciuploads/mongodb-mongo-master/linux-#{bits}/#{commit}/binaries/mongo-mongodb_mongo_master_linux_#{bits}_#{commit}_#{ts}.(tgz|zip)
