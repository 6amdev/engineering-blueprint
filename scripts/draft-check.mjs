#!/usr/bin/env node
// draft-check.mjs — ตรวจร่างโพสต์ก่อนส่ง (scripts/board.mjs เรียกก่อนส่งทุกครั้ง)
//   node scripts/draft-check.mjs <draft.md>
// FAIL: ค่าลับ · IP สาธารณะ · คำต้องห้าม (config forbidden_words) · sha 40 ตัวที่ไม่มีใน repo
//       · ลายเซ็นท้ายโพสต์ไม่ตรง (config post_signature ถ้าตั้งไว้) · ข้อความที่ถือว่าความเงียบคือการอนุมัติ
// ไม่ได้ตรวจ: รูปแบบโพสต์ · ข้อมูลส่วนบุคคล · ความถูกต้องของเนื้อหา (คนอ่านเอง)
// exit: 0 = ผ่าน · 1 = ไม่ผ่าน · 2 = argument / ไฟล์ผิด
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { scanText } from './lib/scan.mjs';
import { loadConfig, ROOT } from './lib/config.mjs';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error('ใช้: node scripts/draft-check.mjs <draft.md>'); process.exit(2); }
const text = fs.readFileSync(file, 'utf8');
const cfg = loadConfig();
const fails = scanText(text, { forbiddenWords: cfg.forbidden_words || [] }).map((h) => `บรรทัด ${h.line}: ${h.rule}`);

for (const sha of new Set(text.match(/\b[0-9a-f]{40}\b/g) || [])) {
  try { execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd: ROOT, stdio: 'ignore' }); }
  catch { fails.push(`sha ${sha.slice(0, 8)}… ไม่มีใน repo นี้`); }
}
if (cfg.post_signature && !text.trimEnd().endsWith(cfg.post_signature)) fails.push('ลายเซ็นท้ายโพสต์ไม่ตรง config post_signature');
if (/ไม่ตอบ\s*=|no answer\s*=|ถ้าไม่ตอบ.*(จะ|ทำ)/i.test(text)) fails.push('ความเงียบไม่ใช่การอนุมัติ — ระบุคำถามและรอคำตอบ (AGENTS.md §7)');

if (fails.length) { console.error(`FAIL draft-check ${file}\n- ${fails.join('\n- ')}`); process.exit(1); }
console.log(`OK draft-check ${file}`);
