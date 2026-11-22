#!/usr/bin/env node
// cost-report.mjs — สรุป token และต้นทุนของงานจาก usage log ของ Claude Code (อ่านเฉพาะจำนวน token ไม่อ่านเนื้อหา ไม่ส่งออกเครื่อง)
//   node scripts/cost-report.mjs <session.jsonl> [--since 2026-01-31T09:00:00Z] [--until …] [--rate 33.8]
//   รวม sub-agent ใน <session>/subagents/*.jsonl ให้เอง · ราคาอยู่ใน blueprint.config.json → cost (ราคาเปลี่ยนได้ ตรวจก่อนใช้)
// exit: 0 = สำเร็จ · 2 = argument / ไฟล์ผิด
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './lib/config.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const log = args[0];
if (!log || log.startsWith('--') || !fs.existsSync(log)) { console.error('ใช้: node scripts/cost-report.mjs <session.jsonl> [--since ISO] [--until ISO] [--rate บาทต่อดอลลาร์]'); process.exit(2); }
const { prices = [], as_of = '?' } = loadConfig().cost || {};
const [since, until, rate] = [opt('--since') || '', opt('--until') || '9999', Number(opt('--rate')) || 0];

// prices: [{ match, in, out, cache_read, cache_write_5m, cache_write_1h, over?: { tokens, ...ราคาเมื่อ prompt ยาวกว่า } }] หน่วย USD ต่อ 1 ล้าน token
function usd(model, u) {
  const w1 = u.cache_creation?.ephemeral_1h_input_tokens || 0;
  const w5 = (u.cache_creation_input_tokens || 0) - w1;
  const [inp, out, read] = [u.input_tokens || 0, u.output_tokens || 0, u.cache_read_input_tokens || 0];
  let p = prices.find((x) => model.includes(x.match));
  if (p?.over && inp + read + w1 + w5 > p.over.tokens) p = { ...p, ...p.over };
  const cost = p ? (inp * p.in + out * p.out + read * p.cache_read + w5 * p.cache_write_5m + w1 * p.cache_write_1h) / 1e6 : NaN;
  return { fresh: inp + w1 + w5, read, out, cost };
}

function summarize(file, label) {
  const last = new Map(); // ข้อความเดียวเขียนลง log หลายบรรทัด เก็บบรรทัดล่าสุด
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    let j; try { j = JSON.parse(line); } catch { continue; }
    const m = j.message;
    if (j.type !== 'assistant' || !m?.usage || m.model === '<synthetic>' || j.timestamp < since || j.timestamp > until) continue;
    last.set(m.id, m);
  }
  const row = { label, models: new Set(), fresh: 0, read: 0, out: 0, cost: 0 };
  for (const m of last.values()) {
    const r = usd(m.model, m.usage);
    row.models.add(m.model); row.fresh += r.fresh; row.read += r.read; row.out += r.out; row.cost += r.cost;
  }
  return last.size ? row : null;
}

const rows = [summarize(log, 'session หลัก')];
const dir = path.join(log.replace(/\.jsonl$/, ''), 'subagents');
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith('.jsonl')) : []) {
  let name = f;
  try { name = JSON.parse(fs.readFileSync(path.join(dir, f.replace(/\.jsonl$/, '.meta.json')), 'utf8')).description || f; } catch { /* ไม่มี meta */ }
  rows.push(summarize(path.join(dir, f), name));
}
const list = rows.filter(Boolean).sort((a, b) => b.cost - a.cost);
const n = (x) => x.toLocaleString('en-US');
const money = (x) => (Number.isNaN(x) ? 'ไม่รู้ราคา' : x.toFixed(2));
const sum = (k) => list.reduce((s, r) => s + r[k], 0);
console.log(`ราคา ณ ${as_of} · มูลค่าเทียบราคา API ไม่ใช่บิลจริงถ้าใช้แพ็กเกจ\n`);
console.log('| งาน | model | token เข้า+เขียน cache | อ่าน cache | ออก | USD |\n|---|---|---|---|---|---|');
for (const r of list) console.log(`| ${r.label} | ${[...r.models].join(', ')} | ${n(r.fresh)} | ${n(r.read)} | ${n(r.out)} | ${money(r.cost)} |`);
console.log(`| **รวม** | | ${n(sum('fresh'))} | ${n(sum('read'))} | ${n(sum('out'))} | **${money(sum('cost'))}** |`);
if (rate) console.log(`\nประมาณ ${n(Math.round(sum('cost') * rate))} บาท (${rate} บาท/ดอลลาร์)`);
