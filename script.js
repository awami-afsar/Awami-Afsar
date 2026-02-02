const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const userInput = document.getElementById('user-input');
const chatWindow = document.getElementById('chat-window');
const statusText = document.getElementById('status-text');

let mediaRecorder;
let audioChunks = [];

// --- 1. Text Chat Functionality ---

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';
    showLoading(true);

    // Send to Python Backend
    const formData = new FormData();
    formData.append('message', text);

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        showLoading(false);
        addMessage(data.response, 'system');
    } catch (error) {
        showLoading(false);
        addMessage("Error connecting to server.", 'system');
    }
}

// --- 2. Audio Functionality (MediaRecorder) ---

micBtn.addEventListener('mousedown', startRecording);
micBtn.addEventListener('mouseup', stopRecording);
micBtn.addEventListener('touchstart', startRecording); // Mobile support
micBtn.addEventListener('touchend', stopRecording);

async function startRecording(e) {
    e.preventDefault();
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            sendAudio(audioBlob);
        };

        mediaRecorder.start();
        micBtn.classList.add('recording');
        statusText.innerText = "Recording... Release to send";
    } catch (err) {
        alert("Microphone access denied or not supported.");
    }
}

function stopRecording(e) {
    e.preventDefault();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        micBtn.classList.remove('recording');
        statusText.innerText = "";
    }
}

async function sendAudio(audioBlob) {
    addMessage("🎤 Audio message sent...", 'user');
    showLoading(true);

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        showLoading(false);
        addMessage(data.response, 'system');
    } catch (error) {
        showLoading(false);
        addMessage("Error processing audio.", 'system');
    }
}

// --- 3. UI Helper Functions ---

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender === 'user' ? 'user-message' : 'system-message');
    
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    // Parse Markdown for clean display
    bubble.innerHTML = marked.parse(text); 
    
    div.appendChild(bubble);
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showLoading(show) {
    statusText.innerText = show ? "Awami Afsar is typing..." : "";
}