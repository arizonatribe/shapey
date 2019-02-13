const path = require('path')

function resolvePaths() {
  const resolvePath = rel => path.resolve(__dirname, '../..', rel)

  return {
    build: resolvePath('build'),
    README: resolvePath('README.md'),
    faucet: resolvePath('node_modules/.bin/faucet'),
    pkgPath: resolvePath('build/package.json'),
    babel: resolvePath('node_modules/.bin/babel'),
    eslint: resolvePath('node_modules/.bin/eslint'),
    rollup: resolvePath('node_modules/.bin/rollup'),
    tape: resolvePath('node_modules/.bin/tape')
  }
}

module.exports = resolvePaths
