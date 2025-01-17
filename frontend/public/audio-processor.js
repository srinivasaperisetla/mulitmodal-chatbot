// class PCMProcessor extends AudioWorkletProcessor {
//   constructor() {
//     console.log("constructor is being called")
//     super();
//     this.buffer = new Float32Array(); // Initialize a buffer for incoming audio data

//     this.port.onmessage = (e) => {
//       console.log("this.port.onmessage is being called")
//       // Handle messages sent from the main thread
//       const newData = e.data;
//       const newBuffer = new Float32Array(this.buffer.length + newData.length);
//       newBuffer.set(this.buffer);
//       newBuffer.set(newData, this.buffer.length);
//       this.buffer = newBuffer;
//     };
//   }

//   process(inputs, outputs) {
//     console.log("process is being called")
//     const input = inputs[0]; // Access the first input
//     if (input && input[0]) {
//       const channelData = input[0]; // First channel data
//       const pcm16 = new Int16Array(channelData.length);

//       for (let i = 0; i < channelData.length; i++) {
//         pcm16[i] = Math.max(-32768, Math.min(32767, channelData[i] * 0x7fff)); // Scale to 16-bit PCM
//       }

//       this.port.postMessage(pcm16); // Send PCM data to the main thread
//     } else {
//       console.warn("No audio input detected."); // Log warning if no input is detected
//     }

//     return true; // Keep the processor alive
//   }
// }

// registerProcessor("pcm-processor", PCMProcessor);

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(); // Initialize a buffer for incoming audio data

    this.port.onmessage = (e) => {
      const newData = e.data;
      const newBuffer = new Float32Array(this.buffer.length + newData.length);
      newBuffer.set(this.buffer);
      newBuffer.set(newData, this.buffer.length);
      this.buffer = newBuffer;
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (input && input[0]) {
      const channelData = input[0]; // First channel data
      const pcm16 = new Int16Array(channelData.length);

      for (let i = 0; i < channelData.length; i++) {
        pcm16[i] = Math.max(-32768, Math.min(32767, channelData[i] * 0x7fff)); // Scale to 16-bit PCM
      }

      this.port.postMessage(pcm16); // Send PCM data to the main thread
    } else {
      console.warn("No audio input detected.");
    }

    if (this.buffer.length >= output[0].length) {
      // Write buffered data to output channels
      output[0].set(this.buffer.slice(0, output[0].length));
      this.buffer = this.buffer.slice(output[0].length);
    }

    return true; // Keep the processor alive
  }
}

registerProcessor("pcm-processor", PCMProcessor);
