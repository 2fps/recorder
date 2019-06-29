# recorder
js audio recorder plugin.

> 主要用于Web端录制短音频。

+ 支持录音，暂停，恢复，和录音播放。
+ 支持音频数据的压缩，支持单双通道录音。
+ 支持录音时长显示。
+ 支持导出录音文件，格式为pcm或wav。
+ 支持录音波形显示，可自己定制。

## 使用
### 在线地址
[recorder](https://www.zhuyuntao.com/2019/06/18/recorder/)

### demo使用
```
npm ci (推荐) 或 npm install
npm run dev
```

#### 调试移动端
```
npm run https
```

### 编译
```
npm run build
```

### 使用方法
#### 引入方式
+ script标签方式

```
<script type="text/javascript" src="./dist/recorder.js"></script>

let recorder = new Recorder();
```
+ npm方式：

安装：
```
npm i js-audio-recorder
```
调用：
```
import Recorder from 'js-audio-recorder';

let recorder = new Recorder();
```

#### 基本用法
```
// 开始录音
recorder.start();
// 暂停录音
recorder.pause();
// 继续录音
recorder.resume()
// 结束录音
recorder.stop();
// 录音播放
recorder.play();
// 销毁录音实例，释放资源，fn为回调函数，
recorder.destroy(fn);
recorder = null;
```

#### 直接获取录音数据
```
// 获取 PCM 数据(Blob)
recorder.getPCMBlob();
// 获取 WAV 数据(Blob)
recorder.getWAVBlob();
```

#### 下载功能
```
// 下载pcm文件
recorder.downloadPCM();
// 下载wav文件
recorder.downloadWAV();
// 重命名pcm文件，wav也支持
recorder.downloadPCM('重命名');
```

#### 获取录音时长
```
// 回调持续输出时长
recorder.onprocess = function(duration) {
    console.log(duration);
}
// 手动获取录音时长
console.log(recorder.duration);
```

#### 录音波形显示
```
recorder.getRecordAnalyseData();
```
返回的是一个1024长的，0-255大小的Uint8Array类型。用户可以根据这些数据自定义录音波形。

#### 播放外部音频文件
```
Recorder.playAudio(/* 放入blob数据 */);
```
支持的音乐格式由浏览器的audio支持的类型决定。

#### 默认配置
sampleBits，采样位数，默认是16  
sampleRate，采样频率，浏览器默认的，我的chrome是48000  
numChannels，声道数，默认是1  

#### 传入参数
new Recorder时支持传入参数，
```
{
    sampleBits: 16,         // 采样位数，范围8或16
    sampleRate: 16000,      // 采样率，范围11025、16000、22050、24000、44100、48000
    numChannels: 1,         // 声道，范围1或2
}
```

### 任务列表
- [ ] 拆分recorder到各个功能模块。
- [x] 增加test代码。
- [ ] promise，支持async, await。
- [ ] 功能完善。
- [ ] 兼容性测试。

### 注意

1. 使用127.0.0.1或localhost尝试，因为getUserMedia在高版本的chrome下需要使用https。

### 兼容性

> 以下为测试结果，低于以下版本并不表示不支持，可能是未测试到，增加或标注请查看：[issues6](https://github.com/2fps/recorder/issues/6)

#### window pc端
|  ![Chrome](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/chrome_12-48/chrome_12-48_32x32.png)   |  ![Firefox](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/firefox_23-56/firefox_23-56_32x32.png)  |  ![Edge](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/edge/edge_32x32.png)  |  ![Safari](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/safari/safari_32x32.png)  | ![Opera](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/opera_15-32/opera_15-32_32x32.png) |  ![IE](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/internet-explorer_6/internet-explorer_6_32x32.png)  |
|  ----  | ---- | ---- | ---- | ---- | ---- |
| 38+ | 30+ | 42+ | 11+ | 21+ | 不支持 |

#### 移动端
| ![Chrome](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/chrome_12-48/chrome_12-48_32x32.png) | ![Firefox](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/firefox_23-56/firefox_23-56_32x32.png) | ![Safari](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/safari-ios/safari-ios_32x32.png) | ![Opera](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/opera_15-32/opera_15-32_32x32.png) | ![UC](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/uc/uc_32x32.png) | ![QQ](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/qq_2/qq_2_32x32.png) | ![猎豹](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/51.0.17/archive/cheetah/cheetah_32x32.png) | ![搜狗]() | ![华为]() | ![小米]() |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 58+ | 61+ | 11+ | 不支持 | 不支持 | 9.2+ | 不支持 | 不支持 | 不支持 | 未测试 |

> 需要打开浏览器录音权限，在设置-权限中可以配置。

### 其他资源

+ [webAudio播放本地音乐](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E6%92%AD%E6%94%BE%E6%9C%AC%E5%9C%B0%E9%9F%B3%E4%B9%90)
+ [webAudio制造噪音并播放](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%88%B6%E9%80%A0%E5%99%AA%E9%9F%B3%E5%B9%B6%E6%92%AD%E6%94%BE)
+ [web Audio实现pcm音频数据收集](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%AE%9E%E7%8E%B0pcm%E9%9F%B3%E9%A2%91%E6%95%B0%E6%8D%AE%E6%94%B6%E9%9B%86)
+ [js实现pcm数据编码](https://github.com/2fps/demo/tree/master/view/2019/04/js%E5%AE%9E%E7%8E%B0pcm%E6%95%B0%E6%8D%AE%E7%BC%96%E7%A0%81)
+ [基于阿里云实现简单的语音识别功能(node)](https://github.com/2fps/demo/tree/master/view/2019/01/%E5%9F%BA%E4%BA%8E%E9%98%BF%E9%87%8C%E4%BA%91%E5%AE%9E%E7%8E%B0%E7%AE%80%E5%8D%95%E7%9A%84%E8%AF%AD%E9%9F%B3%E8%AF%86%E5%88%AB%E5%8A%9F%E8%83%BD(node))
