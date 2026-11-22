// config.mjs — อ่าน blueprint.config.json (ต่อโปรเจกต์) · ไม่มี → ใช้ค่าจาก blueprint.config.example.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** --help: แสดงหัวไฟล์ของสคริปต์ที่เรียก */
export function helpIfAsked(url) {
  if (!process.argv.includes('--help') && !process.argv.includes('-h')) return;
  for (const l of fs.readFileSync(fileURLToPath(url), 'utf8').split(/\r?\n/).slice(1)) { if (!l.startsWith('//')) break; console.log(l.slice(3)); }
  process.exit(0);
}

export function loadConfig() {
  for (const f of ['blueprint.config.json', 'blueprint.config.example.json']) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) return { ...JSON.parse(fs.readFileSync(p, 'utf8')), _file: f };
  }
  return { _file: null };
}
