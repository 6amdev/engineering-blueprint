#!/usr/bin/env node
// board.mjs — โพสต์ / อ่านการ์ด ผ่าน adapter ที่เลือกใน blueprint.config.json → board.adapter
//   adapter: local (ค่าเริ่มต้น · การ์ด = ไฟล์ docs/cards/<card>.md) · trello · github (Issues ผ่าน gh CLI) · none (ไม่ผูก)
//   node scripts/board.mjs post <card> <draft.md>          # ค่าเริ่มต้น = dry-run: lint + แสดงว่าจะส่งอะไรไปไหน
//   node scripts/board.mjs post <card> <draft.md> --send   # ส่งจริง (ต้องผ่าน draft-check ก่อนเสมอ)
//   node scripts/board.mjs read <card> [--last 5]          # อ่านความเห็นล่าสุด (อ่านก่อนทวง / ก่อนตอบ)
//   node scripts/board.mjs new <card> "<title>" [--lane feature] [--risk R2]   # local เท่านั้น: สร้างการ์ดใหม่
// ผู้เขียน (local) = env BOARD_ROLE (ชื่อบทบาท ไม่ใช่ชื่อคน) · ไม่ตั้ง = "agent"
// ค่าลับอยู่ใน env เท่านั้น (ชื่อตัวแปรตั้งใน config) · ห้ามใส่ใน config หรือ URL
// exit: 0 = สำเร็จ · 1 = lint ไม่ผ่าน / ส่งไม่สำเร็จ / ไม่พบการ์ด · 2 = argument / config ผิด
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { loadConfig, ROOT } from './lib/config.mjs';

const die = (m, rc = 2) => { console.error(`ERROR ${m}`); process.exit(rc); };
const [cmd, card, ...rest] = process.argv.slice(2);
if (!['post', 'read', 'new'].includes(cmd) || !card) {
  die('ใช้: board.mjs post <card> <draft.md> [--send] · board.mjs read <card> [--last N] · board.mjs new <card> "<title>"');
}
const board = { adapter: 'local', ...loadConfig().board };
const send = rest.includes('--send');
const opt = (name, def) => { const i = rest.indexOf(name); return i >= 0 && rest[i + 1] ? rest[i + 1] : def; };
const last = Number(opt('--last', 5)) || 5;

const env = (name) => process.env[name] || die(`ไม่มี env ${name} (ตั้งในเครื่อง ห้ามเขียนลงไฟล์ใน repo)`);
// เรียก Trello REST: คีย์อยู่ใน header เท่านั้น (ไม่ใส่ใน URL เพราะ URL ติด log)
async function callTrello(id, resource, init = {}) {
  const names = { key_env: 'TRELLO_KEY', token_env: 'TRELLO_TOKEN', ...board.trello };
  const url = new URL(`/1/cards/${encodeURIComponent(id)}/${resource}`, 'https://api.trello.com');
  const pairs = { oauth_consumer_key: env(names.key_env), oauth_token: env(names.token_env) };
  const Authorization = `OAuth ${Object.entries(pairs).map(([k, v]) => `${k}="${v}"`).join(', ')}`;
  const res = await fetch(url, { ...init, headers: { Authorization } });
  return res.ok ? res.json() : die(`Trello ตอบ ${res.status}`, 1);
}
const ghRepo = () => board.github?.repo || die('ตั้ง board.github.repo ("owner/name") ใน blueprint.config.json');

