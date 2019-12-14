import { throwError } from '../exception/exception'

declare let window: any;

let _source: any = null;
let _playTime: number = 0;
let _playStamp: number = 0;
let _context: any = null;
let _analyser: any = null;

let _audioData: any = null;
let _hasInit: boolean = false;           // 是否已经初始化了
let _endplayFn: any = function() {};

/**
 * 初始化
 */
function _init(): void {
    _context = new (window.AudioContext || window.webkitAudioContext)();
    _analyser = _context.createAnalyser();
}

/**
 * play
 * @returns {Promise<{}>}
 */
function _playAudio(): Promise<{}> {
    return _context.decodeAudioData(_audioData.slice(0), buffer => {
        _source = _context.createBufferSource();

        // 播放结束的事件绑定
        _source.onended = () => {
            _endplayFn();
        }

        // 设置数据
        _source.buffer = buffer;
        // connect到分析器，还是用录音的，因为播放时不能录音的
        _source.connect(_analyser);
        _analyser.connect(_context.destination);
        _source.start(0, _playTime);

        // 记录当前的时间戳，以备暂停时使用
        _playStamp = _context.currentTime;
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
        if (!_hasInit) {
            // 第一次播放要初始化
            _init();

            _hasInit = true;
        }
        this.stopPlay();
        // 缓存播放数据
        _audioData = arraybuffer;
    
        return _playAudio()
    }

    /**
     * 暂停播放录音
     * @memberof Player
     */
    static pausePlay(): void {
        _source && _source.disconnect();
        // 多次暂停需要累加
        _playTime += _context.currentTime - _playStamp;
    }

    /**
     * 恢复播放录音
     * @memberof Player
     */
    static resumePlay(): Promise<{}> {
        return _playAudio();
    }

    /**
     * 停止播放
     * @memberof Player
     */
    static stopPlay() {
        _playTime = 0;
        _audioData = null;

        _source && _source.stop();
    }

    /**
     * 增加录音播放完成的事件绑定
     *
     * @static
     * @param {*} [fn=function() {}]
     * @memberof Player
     */
    static addPlayEnd(fn: any = function() {}) {
        _endplayFn = fn;
    }
}
