let Recorder = function() {
    this.config = {
        sampleBits: 16,         // 采样数位 8, 16
        sampleRate: 16000       // 采样率(1/6 44100)
    };
    this.player = null;
    this.size = 0;              // 录音文件总长度
    this.buffer = [];           // 录音缓存
    // 录音实时获取数据
    this.input = function (data) {
        // 记录数据，这儿的buffer是二维的
        this.buffer.push(new Float32Array(data));
        this.size += data.length;
        // 回调传出音频大小
        if (this.config.recorderProcess) {
            let voice = Math.abs(data[data.length - 1]);

            voice = Math.min(1, voice);
            this.config.recorderProcess(voice);
        }
    };
};
// 设置如采样位数的参数
Recorder.prototype.setOption = function(option) {
    // 修改采样率，采样位数配置
    Object.assign(this.config, option);  // 不兼容的话，用for in + hasOwnProperty 循环赋值
}
Recorder.prototype.ready = function(options) {
    if (options) {
        // 设置部分options
        this.setOption(options);
    }

    this.context = new (window.AudioContext || window.webkitAudioContext)();
    // 第一个参数表示收集采样的大小，采集完这么多后会触发 onaudioprocess 接口一次，该值一般为1024,2048,4096等，一般就设置为4096
    // 第二，三个参数分别是输入的声道数和输出的声道数，保持一致即可。
    this.createScript = this.context.createScriptProcessor || this.context.createJavaScriptNode;
    this.recorder = this.createScript.apply(this.context, [4096, 1, 1]);

    // 音频采集
    this.recorder.onaudioprocess = e => {   // 不兼容的话，直接用 function(){}，但注意 this 指向
        this.input(e.inputBuffer.getChannelData(0));
    }

    return navigator.mediaDevices.getUserMedia({
            audio: true
        }).then(stream => {
            // audioInput表示音频源节点
            // stream是通过navigator.getUserMedia获取的外部（如麦克风）stream音频输出，对于这就是输入
            this.audioInput = this.context.createMediaStreamSource(stream);
        }, error => {
            switch (error.code || error.name) {
                case 'PERMISSION_DENIED':
                case 'PermissionDeniedError':
                    Recorder.throwError('用户拒绝提供信息。');
                    break;
                case 'NOT_SUPPORTED_ERROR':
                case 'NotSupportedError':
                    Recorder.throwError('浏览器不支持硬件设备。');
                    break;
                case 'MANDATORY_UNSATISFIED_ERROR':
                case 'MandatoryUnsatisfiedError':
                    Recorder.throwError('无法发现指定的硬件设备。');
                    break;
                default:
                    Recorder.throwError('无法打开麦克风。异常信息:' + (error.code || error.name));
                    break;
            }
        });
};
// 清空
Recorder.prototype.clear = function() {
    this.buffer.length = 0;
    this.size = 0;
}
// 异常处理
Recorder.throwError = function (message) {
    throw new Error (message);
}
// 开始录音
Recorder.prototype.start = function() {
    // 清空数据
    this.clear();

    // audioInput 为声音源，连接到处理节点 recorder
    this.audioInput.connect(this.recorder);
    // 处理节点 recorder 连接到扬声器
    this.recorder.connect(this.context.destination);
    // 设置压缩参数
    this.inputSampleRate = this.context.sampleRate;     // 获取当前输入的采样率
    this.inputSampleBits = 16;                          // 输入采样数位 8, 16
    this.outputSampleRate = this.config.sampleRate;     // 输出采样率
    this.oututSampleBits = this.config.sampleBits;      // 输出采样数位 8, 16
};
// 停止录音
Recorder.prototype.stop = function () {
    this.recorder.disconnect();
}
// 播放到audio标签中
// 参数表示audio元素
Recorder.prototype.play = function (audio) {
    // audio.src = window.URL.createObjectURL(this.getWAVBlob());
    if (!this.player) {
        this.player = document.createElement('audio');
        document.body.appendChild(this.player);
    }
    this.player.src = window.URL.createObjectURL(this.getWAVBlob());
    this.player.play();
}
// 销毁，防止内存泄漏
Recorder.prototype.destory = function() {
    if (this.player) {
        document.body.removeChild(this.player);
        this.player = null;
    }

    this.clear();
};
// 获取PCM编码的二进制数据
Recorder.prototype.getPCM = function () {
    this.stop();

    return this.encodePCM();
}
// 获取不压缩的PCM格式的编码
Recorder.prototype.getPCMBlob = function() {
    return new Blob([ this.getPCM() ]);
}
// 获取WAV编码的二进制数据
Recorder.prototype.getWAV = function () {
    this.stop();

    return this.encodeWAV();
}
// 获取不压缩的WAV格式的编码
Recorder.prototype.getWAVBlob = function() {
    return new Blob([ this.getWAV() ], { type: 'audio/wav' });
}
// 数据合并压缩
// 根据输入和输出的采样率压缩数据，
// 比如输入的采样率是48k的，我们需要的是（输出）的是16k的，由于48k与16k是3倍关系，
// 所以输入数据中每隔3取1位
Recorder.prototype.compress = function () {
    // 合并
    var data = new Float32Array(this.size);
    var offset = 0; // 偏移量计算
    // 将二维数据，转成一维数据
    for (var i = 0; i < this.buffer.length; i++) {
        data.set(this.buffer[i], offset);
        offset += this.buffer[i].length;
    }
    // 压缩，根据采样率进行压缩
    var compression = parseInt(this.inputSampleRate / this.outputSampleRate);
    var length = data.length / compression;
    var result = new Float32Array(length);
    var index = 0, j = 0;
    // 循环间隔 compression 位取一位数据
    while (index < length) {
        result[index] = data[j];
        j += compression;
        index++;
    }
    // 返回压缩后的一维数据
    return result;
};
/**
 * 转换到我们需要的对应格式的编码
 * return {DataView}    pcm编码的数据
 */
