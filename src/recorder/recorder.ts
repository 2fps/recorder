import { compress, encodePCM, encodeWAV } from '../transform/transform';

declare let window: any;
declare let Math: any;
declare let navigator: any;
declare let Promise: any;

// 构造函数参数格式
interface recorderConfig {
    sampleBits?: number,        // 采样位数
    sampleRate?: number,        // 采样率
    numChannels?: number,       // 声道数
    compiling?: boolean,        // 是否边录边播
}

export default class Recorder {
    private context: any;
    protected config: recorderConfig;               // 配置
    private analyser: any;
    private size: number = 0;                       // 录音文件总长度
    private lBuffer: Array<Float32Array> = [];      // pcm音频数据搜集器(左声道)
    private rBuffer: Array<Float32Array> = [];      // pcm音频数据搜集器(右声道)
    private PCM: any;                               // 最终的PCM数据缓存，避免多次encode
    private tempPCM: Array<DataView> = [];          // 边录边转时临时存放pcm的
    private audioInput: any;
    protected inputSampleRate: number;              // 输入采样率
    protected inputSampleBits: number = 16;         // 输入采样位数
    protected outputSampleRate: number;             // 输出采样率
    protected oututSampleBits: number;              // 输出采样位数
    private source: any;                            // 音频输入
    private recorder: any;
    private stream: any;                            // 流
    protected littleEdian: boolean;                 // 是否是小端字节序
    protected fileSize: number = 0;                 // 录音大小，byte为单位
    protected duration: number = 0;                 // 录音时长
    private needRecord: boolean = true;             // 由于safari问题，导致使用该方案代替disconnect/connect方案
    // 正在录音时间，参数是已经录了多少时间了
    public onprocess: (duration: number) => void;
    // onprocess 替代函数，保持原来的 onprocess 向下兼容
    public onprogress: (payload: {
        duration: number,
        fileSize: number,
        vol: number,
        // data: Array<DataView>,      // 当前存储的所有录音数据
    }) => void;
    public onplay: () => void;                  // 音频播放回调
    public onpauseplay: () => void;             // 音频暂停回调
    public onresumeplay: () => void;            // 音频恢复播放回调
    public onstopplay: () => void;              // 音频停止播放回调
    public onplayend: () => void;               // 音频正常播放结束

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

        // 设置输出配置
        this.setNewOption(options);

