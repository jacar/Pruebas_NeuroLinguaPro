const { Communicate } = require('edge-tts-universal');
(async () => {
    try {
        const tts = new Communicate("Hello world", "en-US-AriaNeural");
        let count = 0;
        for await (const chunk of tts.stream()) {
            count++;
            console.log(`Chunk ${count} type:`, typeof chunk);
            if (chunk && typeof chunk === 'object') {
                console.log("Keys:", Object.keys(chunk));
                if (chunk.type) console.log("Chunk Type:", chunk.type);
            }
            if (count > 0) break; // Just check first one
        }
    } catch (e) {
        console.error("Stream Error:", e);
    }
})();
