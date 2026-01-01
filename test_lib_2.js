const { EdgeTTS } = require('node-edge-tts');
try {
    const tts = new EdgeTTS();
    console.log("Instance Keys:", Object.keys(tts));
    const proto = Object.getPrototypeOf(tts);
    console.log("Proto Keys:", Object.getOwnPropertyNames(proto));
} catch (e) {
    console.log("Constructor Error:", e.message);
}
