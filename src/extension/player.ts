export default class Play {
    private oAudio: any;                // audio音频对象

    // 暴露给实例的接口，
    public onPlay: () => void;          // 
    public onwaiting: () => void;
    public oncanplay: () => void;
    public onplaying: () => void;
    public ontimeupdate: () => void;
    public onpause: () => void;
    public onratechange: () => void;
    public onseeked: () => void;
    public onseeking: () => void;

    public onended: () => void; 

    constructor() {
        // 初始化 audio 元素
        this.oAudio = document.createElement('audio');
        // 事件绑定
        // 音频文件开始播放，触发了play，实际可能并未开始播放
        this.oAudio.onplay = () => {
            this.onPlay();
            console.log('onplay');
        }
        // 需要缓冲下一帧而停止时触发，play动作触发后，也会有该事件
        this.oAudio.onwaiting = () => {
            this.onwaiting();
            console.log('onwaiting');
        }
        // 浏览器能够开始播放指定的音频
        this.oAudio.oncanplay = () => {
            this.oncanplay();
            console.log('oncanplay');
        }
        // 音频已开始播放时触发
        this.oAudio.onplaying = () => {
            this.onplaying();
            console.log('onplaying');
        }
        // 播放位置改变时触发[注意:播放和调整指示定位时都会触发]
        this.oAudio.ontimeupdate = () => {
            this.ontimeupdate();
            console.log('ontimeupdate', this.oAudio.currentTime);
        }
        // 音频文件暂停时触发
        this.oAudio.onpause = () => {
            console.log('onpause');
        }
        // 播放速度改变进触发
        this.oAudio.onratechange = () => {
            console.log('onratechange');
        }
        // 指示定位已结束时触发
        this.oAudio.onseeked = () => {
            console.log('onseeked');
        }
        // 正在进行指示定位时触发
        this.oAudio.onseeking = () => {
            console.log('onseeking');
        }
        // 音量改变时触发
        this.oAudio.onvolumechange = () => {
            console.log('onvolumechange');
        }
        // 音频或视频文件已经就绪可以开始播放时触发
        this.oAudio.onplay = () => {
            console.log('onplay');
        }
        // 音频或视频文件暂停时触发
        this.oAudio.onpause = () => {
            console.log('onpause');
        }
        // 在音频或视频终止加载时触发，切换音频也会触发
        this.oAudio.onabort = () => {
            console.log('onabort');
        }
        // 音频文件播放完毕后触发
        this.oAudio.onended = () => {
            console.log('onended');
        }

    }
    /** 
     * 使用 audio 元素播放外音频文件
     * 
     * @param {Blob}    blob    blob音频数据
     * @memberof Recorder
     */
    playWithAudio(blob): void {
        this.oAudio.src = window.URL.createObjectURL(blob);
        // 播放音乐
        this.oAudio.play();
    }

    /**
     * 获取音频 audio 文件的信息
     * 
     * @memberof Recorder
     */
    getAudioInfo() {
        return {
            duration: this.oAudio.duration,
            currentSrc: this.oAudio.currentSrc,
        }
    }
    // 设置音量，范围0-1
    setVolume(vol: number) {
        let volume: number = Math.max(0, vol);

        volume = Math.min(volume, 1);
        // set
        this.oAudio.volume = volume;
    }
}