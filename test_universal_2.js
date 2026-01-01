const { Communicate } = require('edge-tts-universal');
try {
    const c = new Communicate("test", "en-US-AriaNeural");
    console.log("Proto Keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(c)));
} catch (e) {
    console.log("Constructor Error:", e.message);
}
