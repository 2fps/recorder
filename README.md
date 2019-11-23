# recorder
js audio recorder plugin.

![](https://travis-ci.org/2fps/recorder.svg?branch=master) ![](https://img.shields.io/npm/v/js-audio-recorder.svg) ![](https://img.shields.io/npm/dw/js-audio-recorder.svg)

> 主要用于Web端录制短音频。

+ 支持录音，暂停，恢复，和录音播放。
+ 支持音频数据的压缩，支持单双通道录音。
+ 支持录音时长、录音大小的显示。
+ 支持边录边转（播放）。
+ 支持导出录音文件，格式为pcm或wav。
+ 支持录音波形显示，可自己定制。
+ 录音数据支持第三方平台的语音识别。

## 使用
### 在线演示地址
[Recorder](https://recorder.zhuyuntao.cn/)

### 在线文档

[文档](http://vegetable.zhuyuntao.cn/Recorder/)

### demo使用
```
npm ci (推荐) 或 npm install
npm run dev
```

### 调试移动端
```
npm run https
```

### 编译
```
npm run build
```

### 使用方法
#### 引入方式
+ npm方式：

安装：
```
npm i js-audio-recorder
```
调用：
``` js
import Recorder from 'js-audio-recorder';

let recorder = new Recorder();
```
+ script标签方式

``` js
<script type="text/javascript" src="./dist/recorder.js"></script>

let recorder = new Recorder();
```

## API
### 初始化实例
可以配置输出数据参数，
``` js
let recorder = new Recorder({
    sampleBits: 16,         // 采样位数，支持 8 或 16，默认是16
    sampleRate: 16000,      // 采样率，支持 11025、16000、22050、24000、44100、48000，根据浏览器默认值，我的chrome是48000
    numChannels: 1,         // 声道，支持 1 或 2， 默认是1
    compiling: false,       // 是否边录边转换，默认是false
});
```
+ 返回: \<Recorder>

### 开始录音
``` js
recorder.start().then(() => {
    // 开始录音
}, (error) => {
    // 出错了
    console.log(`${error.name} : ${error.message}`);
});
```
+ 返回: Promise<{}>

### 录音暂停
``` js
// 暂停录音
recorder.pause();
```
+ 返回: void

### 继续录音
``` js
// 继续录音
recorder.resume()
```
+ 返回: void

仅支持暂停后，恢复录音。

### 结束录音
``` js
// 结束录音
recorder.stop();
```
+ 返回: void

### 录音播放
``` js
// 录音播放
recorder.play();
```
+ 返回: void

支持不结束直接调用录音播放。

### 暂停录音播放
```js
// 暂停录音播放
recorder.pausePlay();
```
+ 返回: void

### 恢复录音播发
```js
// 恢复录音播发
recorder.resumePlay();
```
+ 返回: void

### 停止播放
``` js
// 停止播放
recorder.stopPlay();
```
+ 返回: void

### 销毁实例
``` js
// 销毁录音实例，置为null释放资源，fn为回调函数，
recorder.destroy().then(function() {
    recorder = null;
});
```
+ 返回: Promise<{}>

### 直接获取录音数据
#### 获取 PCM 数据
``` js
// 获取 PCM 数据(Blob)
recorder.getPCMBlob();
```
+ 返回: \<Blob>

#### 获取 WAV 数据
``` js
// 获取 WAV 数据(Blob)
recorder.getWAVBlob();
```
+ 返回: \<Blob>

### 下载录音文件
#### 下载 PCM 格式
``` js
// 下载pcm文件
recorder.downloadPCM(fileName ?);
```
+ fileName \<String> 重命名文件
+ 返回: \<Blob>

#### 下载 WAV 格式
``` js
// 下载wav文件
recorder.downloadWAV(fileName ?);
```
+ fileName \<String> 重命名文件
+ 返回: \<Blob>

### 录音实时回调 获取录音数据
目前支持获取以下数据：

+ 录音时长（duration）。
+ 已录音文件大小(字节)（fileSize）。
+ 录音音量百分比（vol）。
+ 所有的录音数据（data）。

``` js
// 回调持续输出时长(当收集的栈满时触发)

// 不推荐使用
recorder.onprocess = function(duration) {
    console.log(duration);
}
// 推荐使用
recorder.onprogress = function(params) {
    console.log('录音时长', params.duration);
    console.log('已录音文件大小（字节）', params.fileSize);
    console.log('录音音量百分比', params.vol);
    console.log('当前录音的总数据', params.data);
}
// 手动获取录音总时长
console.log(recorder.duration);
// 手动获取已录音文件大小（字节）
console.log(recorder.fileSize);
```

注意：回调中不要进行太耗cpu的计算行为，以免造成性能问题。

### 边录边转换
现支持边录音边转换出对应的PCM数据。获取方式：

1. onprogress 回调，见录音回调函数
2. getWholeData() 和 getNextData() 方法。

#### getWholeData()
用于获取录音的整个数据，与 onprogress 回调中的 data 相同。若没有开启边录边转，则返回是空数组。

#### getNextData()
用于获取前一次 getNextData() 之后的数据。同样的，若没有开启边录边转，则返回是空数组。

注：demo操作见 example.ts 文件。

### 录音波形显示
``` js
let dataArray = recorder.getRecordAnalyseData();
```
返回的是一个1024长的，0-255大小的Uint8Array类型。用户可以根据这些数据自定义录音波形。

### 播放外部音频文件
``` js
Recorder.playAudio(/* 放入blob数据 */);
```
支持的音乐格式由浏览器的audio支持的类型决定。

## 任务列表
- [ ] 拆分recorder到各个功能模块。
- [x] 增加test代码。
- [x] promise，支持async, await。
- [ ] 功能完善。
- [x] 兼容性测试。
- [x] 支持边录音边转换(播放)。

## 注意

1. 使用127.0.0.1或localhost尝试，因为getUserMedia在高版本的chrome下需要使用https。

## 兼容性

> 以下为测试结果，低于以下版本并不表示不支持，可能是未测试到，增加或标注请查看：[issues6](https://github.com/2fps/recorder/issues/6)

### window pc端
|  ![Chrome](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/chrome_12-48/chrome_12-48_32x32.png)   |  ![Firefox](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/firefox_23-56/firefox_23-56_32x32.png)  |  ![Edge](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/edge/edge_32x32.png)  |  ![Safari](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/safari/safari_32x32.png)  | ![Opera](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/opera_15-32/opera_15-32_32x32.png) |  ![IE](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/internet-explorer_6/internet-explorer_6_32x32.png)  |
|  ----  | ---- | ---- | ---- | ---- | ---- |
| 38+ | 30+ | 42+ | 11+ | 21+ | 不支持 |

### 移动端
#### 安卓
| ![Chrome](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/chrome_12-48/chrome_12-48_32x32.png) | ![Firefox](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/firefox_23-56/firefox_23-56_32x32.png) | ![Safari](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/safari-ios/safari-ios_32x32.png) | ![Opera](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/opera_15-32/opera_15-32_32x32.png) | ![UC](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/uc/uc_32x32.png) | ![QQ](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/qq_2/qq_2_32x32.png) | ![猎豹](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/cheetah/cheetah_32x32.png) | ![搜狗]() | ![华为]() | ![小米]() |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 42+ | 40+ | ？ | 不支持 | 不支持 | 9.2+ | 不支持 | 不支持 | 不支持 | 不支持 |

#### IOS
| ![Chrome](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/chrome_12-48/chrome_12-48_32x32.png) | ![Firefox](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/firefox_23-56/firefox_23-56_32x32.png) | ![Safari](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/safari-ios/safari-ios_32x32.png) | ![Opera](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/opera_15-32/opera_15-32_32x32.png) | ![UC](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/uc/uc_32x32.png) | ![QQ](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/qq_2/qq_2_32x32.png) | ![猎豹](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/cheetah/cheetah_32x32.png) | ![搜狗]() | ![华为]() | ![小米]() |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| ？ | ？ | 11+ | ？ | ？ | ？ | ？ | ？ | ？ | ？ |

> 需要打开浏览器录音权限，在设置-权限中可以配置。

## 其他资源

+ [webAudio播放本地音乐](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E6%92%AD%E6%94%BE%E6%9C%AC%E5%9C%B0%E9%9F%B3%E4%B9%90)
+ [webAudio制造噪音并播放](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%88%B6%E9%80%A0%E5%99%AA%E9%9F%B3%E5%B9%B6%E6%92%AD%E6%94%BE)
+ [web Audio实现pcm音频数据收集](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%AE%9E%E7%8E%B0pcm%E9%9F%B3%E9%A2%91%E6%95%B0%E6%8D%AE%E6%94%B6%E9%9B%86)
+ [js实现pcm数据编码](https://github.com/2fps/demo/tree/master/view/2019/04/js%E5%AE%9E%E7%8E%B0pcm%E6%95%B0%E6%8D%AE%E7%BC%96%E7%A0%81)
+ [基于阿里云实现简单的语音识别功能(node)](https://github.com/2fps/demo/tree/master/view/2019/01/%E5%9F%BA%E4%BA%8E%E9%98%BF%E9%87%8C%E4%BA%91%E5%AE%9E%E7%8E%B0%E7%AE%80%E5%8D%95%E7%9A%84%E8%AF%AD%E9%9F%B3%E8%AF%86%E5%88%AB%E5%8A%9F%E8%83%BD(node))
