#!/usr/bin/env node
// new-project.mjs — สร้างโปรเจกต์ใหม่จาก blueprint (repo นี้ = ตัวหลัก · สร้างได้ไม่จำกัด)
//   node scripts/new-project.mjs <target-folder> [--name <project-name>]
// ทำ: คัดลอกไฟล์ที่ git track อยู่ (ไม่เอา .git, node_modules, memory, ผล build)
//     → ตั้งชื่อโปรเจกต์ · เริ่ม HANDOFF / memory ใหม่ · เขียน .blueprint.json (มาจากเวอร์ชันไหน) · git init + commit แรก
// ไม่ทำ: สร้าง remote · push · ติดตั้ง dependency
// exit: 0 = สร้างแล้ว · 2 = argument ผิด / เป้าหมายมีอยู่แล้ว / ตัวหลักมีไฟล์ค้างไม่ได้ commit
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// ของตัวหลักเอง ไม่ตามไปกับโปรเจกต์
const SKIP = [/^memory\/(?!README\.md$)/, /^scripts\/new-project\.mjs$/, /^(CHANGELOG|CONTRIBUTING|SECURITY)\.md$/,
  /^(LICENSE|NOTICE|VERSION)$/, /^docs\/(blueprint|onboarding)\.md$/,
  /^README\.en\.md$/, /^docs\/images\//, /^scripts\/readme-diagrams\.mjs$/];
const die = (m) => { console.error(`ERROR ${m}`); process.exit(2); };
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

const args = process.argv.slice(2);
const target = args[0];
if (!target || target.startsWith('--')) die('ใช้: node scripts/new-project.mjs <target-folder> [--name <project-name>]');
const ni = args.indexOf('--name');
const dest = path.resolve(target);
const name = (ni > 0 ? args[ni + 1] : path.basename(dest)) || '';
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) die(`ชื่อโปรเจกต์ต้องเป็น a-z 0-9 - : "${name}"`);
if (fs.existsSync(dest) && fs.readdirSync(dest).length) die(`เป้าหมายมีไฟล์อยู่แล้ว: ${dest}`);
if (git(['status', '--porcelain'], ROOT)) die('ตัวหลักมีไฟล์ยังไม่ได้ commit — commit ก่อน เพื่อให้รู้ว่าสร้างจากเวอร์ชันไหน');

const files = git(['ls-files'], ROOT).split('\n').filter((f) => f && !SKIP.some((r) => r.test(f)));
for (const f of files) {
  const to = path.join(dest, f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(ROOT, f), to);
}

const today = new Date().toISOString().slice(0, 10);
const edit = (f, fn) => { const p = path.join(dest, f); if (fs.existsSync(p)) fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
const pkg = JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8'));
pkg.name = name;
delete pkg.license; // โค้ดของโปรเจกต์เลือก license เอง
fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(dest, 'LICENSE-blueprint')); // ไฟล์ที่มาจาก blueprint
fs.writeFileSync(path.join(dest, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
edit('package-lock.json', (s) => s.replace(/"name": "engineering-blueprint"/g, `"name": "${name}"`)
  .replace(/("packages": \{\s*"": \{[^{}]*?)\s*"license": "Apache-2\.0",/, '$1'));
edit('AGENTS.md', (s) => s.replace(/^# .*$/m, `# ${name} — rules for every AI coding agent`)
  .split(/\r?\n/).filter((l) => !l.includes('<!-- blueprint-only -->')).join('\n'));
edit('README.md', () => `# ${name}\n\nกรอกต่อโปรเจกต์: ระบบนี้คืออะไร (1–2 ประโยค)\n\nสร้างจาก blueprint ${fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim()} · กติกาอยู่ \`AGENTS.md\` · สถานะ \`docs/HANDOFF.md\` · เริ่มงานแรกด้วย skill \`intake\`\n`);
fs.writeFileSync(path.join(dest, 'docs/HANDOFF.md'),
  `# HANDOFF — ▶ ตอนนี้\n\n> จบงานเมื่อไรให้อัปเดตไฟล์นี้\n\n## ▶ ตอนนี้ (${today})\n- **เสร็จ:** สร้างโปรเจกต์จาก blueprint\n- **ถัดไป:** รัน skill \`intake\` กับงานแรก → brief ผ่าน DoR\n- **รอ:** owner เล่างานแรก\n- **ใช้งานจริง:** ยังไม่มี\n`);
fs.copyFileSync(path.join(dest, 'templates/stack-decisions.md'), path.join(dest, 'docs/stack-decisions.md')); // ตอบให้ครบตอน intake
fs.mkdirSync(path.join(dest, 'memory'), { recursive: true });
fs.writeFileSync(path.join(dest, 'memory/MEMORY.md'), '# MEMORY — สารบัญ (1 บรรทัดต่อเรื่อง · เนื้อหาอยู่ในไฟล์ของมัน)\n');
fs.writeFileSync(path.join(dest, '.blueprint.json'), JSON.stringify({
  blueprint_version: fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim(),
  blueprint_commit: git(['rev-parse', 'HEAD'], ROOT),
  created: today,
}, null, 2) + '\n');

git(['init', '-q', '-b', 'main'], dest);
git(['config', 'core.hooksPath', '.githooks'], dest);
git(['add', '-A'], dest);
git(['-c', 'core.autocrlf=false', 'commit', '-q', '-m', `chore: start ${name} from blueprint`], dest);
console.log(`OK ${name} · ${files.length} files · ${dest}`);
console.log('ถัดไป: cd เข้า folder → npm install → เปิดด้วย agent แล้วบอกงานแรก (skill intake)');
