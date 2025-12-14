const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 3000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
    // --- PROXY API CONFIGURATION (WAJIB ADA) ---
    proxy: [
      {
        context: ['/api', '/auth', '/users', '/dashboard', '/bapb', '/bapp', '/documents', '/po'],
        target: 'https://ba-digital-api.up.railway.app',
        changeOrigin: true,
        secure: false,
      }
    ]
    // -------------------------------------------
  },
});