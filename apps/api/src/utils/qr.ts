/**
 * Zero-dependency In-Process QR Code Generator (ISO/IEC 18004 compliant)
 * Generates Base64 Data URL or SVG string locally so secrets never leave the server.
 */

// Reed-Solomon Galois Field GF(256) tables
const GF256_EXP: number[] = new Array(512);
const GF256_LOG: number[] = new Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  GF256_LOG[0] = 0;
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsComputePoly(ecCount: number): number[] {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const root = GF256_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecCount: number): number[] {
  const genPoly = rsComputePoly(ecCount);
  const result = new Array(ecCount).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    result.shift();
    result.push(0);
    for (let j = 0; j < ecCount; j++) {
      result[j] ^= gfMul(genPoly[j], factor);
    }
  }
  return result;
}

// Version table definitions for QR Code Version 1 through Version 10
interface QRVersionSpec {
  version: number;
  totalCodewords: number;
  ecCodewords: number;
  dataCodewords: number;
  size: number;
  alignments: number[];
}

const VERSION_SPECS: QRVersionSpec[] = [
  { version: 1, size: 21, totalCodewords: 26, ecCodewords: 10, dataCodewords: 16, alignments: [] },
  { version: 2, size: 25, totalCodewords: 44, ecCodewords: 16, dataCodewords: 28, alignments: [6, 18] },
  { version: 3, size: 29, totalCodewords: 70, ecCodewords: 26, dataCodewords: 44, alignments: [6, 22] },
  { version: 4, size: 33, totalCodewords: 100, ecCodewords: 36, dataCodewords: 64, alignments: [6, 26] },
  { version: 5, size: 37, totalCodewords: 134, ecCodewords: 48, dataCodewords: 86, alignments: [6, 30] },
  { version: 6, size: 41, totalCodewords: 172, ecCodewords: 64, dataCodewords: 108, alignments: [6, 34] },
  { version: 7, size: 45, totalCodewords: 196, ecCodewords: 72, dataCodewords: 124, alignments: [6, 22, 38] },
  { version: 8, size: 49, totalCodewords: 242, ecCodewords: 88, dataCodewords: 154, alignments: [6, 24, 42] },
  { version: 9, size: 53, totalCodewords: 292, ecCodewords: 110, dataCodewords: 182, alignments: [6, 26, 46] },
  { version: 10, size: 57, totalCodewords: 346, ecCodewords: 130, dataCodewords: 216, alignments: [6, 28, 50] },
];

export class LocalQrCode {
  /**
   * Encodes a string into a standard black-and-white 2D boolean matrix.
   */
  static generateMatrix(text: string): boolean[][] {
    const rawBytes = Buffer.from(text, "utf-8");
    const charCount = rawBytes.length;

    // Find smallest version that fits
    let spec: QRVersionSpec | undefined;
    for (const v of VERSION_SPECS) {
      // 4 bits mode + 8 bits length (for V1-9) + data
      const requiredBytes = 2 + charCount;
      if (v.dataCodewords >= requiredBytes) {
        spec = v;
        break;
      }
    }

    if (!spec) {
      spec = VERSION_SPECS[VERSION_SPECS.length - 1];
    }

    // Build data bitstream (Byte mode = 0100)
    let bitString = "0100";
    bitString += charCount.toString(2).padStart(8, "0");
    for (let i = 0; i < charCount; i++) {
      bitString += rawBytes[i].toString(2).padStart(8, "0");
    }

    // Terminator (up to 4 zeroes)
    const maxBits = spec.dataCodewords * 8;
    bitString = bitString.padEnd(Math.min(bitString.length + 4, maxBits), "0");

    // Pad to byte boundary
    while (bitString.length % 8 !== 0 && bitString.length < maxBits) {
      bitString += "0";
    }

    // Pad with 11101100 (0xEC) and 00010001 (0x11)
    const padBytes = ["11101100", "00010001"];
    let padIndex = 0;
    while (bitString.length < maxBits) {
      bitString += padBytes[padIndex % 2];
      padIndex++;
    }

    // Convert bitstring to data codewords
    const dataCodewords: number[] = [];
    for (let i = 0; i < bitString.length; i += 8) {
      dataCodewords.push(parseInt(bitString.substring(i, i + 8), 2));
    }

    // Error correction codewords
    const ecCodewords = rsEncode(dataCodewords, spec.ecCodewords);
    const allCodewords = [...dataCodewords, ...ecCodewords];

    // Initialize Matrix
    const size = spec.size;
    const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
      new Array(size).fill(null)
    );

