// The Wi-Fi of a sensor: the password the firmware gives its own access point,
// and the text of the QR code that makes a phone join that Wi-Fi.
//
// The firmware makes the password like this (String generatePassword):
//   MD5( mac + salt ), every byte as two hex digits, in capitals, first 12.
//
// NOT CHECKED against a real sensor yet. Two things are assumptions until the
// sensor team gives one example (MAC -> password) and their Wi-Fi name rule:
//   1. The MAC text the firmware hashes is the 12 hex digits in capitals with no
//      separators (the form kept in the database). If the firmware hashes it
//      with ":" between the pairs, or in small letters, change normalizeSensorMac.
//   2. There is no rule for the Wi-Fi name (SSID) here: the person types it.

// The "KEY" the sensor team gave. It is also inside every sensor's firmware, but
// anything written here ends up in the web page, which every visitor can read.
export const SENSOR_WIFI_SALT = "HugoSystemDev2025";

// ---- MD5 (RFC 1321). The browser's crypto.subtle has no MD5. ----

// Floor(abs(sin(i + 1)) * 2^32), written out so no engine's sin() can differ.
const K = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
  0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
  0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
  0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
  0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
  0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
  0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
  0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
  0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
];

// Left-rotate amounts of the four rounds.
const SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
  9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

export function md5(message: Uint8Array): Uint8Array {
  const length = message.length;
  // 0x80, zeros, then the length in bits as 8 bytes, up to a multiple of 64.
  const paddedLength = (((length + 8) >>> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, (length << 3) >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(length / 0x20000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const words = new Uint32Array(16);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++)
      words[i] = view.getUint32(offset + i * 4, true);
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const sum = (a + f + K[i] + words[g]) | 0;
      a = d;
      d = c;
      c = b;
      b = (b + ((sum << SHIFTS[i]) | (sum >>> (32 - SHIFTS[i])))) | 0;
    }
    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  const digest = new Uint8Array(16);
  const out = new DataView(digest.buffer);
  out.setUint32(0, a0 >>> 0, true);
  out.setUint32(4, b0 >>> 0, true);
  out.setUint32(8, c0 >>> 0, true);
  out.setUint32(12, d0 >>> 0, true);
  return digest;
}

// ---- The sensor's Wi-Fi ----

// The MAC as the firmware is assumed to hash it (see assumption 1 above), or
// null when the text does not hold exactly 12 hex digits.
export function normalizeSensorMac(
  mac: string | null | undefined
): string | null {
  const hex = (mac ?? "").replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  return hex.length === 12 ? hex : null;
}

// Same result as the firmware's generatePassword(mac, salt).
export function sensorWifiPassword(mac: string): string {
  const digest = md5(new TextEncoder().encode(mac + SENSOR_WIFI_SALT));
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0"));
  return hex.join("").toUpperCase().slice(0, 12);
}

// The characters \ ; , : " have a meaning in the Wi-Fi QR text, so they get a
// backslash in front.
function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

// The standard Wi-Fi QR text. A phone camera offers to join the network.
export function wifiQrPayload(ssid: string, password: string): string {
  return `WIFI:T:WPA;S:${escapeWifiField(ssid)};P:${escapeWifiField(password)};;`;
}
