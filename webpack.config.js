const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const package = require('./package.json');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

let config = {
    // 入口
    entry: {
        Recorder: path.resolve(__dirname, 'src/index.ts'),
    },
    devtool: 'source-map',
    devServer: {
        contentBase: './src'
    },
    output: {
        // 输出文件名
        //filename: '[name].js',
        filename: (chunkData) => {
            // 文件名小写
            return `${firstLower(chunkData.chunk.name)}.js`;
        },
        // 输出路径
        path: path.resolve(__dirname, 'dist'),
        libraryExport: 'default',
        library: '[name]',
        globalObject: 'this',
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
@author ${ package.author } <echoweb@126.com> (https://www.zhuyuntao.cn)
@license ${ package.license }
        `),
        new CleanWebpackPlugin()
    ],
};

module.exports = (env, argv) => {
    if (argv.mode === 'development') {

        // 移动端下增加 vconsole 调试
        config.entry.vconsole = path.resolve(__dirname, 'example/vconsole.ts');
        // 开发模式下增加 example
        config.entry.example = path.resolve(__dirname, 'example/example.ts');

        // 开发模式下才要用到html
        config.plugins.push(
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'example/example.html'),
                filename: 'index.html'
            }
        ));
    }

    return config;
}

function firstLower(str) {
    return str.substring(0, 1).toLowerCase() + str.substring(1)
}
