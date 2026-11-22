// project-files.mjs — ไฟล์ที่โปรเจกต์ได้จาก blueprint ณ commit หนึ่ง (ใช้ร่วมกัน: new-project · upgrade-project)
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const BLUEPRINT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// ของตัวหลักเอง ไม่ตามไปกับโปรเจกต์
const SKIP = [/^memory\/(?!README\.md$)/, /^scripts\/(new-project|upgrade-project|readme-diagrams|lib\/project-files|test\/project\.test)\.mjs$/,
  /^(CHANGELOG|CONTRIBUTING|SECURITY)\.md$/, /^(LICENSE|NOTICE|VERSION)$/, /^docs\/(blueprint|onboarding)\.md$/, /^README\.en\.md$/, /^docs\/images\//];
// โปรเจกต์เป็นเจ้าของตั้งแต่วันแรก upgrade ไม่แตะ
const OWNED = ['README.md', 'docs/HANDOFF.md', 'docs/stack-decisions.md', 'memory/MEMORY.md', 'package-lock.json'];
export const isOwned = (f) => OWNED.includes(f) || /^site/.*.md$/.test(f); // หน้าคู่มือ = เนื้อหาของโปรเจกต์

export const git = (args, cwd = BLUEPRINT, encoding = 'utf8') => execFileSync('git', args, { cwd, encoding, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 200_000_000 });
export const versionAt = (commit) => git(['show', `${commit}:VERSION`]).trim();

/** @returns {Map<string, { data: Buffer, exec: boolean }>} path → เนื้อหาหลังปรับเป็นของโปรเจกต์ */
export function projectFiles(commit, name, today = new Date().toISOString().slice(0, 10)) {
  const out = new Map();
  for (const l of git(['ls-tree', '-r', '-z', commit]).split('\0').filter(Boolean)) {
    const [meta, f] = l.split('\t');
    const [mode, type, id] = meta.split(' ');
    if (type !== 'blob' || mode === '120000' || SKIP.some((r) => r.test(f))) continue;
    out.set(f, { data: git(['cat-file', 'blob', id], BLUEPRINT, 'buffer'), exec: mode === '100755' });
  }
  const set = (f, text) => out.set(f, { data: Buffer.from(text), exec: false });
  const edit = (f, fn) => { if (out.has(f)) set(f, fn(out.get(f).data.toString('utf8').replace(/\r\n/g, '\n'))); };
  edit('package.json', (s) => {
    const pkg = JSON.parse(s);
    pkg.name = name;
    delete pkg.license; // โค้ดของโปรเจกต์เลือก license เอง
    delete pkg.scripts?.['project:test'];
    return `${JSON.stringify(pkg, null, 2)}\n`;
  });
  edit('package-lock.json', (s) => s.replace(/"name": "engineering-blueprint"/g, `"name": "${name}"`)
    .replace(/("packages": \{\s*"": \{[^{}]*?)\s*"license": "Apache-2\.0",/, '$1'));
  edit('AGENTS.md', (s) => s.replace(/^# .*$/m, `# ${name} — rules for every AI coding agent`)
    .split('\n').filter((l) => !l.includes('<!-- blueprint-only -->')).join('\n'));
  set('README.md', `# ${name}\n\nกรอกต่อโปรเจกต์: ระบบนี้คืออะไร (1–2 ประโยค)\n\nสร้างจาก blueprint ${versionAt(commit)} · กติกาอยู่ \`AGENTS.md\` · สถานะ \`docs/HANDOFF.md\` · เริ่มงานแรกด้วย skill \`intake\`\n`);
  set('docs/HANDOFF.md', `# HANDOFF — ▶ ตอนนี้\n\n> จบงานเมื่อไรให้อัปเดตไฟล์นี้\n\n## ▶ ตอนนี้ (${today})\n- **เสร็จ:** สร้างโปรเจกต์จาก blueprint\n- **ถัดไป:** รัน skill \`intake\` กับงานแรก → brief ผ่าน DoR\n- **รอ:** owner เล่างานแรก\n- **ใช้งานจริง:** ยังไม่มี\n`);
  if (out.has('templates/stack-decisions.md')) out.set('docs/stack-decisions.md', out.get('templates/stack-decisions.md')); // ตอบให้ครบตอน intake
  set('memory/MEMORY.md', '# MEMORY — สารบัญ (1 บรรทัดต่อเรื่อง · เนื้อหาอยู่ในไฟล์ของมัน)\n');
  try { out.set('LICENSE-blueprint', { data: git(['show', `${commit}:LICENSE`], BLUEPRINT, 'buffer'), exec: false }); } catch { /* เวอร์ชันก่อนมี license */ }
  return out;
}
