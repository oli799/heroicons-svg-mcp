#!/usr/bin/env node

const { createServer, startStdioServer } = require("./src/server");

async function main(startServer = startStdioServer) {
  await startServer();
}

async function runCli({
  startServer = startStdioServer,
  logError = console.error,
  exit = process.exit,
} = {}) {
  try {
    await main(startServer);
  } catch (error) {
    logError("Server error:", error);
    exit(1);
  }
}

/* c8 ignore start */
if (require.main === module) {
  void runCli();
}
/* c8 ignore stop */

module.exports = {
  createServer,
  main,
  runCli,
};
