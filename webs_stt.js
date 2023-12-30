let mediaRecorder;
let socket;
let audioContext;
let audioChunks = [];
let audioPlayer;

const startRecordingButton = document.getElementById('startRecording');
const stopRecordingButton = document.getElementById('stopRecording');

startRecordingButton.addEventListener('click', startRecording);
stopRecordingButton.addEventListener('click', stopRecording);

function connectWebSocket() {
    socket = new WebSocket('ws://localhost:8765');

    socket.addEventListener('open', (event) => {
        console.log('WebSocket opened');
    });

    socket.addEventListener('message', (event) => {
        console.log('Message from server:', JSON.parse(event.data).text);

        const result = JSON.parse(event.data);

        const resultDiv = document.getElementById('result');
        resultDiv.textContent = result.text;

        if (result.audio) {
            playAudio(result.audio);
        }
    });

    socket.addEventListener('close', (event) => {
        console.log('WebSocket closed:', event);
        reconnectWebSocket();
    });
}

function reconnectWebSocket() {
    setTimeout(() => {
        connectWebSocket();
    }, 1000);
}

function playAudio(base64Audio, autoPlay = false) {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
    }

    const audioBlob = base64toBlob(base64Audio);
    const audioFile = new File([audioBlob], 'recorded_audio.wav', { type: 'audio/wav' });

    audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.src = URL.createObjectURL(audioFile);

    audioPlayer.load();

    if (autoPlay) {
        audioPlayer.oncanplaythrough = () => {
            audioPlayer.play();
        };
    }
}

function base64toBlob(base64Data) {
    try {
        if (/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: 'audio/wav' });
        } else {
            console.error('Invalid base64 string');
            return null;
        }
    } catch (error) {
        console.error('Error decoding base64 data:', error);
        return null;
    }
}

connectWebSocket();

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.mimeType = 'audio/wav';

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

        const reader = new FileReader();
        reader.onloadend = function () {
            const audioPCMData = reader.result;
            socket.send(audioPCMData);
        };
        reader.readAsArrayBuffer(audioBlob);

        audioChunks = [];
    };

    mediaRecorder.start();
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
}

function stopRecording() {
    mediaRecorder.stop();
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;
}
