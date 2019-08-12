const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackCombineMultipleConfigsPlugin = require('../..')

// Make sure each config has its own instance!
// Do not share plugin instances between configs!
const createSharedPlugins = (filename = 'index.html') => [
  new HtmlWebpackPlugin({
    filename,
    template: 'template.html',
    minify: {
      removeComments: false,
      collapseWhitespace: false,
      minifyJS: false,
      minifyCSS: false,
      minifyURLs: false,
    },
  }),
  new HtmlWebpackCombineMultipleConfigsPlugin({
    alterTags: true,
    legacyTest: /legacy/gi,
  }),
]

module.exports = [
  {
    context: __dirname,
    entry: './index.js',
    output: {
      path: path.resolve('./dist'),
      publicPath: '',
      filename: 'bundle.js'
    },
    plugins: [
      ...createSharedPlugins('index.html'),
    ],
  },
  {
    context: __dirname,
    entry: './index.js',
    output: {
      path: path.resolve('./dist'),
      publicPath: '',
      filename: 'legacy-bundle.js'
    },
    plugins: [
      // Picking a different name to avoid webpack writing 
      // to the same file at the same time.
      // If the outputs are the same it shouldn't matter.
      ...createSharedPlugins('legacy.html'),
    ],
  }
]
