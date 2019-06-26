import Recorder from './recorder';

declare let document: any;
 
var oTime = document.getElementById('time'),
    recorder = null,
    oCanvas = document.getElementById("canvas"),        // 显示波形的canvas
    ctx = oCanvas.getContext("2d"),
    drawRecordId = null;

// 按钮事件绑定
document.getElementById('startRecord').addEventListener('click', startRecord);
document.getElementById('pauseRecord').addEventListener('click', pauseRecord);
document.getElementById('resumeRecord').addEventListener('click', resumeRecord);
document.getElementById('endRecord').addEventListener('click', endRecord);
document.getElementById('playRecord').addEventListener('click', playRecord);
document.getElementById('downloadPCM').addEventListener('click', downloadPCM);
document.getElementById('downloadWAV').addEventListener('click', downloadWAV);
document.getElementById('uploadAudio').addEventListener('change', uploadAudio);

// 移动端事件
document.getElementById('startRecord').addEventListener('touch', startRecord);
document.getElementById('pauseRecord').addEventListener('touch', pauseRecord);
document.getElementById('resumeRecord').addEventListener('touch', resumeRecord);
document.getElementById('endRecord').addEventListener('touch', endRecord);
document.getElementById('playRecord').addEventListener('touch', playRecord);
document.getElementById('downloadPCM').addEventListener('touch', downloadPCM);
document.getElementById('downloadWAV').addEventListener('touch', downloadWAV);

// canvas背景初始化
initCanvasBg()

// 开始录音
function startRecord() {
    if (!recorder) {
        recorder = new Recorder({
            // 以下是默认配置
            sampleBits: 16,
            // sampleRate: 浏览器默认的输入采样率,
            numChannels: 1,
        });

        recorder.onprocess = function(duration) {
            // 部分低版本浏览器不支持innerText，改用innerHTML
            oTime.innerHTML = duration.toFixed(5);
        }
    }
    recorder.start();
    // 开始绘制canvas
    drawRecord();
}
// 暂停录音
function pauseRecord() {
    recorder && recorder.pause();
}
// 恢复录音
function resumeRecord() {
    recorder && recorder.resume();
}
// 结束录音
function endRecord (e) {
    recorder && recorder.stop();
    drawRecordId && cancelAnimationFrame(drawRecordId);
    drawRecordId = null;
}
// 播放录音
function playRecord() {
    recorder && recorder.play();
    drawRecordId && cancelAnimationFrame(drawRecordId);
    drawRecordId = null;
}
// 下载pcm
function downloadPCM() {
    recorder && recorder.downloadPCM();
}
// 下载wav
function downloadWAV() {
    recorder && recorder.downloadWAV();
}
// canvas波形绘制函数
function drawRecord() {
    // 用requestAnimationFrame稳定60fps绘制
    drawRecordId = requestAnimationFrame(drawRecord);

    // 实时获取音频大小数据
    var dataArray = recorder.getRecordAnalyseData(),
        bufferLength = dataArray.length;

    // 填充背景色
    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.fillRect(0, 0, oCanvas.width, oCanvas.height);
    
    // 设定波形绘制颜色
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    
    ctx.beginPath();
    
    var sliceWidth = oCanvas.width * 1.0 / bufferLength, // 一个点占多少位置，共有bufferLength个点要绘制
        x = 0;          // 绘制点的x轴位置

    for (var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128.0;
        var y = v * oCanvas.height / 2;
    
        if (i === 0) {
            // 第一个点
            ctx.moveTo(x, y);
        } else {
            // 剩余的点
            ctx.lineTo(x, y);
        }
        // 依次平移，绘制所有点
        x += sliceWidth;
    }
    
    ctx.lineTo(oCanvas.width, oCanvas.height / 2);
    ctx.stroke();
}

// canvas背景初始化
function initCanvasBg() {
    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.fillRect(0, 0, oCanvas.width, oCanvas.height);
}

// 加载音频文件并播放
function uploadAudio(e) {
    Recorder.playAudio(this.files[0]);
}