Recorder.prototype.encodePCM = function() {
    let bytes = this.compress(),
        sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits),
        offset = 0,
        dataLength = bytes.length * (sampleBits / 8),
        buffer = new ArrayBuffer(dataLength),
        data = new DataView(buffer);

    // 写入采样数据 
    if (sampleBits === 8) {
        for (var i = 0; i < bytes.length; i++, offset++) {
            // 范围[-1, 1]
            var s = Math.max(-1, Math.min(1, bytes[i]));
            // 8位采样位划分成2^8=256份，它的范围是0-255; 16位的划分的是2^16=65536份，范围是-32768到32767
            // 因为我们收集的数据范围在[-1,1]，那么你想转换成16位的话，只需要对负数*32768,对正数*32767,即可得到范围在[-32768,32767]的数据。
            // 对于8位的话，负数*128，正数*127，然后整体向上平移128(+128)，即可得到[0,255]范围的数据。
            var val = s < 0 ? s * 128 : s * 127;
            val = parseInt(val + 128);
            data.setInt8(offset, val, true);
        }
    } else {
        for (var i = 0; i < bytes.length; i++, offset += 2) {
            var s = Math.max(-1, Math.min(1, bytes[i]));
            // 16位直接乘就行了
            data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }

    return data;
}
// 编码wav，一般wav格式是在pcm文件前增加44个字节的文件头，
// 所以，此处只需要在pcm数据前增加下就行了。
Recorder.prototype.encodeWAV = function() {
    var sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
    var sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
    var bytes = this.encodePCM();
    var buffer = new ArrayBuffer(44);
    var data = new DataView(buffer);

    var channelCount = 1;   // 单声道
    var offset = 0;

    // 资源交换文件标识符 
    writeString(data, offset, 'RIFF'); offset += 4;
    // 下个地址开始到文件尾总字节数,即文件大小-8 
    data.setUint32(offset, 36 + bytes.byteLength, true); offset += 4;
    // WAV文件标志
    writeString(data, offset, 'WAVE'); offset += 4;
    // 波形格式标志 
    writeString(data, offset, 'fmt '); offset += 4;
    // 过滤字节,一般为 0x10 = 16 
    data.setUint32(offset, 16, true); offset += 4;
    // 格式类别 (PCM形式采样数据) 
    data.setUint16(offset, 1, true); offset += 2;
    // 通道数 
    data.setUint16(offset, channelCount, true); offset += 2;
    // 采样率,每秒样本数,表示每个通道的播放速度 
    data.setUint32(offset, sampleRate, true); offset += 4;
    // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8 
    data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true); offset += 4;
    // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8 
    data.setUint16(offset, channelCount * (sampleBits / 8), true); offset += 2;
    // 每样本数据位数 
    data.setUint16(offset, sampleBits, true); offset += 2;
    // 数据标识符 
    writeString(data, offset, 'data'); offset += 4;
    // 采样数据总数,即数据总大小-44 
    data.setUint32(offset, bytes.byteLength, true); offset += 4;
    
    // 给pcm文件增加头
    data = combineDataView(DataView, data, bytes);

    return data;
}

/**
 * 在data中的offset位置开始写入str字符串
 * @param {TypedArrays} data 二进制数据
 * @param {String}      str  字符串
 */
function writeString(data, offset, str) {
    for (var i = 0; i < str.length; i++) {
        data.setUint8(offset + i, str.charCodeAt(i));
    }
}

/**
 * 合并二进制数据
 * @param {TypedArrays} resultConstructor   需要合并成的数据类型
 * @param {TypedArrays} ...arrays           需要合并的数据
 */
function combineDataView(resultConstructor, ...arrays) {
    let totalLength = 0,
        offset = 0;
    // 统计长度
    for (let arr of arrays) {
        totalLength += arr.length || arr.byteLength;
    }
    // 创建新的存放变量
    let buffer = new ArrayBuffer(totalLength),
        result = new resultConstructor(buffer);
    // 设置数据
    for (let arr of arrays) {
        // dataview合并
        for (let i = 0, len = arr.byteLength; i < len; ++i) {
            result.setInt8(offset, arr.getInt8(i));
            offset += 1;
        }
    }

    return result;
}


// export default Recorder;
