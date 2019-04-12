class Recorder {
    /**
     * @param {Object} options 包含以下三个参数：
     * sampleBits，采样位数，一般8,16
     * sampleRate，采样率，一般 11025、22050、24000、44100、48000
     * numChannels，声道，1或2
     */
    constructor(options = {}) {
        // 配置config，检查值是否有问题
        this.config = {
            // 采样数位 8, 16
            sampleBits: [8, 16].includes(options.sampleBits) ? options.sampleBits : 16,
            // 采样率(16000)
            sampleRate: [11025, 22050, 24000, 44100, 48000].includes(options.sampleRate) ? options.sampleRate : 16000,
            // 声道数，1或2
            numChannels: [1, 2].includes(options.numChannels) ? options.numChannels : 1,
        };
        this.size = 0;              // 录音文件总长度
        this.buffer = [];           // 录音缓存
        this.PCMData = null;        // 存储转换后的pcm数据
        this.audioInput = null;

        this.context = new (window.AudioContext || window.webkitAudioContext)();
        // 第一个参数表示收集采样的大小，采集完这么多后会触发 onaudioprocess 接口一次，该值一般为1024,2048,4096等，一般就设置为4096
        // 第二，三个参数分别是输入的声道数和输出的声道数，保持一致即可。
        this.createScript = this.context.createScriptProcessor || this.context.createJavaScriptNode;
        this.recorder = this.createScript.apply(this.context, [4096, this.config.numChannels, this.config.numChannels]);

        // 音频采集
        this.recorder.onaudioprocess = e => {
            // getChannelData返回Float32Array类型的pcm数据
            for (let i = 0; i < this.config.numChannels; ++i) {
                let data = e.inputBuffer.getChannelData(i);
                // 收集音频数据，这儿的buffer是二维的
                this.buffer.push(new Float32Array(data));
                this.size += data.length;
            }
        }
    }

    // 开始录音
    start() {
        // 清空数据
        this.clear();

        navigator.mediaDevices.getUserMedia({
            audio: true
        }).then(stream => {
            // audioInput表示音频源节点
            // stream是通过navigator.getUserMedia获取的外部（如麦克风）stream音频输出，对于这就是输入
            this.audioInput = this.context.createMediaStreamSource(stream);
        }, error => {
            // 抛出异常
            Recorder.throwError(error.name + " : " + error.message);
        }).then(() => {
            // audioInput 为声音源，连接到处理节点 recorder
            this.audioInput.connect(this.recorder);
            // 处理节点 recorder 连接到扬声器
            this.recorder.connect(this.context.destination);
            // 设置压缩参数
            this.inputSampleRate = this.context.sampleRate;     // 获取当前输入的采样率
            this.inputSampleBits = 16;                          // 输入采样数位 8, 16
            this.outputSampleRate = this.config.sampleRate;     // 输出采样率
            this.oututSampleBits = this.config.sampleBits;      // 输出采样数位 8, 16
        });
    }

    // 停止录音
    stop() {
        this.audioInput && this.audioInput.disconnect();
        this.recorder.disconnect();
    }

    // 清空
    clear() {
        this.buffer.length = 0;
        this.size = 0;
        this.PCMData = null;

        if (this.source) {
            // 录音前，关闭录音播放
            this.source.disconnect();
            this.source = null;
        }
    }

    // 播放声音
    play() {
        this.context.decodeAudioData(this.encodeWAV().buffer, buffer => {
            this.source = this.context.createBufferSource();

            // 设置数据
            this.source.buffer = buffer;
            // connect到扬声器
            this.source.connect(this.context.destination);
            this.source.start();
        }, function() {
            console.log('error');
        });
    }

    // 销毁，防止内存泄漏
    destory() {    
        this.clear();
    }

    // 获取PCM编码的二进制数据
    getPCM() {
        this.stop();
        // 利用存储的PCMData，节省性能
        return this.PCMData || ( this.PCMData = this.encodePCM() );
    }

    // 获取不压缩的PCM格式的编码
    getPCMBlob() {
        return new Blob([ this.getPCM() ]);
    }

    // 获取WAV编码的二进制数据
    getWAV() {
        this.stop();
    
        return this.encodeWAV();
    }

    // 获取不压缩的WAV格式的编码
    getWAVBlob() {
        return new Blob([ this.getWAV() ], { type: 'audio/wav' });
    }

    // 压缩pcm数据
    compressPCM() {
        // toDo..
    }

    // 将二维数组转一维
    flat() {
        // 合并
        let data = new Float32Array(this.size),
            offset = 0; // 偏移量计算
        // 将二维数据，转成一维数据
        for (let i = 0; i < this.buffer.length; i++) {
            data.set(this.buffer[i], offset);
            offset += this.buffer[i].length;
        }

        return data;
    }

    // 数据合并压缩
    // 根据输入和输出的采样率压缩数据，
    // 比如输入的采样率是48k的，我们需要的是（输出）的是16k的，由于48k与16k是3倍关系，
    // 所以输入数据中每隔3取1位
    compress() {
        let data = this.flat();
        // 压缩，根据采样率进行压缩
        var compression = parseInt(this.inputSampleRate / this.outputSampleRate, 10) || 1;
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
    }

    /**
     * 转换到我们需要的对应格式的编码
     * return {DataView}    pcm编码的数据
     */
    encodePCM() {
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
                // 8位采样位划分成2^8=256份，它的范围是0-255; 
                // 对于8位的话，负数*128，正数*127，然后整体向上平移128(+128)，即可得到[0,255]范围的数据。
                var val = s < 0 ? s * 128 : s * 127;
                val = parseInt(val + 128);
                data.setInt8(offset, val, true);
            }
        } else {
            for (var i = 0; i < bytes.length; i++, offset += 2) {
                var s = Math.max(-1, Math.min(1, bytes[i]));
                // 16位的划分的是2^16=65536份，范围是-32768到32767
                // 因为我们收集的数据范围在[-1,1]，那么你想转换成16位的话，只需要对负数*32768,对正数*32767,即可得到范围在[-32768,32767]的数据。
                data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        }
    
        return data;
    }

    // 编码wav，一般wav格式是在pcm文件前增加44个字节的文件头，
    // 所以，此处只需要在pcm数据前增加下就行了。
    encodeWAV() {
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
        data = combineDataView(data, bytes);
    
        return data;
    }
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
 * 合并数据
 * @param {TypedArrays} ...arrays           需要合并的数据
 */
function combineDataView(...arrays) {
    let totalLength = 0,
        offset = 0;
    // 统计长度
    for (let arr of arrays) {
        totalLength += arr.length || arr.byteLength;
    }
    // 创建新的存放变量
    let buffer = new ArrayBuffer(totalLength),
        result = new DataView(buffer);
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


/** 
 * 通用方法
 */
// 异常处理
Recorder.throwError = function(message) {
    throw new Error (message);
}

export default Recorder;
