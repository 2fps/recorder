# 属性
## 实例初始化

可以配置输出数据参数，
``` js
let recorder = new Recorder({
    sampleBits: 16,         // 采样位数，支持 8 或 16，默认是16
    sampleRate: 16000,      // 采样率，支持 11025、16000、22050、24000、44100、48000，根据浏览器默认值，我的chrome是48000
    numChannels: 1,         // 声道，支持 1 或 2， 默认是1
    compiling: false,       // 是否边录边转换，默认是false
});
```
+ 返回: recorder实例。

### sampleBits
> 采样位数。

### sampleRate
> 采样率。

### numChannels
> 声道数。

### compiling
> 是否边录音边转换。

获取数据方法：
+ 回调方式

```js
recorder.onprogress = function(params) {
    console.log(params.data);       // 当前获取到到音频数据
}
```

data，DataView型数组，格式如 [DataView, DataView, DataView ...] 。

+ 主动获取

```js
getWholeData();     // [DataView, DataView, DataView ...]

getNextData();      // [DataView, DataView, DataView ...]
```

getWholeData() 的值和`onprogress`回调中的data数据一致。

getNextData() 获取的是前一次 getNextData() 之后的值，他只是data数据的一小部分。


## 实例属性

### duration
> 获取录音的总时长。

```js
console.log(recorder.duration);
```

### fileSize
> 录音文件大小（单位：字节）。

```js
console.log(recorder.fileSize);
```

