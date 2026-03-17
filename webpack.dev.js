const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const fs = require('fs');

module.exports = (env) => {
  const viewsDir = path.resolve(__dirname, 'src/tests/views');
  const viewFiles = fs.readdirSync(viewsDir).filter(f => f.endsWith('.html'));

  const viewPlugins = viewFiles.map(file => 
    new HtmlWebpackPlugin({
      filename: file,
      template: path.resolve(viewsDir, file),
    })
  );

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
      ...viewPlugins,
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
      new webpack.HotModuleReplacementPlugin(),
    ],
  });
};
