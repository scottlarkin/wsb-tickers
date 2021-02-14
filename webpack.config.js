const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/front_end/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  output: {
    filename: 'js/index.js',
    path: path.resolve(__dirname, 'public'),
  },
};