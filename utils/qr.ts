// utils/qr.ts - Lightweight self-contained QR Code Generator
// Implements QR Code Model 2 (Byte encoding, Error Correction L/M)

// Mode indicators
const MODE_8BIT_BYTE = 4;

  // Polynomials and Galois Field for Reed-Solomon Error Correction
  const EXP_TABLE = new Array(256);
  const LOG_TABLE = new Array(256);
  for (let i = 0, x = 1; i < 256; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }

  function glog(n) {
    if (n < 1) throw new Error("glog(" + n + ")");
    return LOG_TABLE[n];
  }
  function gexp(n) {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return EXP_TABLE[n];
  }

  function RSBlock(totalCount, dataCount) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }

  // Version 1..10 specs [Total codewords, EC codewords, Block info]
  const RS_BLOCK_TABLE = [
    // Version 1
    [1, 26, 19],
    // Version 2
    [1, 44, 34],
    // Version 3
    [1, 70, 55],
    // Version 4
    [1, 100, 80],
    // Version 5
    [1, 134, 108],
    // Version 6
    [2, 86, 68],
    // Version 7
    [2, 98, 78],
    // Version 8
    [2, 121, 97],
    // Version 9
    [2, 146, 116],
    // Version 10
    [2, 86, 68]
  ];

  function getRSBlocks(version) {
    const v = RS_BLOCK_TABLE[version - 1] || RS_BLOCK_TABLE[3];
    return [new RSBlock(v[1], v[2])];
  }

  function createBytes(buffer, rsBlocks) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = [];
    const ecdata = [];

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);

      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;

      const rsPoly = getErrorCorrectPolynomial(ecCount);
      const rawPoly = new Polynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
      }
    }

    const totalCodeCount = rsBlocks.reduce((acc, b) => acc + b.totalCount, 0);
    const data = new Array(totalCodeCount);
    let index = 0;

    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) data[index++] = dcdata[r][i];
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) data[index++] = ecdata[r][i];
      }
    }
    return data;
  }

  function Polynomial(num, shift) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
    for (let i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
  }

  Polynomial.prototype.get = function(index) { return this.num[index]; };
  Polynomial.prototype.getLength = function() { return this.num.length; };
  Polynomial.prototype.multiply = function(e) {
    const num = new Array(this.getLength() + e.getLength() - 1);
    for (let i = 0; i < num.length; i++) num[i] = 0;
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
      }
    }
    return new Polynomial(num, 0);
  };
  Polynomial.prototype.mod = function(e) {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = glog(this.get(0)) - glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= gexp(glog(e.get(i)) + ratio);
    }
    return new Polynomial(num, 0).mod(e);
  };

  function getErrorCorrectPolynomial(errorCorrectLength) {
    let a = new Polynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new Polynomial([1, gexp(i)], 0));
    }
    return a;
  }

  function BitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  BitBuffer.prototype.get = function(index) {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1;
  };
  BitBuffer.prototype.put = function(num, length) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  };
  BitBuffer.prototype.putBit = function(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    this.length++;
  };

  function QRCodeModel(version, data) {
    this.version = version;
    this.moduleCount = version * 4 + 17;
    this.modules = null;
    this.data = data;
  }

  QRCodeModel.prototype.make = function() {
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount).fill(null);
    }

    // Position detection patterns
    this.setupPositionProbe(0, 0);
    this.setupPositionProbe(this.moduleCount - 7, 0);
    this.setupPositionProbe(0, this.moduleCount - 7);

    // Timing patterns
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] === null) this.modules[r][6] = (r % 2 === 0);
      if (this.modules[6][r] === null) this.modules[6][r] = (r % 2 === 0);
    }

    // Data bits
    const buffer = new BitBuffer();
    buffer.put(MODE_8BIT_BYTE, 4);
    buffer.put(this.data.length, this.version < 10 ? 8 : 16);
    for (let i = 0; i < this.data.length; i++) {
      buffer.put(this.data.charCodeAt(i), 8);
    }

    const rsBlocks = getRSBlocks(this.version);
    const totalDataCount = rsBlocks.reduce((acc, b) => acc + b.dataCount, 0);

    // Padding
    if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.length % 8 !== 0) buffer.putBit(false);
    while (true) {
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(0xec, 8);
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }

    const dataBytes = createBytes(buffer, rsBlocks);
    this.mapData(dataBytes);
  };

  QRCodeModel.prototype.setupPositionProbe = function(row, col) {
    for (let r = -1; r <= 7; r++) {
      if (row + r < 0 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c < 0 || this.moduleCount <= col + c) continue;
        if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  };

  QRCodeModel.prototype.mapData = function(data) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
            }
            // Simple mask pattern 0: (row + col) % 2 === 0
            if ((row + (col - c)) % 2 === 0) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  };

  // Generate SVG string
  function generateQRCodeSVG(text, size = 220) {
    let version = 4;
    if (text.length < 25) version = 2;
    else if (text.length < 50) version = 4;
    else if (text.length < 80) version = 6;
    else version = 8;

    const qr = new QRCodeModel(version, text);
    qr.make();

    const count = qr.moduleCount;
    const margin = 2;
    const totalModules = count + margin * 2;
    const moduleSize = size / totalModules;

    let paths = '';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.modules[r][c]) {
          const x = (c + margin) * moduleSize;
          const y = (r + margin) * moduleSize;
          paths += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${moduleSize.toFixed(1)}" height="${moduleSize.toFixed(1)}" fill="#0f172a" />`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background:#ffffff; border-radius:12px; padding:6px; box-shadow:0 8px 30px rgba(0,0,0,0.12);"><rect width="100%" height="100%" fill="#ffffff" rx="8"/>${paths}</svg>`;
  }

  

export { generateQRCodeSVG };
