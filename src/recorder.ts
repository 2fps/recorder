// import * as lamejs from 'lamejs';

declare let window: any;
declare let Math: any;
declare let document: any;
declare let navigator: any;
declare let Promise: any;

// 构造函数参数格式
interface recorderConfig {
    sampleBits?: number,         // 采样位数
    sampleRate?: number,         // 采样率
    numChannels?: number,        // 声道数
}

interface dataview {
    byteLength: number,
    buffer: {
        byteLength: number,
    },
    getUint8: any,
}

class Recorder {
    private isrecording: boolean;               // 是否正在录音
    private ispause: boolean;                   // 是否是暂停
    private context: any;
    private config: recorderConfig;             // 配置
    private size: number;                       // 录音文件总长度
    private buffer: Array<Float32Array> = [];   // pcm音频数据搜集器
    private PCMData: any;                       // 存放解析完成的pcm数据
    private audioInput: any;
    private inputSampleRate: number;            // 输入采样率
    private source: any;                        // 音频输入
    private recorder: any;
    private inputSampleBits: number = 16;       // 输入采样位数
    private outputSampleRate: number;           // 输出采样率
    private oututSampleBits: number;            // 输出采样位数
    private analyser: any;
    private littleEdian: boolean;               // 是否是小端字节序
    private prevDomainData: any;                // 存放前一次图形化的数据

    public duration: number;                 // 录音时长
    // 正在录音时间，参数是已经录了多少时间了
    public onprocess: (duration: number) => void; 
    /**
     * @param {Object} options 包含以下三个参数：
     * sampleBits，采样位数，一般8,16，默认16
     * sampleRate，采样率，一般 11025、16000、22050、24000、44100、48000，默认为浏览器自带的采样率
     * numChannels，声道，1或2
     */
    constructor(options: recorderConfig = {}) {
        // 临时audioContext，为了获取输入采样率的
        let context = new (window.AudioContext || window.webkitAudioContext)();

        this.inputSampleRate = context.sampleRate;     // 获取当前输入的采样率
        // 配置config，检查值是否有问题
        this.config = {
            // 采样数位 8, 16
            sampleBits: ~[8, 16].indexOf(options.sampleBits) ? options.sampleBits : 16,
            // 采样率
            sampleRate: ~[11025, 16000, 22050, 24000, 44100, 48000].indexOf(options.sampleRate) ? options.sampleRate : this.inputSampleRate,
            // 声道数，1或2
            numChannels: ~[1, 2].indexOf(options.numChannels) ? options.numChannels : 1,
        };
        // 设置采样的参数
        this.outputSampleRate = this.config.sampleRate;     // 输出采样率
        this.oututSampleBits = this.config.sampleBits;      // 输出采样数位 8, 16
        // 判断端字节序
        this.littleEdian = (function() {
            var buffer = new ArrayBuffer(2);
            new DataView(buffer).setInt16(0, 256, true);
            return new Int16Array(buffer)[0] === 256;
        })();
    }

    /** 
     * 初始化录音实例
     */
    initRecorder(): void {
        if (this.context) {
            // 关闭先前的录音实例，因为前次的实例会缓存少量数据
            this.destroy();
        }
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        this.analyser = this.context.createAnalyser();  // 录音分析节点
        this.analyser.fftSize = 2048;                   // 表示存储频域的大小

        // 第一个参数表示收集采样的大小，采集完这么多后会触发 onaudioprocess 接口一次，该值一般为1024,2048,4096等，一般就设置为4096
        // 第二，三个参数分别是输入的声道数和输出的声道数，保持一致即可。
        let createScript = this.context.createScriptProcessor || this.context.createJavaScriptNode;
        this.recorder = createScript.apply(this.context, [4096, this.config.numChannels, this.config.numChannels]);

        // 兼容 getUserMedia
        this.initUserMedia();
        // 音频采集
        this.recorder.onaudioprocess = e => {
            if (!this.isrecording || this.ispause) {
                // 不在录音时不需要处理，FF 在停止录音后，仍会触发 audioprocess 事件
                return;
            } 
            // getChannelData返回Float32Array类型的pcm数据
            if (1 === this.config.numChannels) {
                let data = e.inputBuffer.getChannelData(0);
                // 单通道
                this.buffer.push(new Float32Array(data));
                this.size += data.length;
            } else {
                /*
                 * 双声道处理
                 * e.inputBuffer.getChannelData(0)得到了左声道4096个样本数据，1是右声道的数据，
                 * 此处需要组和成LRLRLR这种格式，才能正常播放，所以要处理下
                 */
                let lData = new Float32Array(e.inputBuffer.getChannelData(0)),
                    rData = new Float32Array(e.inputBuffer.getChannelData(1)),
                    // 新的数据为左声道和右声道数据量之和
                    buffer = new ArrayBuffer(lData.byteLength + rData.byteLength),
                    dData = new Float32Array(buffer),
                    offset = 0;

                for (let i = 0; i < lData.byteLength; ++i) {
                    dData[ offset ] = lData[i];
                    offset++;
                    dData[ offset ] = rData[i];
                    offset++;
                }

                this.buffer.push(dData);
                this.size += offset;
            }
            // 统计录音时长
            this.duration += 4096 / this.inputSampleRate;
            // 录音时长回调
            this.onprocess && this.onprocess(this.duration);
        }
    }

