const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = env => {
  // Минимайзеры
  let minimizer = [];

  // Если это продакшн версия, то добавляем их
  if (env === 'production') {
    minimizer = [
      new TerserPlugin(),
      new OptimizeCSSAssetsPlugin({}),
    ];
  }

  return merge(common(env), {
    entry: './src/index_prod.ts',
    mode: 'production',
    optimization: {
      minimizer
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader',
          ],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(['dist']),
      new MiniCssExtractPlugin({
        filename: 'faze.min.css',
      }),
    ],
  });
};
