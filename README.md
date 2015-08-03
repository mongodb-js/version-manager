# mongodb-version-manager

[![linux build status](https://secure.travis-ci.org/mongodb-js/version-manager.png)](http://travis-ci.org/mongodb-js/version-manager)
[![windows build status](https://ci.appveyor.com/api/projects/status/github/imlucas/mongodb-version-manager)](https://ci.appveyor.com/project/imlucas/mongodb-version-manager)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/mongodb-js/mongodb-js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


## Example

Download and install the current unstable and two previous stable releases:

```shell
npm install -g mongodb-version-manager
export PATH="`m path`:$PATH"
m 3.0.x && npm test && mongod --version
m 2.6.x && npm test && mongod --version
m 2.4.x && npm test && mongod --version
```

## TravisCI Automation

1. Use a `.travis.yml` like

  ```yaml
  language: node_js
  node_js:
    - "0.10"
  env:
    - MONGODB_VERSION=2.6.x
    - MONGODB_VERSION=3.0.x
    - MONGODB_VERSION=3.1.x
  ```
2. `npm install --save-dev mongodb-version-manager`
3. update your package.json

  ```json
  "scripts": {
    "pretest": "m ${MONGODB_VERSION}",
    "test": "mocha",
    "posttest": "m kill"
  }
  ```

Now you'll have a sweet [matrix build on travis](https://travis-ci.org/imlucas/mongodb-runner)

![mongodb matrix build](https://cldup.com/YeJkF3s94w-3000x3000.png)

## License

Apache 2.0
