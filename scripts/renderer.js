class Renderer {
  constructor(scale) {
    // set the screen size of the emulator
    this.cols = 64;
    this.rows = 32;
    this.scale = scale;

    this.canvas = document.querySelector('canvas');
    this.context = this.canvas.getContext('2d');

    // scale up the screen size since it's too small
    this.canvas.width = this.cols * this.scale;
    this.canvas.height = this.rows * this.scale;

    // create a display with the columns and rows as height and width
    this.display = new Array(this.cols * this.rows);
  }

  setPixel(positionX, positionY) {
    // condition for if the pixel goes out of bounds of the display
    // it should wrap around to the other side
    if (positionX > this.cols) {
      positionX -= this.cols;
    } else if (positionX < 0) {
      positionX += this.cols;
    }

    if (positionY > this.rows) {
      positionY -= this.rows;
    } else if (positionY < 0) {
      positionY += this.rows;
    }

    // calculate position of the pixel
    let pixelLocation = positionX + (positionY * this.cols);

    // sprites are XORed onto display
    this.display[pixelLocation] ^= 1;

    // return whether a pixel was erased or not
    // true = pixel was erased
    return !this.display[pixelLocation];
  }

  clear() {
    // clears the display
    this.display = new Array(this.cols * this.rows);
  }
}

export default Renderer;