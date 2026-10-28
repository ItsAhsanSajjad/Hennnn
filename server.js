// Passenger entry point for cPanel "Setup Node.js App".
// cPanel/Passenger loads this file and provides the port via process.env.PORT.
// It boots the already-built Next.js app in production mode.
//
// Requirements before this runs:
//   1. `npm install` has been run on the server (Linux-native binaries).
//   2. `npm run build` has produced the .next/ folder on the server.
//
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`> pakhen ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
