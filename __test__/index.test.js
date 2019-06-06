import '../__mock__/index.mock';

import Recorder from '../index';

let recorder = new Recorder();

test('Recorder constructor', () => {
    expect(recorder).toBeInstanceOf(Recorder);
});

test('get inputSampleRate', () => {
    expect(recorder.inputSampleRate).toBe(48000);
});

// 开始
test('start state check', () => {
    recorder.start();

    expect(recorder.isrecording).toBe(true);
    expect(recorder.ispause).toBe(false);
});

// 暂停
test('operation pause', () => {
    recorder.pause();

    expect(recorder.isrecording).toBe(true);
    expect(recorder.ispause).toBe(true);
});

// 恢复
test('operation resume', () => {
    recorder.resume();

    expect(recorder.isrecording).toBe(true);
    expect(recorder.ispause).toBe(false);
});

// 结束
test('stop record', () => {
    recorder.stop();

    expect(recorder.isrecording).toBe(false);
});