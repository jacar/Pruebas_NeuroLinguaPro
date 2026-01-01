try {
    const pkg = require('edge-tts-universal');
    console.log("Package Exports:", pkg);
    console.log("Keys:", Object.keys(pkg));
} catch (e) {
    console.error("Error requiring package:", e);
}
