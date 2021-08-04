// Chip-8 Specs
// 4KB (4096 bytes) of memory
// 16 8-bit register (this.i) to store memory addresses
// 2 timers, one for delay, and one for sound
// program counter that stores the address currently being executed
// An array to represent the stack
class CPU {
  constructor(renderer, keyboard, speaker) {
    this.renderer = renderer;
    this.keyboard = keyboard;
    this.speaker = speaker;

    // 4KB of memory
    this.memory = new Uint8Array(4096);

    // 16 8-bit registers
    this.v = new Uint8Array(16);

    // Stores memory addresses
    this.i = 0;

    // Timers
    this.delayTime = 0;
    this.soundTimer = 0;

    // Program counter
    this.pc = 0x200;

    // Don't initialize with a size to avoid empty results
    this.stack = new Array();

    // some instructions require pausing, such as Fx0A
    this.paused = false;

    this.speed = 10;
  }

  loadSpritesIntoMemory() {
    // Array of hex values for each sprite. Each sprite is 5 bytes.
    // Technical reference provides the values
    const sprites = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80 // F
    ];

    // Technical reference says all sprites are stored in the interpreter section of memory starting at hex 0x000
    for (let i = 0; i < sprites.length; i++){
      this.memory[i] = sprites[i];
    }
  }

  // most Chip-8 programs start at location 0x200, loop through ROM/program and store it in memory
  loadProgramIntoMemory(program) {
    for (let loc = 0; loc < program.length; loc++) {
      this.memory[0x200 + loc] = program[loc];
    }
  }

  loadRom(romName){
    var request = new XMLHttpRequest;
    var self = this;

    // Handles the response received from sending (request.send()) the request
    request.onload = function() {
      // if the request response has content
      if (request.response) {
        // Store the contents of the response in an 8-bit array
        let program = new Uint8Array(request.response);

        // Load the ROM/program into memory
        self.loadProgramIntoMemory(program);
      }
    }

    // Initialize a GET request to retrieve the ROM from roms folder
    request.open('GET', 'roms/' + romName);
    request.responseType = 'arraybuffer';

    // Send the GET request
    request.send();
  }

  cycle() {
    // loop that handles the execution of instructions
    for (let i = 0; i < this.speed; i++) {
      // instructions should only be executed when the emulator is running
      if(!this.paused) {
        let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);
        this.executeInstruction(opcode);
      }
    }

    // update the timers when running
    if (!this.paused) {
      this.updateTimers();
    }

    // play sound and render the sprites
    this.playSound();
    this.renderer.render();
  }

  updateTimers() {
    if (this.delayTimer > 0) {
      this.delayTimer -= 1;
    }

    if (this.soundTimer > 0) {
      this.soundTimer -= 1;
    }
  }

  // As long as soundTimer is greater than 0, play sound
  playSound() {
    if (this.soundTimer > 0) {
      this.speaker.play(440);
    } else {
      this.speaker.stop();
    }
  }

  executeInstruction(opcode) {
    // Increment the program to prepare it for the next instruction
    // Each instruction is 2 bytes long, so increment by 2
    this.pc += 2;

    // Grab value of 2nd nibble
    // and shift it right 8 bits to get rid of everything but the 2nd nibble
    let x = (opcode & 0x0F00) >> 8;

    // Grab value of 3rd nibble
    // and shift it right 4 bits to get rid of everything but the 3rd nibble
    let y = (opcode & 0x00F0) >> 4;

    switch (opcode & 0xF000) {
      case 0x0000:
        switch(opcode) {
          case 0x00E0: // 00E0 - CLS
            this.renderer.clear();
            break;

          case 0x00EE: // 00EE - RET
            this.pc = this.stack.pop();
            break;
        }

        break;

      case 0x1000: // 1nnn - JP addr
        this.pc = (opcode & 0xFFF);
        break;

      case 0x2000: // 2nnn - CALL addr
        this.stack.push(this.pc);
        this.pc = (opcode & 0xFFF);
        break;

      case 0x3000: // 3xkk - SE Vx, byte
        if (this.v[x] === (opcode & 0xFF)) {
          this.pc += 2;
        }
        break;

      case 0x4000: // 4xkk - SNE Vx, byte
        if (this.v[x] !== (opcode & 0xFF)) {
          this.pc += 2;
        }
        break;

      case 0x5000: // 5xy0 - SE Vx, Vy
        if (this.v[x] === this.v[y]) {
          this.pc += 2;
        }
        break;

      case 0x6000: // 6xkk LD Vx, byte
        this.v[x] = (opcode & 0xFF);
        break;

      case 0x7000: // 7xkk - ADD Vx, byte
        this.v[x] += (opcode & 0xFF);
        break;

      case 0x8000:
        switch (opcode & 0xF) {
          case 0x0: // 8xy0 - LD Vx, Vy
            this.v[x] = this.v[y];
            break;

          case 0x1: // 8xy1 - OR Vx, Vy
            this.v[x] |= this.v[y];
            break;

          case 0x2: // 8xy2 - AND Vx, Vy
            this.v[x] &= this.v[y];
            break;

          case 0x3: // 8xy3 - XOR Vx, Vy
            this.v[x] ^= this.v[y];
            break;

          case 0x4: // 8xy4 - ADD Vx, Vy
            // If result is greater than 8 bits, VF is set to 1, otherwise 0.
            // Only the lowest 8 bits of the result are kept and stored in Vx
            let sum = (this.v[x] += this.v[y]);

            this.v[0xF] = 0;

            if (sum > 0xFF) {
              this.v[0xF] = 1;
            }

            this.v[x] = sum;
            break;

          case 0x5: // 8xy5 - SUB Vx, Vy
            this.v[0xF] = 0;

            // Handle underflow
            if(this.v[x] > this.v[y]) {
              this.v[0xF] = 1;
            }

            this.v[x] -= this.v[y];
            break;

          case 0x6: // 8xy6 - SHR Vx [, Vy]
            // Set least significant bit to VF
            this.v[0xF] = (this.v[x] & 0x1);

            this.v[x] >>= 1;
            break;

          case 0x7: // 8xy7 - SUBN Vx, Vy
            this.v[0xF] = 0;

            if (this.v[y] > this.v[x]) {
              this.v[0xF] = 1;
            }

            this.v[x] = this.v[y] - this.v[x];
            break;

          case 0xE: // 8xyE - SHL Vx {, Vy}
            this.v[0xF] = (this.v[x] & 0x80);
            this.v[x] <<= 1;
            break;
        }

        break;

      case 0x9000: // 9xy0 - SNE Vx, Vy
        if (this.v[x] !== this.v[y]) {
          this.pc += 2;
        }
        break;

      case 0xA000: // Annn -LD I, addr
        this.i = (opcode & 0xFFF);
        break;

      case 0xB000: // Bnnn - JP V0, addr
        this.pc = (opcode & 0xFFF) + this.v[0];
        break;

      case 0xC000: // Cxkk - RND Vx, byte
        let rand = Math.floor(Math.random() * 0xFF);

        this.v[x] = rand & (opcode & 0xFF);
        break;

      case 0xD000: // Dxyn - DRW Vx, Vy, nibble
        let width = 8;
        let height = (opcode & 0xF);

        this.v[0xF] = 0;

        for (let row = 0; row < height; row++) {
          let sprite = this.memory[this.i + row];

          for (let col = 0; col < width; col++) {
            // If the bit (sprite) is not 0, render/erase the pixel
            if ((sprite & 0x80) > 0) {
              // If setPixel returns 1, which means a pixel was erased, set VF to 1
              if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
                this.v[0xF] = 1;
              }
            }

            // Shift the sprite left 1.
            sprite <<= 1;
          }
        }
        break;

      case 0xE000:
        switch (opcode & 0xFF) {
          case 0x9E: // Ex9E - SKP Vx
            if (this.keyboard.isKeyPressed(this.v[x])) {
              this.pc += 2;
            }
            break;

          case 0xA1: // ExA1 - SKNP Vx
            if (!this.keyboard.isKeyPressed(this.v[x])) {
              this.pc += 2;
            }
            break;
        }

        break;

      case 0xF000:
        switch (opcode & 0xFF) {
          case 0x07: // Fx07 - LD Vx, DT
            this.v[x] = this.delayTimer;
            break;

          case 0x0A: // Fx0A - LD Vx, K
            this.paused = true;

            this.keyboard.onNextKeyPress = function(key) {
              this.v[x] = key;
              this.paused = false;
            }.bind(this);
            break;

          case 0x15: // Fx15 - LD DT, Vx
            this.delayTimer = this.v[x];
            break;

          case 0x18: // Fx18 - LD ST, Vx
            this.soundTimer = this.v[x];
            break;

          case 0x1E: // Fx1E - ADD I, Vx
            this.i += this.v[x];
            break;

          case 0x29: // Fx29 - LD F, Vx - ADD I, Vx
            this.i = this.v[x] * 5; // Each sprite is 5 bytes long
            break;

          case 0x33: // Fx33 - LD B, Vx
            // Get the hundreds digit and place it in I.
            this.memory[this.i] = parseInt(this.v[x] / 100);

            // Get tens digit and place it in I+1. Gets a value between 0 and 99,
            // then divides by 10 to give us a value between 0 and 9.
            this.memory[this.i + 1] = parseInt((this.v[x] % 100) / 10);

            // Get the value of the ones (last) digit and place it in i+2.
            this.memory[this.i + 2] = parseInt(this.v[x] % 10);
            break;

          case 0x55: // Fx55 - LD [I], Vx
            for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
              this.memory[this.i + registerIndex] = this.v[registerIndex];
            }
            break;

          case 0x65: // Fx65 - LD Vx, [I]
            for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
              this.v[registerIndex] = this.memory[this.i + registerIndex];
            }
            break;
        }

        break;

      default:
        throw new Error('Unknown opcode ' + opcode);
    }
  }
}

export default CPU;