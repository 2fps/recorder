export default class Play {
    private oAudio: any;        // audio音频对象

    constructor() {
        // 初始化 audio 元素
        this.oAudio = document.createElement('audio');
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
}