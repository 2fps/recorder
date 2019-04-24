window.AudioContext = jest.fn().mockImplementation(() => {
    return {
        sampleRate: 48000,
        createAnalyser: jest.fn(() => {
            return {
                fftSize: 2048
            };
        }),
        createScriptProcessor: jest.fn(() => {
            return {
                onaudioprocess: jest.fn(),
            }
        }),
    };
});

navigator.mediaDevices = {
    getUserMedia: jest.fn().mockImplementation((config) => Promise.resolve({})),
};