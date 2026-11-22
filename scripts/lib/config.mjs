// config.mjs — อ่าน blueprint.config.json (ต่อโปรเจกต์) · ไม่มี → ใช้ค่าจาก blueprint.config.example.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function loadConfig() {
  for (const f of ['blueprint.config.json', 'blueprint.config.example.json']) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) return { ...JSON.parse(fs.readFileSync(p, 'utf8')), _file: f };
  }
  return { _file: null };
}
