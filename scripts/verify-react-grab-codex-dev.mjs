import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const codexPackageDirectory = path.join(
  projectRoot,
  "node_modules",
  "@react-grab",
  "codex",
);
const codexSdkVendorDirectory = path.join(
  projectRoot,
  "node_modules",
  "@openai",
  "codex-sdk",
  "vendor",
);
const reactGrabCodexVendorDirectory = path.join(codexPackageDirectory, "vendor");
const isStrictMode = process.argv.includes("--strict");

function fail(message) {
  const formattedMessage = `[react-grab-codex setup] ${message}`;

  if (isStrictMode) {
    console.error(formattedMessage);
    process.exit(1);
  }

  console.warn(formattedMessage);
  process.exit(0);
}

function pathExists(targetPath) {
  try {
    fs.lstatSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function ensureGlobalCodexCommand() {
  if (!isStrictMode) {
    return;
  }

  const commandCheck = spawnSync("codex", ["--version"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (commandCheck.error?.code === "ENOENT") {
    fail(
      "Missing global `codex` command. Install it with `npm i -g @openai/codex` and restart your terminal before running `npm run dev`.",
    );
  }

  if (commandCheck.error) {
    fail(
      "Could not execute the global `codex` command during the setup check: "
        + commandCheck.error.message,
    );
  }

  if (commandCheck.status !== 0) {
    const errorOutput = commandCheck.stderr?.trim() || commandCheck.stdout?.trim();
    const outputSuffix = errorOutput ? ` Output: ${errorOutput}` : "";

    fail(
      `The global \`codex\` command is available but failed during the setup check.${outputSuffix}`,
    );
  }
}

function ensureCodexSdkVendorSetup() {
  if (!pathExists(codexPackageDirectory)) {
    fail(
      "Missing `@react-grab/codex` package. Run `npm install` before starting the development server.",
    );
  }

  if (!pathExists(codexSdkVendorDirectory)) {
    fail(
      "Missing `@openai/codex-sdk/vendor`. Reinstall dependencies and verify the React Grab Codex setup.",
    );
  }

  if (pathExists(reactGrabCodexVendorDirectory)) {
    try {
      const existingStat = fs.lstatSync(reactGrabCodexVendorDirectory);

      if (!existingStat.isSymbolicLink()) {
        fail(
          "`node_modules/@react-grab/codex/vendor` already exists and is not a symlink. Remove it and rerun `npm install` to restore the React Grab Codex setup.",
        );
      }

      const resolvedReactGrabVendorDirectory = fs.realpathSync(
        reactGrabCodexVendorDirectory,
      );
      const resolvedCodexSdkVendorDirectory = fs.realpathSync(
        codexSdkVendorDirectory,
      );

      if (resolvedReactGrabVendorDirectory === resolvedCodexSdkVendorDirectory) {
        return;
      }

      fs.rmSync(reactGrabCodexVendorDirectory, { force: true, recursive: true });
    } catch (error) {
      fail(
        `Could not verify the React Grab Codex setup link: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const relativeVendorTarget = path.relative(
    codexPackageDirectory,
    codexSdkVendorDirectory,
  );
  const symlinkType = process.platform === "win32" ? "junction" : "dir";

  try {
    fs.symlinkSync(relativeVendorTarget, reactGrabCodexVendorDirectory, symlinkType);
  } catch (error) {
    fail(
      `Could not create the React Grab Codex setup link: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

ensureCodexSdkVendorSetup();
ensureGlobalCodexCommand();
