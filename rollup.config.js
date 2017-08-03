import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

const Plugins = () => [
  resolve({
    module: true, browser: true, jsnext: true, main: true, extensions: [ '.js', '.json' ]
  }),
  commonjs()
]

export default [
  {
    entry: 'src/index.js',
    dest: 'build/pull-to-refresh.es.js',
    format: 'es',
    plugins: Plugins()
  },

  {
    entry: 'src/index.js',
    dest: 'build/pull-to-refresh.cjs.js',
    format: 'cjs',
    plugins: Plugins()
  },

  {
    entry: 'src/docs.js',
    dest: 'docs/docs.js',
    format: 'iife',
    plugins: Plugins()
  }
]
