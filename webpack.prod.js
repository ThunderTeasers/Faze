const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('css-minimizer-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  // Минимайзеры
  let minimizer = [];

  // Плагины
  const plugins = [
    new MiniCssExtractPlugin({
      filename: 'faze.min.css',
    }),
  ];

  // Если это продакшн версия, то добавляем их
  if (env === 'production') {
    minimizer = [
      new TerserPlugin(),
      new OptimizeCSSAssetsPlugin({}),
    ];
  }

  if (argv.clean !== 'false') {
    plugins.unshift(new CleanWebpackPlugin(['dist']));
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
    plugins,
  });
};
