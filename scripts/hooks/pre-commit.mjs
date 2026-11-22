#!/usr/bin/env node
// pre-commit.mjs — สแกนไฟล์ที่ stage ก่อน commit: ชื่อไฟล์ต้องห้าม · ค่าลับ · IP สาธารณะ · คำต้องห้าม (config)
//   (hook เรียกเอง)  node scripts/hooks/pre-commit.mjs
//   (CI / ตรวจทั้ง repo) node scripts/hooks/pre-commit.mjs --all
// exit: 0 = ผ่าน · 1 = เจอ (ห้ามเลี่ยงด้วย --no-verify · แก้ไฟล์ หรือถาม owner)
import { execFileSync } from 'node:child_process';
import { scanText, bannedPath } from '../lib/scan.mjs';
import { loadConfig, ROOT } from '../lib/config.mjs';

const all = process.argv.includes('--all');
const runOpts = { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 50_000_000, encoding: 'utf8' };
const git = (argv) => execFileSync('git', argv, runOpts);
const files = (all ? git(['ls-files']) : git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']))
  .split('\n').filter(Boolean);
const forbiddenWords = loadConfig().forbidden_words || [];

let bad = 0;
for (const f of files) {
  if (bannedPath(f)) { console.error(`FAIL ${f}: ไฟล์ประเภทนี้ห้ามเข้า git`); bad++; continue; }
  if (f === 'package-lock.json') continue; // hash ของ dependency ทำให้เตือนผิด
  let text;
  try { text = git(["show", `:${f}`]); } catch { continue; } // อ่านจาก index (= HEAD ใน CI)
  if (text.includes('\0')) continue; // ไฟล์ binary
  for (const h of scanText(text, { forbiddenWords })) { console.error(`FAIL ${f}:${h.line} ${h.rule}`); bad++; }
}
if (bad) { console.error(`\n${bad} จุด · commit ไม่ผ่าน (ดู docs/git.md §ค่าลับ)`); process.exit(1); }
console.log(`OK secret-scan · ${files.length} ไฟล์`);
