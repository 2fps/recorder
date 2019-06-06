window.AudioContext = jest.fn().mockImplementation(() => {
    return {
        sampleRate: 48000,
        createAnalyser: jest.fn(() => {
            return {
                fftSize: 2048,
                connect: jest.fn(),
                disconnect: jest.fn()
            };
        }),
        createScriptProcessor: jest.fn(() => {
            return {
                onaudioprocess: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn()
            }
        }),
    };
});

navigator.mediaDevices = {
    getUserMedia: jest.fn().mockImplementation((config) => Promise.resolve({})),
};