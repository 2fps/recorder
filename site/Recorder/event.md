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
+ ~~所有的录音数据（data）~~。

```js
recorder.onprogress = function(params) {
    console.log('录音时长(秒)', params.duration);
    console.log('录音大小(字节)', params.fileSize);
    console.log('录音音量百分比(%)', params.vol);
    // console.log('当前录音的总数据([DataView, DataView...])', params.data);
}
```

## onplay

> 录音播放开始回调。

```js
recorder.onplay = () => {
    console.log('onplay')
}
```

## onpauseplay

> 录音播放暂停回调。

```js
recorder.onpauseplay = () => {
    console.log('onpauseplay')
}
```

## onresumeplay

> 录音播放恢复回调。

```js
recorder.onresumeplay = () => {
    console.log('onresumeplay')
}
```

## onstopplay

> 录音播放停止回调。

```js
recorder.onstopplay = () => {
    console.log('onstopplay')
}
```

## onplayend

> 录音播放完成回调。

```js
recorder.onplayend = () => {
    console.log('onplayend')
}
```

