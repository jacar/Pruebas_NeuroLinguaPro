try {
    const pkg = require('node-edge-tts');
    console.log("Package Exports:", pkg);
    if (pkg.default) console.log("Default Export:", pkg.default);
    console.log("Keys:", Object.keys(pkg));
} catch (e) {
    console.error("Error requiring package:", e);
}
