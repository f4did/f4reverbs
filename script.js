// ============================================================================
// MULTI-SONG MANAGER WITH LOCAL STORAGE PERSISTENCE
// ============================================================================

// Song data structure
class Song {
    constructor(id, name, size, audioData) {
        this.id = id;
        this.name = name;
        this.size = size;
        this.audioData = audioData; // Base64 encoded audio data
        this.settings = {
            speed: 100,
            reverb: 0,
            pitchShiftEnabled: false,
            pitch: 0,
            bassBoostEnabled: false,
            bassBoost: 10
        };
        this.playbackState = {
            pauseTime: 0,
            isPlaying: false
        };
    }
}

// Global state
let audioContext;
let convolverNode;
let songs = new Map(); // Map<songId, Song>
let currentSongId = null;
let audioBuffers = new Map(); // Map<songId, AudioBuffer>
let sourceNode = null;
let gainNode = null;
let bassBoostFilter = null;
let dryGainNode = null;
let wetGainNode = null;
let startTime = 0;

// DOM Elements
const songsSection = document.getElementById('songsSection');
const songsList = document.getElementById('songsList');
const addSongBtn = document.getElementById('addSongBtn');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const changeFileBtn = document.getElementById('changeFileBtn');
const controlsSection = document.getElementById('controlsSection');
const playBtn = document.getElementById('playBtn');
const playIcon = playBtn.querySelector('.play-icon');
const pauseIcon = playBtn.querySelector('.pause-icon');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');

// Effect Controls
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const reverbSlider = document.getElementById('reverbSlider');
const reverbValue = document.getElementById('reverbValue');
const pitchToggle = document.getElementById('pitchToggle');
const pitchSlider = document.getElementById('pitchSlider');
const bassBoostToggle = document.getElementById('bassBoostToggle');
const bassBoostSlider = document.getElementById('bassBoostSlider');
const resetBtn = document.getElementById('resetBtn');
const downloadWavBtn = document.getElementById('downloadWavBtn');
const downloadMp3Btn = document.getElementById('downloadMp3Btn');

// ============================================================================
// INITIALIZATION
// ============================================================================

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createImpulseResponse();
    }
}

function createImpulseResponse() {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 2;
    const impulse = audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
    }

    convolverNode = audioContext.createConvolver();
    convolverNode.buffer = impulse;
}

// ============================================================================
// LOCAL STORAGE PERSISTENCE
// ============================================================================

function saveToLocalStorage() {
    try {
        const songsData = Array.from(songs.values()).map(song => ({
            id: song.id,
            name: song.name,
            size: song.size,
            audioData: song.audioData,
            settings: song.settings,
            playbackState: song.playbackState
        }));

        localStorage.setItem('slowedReverbSongs', JSON.stringify(songsData));
        localStorage.setItem('slowedReverbCurrentSong', currentSongId);
    } catch (e) {
        console.warn('Failed to save to localStorage:', e);
    }
}

