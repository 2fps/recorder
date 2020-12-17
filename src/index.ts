import { downloadPCM, downloadWAV, download } from './download/download';
import { compress, encodePCM, encodeWAV } from './transform/transform';
import Player from './player/player';
import Recorder from './recorder/recorder';

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

class Index extends Recorder {
    private isrecording: boolean = false;       // 是否正在录音
    private ispause: boolean = false;           // 是否是暂停
    private isplaying: boolean = false;         // 是否正在播放

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
        super(options);
    }

    /**
     * 重新修改配置
     *
     * @param {recorderConfig} [options={}]
     * @memberof Recorder
     */
    public setOption(options: recorderConfig = {}) {
        this.setNewOption(options);
    }

    /**
     * Start the recording
     */
    start(): Promise<{}> {
        if (this.isrecording) {
            // 正在录音，则不允许
            return Promise.reject();
        }

        this.isrecording = true;

        return this.startRecord();
    }

    /**
     * Pause the recording
     */
    pause(): void {
        if (this.isrecording && !this.ispause) {
            this.ispause = true;
            // 当前不暂停的时候才可以暂停
            this.pauseRecord();
        }
    }

    /**
     * 继续录音
     */
    resume(): void {
        if (this.isrecording && this.ispause) {
            this.ispause = false;
            this.resumeRecord();
        }
    }

    /**
     * 停止录音
     *
     * @memberof Recorder
     */
    stop(): void {
        if (this.isrecording) {
            this.isrecording = false;
            this.ispause = false;
            this.stopRecord();
        }
    }

    /**
     * 播放录音
     */
    play(): void {
        this.stop();
        // 关闭前一次音频播放
        this.isplaying = true;

        this.onplay && this.onplay();
        Player.addPlayEnd(this.onplayend);  // 注册播放完成后的回调事件

        const dataV = this.getWAV();

        if (dataV.byteLength > 44) {
            Player.play(dataV.buffer);  // 播放
        }
    }

    /**
     * 获取已经播放了多长时间
     */
    getPlayTime(): number {
        return Player.getPlayTime();
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

        this.isplaying = false;
        this.onpauseplay && this.onpauseplay();
        Player.pausePlay();
    }

    /**
     * 恢复播放录音
     *
     * @memberof Recorder
     */
    resumePlay(): void {
        if (this.isrecording || this.isplaying) {
            // 正在录音或已经播放或没开始播放，恢复无效
            return;
        }

        this.isplaying = true;
        this.onresumeplay && this.onresumeplay();
        Player.resumePlay();
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

        this.isplaying = false;
        this.onstopplay && this.onstopplay();
        Player.stopPlay();
    }

    destroy(): Promise<{}> {
        Player.destroyPlay();

        return this.destroyRecord();
    }

    /**
     * 获取当前已经录音的PCM音频数据
     *
     * @returns[DataView]
     * @memberof Recorder
     */
    // getWholeData() {
    //     return this.tempPCM;
    // }

    /**
     * 获取余下的新数据，不包括 getNextData 前一次获取的数据
     *
     * @returns [DataView]
     * @memberof Recorder
     */
    // getNextData() {
    //     let length = this.tempPCM.length,
    //         data = this.tempPCM.slice(this.offset);

    //     this.offset = length;

    //     return data;
    // }

    /**
     * 获取当前录音的波形数据，
     * 调取频率由外部控制。
     *
     * @memberof Recorder
     */
    getRecordAnalyseData(): any {
        return this.getAnalyseData();
    }

    /**
     * 获取录音播放时的波形数据，
     *
     * @memberof Recorder
     */
    getPlayAnalyseData(): any {
        // 现在录音和播放不允许同时进行，所有复用的录音的analyser节点。
        return Player.getAnalyseData();
    }

    getPCM(): any {
        // 先停止
        this.stop();
        // 获取pcm数据
        let data: any = this.getData();
        // 根据输入输出比例 压缩或扩展
        data = compress(data, this.inputSampleRate, this.outputSampleRate);
        // 按采样位数重新编码
        return encodePCM(data, this.oututSampleBits, this.littleEdian);
    }

    /**
     * 获取PCM格式的blob数据
     *
     * @returns { blob }  PCM格式的blob数据
     * @memberof Recorder
     */
    getPCMBlob(): any {
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

        downloadPCM(pcmBlob, name);
    }

    /**
     * 获取WAV编码的二进制数据(dataview)
     *
     * @returns {dataview}  WAV编码的二进制数据
     * @memberof Recorder
     */
    getWAV(): any {
        let pcmTemp = this.getPCM();

        // PCM增加44字节的头就是WAV格式了
        return encodeWAV(pcmTemp, this.inputSampleRate,
            this.outputSampleRate, this.config.numChannels, this.oututSampleBits, this.littleEdian);;
    }

    /**
     * 获取WAV音频的blob数据
     *
     * @returns { blob }    wav格式blob数据
     * @memberof Recorder
     */
    getWAVBlob(): any {
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

        downloadWAV(wavBlob, name);
    }

    /**
     * 通用的下载接口
     */
    download(blob, name: string, type: string): void {
        download(blob, name, type);
    }

    /**
     * 获取左和右声道的数据
     *
     * @returns [DataView]
     */
    getChannelData(): any {
        const all = this.getPCM();
        const length = all.byteLength;
        const littleEdian = this.littleEdian
        const res = { left: null, right: null }

        if (this.config.numChannels === 2) {
            // 双通道,劈开
            const lD = new DataView(new ArrayBuffer(length / 2))
            const rD = new DataView(new ArrayBuffer(length / 2))
            // 双声道，需要拆分下数据

            if (this.config.sampleBits === 16) {
                for (var i = 0; i < length / 2; i += 2) {
                    lD.setInt16(i, all.getInt16(i * 2, littleEdian), littleEdian)
                    rD.setInt16(i, all.getInt16(i * 2 + 2, littleEdian), littleEdian)
                }
            } else {
                for (var i = 0; i < length / 2; i += 2) {
                    lD.setInt8(i, all.getInt8(i * 2))
                    rD.setInt8(i, all.getInt8(i * 2 + 1))
                }
            }

            res.left = lD
            res.right = rD
        } else {
            // 单通道
            res.left = all
        }

        return res
    }
}

export default Index;
