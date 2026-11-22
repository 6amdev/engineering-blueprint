#!/usr/bin/env node
// gate.mjs — บันทึกผลด่านและคำอนุมัติของการ์ด แล้วตรวจว่าเดินต่อได้จริงไหม (hook pre-commit เรียกตอนการ์ดเปลี่ยนเป็น uat/deploy/release/close)
//   ไฟล์: docs/gates/<card>.jsonl — 1 บรรทัด = 1 เหตุการณ์ · ต่อท้ายอย่างเดียว
//   node scripts/gate.mjs open <card> --budget-usd <เพดาน> [--brief <ไฟล์> บังคับเฉพาะ lane feature] [--max-rounds 3] [--gates UI,A11Y] [--no-prod] [--adr docs/decisions/…] [--lane … --risk R2]
//   node scripts/gate.mjs add <card> <GATE> pass|fail|conditional --by <ผู้ตรวจ> --evidence "…" [--sha X] [--from sha-ที่ด่านนี้ตรวจไปแล้ว] [--mutations 6/6] [--owner … --due …] [--note …]
//     --by ตามด่าน: VERIFY test-engineer · SEC/PRIVACY/DEPS security-engineer · REGRESSION regression-tester · REVIEW lead-reviewer · UI/PERF/A11Y qa-engineer · OBS runbook-rehearsal · หรือบทบาทคน
//   node scripts/gate.mjs approve <card> <คำ> --role <บทบาท> --via card|chat|delegate [--sha X] [--note …] [--usd N] [--rounds N]
//   node scripts/gate.mjs raise <card> R2|R3                  # เพิ่มระดับเสี่ยง (ลดไม่ได้ เปิดการ์ดใหม่) · แล้วขอคำอนุมัติและตรวจด่านใหม่ตามระดับนั้น
//   node scripts/gate.mjs update <card> [--gates PRIVACY,DEPS] [--brief <ไฟล์>]   # เปิดด่านเพิ่มกลางทาง / brief เปลี่ยนชื่อ
//   node scripts/gate.mjs cost <card> <usd> [--note …]
//   node scripts/gate.mjs check <card> --stage uat|deploy|release|close
//   node scripts/gate.mjs audit <base>..<head>              # CI: ตรวจซ้ำทุก commit ในช่วง แบบเดียวกับ hook (จับ --no-verify, merge, revert)
// ขอบเขต: ตรวจความครบและความตรงกันของบันทึก · ไม่ยืนยันตัวตนผู้อนุมัติ ไม่รู้ว่าหลักฐานจริงแค่ไหน · revert / cherry-pick / merge ที่ไม่ชนกัน และ --no-verify ไม่ผ่าน hook (ให้ CI รัน audit)
// exit: 0 = ผ่าน · 1 = ไม่ผ่าน · 2 = argument / ไฟล์ผิด · 3 = บันทึกแล้วแต่เกินงบหรือเกินรอบ หยุดถาม Owner (ตอน check = 1)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { helpIfAsked, loadConfig, ROOT } from './lib/config.mjs';

const ALWAYS = ['VERIFY', 'SEC', 'REGRESSION', 'REVIEW'];
const OPTIONAL = ['UI', 'PERF', 'A11Y', 'PRIVACY', 'DEPS', 'OBS'];
const OWNER_OF = { VERIFY: 'test-engineer', SEC: 'security-engineer', REGRESSION: 'regression-tester', REVIEW: 'lead-reviewer', UI: 'qa-engineer', PERF: 'qa-engineer', A11Y: 'qa-engineer', PRIVACY: 'security-engineer', DEPS: 'security-engineer', OBS: 'runbook-rehearsal' };
const NO_CONDITIONAL = ['VERIFY', 'SEC', 'PRIVACY']; // docs/gates.md
const LANES = ['feature', 'change', 'bug', 'hotfix', 'chore'];
const ROLES = ['owner', 'owner-reviewer', 'dev', 'frontend', 'ops', 'second'];
// คำอนุมัติ → บทบาทที่ให้ได้
const WORDS = new Map(Object.entries({ 'ack-brief': ['owner'], 'ack-scope': ['owner-reviewer', 'owner'], go: ['owner-reviewer', 'owner'], gates: ['owner-reviewer'], uat: ['owner-reviewer'], accept: ['owner', 'owner-reviewer'], deploy: ['ops', 'owner-reviewer'], second: ['second'], risk: ['owner'], delegate: ['owner'], budget: ['owner'] }));
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
const PRIVACY_R3 = 'ด่าน PRIVACY (ข้อมูลส่วนบุคคล) ใช้กับ R3 เท่านั้น ขึ้นระดับก่อน (gate.mjs raise <card> R3)';
const STAGES = ['uat', 'deploy', 'release', 'close'];
const OTHER_STATUS = ['intake', 'requirements', 'spec', 'design', 'build', 'gates', 'blocked', 'rejected']; // ไม่ต้องผ่านด่าน

