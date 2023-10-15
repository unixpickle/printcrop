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
            if (this.image === null) {
                return;
            }
            const scale1 = this.image.width / width;
            const scale2 = this.image.height / height;
            const scale = Math.min(scale1, scale2);
            this.cropWidth = scale * width;
            this.cropHeight = scale * height;
            this.cropX = (this.image.width - scale * width) / 2;
            this.cropY = (this.image.height - scale * height) / 2;
            this.draw();
        }

        unsetCropShape() {
            this.cropWidth = null;
            this.cropHeight = null;
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
            const photoX = (x - coords.x) / coords.scale * 2;
            const photoY = (y - coords.y) / coords.scale * 2;
            const maxX = this.image.width - this.cropWidth;
            const maxY = this.image.height - this.cropHeight;
            this.cropX = Math.min(maxX, Math.max(0, photoX - this.cropWidth / 2));
            this.cropY = Math.min(maxY, Math.max(0, photoY - this.cropHeight / 2));
            this.draw();
        }

        draw() {
            if (!this.image) {
                return;
            }

            const ctx = this.canvas.getContext('2d');
            const coords = this.coords();
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.drawImage(this.image, coords.x, coords.y, coords.scale * this.image.width,
                coords.scale * this.image.height);

            if (this.cropWidth === null || this.cropHeight === null) {
                return;
            }

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const x = coords.x + this.cropX * coords.scale;
            const y = coords.y + this.cropY * coords.scale;
            const w = this.cropWidth * coords.scale;
            const h = this.cropHeight * coords.scale;
            ctx.rect(x + 2, y + 2, w - 4, h - 4);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.rect(0, 0, this.canvas.width, this.canvas.height);
            ctx.rect(x, y, w, h);
            ctx.fill('evenodd');
        }

        coords() {
            const size = this.canvas.width;
            const scale = Math.min(size / this.image.width, size / this.image.height);
            const x = (size - scale * this.image.width) / 2
            const y = (size - scale * this.image.height) / 2;
            return { x: x, y: y, scale: scale };
        }

        croppedImage() {
            if (this.cropWidth === null || this.cropHeight === null) {
                throw new Error('no cropped region');
            }

            const canvas = document.createElement('canvas');
            canvas.width = this.cropWidth;
            canvas.height = this.cropHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(this.image, -this.cropX, -this.cropY);

            const img = document.createElement('img');
            const res = new Promise((resolve) => {
                img.onload = () => resolve(img);
            });
            img.src = canvas.toDataURL('image/png');
            return res;
        }
    }

    class App {
        constructor() {
            this.cropper = new Cropper();
            this.widthField = document.getElementById('crop-width');
            this.heightField = document.getElementById('crop-height');
            [this.widthField, this.heightField].forEach((f) => {
                f.addEventListener('keydown', () => this.updateCropShape());
                f.addEventListener('keyup', () => this.updateCropShape());
                f.addEventListener('change', () => this.updateCropShape());
            });
            this.setupDragAndDrop();
            document.getElementById('generate').addEventListener('click', () => {
                this.generate();
            });
        }

        setupDragAndDrop() {
            const container = document.getElementById('cropper-container');
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                container.classList.add('dragging');
            });
            container.addEventListener('drop', (e) => {
                e.preventDefault();
                container.classList.remove('dragging');

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
            container.addEventListener('dragleave', (e) => {
                container.classList.remove('dragging');
            });
        }

        handleNewImage(img) {
            document.getElementById('cropper-container').classList.add('filled');
            this.cropper.setImage(img);
            this.updateCropShape();
        }

        validateWidthHeight() {
            return !(isNaN(parseFloat(this.widthField.value)) ||
                isNaN(parseFloat(this.heightField.value)));
        }

        updateCropShape() {
            if (!this.validateWidthHeight()) {
                this.cropper.unsetCropShape();
                return;
            }
            this.cropper.setCropShape(parseFloat(this.widthField.value) || 1,
                parseFloat(this.heightField.value) || 1);
        }

        async generate() {
            if (!this.cropper.image) {
                alert('You must pick an image first');
                return;
            } else if (!this.cropper.cropWidth || !this.validateWidthHeight()) {
                alert('You must specify a crop size first');
                return;
            }

            const width = parseFloat(this.widthField.value) || 1;
            const height = parseFloat(this.heightField.value) || 1;
            const printSize = document.getElementById('print-size').value;
            let printWidth = parseFloat(printSize.split('x')[0]);
            let printHeight = parseFloat(printSize.split('x')[1]);

            if (width > height) {
                [printWidth, printHeight] = [printHeight, printWidth];
            }

            const cropped = await this.cropper.croppedImage();
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(cropped.width * printWidth / width);
            canvas.height = Math.ceil(cropped.height * printHeight / height);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#888';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
                cropped,
                (canvas.width - cropped.width) / 2,
                (canvas.height - cropped.height) / 2,
            );

            canvas.toBlob((blob) => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'image.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => {
                    URL.revokeObjectURL(link.href);
                }, 100);
            }, 'image/png');
        }
    }

    window.addEventListener('load', () => {
        window.app = new App();
    });

})();