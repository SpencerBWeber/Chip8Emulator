class Speaker {
  constructor() {
    const AudioContext = window.AudioContext;

    this.audioCtx = new AudioContext();

    // Create a gain, (volume control)
    this.gainNode = this.audioCtx.createGain();
    this.finish = this.audioCtx.destination;

    // Mute audio]
    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);

    // Unmute audio
    this.gainNode.gain.setValueAtTime(1, this.audioCtx.currentTime);

    // Connect gain to audio context
    this.gainNode.connect(this.finish);
  }

  play(frequency) {
    if(this.audioCtx && !this.oscillator) {
      this.oscillator = this.audioCtx.createOscillator();

      // Set the frequency
      this.oscillator.frequency.setValueAtTime(frequency || 440, this.audioCtx.currentTime);

      // Square wave
      this.oscillator.type = 'square';

      // connect the gain and start the sound
      this.oscillator.connect(this.gain);
      this.oscillator.start();
    }
  }

  stop() {
    if(this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
  }
}

export default Speaker;