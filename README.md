# recorder
原生js实现的web端录音

### 安装依赖
```
npm install
npm install http-server -g
```

### 运行环境
```
http-server (或双击index.html)
```
### 浏览器访问
http://127.0.0.1:8080/

### 代码结构
index.html 为demo入口

### 代码编译
生成开发环境代码：
```
npm run dev
```

生成生产环境代码：
```
npm run build
```

### 注意

1. 使用127.0.0.1或localhost尝试，因为getUserMedia在高版本的chrome下需要使用https。

### 其他资源

+ [webAudio播放本地音乐](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E6%92%AD%E6%94%BE%E6%9C%AC%E5%9C%B0%E9%9F%B3%E4%B9%90)
+ [webAudio制造噪音并播放](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%88%B6%E9%80%A0%E5%99%AA%E9%9F%B3%E5%B9%B6%E6%92%AD%E6%94%BE)
+ [webAudio实现获取音频模拟信号数据](https://github.com/2fps/demo/tree/master/view/2019/04/webAudio%E5%AE%9E%E7%8E%B0%E8%8E%B7%E5%8F%96%E9%9F%B3%E9%A2%91%E6%A8%A1%E6%8B%9F%E4%BF%A1%E5%8F%B7%E6%95%B0%E6%8D%AE)
+ [js实现音频模拟信号转数字信号](https://github.com/2fps/demo/tree/master/view/2019/04/js%E5%AE%9E%E7%8E%B0%E9%9F%B3%E9%A2%91%E6%A8%A1%E6%8B%9F%E4%BF%A1%E5%8F%B7%E8%BD%AC%E6%95%B0%E5%AD%97%E4%BF%A1%E5%8F%B7)
+ [基于阿里云实现简单的语音识别功能(node)](https://github.com/2fps/demo/tree/master/view/2019/01/%E5%9F%BA%E4%BA%8E%E9%98%BF%E9%87%8C%E4%BA%91%E5%AE%9E%E7%8E%B0%E7%AE%80%E5%8D%95%E7%9A%84%E8%AF%AD%E9%9F%B3%E8%AF%86%E5%88%AB%E5%8A%9F%E8%83%BD(node))