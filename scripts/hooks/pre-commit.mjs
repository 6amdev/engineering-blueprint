#!/usr/bin/env node
// pre-commit.mjs — สแกนไฟล์ที่ stage ก่อน commit: ชื่อไฟล์ต้องห้าม · ค่าลับ · IP สาธารณะ · คำต้องห้าม (config) · ด่านของการ์ด
//   (hook เรียกเอง)  node scripts/hooks/pre-commit.mjs
//   (CI / ตรวจทั้ง repo) node scripts/hooks/pre-commit.mjs --all
// exit: 0 = ผ่าน · 1 = เจอ (ห้ามเลี่ยงด้วย --no-verify · แก้ไฟล์ หรือถาม owner)
import { execFileSync } from 'node:child_process';
import { scanText, bannedPath } from '../lib/scan.mjs';
import { loadConfig, ROOT } from '../lib/config.mjs';
import { stagedProblems } from '../gate.mjs';

const all = process.argv.includes('--all');
const runOpts = { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 50_000_000, encoding: 'utf8' };
const git = (argv) => execFileSync('git', argv, runOpts);
const list = (argv) => git(argv).split('\0').filter(Boolean); // -z: ชื่อไฟล์ภาษาไทยไม่ถูกแปลงเป็นรหัส
const links = new Set(list(['ls-files', '-s', '-z']).filter((l) => l.startsWith('160000 ')).map((l) => l.split('\t')[1])); // submodule ไม่มีเนื้อหาใน repo นี้
const files = (all ? list(['ls-files', '-z']) : list(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRT'])).filter((f) => !links.has(f));
const forbiddenWords = loadConfig().forbidden_words || [];

let bad = 0; let gateBad = 0;
for (const f of files) {
  if (bannedPath(f)) { console.error(`FAIL ${f}: ไฟล์ประเภทนี้ห้ามเข้า git`); bad++; continue; }
  if (f === 'package-lock.json') continue; // hash ของ dependency ทำให้เตือนผิด
  let text;
  try { text = git(["show", `:${f}`]); } catch { console.error(`FAIL ${f}: อ่านไฟล์จาก git ไม่ได้ จึงตรวจไม่ได้`); bad++; continue; } // อ่านจาก index (= HEAD ใน CI)
  if (text.includes('\0')) continue; // ไฟล์ binary
  for (const h of scanText(text, { forbiddenWords })) { console.error(`FAIL ${f}:${h.line} ${h.rule}`); bad++; }
}
// ด่าน: การ์ดเปลี่ยนเป็น uat/deploy/release/close ต้องผ่าน gate · ไฟล์ด่านต่อท้ายได้อย่างเดียว
if (!all) for (const x of stagedProblems()) { console.error(`FAIL gate ${x}`); gateBad++; }
if (bad) console.error(`\n${bad} จุด · commit ไม่ผ่าน (ดู docs/git.md §ค่าลับ)`);
if (gateBad) console.error(`\nด่านยังไม่ครบ ${gateBad} ข้อ · commit ไม่ผ่าน (ดู docs/gates.md §บังคับด้วยสคริปต์ · node scripts/gate.mjs --help)`);
if (bad || gateBad) process.exit(1);
console.log(`OK secret-scan · ${files.length} ไฟล์`);
