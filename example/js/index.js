var oDiv = document.getElementById('box'),
    audio = document.getElementById('audio'),
    recorder = null;

document.getElementById('startRecord').addEventListener('click', startRecord);
document.getElementById('endRecord').addEventListener('click', endRecord);
document.getElementById('playRecord').addEventListener('click', playRecord);

function startRecord() {
    if (!recorder) {
        recorder = new Recorder();
        recorder.ready().then(() => {
            recorder.start();
        });
    } else {
        recorder.start();
    }
}
function endRecord (e) {
    recorder.stop();
}
function playRecord() {
    recorder.play(audio);
}