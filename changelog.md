# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.7] 2021-01-09
### Fixed
+ 修复[issues 72](https://github.com/2fps/recorder/issues/72)。

### changed
+ 依赖版本提升。
+ 放出 index.d.ts。

## [1.0.6] 2020-04-15
### Added
+ 增加8000采样率。

## [1.0.5] 2020-04-13
### Added
+ 增加`getChannelData`用于获取左右声道的数据，使用[lamejs](https://github.com/zhuker/lamejs)支持mp3音频格式的转化。

## [1.0.4] 2020-03-29
### Fixed
+ 处理[issues 36](https://github.com/2fps/recorder/issues/36)。

## [1.0.3] 2020-02-18
### Fixed
+ 处理[issues 32](https://github.com/2fps/recorder/issues/32)中的衍生问题，safari下，disconnect后再次connect的bug。
+ 处理[issues 31](https://github.com/2fps/recorder/issues/31)。

## [1.0.2] 2020-02-15
### Fixed
+ 处理[issues 30](https://github.com/2fps/recorder/issues/30)。

## [1.0.1] 2020-02-05
### Added
+ 增加 getPermission 静态方法提前让用户获取浏览器的录音权限[issues 23中新增问题](https://github.com/2fps/recorder/issues/23)。

## [1.0.0] 2020-02-01
### Removed
+ 先删除边录边播放功能。

### changed
按功能模块划分。

### Added
+ 增加 setOption 接口，用于重置 recorder 的配置。
+ 增加播放音频时的，开始音频播放(onplay)，暂停音频播放(onpauseplay)，恢复音频播放(onresumeplay)，停止音频播放(onstopplay)，音频播放结束回调(onplayend)。
+ 简单拆分文件。

## [0.5.4] 2019-12-23
### Added
+ 增加[issues 27](https://github.com/2fps/recorder/issues/27)中提到的接口 getPlayTime() 方法，用于获取音频的当前时间。

## [0.5.3] 2019-12-03
### Fixed
+ 修改[issues 23](https://github.com/2fps/recorder/issues/23)中提到的问题：在录音结束时，释放录音权限。

### changed
+ 引入 semantic-ui 改善demo界面。

## [0.5.2] 2019-11-07
### Added
+ onprogress 回调中增加 fileSize 显示已录音文件大小(PCM数据)。

## [0.5.1] 2019-11-06
### Changed
+ 修改44100等非整倍数采样率的问题[issues 20](https://github.com/2fps/recorder/issues/20)。

## [0.5.0] 2019-11-02
### Added
+ 增加 getWholeData() 和 getNextData() 方法，以便以便录音一边获取音频数据。
+ 支持边录音边转化功能，onprogress回调中data返回的即是所有处理后的音频数据。

## [0.4.4] 2019-10-23
### changed
+ 导出文件名和 Record 实例大小写问题修复。

## [0.4.3] 2019-10-15
### changed
+ start方法报错不内部catch，给使用者catch。
+ umd打包方式设置 globalObject 为this，使支持在 Node 环境下 import 。

## [0.4.0] - [0.4.2] 2019-10-09
### Added
+ 增加 pausePlay 方法暂停录音的播放，增加 resumePlay 方法恢复录音的播放。
+ 使 onprocess 支持音量百分比的输出， 
+ 增加 stopPlay 接口，支持录音播放的停止。

### Changed
+ 增加 onprogress 回调替换 onprocess，onprocess做向下兼容
+ 文件调整，src 下只存放源码文件，独立出 example 文件夹存放 demo 。
+ 剔除无用或未用到的文件。
+ 合并 onprocess 回调中参数，支持多个值的输出。

## [0.3.1]
### Added
+ 0.3.0中遗漏的问题。

## [0.3.0]
### Fixed
+ 由于 start 和 destroy 方法内部含有异步处理，故改为返回 promise 。
+ 双通道按采样率压缩时，若不是基数倍有问题([issues 7](https://github.com/2fps/recorder/issues/7)提及的)。

### Added
+ 完成移动端兼容性测试。
+ 增加travis CI。

## [0.2.3] - 2019-06-29
### Added
+ 增加大小端字节序检测，增加移动端和pc端兼容性的测试。
+ 增加https模式下启动，增加vconsole，为移动端调试准备。

### Fixed
+ 修复ios自带浏览器报错问题，ff低版本不支持close的问题。
+ 修复ff下停止、暂停录音后，录音时长继续增加的问题。

## [0.2.2] - 2019-06-20
### Added
+ 开始pc端和移动端兼容性测试（部分）。
+ 增加getUserMedia兼容。
+ 增加jest测试库，增加jest-html-reporters依赖，生成html版测试报告。
+ 支持播放外部音频文件。
+ 增加createAnalyser函数，增加analyse node用于录音图形化显示。

### Fixed
+ 前一次录音残留问题([issues 2](https://github.com/2fps/recorder/issues/2))。
+ 修复destory参数是可选的，但不传参提示错误的问题。

## [0.2.1] - 2019-04-16
### Fixed
+ dist版本有问题，修改。

## [0.2.0] - 2019-04-16
### Added
+ 加入onprocess回调，用于显示录音时长。
+ 加入暂停和恢复的功能。
+ 加入webpack-dev-server，区分development和production模式。
+ 支持pcm音频的导出功能。
+ 支持wav音频导出的功能。
+ 支持typescript。

## [0.1.1] - 2019-04-14
### Fixed
+ 实际版本和注释版本对应不上问题修改。

## [0.1.0] - 2019-04-14
### Added
+ 支持双声道。

### Changed
+ 拆分代码，将pcm转wav独立。

## [0.0.2] - 2019-04-13
### Added
+ 同时支持npm和script引用方式。

## [0.0.1] - 2019-04-12
### Added
+ 基本录音功能，开启录音，停止录音，播放录音。
+ 支持采样位数和采样率的设置。
