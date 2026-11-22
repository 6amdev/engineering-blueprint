// scan.mjs — หาค่าลับ / IP สาธารณะ / คำต้องห้ามในข้อความ · ใช้ร่วมกันโดย pre-commit, draft-check, CI
// บรรทัดที่ตั้งใจเขียน (เช่นตัวอย่างในเอกสาร) ใส่ `secret-scan:allow` ในบรรทัดนั้น · ใช้ให้น้อยที่สุด

import { BlockList, isIPv4 } from 'node:net';

const RULES = [
  ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['aws-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['github-token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['slack-token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['ai-api-key', /\bsk-(ant-)?[A-Za-z0-9_-]{20,}/],
  ['bot-token', /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['url-with-password', /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@/i],
  ['secret-assignment', /\b(api[_-]?key|secret|token|passw(or)?d)\b["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i],
];

// IPv4 ที่ใช้งานได้บนอินเทอร์เน็ต = FAIL · วงที่สงวนไว้ (ภายใน / loopback / ตัวอย่างในเอกสาร / multicast) = ผ่าน
const RESERVED = new BlockList();
for (const [net, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16],
  ['192.0.2.0', 24], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 3],
]) RESERVED.addSubnet(net, bits, 'ipv4');
const publicIps = (line) => line.split(/[^0-9.]+/).map((t) => t.replace(/^\.+|\.+$/g, ''))
  .filter((t) => isIPv4(t) && !RESERVED.check(t, 'ipv4'));

// คำต้องห้ามจับทั้งคำ (ไม่จับกลางคำ เช่น "in" ใน "main") · ไม่สนตัวพิมพ์
const esc = (w) => String(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRes = (ws) => ws.filter(Boolean).map((w) => new RegExp(String.raw`(?<![\p{L}\p{N}_])${esc(w)}(?![\p{L}\p{N}_])`, 'iu'));

/** @returns {{rule:string, line:number}[]} — ไม่คืนค่าที่เจอ เพื่อไม่ให้ค่าลับไปโผล่ใน log */
export function scanText(text, { forbiddenWords = [] } = {}) {
  const hits = [];
  text.split(/\r?\n/).forEach((l, i) => {
    if (l.includes('secret-scan:allow')) return;
    for (const [rule, re] of RULES) if (re.test(l)) hits.push({ rule, line: i + 1 });
    if (publicIps(l).length) hits.push({ rule: 'public-ip', line: i + 1 });
    for (const re of wordRes(forbiddenWords)) if (re.test(l)) hits.push({ rule: 'forbidden-word', line: i + 1 });
  });
  return hits;
}

// ไฟล์ที่ห้ามเข้า git เลย ไม่ว่าเนื้อหาเป็นอะไร
const BANNED = [
  /(^|\/)\.env(?!\.example$)(\..+)?$/, /(^|\/)\.mcp\.json$/, /\.(pem|key|p12|pfx)$/i,
  /(^|\/)id_(rsa|ed25519|ecdsa)(\.pub)?$/, /^blueprint\.config\.json$/, /^memory\/(?!README\.md$)/, /^\.private\//,
  /(^|\/)\.claude\/settings\.local\.json$/,
];
export const bannedPath = (f) => BANNED.some((r) => r.test(f.replaceAll('\\', '/')));
