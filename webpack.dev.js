const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = (env) => {
  return merge(common(env), {
    entry: './src/index_dev.ts',
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      hot: true,
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
          sideEffects: true,
        },
        {
          test: /\.html$/,
          use: 'html-loader',
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: 'faze.min.css',
      }),
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
        filename: 'smartselect.html',
        template: './src/tests/views/smartselect.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'look.html',
        template: './src/tests/views/look.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'gallery.html',
        template: './src/tests/views/gallery.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'helpers.html',
        template: './src/tests/views/helpers.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'slider.html',
        template: './src/tests/views/slider.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'tablesorter.html',
        template: './src/tests/views/tablesorter.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'sorter.html',
        template: './src/tests/views/sorter.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'zoombox.html',
        template: './src/tests/views/zoombox.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'placeholder.html',
        template: './src/tests/views/placeholder.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'lazyload.html',
        template: './src/tests/views/lazyload.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'tour.html',
        template: './src/tests/views/tour.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'tour_js.html',
        template: './src/tests/views/tour_js.html',
      }),
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
      new webpack.HotModuleReplacementPlugin(),
    ],
  });
};
