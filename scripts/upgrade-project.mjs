#!/usr/bin/env node
// upgrade-project.mjs — ดึงกติกา / skill / แม่แบบ / script เวอร์ชันใหม่จาก blueprint เข้าโปรเจกต์เดิม (รันจาก blueprint)
//   node scripts/upgrade-project.mjs <project-folder> [--apply] [--base <commit ของ blueprint>]
// เทียบ 3 ทาง: ไฟล์ตอนสร้าง (.blueprint.json) · ไฟล์ในโปรเจกต์ตอนนี้ · ไฟล์ใหม่ใน blueprint
//   โปรเจกต์ไม่ได้แก้ → ใช้ของใหม่ · แก้คนละจุด → รวมให้ · แก้จุดเดียวกัน → ไม่แตะไฟล์ วางของใหม่ไว้ที่ .blueprint-upgrade/ ให้คนรวม
// ไม่แตะ: README, HANDOFF, stack-decisions, memory, package-lock, หน้าคู่มือ site/ และไฟล์ที่ไม่ได้มาจาก blueprint · ไม่ commit ให้
// ไม่ใส่ --apply = แสดงรายการอย่างเดียว · exit: 0 = ได้ · 1 = มีไฟล์ที่ต้องรวมเอง · 2 = ใช้ผิด / ยังไม่พร้อม
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { helpIfAsked } from './lib/config.mjs';
import { BLUEPRINT, git, isOwned, projectFiles, versionAt } from './lib/project-files.mjs';

helpIfAsked(import.meta.url);

const die = (m) => { console.error(`ERROR ${m}`); process.exit(2); };
const USAGE = 'ใช้: node scripts/upgrade-project.mjs <project-folder> [--apply] [--base <commit>]';
const [target, ...rest] = process.argv.slice(2);
if (!target || target.startsWith('--')) die(USAGE);
let apply = false; let baseArg;
while (rest.length) { const a = rest.shift(); if (a === '--apply') apply = true; else if (a === '--base' && rest.length) baseArg = rest.shift(); else die(`ไม่รู้จัก ${a}\n${USAGE}`); }
const dest = path.resolve(target);
const read = (f) => { try { return fs.readFileSync(path.join(dest, f)); } catch { return null; } };
const json = (f) => { try { return JSON.parse(read(f)); } catch { return null; } };
const meta = json('.blueprint.json') ?? die(`${dest} ไม่มี .blueprint.json (ไม่ได้สร้างจาก blueprint)`);
const name = json('package.json')?.name ?? die(`${dest} ไม่มี package.json`);
if (meta.conflicts?.length) die(`รอบก่อนยังรวมไม่ครบ: ${meta.conflicts.join(', ')} · รวมแล้วลบ "conflicts" ใน .blueprint.json และ folder .blueprint-upgrade/`);
if (git(['status', '--porcelain'])) die('blueprint มีไฟล์ยังไม่ได้ commit');
if (apply && git(['status', '--porcelain'], dest)) die('โปรเจกต์มีไฟล์ยังไม่ได้ commit — commit ก่อน เพื่อถอยกลับได้');

const resolve = (c) => { try { return git(['rev-parse', '--verify', '-q', `${c}^{commit}`]).trim(); } catch { return die(`ไม่พบ commit ${c} ใน blueprint นี้ (git fetch ก่อน หรือระบุ --base)`); } };
const base = resolve(baseArg ?? meta.blueprint_commit);
const head = resolve('HEAD');
if (spawnSync('git', ['merge-base', '--is-ancestor', base, head], { cwd: BLUEPRINT }).status !== 0) die(`${base.slice(0, 7)} ไม่ใช่เวอร์ชันก่อนหน้าของ blueprint ตอนนี้ (${head.slice(0, 7)})`);

