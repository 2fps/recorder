# Player
## Player 播放类

```js
import Player from './player/player';
```

用于协助播放录音文件，包括，开始、暂停、恢复、停止等功能。所支持的格式由浏览器的audio支持的类型决定。可单独使用。

### Player.play([arraybuffer])
> 播放外部的音频。所支持的格式由浏览器的audio支持的类型决定。

实际是调用了`decodeAudioData`实现音频播放。

``` js
Recorder.play(/* 放入arraybuffer数据 */);
```

### Player.pausePlay()
> 暂停播放。

### Player.resumePlay()
> 恢复播放。

### Player.stopPlay()
> 停止播放。

### Player.addPlayEnd(fn)
> 增加播放完成回调函数。

### Player.getPlayTime()
> 获取播放时间。

### Player.getAnalyseData()
> 获取回放录音的波形数据。
