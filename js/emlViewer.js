// Global variables
let currentAttachments = [];
let EmlReader;

// Functions for handling downloads
function sanitizeFilename(input) {
    let safe = input.replace(/[^a-z0-9\s.\-_]/gi, '')
                   .replace(/\s+/g, ' ')
                   .trim()
                   .replace(/\s/g, '_');
    
    return safe || 'attachments';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Create and setup iframe for email content
function createContentIframe() {
    const iframe = document.createElement('iframe');
    iframe.id = 'email-content-frame';
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    return iframe;
}

// Adjust iframe height based on content
function resizeIframe(iframe) {
    if (!iframe.contentWindow) return;
    const body = iframe.contentWindow.document.body;
    const height = body.querySelector('.email-content').offsetHeight;
    iframe.style.height = `${height}px`;
}

// Initialize iframe with content
function initializeIframe(iframe, content, isHtml) {
    // Wait for next tick to ensure iframe is in DOM
    setTimeout(() => {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <base target="_blank">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        line-height: 1.5;
                        color: #000;
                        background: #fff;
                    }
                    img { max-width: 100%; height: auto; }
                    pre, code { white-space: pre-wrap; }
                    a { color: #4f46e5; }
                    * { word-break: break-word; }
                    .email-content { 
                        min-height: 20px;
                        padding: 16px;
                        margin: 0;
                    }
                </style>
            </head>
            <body><div class="email-content">${isHtml ? content : `<pre style="margin: 0; white-space: pre-wrap;">${content}</pre>`}</div></body>
            </html>
        `;
        
        doc.open();
        doc.write(htmlContent);
        doc.close();
    
        // Wait for images to load before resizing
        const images = doc.getElementsByTagName('img');
        let loadedImages = 0;
        
        const finalResize = () => {
            // Add a small delay to ensure content is fully rendered
            setTimeout(() => {
                resizeIframe(iframe);
            }, 100);
        };

        const checkAllImagesLoaded = () => {
            loadedImages++;
            if (loadedImages === images.length) {
                finalResize();
            }
        };

        if (images.length > 0) {
            Array.from(images).forEach(img => {
                if (img.complete) {
                    checkAllImagesLoaded();
                } else {
                    img.addEventListener('load', checkAllImagesLoaded);
                    img.addEventListener('error', checkAllImagesLoaded);
                }
            });
        } else {
            finalResize();
        }
    }, 0);
}

async function handleFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.eml')) {
        $('#error-message').text('Please drop an .eml file').show();
        return;
    }

    if (!EmlReader) {
        $('#error-message').text('EML parser not loaded. Please check console for errors.').show();
        return;
    }

    try {
        $('#error-message').hide();
        const buffer = await file.arrayBuffer();
        const emlReader = new EmlReader(buffer);
        
        // Set email metadata
        $('#email-subject').text(emlReader.getSubject() || '(No Subject)');
        $('#email-from').text(emlReader.getFrom() || 'Unknown');
        $('#email-to').text(emlReader.getTo() || 'Unknown');
        
        // Format and set date
        const date = emlReader.getDate();
        if (date) {
            const options = {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZoneName: 'shortOffset'
            };
            const formattedDate = date.toLocaleString('en-US', options)
                .replace(/,/g, '')
                .replace(/(\d{2}):(\d{2}):(\d{2})/, '$1:$2:$3')
                .replace('GMT', '');
            $('#email-date').text(formattedDate);
        } else {
            $('#email-date').text('Unknown');
        }
        
        // Handle optional fields
        const cc = emlReader.getCc();
        $('#cc-container').toggle(!!cc);
        if (cc) $('#email-cc').text(cc);

        const bcc = emlReader.getBcc();
        $('#bcc-container').toggle(!!bcc);
        if (bcc) $('#email-bcc').text(bcc);

        const replyTo = emlReader.getReplyTo();
        $('#reply-to-container').toggle(!!replyTo);
        if (replyTo) $('#email-reply-to').text(replyTo);

        // Handle attachments
        const attachments = emlReader.getAttachments();
        currentAttachments = attachments;
        
        if (attachments.length > 0) {
            const attachmentsList = $('#attachments-list');
            attachmentsList.empty();
            
            attachments.forEach((attachment, index) => {
                const size = formatFileSize(attachment.filesize);
                attachmentsList.append(`
                    <div class="attachment-item">
                        <span class="attachment-name">${attachment.filename}</span>
                        <span class="attachment-size">${size}</span>
                        <a href="#" class="attachment-download no-print" 
                           onclick="downloadAttachment('${attachment.filename}', '${attachment.contentType}', ${index}); return false;">
                            <i class="bi bi-download"></i>
                        </a>
                    </div>
                `);
            });
            
            $('#attachments-section').show();
            $('#download-all').toggle(attachments.length > 1);
            if (attachments.length > 1) {
                $('#download-all').off('click').on('click', window.downloadAllAttachments);
            }
        } else {
            $('#attachments-section').hide();
            $('#download-all').hide();
        }

        // Create and initialize content iframe
        const contentContainer = $('#email-content');
        contentContainer.empty();
        
        const iframe = createContentIframe();
        
        const htmlContent = emlReader.getMessageHtml();
        const textContent = emlReader.getMessageText();
        
        const displayContent = () => {
            if (htmlContent) {
                const cleanHtml = htmlContent
                    .replace(/(\r\n|\n|\r)/g, '')
                    .replace(/\s+/g, ' ')
                    .replace(/> +</g, '><')
                    .replace(/<br\s*\/?>/gi, '<br>')
                    .replace(/(<br>){3,}/gi, '<br><br>')
                    .trim();
                initializeIframe(iframe, cleanHtml, true);
            } else if (textContent) {
                const cleanText = textContent
                    .replace(/(\r\n|\n|\r)+/g, '\n')
                    .replace(/\n\s+\n/g, '\n\n')
                    .replace(/\s+/g, ' ')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
                initializeIframe(iframe, cleanText, false);
            } else {
                initializeIframe(iframe, '(No content)', false);
            }
        };

        // Add iframe to container first
        contentContainer.append(iframe);
        
        // Initialize the content
        displayContent();
        $('#email-display').show();
    } catch (error) {
        console.error('Error processing email:', error);
        $('#error-message').text('Error processing email: ' + error.message).show();
    }
}

// Initialize everything when the document is ready
$(document).ready(async function() {
    try {
        const module = await import('./EmlReader.js');
        EmlReader = module.EmlReader;
    } catch (error) {
        console.error('Error loading EmlReader:', error);
        $('#error-message').text('Error loading EML parser: ' + error.message).show();
    }

    // Prevent default drag behaviors
    $(document).on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });

    const dropZone = $('#drop-zone');
    
    // Set up file upload handling
    dropZone.on('click', function() {
        const input = $('<input type="file" accept=".eml" style="display: none">');
        input.on('change', function(e) {
            const file = e.target.files[0];
            if (file) handleFile(file);
        });
        input.click();
    });

    // Set up drag and drop handling
    dropZone
        .on('dragover dragenter', function() {
            $(this).addClass('drag-over');
        })
        .on('dragleave dragend drop', function() {
            $(this).removeClass('drag-over');
        })
        .on('drop', function(e) {
            const file = e.originalEvent.dataTransfer.files[0];
            handleFile(file);
        });

    // Set up print button
    $('#print-button').on('click', function() {
        window.print();
    });
});

// Make download functions globally available
window.downloadAllAttachments = async function() {
    const zip = new JSZip();
    const subject = $('#email-subject').text() || 'attachments';
    const safeSubject = sanitizeFilename(subject);
    
    currentAttachments.forEach(attachment => {
        zip.file(attachment.filename, attachment.content);
    });
    
    try {
        const content = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 9 }
        });
        
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeSubject}_attachments.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error creating ZIP:', error);
        alert('Error creating ZIP file: ' + error.message);
    }
};

window.downloadAttachment = function(filename, contentType, index) {
    const attachment = currentAttachments[index];
    const blob = new Blob([attachment.content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};