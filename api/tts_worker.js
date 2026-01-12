const { Communicate } = require('edge-tts-universal');
const fs = require('fs');

async function main() {
    const text = process.argv[2];
    const voice = process.argv[3];
    const outputFile = process.argv[4];

    if (!text || !voice || !outputFile) {
        console.error("Usage: node tts_worker.js <text> <voice> <outputFile>");
        process.exit(1);
    }

    try {
        const tts = new Communicate(text, voice);
        const audioChunks = [];

        for await (const chunk of tts.stream()) {
            if (chunk.type === 'audio') {
                audioChunks.push(chunk.data);
            }
        }

        const audioBuffer = Buffer.concat(audioChunks);
        if (audioBuffer.length === 0) throw new Error("0 bytes received");

        fs.writeFileSync(outputFile, audioBuffer);
        // console.log("Success");
    } catch (e) {
        console.error("Worker Error:", e);
        process.exit(1);
    }
}

main();
