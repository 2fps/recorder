var oDiv = document.getElementById('box'),
    audio = document.getElementById('audio'),
    recorder = null;

document.getElementById('startRecord').addEventListener('click', startRecord);
document.getElementById('endRecord').addEventListener('click', endRecord);
document.getElementById('playRecord').addEventListener('click', playRecord);

function startRecord() {
    if (!recorder) {
        recorder = new Recorder({
            // 双声道录音有问题
            // numChannels: 2
        });
    }
    recorder.start();
}
function endRecord (e) {
    recorder && recorder.stop();
}
function playRecord() {
    recorder && recorder.play();
}