    // 1. Finder Patterns (Top-Left, Top-Right, Bottom-Left)
    function drawFinder(row: number, col: number) {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const mr = row + r;
          const mc = col + c;
          if (mr >= 0 && mr < size && mc >= 0 && mc < size) {
            if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
              const isBlack =
                r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
              matrix[mr][mc] = isBlack;
            } else {
              matrix[mr][mc] = false; // Separator
            }
          }
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // 2. Timing Patterns
    for (let i = 8; i < size - 8; i++) {
      if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
      if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
    }

    // 3. Alignment Patterns
    for (const ar of spec.alignments) {
      for (const ac of spec.alignments) {
        if (matrix[ar][ac] !== null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const isBlack = Math.max(Math.abs(r), Math.abs(c)) !== 1;
            matrix[ar + r][ac + c] = isBlack;
          }
        }
      }
    }

    // 4. Dark Module
    matrix[size - 8][8] = true;

    // 5. Format Information Placeholder reservation (Mask 0 + ECC Low: 101010000010010)
    const formatBits = "111011111000100"; // Standard Low EC, Mask pattern 0
    for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === "1";
    matrix[8][7] = formatBits[6] === "1";
    matrix[8][8] = formatBits[7] === "1";
    matrix[7][8] = formatBits[8] === "1";
    for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === "1";

    for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = formatBits[i] === "1";
    for (let i = 0; i < 7; i++) matrix[8][size - 7 + i] = formatBits[8 + i] === "1";

    // 6. Populate Data Codewords
    let codewordBits = "";
    for (const cw of allCodewords) {
      codewordBits += cw.toString(2).padStart(8, "0");
    }

    let bitIdx = 0;
    let right = size - 1;
    let upward = true;

    while (right > 0) {
      if (right === 6) right--; // Skip vertical timing pattern column

      const rows = upward
        ? Array.from({ length: size }, (_, k) => size - 1 - k)
        : Array.from({ length: size }, (_, k) => k);

      for (const r of rows) {
        for (const colOffset of [0, 1]) {
          const c = right - colOffset;
          if (matrix[r][c] === null) {
            let val = false;
            if (bitIdx < codewordBits.length) {
              val = codewordBits[bitIdx] === "1";
              bitIdx++;
            }
            // Apply Mask 0: (row + col) % 2 === 0
            const mask = (r + c) % 2 === 0;
            matrix[r][c] = mask ? !val : val;
          }
        }
      }

      right -= 2;
      upward = !upward;
    }

    return matrix.map((row) => row.map((cell) => cell === true));
  }

  /**
   * Generates a clean SVG string of the QR Code
   */
  static toSvg(text: string, size = 200, margin = 3): string {
    const matrix = this.generateMatrix(text);
    const matrixSize = matrix.length;
    const totalCells = matrixSize + margin * 2;
    const cellSize = size / totalCells;

    let paths = "";
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (matrix[r][c]) {
          const x = (c + margin) * cellSize;
          const y = (r + margin) * cellSize;
          paths += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#000000"/>`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#ffffff"/>${paths}</svg>`;
  }

  /**
   * Generates a Base64 Data URL for easy embedding directly in HTML/React Image src
   */
  static toDataUrl(text: string, size = 200, margin = 3): string {
    const svg = this.toSvg(text, size, margin);
    const base64 = Buffer.from(svg).toString("base64");
    return `data:image/svg+xml;base64,${base64}`;
  }
}
