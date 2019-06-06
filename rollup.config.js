const babel = require('rollup-plugin-babel')
const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')
const replace = require('rollup-plugin-replace')
const {terser} = require('rollup-plugin-terser')

const env = process.env.NODE_ENV

const config = {
  input: 'lib/index.js',
  output: {
    name: 'shapey',
    exports: 'named',
    indent: false,
    file: 'build/dist/shapey.js',
    format: 'umd'
  },
  plugins: [
    nodeResolve({jsnext: true}),
    commonjs(),
    babel({exclude: 'node_modules/**'}),
    replace({'process.env.NODE_ENV': JSON.stringify(env)})
  ]
}

if (env === 'production') {
  config.output.file = 'build/dist/shapey.min.js'
  config.plugins.push(
    terser({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  )
}

module.exports = config
