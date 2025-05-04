document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const DOM = {
        // Input
        inputText: document.getElementById('inputText'),
        fileInput: document.getElementById('fileInput'),
        dropZone: document.getElementById('dropZone'),
        filePreview: document.getElementById('filePreview'),
        
        // Cámara
        cameraPreview: document.getElementById('cameraPreview'),
        photoCanvas: document.getElementById('photoCanvas'),
        startCameraBtn: document.getElementById('startCameraBtn'),
        captureBtn: document.getElementById('captureBtn'),
        retakeBtn: document.getElementById('retakeBtn'),
        uploadPhotoBtn: document.getElementById('uploadPhotoBtn'),
        
        // Dibujo
        drawingCanvas: document.getElementById('drawingCanvas'),
        drawTools: document.querySelectorAll('.draw-tool'),
        brushSize: document.getElementById('brushSize'),
        drawColor: document.getElementById('drawColor'),
        clearCanvasBtn: document.getElementById('clearCanvasBtn'),
        
        // Tabs
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Acciones
        translateBtn: document.getElementById('translateBtn'),
        speakBtn: document.getElementById('speakBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        copyBtn: document.getElementById('copyBtn'),
        savePresetBtn: document.getElementById('savePresetBtn'),
        pasteBtn: document.getElementById('pasteBtn'),
        clearTextBtn: document.getElementById('clearTextBtn'),
        
        // Output
        brailleOutput: document.getElementById('brailleOutput'),
        brailleSizeValue: document.getElementById('brailleSizeValue'),
        decreaseSizeBtn: document.getElementById('decreaseSizeBtn'),
        increaseSizeBtn: document.getElementById('increaseSizeBtn'),
        
        // Modal OCR
        ocrModal: document.getElementById('ocrModal'),
        ocrProgress: document.getElementById('ocrProgress'),
        ocrStatus: document.getElementById('ocrStatus'),
        fileTypeInfo: document.getElementById('fileTypeInfo'),
        progressSpeed: document.getElementById('progressSpeed'),
        cancelOcrBtn: document.getElementById('cancelOcrBtn'),
        modalClose: document.querySelector('.modal-close')
    };

    // Variables de estado
    const state = {
        currentTab: 'text',
        cameraStream: null,
        photoTaken: false,
        drawing: {
            isDrawing: false,
            tool: 'pen',
            color: '#000000',
            size: 5
        },
        brailleSize: 24,
        lastOCRTime: 0,
        ocrWorker: null
    };

    // Mapa Braille extendido
    const brailleMap = {
        'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
        'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
        'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
        'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
        'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽',
        'z': '⠵',
        '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
        '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
        ' ': ' ', '\n': '\n',
        '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒',
        '?': '⠦', '!': '⠖', "'": '⠄', '"': '⠐⠄',
        '-': '⠤', '(': '⠐⠣', ')': '⠐⠜',
        'á': '⠷', 'é': '⠮', 'í': '⠌', 'ó': '⠬', 'ú': '⠾',
        'ñ': '⠻', 'ü': '⠳', '¿': '⠢', '¡': '⠐⠖'
    };

    // Inicialización
    function init() {
        setupTabs();
        setupCamera();
        setupDrawing();
        setupEventListeners();
        updateBrailleSize();
    }

    // Configuración de pestañas
    function setupTabs() {
        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
    }

    function switchTab(tabId) {
        // Actualizar pestañas activas
        DOM.tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            }
        });

        // Actualizar contenido activo
        DOM.tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            }
        });

        state.currentTab = tabId;
    }

    // Configuración de cámara
    function setupCamera() {
        DOM.startCameraBtn.addEventListener('click', startCamera);
        DOM.captureBtn.addEventListener('click', capturePhoto);
        DOM.retakeBtn.addEventListener('click', retakePhoto);
        DOM.uploadPhotoBtn.addEventListener('click', processPhoto);
    }

    async function startCamera() {
        try {
            state.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' },
                audio: false 
            });
            DOM.cameraPreview.srcObject = state.cameraStream;
            DOM.startCameraBtn.classList.add('hidden');
            DOM.captureBtn.classList.remove('hidden');
            DOM.photoCanvas.classList.add('hidden');
            DOM.retakeBtn.classList.add('hidden');
            DOM.uploadPhotoBtn.classList.add('hidden');
            state.photoTaken = false;
        } catch (err) {
            showError('No se pudo acceder a la cámara: ' + err.message);
        }
    }

    function capturePhoto() {
        if (!state.cameraStream) return;

        const context = DOM.photoCanvas.getContext('2d');
        DOM.photoCanvas.width = DOM.cameraPreview.videoWidth;
        DOM.photoCanvas.height = DOM.cameraPreview.videoHeight;
        
        // Aplicar filtro para mejorar el contraste
        context.filter = 'contrast(1.2) brightness(1.1) grayscale(50%)';
        context.drawImage(DOM.cameraPreview, 0, 0, DOM.photoCanvas.width, DOM.photoCanvas.height);
        
        DOM.cameraPreview.classList.add('hidden');
        DOM.photoCanvas.classList.remove('hidden');
        DOM.captureBtn.classList.add('hidden');
        DOM.retakeBtn.classList.remove('hidden');
        DOM.uploadPhotoBtn.classList.remove('hidden');
        state.photoTaken = true;
    }

    function retakePhoto() {
        DOM.photoCanvas.classList.add('hidden');
        DOM.cameraPreview.classList.remove('hidden');
        DOM.retakeBtn.classList.add('hidden');
        DOM.uploadPhotoBtn.classList.add('hidden');
        DOM.captureBtn.classList.remove('hidden');
        state.photoTaken = false;
        startCamera();
    }

    function processPhoto() {
        if (!state.photoTaken) return;
        extractTextFromCanvas(DOM.photoCanvas);
    }

    // Configuración de dibujo
    function setupDrawing() {
        const ctx = DOM.drawingCanvas.getContext('2d');
        
        // Establecer tamaño del canvas
        DOM.drawingCanvas.width = DOM.drawingCanvas.offsetWidth;
        DOM.drawingCanvas.height = DOM.drawingCanvas.offsetHeight;
        
        // Limpiar canvas
        clearDrawingCanvas();
        
        // Eventos de dibujo
        DOM.drawingCanvas.addEventListener('mousedown', startDrawing);
        DOM.drawingCanvas.addEventListener('mousemove', draw);
        DOM.drawingCanvas.addEventListener('mouseup', stopDrawing);
        DOM.drawingCanvas.addEventListener('mouseout', stopDrawing);
        
        // Eventos táctiles
        DOM.drawingCanvas.addEventListener('touchstart', handleTouch);
        DOM.drawingCanvas.addEventListener('touchmove', handleTouch);
        DOM.drawingCanvas.addEventListener('touchend', stopDrawing);
        
        // Herramientas
        DOM.drawTools.forEach(tool => {
            tool.addEventListener('click', () => {
                DOM.drawTools.forEach(t => t.classList.remove('active'));
                tool.classList.add('active');
                state.drawing.tool = tool.getAttribute('data-tool');
            });
        });
        
        // Tamaño y color
        DOM.brushSize.addEventListener('input', () => {
            state.drawing.size = DOM.brushSize.value;
        });
        
        DOM.drawColor.addEventListener('input', () => {
            state.drawing.color = DOM.drawColor.value;
        });
        
        // Limpiar
        DOM.clearCanvasBtn.addEventListener('click', clearDrawingCanvas);
    }

    function clearDrawingCanvas() {
        const ctx = DOM.drawingCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, DOM.drawingCanvas.width, DOM.drawingCanvas.height);
    }

    function startDrawing(e) {
        state.drawing.isDrawing = true;
        draw(e);
    }

    function draw(e) {
        if (!state.drawing.isDrawing) return;
        
        const ctx = DOM.drawingCanvas.getContext('2d');
        const rect = DOM.drawingCanvas.getBoundingClientRect();
        let x, y;
        
        if (e.type.includes('touch')) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        if (state.drawing.tool === 'pen') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = state.drawing.color;
        } else { // borrador
            ctx.globalCompositeOperation = 'destination-out';
        }
        
        ctx.lineWidth = state.drawing.size;
        
        if (state.drawing.lastX === undefined || state.drawing.lastY === undefined) {
            ctx.beginPath();
            ctx.arc(x, y, state.drawing.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(state.drawing.lastX, state.drawing.lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        state.drawing.lastX = x;
        state.drawing.lastY = y;
    }

    function handleTouch(e) {
        e.preventDefault();
        if (e.type === 'touchstart') {
            startDrawing(e);
        } else if (e.type === 'touchmove') {
            draw(e);
        }
    }

    function stopDrawing() {
        state.drawing.isDrawing = false;
        state.drawing.lastX = undefined;
        state.drawing.lastY = undefined;
    }

    // Configuración de eventos
    function setupEventListeners() {
        // Traducción
        DOM.translateBtn.addEventListener('click', translateContent);
        
        // Texto a voz
        DOM.speakBtn.addEventListener('click', speakText);
        
        // Descarga
        DOM.downloadBtn.addEventListener('click', downloadResult);
        
        // Copiar
        DOM.copyBtn.addEventListener('click', copyToClipboard);
        
        // Pegar
        DOM.pasteBtn.addEventListener('click', pasteText);
        
        // Limpiar texto
        DOM.clearTextBtn.addEventListener('click', clearText);
        
        // Tamaño Braille
        DOM.decreaseSizeBtn.addEventListener('click', () => {
            state.brailleSize = Math.max(12, state.brailleSize - 2);
            updateBrailleSize();
        });
        
        DOM.increaseSizeBtn.addEventListener('click', () => {
            state.brailleSize = Math.min(48, state.brailleSize + 2);
            updateBrailleSize();
        });
        
        // Subida de archivos
        DOM.fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        DOM.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            DOM.dropZone.classList.add('active');
        });
        
        DOM.dropZone.addEventListener('dragleave', () => {
            DOM.dropZone.classList.remove('active');
        });
        
        DOM.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            DOM.dropZone.classList.remove('active');
            if (e.dataTransfer.files.length) {
                DOM.fileInput.files = e.dataTransfer.files;
                handleFileSelect({ target: DOM.fileInput });
            }
        });
        
        // Modal OCR
        DOM.modalClose.addEventListener('click', hideOCRModal);
        DOM.cancelOcrBtn.addEventListener('click', cancelOCR);
        
        // Tecla Enter para traducir
        DOM.inputText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                DOM.translateBtn.click();
            }
        });
    }

    // Funcionalidad principal de traducción
    function translateContent() {
        let text = '';
        
        switch (state.currentTab) {
            case 'text':
                text = DOM.inputText.value;
                break;
            case 'draw':
                // Convertir dibujo a texto (OCR)
                extractTextFromCanvas(DOM.drawingCanvas);
                return;
            case 'camera':
                if (state.photoTaken) {
                    extractTextFromCanvas(DOM.photoCanvas);
                    return;
                } else {
                    showError('Por favor, toma una foto primero');
                    return;
                }
            case 'upload':
                if (DOM.fileInput.files.length) {
                    processFileForOCR(DOM.fileInput.files[0]);
                    return;
                } else {
                    showError('Por favor, selecciona un archivo primero');
                    return;
                }
        }
        
        if (!text.trim()) {
            showError('Por favor, ingresa algún texto');
            return;
        }
        
        const brailleText = translateToBraille(text);
        displayResult(brailleText);
    }

    function translateToBraille(text) {
        let brailleText = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            brailleText += brailleMap[char.toLowerCase()] || char;
        }
        
        return brailleText;
    }

    function displayResult(text) {
        DOM.brailleOutput.innerHTML = text ? 
            `<div style="font-size: ${state.brailleSize}px;">${text}</div>` : 
            `<div class="empty-state"><i class="fas fa-braille"></i><p>No se pudo generar la traducción</p></div>`;
        
        // Animación de la tortuga
        animateTurtle();
    }

    // OCR y procesamiento de archivos
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        showFilePreview(file);
        processFileForOCR(file);
    }

    function showFilePreview(file) {
        const preview = DOM.filePreview.querySelector('.preview-placeholder');
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="max-width: 100%; max-height: 300px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = `
                <i class="fas fa-file-alt"></i>
                <p>${file.name}</p>
                <p><small>${(file.size / 1024).toFixed(2)} KB</small></p>
            `;
        }
    }

    function processFileForOCR(file) {
        if (!file) return;
        
        showOCRModal();
        updateOCRStatus(`Procesando: ${file.name}`, 'Tipo: ' + file.type);
        
        if (file.type.startsWith('image/')) {
            processImageFile(file);
        } else if (file.type === 'application/pdf') {
            processPDFFile(file);
        } else {
            processTextFile(file);
        }
    }

    function processImageFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                extractTextFromCanvas(canvas);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function processPDFFile(file) {
        // Necesitarías pdf.js para procesar PDFs correctamente
        // Esta es una implementación simplificada
        updateOCRStatus('Los PDFs complejos pueden no procesarse correctamente', 'Tipo: PDF');
        
        setTimeout(() => {
            DOM.ocrProgress.style.width = '100%';
            setTimeout(() => {
                hideOCRModal();
                alert("Para PDFs, recomendamos copiar el texto manualmente y pegarlo en el campo de texto.");
            }, 500);
        }, 2000);
    }

    function processTextFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            DOM.ocrProgress.style.width = '100%';
            updateOCRStatus('Archivo de texto procesado', 'Tipo: Texto');
            
            setTimeout(() => {
                hideOCRModal();
                const text = e.target.result;
                DOM.inputText.value = text;
                const brailleText = translateToBraille(text);
                displayResult(brailleText);
            }, 500);
        };
        reader.readAsText(file);
    }

    function extractTextFromCanvas(canvas) {
        showOCRModal();
        updateOCRStatus("Extrayendo texto de la imagen...", "Tipo: Imagen");
        
        const startTime = Date.now();
        state.lastOCRTime = startTime;
        
        // Cancelar OCR previo si existe
        if (state.ocrWorker) {
            state.ocrWorker.terminate();
        }
        
        state.ocrWorker = Tesseract.createWorker({
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    DOM.ocrProgress.style.width = `${progress}%`;
                    
                    // Calcular velocidad
                    const currentTime = Date.now();
                    const elapsed = (currentTime - startTime) / 1000;
                    const speed = elapsed > 0 ? (progress / elapsed).toFixed(2) : '--';
                    updateOCRStatus(`Progreso: ${progress}%`, `Velocidad: ${speed}%/s`);
                }
            }
        });
        
        (async () => {
            await state.ocrWorker.load();
            await state.ocrWorker.loadLanguage('spa');
            await state.ocrWorker.initialize('spa');
            const { data: { text } } = await state.ocrWorker.recognize(canvas);
            
            DOM.ocrProgress.style.width = '100%';
            updateOCRStatus("¡Texto extraído con éxito!", "Finalizado");
            
            setTimeout(() => {
                hideOCRModal();
                DOM.inputText.value = text;
                const brailleText = translateToBraille(text);
                displayResult(brailleText);
                
                // Limpiar worker
                state.ocrWorker.terminate();
                state.ocrWorker = null;
            }, 500);
        })();
    }

    // Funciones auxiliares
    function updateBrailleSize() {
        DOM.brailleSizeValue.textContent = `${state.brailleSize}px`;
        if (DOM.brailleOutput.firstChild) {
            DOM.brailleOutput.firstChild.style.fontSize = `${state.brailleSize}px`;
        }
    }

    function speakText() {
        const text = DOM.brailleOutput.textContent || DOM.inputText.value;
        if (text.trim()) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        } else {
            showError('No hay texto para leer');
        }
    }

    function copyToClipboard() {
        const text = DOM.brailleOutput.textContent;
        if (text.trim()) {
            navigator.clipboard.writeText(text).then(() => {
                const originalHTML = DOM.copyBtn.innerHTML;
                DOM.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                setTimeout(() => {
                    DOM.copyBtn.innerHTML = originalHTML;
                }, 2000);
            }).catch(err => {
                showError('Error al copiar: ' + err);
            });
        } else {
            showError('No hay resultado para copiar');
        }
    }

    async function pasteText() {
        try {
            const text = await navigator.clipboard.readText();
            DOM.inputText.value = text;
        } catch (err) {
            showError('No se pudo pegar el texto: ' + err);
        }
    }

    function downloadResult() {
        const text = DOM.brailleOutput.textContent;
        if (!text.trim()) {
            showError('No hay resultado para descargar');
            return;
        }
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'traduccion-braille.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function clearText() {
        DOM.inputText.value = '';
        DOM.brailleOutput.innerHTML = '<div class="empty-state"><i class="fas fa-braille"></i><p>El texto traducido a Braille aparecerá aquí</p></div>';
        
        // Limpiar vista previa de archivo
        DOM.filePreview.innerHTML = '<div class="preview-placeholder"><i class="fas fa-file-alt"></i><p>Vista previa del archivo aparecerá aquí</p></div>';
        DOM.fileInput.value = '';
        
        // Detener cámara si está activa
        if (state.cameraStream) {
            state.cameraStream.getTracks().forEach(track => track.stop());
            state.cameraStream = null;
        }
        
        // Restablecer cámara
        DOM.cameraPreview.srcObject = null;
        DOM.cameraPreview.classList.remove('hidden');
        DOM.photoCanvas.classList.add('hidden');
        DOM.startCameraBtn.classList.remove('hidden');
        DOM.captureBtn.classList.add('hidden');
        DOM.retakeBtn.classList.add('hidden');
        DOM.uploadPhotoBtn.classList.add('hidden');
        state.photoTaken = false;
        
        // Limpiar canvas de dibujo
        clearDrawingCanvas();
    }

    function animateTurtle() {
        const turtle = document.querySelector('.turtle-swimmer');
        turtle.style.animation = 'none';
        void turtle.offsetWidth; // Trigger reflow
        turtle.style.animation = 'swim 20s linear infinite';
    }

    // Modal OCR
    function showOCRModal() {
        DOM.ocrModal.classList.add('active');
        DOM.ocrProgress.style.width = '0%';
    }

    function hideOCRModal() {
        DOM.ocrModal.classList.remove('active');
    }

    function cancelOCR() {
        if (state.ocrWorker) {
            state.ocrWorker.terminate();
            state.ocrWorker = null;
        }
        hideOCRModal();
    }

    function updateOCRStatus(status, details = '') {
        DOM.ocrStatus.textContent = status;
        if (details) {
            DOM.fileTypeInfo.textContent = details;
        }
    }

    function showError(message) {
        alert(message); // En una aplicación real, usarías un toast o modal de error
    }

    // Inicializar la aplicación
    init();
});