const lf = (b) => (b === null || b.includes(0) ? b : Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n')));
const same = (a, b) => (a === null || b === null ? a === b : a.equals(b));
const B = projectFiles(base, name);
const N = projectFiles(head, name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

function mergeText(ours, b, theirs) {
  const p = ['ours', 'base', 'theirs'].map((n, i) => { const f = path.join(tmp, n); fs.writeFileSync(f, [ours, b, theirs][i]); return f; });
  const r = spawnSync('git', ['merge-file', '-p', ...p], { maxBuffer: 200_000_000 });
  return r.status === 0 ? r.stdout : null;
}
// package.json: รวมทีละ key เพราะโปรเจกต์มักเพิ่ม scripts/dependencies ติดกัน
function mergePackage(ours, b, theirs) {
  let v;
  try { v = [ours, b, theirs].map((x) => JSON.parse(x)); } catch { return null; }
  const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
  let clash = false;
  const go = (x, y, z) => {
    const out = { ...x };
    for (const k of new Set([...Object.keys(y), ...Object.keys(z)])) {
      const [xs, ys, zs] = [x, y, z].map((o) => JSON.stringify(o[k]));
      if (ys === zs || xs === zs) continue;
      if (isObj(x[k]) && isObj(z[k])) out[k] = go(x[k], isObj(y[k]) ? y[k] : {}, z[k]);
      else if (xs !== ys) clash = true;
      else if (zs === undefined) delete out[k];
      else out[k] = z[k];
    }
    return out;
  };
  const merged = go(...v);
  return clash ? null : Buffer.from(`${JSON.stringify(merged, null, 2)}\n`);
}

const todo = { add: [], update: [], merge: [], remove: [] };
const conflicts = []; const kept = [];
const writes = new Map(); // path → Buffer หรือ null (ลบ)
for (const f of [...new Set([...B.keys(), ...N.keys()])].sort()) {
  if (isOwned(f)) continue;
  const n = N.get(f)?.data ?? null;
  const [bl, nl] = [lf(B.get(f)?.data ?? null), lf(n)];
  const st = fs.lstatSync(path.join(dest, f), { throwIfNoEntry: false });
  const p = st?.isFile() ? lf(read(f)) : null;
  if (same(bl, nl) || (p && same(p, nl))) continue;
  if (!st) { if (bl === null) { todo.add.push(f); writes.set(f, n); } else if (nl !== null) kept.push(`${f} (โปรเจกต์ลบไว้)`); continue; }
  if (nl === null) { if (p && same(p, bl)) { todo.remove.push(f); writes.set(f, null); } else kept.push(`${f} (blueprint เลิกใช้ แต่โปรเจกต์แก้ไว้)`); continue; }
  if (p && same(p, bl)) { todo.update.push(f); writes.set(f, n); continue; }
  const m = p && bl !== null && !p.includes(0) && !nl.includes(0) ? (f === 'package.json' ? mergePackage : mergeText)(p, bl, nl) : null;
  if (m === null) conflicts.push(f);
  else if (!same(lf(m), p)) { todo.merge.push(f); writes.set(f, m); }
}

const label = { add: 'เพิ่ม', update: 'แทนที่ (โปรเจกต์ไม่ได้แก้)', merge: 'รวมให้', remove: 'ลบ (โปรเจกต์ไม่ได้แก้)' };
console.log(`${name}: ${meta.blueprint_version} (${base.slice(0, 7)}) → ${versionAt(head)} (${head.slice(0, 7)})`);
for (const [k, list] of Object.entries(todo)) for (const f of list) console.log(`  ${label[k]}: ${f}`);
for (const f of kept) console.log(`  คงไว้: ${f}`);
for (const f of conflicts) console.log(`  ต้องรวมเอง: ${f}`);
if (!writes.size && !conflicts.length) console.log('  ไม่มีไฟล์ต้องเปลี่ยน');
if (!apply) { console.log('ยังไม่ได้แก้อะไร ใส่ --apply เพื่อทำจริง'); process.exit(conflicts.length ? 1 : 0); }

const put = (f, data) => {
  const to = path.join(dest, f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, data);
};
for (const [f, data] of writes) { if (data === null) fs.rmSync(path.join(dest, f)); else put(f, data); }
for (const f of conflicts) put(`.blueprint-upgrade/${f}`, N.get(f).data);
put('.blueprint.json', `${JSON.stringify({ ...meta, blueprint_version: versionAt(head), blueprint_commit: head, upgraded: new Date().toISOString().slice(0, 10), conflicts: conflicts.length ? conflicts : undefined }, null, 2)}\n`);
for (const [f, v] of N) if (v.exec && read(f)) { fs.chmodSync(path.join(dest, f), 0o755); git(['update-index', '--add', '--chmod=+x', f], dest); } // hook ไม่มีสิทธิ์รัน = ไม่ทำงานบน Linux/macOS
console.log(conflicts.length ? `เหลือ ${conflicts.length} ไฟล์ให้รวมจาก .blueprint-upgrade/ แล้วลบ "conflicts" ใน .blueprint.json` : 'OK เขียนแล้ว');
console.log('ถัดไป: git diff ดูก่อน → npm install → npm run gate:test → commit (chore: upgrade blueprint)');
process.exit(conflicts.length ? 1 : 0);