// local: ไฟล์ต่อการ์ด · id ใช้ได้แค่ตัวอักษร/ตัวเลข/. _ - (กัน path traversal เช่น ../)
const LANES = ['feature', 'change', 'bug', 'hotfix', 'chore'];
const rel = (f) => path.relative(ROOT, f).replaceAll('\\', '/');
const cardFile = (id) => {
  if (!/^[A-Za-z0-9._-]+$/.test(id)) die(`card id "${id}" ไม่ถูกต้อง (ใช้ได้ A-Z a-z 0-9 . _ - เช่น C-0001)`);
  return path.join(ROOT, board.local?.dir || 'docs/cards', `${id}.md`);
};
const BLOCK = /\n---\n(?=### \d{4}-\d\d-\d\dT)/; // ตัวแบ่งความเห็น 1 ก้อน
const role = () => (process.env.BOARD_ROLE || 'agent').replace(/\s+/g, ' ').trim();
const localBlock = (text) => `\n---\n### ${new Date().toISOString()} · ${role()}\n\n${text.trimEnd()}\n`;

const adapters = {
  local: {
    post(id, text) {
      const f = cardFile(id);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      if (!fs.existsSync(f)) fs.writeFileSync(f, `# ${id}\n`);
      fs.appendFileSync(f, localBlock(text));
      console.log(`OK posted → ${rel(f)}`);
    },
    read(id) {
      const f = cardFile(id);
      if (!fs.existsSync(f)) die(`ไม่พบการ์ด ${rel(f)}`, 1);
      const blocks = fs.readFileSync(f, 'utf8').split(BLOCK).slice(1);
      if (!blocks.length) console.log(`(การ์ด ${id} ยังไม่มีความเห็น)`);
      for (const b of blocks.slice(-last)) console.log(`---\n${b.trimEnd()}\n`);
    },
    create(id, title) {
      const f = cardFile(id);
      if (fs.existsSync(f)) die(`มีการ์ด ${id} อยู่แล้ว`, 1);
      const lane = opt('--lane', 'feature');
      if (!LANES.includes(lane)) die(`lane "${lane}" ไม่รู้จัก (${LANES.join(' · ')})`);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, `# ${id} · ${title}\n\n- lane: ${lane}\n- R: ${opt('--risk', 'R?')}\n- status: intake\n- created: ${new Date().toISOString().slice(0, 10)}\n`);
      console.log(`OK created → ${rel(f)}`);
    },
  },
  none: {
    post: () => die('board.adapter = none · ไม่ได้ผูกบอร์ด (เลือก local / trello / github ใน blueprint.config.json)'),
    read: () => die('board.adapter = none · ไม่มีบอร์ดให้อ่าน'),
  },
  trello: {
    async post(id, text) {
      await callTrello(id, 'actions/comments', { method: 'POST', body: new URLSearchParams({ text }) });
      console.log(`OK posted → trello ${id}`);
    },
    async read(id) {
      const query = new URLSearchParams({ filter: 'commentCard', limit: last });
      for (const c of await callTrello(id, `actions?${query}`)) console.log(`--- ${c.date}\n${c.data.text}\n`);
    },
  },
  github: {
    post(id, _text, file) {
      const r = spawnSync('gh', ['issue', 'comment', id, '--repo', ghRepo(), '--body-file', file], { stdio: 'inherit' });
      if (r.status) die('gh issue comment ไม่สำเร็จ', 1);
    },
    read(id) {
      const out = execFileSync('gh', ['issue', 'view', id, '--repo', ghRepo(), '--json', 'comments'], { encoding: 'utf8' });
      for (const c of JSON.parse(out).comments.slice(-last)) console.log(`--- ${c.createdAt} · ${c.author?.login ?? '?'}\n${c.body}\n`);
    },
  },
};
const a = adapters[board.adapter] || die(`ไม่รู้จัก board.adapter "${board.adapter}" (${Object.keys(adapters).join(' · ')})`);

if (cmd === 'new') {
  if (!a.create) die(`board.adapter = ${board.adapter} · คำสั่ง new ใช้ได้กับ local เท่านั้น (บอร์ดอื่นสร้างการ์ดในบอร์ดนั้นเอง)`);
  const title = (rest[0] && !rest[0].startsWith('--') && rest[0]) || die('ต้องระบุชื่อการ์ด: board.mjs new <card> "<title>"');
  a.create(card, title);
} else if (cmd === 'read') await a.read(card);
else {
  const file = (rest[0] && !rest[0].startsWith('--') && rest[0]) || die('ต้องระบุไฟล์ร่างโพสต์');
  if (board.adapter === 'local') cardFile(card); // ตรวจ id ก่อน lint
  const lint = spawnSync(process.execPath, [path.join(ROOT, 'scripts/draft-check.mjs'), file], { stdio: 'inherit' });
  if (lint.status !== 0) die('draft-check ไม่ผ่าน · แก้ร่างแล้วลองใหม่ (ห้ามข้าม)', 1);
  const text = fs.readFileSync(file, 'utf8');
  if (!send) {
    console.log(`DRY RUN · adapter ${board.adapter} · card ${card} · ${text.length} ตัวอักษร · ส่งจริงเติม --send`);
    if (board.adapter === 'local') console.log(`จะต่อท้าย ${rel(cardFile(card))}:${localBlock(text)}`);
  } else await a.post(card, text, file);
}
