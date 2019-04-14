const path = require('path');

module.exports = {
    // 入口
    entry: path.resolve(__dirname, 'src/recorder.ts'),
    devtool: 'source-map',
    output: {
        // 出口重命名js
        filename: 'recorder.js',
        // 出口文件夹名
        path: path.resolve(__dirname, 'dist'),
        libraryExport: "default",
        library: "Recorder",
        libraryTarget: "umd"
    },
    module: {
        rules:[/* {
            test: /(\.jsx|\.js)$/,
            use: {
                loader: 'babel-loader'
            },
            exclude:path.resolve(__dirname, 'node_modules')
        } */{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    }
}