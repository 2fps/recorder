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
recorder.start();

test('start state check', () => {
    expect(recorder.isrecording).toBe(true);
});