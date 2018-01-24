// nodejs 中的path模块
const path = require('path');
const uglify = require('uglifyjs-webpack-plugin');

require('es6-promise').polyfill();

module.exports = {
  // 入口文件，path.resolve()方法，可以结合我们给定的两个参数最后生成绝对路径，最终指向的就是我们的index.js文件
  entry: path.resolve(__dirname, './app/main.js'),
  // 输出配置
  output: {
    // 输出路径是 myProject/output/static
    path: path.resolve(__dirname, "./dist"),
    publicPath: '/',
    filename: 'app.js'
    //chunkFilename: '[id].[chunkhash].js'
  },
  //也要加载
  resolve: {
    extensions: ['', '.js', '.vue']
  },
  devtool: 'source-map',
  module: {
    loaders: [
      // 使用vue-loader 加载 .vue 结尾的文件
      {
        test: /\.vue$/,
        loader: 'vue'
      },
      {
        test: /\.js$/,
        loader: 'babel?presets=es2015',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new uglify()
  ]
}