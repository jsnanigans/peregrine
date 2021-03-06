var path = require('path')
var utils = require('./utils')
var webpack = require('webpack')
var config = require('../config')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.base.conf')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const MinifyPlugin = require('babel-minify-webpack-plugin')
const glob = require('glob-all')
var peregrine = require('../peregrine/peregrine')

const Extract = new ExtractTextPlugin('static/css/[name].[contenthash].css')
// const ExtractCriticalCSS = new ExtractTextPlugin('css/crit.[contenthash].css')


let jsModules = []
let allModules = []
function listModules(options) {}
listModules.prototype.apply = function(compiler) {
  compiler.plugin("emit", function(compilation, done) {
    let includeModules = []
    let test = new RegExp('.js$')

    compilation.modules.map(mod => {
      let res = mod.resource

      if (test.test(res)) {
        includeModules.push(res)
      }
    })

    done()
  })
}

let assetPaths = []
const getFilePaths = _ => {
  console.log('assetPaths', assetPaths)
  return assetPaths
}

var env = process.env.NODE_ENV === 'testing'
  ? require('../config/test.env')
  : config.build.env

var webpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader']
        })
      },
      {
        test: /\.scss$/,
        // include: [resolve('src'), resolve('test')],
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        })
      },
      {
        // test: /(?:(?!\.crit).)*\.styl$/,
        test: /\.styl$/,
        use: Extract.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            'stylus-loader',
            {
              loader: 'stylus-vars-loader',
              options: {
                file: './src/styles/variables/index.styl',
              }
            }
          ]
        })
      },
    ]
  },
  devtool: config.build.productionSourceMap ? '#source-map' : false,
  output: {
    path: config.build.assetsRoot,
    filename: utils.assetsPath('js/[name].[chunkhash].js'),
    chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
  },
  plugins: [
    // new listModules(),
    new webpack.LoaderOptionsPlugin({
      test: /\.styl$/,
      stylus: {
        // You can have multiple stylus configs with other names and use them
        // with `stylus-loader?config=otherConfig`.
        default: {
          use: [
            require('rupture')(),
            require('jeet')(),
            // require('typographic')()
          ],
        },
        otherConfig: {
          // use: [other_plugin()],
        },
      },
    }),
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      'process.env': env
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      sourceMap: true
    }),
    // extract css into its own file
    // new ExtractTextPlugin({
    //   filename: utils.assetsPath('css/[name].[contenthash].css')
    // }),
    Extract,

    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
      cssProcessorOptions: {
        safe: true
      }
    }),
    // generate dist index.html with correct asset hash for caching.
    // you can customize output by editing /index.html
    // see https://github.com/ampedandwired/html-webpack-plugin
    // new HtmlWebpackPlugin({
    //   filename: process.env.NODE_ENV === 'testing'
    //     ? 'index.html'
    //     : config.build.index,
    //   template: 'index.html',
    //   inject: true,
    //   minify: {
    //     removeComments: true,
    //     collapseWhitespace: true,
    //     removeAttributeQuotes: true
    //     // more options:
    //     // https://github.com/kangax/html-minifier#options-quick-reference
    //   },
    //   // necessary to consistently work with multiple chunks via CommonsChunkPlugin
    //   chunksSortMode: 'dependency'
    // }),
    // split vendor js into its own file

    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      chunks: [],
      minChunks: 2
      // minChunks: function (module, count) {
      //   // any required modules inside node_modules are extracted to vendor
      //   return (
      //     module.resource &&
      //     /\.js$/.test(module.resource) &&
      //     module.resource.indexOf(
      //       path.join(__dirname, '../node_modules')
      //     ) === 0
      //   )
      // }
    }),

    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      chunks: ['vendor']
    }),
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.build.assetsSubDirectory,
        ignore: ['.*']
      }
    ]),

    new MinifyPlugin(),

    // delete unused css
    // new PurifyCSSPlugin({
    //   // Give paths to parse for rules. These should be absolute!
    //   paths: getFilePaths(),
    //   modulePathsTest: 'src.*\.(js)$'
    // }),

    new peregrine({
      config: path.join(__dirname, '../src/pages.js'),
      setPaths: paths => {
        assetPaths = paths
      },
      env: 'production'
    }),
  ]
})

if (config.build.productionGzip) {
  var CompressionWebpackPlugin = require('compression-webpack-plugin')

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

if (config.build.bundleAnalyzerReport) {
  var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
