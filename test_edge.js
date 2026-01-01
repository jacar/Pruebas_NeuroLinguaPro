const { Communicate } = require('edge-tts-universal');
const fs = require('fs');

async function main() {
    try {
        console.log("Testing Christopher...");
        const tts = new Communicate("Hello I am a man", "en-US-ChristopherNeural");
        let chunks = [];
        for await (const chunk of tts.stream()) {
            if (chunk.type === 'audio') chunks.push(chunk.data);
        }
        if (chunks.length > 0) console.log("Christopher OK");
        else console.log("Christopher 0 bytes");

        console.log("Testing Guy...");
        const tts2 = new Communicate("Hello I am a man", "en-US-GuyNeural");
        let chunks2 = [];
        for await (const chunk of tts2.stream()) {
            if (chunk.type === 'audio') chunks2.push(chunk.data);
        }
        if (chunks2.length > 0) console.log("Guy OK");
        else console.log("Guy 0 bytes");

    } catch (e) {
        console.error(e);
    }
}
main();
