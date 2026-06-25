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

    convertBtn.addEventListener('click', async () => {
        const active = files.filter(Boolean);
        if (active.length === 0) return;

        // Step 1 — Upload images
        convertBtn.disabled = true;
        downloadBanner.classList.remove('visible');
        progressWrap.classList.add('visible');
        progressFill.style.width = '20%';
        progressLabel.textContent = 'Uploading images...';

        try {
            const formData = new FormData();
            active.forEach(f => formData.append('images', f));

            const uploadRes = await fetch('/Pdf/Upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const uploadData = await uploadRes.json();

            progressFill.style.width = '60%';
            progressLabel.textContent = 'Generating PDF...';

            // Step 2 — Convert
            const convertRes = await fetch('/Pdf/Convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: uploadData.sessionId,
                    images: uploadData.images,
                    options: { orientation }
                })
            });

            if (!convertRes.ok) throw new Error('Conversion failed');

            progressFill.style.width = '100%';
            progressLabel.textContent = 'Done!';

            // Step 3 — Set download link
            setTimeout(() => {
                progressWrap.classList.remove('visible');
                downloadBanner.classList.add('visible');
                downloadLink.href = '/Pdf/Download?sessionId=' + uploadData.sessionId;
                convertBtn.disabled = false;
            }, 400);

        } catch (err) {
            progressWrap.classList.remove('visible');
            showError('Something went wrong: ' + err.message);
            convertBtn.disabled = false;
        }
    })
}