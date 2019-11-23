import * as React from 'react';
import { Button, Segment, Dimmer, Loader } from 'semantic-ui-react';
import Recorder from '../../../../src/recorder';

import 'semantic-ui-css/semantic.min.css';

let recorder = null;

class Translate extends React.Component {
    state = {
        translating: false,
        recordering: false,
        tranResult: '识别内容在此显示！',
    }

    record = () => {
        recorder = new Recorder({
            sampleBits: 16,
            sampleRate: 16000,
            numChannels: 1,
            compiling: false,
        });

        recorder.start();
        this.setState({
            recordering: true
        });
    }

    translate = () => {
        recorder && recorder.stop();
        this.sendVoice(recorder.getWAVBlob());
        this.setState({
            translating: true,
            recordering: false
        });
    }

    sendVoice = (data) => {
        let formData = new FormData();
        formData.append('a', data);
    
        fetch('https://recorder.zhuyuntao.cn/gen/voice', {
            method: 'POST',
            body: formData
        }).then(res => res.json())
        .then(json => {
            // oReg.innerHTML = json.result;
            console.log(json.result)
            this.setState({
                translating: false,
                tranResult: json.result
            });
        });
    }

    renderResult = () => {
        let temp = [];

        if (this.state.translating) {
            temp.push(
                <Dimmer active inverted key="translating">
                    <Loader inverted content='翻译中...' />
                </Dimmer>
            )
        } else {
            temp.push(
                <span key="res">{ this.state.tranResult }</span>
            )
        }

        return (
            <>
                { temp }
            </>
        )
    }

    public render() {
        return (
          <div>
            <h4>语音识别</h4>
            <Button onMouseDown={ this.record } onMouseUp={ this.translate } secondary loading={ this.state.recordering }>
                请说话
            </Button>
            <span>长按按钮进行录音，松开识别</span>
            <Segment style={{ height: '100px', color: '#000'}}>
                {
                    this.renderResult()
                }
            </Segment>
          </div>
        );
    }
}

export default Translate;
