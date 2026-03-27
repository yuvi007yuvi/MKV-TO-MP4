import { FFmpeg } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';
import { fetchFile, toBlobURL } from 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js';

let ffmpeg = null;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const fileInfo = document.getElementById('file-info');
const fileNameDisplay = document.getElementById('filename');
const fileSizeDisplay = document.getElementById('filesize');
const removeBtn = document.getElementById('remove-file');
const convertBtn = document.getElementById('convert-btn');
const downloadBtn = document.getElementById('download-btn');
const conversionStatus = document.getElementById('conversion-status');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const statusMessage = document.getElementById('status-message');
const resolutionSelect = document.getElementById('resolution');
const presetSelect = document.getElementById('encoding');

let selectedFile = null;

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
removeBtn.addEventListener('click', resetUI);
convertBtn.addEventListener('click', startConversion);

// Drag & Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file && file.name.toLowerCase().endsWith('.mkv')) {
        processFile(file);
    } else {
        alert('Please select a valid MKV file.');
    }
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

function processFile(file) {
    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    uploadArea.style.display = 'none';
    fileInfo.style.display = 'block';
    downloadBtn.style.display = 'none';
    convertBtn.style.display = 'block';
    conversionStatus.style.display = 'none';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
}

function resetUI() {
    selectedFile = null;
    fileInput.value = '';
    uploadArea.style.display = 'block';
    fileInfo.style.display = 'none';
}

async function startConversion() {
    if (!selectedFile) return;

    try {
        convertBtn.disabled = true;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        conversionStatus.style.display = 'block';
        
        // 1. Load FFmpeg
        statusMessage.textContent = 'Initializing engine...';
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        const ffURL = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm';
        
        if (!ffmpeg) {
            // For GitHub Pages: toBlobURL is essential for same-origin worker worker.js
            ffmpeg = new FFmpeg();
        }

        if (!ffmpeg.loaded) {
            // Register logger first
            ffmpeg.on('log', ({ message }) => {
                console.log(message);
            });

            ffmpeg.on('progress', ({ progress }) => {
                const percentage = Math.round(progress * 100);
                progressBar.style.width = percentage + '%';
                progressPercent.textContent = percentage + '%';
                statusMessage.textContent = `Converting: ${percentage}%`;
            });

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                workerURL: await toBlobURL(`${ffURL}/worker.js`, 'text/javascript'),
            });
        }

        // 2. Prepare File
        statusMessage.textContent = 'Reading file...';
        const fileName = selectedFile.name;
        const outputName = fileName.replace(/\.[^/.]+$/, "") + ".mp4";
        
        await ffmpeg.writeFile(fileName, await fetchFile(selectedFile));

        await ffmpeg.writeFile(fileName, await fetchFile(selectedFile));

        // 4. Construct Command
        statusMessage.textContent = 'Starting conversion...';
        
        const res = resolutionSelect.value;
        const preset = presetSelect.value;
        
        let args = ['-i', fileName];
        
        // Scaling
        if (res !== 'original') {
            const scaleMap = {
                '1080p': 'scale=1920:-2',
                '720p': 'scale=1280:-2',
                '480p': 'scale=854:-2'
            };
            args.push('-vf', scaleMap[res]);
        }

        // Fast conversion preset
        args.push('-c:v', 'libx264', '-preset', preset, '-crf', '23', '-c:a', 'aac', '-movflags', 'faststart', outputName);

        // 5. Run FFmpeg
        await ffmpeg.exec(args);

        // 6. Provide download
        const data = await ffmpeg.readFile(outputName);
        const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
        
        downloadBtn.style.display = 'block';
        convertBtn.style.display = 'none';
        
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = outputName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        statusMessage.textContent = 'Conversion Successful!';
        progressBar.style.width = '100%';
        progressPercent.textContent = '100%';

    } catch (error) {
        console.error(error);
        statusMessage.textContent = 'Error: ' + error.message;
        convertBtn.disabled = false;
        convertBtn.textContent = 'Retry Conversion';
        
        if (error.message.includes('SharedArrayBuffer')) {
            alert('This application requires special headers (COOP/COEP) to run FFmpeg. Please run this on a server that supports these or use a modern browser supporting it locally.');
        }
    }
}
