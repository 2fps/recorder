import * as React from 'react';
import { Button, Container, Statistic, Form, Divider, Checkbox, Segment } from 'semantic-ui-react';
// import Recorder from './recorder';
import Recorder from '../src/recorder';
import { encodeWAV } from '../src/transform/transform';
import Player from '../src/player/player';

import Translate from './components/Application/Translate/Translate';

import 'semantic-ui-css/semantic.min.css';

let recorder = null;
let playTimer = null;
let oCanvas = null;
let ctx = null;
let drawRecordId = null;

const sampleRateOptions = [
    { text: '16000', value: 16000 },
    { text: '22050', value: 22050 },
    { text: '24000', value: 24000 },
    { text: '44100', value: 44100 },
    { text: '48000', value: 48000 },
];

const sampleBitOptions = [
    { text: '8', value: 8 },
    { text: '16', value: 16 },
];

const numChannelOptions = [
    { text: '单', value: 1 },
    { text: '双', value: 2 },
];

class App extends React.Component {
    state = {
        sampleBit: 8,
        sampleRate: 16000,
        numChannel: 1,
        compiling: false,
        isRecording: false,     // 是否正在录音
        duration: 0,
        fileSize: 0,
        vol: 0,
    }
    changeSampleRate = (e, params) => {
        this.setState({
            sampleRate: params.value
        });
    }
    changeSampleBit = (e, params) => {
        this.setState({
            sampleBit: params.value
        });
    }
    changeNumChannel = (e, params) => {
        this.setState({
            numChannel: params.value
        });
    }
    changeCompile = (e, { checked }) => {
        this.setState({
            compiling: checked
        });
      }

    collectData = () => {
        return {
            sampleBits: this.state.sampleBit,
            sampleRate: this.state.sampleRate,
            numChannels: this.state.numChannel,
            compiling: this.state.compiling,       // 是否开启边录音边转化（后期改用web worker）
        };
    }

    startRecord = () => {
        this.clearPlay();

        const config = this.collectData();

        if (!recorder) {
            recorder = new Recorder(config);

            recorder.onprocess = function(duration) {
                // this.setState({
                //     duration: duration.toFixed(5),
                // });
                // 推荐使用 onprogress 
            }
    
            recorder.onprogress = (params) => {
                this.setState({
                    duration: params.duration.toFixed(5),
                    fileSize: params.fileSize,
                    vol: params.vol.toFixed(2)
                });
                // 此处控制数据的收集频率
                if (config.compiling) {
                    console.log('音频总数据：', params.data);
                }
            }
            
            recorder.onplay = () => {
                console.log('%c回调监听，开始播放音频', 'color: #2196f3')
            }
            recorder.onpauseplay = () => {
                console.log('%c回调监听，暂停播放音频', 'color: #2196f3')
            }
            recorder.onresumeplay = () => {
                console.log('%c回调监听，恢复播放音频', 'color: #2196f3')
            }
            recorder.onstopplay = () => {
                console.log('%c回调监听，停止播放音频', 'color: #2196f3')
            }
            // recorder.onplayend = () => {
            //     console.log('%c回调监听，音频播放结束', 'color: #2196f3')
            // }

            // 定时获取录音的数据并播放
            config.compiling && (playTimer = setInterval(() => {
                if (!recorder) {
                    return;
                }
    
                let newData = recorder.getNextData();
                if (!newData.length) {
                    return;
                }
                let byteLength = newData[0].byteLength
                let buffer = new ArrayBuffer(newData.length * byteLength)
                let dataView = new DataView(buffer)
    
                    // 数据合并
                for (let i = 0, iLen = newData.length; i < iLen; ++i) {
                    for (let j = 0, jLen = newData[i].byteLength; j < jLen; ++j) {
                        dataView.setInt8(i * byteLength + j, newData[i].getInt8(j))
                    }
                }
    
                // 将录音数据转成WAV格式，并播放
                let a = encodeWAV(dataView, config.sampleRate, config.sampleRate, config.numChannels, config.sampleBits)
                let blob: any = new Blob([ a ], { type: 'audio/wav' });
    
                blob.arrayBuffer().then((arraybuffer) => {
                    Player.play(arraybuffer);
                });
            }, 3000))
        } else {
            recorder.stop();
        }

        recorder.start().then(() => {
            console.log('开始录音');
        }, (error) => {
            console.log(`异常了,${error.name}:${error.message}`);
        });
        // 开始绘制canvas
        this.drawRecord();
    }

    drawRecord = () => {
        // 用requestAnimationFrame稳定60fps绘制
        drawRecordId = requestAnimationFrame(this.drawRecord);
    
        // 实时获取音频大小数据
        let dataArray = recorder.getRecordAnalyseData(),
            bufferLength = dataArray.length;
    
        // 填充背景色
        ctx.fillStyle = 'rgb(200, 200, 200)';
        ctx.fillRect(0, 0, oCanvas.width, oCanvas.height);
        
        // 设定波形绘制颜色
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        
        ctx.beginPath();
        
        var sliceWidth = oCanvas.width * 1.0 / bufferLength, // 一个点占多少位置，共有bufferLength个点要绘制
            x = 0;          // 绘制点的x轴位置
    
        for (var i = 0; i < bufferLength; i++) {
            var v = dataArray[i] / 128.0;
            var y = v * oCanvas.height / 2;
        
            if (i === 0) {
                // 第一个点
                ctx.moveTo(x, y);
            } else {
                // 剩余的点
                ctx.lineTo(x, y);
            }
            // 依次平移，绘制所有点
            x += sliceWidth;
        }
        
        ctx.lineTo(oCanvas.width, oCanvas.height / 2);
        ctx.stroke();
    }

