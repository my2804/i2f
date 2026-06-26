// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.


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
const saveSection = document.getElementById('save-section');
const saveTitleInput = document.getElementById('save-title');
const saveBtn = document.getElementById('save-btn');

const MAX_FILES = 10;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB 
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

let files = [];
let orientation = 'portrait';


dropzone.addEventListener('click', () => fileInput.click());


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

function onDone(sessionId, imageCount) {
    progressWrap.classList.remove('visible');
    downloadBanner.classList.add('visible');
    downloadLink.href = '/Pdf/Download?sessionId=' + sessionId;
    saveSection.classList.add('visible');
    saveSection.dataset.sessionId = sessionId;
    saveSection.dataset.pageCount = imageCount;
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

  
    document.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            orientation = btn.dataset.val;
        });
    });
}

convertBtn.addEventListener('click', async () => {
    const active = files.filter(Boolean);
    if (active.length === 0) return;
    convertBtn.disabled = true;
    downloadBanner.classList.remove('visible');
    saveSection.classList.remove('visible');
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
        setTimeout(() => {
            onDone(uploadData.sessionId, active.length);
            convertBtn.disabled = false;
        }, 400);
    } catch (err) {
        progressWrap.classList.remove('visible');
        showError('Something went wrong: ' + err.message);
        convertBtn.disabled = false;
    }
});

saveBtn.addEventListener('click', async () => {
    const sessionId = saveSection.dataset.sessionId;
    const pageCount = parseInt(saveSection.dataset.pageCount);
    const title = saveTitleInput.value.trim() || 'My PDF';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    try {
        const res = await fetch('/Pdf/SavePdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, title, orientation, pageCount })
        });
        if (!res.ok) throw new Error('Save failed');
        saveBtn.textContent = '✓ Saved!';
        saveBtn.style.background = '#16a34a';
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save to My PDFs';
            saveBtn.style.background = '';
        }, 2000);
    } catch (err) {
        showError('Could not save: ' + err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save to My PDFs';
    }
});