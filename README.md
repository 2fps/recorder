# recorder
js audio recorder plugin.

+ 支持录音，暂停，恢复，和录音播放。
+ 支持录音时长显示。
+ 支持导出录音文件，格式为pcm或wav。
+ 支持录音波形显示，可自己定制。

## 使用
### demo使用
```
npm ci 或 npm i
npm run dev
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

### 注意

1. 使用127.0.0.1或localhost尝试，因为getUserMedia在高版本的chrome下需要使用https。

### 浏览器兼容性
主要是以下几个方面：
+ Web Audio Api

[https://caniuse.com/#search=webaudio](https://caniuse.com/#search=webaudio)

+ getUserMedia

[https://caniuse.com/#search=getusermedia](https://caniuse.com/#search=getusermedia)

+ Typed Arrays

[https://caniuse.com/#search=typedarrays](https://caniuse.com/#search=typedarrays)

### 其他资源

+ [webAudio播放本地音乐](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E6%92%AD%E6%94%BE%E6%9C%AC%E5%9C%B0%E9%9F%B3%E4%B9%90)
+ [webAudio制造噪音并播放](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%88%B6%E9%80%A0%E5%99%AA%E9%9F%B3%E5%B9%B6%E6%92%AD%E6%94%BE)
+ [web Audio实现pcm音频数据收集](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%AE%9E%E7%8E%B0pcm%E9%9F%B3%E9%A2%91%E6%95%B0%E6%8D%AE%E6%94%B6%E9%9B%86)
+ [js实现pcm数据编码](https://github.com/2fps/demo/tree/master/view/2019/04/js%E5%AE%9E%E7%8E%B0pcm%E6%95%B0%E6%8D%AE%E7%BC%96%E7%A0%81)
+ [基于阿里云实现简单的语音识别功能(node)](https://github.com/2fps/demo/tree/master/view/2019/01/%E5%9F%BA%E4%BA%8E%E9%98%BF%E9%87%8C%E4%BA%91%E5%AE%9E%E7%8E%B0%E7%AE%80%E5%8D%95%E7%9A%84%E8%AF%AD%E9%9F%B3%E8%AF%86%E5%88%AB%E5%8A%9F%E8%83%BD(node))
