
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

class PDFEditor {
    constructor() {
        this.pdfDoc = null;
        this.pdfBytes = null;
        this.scale = 1.5;
        this.currentPage = 1;
        this.modifications = new Map();
        this.currentTool = null;
        this.imageAnnotations = new Map(); // Track image annotation elements
        this.setupListeners();
    }

    setupListeners() {
        document.getElementById('upload-btn').onclick = () => document.getElementById('file-input').click();
        document.getElementById('file-input').onchange = (e) => this.handleFileUpload(e);
        document.getElementById('text-btn').onclick = () => this.toggleTool('text');
        document.getElementById('image-btn').onclick = () => this.toggleTool('image');
        document.getElementById('save-btn').onclick = () => this.savePDF();
        document.getElementById('zoom-in').onclick = () => this.zoom(1.2);
        document.getElementById('zoom-out').onclick = () => this.zoom(0.8);
    }

    toggleTool(tool) {
        const btn = document.getElementById(`${tool}-btn`);
        if (this.currentTool === tool) {
            this.currentTool = null;
            btn.classList.remove('active');
        } else {
            this.currentTool = tool;
            document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
    }

    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfBytes = new Uint8Array(arrayBuffer);
            this.modifications.clear();
            this.imageAnnotations.clear(); // Clear tracked annotations
            await this.loadPDF();
            document.getElementById('save-btn').disabled = false;
            this.showMessage('PDF loaded successfully', 'success');
        } catch (error) {
            this.showMessage('Error loading PDF: ' + error.message, 'error');
        }
    }

    async loadPDF() {
        try {
            const loadingTask = pdfjsLib.getDocument({ data: this.pdfBytes });
            this.pdfDoc = await loadingTask.promise;
            document.getElementById('pdf-container').innerHTML = '';
            for (let i = 1; i <= this.pdfDoc.numPages; i++) {
                await this.renderPage(i);
            }
        } catch (error) {
            this.showMessage('Error loading PDF: ' + error.message, 'error');
        }
    }

    async renderPage(pageNum) {
        try {
            const page = await this.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: this.scale });

            const container = document.createElement('div');
            container.className = 'page-container';
            container.style.width = viewport.width + 'px';
            container.style.height = viewport.height + 'px';
            container.setAttribute('data-page', pageNum);

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            container.appendChild(canvas);

            const annotationCanvas = document.createElement('canvas');
            annotationCanvas.className = 'canvas-layer';
            annotationCanvas.width = viewport.width;
            annotationCanvas.height = viewport.height;
            container.appendChild(annotationCanvas);

            document.getElementById('pdf-container').appendChild(container);

            const renderContext = {
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            };

            await page.render(renderContext).promise;
            this.setupPageInteractions(container, pageNum);
            
            // Clear existing image annotations for this page
            if (this.imageAnnotations.has(pageNum)) {
                this.imageAnnotations.get(pageNum).forEach(el => el.remove());
                this.imageAnnotations.delete(pageNum);
            }
            
            // Render modifications including images
            const mods = this.modifications.get(pageNum) || [];
            mods.forEach(mod => {
                if (mod.type === 'image') {
                    this.createImageAnnotation(container, mod, pageNum);
                }
            });
            
            this.renderModifications(pageNum, annotationCanvas);

        } catch (error) {
            this.showMessage('Error rendering page: ' + error.message, 'error');
        }
    }

    setupPageInteractions(container, pageNum) {
        container.onclick = async (e) => {
            if (!this.currentTool || e.target.classList.contains('image-annotation')) return;

            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.currentTool === 'text') {
                const text = prompt('Enter text:');
                if (text) {
                    this.addModification(pageNum, {
                        type: 'text',
                        x: x / this.scale,
                        y: y / this.scale,
                        text: text
                    });
                }
            } else if (this.currentTool === 'image') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const img = new Image();
                            img.onload = () => {
                                const maxSize = 200;
                                let width = img.naturalWidth;
                                let height = img.naturalHeight;
                                
                                // Scale down while maintaining aspect ratio if either dimension is too large
                                if (width > maxSize || height > maxSize) {
                                    if (width > height) {
                                        height = (height / width) * maxSize;
                                        width = maxSize;
                                    } else {
                                        width = (width / height) * maxSize;
                                        height = maxSize;
                                    }
                                }

                                this.addModification(pageNum, {
                                    type: 'image',
                                    x: x / this.scale,
                                    y: y / this.scale,
                                    data: e.target.result,
                                    width: width,
                                    height: height,
                                    aspectRatio: width / height
                                });
                            };
                            img.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            }
        };
    }

    createImageAnnotation(container, modification, pageNum) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-annotation';
        imgContainer.style.left = modification.x * this.scale + 'px';
        imgContainer.style.top = modification.y * this.scale + 'px';
        imgContainer.style.width = modification.width * this.scale + 'px';
        imgContainer.style.height = modification.height * this.scale + 'px';
        
        const img = document.createElement('img');
        img.src = modification.data;
        imgContainer.appendChild(img);
        
        // Add resize handles
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            imgContainer.appendChild(handle);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            const index = this.modifications.get(pageNum).indexOf(modification);
            this.modifications.get(pageNum).splice(index, 1);
            imgContainer.remove();
            
            // Remove from imageAnnotations tracking
            const pageAnnotations = this.imageAnnotations.get(pageNum) || [];
            const annotationIndex = pageAnnotations.indexOf(imgContainer);
            if (annotationIndex > -1) {
                pageAnnotations.splice(annotationIndex, 1);
            }
        };
        imgContainer.appendChild(deleteBtn);
        
        this.setupImageInteractions(imgContainer, modification, pageNum);
        container.appendChild(imgContainer);
        
        // Track the image annotation
        if (!this.imageAnnotations.has(pageNum)) {
            this.imageAnnotations.set(pageNum, []);
        }
        this.imageAnnotations.get(pageNum).push(imgContainer);
    }

    setupImageInteractions(imgContainer, modification, pageNum) {
        let isDragging = false;
        let startX, startY;
        
        imgContainer.onmousedown = (e) => {
            if (e.target.classList.contains('resize-handle') || e.target.classList.contains('delete-btn')) return;
            isDragging = true;
            startX = e.clientX - imgContainer.offsetLeft;
            startY = e.clientY - imgContainer.offsetTop;
            imgContainer.style.cursor = 'move';
        };
        
        document.onmousemove = (e) => {
            if (!isDragging) return;
            const newLeft = e.clientX - startX;
            const newTop = e.clientY - startY;
            imgContainer.style.left = newLeft + 'px';
            imgContainer.style.top = newTop + 'px';
            modification.x = newLeft / this.scale;
            modification.y = newTop / this.scale;
        };
        
        document.onmouseup = () => {
            isDragging = false;
            imgContainer.style.cursor = 'default';
        };
        
        // Resizing functionality
        const handles = imgContainer.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.onmousedown = (e) => {
                e.stopPropagation();
                const startWidth = imgContainer.offsetWidth;
                const startHeight = imgContainer.offsetHeight;
                const aspectRatio = modification.aspectRatio;
                const startX = e.clientX;
                const startY = e.clientY;
                const position = handle.className.split(' ')[1];
                
                const onMouseMove = (e) => {
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    
                    let newWidth, newHeight;
                    let newLeft = imgContainer.offsetLeft;
                    let newTop = imgContainer.offsetTop;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        newWidth = startWidth + (position.includes('right') ? dx : -dx);
                        newHeight = newWidth / aspectRatio;
                    } else {
                        newHeight = startHeight + (position.includes('bottom') ? dy : -dy);
                        newWidth = newHeight * aspectRatio;
                    }
                    
                    if (position.includes('left')) {
                        newLeft = imgContainer.offsetLeft + (startWidth - newWidth);
                    }
                    if (position.includes('top')) {
                        newTop = imgContainer.offsetTop + (startHeight - newHeight);
                    }
                    
                    if (newWidth > 50 && newHeight > 50) {
                        imgContainer.style.width = newWidth + 'px';
                        imgContainer.style.height = newHeight + 'px';
                        imgContainer.style.left = newLeft + 'px';
                        imgContainer.style.top = newTop + 'px';
                        
                        modification.width = newWidth / this.scale;
                        modification.height = newHeight / this.scale;
                        modification.x = newLeft / this.scale;
                        modification.y = newTop / this.scale;
                    }
                };
                
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };
        });
    }

    addModification(pageNum, modification) {
        if (!this.modifications.has(pageNum)) {
            this.modifications.set(pageNum, []);
        }
        
        if (modification.type === 'image') {
            const container = document.querySelector(`[data-page="${pageNum}"]`);
            this.createImageAnnotation(container, modification, pageNum);
        }
        
        this.modifications.get(pageNum).push(modification);
        const container = document.querySelector(`[data-page="${pageNum}"]`);
        const canvas = container.querySelector('.canvas-layer');
        this.renderModifications(pageNum, canvas);
    }

    renderModifications(pageNum, canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const mods = this.modifications.get(pageNum) || [];
        mods.forEach(mod => {
            if (mod.type === 'text') {
                ctx.font = '16px Arial';
                ctx.fillStyle = 'black';
                ctx.fillText(mod.text, mod.x * this.scale, mod.y * this.scale);
            }
        });
    }

    async savePDF() {
        try {
            const { PDFDocument, rgb } = PDFLib;
            const pdfDoc = await PDFDocument.load(this.pdfBytes);
            const pages = pdfDoc.getPages();

            for (const [pageNum, modifications] of this.modifications) {
                const page = pages[pageNum - 1];
                
                for (const mod of modifications) {
                    if (mod.type === 'text') {
                        page.drawText(mod.text, {
                            x: mod.x,
                            y: page.getHeight() - mod.y,
                            size: 16,
                            color: rgb(0, 0, 0)
                        });
                    } else if (mod.type === 'image') {
                        const imageBytes = await fetch(mod.data).then(res => res.arrayBuffer());
                        const image = mod.data.includes('data:image/png') 
                            ? await pdfDoc.embedPng(imageBytes)
                            : await pdfDoc.embedJpg(imageBytes);

                        page.drawImage(image, {
                            x: mod.x,
                            y: page.getHeight() - mod.y - mod.height,
                            width: mod.width,
                            height: mod.height
                        });
                    }
                }
            }

            const modifiedPdfBytes = await pdfDoc.save();
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'modified.pdf';
            link.click();
            
            URL.revokeObjectURL(url);
            this.showMessage('PDF saved successfully', 'success');
        } catch (error) {
            this.showMessage('Error saving PDF: ' + error.message, 'error');
        }
    }

    zoom(factor) {
        this.scale *= factor;
        document.getElementById('zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
        document.getElementById('pdf-container').innerHTML = '';
        this.loadPDF();
    }

    showMessage(text, type) {
        const message = document.getElementById('message');
        message.textContent = text;
        message.className = type;
        message.style.display = 'block';
        setTimeout(() => message.style.display = 'none', 3000);
    }
}

new PDFEditor();
