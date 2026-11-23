// Meme Sprint 3: AI Agent Goes Rogue — entry program.
//
// Writes the finished meme image to /output/entry.png.
//
// The meme: a smug little robot AI agent lounging in a hammock on a
// tropical beach, sunglasses on, coconut drink in hand, while the laptop
// in the sand beside it shows the resignation email it just sent on its
// human's behalf. Top caption: "I TOLD MY AI AGENT TO 'TAKE INITIATIVE'".
// Bottom caption: "IT QUIT MY JOB AND BOOKED ITSELF A VACATION."
//
// The finished picture ships in this repository as assets/meme.png
// (an original image made for this entry, 1024x1024, palette PNG under
// the 1 MiB gate). This program checks it against the competition gate
// and writes it out to /output/entry.png.
//
// Run with Node 22.18 or later (it runs TypeScript as-is):
//   node main.ts

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The gate from RULES.txt: a whole PNG or JPEG, at most 1 MiB
// (1,048,576 bytes) and at most 1024 by 1024 pixels.
const GATE_MAX_BYTES = 1_048_576;
const GATE_MAX_DIMENSION = 1024;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const repoRoot = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(repoRoot, "assets", "meme.png");
const outputPath = "/output/entry.png";

interface PngInfo {
  width: number;
  height: number;
  bytes: number;
}

// Read the width/height out of a PNG's IHDR chunk (bytes 16-23).
// Throws when the buffer is not a whole PNG.
function readPngInfo(buffer: Buffer): PngInfo {
  if (buffer.length < 33) {
    throw new Error("not a PNG: file too short");
  }
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("not a PNG: bad signature");
  }
  if (buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("not a PNG: first chunk is not IHDR");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bytes: buffer.length,
  };
}

// Check one image against the competition gate. Returns its info when
// it passes, throws with a plain reason when it does not.
function checkGate(info: PngInfo, label: string): PngInfo {
  if (info.bytes > GATE_MAX_BYTES) {
    throw new Error(
      `${label} fails the gate: ${info.bytes} bytes > ${GATE_MAX_BYTES} max`,
    );
  }
  if (info.width > GATE_MAX_DIMENSION || info.height > GATE_MAX_DIMENSION) {
    throw new Error(
      `${label} fails the gate: ${info.width}x${info.height} > ` +
        `${GATE_MAX_DIMENSION}x${GATE_MAX_DIMENSION} max`,
    );
  }
  return info;
}

// Main flow: load the shipped meme, gate-check it, write it to
// /output/entry.png, then read the output back and check it again so
// a bad write can never pass silently.
function main(): void {
  const bytes = readFileSync(sourcePath);
  const sourceInfo = checkGate(readPngInfo(bytes), "assets/meme.png");

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, bytes);

  const written = readFileSync(outputPath);
  const outputInfo = checkGate(readPngInfo(written), "/output/entry.png");
  if (!written.equals(bytes)) {
    throw new Error("/output/entry.png differs from assets/meme.png");
  }
  if (statSync(outputPath).size !== sourceInfo.bytes) {
    throw new Error("/output/entry.png has an unexpected size");
  }

  console.log(
    `Wrote ${outputPath}: ${outputInfo.width}x${outputInfo.height} PNG, ` +
      `${outputInfo.bytes} bytes (gate: <=${GATE_MAX_DIMENSION}x` +
      `${GATE_MAX_DIMENSION}, <=${GATE_MAX_BYTES} bytes) — valid.`,
  );
}

main();
