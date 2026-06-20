// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const thumbGrid = document.getElementById('thumb-grid');
const addMore = document.getElementById('add-more');
const previewCard = document.getElementById('preview-card');
const optionsCard = document.getElementById('options-card');
const convertCard = document.getElementById('convert-card');
const convertBtn = document.getElementById('convert-btn');
const progressWrap = document.getElementById('progress-wrap');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const downloadBanner = document.getElementById('download-banner');
const downloadLink = document.getElementById('download-link');
const errorMsg = document.getElementById('error-msg');

const MAX_FILES = 10;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB 
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

let files = [];
let orientation = 'portrait';

// Open file picker on dropzone click 
dropzone.addEventListener('click', () => fileInput.click());

// Drag events 
dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles([...e.dataTransfer.files]);
});

fileInput.addEventListener('change', () => {
    handleFiles([...fileInput.files]);
    fileInput.value = '';
});

addMore.addEventListener('click', () => fileInput.click());

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('visible');
    setTimeout(() => errorMsg.classList.remove('visible'), 3000);
}

function handleFiles(newFiles) {
    newFiles.forEach(f => {
        if (!ALLOWED.includes(f.type)) { showError(f.name + ' is not a supported format.'); return; }
        if (f.size > MAX_SIZE) { showError(f.name + ' exceeds the 5 MB limit.'); return; }
        if (files.filter(Boolean).length >= MAX_FILES) { showError('Maximum 10 images allowed.'); return; }
        const idx = files.length;
        files.push(f);
        addThumb(f, idx);
    });

    if (files.filter(Boolean).length > 0) {
        previewCard.style.display = '';
        optionsCard.style.display = '';
        convertCard.style.display = '';
    }
}

function addThumb(file, idx) {
    const div = document.createElement('div');
    div.className = 'thumb';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'thumb-del';
    del.setAttribute('aria-label', 'Remove ' + file.name);
    del.innerHTML = '<i class="ti ti-x"></i>';
    del.addEventListener('click', () => {
        files[idx] = null;
        URL.revokeObjectURL(img.src);
        div.remove();
        if (files.filter(Boolean).length === 0) {
            previewCard.style.display = 'none';
            optionsCard.style.display = 'none';
            convertCard.style.display = 'none';
            downloadBanner.classList.remove('visible');
            files = [];
        }
    });

    div.appendChild(img);
    div.appendChild(del);
    thumbGrid.insertBefore(div, addMore);

    // Orientation toggle
    document.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            orientation = btn.dataset.val;
        });
    });

    // Convert — MOCKED (replace with real fetch when backend is ready)
    convertBtn.addEventListener('click', () => {
        const active = files.filter(Boolean);
        if (active.length === 0) return;

        convertBtn.disabled = true;
        downloadBanner.classList.remove('visible');
        progressWrap.classList.add('visible');
        progressFill.style.width = '0%';

        let pct = 0;
        const interval = setInterval(() => {
            pct += Math.random() * 20;
            if (pct >= 100) {
                pct = 100;
                clearInterval(interval);
                progressWrap.classList.remove('visible');
                downloadBanner.classList.add('visible');
                convertBtn.disabled = false;
                // TODO: downloadLink.href = '/Pdf/Download?sessionId=' + sessionId;
            }
            progressFill.style.width = pct + '%';
            progressLabel.textContent = 'Converting ' + active.length + ' image' + (active.length > 1 ? 's' : '') + '\u2026 ' + Math.round(pct) + '%';
        }, 180);
    });