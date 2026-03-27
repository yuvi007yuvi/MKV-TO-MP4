# MKV TO MP4 - Premium Web Converter

## GitHub Pages Deployment
This project is configured to run on GitHub Pages. It uses `coi-serviceworker.js` to enable the required security features (Cross-Origin Isolation) and `toBlobURL` to handle cross-origin workers.

### Local Development
1. Run `node server.mjs` to start a local server with the correct headers.
2. Open `http://localhost:3000`.

*Note: Opening the `index.html` file directly in the browser won't work due to security restrictions.*

