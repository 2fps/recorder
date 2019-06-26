const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const package = require('./package.json');

let config = {
    // 入口
    entry: {
        Recorder: path.resolve(__dirname, 'src/recorder.ts'),
    },
    devtool: 'source-map',
    devServer: {
        contentBase: './src'
    },
    output: {
        // 输出文件名
        filename: '[name].js',
        // 输出路径
        path: path.resolve(__dirname, 'dist'),
        libraryExport: 'default',
        library: '[name]',
        libraryTarget: 'umd'
    },
    module: {
        unknownContextCritical : false,
        rules:[{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: ['.js', '.ts', '.json'],
    },
    plugins: [
        // 文件注释插件
        new webpack.BannerPlugin(`
${ package.name } - ${ package.description }

@version v${ package.version }
@homepage ${ package.homepage }
@author ${ package.author } <echoweb@126.com> (http://www.zhuyuntao.cn)
@license ${ package.license }
        `)
    ],
};

module.exports = (env, argv) => {
    if (argv.mode === 'development') {

        // 移动端下增加 vconsole 调试
        config.entry.vconsole = path.resolve(__dirname, 'src/vconsole.ts');
        // 开发模式下增加 example 
        config.entry.example = path.resolve(__dirname, 'src/example.ts');

        // 开发模式下才要用到html
        config.plugins.push(
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'src/example.html'),
                filename: 'index.html'
            }
        ));
    }
    
    return config;
}