        // 判断端字节序
        this.littleEdian = (function() {
            let buffer = new ArrayBuffer(2);
            new DataView(buffer).setInt16(0, 256, true);
            return new Int16Array(buffer)[0] === 256;
        })();
        // 兼容 getUserMedia
        Recorder.initUserMedia();
    }

    protected setNewOption(options: recorderConfig = {}) {
        this.config = {
            // 采样数位 8, 16
            sampleBits: ~[8, 16].indexOf(options.sampleBits) ? options.sampleBits : 16,
            // 采样率
            sampleRate: ~[8000, 11025, 16000, 22050, 24000, 44100, 48000].indexOf(options.sampleRate) ? options.sampleRate : this.inputSampleRate,
            // 声道数，1或2
            numChannels: ~[1, 2].indexOf(options.numChannels) ? options.numChannels : 1,
            // 是否需要边录边转，默认关闭，后期使用web worker
            // compiling: !!options.compiling || false,   // 先移除
        };
        // 设置采样的参数
        this.outputSampleRate = this.config.sampleRate;     // 输出采样率
        this.oututSampleBits = this.config.sampleBits;      // 输出采样数位 8, 16
    }

    /**
     * 开始录音
     *
     * @returns {Promise<{}>}
     * @memberof Recorder
     */
    startRecord(): Promise<{}> {
        if (this.context) {
            // 关闭先前的录音实例，因为前次的实例会缓存少量前次的录音数据
            this.destroyRecord();
        }
        // 初始化
        this.initRecorder();

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
            // this.audioInput.connect(this.recorder);
            // 处理节点 recorder 连接到扬声器
            this.recorder.connect(this.context.destination);
        });
    }

    /**
     * 暂停录音
     *
     * @memberof Recorder
     */
    pauseRecord(): void {
        this.needRecord = false;
    }

    /**
     * 继续录音
     *
     * @memberof Recorder
     */
    resumeRecord(): void {
        this.needRecord = true;
    }

    /**
     * 停止录音
     *
     */
    stopRecord(): void {
        this.audioInput && this.audioInput.disconnect();
        this.source && this.source.stop();
        this.recorder.disconnect();
        this.analyser.disconnect();
        this.needRecord = true;
    }

    /**
     * 销毁录音对象
     *
     */
    destroyRecord(): Promise<{}> {
        this.clearRecordStatus();
        // 结束流
        this.stopStream();

        return this.closeAudioContext();
    }

    getAnalyseData() {
        let dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        // 将数据拷贝到dataArray中。
        this.analyser.getByteTimeDomainData(dataArray);

        return dataArray;
    }

    // 获取录音数据
    getData() {
        let data: any = this.flat();

        return data;
    }

    /**
     * 清除状态
     *
     */
    private clearRecordStatus() {
        this.lBuffer.length = 0;
        this.rBuffer.length = 0;
        this.size = 0;
        this.fileSize = 0;
        this.PCM = null;
        this.audioInput = null;
        this.duration = 0;
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
     * 初始化录音实例
     */
    private initRecorder(): void {
        // 清空数据
        this.clearRecordStatus();

        this.context = new (window.AudioContext || window.webkitAudioContext)();

        this.analyser = this.context.createAnalyser();  // 录音分析节点
        this.analyser.fftSize = 2048;                   // 表示存储频域的大小

        // 第一个参数表示收集采样的大小，采集完这么多后会触发 onaudioprocess 接口一次，该值一般为1024,2048,4096等，一般就设置为4096
        // 第二，三个参数分别是输入的声道数和输出的声道数，保持一致即可。
        let createScript = this.context.createScriptProcessor || this.context.createJavaScriptNode;
        this.recorder = createScript.apply(this.context, [4096, this.config.numChannels, this.config.numChannels]);

        // 音频采集
        this.recorder.onaudioprocess = e => {
            if (!this.needRecord) {
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

            // 边录边转处理 暂时不支持
            // if (this.config.compiling) {
            //     let pcm = this.transformIntoPCM(lData, rData);

            //     this.tempPCM.push(pcm);
            //     // 计算录音大小
            //     this.fileSize = pcm.byteLength * this.tempPCM.length;
            // } else {
                // 计算录音大小
                this.fileSize = Math.floor(this.size / Math.max( this.inputSampleRate / this.outputSampleRate, 1))
                    * (this.oututSampleBits / 8)
            // }
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
                // data: this.tempPCM,     // 当前所有的pcm数据，调用者控制增量
            });
        }
    }

    /**
     * 终止流（这可以让浏览器上正在录音的标志消失掉）
     * @private
     * @memberof Recorder
     */
    private stopStream() {
        if (this.stream && this.stream.getTracks) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    /**
     * close兼容方案
     * 如firefox 30 等低版本浏览器没有 close方法
     */
    private closeAudioContext() {
        if (this.context && this.context.close && this.context.state !== 'closed') {
            return this.context.close();
        } else {
            return new Promise((resolve) => {
                resolve();
            });
        }
    }

    // getUserMedia 版本兼容
    static initUserMedia() {
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
     * 将获取到到左右声道的Float32Array数据编码转化
     *
     * @param {Float32Array} lData  左声道数据
     * @param {Float32Array} rData  有声道数据
     * @returns DataView
     */
    private transformIntoPCM(lData, rData) {
        let lBuffer = new Float32Array(lData),
            rBuffer = new Float32Array(rData);

        let data = compress({
            left: lBuffer,
            right: rBuffer,
        }, this.inputSampleRate, this.outputSampleRate);

        return encodePCM(data, this.oututSampleBits, this.littleEdian);
    }

    static getPermission(): Promise<{}> {
        this.initUserMedia();

        return navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
            stream && stream.getTracks().forEach(track => track.stop());
        });
    }
}