    pauseRecord = () => {
        if (recorder) {
            recorder.pause();
            console.log('暂停录音');
        }
    }
    resumeRecord = () => {
        recorder && recorder.resume();
        console.log('恢复录音');
    }
    endRecord = () => {
        recorder && recorder.stop();
        console.log('结束录音');
        drawRecordId && cancelAnimationFrame(drawRecordId);
        drawRecordId = null;
    }
    playRecord = () => {
        recorder && recorder.play();
        console.log('播放录音');
        drawRecordId && cancelAnimationFrame(drawRecordId);
        drawRecordId = null;
    }
    pausePlay = () => {
        recorder && recorder.pausePlay();
        console.log('暂停播放');
    }
    resumePlay = () => {
        recorder && recorder.resumePlay();
        console.log('恢复播放');
    }
    clearPlay = () => {
        if (playTimer) {
            clearInterval(playTimer);
            playTimer = null;
        }
        if (drawRecordId) {
            cancelAnimationFrame(drawRecordId);
            drawRecordId = null;
        }
    }
    stopPlay = () => {
        this.clearPlay();
        recorder && recorder.stopPlay();
        console.log('停止播放');
    }
    destroyRecord = () => {
        this.clearPlay();
        if (recorder) {
            recorder.destroy().then(function() {
                console.log('销毁实例');
                recorder = null;
                drawRecordId && cancelAnimationFrame(drawRecordId);
            });
        }
    }
    downloadPCM = () => {
        recorder && recorder.downloadPCM();
    }
    downloadWAV = () => {
        recorder && recorder.downloadWAV();
    }

    uploadAudio = (e) => {
        e.target.files[0].arrayBuffer().then((arraybuffer) => {
            Player.play(arraybuffer);
        });
    }

    componentDidMount() {
        oCanvas = document.getElementById('canvas');
        ctx = oCanvas.getContext("2d");
    }

    public render() {
        return (
            <Container className="App" style={{ margin: '20px 0' }}>
                <Form>
                    <Form.Group widths='equal'>
                        <Form.Select
                            fluid
                            label='采样率'
                            value={ this.state.sampleRate }
                            options={ sampleRateOptions }
                            onChange={ this.changeSampleRate }
                        />
                        <Form.Select
                            fluid
                            label='采样位数'
                            value={ this.state.sampleBit }
                            options={ sampleBitOptions }
                            onChange={ this.changeSampleBit }
                        />
                        <Form.Select
                            fluid
                            label='声道数'
                            value={ this.state.numChannel }
                            options={ numChannelOptions }
                            onChange={ this.changeNumChannel }
                        />
                    </Form.Group>
                    <Form.Field>
                        <Checkbox label='边录边转(播)' checked={ this.state.compiling } toggle onChange={ this.changeCompile } />
                    </Form.Field>
                </Form>
                <Segment inverted color='teal'>修改配置后，请注销录音实例。</Segment>
                <Divider />
                <div>
                    <Button primary onClick={ this.startRecord } disabled={ this.state.isRecording }>
                        录音开启
                    </Button>
                    <Button primary onClick={ this.pauseRecord }>
                        暂停
                    </Button>
                    <Button primary onClick={ this.resumeRecord }>
                        恢复
                    </Button>
                    <Button primary onClick={ this.endRecord }>
                        录音停止
                    </Button>
                </div>
                <Divider />
                <Statistic.Group widths='three'>
                    <Statistic>
                        <Statistic.Value>{ this.state.duration }</Statistic.Value>
                        <Statistic.Label>录音时长(秒)</Statistic.Label>
                    </Statistic>
                    <Statistic>
                        <Statistic.Value>{ this.state.fileSize }</Statistic.Value>
                        <Statistic.Label>录音大小(字节)</Statistic.Label>
                    </Statistic>
                    <Statistic>
                        <Statistic.Value>{ this.state.vol }</Statistic.Value>
                        <Statistic.Label>当前录音音量百分比(%)</Statistic.Label>
                    </Statistic>
                </Statistic.Group>
                <div>
                    <canvas id="canvas"></canvas>
                </div>
                <Divider />
                <div>
                    <Button onClick={ this.playRecord }>
                        录音播放
                    </Button>
                    <Button onClick={ this.pausePlay }>
                        暂停播放
                    </Button>
                    <Button onClick={ this.resumePlay }>
                        恢复播放
                    </Button>
                    <Button onClick={ this.stopPlay }>
                        停止播放
                    </Button>
                    <Button onClick={ this.destroyRecord }>
                        销毁实例
                    </Button>
                </div>
                <Divider />
                <div>
                    <h3>下载</h3>
                    <Button onClick={ this.downloadPCM } secondary>
                        下载PCM
                    </Button>
                    <Button onClick={ this.downloadWAV } secondary>
                        下载WAV
                    </Button>
                </div>
                <Divider />
                <div style={{ position: 'relative' }}>
                    <h3>播放外部音频</h3>
                    <Button.Group basic size='small'>
                        <Button icon='upload' />
                    </Button.Group>
                    <input type="file" style={{ position: 'absolute', width: '30px', height: '30px', top: '36px', cursor: 'poniter',  left: '0px', opacity: 0 }} onChange={ this.uploadAudio } />
                </div>
                <Divider />
                <h3>应用</h3>
                <Translate />
            </Container>
        );
    }
}

export default App;
