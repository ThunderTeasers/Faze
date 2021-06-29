const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = (env) => {
  return merge(common(env), {
    entry: './src/index_dev.ts',
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
      contentBase: path.resolve(__dirname, 'dist'),
      hot: true,
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(['dist']),
      new HtmlWebpackPlugin({
        filename: 'drag.html',
        template: './src/tests/views/drag.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'tab.html',
        template: './src/tests/views/tab.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'tooltip.html',
        template: './src/tests/views/tooltip.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'dropdown.html',
        template: './src/tests/views/dropdown.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'carousel.html',
        template: './src/tests/views/carousel.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'carousel_old.html',
        template: './src/tests/views/carousel_old.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'perf_tests.html',
        template: './src/tests/views/perf_tests.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'modal.html',
        template: './src/tests/views/modal.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'thumbgallery.html',
        template: './src/tests/views/thumbgallery.html',
      }),
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
      new webpack.HotModuleReplacementPlugin(),
      new MiniCssExtractPlugin({
        filename: 'faze.min.css',
      }),
    ],
  });
};
