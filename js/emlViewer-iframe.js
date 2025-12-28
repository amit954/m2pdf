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
    
    // Calculate the appropriate unit level
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // Convert to the selected unit with up to 2 decimal places
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
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
            compressionOptions: {
                level: 9
            }
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
        
        $('#email-subject').text(emlReader.getSubject() || '(No Subject)');
        $('#email-from').text(emlReader.getFrom() || 'Unknown');
        $('#email-to').text(emlReader.getTo() || 'Unknown');
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
                .replace(/,/g, '') // Remove commas
                .replace(/(\d{2}):(\d{2}):(\d{2})/, '$1:$2:$3')
                .replace('GMT', '');
            $('#email-date').text(formattedDate);
        } else {
            $('#email-date').text('Unknown');
        }
        
        // Handle CC
        const cc = emlReader.getCc();
        if (cc) {
            $('#email-cc').text(cc);
            $('#cc-container').show();
        } else {
            $('#cc-container').hide();
        }

        // Handle BCC
        const bcc = emlReader.getBcc();
        if (bcc) {
            $('#email-bcc').text(bcc);
            $('#bcc-container').show();
        } else {
            $('#bcc-container').hide();
        }
        
        const replyTo = emlReader.getReplyTo();
        if (replyTo) {
            $('#email-reply-to').text(replyTo);
            $('#reply-to-container').show();
        } else {
            $('#reply-to-container').hide();
        }

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
            
            if (attachments.length > 1) {
                $('#download-all').show().off('click').on('click', window.downloadAllAttachments);
            } else {
                $('#download-all').hide();
            }
        } else {
            $('#attachments-section').hide();
            $('#download-all').hide();
        }

        // Display content with enhanced whitespace cleaning
        const htmlContent = emlReader.getMessageHtml();
        const textContent = emlReader.getMessageText();
        
        if (htmlContent) {
            const cleanHtml = htmlContent
                .replace(/(\r\n|\n|\r)/g, '')
                .replace(/\s+/g, ' ')
                .replace(/> +</g, '><')
                .replace(/<br\s*\/?>/gi, '<br>')
                .replace(/(<br>){3,}/gi, '<br><br>')
                .trim();
            $('#email-content').html(cleanHtml);
        } else if (textContent) {
            const cleanText = textContent
                .replace(/(\r\n|\n|\r)+/g, '\n')
                .replace(/\n\s+\n/g, '\n\n')
                .replace(/\s+/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            $('#email-content').text(cleanText);
        } else {
            $('#email-content').text('(No content)');
        }

        $('#email-display').show();
    } catch (error) {
        console.error('Error processing email:', error);
        $('#error-message').text('Error processing email: ' + error.message).show();
    }
}

// Initialize everything when the document is ready
$(document).ready(async function() {
    // Load EmlReader
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
    
    // Add click to upload functionality
    dropZone.on('click', function() {
        const input = $('<input type="file" accept=".eml" style="display: none">');
        input.on('change', function(e) {
            const file = e.target.files[0];
            if (file) handleFile(file);
        });
        input.click();
    });

    dropZone.on('dragover dragenter', function() {
        $(this).addClass('drag-over');
    });

    dropZone.on('dragleave dragend drop', function() {
        $(this).removeClass('drag-over');
    });

    dropZone.on('drop', function(e) {
        const file = e.originalEvent.dataTransfer.files[0];
        handleFile(file);
    });

    // Set up print button
    $('#print-button').on('click', function() {
        window.print();
    });
});