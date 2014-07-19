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

## License

MIT