async function loadFromLocalStorage() {
    try {
        const songsData = localStorage.getItem('slowedReverbSongs');
        const savedCurrentSongId = localStorage.getItem('slowedReverbCurrentSong');

        if (songsData) {
            const parsedSongs = JSON.parse(songsData);

            for (const songData of parsedSongs) {
                const song = new Song(
                    songData.id,
                    songData.name,
                    songData.size,
                    songData.audioData
                );
                song.settings = songData.settings;
                song.playbackState = songData.playbackState;

                songs.set(song.id, song);

                // Decode audio data
                try {
                    const audioData = base64ToArrayBuffer(song.audioData);
                    const audioBuffer = await audioContext.decodeAudioData(audioData);
                    audioBuffers.set(song.id, audioBuffer);
                } catch (e) {
                    console.error('Failed to decode audio for song:', song.name, e);
                }

                renderSongCard(song);
            }

            if (savedCurrentSongId && songs.has(savedCurrentSongId)) {
                switchToSong(savedCurrentSongId);
            } else if (songs.size > 0) {
                switchToSong(Array.from(songs.keys())[0]);
            }

            if (songs.size > 0) {
                songsSection.style.display = 'block';
            }
        }
    } catch (e) {
        console.warn('Failed to load from localStorage:', e);
    }
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// ============================================================================
// SONG MANAGEMENT
// ============================================================================

async function addSong(file) {
    if (!file.type.startsWith('audio/')) {
        alert('Please upload a valid audio file');
        return;
    }

    initAudioContext();

    const songId = Date.now().toString();
    const arrayBuffer = await file.arrayBuffer();
    const audioData = arrayBufferToBase64(arrayBuffer);

    const song = new Song(songId, file.name, file.size, audioData);
    songs.set(songId, song);

    // Decode audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    audioBuffers.set(songId, audioBuffer);

    renderSongCard(song);
    switchToSong(songId);

    songsSection.style.display = 'block';
    uploadArea.style.display = 'none';
    fileInfo.style.display = 'flex';

    saveToLocalStorage();
}

function renderSongCard(song) {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.dataset.songId = song.id;

    card.innerHTML = `
        <div class="song-card-info">
            <div class="song-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                </svg>
            </div>
            <div class="song-card-details">
                <div class="song-card-name">${song.name}</div>
                <div class="song-card-meta">${formatFileSize(song.size)}</div>
            </div>
        </div>
        <div class="song-card-actions">
            <button class="song-card-btn delete" onclick="deleteSong('${song.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (!e.target.closest('.song-card-actions')) {
            switchToSong(song.id);
        }
    });

    songsList.appendChild(card);
}

function switchToSong(songId) {
    if (!songs.has(songId)) return;

    // Save current song state
    if (currentSongId && songs.has(currentSongId)) {
        saveSongState(currentSongId);
    }

    // Stop current playback
    if (sourceNode) {
        try {
            sourceNode.stop();
        } catch (e) { }
    }

    currentSongId = songId;
    const song = songs.get(songId);

    // Update UI
    document.querySelectorAll('.song-card').forEach(card => {
        card.classList.toggle('active', card.dataset.songId === songId);
    });

    fileName.textContent = song.name;
    fileSize.textContent = formatFileSize(song.size);

    // Load settings
    loadSongSettings(song);

    // Show controls
    controlsSection.style.display = 'block';
    uploadArea.style.display = 'none';
    fileInfo.style.display = 'flex';

    // Update duration and progress bar
    const audioBuffer = audioBuffers.get(songId);
    if (audioBuffer) {
        durationEl.textContent = formatTime(audioBuffer.duration);

        // Restore progress bar position based on saved pauseTime
        if (song.playbackState.pauseTime > 0) {
            const percent = (song.playbackState.pauseTime / audioBuffer.duration) * 100;
            progressFill.style.width = `${percent}%`;
            currentTimeEl.textContent = formatTime(song.playbackState.pauseTime);
        } else {
            progressFill.style.width = '0%';
            currentTimeEl.textContent = '0:00';
        }
    }

    // Reset playback UI (don't auto-play on switch)
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';

    saveToLocalStorage();
}

function deleteSong(songId) {
    if (!confirm('Are you sure you want to delete this song?')) return;

    const wasCurrentSong = songId === currentSongId;

    songs.delete(songId);
    audioBuffers.delete(songId);

    const card = document.querySelector(`.song-card[data-song-id="${songId}"]`);
    if (card) card.remove();

    if (wasCurrentSong) {
        if (songs.size > 0) {
            switchToSong(Array.from(songs.keys())[0]);
        } else {
            currentSongId = null;
            controlsSection.style.display = 'none';
            uploadArea.style.display = 'block';
            fileInfo.style.display = 'none';
            songsSection.style.display = 'none';
        }
    }

    saveToLocalStorage();
}

function saveSongState(songId) {
    const song = songs.get(songId);
    if (!song) return;

    song.settings = {
        speed: parseInt(speedSlider.value),
        reverb: parseInt(reverbSlider.value),
        pitchShiftEnabled: pitchToggle.checked,
        pitch: parseInt(pitchSlider.value),
        bassBoostEnabled: bassBoostToggle.checked,
        bassBoost: parseInt(bassBoostSlider.value)
    };

    if (sourceNode && song.playbackState.isPlaying) {
        song.playbackState.pauseTime = audioContext.currentTime - startTime;
    }
}

function loadSongSettings(song) {
    speedSlider.value = song.settings.speed;
    speedValue.textContent = `${song.settings.speed}%`;

    reverbSlider.value = song.settings.reverb;
    reverbValue.textContent = `${song.settings.reverb}%`;

    pitchToggle.checked = song.settings.pitchShiftEnabled;
    pitchSlider.value = song.settings.pitch;
    pitchSlider.disabled = !song.settings.pitchShiftEnabled;

    bassBoostToggle.checked = song.settings.bassBoostEnabled;
    bassBoostSlider.value = song.settings.bassBoost;
    bassBoostSlider.disabled = !song.settings.bassBoostEnabled;
}

// ============================================================================
// FILE UPLOAD HANDLERS
// ============================================================================

uploadArea.addEventListener('click', () => fileInput.click());
changeFileBtn.addEventListener('click', () => fileInput.click());
addSongBtn.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        addSong(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        addSong(e.target.files[0]);
    }
    e.target.value = ''; // Reset input to allow re-uploading same file
});

// ============================================================================
// AUDIO PLAYBACK
// ============================================================================

function createAudioGraph() {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    const audioBuffer = audioBuffers.get(currentSongId);
    if (!audioBuffer) return;

    // Disconnect all existing nodes to prevent doubling
    if (sourceNode) {
        sourceNode.disconnect();
    }
    if (dryGainNode) {
        dryGainNode.disconnect();
    }
    if (wetGainNode) {
        wetGainNode.disconnect();
    }
    if (gainNode) {
        gainNode.disconnect();
    }
    if (bassBoostFilter) {
        bassBoostFilter.disconnect();
    }

    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.playbackRate.value = song.settings.speed / 100;

    dryGainNode = audioContext.createGain();
    wetGainNode = audioContext.createGain();
    gainNode = audioContext.createGain();

    bassBoostFilter = audioContext.createBiquadFilter();
    bassBoostFilter.type = 'lowshelf';
    bassBoostFilter.frequency.value = 200;
    bassBoostFilter.gain.value = song.settings.bassBoostEnabled ? song.settings.bassBoost : 0;

    sourceNode.connect(bassBoostFilter);

    if (song.settings.reverb > 0) {
        bassBoostFilter.connect(dryGainNode);
        dryGainNode.gain.value = 1 - (song.settings.reverb / 100);
        dryGainNode.connect(gainNode);

        bassBoostFilter.connect(convolverNode);
        convolverNode.connect(wetGainNode);
        wetGainNode.gain.value = song.settings.reverb / 100;
        wetGainNode.connect(gainNode);
    } else {
        bassBoostFilter.connect(gainNode);
    }

    gainNode.connect(audioContext.destination);

    sourceNode.onended = () => {
        if (song.playbackState.isPlaying) {
            stopPlayback();
        }
    };
}

playBtn.addEventListener('click', () => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    if (song.playbackState.isPlaying) {
        pausePlayback();
    } else {
        startPlayback();
    }
});

function startPlayback() {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    createAudioGraph();

    if (song.playbackState.pauseTime > 0) {
        sourceNode.start(0, song.playbackState.pauseTime);
        startTime = audioContext.currentTime - song.playbackState.pauseTime;
    } else {
        sourceNode.start(0);
        startTime = audioContext.currentTime;
    }

    song.playbackState.isPlaying = true;
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    updateProgress();
}

function pausePlayback() {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);

    if (sourceNode) {
        sourceNode.stop();
        song.playbackState.pauseTime = audioContext.currentTime - startTime;
    }
    song.playbackState.isPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';

    saveToLocalStorage();
}

function stopPlayback() {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);

    if (sourceNode) {
        sourceNode.stop();
    }
    song.playbackState.isPlaying = false;
    song.playbackState.pauseTime = 0;
    startTime = 0;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';

    saveToLocalStorage();
}

function updateProgress() {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    if (!song.playbackState.isPlaying) return;

    const audioBuffer = audioBuffers.get(currentSongId);
    const elapsed = (audioContext.currentTime - startTime) * (song.settings.speed / 100);
    const progress = (elapsed / audioBuffer.duration) * 100;

    progressFill.style.width = `${Math.min(progress, 100)}%`;
    currentTimeEl.textContent = formatTime(elapsed);

    if (elapsed < audioBuffer.duration) {
        requestAnimationFrame(updateProgress);
    }
}

progressBar.addEventListener('click', (e) => {
    if (!currentSongId) return;

    // Prevent event from bubbling
    e.stopPropagation();

    const song = songs.get(currentSongId);
    const audioBuffer = audioBuffers.get(currentSongId);
    if (!audioBuffer) return;

    // Get the progress bar's bounding rectangle
    const rect = progressBar.getBoundingClientRect();

    // Calculate the click position relative to the progress bar
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));

    // Calculate the actual time position in the audio
    const targetTime = audioBuffer.duration * percent;
    song.playbackState.pauseTime = targetTime;

    if (song.playbackState.isPlaying) {
        // If playing, restart from the new position
        pausePlayback();
        startPlayback();
    } else {
        // If paused, just update the UI
        progressFill.style.width = `${percent * 100}%`;
        currentTimeEl.textContent = formatTime(targetTime);
    }

    saveToLocalStorage();
});

// ============================================================================
// EFFECT CONTROLS
// ============================================================================

speedSlider.addEventListener('input', (e) => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    song.settings.speed = parseInt(e.target.value);
    speedValue.textContent = `${e.target.value}%`;

    if (song.playbackState.isPlaying && sourceNode) {
        sourceNode.playbackRate.value = song.settings.speed / 100;
    }

    saveToLocalStorage();
});

reverbSlider.addEventListener('input', (e) => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    song.settings.reverb = parseInt(e.target.value);
    reverbValue.textContent = `${e.target.value}%`;

    if (song.playbackState.isPlaying && dryGainNode && wetGainNode) {
        dryGainNode.gain.value = 1 - (song.settings.reverb / 100);
        wetGainNode.gain.value = song.settings.reverb / 100;
    }

    saveToLocalStorage();
});

pitchToggle.addEventListener('change', (e) => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    song.settings.pitchShiftEnabled = e.target.checked;
    pitchSlider.disabled = !song.settings.pitchShiftEnabled;

    if (song.settings.pitchShiftEnabled) {
        alert('Note: Pitch shifting requires additional processing. This feature will adjust playback speed to simulate pitch changes.');
    }

    saveToLocalStorage();
});

pitchSlider.addEventListener('input', (e) => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    song.settings.pitch = parseInt(e.target.value);

    saveToLocalStorage();
});

bassBoostToggle.addEventListener('change', (e) => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    song.settings.bassBoostEnabled = e.target.checked;
    bassBoostSlider.disabled = !song.settings.bassBoostEnabled;

    if (song.playbackState.isPlaying && bassBoostFilter) {
        bassBoostFilter.gain.value = song.settings.bassBoostEnabled ? song.settings.bassBoost : 0;
    }

    saveToLocalStorage();
});

bassBoostSlider.addEventListener('input', (e) => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    song.settings.bassBoost = parseFloat(e.target.value);

    if (song.playbackState.isPlaying && bassBoostFilter && song.settings.bassBoostEnabled) {
        bassBoostFilter.gain.value = song.settings.bassBoost;
    }

    saveToLocalStorage();
});

resetBtn.addEventListener('click', () => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);

    song.settings = {
        speed: 100,
        reverb: 0,
        pitchShiftEnabled: false,
        pitch: 0,
        bassBoostEnabled: false,
        bassBoost: 10
    };

    loadSongSettings(song);

    if (song.playbackState.isPlaying) {
        const wasPlaying = song.playbackState.isPlaying;
        pausePlayback();
        if (wasPlaying) {
            startPlayback();
        }
    }

    saveToLocalStorage();
});

// ============================================================================
// DOWNLOAD
// ============================================================================

// Helper function to render audio with effects
async function renderAudioWithEffects() {
    if (!currentSongId) return null;

    const song = songs.get(currentSongId);
    const audioBuffer = audioBuffers.get(currentSongId);

    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length / (song.settings.speed / 100),
        audioBuffer.sampleRate
    );

    const offlineSource = offlineContext.createBufferSource();
    offlineSource.buffer = audioBuffer;
    offlineSource.playbackRate.value = song.settings.speed / 100;

    const offlineBassBoost = offlineContext.createBiquadFilter();
    offlineBassBoost.type = 'lowshelf';
    offlineBassBoost.frequency.value = 200;
    offlineBassBoost.gain.value = song.settings.bassBoostEnabled ? song.settings.bassBoost : 0;

    const offlineGain = offlineContext.createGain();

    offlineSource.connect(offlineBassBoost);

    if (song.settings.reverb > 0) {
        const offlineConvolver = offlineContext.createConvolver();
        offlineConvolver.buffer = convolverNode.buffer;

        const offlineDry = offlineContext.createGain();
        const offlineWet = offlineContext.createGain();
        offlineDry.gain.value = 1 - (song.settings.reverb / 100);
        offlineWet.gain.value = song.settings.reverb / 100;

        offlineBassBoost.connect(offlineDry);
        offlineDry.connect(offlineGain);

        offlineBassBoost.connect(offlineConvolver);
        offlineConvolver.connect(offlineWet);
        offlineWet.connect(offlineGain);
    } else {
        offlineBassBoost.connect(offlineGain);
    }

    offlineGain.connect(offlineContext.destination);
    offlineSource.start(0);

    return await offlineContext.startRendering();
}

// Download as WAV
downloadWavBtn.addEventListener('click', async () => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    const renderedBuffer = await renderAudioWithEffects();

    const wav = audioBufferToWav(renderedBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.name.replace(/\.[^/.]+$/, '')}-slowed-reverb.wav`;
    a.click();

    URL.revokeObjectURL(url);
});

