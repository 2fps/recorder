## 修改记录

### latest(dev分支)

+ 增加jest测试库，增加jest-html-reporters依赖，生成html版测试报告。
+ 支持播放外部音频文件。
+ 处理录音残留[issues 2](https://github.com/2fps/recorder/issues/2)。
+ 修改destory参数是可选的，但不穿提示错误的问题。
+ 增加createAnalyser node，暴露接口给外部实现录音图形化。

### 0.2.1 [2019-04-16]
+ 修改dist版本有问题。

### 0.2.0 [2019-04-16]
+ 增加dev模式下服务启动和热更新，增加文件头注释。
+ 增加onprocess回调，用于显示录音时长。
+ 增加暂停和恢复的功能。
+ 增加pcm音频的导出功能。
+ 增加wav音频导出的功能。
+ 支持typescript。

### 0.1.0 [2019-04-14]
+ 包含基本功能，支持录音，停止和播放。