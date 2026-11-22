#!/usr/bin/env node
// new-project.mjs — สร้างโปรเจกต์ใหม่จาก blueprint (repo นี้ = ตัวหลัก · สร้างได้ไม่จำกัด)
//   node scripts/new-project.mjs <target-folder> [--name <project-name>]
// ทำ: เขียนไฟล์ของ HEAD ที่โปรเจกต์ใช้ (ไม่เอา memory, ผล build, ไฟล์ของตัวหลักเอง — ดู scripts/lib/project-files.mjs)
//     → ตั้งชื่อโปรเจกต์ · เริ่ม HANDOFF / memory ใหม่ · เขียน .blueprint.json (มาจากเวอร์ชันไหน) · git init + commit แรก
// ไม่ทำ: สร้าง remote · push · ติดตั้ง dependency
// exit: 0 = สร้างแล้ว · 2 = argument ผิด / เป้าหมายมีอยู่แล้ว / ตัวหลักมีไฟล์ค้างไม่ได้ commit
import fs from 'node:fs';
import path from 'node:path';
import { helpIfAsked } from './lib/config.mjs';
import { git, projectFiles, versionAt } from './lib/project-files.mjs';

helpIfAsked(import.meta.url);

const die = (m) => { console.error(`ERROR ${m}`); process.exit(2); };
const args = process.argv.slice(2);
const target = args[0];
if (!target || target.startsWith('--')) die('ใช้: node scripts/new-project.mjs <target-folder> [--name <project-name>]');
const ni = args.indexOf('--name');
const dest = path.resolve(target);
const name = (ni > 0 ? args[ni + 1] : path.basename(dest)) || '';
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) die(`ชื่อโปรเจกต์ต้องเป็น a-z 0-9 - : "${name}"`);
if (fs.existsSync(dest) && fs.readdirSync(dest).length) die(`เป้าหมายมีไฟล์อยู่แล้ว: ${dest}`);
if (git(['status', '--porcelain'])) die('ตัวหลักมีไฟล์ยังไม่ได้ commit — commit ก่อน เพื่อให้รู้ว่าสร้างจากเวอร์ชันไหน');

const commit = git(['rev-parse', 'HEAD']).trim();
const today = new Date().toISOString().slice(0, 10);
const files = projectFiles(commit, name, today);
for (const [f, { data, exec }] of files) {
  const to = path.join(dest, f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, data, { mode: exec ? 0o755 : 0o644 });
}
fs.writeFileSync(path.join(dest, '.blueprint.json'), `${JSON.stringify({ blueprint_version: versionAt(commit), blueprint_commit: commit, created: today }, null, 2)}\n`);

git(['init', '-q', '-b', 'main'], dest);
git(['config', 'core.hooksPath', '.githooks'], dest);
git(['add', '-A'], dest);
git(['update-index', '--chmod=+x', ...[...files].filter(([, v]) => v.exec).map(([f]) => f)], dest); // Windows ไม่เก็บสิทธิ์รัน · ไม่มี = hook ไม่ทำงานบน Linux/macOS
git(['-c', 'core.autocrlf=false', 'commit', '-q', '-m', `chore: start ${name} from blueprint`], dest);
console.log(`OK ${name} · ${files.size} files · ${dest}`);
console.log('ถัดไป: cd เข้า folder → npm install → เปิดด้วย agent แล้วบอกงานแรก (skill intake)');
