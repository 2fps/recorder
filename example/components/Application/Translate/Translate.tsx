import * as React from 'react';
import { Button, Segment, Dimmer, Loader, Tab } from 'semantic-ui-react';
import Recorder from '../../../../src/index';

import 'semantic-ui-css/semantic.min.css';

let recorder = null;

const platforms = ['aliyun', 'baiduyun']

class Translate extends React.Component {
    state = {
        translating: false,
        aliRecordering: false,
        baiduRecordering: false,
        tranResult: '识别内容在此显示！',
        platform: 'aliyun',
        panes: [
            {
              menuItem: '阿里云',
              render: () => <Tab.Pane attached={false}>
                    <Button onMouseDown={ this.aliRecord } onMouseUp={ this.translateAli } secondary loading={ this.state.aliRecordering }>
                        基于阿里云Rest Api方式
                    </Button>
              </Tab.Pane>,
            },
            {
              menuItem: '百度云',
              render: () => <Tab.Pane attached={false}>
                    <Button onMouseDown={ this.baiduRecord } onMouseUp={ this.translateBaidu } secondary loading={ this.state.baiduRecordering }>
                        基于百度云Node SDK方式
                    </Button>
                </Tab.Pane>,
            },
        ]
    }

    aliRecord = () => {
        recorder = new Recorder({
            sampleBits: 16,
            sampleRate: 16000,
            numChannels: 1,
            compiling: false,
        });

        recorder.start();
        this.setState({
            aliRecordering: true,
        });
    }

    baiduRecord = () => {
        recorder = new Recorder({
            sampleBits: 16,
            sampleRate: 16000,
            numChannels: 1,
            compiling: false,
        });

        recorder.start();
        this.setState({
            baiduRecordering: true,
        });
    }

    translateAli = () => {
        recorder && recorder.stop();
        this.sendVoice(recorder.getWAVBlob());
        this.setState({
            translating: true,
            aliRecordering: false
        }, () => {
            recorder.destroy();
        });
    }

    translateBaidu = () => {
        recorder && recorder.stop();
        this.sendVoice(recorder.getWAVBlob());
        this.setState({
            translating: true,
            baiduRecordering: false
        }, () => {
            recorder.destroy();
        });
    }

    sendVoice = (data) => {
        let formData = new FormData();
        formData.append('a', data);

        // fetch(`http://127.0.0.1:3000/gen/voice?platform=${ this.state.platform }`, {
        fetch(`https://recorder.zhuyuntao.cn/gen/voice?platform=${ this.state.platform }`, {
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

    changePlatform = (e, data) => {
        let index = data.activeIndex;

        this.setState({
            platform: platforms[index],
        })
    }

    public render() {
        return (
          <div>
            <h4>第三方平台语音识别</h4>
            <p>长按按钮进行录音，松开识别</p>
            <Tab menu={{ secondary: true, pointing: true }} panes={ this.state.panes } onTabChange={ this.changePlatform } />
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
