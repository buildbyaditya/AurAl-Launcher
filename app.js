document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // APP STATE
    // ==========================================
    const state = {
        contributorId: '',
        urlFields: [''], // Starts with 1 empty field
        isBulkMode: false,
        maxFields: 50,
        generatedResults: [],
        currentPage: 1
    };

    // ==========================================
    // DOM ELEMENT REFERENCES
    // ==========================================
    const page1 = document.getElementById('page-1');
    const page2 = document.getElementById('page-2');
    const page3 = document.getElementById('page-3');

    // Navigation Tabs
    const navBtn1 = document.getElementById('nav-btn-1');
    const navBtn2 = document.getElementById('nav-btn-2');
    const navBtn3 = document.getElementById('nav-btn-3');
    
    // Page 1 Elements
    const contributorIdInput = document.getElementById('contributor-id-input');
    const btnNextPage1 = document.getElementById('btn-next-page1');
    const p1ErrorMsg = document.getElementById('p1-error-msg');

    // Page 2 Elements
    const activeIdDisplay = document.getElementById('active-id-display');
    const btnEditId = document.getElementById('btn-edit-id');
    const urlCountBadge = document.getElementById('url-count-badge');
    
    // Toolbar & Views
    const btnAddUrl = document.getElementById('btn-add-url');
    const btnToggleBulk = document.getElementById('btn-toggle-bulk');
    const btnClearAll = document.getElementById('btn-clear-all');
    const singleModeView = document.getElementById('single-mode-view');
    const bulkModeView = document.getElementById('bulk-mode-view');
    const urlFieldsContainer = document.getElementById('url-fields-container');
    const bulkUrlsTextarea = document.getElementById('bulk-urls-textarea');
    const btnGenerate = document.getElementById('btn-generate');

    // Output Section Elements
    const outputSection = document.getElementById('output-section');
    const outputCountBadge = document.getElementById('output-count-badge');
    const outputListContainer = document.getElementById('output-list-container');
    const btnCopyAll = document.getElementById('btn-copy-all');
    const btnDownloadTxt = document.getElementById('btn-download-txt');
    const btnProceedLauncher = document.getElementById('btn-proceed-launcher');

    // Page 3 Launcher Elements
    const launcherIdDisplay = document.getElementById('launcher-id-display');
    const launchCountBadge = document.getElementById('launch-count-badge');
    const btnSyncUrls = document.getElementById('btn-sync-urls');
    const launchUrlsTextarea = document.getElementById('launch-urls-textarea');
    const btnClearLaunchInput = document.getElementById('btn-clear-launch-input');
    const launchErrorMsg = document.getElementById('launch-error-msg');
    const btnLaunchAll = document.getElementById('btn-launch-all');
    const metricParsedCount = document.getElementById('metric-parsed-count');
    const metricEngineStatus = document.getElementById('metric-engine-status');

    // Dual Input Method 01 File Upload Elements
    const txtFileInput = document.getElementById('txt-file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileStatusName = document.getElementById('file-status-name');

    // Telemetry & Toast Elements
    const toastContainer = document.getElementById('toast-container');
    const sysStatusText = document.getElementById('sys-status-text');
    const telemetryClock = document.getElementById('telemetry-clock');

    // ==========================================
    // INITIALIZATION & REALTIME CLOCK
    // ==========================================
    function init() {
        startTelemetryClock();
        renderUrlFields();
        setupEventListeners();
        setupFileUploadHandlers();
        contributorIdInput.focus();
    }

    function startTelemetryClock() {
        function updateClock() {
            const now = new Date();
            const istOptions = {
                timeZone: 'Asia/Kolkata',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            const istTime = new Intl.DateTimeFormat('en-GB', istOptions).format(now);
            const utcTime = now.toISOString().substring(11, 19);
            if (telemetryClock) {
                telemetryClock.textContent = `${istTime} IST (${utcTime} UTC)`;
            }
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // ==========================================
    // PAGE NAVIGATION LOGIC
    // ==========================================
    function goToPage(pageNum) {
        state.currentPage = pageNum;

        // Update Nav Tabs Active State
        if (navBtn1) navBtn1.classList.toggle('active-tab', pageNum === 1);
        if (navBtn2) navBtn2.classList.toggle('active-tab', pageNum === 2);
        if (navBtn3) navBtn3.classList.toggle('active-tab', pageNum === 3);

        // Toggle Page Views
        page1.classList.toggle('hidden-page', pageNum !== 1);
        page1.classList.toggle('active-page', pageNum === 1);
        page2.classList.toggle('hidden-page', pageNum !== 2);
        page2.classList.toggle('active-page', pageNum === 2);
        if (page3) {
            page3.classList.toggle('hidden-page', pageNum !== 3);
            page3.classList.toggle('active-page', pageNum === 3);
        }

        if (pageNum === 1) {
            sysStatusText.textContent = 'SYSTEM READY // PAGE 1';
            contributorIdInput.focus();
        } else if (pageNum === 2) {
            activeIdDisplay.textContent = state.contributorId || 'NONE REGISTERED';
            sysStatusText.textContent = 'MATRIX READY // PAGE 2';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (pageNum === 3) {
            if (launcherIdDisplay) launcherIdDisplay.textContent = state.contributorId || 'NONE REGISTERED';
            sysStatusText.textContent = 'BULK LAUNCHER // PAGE 3';
            
            // Auto pre-populate if textarea is empty and generated results exist
            if (launchUrlsTextarea && launchUrlsTextarea.value.trim() === '' && state.generatedResults.length > 0) {
                launchUrlsTextarea.value = state.generatedResults.map(r => r.final).join('\n');
            }

            updateLaunchMetrics();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function handlePage1Submit() {
        const rawInput = contributorIdInput.value.trim();
        if (!rawInput) {
            showError(p1ErrorMsg, true);
            contributorIdInput.classList.add('error-border');
            showToast('ERROR: Contributor ID is required', 'error');
            return;
        }

        showError(p1ErrorMsg, false);
        contributorIdInput.classList.remove('error-border');
        
        state.contributorId = rawInput;
        goToPage(2);
        showToast('CONTRIBUTOR ID REGISTERED');
    }

    function showError(element, show) {
        if (!element) return;
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }

    // ==========================================
    // DYNAMIC URL FIELDS LOGIC (PAGE 2)
    // ==========================================
    function renderUrlFields() {
        urlFieldsContainer.innerHTML = '';

        state.urlFields.forEach((val, index) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'url-input-row';
            rowDiv.dataset.index = index;

            const indexSpan = document.createElement('span');
            indexSpan.className = 'row-index';
            indexSpan.textContent = `[${String(index + 1).padStart(2, '0')}]`;

            const inputEl = document.createElement('input');
            inputEl.type = 'url';
            inputEl.className = 'brutalist-input url-field-input';
            inputEl.placeholder = `https://learn.microsoft.com/en-us/... (URL #${index + 1})`;
            inputEl.value = val;
            inputEl.autocomplete = 'off';
            inputEl.spellcheck = false;

            // Sync state on change/input
            inputEl.addEventListener('input', (e) => {
                state.urlFields[index] = e.target.value;
            });

            // Enter key triggers generate if not last, or adds new row
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index === state.urlFields.length - 1 && state.urlFields.length < state.maxFields) {
                        addUrlField();
                    } else {
                        handleGenerate();
                    }
                }
            });

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn-remove-row';
            removeBtn.innerHTML = '&times;';
            removeBtn.title = 'Remove Row';
            removeBtn.addEventListener('click', () => removeUrlField(index));

            rowDiv.appendChild(indexSpan);
            rowDiv.appendChild(inputEl);
            rowDiv.appendChild(removeBtn);

            urlFieldsContainer.appendChild(rowDiv);
        });

        updateUrlCountBadge();
    }

    function addUrlField() {
        if (state.urlFields.length >= state.maxFields) {
            showToast(`MAXIMUM LIMIT REACHED (${state.maxFields} FIELDS)`, 'error');
            return;
        }
        state.urlFields.push('');
        renderUrlFields();
        
        // Focus the newly created field
        const inputs = urlFieldsContainer.querySelectorAll('.url-field-input');
        if (inputs.length > 0) {
            inputs[inputs.length - 1].focus();
        }
    }

    function removeUrlField(index) {
        if (state.urlFields.length === 1) {
            state.urlFields[0] = '';
            renderUrlFields();
            showToast('FIELD CLEARED');
            return;
        }
        state.urlFields.splice(index, 1);
        renderUrlFields();
    }

    function updateUrlCountBadge() {
        const count = state.urlFields.length;
        urlCountBadge.textContent = `INPUTS: ${count} / ${state.maxFields}`;
        
        if (count >= state.maxFields) {
            btnAddUrl.setAttribute('disabled', 'true');
            btnAddUrl.style.opacity = '0.5';
            btnAddUrl.style.cursor = 'not-allowed';
        } else {
            btnAddUrl.removeAttribute('disabled');
            btnAddUrl.style.opacity = '1';
            btnAddUrl.style.cursor = 'pointer';
        }
    }

    function toggleBulkMode() {
        state.isBulkMode = !state.isBulkMode;

        if (state.isBulkMode) {
            // Populate textarea with non-empty fields
            bulkUrlsTextarea.value = state.urlFields.filter(u => u.trim() !== '').join('\n');
            singleModeView.classList.remove('active-mode');
            singleModeView.classList.add('hidden-mode');
            bulkModeView.classList.add('active-mode');
            bulkModeView.classList.remove('hidden-mode');
            btnToggleBulk.textContent = '[ MODE: SINGLE FIELDS ]';
            bulkUrlsTextarea.focus();
        } else {
            // Sync lines back to single fields
            const lines = bulkUrlsTextarea.value.split('\n').map(l => l.trim()).filter(l => l !== '');
            state.urlFields = lines.length > 0 ? lines.slice(0, state.maxFields) : [''];
            renderUrlFields();
            bulkModeView.classList.remove('active-mode');
            bulkModeView.classList.add('hidden-mode');
            singleModeView.classList.add('active-mode');
            singleModeView.classList.remove('hidden-mode');
            btnToggleBulk.textContent = '[ MODE: BULK PASTE ]';
        }
    }

    function clearAllFields() {
        state.urlFields = [''];
        bulkUrlsTextarea.value = '';
        renderUrlFields();
        outputSection.classList.add('hidden-section');
        showToast('ALL URL FIELDS RESET');
    }

    // ==========================================
    // CORE STRING MANIPULATION ENGINE
    // ==========================================
    function stripMicrosoftLocale(url) {
        if (!url) return '';
        const localeRegex = /\/[a-z]{2,3}-[a-z]{2,4}(?=\/|\?|#|$)/gi;
        return url.replace(localeRegex, '');
    }

    function appendContributorId(url, contributorId) {
        if (!url) return '';
        if (!contributorId) return url;

        let cleanId = contributorId.trim();

        if (cleanId.startsWith('?') || cleanId.startsWith('&')) {
            cleanId = cleanId.substring(1).trim();
        }

        if (!cleanId.includes('=')) {
            cleanId = `wt.mc_id=${cleanId}`;
        }

        const hasQuery = url.includes('?');

        if (hasQuery) {
            return `${url}&${cleanId}`;
        } else {
            return `${url}?${cleanId}`;
        }
    }

    function transformUrl(originalUrl, id) {
        const trimmed = originalUrl.trim();
        if (!trimmed) return null;

        const localeStripped = stripMicrosoftLocale(trimmed);
        const finalUrl = appendContributorId(localeStripped, id);

        return {
            original: trimmed,
            localeStripped: localeStripped,
            final: finalUrl
        };
    }

    // ==========================================
    // GENERATE & OUTPUT MANIFEST LOGIC
    // ==========================================
    function handleGenerate() {
        let sourceUrls = [];

        if (state.isBulkMode) {
            sourceUrls = bulkUrlsTextarea.value
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0);
        } else {
            sourceUrls = state.urlFields
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        if (sourceUrls.length === 0) {
            showToast('ENTER AT LEAST ONE TARGET URL', 'error');
            return;
        }

        const results = [];
        sourceUrls.forEach(rawUrl => {
            const transformed = transformUrl(rawUrl, state.contributorId);
            if (transformed) {
                results.push(transformed);
            }
        });

        state.generatedResults = results;
        renderOutputManifest(results);
        showToast(`GENERATED ${results.length} TRANSFORMED URL(S)`);
    }

    function renderOutputManifest(results) {
        outputListContainer.innerHTML = '';
        outputCountBadge.textContent = `GENERATED: ${results.length}`;

        results.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'output-item-card';

            const header = document.createElement('div');
            header.className = 'output-item-header';
            header.innerHTML = `
                <span class="output-item-index">[ RESULT #${String(index + 1).padStart(2, '0')} ]</span>
                <span class="tech-stamp">STATUS: OPTIMIZED</span>
            `;

            const body = document.createElement('div');
            body.className = 'output-item-body';
            body.innerHTML = `
                <div class="url-comparison">
                    <div class="url-line">
                        <span class="url-tag tag-orig">ORIGINAL:</span>
                        <span class="url-val">${escapeHtml(item.original)}</span>
                    </div>
                    <div class="url-line">
                        <span class="url-tag tag-new">TRANSFORMED:</span>
                        <span class="url-val" style="color: var(--accent-red); font-weight: 700;">${escapeHtml(item.final)}</span>
                    </div>
                </div>
            `;

            const actions = document.createElement('div');
            actions.className = 'output-item-actions';

            const copySingleBtn = document.createElement('button');
            copySingleBtn.type = 'button';
            copySingleBtn.className = 'brutalist-btn btn-sm btn-secondary';
            copySingleBtn.innerHTML = '&#128203; COPY URL';
            copySingleBtn.addEventListener('click', () => {
                copyToClipboard(item.final);
                showToast(`COPIED RESULT #${index + 1}`);
            });

            actions.appendChild(copySingleBtn);
            card.appendChild(header);
            card.appendChild(body);
            card.appendChild(actions);

            outputListContainer.appendChild(card);
        });

        outputSection.classList.remove('hidden-section');
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function copyAllResults() {
        if (state.generatedResults.length === 0) return;
        const allText = state.generatedResults.map(r => r.final).join('\n');
        copyToClipboard(allText);
        showToast(`COPIED ALL ${state.generatedResults.length} URLS TO CLIPBOARD`);
    }

    function downloadTxtResults() {
        if (state.generatedResults.length === 0) return;
        const allText = state.generatedResults.map(r => r.final).join('\r\n');
        const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aURaL_urls_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('DOWNLOADED TRANSFORM MANIFEST (.TXT)');
    }

    // ==========================================
    // PAGE 3: BULK URL LAUNCHER ENGINE & FILEREADER
    // ==========================================
    function setupFileUploadHandlers() {
        if (txtFileInput) {
            txtFileInput.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                    processUploadedFile(files[0]);
                }
            });
        }

        if (dropZone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.remove('dragover');
                }, false);
            });

            dropZone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files && files.length > 0) {
                    processUploadedFile(files[0]);
                }
            });
        }
    }

    function processUploadedFile(file) {
        if (!file.name.toLowerCase().endsWith('.txt')) {
            showToast('ERROR: ONLY .TXT FILES ARE ACCEPTED', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            if (launchUrlsTextarea) {
                launchUrlsTextarea.value = content;
                updateLaunchMetrics();
                showError(launchErrorMsg, false);
                launchUrlsTextarea.classList.remove('error-border');
            }

            if (fileStatusName) {
                fileStatusName.textContent = `${file.name.toUpperCase()} (${(file.size / 1024).toFixed(1)} KB)`;
            }

            const cleanCount = content.split('\n').filter(l => l.trim().length > 0).length;
            showToast(`LOADED ${cleanCount} URLS FROM ${file.name.toUpperCase()}`);
        };

        reader.onerror = () => {
            showToast('ERROR READING .TXT FILE', 'error');
        };

        reader.readAsText(file);
    }

    // ==========================================
    // INLINE WEB WORKER CREATION (BYPASS TAB THROTTLING)
    // ==========================================
    function createLaunchWorker() {
        const workerCode = `
            let timerId = null;
            self.onmessage = function(e) {
                const data = e.data;
                if (data.action === 'start') {
                    const total = data.total;
                    const delay = data.delay || 10000;
                    let count = 0;

                    // Dispatch first tick immediately
                    self.postMessage({ action: 'tick', index: count });
                    count++;

                    if (count >= total) {
                        self.postMessage({ action: 'complete' });
                        return;
                    }

                    timerId = setInterval(() => {
                        if (count < total) {
                            self.postMessage({ action: 'tick', index: count });
                            count++;
                        } else {
                            if (timerId) clearInterval(timerId);
                            self.postMessage({ action: 'complete' });
                        }
                    }, delay);
                } else if (data.action === 'stop') {
                    if (timerId) clearInterval(timerId);
                }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        worker._blobUrl = workerUrl;
        return worker;
    }

    function handleProceedToLauncher() {
        if (state.generatedResults.length > 0 && launchUrlsTextarea) {
            launchUrlsTextarea.value = state.generatedResults.map(r => r.final).join('\n');
        }
        goToPage(3);
        if (state.generatedResults.length > 0) {
            showToast(`TRANSFERRED ${state.generatedResults.length} URLS TO LAUNCHER`);
        }
    }

    function syncGeneratedUrlsToLauncher() {
        if (state.generatedResults.length === 0) {
            showToast('NO GENERATED URLS IN MATRIX TO SYNC', 'error');
            return;
        }
        if (launchUrlsTextarea) {
            launchUrlsTextarea.value = state.generatedResults.map(r => r.final).join('\n');
            updateLaunchMetrics();
            showError(launchErrorMsg, false);
            launchUrlsTextarea.classList.remove('error-border');
            showToast(`SYNCED ${state.generatedResults.length} GENERATED URLS`);
        }
    }

    function updateLaunchMetrics() {
        if (!launchUrlsTextarea) return;
        const rawVal = launchUrlsTextarea.value;
        const cleanLines = rawVal
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);
        const count = cleanLines.length;

        if (metricParsedCount) metricParsedCount.textContent = count;
        if (launchCountBadge) launchCountBadge.textContent = `READY: ${count} LINKS`;
    }

    function handleLaunchAll() {
        if (!launchUrlsTextarea) return;

        // Terminate any active worker prior to starting a new execution
        if (state.activeWorker) {
            state.activeWorker.terminate();
            if (state.activeWorker._blobUrl) URL.revokeObjectURL(state.activeWorker._blobUrl);
            state.activeWorker = null;
        }

        const rawVal = launchUrlsTextarea.value;
        const cleanUrls = rawVal
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Error Handling: empty or invalid list (no URLs provided)
        if (cleanUrls.length === 0) {
            showError(launchErrorMsg, true);
            launchUrlsTextarea.classList.add('error-border');
            if (metricEngineStatus) {
                metricEngineStatus.textContent = 'ERROR // NO URLS';
                metricEngineStatus.className = 'metric-val status-active';
            }
            showToast('ERROR: NO URLS PROVIDED', 'error');
            return;
        }

        showError(launchErrorMsg, false);
        launchUrlsTextarea.classList.remove('error-border');

        // Format URLs to ensure valid protocol
        const validUrls = cleanUrls.map(url => {
            if (!/^https?:\/\//i.test(url)) {
                return 'https://' + url;
            }
            return url;
        });

        // 1. Disable button & update UI to LAUNCHING...
        btnLaunchAll.disabled = true;
        btnLaunchAll.style.opacity = '0.7';
        btnLaunchAll.style.cursor = 'not-allowed';

        const btnTextEl = btnLaunchAll.querySelector('.btn-text');
        if (btnTextEl) {
            btnTextEl.textContent = `LAUNCHING (1 / ${validUrls.length})...`;
        }

        if (metricEngineStatus) {
            metricEngineStatus.textContent = `STATUS: LAUNCHING 1 / ${validUrls.length}`;
            metricEngineStatus.className = 'metric-val status-active';
        }

        let openedCount = 0;
        let popupBlocked = false;

        function resetLaunchButtonUI() {
            btnLaunchAll.disabled = false;
            btnLaunchAll.style.opacity = '1';
            btnLaunchAll.style.cursor = 'pointer';
            if (btnTextEl) {
                btnTextEl.textContent = 'LAUNCH ALL TABS';
            }
        }

        // 2. Instantiate Blob Web Worker for background timer
        try {
            const worker = createLaunchWorker();
            state.activeWorker = worker;

            worker.onmessage = function(e) {
                const msg = e.data;

                if (msg.action === 'tick') {
                    const idx = msg.index;
                    const currentUrl = validUrls[idx];
                    const currentNum = idx + 1;
                    const totalNum = validUrls.length;

                    // Update UI Progress Counter
                    if (btnTextEl) {
                        btnTextEl.textContent = `LAUNCHING (${currentNum} / ${totalNum})...`;
                    }
                    if (metricEngineStatus) {
                        metricEngineStatus.textContent = `STATUS: LAUNCHING ${currentNum} / ${totalNum}`;
                        metricEngineStatus.className = 'metric-val status-active';
                    }

                    // Execute window.open in main thread
                    try {
                        const win = window.open(currentUrl, '_blank');
                        if (!win || win.closed || typeof win.closed === 'undefined') {
                            popupBlocked = true;
                        } else {
                            openedCount++;
                        }
                    } catch (err) {
                        popupBlocked = true;
                    }

                    showToast(`[${currentNum}/${totalNum}] DISPATCHED: ${currentUrl.substring(0, 32)}...`);

                } else if (msg.action === 'complete') {
                    // Completion State: Terminate Web Worker & reset UI
                    worker.terminate();
                    if (worker._blobUrl) URL.revokeObjectURL(worker._blobUrl);
                    state.activeWorker = null;

                    resetLaunchButtonUI();

                    if (metricEngineStatus) {
                        metricEngineStatus.textContent = 'STANDBY // DISPATCH COMPLETE';
                        metricEngineStatus.className = 'metric-val status-idle';
                    }

                    if (popupBlocked && openedCount < validUrls.length) {
                        showToast(`DISPATCH COMPLETE. IF FEWER THAN ${validUrls.length} OPENED, ALLOW POP-UPS IN BROWSER SETTINGS!`, 'error');
                    } else {
                        showToast(`SUCCESS: ALL ${validUrls.length} TABS DISPATCHED (10s INTERVAL)`);
                    }
                }
            };

            worker.onerror = function(err) {
                console.error('Web Worker Error:', err);
                worker.terminate();
                if (worker._blobUrl) URL.revokeObjectURL(worker._blobUrl);
                state.activeWorker = null;
                resetLaunchButtonUI();
                showToast('WORKER DISPATCH ERROR', 'error');
            };

            // Send start action with 10000ms (8 seconds) delay
            worker.postMessage({ action: 'start', total: validUrls.length, delay: 8000 });

        } catch (err) {
            console.warn('Blob Worker creation failed, falling back to interval:', err);
            let currentIndex = 0;
            const fallbackInterval = setInterval(() => {
                if (currentIndex < validUrls.length) {
                    const currentUrl = validUrls[currentIndex];
                    const currentNum = currentIndex + 1;
                    const totalNum = validUrls.length;

                    if (btnTextEl) btnTextEl.textContent = `LAUNCHING (${currentNum} / ${totalNum})...`;
                    if (metricEngineStatus) metricEngineStatus.textContent = `STATUS: LAUNCHING ${currentNum} / ${totalNum}`;

                    try {
                        window.open(currentUrl, '_blank');
                    } catch (e) {}

                    currentIndex++;
                } else {
                    clearInterval(fallbackInterval);
                    resetLaunchButtonUI();
                    if (metricEngineStatus) metricEngineStatus.textContent = 'STANDBY // DISPATCH COMPLETE';
                    showToast(`SUCCESS: ALL ${validUrls.length} TABS DISPATCHED`);
                }
            }, 10000);
        }
    }


    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(err => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (e) {
            console.error('Fallback copy failed', e);
        }
        document.body.removeChild(textarea);
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'brutalist-toast';
        if (type === 'error') {
            toast.style.borderColor = 'var(--accent-red)';
        }

        toast.innerHTML = `
            <span class="toast-icon">${type === 'error' ? '[!]' : '[+]'}</span>
            <span>${escapeHtml(message)}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.2s ease-out';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 200);
        }, 3000);
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ==========================================
    // EVENT LISTENERS SETUP
    // ==========================================
    function setupEventListeners() {
        // Navigation Bar Tabs
        if (navBtn1) navBtn1.addEventListener('click', () => goToPage(1));
        if (navBtn2) navBtn2.addEventListener('click', () => goToPage(2));
        if (navBtn3) navBtn3.addEventListener('click', () => goToPage(3));

        // Page 1
        btnNextPage1.addEventListener('click', handlePage1Submit);
        contributorIdInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handlePage1Submit();
            }
        });

        // Page 2
        btnEditId.addEventListener('click', () => goToPage(1));
        btnAddUrl.addEventListener('click', addUrlField);
        btnToggleBulk.addEventListener('click', toggleBulkMode);
        btnClearAll.addEventListener('click', clearAllFields);
        btnGenerate.addEventListener('click', handleGenerate);

        // Output Section
        btnCopyAll.addEventListener('click', copyAllResults);
        btnDownloadTxt.addEventListener('click', downloadTxtResults);
        if (btnProceedLauncher) btnProceedLauncher.addEventListener('click', handleProceedToLauncher);

        // Page 3 Launcher
        if (btnSyncUrls) btnSyncUrls.addEventListener('click', syncGeneratedUrlsToLauncher);
        if (btnClearLaunchInput) {
            btnClearLaunchInput.addEventListener('click', () => {
                if (launchUrlsTextarea) {
                    launchUrlsTextarea.value = '';
                    if (txtFileInput) txtFileInput.value = '';
                    if (fileStatusName) fileStatusName.textContent = 'NO FILE LOADED';
                    updateLaunchMetrics();
                    showError(launchErrorMsg, false);
                    launchUrlsTextarea.classList.remove('error-border');
                    showToast('LAUNCH QUEUE CLEARED');
                }
            });
        }
        if (launchUrlsTextarea) {
            launchUrlsTextarea.addEventListener('input', () => {
                updateLaunchMetrics();
                showError(launchErrorMsg, false);
                launchUrlsTextarea.classList.remove('error-border');
            });
        }
        if (btnLaunchAll) btnLaunchAll.addEventListener('click', handleLaunchAll);
    }

    // Start App
    init();
});


