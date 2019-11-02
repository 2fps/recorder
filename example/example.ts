import Recorder from '../src/recorder';

declare let document: any;

var oTime = document.getElementById('time'),
    oVolumn = document.getElementById('volumn'),
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
document.getElementById('pausePlay').addEventListener('click', pausePlay);
document.getElementById('resumePlay').addEventListener('click', resumePlay);
document.getElementById('stopPlay').addEventListener('click', stopPlay);
document.getElementById('destroyRecord').addEventListener('click', destroyRecord);
document.getElementById('downloadPCM').addEventListener('click', downloadPCM);
document.getElementById('downloadWAV').addEventListener('click', downloadWAV);
document.getElementById('uploadAudio').addEventListener('change', uploadAudio);

// 移动端事件
document.getElementById('startRecord').addEventListener('touch', startRecord);
document.getElementById('pauseRecord').addEventListener('touch', pauseRecord);
document.getElementById('resumeRecord').addEventListener('touch', resumeRecord);
document.getElementById('endRecord').addEventListener('touch', endRecord);
document.getElementById('playRecord').addEventListener('touch', playRecord);
document.getElementById('pausePlay').addEventListener('touch', pausePlay);
document.getElementById('resumePlay').addEventListener('touch', resumePlay);
document.getElementById('stopPlay').addEventListener('touch', stopPlay);
document.getElementById('destroyRecord').addEventListener('touch', destroyRecord);
document.getElementById('downloadPCM').addEventListener('touch', downloadPCM);
document.getElementById('downloadWAV').addEventListener('touch', downloadWAV);

// canvas背景初始化
initCanvasBg()

let playTimer = null;

// 配置获取
function collectData() {
    let sampleBits = document.querySelector('#sampleBits').value - 0
    let sampleRate = document.querySelector('#sampleRate').value - 0
    let numChannels = document.querySelector('#numChannels').value - 0
    let compiling = document.querySelector('#compiling').value - 0
    let playing = document.querySelector('#playing').value - 0

    if (playing) {
        document.querySelector('#compiling').selectedIndex = 1;
        compiling = 1
    }

    return {
        sampleBits,
        sampleRate,
        numChannels,
        compiling: !!compiling,
        playing: !!playing
    }
}

function clearPlay() {
    if (playTimer) {
        clearInterval(playTimer);
        playTimer = null;
    }
}

// 开始录音
async function startRecord() {
    clearPlay();

    if (!recorder) {
        let config = collectData();
        console.log(config);
        recorder = new Recorder({
            // 以下是默认配置
            sampleBits: config.sampleBits,
            sampleRate: config.sampleRate,  // 浏览器默认的输入采样率,
            numChannels: config.numChannels,
            compiling: config.compiling,       // 是否开启边录音边转化（后期改用web worker）
        });

        recorder.onprocess = function(duration) {
            // oTime.innerHTML = duration.toFixed(5);
            // 推荐使用 onprogress 
        }

        recorder.onprogress = function(params) {
            // 部分低版本浏览器不支持innerText，改用innerHTML
            oTime.innerHTML = params.duration.toFixed(5);
            oVolumn.innerHTML = params.vol.toFixed(2);
            // 此处控制数据的收集频率
            if (config.compiling) {
                console.log('音频总数据：', params.data);
            }
        }

        // 定时获取录音的数据并播放
        config.playing && (playTimer = setInterval(() => {
            if (!recorder) {
                return;
            }

            let newData = recorder.getNextData();
            if (!newData.length) {
                return;
            }
            let byteLength = newData[0].byteLength
            let buffer = new ArrayBuffer(newData.length * byteLength)
            let dataView = new DataView(buffer)

            // 数据合并
            for (let i = 0, iLen = newData.length; i < iLen; ++i) {
                for (let j = 0, jLen = newData[i].byteLength; j < jLen; ++j) {
                    dataView.setInt8(i * byteLength + j, newData[i].getInt8(j))
                }
            }

            // 将录音数据转成WAV格式，并播放
            let a = Recorder.encodeWAV(dataView, config.sampleRate, config.sampleRate, config.numChannels, config.sampleBits)
            let blob = new Blob([ a ], { type: 'audio/wav' });
            Recorder.playAudio(blob);
        }, 1000))
    }
    recorder.start().then(() => {
        console.log('开始录音');
    }, (error) => {
        console.log(`异常了,${error.name}:${error.message}`);
    });
    // 开始绘制canvas
    drawRecord();
}
// 暂停录音
function pauseRecord() {
    if (recorder) {
        recorder.pause();
        console.log('暂停录音');
    }
}
// 恢复录音
function resumeRecord() {
    recorder && recorder.resume();
    console.log('恢复录音');
}
// 结束录音
function endRecord (e) {
    recorder && recorder.stop();
    console.log('结束录音');
    drawRecordId && cancelAnimationFrame(drawRecordId);
    drawRecordId = null;
}
// 播放录音
function playRecord() {
    recorder && recorder.play();
    console.log('播放录音');
    drawRecordId && cancelAnimationFrame(drawRecordId);
    drawRecordId = null;
}
// 暂停播放
function pausePlay() {
    recorder && recorder.pausePlay();
    console.log('暂停播放');
}
// 恢复播放
function resumePlay() {
    recorder && recorder.resumePlay();
    console.log('恢复播放');
}
// 停止播放
function stopPlay() {
    clearPlay();
    recorder && recorder.stopPlay();
    console.log('停止播放');
}
// 销毁实例
function destroyRecord() {
    clearPlay();
    if (recorder) {
        recorder.destroy().then(function() {
            console.log('销毁实例');
            recorder = null;
            drawRecordId && cancelAnimationFrame(drawRecordId);
        });
    }
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
    let dataArray = recorder.getRecordAnalyseData(),
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


// fetch('http://127.0.0.1:9999/aa', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     // body: JSON.stringfy(data)
// }).then(res => res.json())
// .then(json => console.log(json))

// var xhr = new XMLHttpRequest()

// xhr.onreadystatechange = function(e) {
//     if (this.readyState == 4 && this.status == 200) {
//         debugger
//     }
  
// }
// xhr.open("POST", 'http://127.0.0.1:9999/aa',true);
// xhr.send(null);