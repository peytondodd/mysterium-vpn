'use strict'

/**
 * Webpack config used for main process.
 */

process.env.BABEL_ENV = 'main'

const path = require('path')
const { dependencies, version } = require('../package.json')
const { buildNumber } = require('../build-number.json')
const webpack = require('webpack')
const features = require('./features')
const utilHelpers = require('../src/libraries/util-helpers')

const BabiliWebpackPlugin = require('babili-webpack-plugin')

const mysteriumClientVersion = dependencies['mysterium-client-bin']

try {
  utilHelpers.parseVersion(mysteriumClientVersion)
} catch (err) {
  throw new Error('mysterium-client-bin package must use an exact version.')
}

let mainConfig = {
  entry: {
    main: path.join(__dirname, '../src/main/index.js')
  },
  externals: [
    ...Object.keys(dependencies || {}),
    { 'electron-debug': 'electron-debug' }
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  node: {
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production'
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/electron')
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BUILD_NUMBER': JSON.stringify(buildNumber),
      'process.env.MYSTERIUM_VPN_VERSION': JSON.stringify(version),
      'MYSTERIUM_CLIENT_VERSION': JSON.stringify(mysteriumClientVersion),
      'FEATURES': features
    }),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  resolve: {
    extensions: ['.js', '.json', '.node']
  },
  target: 'electron-main'
}

/**
 * Adjust mainConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
    })
  )
}

/**
 * Adjust mainConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  mainConfig.plugins.push(
    new BabiliWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    })
  )
}

module.exports = mainConfig
