import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const indexModule = require("../index.js");

describe("index.js exports", () => {
  it("exports main, runCli and createServer without auto-starting", () => {
    expect(typeof indexModule.main).toBe("function");
    expect(typeof indexModule.runCli).toBe("function");
    expect(typeof indexModule.createServer).toBe("function");
  });
});

describe("bootstrap helpers", () => {
  it("main calls the injected start function", async () => {
    let called = false;
    await indexModule.main(async () => {
      called = true;
    });
    expect(called).toBe(true);
  });

  it("runCli handles startup errors with verbose logging", async () => {
    const logs = [];
    let exitCode;

    await indexModule.runCli({
      startServer: async () => {
        throw new Error("boom");
      },
      logError: (...args) => logs.push(args.join(" ")),
      exit: (code) => {
        exitCode = code;
      },
    });

    expect(exitCode).toBe(1);
    expect(logs[0]).toContain("Server error:");
    expect(logs[0]).toContain("Error: boom");
  });
});

describe("index.js CLI branch", () => {
  it("executes the CLI path when run as the main module", async () => {
    const child = spawn(process.execPath, [path.resolve(process.cwd(), "index.js")], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill("SIGTERM");
      }, 100);

      child.once("error", reject);
      child.once("close", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }, 15_000);
});
