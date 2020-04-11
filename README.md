# recorder
js audio recorder plugin.

![](https://travis-ci.org/2fps/recorder.svg?branch=master) ![](https://img.shields.io/npm/v/js-audio-recorder.svg) ![](https://img.shields.io/npm/dw/js-audio-recorder.svg)

> 主要用于Web端录制短音频。

+ 支持录音，暂停，恢复，和录音播放。
+ 支持音频数据的压缩，支持单双通道录音。
+ 支持录音时长、录音大小的显示。
+ ~~支持边录边转（播放）~~(0.x支持)。
+ 支持导出录音文件，格式为pcm或wav。
+ 支持录音波形显示，可自己定制。
+ 录音数据支持第三方平台的语音识别。
+ 支持MP3（借助[lamejs](https://github.com/zhuker/lamejs)）。

## 使用
### 在线演示地址
[Recorder](https://recorder.zhuyuntao.cn/)

### 在线文档

[文档](http://recorder.api.zhuyuntao.cn/)

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

详细请查看[文档](http://recorder.api.zhuyuntao.cn/)。

## 任务列表
- [x] 拆分recorder到各个功能模块。
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
