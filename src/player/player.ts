import { throwError } from '../exception/exception'

declare let window: any;

let source: any = null;
let playTime: number = 0;
let playStamp: number = 0;
let context: any = null;
let analyser: any = null;

let audioData: any = null;
let hasInit: boolean = false;           // 是否已经初始化了
let endplayFn: any = function() {};

/**
 * 初始化
 */
function init(): void {
    context = new (window.AudioContext || window.webkitAudioContext)();
    // analyser = context.createAnalyser();
}

/**
 * play
 * @returns {Promise<{}>}
 */
function playAudio(): Promise<{}> {
    return context.decodeAudioData(audioData.slice(0), buffer => {
        source = context.createBufferSource();

        // 播放结束的事件绑定
        source.onended = () => {
            endplayFn();
        }

        // 设置数据
        source.buffer = buffer;
        // connect到分析器，还是用录音的，因为播放时不能录音的
        // source.connect(analyser);
        // analyser.connect(context.destination);
        source.connect(context.destination);
        source.start(0, playTime);

        // 记录当前的时间戳，以备暂停时使用
        playStamp = context.currentTime;
    }, function(e) {
        throwError(e);
    });
}

export default class Player {
    /**
     * play record
     * @static
     * @param {ArrayBuffer} arraybuffer
     * @memberof Player
     */
    static play(arraybuffer): Promise<{}> {
        if (!hasInit) {
            // 第一次播放要初始化
            init();

            hasInit = true;
        }
        this.stopPlay();
        // 缓存播放数据
        audioData = arraybuffer;

        return playAudio();
    }

    /**
     * 暂停播放录音
     * @memberof Player
     */
    static pausePlay(): void {
        source && source.disconnect();
        // 多次暂停需要累加
        playTime += context.currentTime - playStamp;
    }

    /**
     * 恢复播放录音
     * @memberof Player
     */
    static resumePlay(): Promise<{}> {
        return playAudio();
    }

    /**
     * 停止播放
     * @memberof Player
     */
    static stopPlay() {
        playTime = 0;
        audioData = null;

        source && source.stop();
    }

    /**
     * 增加录音播放完成的事件绑定
     *
     * @static
     * @param {*} [fn=function() {}]
     * @memberof Player
     */
    static addPlayEnd(fn: any = function() {}) {
        endplayFn = fn;
    }
}
