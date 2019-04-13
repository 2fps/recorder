# recorder
原生js实现的web端录音

## 使用
### demo使用
```
npm install http-server -g
http-server (或双击example.html)
```
访问 http://127.0.0.1:8080/example.html

### 使用方法
#### 引入方式
+ script标签方式

直接引入dist下的recorder.js即可
```
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

#### 调用方法
```
// 开始录音
recorder.start();
// 结束录音
recorder.stop();
// 录音播放
recorder.play();
```

#### 传入参数
new Recorder时支持传入参数，
```
{
    sampleBits: 16,         // 采样位数
    sampleRate: 16000,      // 采样率
    numChannels: 1,         // 声道
}
```

### 注意

1. 使用127.0.0.1或localhost尝试，因为getUserMedia在高版本的chrome下需要使用https。

### 其他资源

+ [webAudio播放本地音乐](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E6%92%AD%E6%94%BE%E6%9C%AC%E5%9C%B0%E9%9F%B3%E4%B9%90)
+ [webAudio制造噪音并播放](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%88%B6%E9%80%A0%E5%99%AA%E9%9F%B3%E5%B9%B6%E6%92%AD%E6%94%BE)
+ [webAudio实现获取音频模拟信号数据](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%AE%9E%E7%8E%B0%E8%8E%B7%E5%8F%96%E9%9F%B3%E9%A2%91%E6%A8%A1%E6%8B%9F%E4%BF%A1%E5%8F%B7%E6%95%B0%E6%8D%AE)
+ [js实现音频模拟信号转数字信号](https://github.com/2fps/demo/tree/master/view/2019/04/js%E5%AE%9E%E7%8E%B0%E9%9F%B3%E9%A2%91%E6%A8%A1%E6%8B%9F%E4%BF%A1%E5%8F%B7%E8%BD%AC%E6%95%B0%E5%AD%97%E4%BF%A1%E5%8F%B7)
+ [基于阿里云实现简单的语音识别功能(node)](https://github.com/2fps/demo/tree/master/view/2019/01/%E5%9F%BA%E4%BA%8E%E9%98%BF%E9%87%8C%E4%BA%91%E5%AE%9E%E7%8E%B0%E7%AE%80%E5%8D%95%E7%9A%84%E8%AF%AD%E9%9F%B3%E8%AF%86%E5%88%AB%E5%8A%9F%E8%83%BD(node))

### 浏览器兼容性
主要是以下两方面：
+ Web Audio Api

[https://caniuse.com/#search=webaudio](https://caniuse.com/#search=webaudio)

+ getUserMedia

[https://caniuse.com/#search=getusermedia](https://caniuse.com/#search=getusermedia)