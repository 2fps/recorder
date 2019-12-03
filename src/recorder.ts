declare let window: any;
declare let Math: any;
declare let document: any;
declare let navigator: any;
declare let Promise: any;

// 构造函数参数格式
interface recorderConfig {
    sampleBits?: number,        // 采样位数
    sampleRate?: number,        // 采样率
    numChannels?: number,       // 声道数
    compiling?: boolean,        // 是否边录边播
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
    private isplaying: boolean = false;         // 是否正在播放
    private ispause: boolean;                   // 是否是暂停
    private context: any;
    private config: recorderConfig;             // 配置
    private size: number;                       // 录音文件总长度
    private lBuffer: Array<Float32Array> = [];  // pcm音频数据搜集器(左声道)
    private rBuffer: Array<Float32Array> = [];  // pcm音频数据搜集器(右声道)
    private PCM: any;                           // 最终的PCM数据缓存，避免多次encode
    private tempPCM: Array<DataView> = [];      // 边录边转时临时存放pcm的
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
    private playStamp: number = 0;              // 播放录音时 AudioContext 记录的时间戳
    private playTime: number = 0;               // 记录录音播放时长
    private offset: number = 0;                 // 边录边转，记录外部的获取偏移位置
    private stream: any                         // 流

    public fileSize: number = 0;                // 录音大小，byte为单位
    public duration: number;                    // 录音时长
    // 正在录音时间，参数是已经录了多少时间了
    public onprocess: (duration: number) => void;
    // onprocess 替代函数，保持原来的 onprocess 向下兼容
    public onprogress: (payload: {
        duration: number,
        fileSize: number,
        vol: number,
        data: Array<DataView>,      // 当前存储的所有录音数据
    }) => void;
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
            // 是否需要边录边转，默认关闭，后期使用web worker
            compiling: !!options.compiling || false,
        };
        // 设置采样的参数
        this.outputSampleRate = this.config.sampleRate;     // 输出采样率
        this.oututSampleBits = this.config.sampleBits;      // 输出采样数位 8, 16
        // 判断端字节序
        this.littleEdian = (function() {
            let buffer = new ArrayBuffer(2);
            new DataView(buffer).setInt16(0, 256, true);
            return new Int16Array(buffer)[0] === 256;
        })();
        // 兼容 getUserMedia
        this.initUserMedia();
    }

    /** 
     * 初始化录音实例
     */
    initRecorder(): void {
        if (this.context) {
            // 关闭先前的录音实例，因为前次的实例会缓存少量前次的录音数据
            this.destroy();
        }
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        this.analyser = this.context.createAnalyser();  // 录音分析节点
        this.analyser.fftSize = 2048;                   // 表示存储频域的大小

        // 第一个参数表示收集采样的大小，采集完这么多后会触发 onaudioprocess 接口一次，该值一般为1024,2048,4096等，一般就设置为4096
        // 第二，三个参数分别是输入的声道数和输出的声道数，保持一致即可。
        let createScript = this.context.createScriptProcessor || this.context.createJavaScriptNode;
        this.recorder = createScript.apply(this.context, [4096, this.config.numChannels, this.config.numChannels]);

        // 音频采集
        this.recorder.onaudioprocess = e => {
            if (!this.isrecording || this.ispause) {
                // 不在录音时不需要处理，FF 在停止录音后，仍会触发 audioprocess 事件
                return;
            }
            // 左声道数据
            // getChannelData返回Float32Array类型的pcm数据
            let lData = e.inputBuffer.getChannelData(0),
                rData = null,
                vol = 0;        // 音量百分比

            this.lBuffer.push(new Float32Array(lData));

            this.size += lData.length;

            // 判断是否有右声道数据
            if (2 === this.config.numChannels) {
                rData = e.inputBuffer.getChannelData(1);
                this.rBuffer.push(new Float32Array(rData));

                this.size += rData.length;
            }

            // 边录边转处理
            if (this.config.compiling) {
                let pcm = this.transformIntoPCM(lData, rData);

                this.tempPCM.push(pcm);
                // 计算录音大小
                this.fileSize = pcm.byteLength * this.tempPCM.length;
            } else {
                // 计算录音大小
                this.fileSize = Math.floor(this.size / Math.max( this.inputSampleRate / this.outputSampleRate, 1))
                    * (this.oututSampleBits / 8)
            }
            // 为何此处计算大小需要分开计算。原因是先录后转时，是将所有数据一起处理，边录边转是单个 4096 处理，
            // 有小数位的偏差。

            // 计算音量百分比
            vol = Math.max.apply(Math, lData) * 100;
            // 统计录音时长
            this.duration += 4096 / this.inputSampleRate;
            // 录音时长回调
            this.onprocess && this.onprocess(this.duration);
            // 录音时长及响度回调
            this.onprogress && this.onprogress({
                duration: this.duration,
                fileSize: this.fileSize,
                vol,
                data: this.tempPCM,     // 当前所有的pcm数据，调用者控制增量
            });
        }
    }

    /**
     * 开始录音
     *
     * @returns {Promise<{}>}
     * @memberof Recorder
     */
    start(): Promise<{}> {
        if (this.isrecording) {
            // 正在录音，则不允许
            return;
        }
        // 清空数据
        this.clear();
        this.initRecorder();
        this.isrecording = true;

        return navigator.mediaDevices.getUserMedia({
            audio: true
        }).then(stream => {
            // audioInput表示音频源节点
            // stream是通过navigator.getUserMedia获取的外部（如麦克风）stream音频输出，对于这就是输入
            this.audioInput = this.context.createMediaStreamSource(stream);
            this.stream = stream;
        }/* 报错丢给外部使用者catch，后期可在此处增加建议性提示
            , error => {
            // 抛出异常
            Recorder.throwError(error.name + " : " + error.message);
        } */).then(() => {
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

        this.isplaying = true;
        this.playTime = 0;

        this.playAudioData();
    }

    /**
     * 暂停播放录音
     *
     * @memberof Recorder
     */
    pausePlay(): void {
        if (this.isrecording || !this.isplaying) {
            // 正在录音或没有播放，暂停无效
            return;
        }

        this.source && this.source.disconnect();
        // 多次暂停需要累加
        this.playTime += this.context.currentTime - this.playStamp;
        this.isplaying = false;
    }

    /**
     * 恢复播放录音
     *
     * @memberof Recorder
     */
    resumePlay(): void {
        if (this.isrecording || this.isplaying || 0 === this.playTime) {
            // 正在录音或已经播放或没开始播放，恢复无效
            return;
        }

        this.isplaying = true;
        this.playAudioData();
    }

    /**
     * 停止播放
     *
     * @memberof Recorder
     */
    stopPlay(): void {
        if (this.isrecording) {
            // 正在录音，停止录音播放无效
            return;
        }

        this.playTime = 0;
        this.isplaying = false;
        this.source && this.source.stop();
    }

    /**
     * 获取当前已经录音的PCM音频数据
     *
     * @returns[DataView]
     * @memberof Recorder
     */
    getWholeData() {
        return this.tempPCM;
    }

    /**
     * 获取余下的新数据，不包括 getNextData 前一次获取的数据
     *
     * @returns [DataView]
     * @memberof Recorder
     */
    getNextData() {
        let length = this.tempPCM.length,
            data = this.tempPCM.slice(this.offset);

        this.offset = length;

        return data;
    }

    /**
     * 利用 decodeAudioData播放录音数据，每次播放都需创建，因为buffersource只能被使用一次
     *
     * @private
     * @memberof Recorder
     */
    private playAudioData(): void {
        this.context.decodeAudioData(this.getWAV().buffer, buffer => {
            this.source = this.context.createBufferSource();

            // 设置数据
            this.source.buffer = buffer;
            // connect到分析器，还是用录音的，因为播放时不能录音的
            this.source.connect(this.analyser);
            this.analyser.connect(this.context.destination);
            this.source.start(0, this.playTime);

            // 记录当前的时间戳，以备暂停时使用
            this.playStamp = this.context.currentTime;
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
                let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                
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
        if (this.tempPCM.length) {
            // 优先使用边录边存下的
            // 将存下的 DataView 数据合并了
            let buffer = new ArrayBuffer( this.tempPCM.length * this.tempPCM[0].byteLength ),
                pcm = new DataView(buffer),
                offset = 0;

            // 遍历存储数据
            this.tempPCM.forEach((block) => {
                for (let i = 0, len = block.byteLength; i < len; ++i) {
                    pcm.setInt8(offset, block.getInt8(i));

                    offset++;
                }
            });
            // 最终的PCM数据已经有了，temp不需要了
            this.PCM = pcm;
            this.tempPCM = [];
        }
        if (this.PCM) {
            // 给缓存
            return this.PCM;
        }
        // 二维转一维
        let data: any = this.flat();
        // 压缩或扩展
        data = Recorder.compress(data, this.inputSampleRate, this.outputSampleRate);
        // 按采样位数重新编码
        return this.PCM = Recorder.encodePCM(data, this.oututSampleBits, this.littleEdian);
    }

    /**
     * 获取PCM格式的blob数据
     *
     * @returns { blob }  PCM格式的blob数据
     * @memberof Recorder
     */
    getPCMBlob() {
        // 先停止
        this.stop();
        return new Blob([ this.getPCM() ]);
    }

    /**
     * 下载录音pcm数据
     *
     * @param {string} [name='recorder']    重命名的名字
     * @memberof Recorder
     */
    downloadPCM(name: string = 'recorder'): void {
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
        // 先停止
        this.stop();
        return new Blob([ this.getWAV() ], { type: 'audio/wav' });
    }

    /**
     * 下载录音的wav数据
     *
     * @param {string} [name='recorder']    重命名的名字
     * @memberof Recorder
     */
    downloadWAV(name: string = 'recorder'): void {
        let wavBlob = this.getWAVBlob();
        
        this.download(wavBlob, name, 'wav');
    }

    /**
     * 将获取到到左右声道的Float32Array数据编码转化
     *
     * @param {Float32Array} lData  左声道数据
     * @param {Float32Array} rData  有声道数据
     * @returns DataView
     */
    private transformIntoPCM(lData, rData) {
        let lBuffer = new Float32Array(lData),
            rBuffer = new Float32Array(rData);

        let data = Recorder.compress({
            left: lBuffer,
            right: rBuffer,
        }, this.inputSampleRate, this.outputSampleRate);

        return Recorder.encodePCM(data, this.oututSampleBits, this.littleEdian);
    }

    /**
     * 销毁录音对象
     * @memberof Recorder
     */
    destroy(): Promise<{}> {
        // 结束流
        if (this.stream.getTracks) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        return this.closeAudioContext();
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
        this.lBuffer.length = 0;
        this.rBuffer.length = 0;
        this.size = 0;
        this.fileSize = 0;
        this.PCM = null;
        this.audioInput = null;
        this.duration = 0;
        this.ispause = false;
        this.isplaying = false;
        this.playTime = 0;

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
        let lData = null,
            rData = new Float32Array(0);    // 右声道默认为0

        // 创建存放数据的容器
        if (1 === this.config.numChannels) {
            lData = new Float32Array(this.size);
        } else {
            lData = new Float32Array(this.size / 2);
            rData = new Float32Array(this.size / 2);
        }
        // 合并
        let offset = 0; // 偏移量计算

        // 将二维数据，转成一维数据
        // 左声道
        for (let i = 0; i < this.lBuffer.length; i++) {
            lData.set(this.lBuffer[i], offset);
            offset += this.lBuffer[i].length;
        }

        offset = 0;
        // 右声道
        for (let i = 0; i < this.rBuffer.length; i++) {
            rData.set(this.rBuffer[i], offset);
            offset += this.rBuffer[i].length;
        }

        return {
            left: lData,
            right: rData
        };
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
        let rate = inputSampleRate / outputSampleRate,
            compression = Math.max(rate, 1),
            lData = data.left,
            rData = data.right,
            length = Math.floor(( lData.length + rData.length ) / rate),
            result = new Float32Array(length),
            index = 0,
            j = 0;

        // 循环间隔 compression 位取一位数据
        while (index < length) {
            let temp = Math.floor(j)
            
            result[index] = lData[temp];
            index++;

            if (rData.length) {
                /*
                 * 双声道处理
                 * e.inputBuffer.getChannelData(0)得到了左声道4096个样本数据，1是右声道的数据，
                 * 此处需要组和成LRLRLR这种格式，才能正常播放，所以要处理下
                 */
                result[index] = rData[temp];
                index++;
            }
            
            j += compression;
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
            for (let i = 0; i < bytes.length; i++, offset++) {
                // 范围[-1, 1]
                let s = Math.max(-1, Math.min(1, bytes[i]));
                // 8位采样位划分成2^8=256份，它的范围是0-255; 
                // 对于8位的话，负数*128，正数*127，然后整体向上平移128(+128)，即可得到[0,255]范围的数据。
                let val = s < 0 ? s * 128 : s * 127;
                val = +val + 128;
                data.setInt8(offset, val);
            }
        } else {
            for (let i = 0; i < bytes.length; i++, offset += 2) {
                let s = Math.max(-1, Math.min(1, bytes[i]));
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
        let sampleRate = outputSampleRate > inputSampleRate ? inputSampleRate : outputSampleRate,   // 输出采样率较大时，仍使用输入的值，
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
    for (let i = 0; i < str.length; i++) {
        data.setUint8(offset + i, str.charCodeAt(i));
    }
}

export default Recorder;