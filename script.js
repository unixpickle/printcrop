(function () {

    function handleNewImage(img) {
        // TODO: popuplate the image cropping view.
    }

    window.addEventListener('load', () => {
        const editor = document.getElementById('editor');
        editor.addEventListener('dragover', (e) => {
            e.preventDefault();
            editor.classList.add('dragging');
        });
        editor.addEventListener('drop', (e) => {
            e.preventDefault();
            editor.classList.remove('dragging');

            const files = e.target.files || e.dataTransfer.files;
            if (files.length !== 1) {
                return;
            }
            const file = files[0];
            const objURL = URL.createObjectURL(file);
            const img = document.createElement('img');
            img.onload = () => handleNewImage(img);
            img.src = objURL;
        });
        editor.addEventListener('dragend', (e) => {
            editor.classList.remove('dragging');
        });
    });

})();