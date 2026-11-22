#!/usr/bin/env node
// commit-msg.mjs — บังคับ Conventional Commits 1.0: <type>(<scope>)?!?: <ข้อความ>
//   (hook เรียกเอง) node scripts/hooks/commit-msg.mjs <ไฟล์ข้อความ commit>
// exit: 0 = ผ่าน · 1 = รูปไม่ถูก
import fs from 'node:fs';

const TYPES = 'feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert';
const first = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).find((l) => l && !l.startsWith('#')) || '';
const ok = new RegExp(String.raw`^(${TYPES})(\([a-z0-9._/-]+\))?!?: \S.{0,99}$`).test(first)
  || /^(Merge|Revert) /.test(first) || /^(fixup|squash|amend)! /.test(first);
if (!ok) {
  console.error(`FAIL commit-msg: "${first}"
ต้องเป็น <type>(<scope>)?: <ข้อความ ≤ 100 ตัว> · type = ${TYPES.replace(/\|/g, ' ')}
ตัวอย่าง: feat(auth): add password reset · fix!: drop legacy endpoint (ดู docs/git.md)`);
  process.exit(1);
}
