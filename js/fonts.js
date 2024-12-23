if ("fonts" in document) {
    document.body.classList.add('fonts-loading');
    Promise.all([
        document.fonts.load('1em Outfit'),
        document.fonts.load('1em Inter')
    ]).then(() => {
        document.body.classList.add('fonts-loaded');
        document.body.classList.remove('fonts-loading');
    }).catch(() => {
        document.body.classList.remove('fonts-loading');
    });
}