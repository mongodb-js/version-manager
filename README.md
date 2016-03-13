# mongodb-version-manager [![][travis_img]][travis_url]

## Example

Download and install the current unstable and two previous stable releases:

```shell
npm install -g mongodb-version-manager
export PATH="`m path`:$PATH"
m use 3.0.x && npm test && mongod --version
m use 2.6.x && npm test && mongod --version
m use 2.4.x && npm test && mongod --version
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

[travis_img]: https://secure.travis-ci.org/mongodb-js/version-manager.png
[travis_url]: https://secure.travis-ci.org/mongodb-js/version-manager
