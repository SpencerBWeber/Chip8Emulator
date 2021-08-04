class Renderer {
  constructor(scale) {
    // set the screen size of the emulator
    this.cols = 64;
    this.rows = 32;
    this.scale = scale;

    this.canvas = document.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');

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

  // renders the array 60 fps
  render() {
    // Clears the display every render cycle
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Loop through display array
    for (let i = 0; i < this.cols * this.rows; i++) {
      // Grabs the positionX of the pixel based off of 'i'
      let x = (i % this.cols) * this.scale;

      // Grabs the positionY of the pixel based off of 'i'
      let y = Math.floor(i / this.cols) * this.scale;

      // if the value at this.display[i] == 1, then draw a pixel
      if (this.display[i]) {
        // Set the pixel color to white
        this.ctx.fillStyle = '#68BB59';

        // Place a pixel at position(x, y) with a width and height of scale
        this.ctx.fillRect(x, y, this.scale, this.scale);
      }
    }
  }
  testRender() {
    this.setPixel(0, 0);
    this.setPixel(5, 2);
  }
}

export default Renderer;