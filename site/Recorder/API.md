# API

## 操作相关

### start()

> 开始录音。

+ 返回: Promise。

```js
recorder.start().then(() => {
    // 开始录音
}, (error) => {
    // 出错了
    console.log(`${error.name} : ${error.message}`);
});
```

### pause()
> 录音暂停。

+ 返回: void

``` js
recorder.pause();
```

### resume()
> 继续录音。

+ 返回: void。

``` js
recorder.resume()
```

### stop()
> 结束录音。

+ 返回: void。

``` js
recorder.stop();
```

### play()
> 录音播放。

+ 返回: void。

``` js
recorder.play();
```

### pausePlay()
> 暂停录音播放。

+ 返回: void。

```js
recorder.pausePlay();
```

### resumePlay()
> 恢复录音播发。

+ 返回: void。

```js
recorder.resumePlay();
```

### stopPlay()
> 停止播放。

+ 返回: void。

``` js
recorder.stopPlay();
```

### destroy()
> 销毁实例。

+ 返回: Promise。

``` js
// 销毁录音实例，置为null释放资源，fn为回调函数，
recorder.destroy().then(function() {
    recorder = null;
});
```

## 音频数据
### 录音结束，获取取录音数据
#### getPCMBlob()
> 获取 PCM 数据，在录音结束后使用。

+ 返回: Blob

**注：使用该方法会默认调用 stop() 方法。**

``` js
recorder.getPCMBlob();
```

#### getWAVBlob()
> 获取 WAV 数据，在录音结束后使用

+ 返回: Blob

**注：使用该方法会默认调用 stop() 方法。**

``` js
recorder.getWAVBlob();
```

### 录音结束，下载录音文件
#### downloadPCM([ filename ])
> 下载 PCM 格式

+ fileName String 重命名文件
+ 返回: Blob

**注：使用该方法会默认调用 stop() 方法。**

``` js
recorder.downloadPCM(fileName ?);
```

#### downloadWAV([ filename ])
> 下载 WAV 格式

+ fileName String 重命名文件
+ 返回: Blob

**注：使用该方法会默认调用 stop() 方法。**

### 录音中，获取录音数据
该方式为边录边转换，建议在 compiling 为 true 时使用。

#### getWholeData()
> 获取已经录音的所有数据。若没有开启边录边转(compiling为false)，则返回是空数组。

+ 返回: Array, 数组中是DataView数据

定时获取所有数据：
```js
setInterval(() => {
    recorder.getWholeData();
}, 1000)
```

#### getNextData()
> 获取前一次 getNextData() 之后的数据。若没有开启边录边转(compiling为false)，则返回是空数组。

+ 返回: Array, 数组中是DataView数据

定时获取新增数据：
```js
setInterval(() => {
    recorder.getNextData();
}, 1000)
// 实时录音，则可将该数据返回给服务端。
```

### 录音波形显示
#### getRecordAnalyseData()
> 返回的是一个1024长的，0-255大小的Uint8Array类型。用户可以根据这些数据自定义录音波形。

``` js
let dataArray = recorder.getRecordAnalyseData();
```

### 其他音频播放
#### playAudio(blob)
> 播放外部音频，格式由浏览器的audio支持的类型决定。


``` js
Recorder.playAudio(/* 放入blob数据 */);
```