const gitRaw = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 200_000_000 });
const gitTry = (...a) => { try { return gitRaw(...a); } catch { return null; } };
const fullSha = (s) => gitTry('rev-parse', '--verify', `${s}^{commit}`)?.trim() || null;
export const gateFile = (card) => `docs/gates/${card}.jsonl`;
const validId = (id) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id || '');
const posix = (f) => path.posix.normalize(String(f).replaceAll('\\', '/')).replace(/\/$/, '');
// config อยู่ในเครื่อง ไม่ขึ้น git จึงเพิ่มที่อยู่ได้ แต่เลิกเฝ้า docs/cards ไม่ได้
const cardDirs = () => [...new Set(['docs/cards', posix(loadConfig().board?.local?.dir || 'docs/cards')])];

// --- โค้ด = ทุกไฟล์ ยกเว้นเอกสารและภาพประกอบ (โค้ดที่ซ่อนใน docs/ ยังนับเป็นโค้ด)
const isDoc = (f) => /\.md$/i.test(f) || /^(VERSION|NOTICE|LICENSE(-blueprint)?(\.txt)?)$/.test(f) || f.startsWith('memory/') || f === 'site/.vitepress/config.mjs' /* เมนูคู่มือ แก้หลังด่านได้ */ || /^docs\/gates\/[^/]+\.jsonl$/.test(f)
  || (/^(docs|site|templates|\.claude)\//.test(f) && /\.(png|jpe?g|gif|svg|webp|pdf|txt)$/i.test(f));
const hashOf = (rows) => createHash('sha256').update(rows.filter(([f]) => !isDoc(f)).map(([f, id]) => `${f}\0${id}`).sort().join('\n')).digest('hex').slice(0, 40);
const codeOfCommit = (sha) => { const t = gitTry('ls-tree', '-r', '-z', sha); return t === null ? null : hashOf(t.split('\0').filter(Boolean).map((l) => { const [meta, f] = l.split('\t'); const [mode, , id] = meta.split(' '); return [f, `${mode} ${id}`]; })); };
const codeOfIndex = () => hashOf(gitRaw('ls-files', '-s', '-z').split('\0').filter(Boolean).map((l) => { const [meta, f] = l.split('\t'); const [mode, id] = meta.split(' '); return [f, `${mode} ${id}`]; }));
const dirtyCode = () => [...gitRaw('diff', '--name-only', '--no-renames', '--ignore-submodules=none', '-z').split('\0'), ...gitRaw('ls-files', '--others', '--exclude-standard', '-z').split('\0')].filter((f) => f && !isDoc(f));
// null = มีโค้ดที่ยังไม่ stage/track (ใช้เฉพาะตอนไม่ได้อยู่ใน hook)
const currentCode = (staged) => (!staged && dirtyCode().length ? null : codeOfIndex());

const readText = (file, staged) => {
  const t = staged ? gitTry('show', `:${file}`) : (() => { try { return fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch { return null; } })();
  return t === null ? null : t.replace(/^﻿/, '').replace(/\r/g, '');
};
function parseCard(text) {
  const head = (text ?? '').split(/\n---\n/)[0].replace(/<!--(?:-?>|[\s\S]*?-->)/g, '');
  const all = (k) => [...head.matchAll(new RegExp(`^[^\\S\\n]*[-*+][^\\S\\n]*\\**${k}\\**[^\\S\\n]*[:：]\\**[^\\S\\n]*(.*?)[^\\S\\n]*$`, 'gmi'))].map((m) => m[1]);
  const dup = ['lane', 'R', 'status'].filter((k) => all(k).length > 1);
  return { exists: text !== null && text !== undefined, lane: all('lane')[0] ?? null, risk: all('R')[0] ?? null, status: all('status')[0]?.toLowerCase() || null, dup };
}
const cardInfo = (card, staged) => parseCard(cardDirs().map((d) => readText(`${d}/${card}.md`, staged)).find((t) => t !== null) ?? null);

// --- รูปของแต่ละบรรทัด (กันบรรทัดที่เขียนมือผิดรูป)
const str = (v, min = 1) => typeof v === 'string' && v.trim().length >= min;
const pos = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const sha = (v) => typeof v === 'string' && /^[0-9a-f]{40}$/.test(v);
const opt = (v, f) => v === undefined || f(v);
const ADR = /^docs\/decisions\/(?!0000-|readme\.md$)[^/]+\.md$/i; // ไม่ใช่แม่แบบ
const SHAPE = {
  open: (e) => LANES.includes(e.lane) && /^R[123]$/.test(e.risk) && Array.isArray(e.gates) && e.gates.every((g) => OPTIONAL.includes(g)) && typeof e.prod === 'boolean' && pos(e.budget_usd) && pos(e.max_rounds)
    && opt(e.brief, str) && opt(e.adr, (a) => ADR.test(a)),
  gate: (e) => Object.hasOwn(OWNER_OF, e.gate) && ['pass', 'fail', 'conditional'].includes(e.result) && sha(e.sha) && sha(e.code) && opt(e.from, sha) && opt(e.from_code, sha) && (e.by === OWNER_OF[e.gate] || ROLES.includes(e.by)) && str(e.evidence, 10)
    && !(e.result === 'conditional' && (NO_CONDITIONAL.includes(e.gate) || !str(e.owner) || !str(e.due))) && opt(e.mutations, (m) => /^\d+\/\d+$/.test(m)) && opt(e.note, str),
  approve: (e) => WORDS.has(e.word) && [...ROLES, 'agent'].includes(e.role) && ['card', 'chat', 'delegate'].includes(e.via) && sha(e.sha) && sha(e.code) && opt(e.usd, pos) && opt(e.rounds, pos) && opt(e.note, str),
  raise: (e) => /^R[23]$/.test(e.risk),
  update: (e) => opt(e.gates, (g) => Array.isArray(g) && g.every((x) => OPTIONAL.includes(x))) && opt(e.brief, str) && (e.gates ?? e.brief) !== undefined,
  cost: (e) => pos(e.usd) && opt(e.note, str),
};
function parse(text, name) {
  const ev = []; const bad = [];
  (text ?? '').split('\n').forEach((l, i) => {
    if (!l.trim()) return;
    let e; try { e = JSON.parse(l); } catch { /* ด้านล่าง */ }
    if (e && typeof e === 'object' && Object.hasOwn(SHAPE, e.t) && str(e.at) && SHAPE[e.t](e)) ev.push({ ...e, i: ev.length }); else bad.push(`${name}:${i + 1} รูปแบบผิด (ใช้ gate.mjs เขียน อย่าเขียนมือ)`);
  });
  if (!bad.length && (ev[0]?.t !== 'open' || ev.filter((e) => e.t === 'open').length !== 1)) bad.push(`${name} ต้องเริ่มด้วย open 1 ครั้ง`);
  return { ev, bad };
}
/** ระดับ R ที่ใช้อยู่ตอนเหตุการณ์ลำดับ i (คำอนุมัติเก่าตัดสินด้วยระดับตอนนั้น) */
const riskAt = (ev, i) => ev.filter((e) => e.t === 'raise' && e.i < i).reduce((v, e) => (e.risk > v ? e.risk : v), ev[0]?.risk ?? 'R3');
const sumUsd = (ev) => Math.round(ev.filter((e) => e.t === 'cost').reduce((s, e) => s + e.usd, 0) * 1e6) / 1e6; // กันเศษทศนิยมของ float
function load(card, staged) {
  const text = readText(gateFile(card), staged);
  if (text === null) return null;
  const r = parse(text, gateFile(card));
  const o = r.ev[0];
  if (!o) return { ...r, o };
  const risk = riskAt(r.ev, Infinity);
  const brief = r.ev.filter((e) => e.t === 'update' && e.brief).at(-1)?.brief ?? o.brief;
  const gates = [...new Set([...(o.gates ?? []), ...r.ev.filter((e) => e.t === 'update').flatMap((e) => e.gates ?? [])])];
  return { ...r, o: { ...o, risk, brief, gates, raised: r.ev.findLastIndex((e) => e.t === 'raise') } };
}

function budgetState({ ev, o }) {
  const raise = ev.filter((e) => e.t === 'approve' && e.word === 'budget' && e.role === 'owner');
  const limitUsd = raise.reduce((v, e) => e.usd ?? v, o.budget_usd);
  const limitRounds = raise.reduce((v, e) => e.rounds ?? v, o.max_rounds);
  const spent = sumUsd(ev);
  const rounds = new Set(ev.filter((e) => e.t === 'gate' && e.result === 'fail').map((e) => e.code)).size; // 1 รอบ = 1 เวอร์ชันของโค้ดที่มีด่านไม่ผ่าน
  const over = [];
  if (spent > limitUsd) over.push(`เกินงบ: ใช้ ${spent.toFixed(2)} จาก ${limitUsd} USD`);
  if (rounds > limitRounds) over.push(`เกินจำนวนรอบในงบ: ไม่ผ่าน ${rounds} รอบ จาก ${limitRounds}`);
  return over;
}
function budgetWarning({ ev, o }) {
  const limit = ev.filter((e) => e.t === 'approve' && e.word === 'budget' && e.role === 'owner').reduce((v, e) => e.usd ?? v, o.budget_usd);
  const spent = sumUsd(ev);
  return spent >= limit * 0.8 && spent <= limit ? `ใช้ไป ${spent.toFixed(2)} จาก ${limit} USD (เกิน 80%) ประเมินก่อนเปิดงานเพิ่ม กันไว้ปิดงานราว 10%` : null;
}

/** @returns {string[]} ข้อที่ยังไม่ครบ (ว่าง = ผ่าน) */
export function evaluate(card, stage, { staged = false } = {}) {
  const data = load(card, staged);
  if (!data) return [`ไม่มี ${gateFile(card)} (เริ่มด้วย node scripts/gate.mjs open ${card} …)`];
  if (data.bad.length) return data.bad;
  const { ev, o } = data;
  const { lane, risk } = o;
  const info = cardInfo(card, staged);
  const p = [];
  if (info.dup.length) p.push(`หัวการ์ดมี ${info.dup.join(', ')} มากกว่า 1 บรรทัด`);
  if (info.exists && (info.lane !== lane || info.risk !== risk)) p.push(`lane/R ในบันทึก (${lane} ${risk}) ไม่ตรงกับการ์ด (${info.lane} ${info.risk})`);
  if (!o.prod && ['deploy', 'release'].includes(stage)) p.push('การ์ดเปิดแบบ --no-prod ไปขั้น deploy/release ไม่ได้ (จบที่ close)');
  const code = currentCode(staged);
  const now = (e) => code !== null && e.code === code;
  if (code === null) p.push(`มีโค้ดเปลี่ยนที่ยังไม่ commit: ${dirtyCode().slice(0, 3).join(', ')}`);
  const approvals = ev.filter((e) => e.t === 'approve');
  const has = (word, role) => approvals.filter((e) => e.word === word && (!role || e.role === role));

  // --- ด่าน
  const recorded = ev.filter((e) => e.t === 'gate').map((e) => e.gate); // มีผลแล้ว = เปิดแล้ว ทิ้งผลที่ไม่ผ่านไม่ได้
  const need = [...new Set([...(lane === 'hotfix' ? ['VERIFY', 'REVIEW', ...(risk === 'R3' ? ['SEC'] : [])] : ALWAYS), ...o.gates, ...recorded])];
  if (need.includes('PRIVACY') && risk !== 'R3') p.push(PRIVACY_R3);
  let lastGate = -1;
  for (const g of need) {
    const list = ev.filter((e) => e.t === 'gate' && e.gate === g);
    const last = list.at(-1);
    if (!last) { p.push(`ด่าน ${g} ยังไม่มีผล`); continue; }
    lastGate = Math.max(lastGate, last.i);
    if (last.result === 'fail') { p.push(`ด่าน ${g} ไม่ผ่าน`); continue; }
    if (code !== null && !now(last)) p.push(`ด่าน ${g}: โค้ดเปลี่ยนหลังตรวจ (ตรวจที่ ${last.sha.slice(0, 7)})`);
    // ไล่ from ย้อนกลับไปจนถึงครั้งที่ตรวจเต็ม
    let cur = last; let k = list.length - 1; const chain = [last];
    while (cur?.from) { const { from, from_code: fromCode } = cur; k -= 1; while (k >= 0 && list[k].sha !== from && !(fromCode && list[k].code === fromCode)) k -= 1; cur = list[k]; if (cur) chain.push(cur); } // ครั้งก่อนหน้าไม่ผ่านก็ได้ ถ้าเป็นการตรวจเต็ม แล้วครั้งนี้ตรวจส่วนที่แก้
    if (!cur) p.push(`ด่าน ${g}: ตรวจเฉพาะส่วนที่เปลี่ยน แต่ไม่มีครั้งที่ตรวจเต็มก่อนหน้า`);
    if (cur && cur.i < o.raised) p.push(`ด่าน ${g}: ตรวจเต็มก่อนขึ้นเป็น ${risk} ต้องตรวจใหม่ตามระดับนี้`);
    if (risk === 'R3' && last.from) p.push(`ด่าน ${g}: R3 ต้องตรวจเต็มที่โค้ดล่าสุด`);
    if (chain.some((e) => e.result !== 'fail' && e.mutations && e.mutations.split('/')[0] !== e.mutations.split('/')[1])) p.push(`ด่าน ${g}: บั๊กลองมีตัวที่เทสจับไม่ได้`);
    if (g === 'VERIFY' && risk !== 'R1') {
      const [k1, k2] = String(cur?.mutations ?? '').split('/').map(Number);
      if (!(k2 >= 5 && k1 === k2)) p.push('ด่าน VERIFY: บั๊กลองต้องมีอย่างน้อย 5 แบบและเทสจับได้ครบทุกแบบ');
    }
  }

  // --- คำอนุมัติ
  // ขึ้น R กลางทาง = ขอคำอนุมัติของระดับใหม่หลังจากนั้น ก่อนผลด่านแรกของรอบใหม่
  const firstGate = ev.findIndex((e) => e.t === 'gate' && e.i > o.raised);
  const beforeGates = (word) => has(word).some((e) => e.i > o.raised && (firstGate < 0 || e.i < firstGate));
  const pre = risk === 'R3' ? ['ack-brief', 'ack-scope', 'go'] : ['feature', 'change'].includes(lane) ? ['go'] : [];
  if (!(risk === 'R1' && o.adr && readText(o.adr, staged) !== null)) for (const w of pre) if (!beforeGates(w)) p.push(`ไม่มีคำอนุมัติ ${w} ก่อนผลด่านแรก${o.raised >= 0 ? ` หลังขึ้นเป็น ${risk}` : ''}`);
  if (stage !== 'uat') {
    const find = (word, role, after = lastGate) => has(word, role).find((e) => now(e) && e.i > after);
    const onNow = (word, role) => !!find(word, role);
    for (const w of risk === 'R3' ? ['gates', 'uat'] : ['accept']) if (!onNow(w)) p.push(`ไม่มีคำอนุมัติ ${w} บนโค้ดปัจจุบันหลังผลด่านล่าสุด`);
    if (risk === 'R3' && !onNow('second') && !onNow('risk')) p.push('R3 ต้องมีคนที่สองอนุมัติ (second) หรือ Owner บันทึกรับความเสี่ยง (risk) บนโค้ดปัจจุบันหลังผลด่านล่าสุด');
    // deploy มาหลัง UAT/ตรวจรับผ่านแล้ว (docs/gates.md §DEP)
    const ready = (risk === 'R3' ? [find('gates'), find('uat'), find('second') ?? find('risk')] : [find('accept')]).reduce((m, e) => Math.max(m, e?.i ?? lastGate), lastGate);
    if (stage !== 'deploy' && o.prod) for (const role of risk === 'R1' ? ['ops'] : ['ops', 'owner-reviewer']) if (!find('deploy', role, ready)) p.push(`ไม่มีคำอนุมัติ deploy จาก ${role} บนโค้ดปัจจุบัน หลังตรวจรับ`);
    if (stage === 'close' && !ev.some((e) => e.t === 'cost')) p.push(`ยังไม่ได้บันทึกต้นทุน (gate.mjs cost ${card} <usd>)`);
  }
  for (const e of approvals) { const why = approvalProblem(e, { ...o, risk: riskAt(ev, e.i) }, approvals); if (why) p.push(`คำอนุมัติ ${e.word}: ${why}`); }
  p.push(...openQuestions(o, staged));
  return [...p, ...budgetState(data)];
}

// ช่องที่ยังไม่ตอบใน brief / stack (feature ต้องครบก่อน go)
function openQuestions(o, staged) {
  if (o.lane !== 'feature') return [];
  return [o.brief, 'docs/stack-decisions.md'].flatMap((f) => {
    const text = f && readText(f, staged);
    if (!text) return [`ไม่พบ ${f || 'brief (--brief)'}`];
    if (!/^[^#>\s].*\S/m.test(text)) return [`${f} ยังว่าง`];
    const n = text.split('\n').filter((l) => !l.startsWith('>') && (/❓|<(\.\.\.|…)>|<[^<>]*[\u0E01-\u0E4E][^<>]*>/.test(l.replace(/`[^`]*`/g, '')) || (f !== o.brief && /^\|[^|]*\|[^|]*\|\s*\|[^|]*\|[^|]*\|/.test(l)))).length;
    return n ? [`${f} ยังมีข้อที่ไม่ได้ตอบ ${n} บรรทัด (❓ · <ช่องแม่แบบ> · คำตอบว่าง)`] : [];
  });
}

function approvalProblem(e, o, approvals) {
  if (e.role === 'agent') {
    if (e.word !== 'accept' || e.via !== 'delegate') return 'agent อนุมัติแทนคนไม่ได้';
    const given = approvals.some((a) => a.word === 'delegate' && a.role === 'owner' && a.i < e.i);
    return given && o.risk !== 'R3' && !o.prod ? null : 'agent ตรวจรับแทนได้เมื่อ Owner มอบอำนาจไว้ก่อน และเป็น R1/R2 ที่ไม่ขึ้น prod';
  }
  if (!WORDS.get(e.word).includes(e.role)) return `บทบาท ${e.role} ให้คำนี้ไม่ได้`;
  if (e.via === 'delegate') return 'via delegate ใช้กับ agent เท่านั้น';
  if (e.via === 'chat' && o.risk === 'R3' && !['budget', 'delegate'].includes(e.word)) return 'R3 ต้องยืนยันเองบนการ์ด แชตไม่นับ';
  if (e.via === 'chat' && e.word === 'deploy') return 'deploy ต้องยืนยันเองบนการ์ด แชตไม่นับ';
  if (e.word === 'delegate' && (o.risk === 'R3' || o.prod)) return 'มอบอำนาจได้เฉพาะ R1/R2 ที่ไม่ขึ้น prod';
  return null;
}

/** สำหรับ hook: ไฟล์ด่านต่อท้ายได้อย่างเดียวและถูกรูป · การ์ดเปลี่ยนสถานะต้องผ่าน · R ลดไม่ได้ */
export function stagedProblems(base = fullSha('HEAD') ?? EMPTY_TREE, others = [fullSha('MERGE_HEAD')].filter(Boolean)) {
  const out = [];
  const files = gitRaw('diff', '--cached', '--name-only', '--no-renames', '-z', base).split('\0').filter(Boolean);
  const dirs = cardDirs();
  const isLink = (f) => /^120000 /.test(gitTry('ls-files', '-s', '--', `:(literal)${f}`) ?? '');
  // merge: บันทึกด่านของอีกฝั่งต้องอยู่ครบทุกบรรทัด
  for (const o of others) for (const f of (gitTry('ls-tree', '-r', '--name-only', '-z', o, 'docs/gates/') ?? '').split('\0').filter((x) => x.endsWith('.jsonl'))) {
    const have = new Set((readText(f, true) ?? '').split('\n').map((l) => l.trim()));
    if (gitRaw('show', `${o}:${f}`).replace(/^\uFEFF/, '').split('\n').some((l) => l.trim() && !have.has(l.trim()))) out.push(`${f}: merge แล้วบันทึกของอีกฝั่งหาย ต้องเก็บครบทุกบรรทัด`);
  }
  for (const f of files) {
    const low = f.toLowerCase();
    if (low.startsWith('docs/gates/') && low.endsWith('.jsonl')) {
      const text = readText(f, true);
      const old = gitTry('show', `${base}:${f}`)?.replace(/^\uFEFF/, '').replace(/\r/g, '').trimEnd() ?? null;
      if (old !== null && text?.trimEnd() !== old && !text?.startsWith(`${old}\n`)) out.push(`${f}: แก้ ลบ หรือย้ายบันทึกเดิมไม่ได้ ต่อท้ายได้อย่างเดียว`);
      else if (!/^docs\/gates\/[A-Za-z0-9][A-Za-z0-9._-]*\.jsonl$/.test(f)) out.push(`${f}: ชื่อหรือที่อยู่ไฟล์ด่านผิด`);
      else if (isLink(f)) out.push(`${f}: ต้องเป็นไฟล์จริง ไม่ใช่ symlink`);
      else if (text !== null) out.push(...parse(text, f).bad);
    }
    if (dirs.some((d) => low.startsWith(`${d.toLowerCase()}/`)) && low.endsWith('.md') && path.posix.basename(low) !== 'readme.md') {
      const text = readText(f, true);
      const id = path.posix.basename(f).replace(/\.md$/i, '');
      const before = parseCard(gitTry('show', `${base}:${f}`)?.replace(/^\uFEFF/, '').replace(/\r/g, ''));
      if (text === null) {
        if (before.status && !dirs.some((d) => readText(`${d}/${id}.md`, true) !== null)) out.push(`${id}: ลบหรือย้ายการ์ดออกไม่ได้ (ไม่ทำแล้วใช้ status: rejected)`);
        continue;
      }
      if (!dirs.some((d) => f === `${d}/${id}.md`) || !validId(id)) { out.push(`${f}: การ์ดต้องอยู่ที่ ${dirs.join(' หรือ ')}/<id>.md และ id เป็น A-Z a-z 0-9 . _ -`); continue; }
      if (isLink(f)) { out.push(`${f}: ต้องเป็นไฟล์จริง ไม่ใช่ symlink`); continue; }
      const info = parseCard(text);
      if (info.status === null && (info.lane || info.risk || before.status)) out.push(`${id}: ไม่พบ "- status: <ขั้น>" ในหัวการ์ด (ก่อน --- แรก)`);
      if (info.dup.length) out.push(`${id}: หัวการ์ดมี ${info.dup.join(', ')} มากกว่า 1 บรรทัด`);
      if (info.status !== null && !STAGES.includes(info.status) && !OTHER_STATUS.includes(info.status)) out.push(`${id}: status "${info.status}" ไม่รู้จัก (docs/cards/README.md)`);
      if (/^R[123]$/.test(before.risk ?? '') && (!/^R[123]$/.test(info.risk ?? '') || info.risk < before.risk)) out.push(`${id}: ลดระดับ ${before.risk} → ${info.risk} ไม่ได้ (เปิดการ์ดใหม่)`);
      if (before.lane && before.lane !== info.lane && readText(gateFile(id), true) !== null) out.push(`${id}: เปลี่ยน lane หลัง open ไม่ได้ (เปิดการ์ดใหม่)`);
      if (STAGES.includes(info.status) && info.status !== before.status) out.push(...evaluate(id, info.status, { staged: true }).map((x) => `${id} → ${info.status}: ${x}`));
    }
  }
  return out;
}

/** ตรวจทุก commit ในช่วง: อ่าน commit เข้า index ชั่วคราว แล้วใช้กติกาเดียวกับ hook เทียบ parent แรก */
export function auditProblems(range) {
  const [base, head] = range.split('..');
  const commits = gitRaw('rev-list', '--reverse', '--topo-order', /^0+$/.test(base) ? head : range) // branch ใหม่: GitHub ส่ง base เป็น 000…
   .split('\n').filter(Boolean);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-audit-'));
  const keep = process.env.GIT_INDEX_FILE;
  const out = [];
  try {
    process.env.GIT_INDEX_FILE = path.join(tmp, 'index');
    for (const c of commits) {
      gitRaw('read-tree', c);
      const parent = fullSha(`${c}^1`) ?? EMPTY_TREE;
      out.push(...stagedProblems(parent, gitRaw('rev-parse', `${c}^@`).split('\n').filter(Boolean).slice(1)).map((x) => `${c.slice(0, 7)} ${x}`));
    }
  } finally {
    if (keep === undefined) delete process.env.GIT_INDEX_FILE; else process.env.GIT_INDEX_FILE = keep;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return { out, count: commits.length };
}

function main() {
  const die = (m, rc = 2) => { console.error(`ERROR ${m}`); process.exit(rc); };
  helpIfAsked(import.meta.url);
  const [cmd, card, ...argv] = process.argv.slice(2);
  if (cmd === 'audit') {
    let r;
    try { r = auditProblems(/^\w[\w./~^-]*\.\.\w[\w./~^-]*$/.test(card ?? '') ? card : die('ใช้: gate.mjs audit <base>..<head>')); } catch { die(`อ่านช่วง ${card} ไม่ได้ (CI ต้อง checkout ทั้งประวัติ fetch-depth: 0)`); }
    if (r.out.length) { console.error(`FAIL audit ${card}\n- ${r.out.join('\n- ')}`); process.exit(1); }
    console.log(`OK audit ${card} · ${r.count} commit`);
    return;
  }
  const ALLOWED = { open: ['brief', 'budget-usd', 'max-rounds', 'gates', 'no-prod', 'adr', 'lane', 'risk'], add: ['by', 'evidence', 'sha', 'from', 'mutations', 'owner', 'due', 'note'], approve: ['role', 'via', 'sha', 'note', 'usd', 'rounds'], raise: [], update: ['gates', 'brief'], cost: ['note'], check: ['stage'] };
  if (!Object.hasOwn(ALLOWED, cmd ?? '')) die('ใช้: gate.mjs open|add|approve|raise|update|cost|check <card> … หรือ audit <base>..<head> (รายละเอียด: --help)');
  if (!validId(card)) die(`card id "${card}" ไม่ถูกต้อง`);
  const rest = []; const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const n = argv[i].startsWith('--') ? argv[i].slice(2) : null;
    if (n === null) { rest.push(argv[i]); continue; }
    if (!ALLOWED[cmd].includes(n)) die(`ไม่รู้จักตัวเลือก --${n}`);
    if (Object.hasOwn(opts, n)) die(`ใส่ --${n} ซ้ำ`);
    if (n === 'no-prod') { opts[n] = true; continue; }
    const v = argv[i + 1];
    if (!v?.trim() || (v.startsWith('--') && ALLOWED[cmd].includes(v.slice(2)))) die(`--${n} ต้องมีค่า`);
    opts[n] = v; i += 1;
  }
  const val = (n) => opts[n];
  const file = (n) => val(n) && posix(val(n));
  const gateList = () => (val('gates') ?? '').split(',').map((g) => g.trim().toUpperCase().replace(/^GATE-/, '')).filter(Boolean)
    .map((g) => (OPTIONAL.includes(g) ? g : die(`--gates: ไม่รู้จัก ${g} (เลือกได้ ${OPTIONAL.join(' ')} · ด่านเสมอเปิดให้เอง)`)));
  const num = (n, v) => { const x = Number(v); if (!pos(x)) die(`--${n} ต้องเป็นตัวเลขมากกว่า 0`); return x; };

  if (cmd === 'check') {
    const stage = val('stage');
    if (!STAGES.includes(stage)) die(`--stage ต้องเป็น ${STAGES.join(' | ')}`);
    const problems = evaluate(card, stage);
    if (problems.length) { console.error(`FAIL gate ${card} → ${stage}\n- ${problems.join('\n- ')}`); process.exit(1); }
    console.log(`OK gate ${card} → ${stage}`);
    return;
  }
  const data = load(card, false);
  if (data?.bad.length) die(data.bad.join('\n'), 1);
  if (cmd !== 'open' && !data) die(`ยังไม่ได้ open: node scripts/gate.mjs open ${card} …`, 1);
  const at = new Date().toISOString();
  // โค้ดที่ผล/คำอนุมัตินี้พูดถึง
  const target = () => {
    const s = fullSha(val('sha') || 'HEAD') || die(`sha "${val('sha')}" ไม่มีใน repo นี้`);
    const code = codeOfCommit(s);
    if (!val('sha') && dirtyCode().length) die(`มีโค้ดที่ยังไม่ commit (${dirtyCode()[0]}) commit ก่อนบันทึก หรือระบุ --sha`, 1);
    if (!val('sha') && codeOfIndex() !== code) die('มีโค้ดที่ stage แล้วแต่ยังไม่ commit · commit ก่อนบันทึก หรือระบุ --sha', 1);
    return { sha: s, code };
  };
  let e;
  if (cmd === 'open') {
    if (data) die(`${gateFile(card)} open ไว้แล้ว`, 1);
    const info = cardInfo(card, false);
    const [lane, risk] = [info.lane ?? val('lane'), info.risk ?? val('risk')];
    if (!LANES.includes(lane) || !/^R[123]$/.test(risk ?? '')) die(`ต้องมี lane และ R1-R3 ในหัวการ์ด (ได้ ${lane} ${risk})`);
    if (lane === 'feature' && (!val('brief') || readText(file('brief'), false) === null)) die('feature ต้องมี --brief <ไฟล์ที่มีจริง>');
    if (val('adr') && readText(file('adr'), false) === null) die(`ไม่พบ ${val('adr')}`);
    if (val('adr') && !ADR.test(file('adr'))) die(`--adr ไม่ถูกต้อง: ต้องเป็นไฟล์ใน docs/decisions/ ที่ไม่ใช่แม่แบบ`);
    if (gateList().includes('PRIVACY') && risk !== 'R3') die('แตะข้อมูลส่วนบุคคล = R3 (docs/gates.md) แก้ R ในหัวการ์ดก่อน open', 1);
    e = { t: 'open', at, lane, risk, gates: gateList(), prod: !opts['no-prod'], brief: file('brief'), adr: file('adr'), budget_usd: num('budget-usd', val('budget-usd')), max_rounds: num('max-rounds', val('max-rounds') ?? 3) };
  } else if (cmd === 'add') {
    const [gate, result] = rest;
    if (!Object.hasOwn(OWNER_OF, gate)) die(`ไม่รู้จักด่าน ${gate}`);
    if (val('by') === 'implementer') die('implementer ตรวจงานตัวเองไม่ได้', 1);
    if (!str(val('evidence'), 10)) die('ต้องมีหลักฐาน (--evidence: คำสั่ง + บรรทัดผล หรือ file:line)', 1);
    if (result === 'conditional' && NO_CONDITIONAL.includes(gate)) die(`${gate} ผ่านแบบมีเงื่อนไขไม่ได้ (docs/gates.md)`, 1);
    if (val('by') !== OWNER_OF[gate] && !ROLES.includes(val('by'))) die(`--by ของ ${gate} คือ ${OWNER_OF[gate]} หรือบทบาทคน (${ROLES.join(' ')})`, 1);
    if (result === 'conditional' && (!val('owner') || !val('due'))) die('ผ่านแบบมีเงื่อนไขต้องมี --owner และ --due', 1);
    if (result === 'conditional' && /^\d{4}-\d{2}-\d{2}$/.test(val('due')) && val('due') < at.slice(0, 10)) die(`--due ${val('due')} ผ่านไปแล้ว`, 1);
    const t = target();
    const last = data.ev.filter((x) => x.t === 'gate' && x.gate === gate).at(-1);
    if (result !== 'fail' && last?.result === 'fail' && last.code === t.code && !val('note')) die(`ด่าน ${gate} ไม่ผ่านบนโค้ดเดิมนี้ ถ้าผลก่อนหน้าผิดต้องบอกเหตุผลด้วย --note`, 1);
    const from = val('from') ? fullSha(val('from')) || die(`sha "${val('from')}" ไม่มีใน repo นี้`) : undefined;
    e = { t: 'gate', at, gate, result, ...t, from, from_code: from && codeOfCommit(from), by: val('by'), evidence: val('evidence'), mutations: val('mutations'), owner: val('owner'), due: val('due'), note: val('note') };
  } else if (cmd === 'approve') {
    e = { t: 'approve', at, word: rest[0], role: val('role'), via: val('via'), ...(['budget', 'delegate'].includes(rest[0]) ? { sha: fullSha('HEAD') ?? die('ยังไม่มี commit'), code: codeOfIndex() } : target()), note: val('note'), usd: val('usd') && num('usd', val('usd')), rounds: val('rounds') && num('rounds', val('rounds')) };
    if (!SHAPE.approve(JSON.parse(JSON.stringify(e)))) die(`คำ บทบาท หรือ --via ไม่ถูกต้อง (คำ: ${[...WORDS.keys()].join(' ')} · --role ${ROLES.join(' ')} · --via card|chat|delegate)`);
    if (e.word === 'budget' && !e.usd && !e.rounds) die('budget ต้องระบุ --usd หรือ --rounds', 1);
    const why = approvalProblem({ ...e, i: data.ev.length }, data.o, data.ev.filter((x) => x.t === 'approve'));
    if (why) die(why, 1);
    const left = e.word === 'go' ? openQuestions(data.o, false) : [];
    if (left.length) die(`ยังให้ go ไม่ได้: ${left.join(' · ')}`, 1);
  } else if (cmd === 'raise') {
    if (!/^R[23]$/.test(rest[0] ?? '') || rest[0] <= data.o.risk) die(`เพิ่มระดับได้อย่างเดียว (ตอนนี้ ${data.o.risk})`, 1);
    e = { t: 'raise', at, risk: rest[0] };
  } else if (cmd === 'update') {
    if (val('brief') && readText(file('brief'), false) === null) die(`ไม่พบ ${file('brief')}`);
    if (!val('gates') && !val('brief')) die('ใช้: update <card> [--gates …] [--brief <ไฟล์>]');
    if (gateList().includes('PRIVACY') && data.o.risk !== 'R3') die(PRIVACY_R3, 1);
    e = { t: 'update', at, gates: val('gates') && gateList(), brief: file('brief') };
  } else e = { t: 'cost', at, usd: num('usd', rest[0]), note: val('note') };

  e = JSON.parse(JSON.stringify(e));
  if (!SHAPE[e.t](e)) die('ค่าไม่ครบหรือไม่ถูกต้อง (ดูหัวไฟล์)');
  const f = path.join(ROOT, gateFile(card));
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const had = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  fs.appendFileSync(f, `${had && !had.endsWith('\n') ? '\n' : ''}${JSON.stringify(e)}\n`);
  console.log(`OK ${cmd} → ${gateFile(card)}`);
  const after = load(card, false);
  const warn = budgetWarning(after);
  if (warn) console.error(`WARN ${warn}`);
  const over = budgetState(after);
  if (over.length) { console.error(`STOP ${over.join(' · ')} · หยุดถาม Owner (gate.mjs approve ${card} budget --role owner …)`); process.exit(3); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
