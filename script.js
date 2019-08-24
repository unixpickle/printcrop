(function () {

    class Cropper {
        constructor() {
            this.canvas = document.getElementById('cropper');
            this.image = null;
            this.cropX = 0;
            this.cropY = 0;
            this.cropWidth = 0;
            this.cropHeight = 0;
            this.setupMouseEvents();
        }

        setImage(img) {
            this.image = img;
            this.cropY = 0;
            this.cropX = 0;
            this.cropWidth = img.width;
            this.cropHeight = img.height;
            this.draw();
        }

        setCropShape(width, height) {
            const scale1 = this.image.width / width;
            const scale2 = this.image.height / height;
            const scale = Math.min(scale1, scale2);
            this.cropWidth = scale * width;
            this.cropHeight = scale * height;
            this.cropX = (this.image.width - scale * width) / 2;
            this.cropY = (this.image.height - scale * height) / 2;
            this.draw();
        }

        setupMouseEvents() {
            this.canvas.addEventListener('mousedown', (e) => {
                const moveHandler = (e) => {
                    const rect = this.canvas.getBoundingClientRect();
                    this.handleMouseDrag(e.clientX - rect.left, e.clientY - rect.top);
                };
                let upHandler;
                upHandler = (e) => {
                    window.removeEventListener('mousemove', moveHandler);
                    window.removeEventListener('mouseup', upHandler);
                };
                window.addEventListener('mousemove', moveHandler);
                window.addEventListener('mouseup', upHandler);
            });
        }

        handleMouseDrag(x, y) {
            if (this.image === null) {
                return;
            }
            const coords = this.coords();
            const photoX = (x - coords.x) / coords.scale;
            const photoY = (y - coords.y) / coords.scale;
            this.cropX = Math.min(this.image.width, Math.max(0, photoX - this.cropWidth / 2));
            this.cropY = Math.min(this.image.height, Math.max(0, photoY - this.cropHeight / 2));
            this.draw();
        }

        draw() {
            const ctx = this.canvas.getContext('2d');
            const coords = this.coords();
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.drawImage(this.image, coords.x, coords.y, coords.scale * this.image.width,
                coords.scale * this.image.height);

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.rect(coords.x + this.cropX * coords.scale,
                coords.y + this.cropY * coords.scale,
                this.cropWidth * coords.scale,
                this.cropHeight * coords.scale);
            ctx.stroke();
        }

        coords() {
            const size = this.canvas.width;
            const scale = Math.min(size / this.image.width, size / this.image.height);
            const x = (size - scale * this.image.width) / 2
            const y = (size - scale * this.image.height) / 2;
            return { x: x, y: y, scale: scale };
        }
    }

    class App {
        constructor() {
            this.cropper = Cropper();
            this.widthField = document.getElementById('crop-width');
            this.heightField = document.getElementById('crop-height');
            this.setupDragAndDrop();
        }

        setupDragAndDrop() {
            this.cropper.canvas.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.cropper.canvas.classList.add('dragging');
            });
            this.cropper.canvas.addEventListener('drop', (e) => {
                e.preventDefault();
                this.cropper.canvas.classList.remove('dragging');

                const files = e.target.files || e.dataTransfer.files;
                if (files.length !== 1) {
                    return;
                }
                const file = files[0];
                const objURL = URL.createObjectURL(file);
                const img = document.createElement('img');
                img.onload = () => this.handleNewImage(img);
                img.src = objURL;
            });
            this.cropper.canvas.addEventListener('dragend', (e) => {
                this.cropper.canvas.classList.remove('dragging');
            });
        }

        handleNewImage(img) {
            this.cropper.setImage(img);
            this.cropper.setCropShape(parseFloat(this.widthField.value),
                parseFloat(this.heightField.value));
        }
    }

    window.addEventListener('load', () => {
        window.app = new App();
    });

})();