// Download as MP3
downloadMp3Btn.addEventListener('click', async () => {
    if (!currentSongId) return;

    const song = songs.get(currentSongId);
    const renderedBuffer = await renderAudioWithEffects();

    const mp3 = audioBufferToMp3(renderedBuffer);
    const blob = new Blob([mp3], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.name.replace(/\.[^/.]+$/, '')}-slowed-reverb.mp3`;
    a.click();

    URL.revokeObjectURL(url);
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function audioBufferToWav(buffer) {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    const setUint16 = (data) => {
        view.setUint16(pos, data, true);
        pos += 2;
    };
    const setUint32 = (data) => {
        view.setUint32(pos, data, true);
        pos += 4;
    };

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);

    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16);

    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            let sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return arrayBuffer;
}

// Convert AudioBuffer to MP3
function audioBufferToMp3(buffer) {
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const samples = buffer.length;

    // Get channel data
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = channels > 1 ? buffer.getChannelData(1) : leftChannel;

    // Convert float samples to 16-bit PCM
    const leftPcm = new Int16Array(samples);
    const rightPcm = new Int16Array(samples);

    for (let i = 0; i < samples; i++) {
        leftPcm[i] = Math.max(-32768, Math.min(32767, leftChannel[i] * 32768));
        rightPcm[i] = Math.max(-32768, Math.min(32767, rightChannel[i] * 32768));
    }

    // Initialize MP3 encoder (128 kbps)
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
    const mp3Data = [];

    // Encode in chunks
    const chunkSize = 1152; // LAME encoding chunk size
    for (let i = 0; i < samples; i += chunkSize) {
        const leftChunk = leftPcm.subarray(i, i + chunkSize);
        const rightChunk = rightPcm.subarray(i, i + chunkSize);
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }

    // Flush remaining data
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    // Combine all MP3 chunks
    const totalLength = mp3Data.reduce((acc, chunk) => acc + chunk.length, 0);
    const mp3 = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of mp3Data) {
        mp3.set(chunk, offset);
        offset += chunk.length;
    }

    return mp3;
}

// ============================================================================
// INITIALIZATION ON PAGE LOAD
// ============================================================================

window.addEventListener('DOMContentLoaded', async () => {
    initAudioContext();
    await loadFromLocalStorage();
});

// Save state before page unload
window.addEventListener('beforeunload', () => {
    if (currentSongId) {
        saveSongState(currentSongId);
        saveToLocalStorage();
    }
});