    /**
     * 开始录音
     *
     * @returns {void}
     * @memberof Recorder
     */
    start(): void {
        if (this.isrecording) {
            // 正在录音，则不允许
            return;
        }
        // 清空数据
        this.clear();
        this.initRecorder();
        this.isrecording = true;

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
            this.audioInput.connect(this.analyser);
            this.analyser.connect(this.recorder);
            // 处理节点 recorder 连接到扬声器
            this.recorder.connect(this.context.destination);
        });
    }
    
    /**
     * 暂停录音
     *
     * @memberof Recorder
     */
    pause(): void {
        if (this.isrecording && !this.ispause) {
            this.ispause = true;
            // 当前不暂停的时候才可以暂停
            this.recorder.disconnect();
        }
    }

    /**
     * 继续录音
     *
     * @memberof Recorder
     */
    resume(): void {
        if (this.isrecording && this.ispause) {
            this.ispause = false;
            // 暂停的才可以开始
            this.audioInput && this.audioInput.connect(this.analyser);
            this.analyser.connect(this.recorder);
            // 处理节点 recorder 连接到扬声器
            this.recorder.connect(this.context.destination);
        }
    }

    /**
     * 停止录音
     *
     * @memberof Recorder
     */
    stop(): void {
        this.isrecording = false;
        this.audioInput && this.audioInput.disconnect();
        this.recorder.disconnect();
    }

    /**
     * 播放录音
     *
     * @memberof Recorder
     */
    play(): void {
        this.stop();
        // 关闭前一次音频播放
        this.source && this.source.stop();

        this.context.decodeAudioData(this.getWAV().buffer, buffer => {
            this.source = this.context.createBufferSource();

            // 设置数据
            this.source.buffer = buffer;
            // connect到分析器，还是用录音的，因为播放时时不能录音的
            this.source.connect(this.analyser);
            this.analyser.connect(this.context.destination);
            this.source.start();
        }, function(e) {
            Recorder.throwError(e);
        });
    }

    /**
     * 获取当前录音的波形数据，
     * 调取频率由外部控制。
     * 
     * @memberof Recorder
     */
    getRecordAnalyseData() {
        if (this.ispause) {
            // 暂停时不需要发送录音的数据，处理FF下暂停仍就获取录音数据的问题
            // 为防止暂停后，画面空白，故返回先前的数据
            return this.prevDomainData;
        }
        let dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        // 将数据拷贝到dataArray中。
        this.analyser.getByteTimeDomainData(dataArray);

        return ( this.prevDomainData = dataArray);
    }

    /**
     * 获取录音播放时的波形数据，
     * 
     * @memberof Recorder
     */
    getPlayAnalyseData() {
        // 现在录音和播放不允许同时进行，所有复用的录音的analyser节点。
        return this.getRecordAnalyseData();
    }
    
    // getUserMedia 版本兼容
    private initUserMedia() {
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }
        
        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = function(constraints) {
                var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                
                if (!getUserMedia) {
                    return Promise.reject(new Error('浏览器不支持 getUserMedia !'));
                }
                
                return new Promise(function(resolve, reject) {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            }
        }
    }

    /**
     * 获取PCM编码的二进制数据(dataview)
     *
     * @returns {dataview}  PCM二进制数据
     * @memberof Recorder
     */
    private getPCM() {
        // 二维转一维
        let data = this.flat();
        // 压缩或扩展
        data = Recorder.compress(data, this.inputSampleRate, this.outputSampleRate);
        // 按采样位数重新编码
        return Recorder.encodePCM(data, this.oututSampleBits, this.littleEdian);
    }

    /**
     * 获取PCM格式的blob数据
     *
     * @returns { blob }  PCM格式的blob数据
     * @memberof Recorder
     */
    getPCMBlob() {
        return new Blob([ this.getPCM() ]);
    }

    /**
     * 下载录音pcm数据
     *
     * @param {string} [name='recorder']    重命名的名字
     * @memberof Recorder
     */
    downloadPCM(name: string = 'recorder'): void {
        // 先停止
        this.stop();
        let pcmBlob = this.getPCMBlob();
        
        this.download(pcmBlob, name, 'pcm');
    }

    /**
     * 获取WAV编码的二进制数据(dataview)
     *
     * @returns {dataview}  WAV编码的二进制数据
     * @memberof Recorder
     */
    private getWAV() {
        let pcmTemp = this.getPCM(),
            wavTemp = Recorder.encodeWAV(pcmTemp, this.inputSampleRate, 
                this.outputSampleRate, this.config.numChannels, this.oututSampleBits, this.littleEdian);

        return wavTemp;
    }

    /**
     * 获取WAV音频的blob数据
     *
     * @returns { blob }    wav格式blob数据
     * @memberof Recorder
     */
    getWAVBlob() {
        return new Blob([ this.getWAV() ], { type: 'audio/wav' });
    }

    /**
     * 下载录音的wav数据
     *
     * @param {string} [name='recorder']    重命名的名字
     * @memberof Recorder
     */
    downloadWAV(name: string = 'recorder'): void {
        // 先停止
        this.stop();
        let wavBlob = this.getWAVBlob();
        
        this.download(wavBlob, name, 'wav');
    }

    /**
     * 销毁录音对象
     * @param {*} fn        回调函数
     * @memberof Recorder
     */
    destroy(fn?): void {
        this.closeAudioContext().then(() => {
            fn && fn.call(this);
        });
    }

    /**
     * close兼容方案
     * 如firefox 30 等低版本浏览器没有 close方法
     */
    private closeAudioContext() {
        if (this.context.close) {
            return this.context.close();
        } else {
            return new Promise((resolve) => {
                resolve();
            });
        }
    }

    /**
     * 下载录音文件
     * @private
     * @param {*} blob      blob数据
     * @param {string} name 下载的文件名
     * @param {string} type 下载的文件后缀
     * @memberof Recorder
     */
    private download(blob, name: string, type: string): void {
        try {
            let oA = document.createElement('a');
            
            oA.href = window.URL.createObjectURL(blob);
            oA.download = name + '.' + type;
            oA.click();
        } catch(e) {
            Recorder.throwError(e);
        }
    }

    /**
     * 清空状态，重新开始录音（变量初始化）
     *
     * @private
     * @memberof Recorder
     */
    private clear(): void {
        this.buffer.length = 0;
        this.size = 0;
        this.PCMData = null;
        this.audioInput = null;
        this.duration = 0;
        this.ispause = false;

        // 录音前，关闭录音播放
        if (this.source) {
            this.source.stop();
            // 重新开启录制，由于新建了 AudioContext ，source需要清空，
            // 处理iphone 上 safari 浏览器 第二次播放报错的问题。
            this.source = null;
        }
    }

    /**
     * 将二维数组转一维
     * 
     * @private
     * @returns  {float32array}     音频pcm二进制数据
     * @memberof Recorder
     */
    private flat() {
        if (this.PCMData) {
            return this.PCMData;
        }
        // 合并
        let data = new Float32Array(this.size),
            offset = 0; // 偏移量计算

        // 将二维数据，转成一维数据
        for (let i = 0; i < this.buffer.length; i++) {
            data.set(this.buffer[i], offset);
            offset += this.buffer[i].length;
        }

        return this.PCMData = data;
    }

    /** 
     * 播放外部音乐文件
     * 
     * @param {float32array} blob    blob音频数据
     * @memberof Recorder
     */
    static playAudio(blob): void {
        let oAudio = document.createElement('audio');

        oAudio.src = window.URL.createObjectURL(blob);
        // 播放音乐
        oAudio.play();
    }

    /**
     * 数据合并压缩
     * 根据输入和输出的采样率压缩数据，
     * 比如输入的采样率是48k的，我们需要的是（输出）的是16k的，由于48k与16k是3倍关系，
     * 所以输入数据中每隔3取1位
     * 
     * @static
     * @param {float32array} data       [-1, 1]的pcm数据
     * @param {number} inputSampleRate  输入采样率
     * @param {number} outputSampleRate 输出采样率
     * @returns  {float32array}         压缩处理后的二进制数据
     * @memberof Recorder
     */
    static compress(data, inputSampleRate: number, outputSampleRate: number) {
        // 压缩，根据采样率进行压缩
        let compression = Math.max(Math.floor(inputSampleRate / outputSampleRate), 1),
            length = data.length / compression,
            result = new Float32Array(length),
            index = 0, j = 0;

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
     * 
     * @static
     * @param {float32array} bytes      pcm二进制数据
     * @param {number}  sampleBits      采样位数
     * @param {boolean} littleEdian     是否是小端字节序
     * @returns {dataview}              pcm二进制数据
     * @memberof Recorder
     */
    static encodePCM(bytes, sampleBits: number, littleEdian: boolean = true)  {
        let offset = 0,
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
                val = +val + 128;
                data.setInt8(offset, val);
            }
        } else {
            for (var i = 0; i < bytes.length; i++, offset += 2) {
                var s = Math.max(-1, Math.min(1, bytes[i]));
                // 16位的划分的是2^16=65536份，范围是-32768到32767
                // 因为我们收集的数据范围在[-1,1]，那么你想转换成16位的话，只需要对负数*32768,对正数*32767,即可得到范围在[-32768,32767]的数据。
                data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, littleEdian);
            }
        }
    
        return data;
    }

    /**
     * 编码wav，一般wav格式是在pcm文件前增加44个字节的文件头，
     * 所以，此处只需要在pcm数据前增加下就行了。
     * 
     * @static
     * @param {DataView} bytes           pcm二进制数据
     * @param {number}  inputSampleRate  输入采样率
     * @param {number}  outputSampleRate 输出采样率
     * @param {number}  numChannels      声道数
     * @param {number}  oututSampleBits  输出采样位数
     * @param {boolean} littleEdian      是否是小端字节序
     * @returns {DataView}               wav二进制数据
     * @memberof Recorder
     */
    static encodeWAV(bytes: dataview, inputSampleRate: number, outputSampleRate: number, numChannels: number, oututSampleBits: number, littleEdian: boolean = true) {
        let sampleRate = Math.min(inputSampleRate, outputSampleRate),
            sampleBits = oututSampleBits,
            buffer = new ArrayBuffer(44 + bytes.byteLength),
            data = new DataView(buffer),
            channelCount = numChannels, // 声道
            offset = 0;
    
        // 资源交换文件标识符
        writeString(data, offset, 'RIFF'); offset += 4;
        // 下个地址开始到文件尾总字节数,即文件大小-8
        data.setUint32(offset, 36 + bytes.byteLength, littleEdian); offset += 4;
        // WAV文件标志
        writeString(data, offset, 'WAVE'); offset += 4;
        // 波形格式标志
        writeString(data, offset, 'fmt '); offset += 4;
        // 过滤字节,一般为 0x10 = 16
        data.setUint32(offset, 16, littleEdian); offset += 4;
        // 格式类别 (PCM形式采样数据)
        data.setUint16(offset, 1, littleEdian); offset += 2;
        // 声道数
        data.setUint16(offset, channelCount, littleEdian); offset += 2;
        // 采样率,每秒样本数,表示每个通道的播放速度
        data.setUint32(offset, sampleRate, littleEdian); offset += 4;
        // 波形数据传输率 (每秒平均字节数) 声道数 × 采样频率 × 采样位数 / 8
        data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), littleEdian); offset += 4;
        // 快数据调整数 采样一次占用字节数 声道数 × 采样位数 / 8
        data.setUint16(offset, channelCount * (sampleBits / 8), littleEdian); offset += 2;
        // 采样位数
        data.setUint16(offset, sampleBits, littleEdian); offset += 2;
        // 数据标识符
        writeString(data, offset, 'data'); offset += 4;
        // 采样数据总数,即数据总大小-44
        data.setUint32(offset, bytes.byteLength, littleEdian); offset += 4;
        
        // 给wav头增加pcm体
        for (let i = 0; i < bytes.byteLength;) {
            data.setUint8(offset, bytes.getUint8(i));
            offset++;
            i++;
        }
    
        return data;
    }

    /**
     * 异常处理
     * @static
     * @param {*} message   错误消息
     * @memberof Recorder
     */
    static throwError(message) {
        throw new Error (message);
    }
}

/**
 * 在data中的offset位置开始写入str字符串
 * @param {TypedArrays} data    二进制数据
 * @param {Number}      offset  偏移量
 * @param {String}      str     字符串
 */
function writeString(data, offset, str): void {
    for (var i = 0; i < str.length; i++) {
        data.setUint8(offset + i, str.charCodeAt(i));
    }
}

export default Recorder;