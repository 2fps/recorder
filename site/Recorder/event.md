# Event
js-audio-recorder 支持的事件回调。

## ~~onprocess(duration)~~
> 用于获取录音时长。

**不推荐使用，用onprogress代替。**

```js
recorder.onprocess = function(duration) {
    console.log(duration);
}
```

## onprogress(duration)

目前支持获取以下数据：

+ 录音时长（duration）。
+ 录音大小（fileSize）。
+ 录音音量百分比（vol）。
+ 所有的录音数据（data）。

```js
recorder.onprogress = function(params) {
    console.log('录音时长(秒)', params.duration);
    console.log('录音大小(字节)', params.fileSize);
    console.log('录音音量百分比(%)', params.vol);
    console.log('当前录音的总数据([DataView, DataView...])', params.data);
}
```

