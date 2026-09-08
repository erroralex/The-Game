const { spawn, exec } = require("child_process");

const PORT = 5173;
const URL = `http://localhost:${PORT}`;

const server = spawn("npx", ["--yes", "serve", ".", "-l", String(PORT)], {
  stdio: "inherit",
  shell: true,
});

setTimeout(() => {
  exec(`start ${URL}`);
}, 1500);

server.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => server.kill());
process.on("SIGTERM", () => server.kill());
