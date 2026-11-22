// เทสของ scripts/gate.mjs + hook: สร้าง git repo ชั่วคราวแล้วลองปิดการ์ดแบบต่าง ๆ
//   npm run gate:test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function repo(t, { lane = 'feature', risk = 'R2' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const d of ['scripts', '.githooks']) fs.cpSync(path.join(SRC, d), path.join(dir, d), { recursive: true });
  for (const f of ['blueprint.config.example.json', '.gitignore', '.gitattributes']) fs.copyFileSync(path.join(SRC, f), path.join(dir, f));
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}\n');
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-q', '-b', 'main');
  for (const [k, v] of [['user.name', 't'], ['user.email', 't@example.com'], ['core.hooksPath', '.githooks'], ['core.autocrlf', 'false']]) git('config', k, v);
  const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), s); };
  const commit = (m) => { git('add', '-A'); git('update-index', '--chmod=+x', '.githooks/commit-msg', '.githooks/pre-commit'); return spawnSync('git', ['commit', '-q', '-m', m], { cwd: dir, encoding: 'utf8' }); };
  const card = (status) => write('docs/cards/C-0001.md', `# C-0001 · x\n\n- lane: ${lane}\n- R: ${risk}\n- status: ${status}\n- created: 2026-01-01\n`);
  const gate = (...a) => spawnSync(process.execPath, [path.join(dir, 'scripts/gate.mjs'), ...a], { cwd: dir, encoding: 'utf8' });
  const ok = (...a) => { const r = gate(...a); assert.equal(r.status, 0, `${a.join(' ')}\n${r.stdout}${r.stderr}`); return r; };
  write('docs/requirements/0001.md', '# brief\n\n- ทำ: จองห้อง\n'); write('docs/stack-decisions.md', '| DB | SQLite |\n');
  card('build'); write('src/a.mjs', 'export const a = 1;\n');
  assert.equal(commit('chore: base').status, 0);
  return { dir, git, write, commit, card, gate, ok };
}
const open = (r, ...x) => r.ok('open', 'C-0001', '--brief', 'docs/requirements/0001.md', '--budget-usd', '10', '--no-prod', ...x);
const pass = (r, g, ...x) => r.ok('add', 'C-0001', g, 'pass', '--by', { VERIFY: 'test-engineer', SEC: 'security-engineer', REGRESSION: 'regression-tester', REVIEW: 'lead-reviewer', UI: 'qa-engineer', PRIVACY: 'security-engineer' }[g], '--evidence', 'npm test -> pass 12, fail 0', ...(g === 'VERIFY' ? ['--mutations', '5/5'] : []), ...x);
const allGates = (r, ...x) => ['VERIFY', 'SEC', 'REGRESSION', 'REVIEW'].forEach((g) => pass(r, g, ...x));
const approve = (r, word, role, ...x) => r.ok('approve', 'C-0001', word, '--role', role, '--via', 'chat', ...x);
const full = (r) => { open(r); approve(r, 'go', 'owner-reviewer'); allGates(r); approve(r, 'accept', 'owner'); r.ok('cost', 'C-0001', '1'); };
const GATES = 'docs/gates/C-0001.jsonl';
const bad = (res, re) => { assert.notEqual(res.status, 0, res.stdout); assert.match(res.stdout + res.stderr, re); };

test('R2 ครบ = ผ่าน และ commit ปิดการ์ดได้', (t) => {
  const r = repo(t); full(r);
  r.ok('check', 'C-0001', '--stage', 'close');
  r.card('close');
  const c = r.commit('docs: close card');
  assert.equal(c.status, 0, c.stderr);
});
test('ไม่มีไฟล์ด่าน = ปิดการ์ดไม่ได้ (hook)', (t) => { const r = repo(t); r.card('close'); bad(r.commit('docs: close card'), /gate/i); });
test('ด่านขาด 1 ตัว = ไม่ผ่าน', (t) => { const r = repo(t); open(r); approve(r, 'go', 'owner-reviewer'); ['VERIFY', 'SEC', 'REGRESSION'].forEach((g) => pass(r, g)); approve(r, 'accept', 'owner'); bad(r.gate('check', 'C-0001', '--stage', 'close'), /REVIEW/); });
test('VERIFY ผ่านแบบมีเงื่อนไขไม่ได้ (เคสงานทดลอง)', (t) => {
  const r = repo(t); open(r);
  bad(r.gate('add', 'C-0001', 'VERIFY', 'conditional', '--by', 'test-engineer', '--evidence', 'mutation 6 unconfirmed', '--owner', 'dev', '--due', '2026-12-01'), /VERIFY/);
});
test('บั๊กลองจับไม่ครบ หรือน้อยกว่า 5 = VERIFY ไม่ผ่าน (R2)', (t) => {
  for (const m of ['5/6', '3/3', null]) {
    const r = repo(t); open(r); approve(r, 'go', 'owner-reviewer'); allGates(r); approve(r, 'accept', 'owner');
    r.gate('add', 'C-0001', 'VERIFY', 'pass', '--by', 'test-engineer', '--evidence', 'npm test -> pass 12', ...(m ? ['--mutations', m] : []));
    bad(r.gate('check', 'C-0001', '--stage', 'close'), /บั๊กลอง/);
  }
});
test('โค้ดเปลี่ยนหลังด่านผ่าน = ไม่ผ่าน · เอกสารเปลี่ยนได้', (t) => {
  const r = repo(t); full(r);
  r.write('docs/note.md', 'x\n'); assert.equal(r.commit('docs: note').status, 0);
  r.ok('check', 'C-0001', '--stage', 'close');
  r.write('src/a.mjs', 'export const a = 2;\n'); assert.equal(r.commit('fix: a').status, 0);
  bad(r.gate('check', 'C-0001', '--stage', 'close'), /โค้ดเปลี่ยน/);
});
test('โค้ดที่ยังไม่ commit หรือไฟล์ใหม่ที่ยังไม่ track = ไม่ผ่าน', (t) => {
  const r = repo(t); full(r);
  r.write('src/b.mjs', 'export const b = 1;\n');
  bad(r.gate('check', 'C-0001', '--stage', 'close'), /โค้ดเปลี่ยน/);
});
test('commit ปิดการ์ดที่แอบแก้โค้ดมาด้วย = hook ปฏิเสธ', (t) => { const r = repo(t); full(r); r.card('close'); r.write('src/a.mjs', 'export const a = 9;\n'); bad(r.commit('docs: close card'), /โค้ดเปลี่ยน/); });
test('ตรวจเฉพาะส่วนที่เปลี่ยน (--from) ต่อจาก sha ที่ผ่านแล้วได้ · ขาดต้นทางไม่ได้', (t) => {
  const r = repo(t); open(r); approve(r, 'go', 'owner-reviewer'); allGates(r);
  const a = r.git('rev-parse', 'HEAD');
  r.write('src/a.mjs', 'export const a = 2;\n'); r.commit('fix: a');
  allGates(r, '--from', a); approve(r, 'accept', 'owner'); r.ok('cost', 'C-0001', '1');
  r.ok('check', 'C-0001', '--stage', 'close');
  const q = repo(t); open(q); approve(q, 'go', 'owner-reviewer');
  const base = q.git('rev-parse', 'HEAD'); q.write('src/a.mjs', 'export const a = 3;\n'); q.commit('fix: a');
  allGates(q, '--from', base); approve(q, 'accept', 'owner');
  bad(q.gate('check', 'C-0001', '--stage', 'close'), /ตรวจเต็ม/);
});
test('ไม่มี go / ไม่มีตรวจรับ = ไม่ผ่านตามขั้น', (t) => {
  const r = repo(t); open(r); allGates(r); bad(r.gate('check', 'C-0001', '--stage', 'uat'), /go/);
  const q = repo(t); open(q); approve(q, 'go', 'owner-reviewer'); allGates(q); q.ok('check', 'C-0001', '--stage', 'uat'); bad(q.gate('check', 'C-0001', '--stage', 'close'), /accept/);
});
test('go บันทึกหลังผลด่าน = ไม่นับ', (t) => { const r = repo(t); open(r); allGates(r); approve(r, 'go', 'owner-reviewer'); approve(r, 'accept', 'owner'); bad(r.gate('check', 'C-0001', '--stage', 'close'), /go/); });
test('ตรวจรับคนละโค้ดกับที่จะปิด = ไม่ผ่าน', (t) => {
  const r = repo(t); full(r); const a = r.git('rev-parse', 'HEAD');
  r.write('src/a.mjs', 'export const a = 2;\n'); r.commit('fix: a'); allGates(r, '--from', a);
  bad(r.gate('check', 'C-0001', '--stage', 'close'), /accept/);
});
test('agent อนุมัติแทนคนไม่ได้ · มอบอำนาจแล้วตรวจรับแทนได้เฉพาะ R1/R2 ที่ไม่ขึ้น prod', (t) => {
  const r = repo(t); open(r);
  bad(r.gate('approve', 'C-0001', 'go', '--role', 'agent', '--via', 'chat'), /agent/);
  approve(r, 'go', 'owner-reviewer'); allGates(r);
  bad(r.gate('approve', 'C-0001', 'accept', '--role', 'agent', '--via', 'delegate'), /มอบ/);
  approve(r, 'delegate', 'owner', '--note', 'fix gates, local uat');
  r.ok('approve', 'C-0001', 'accept', '--role', 'agent', '--via', 'delegate'); r.ok('cost', 'C-0001', '1');
  r.ok('check', 'C-0001', '--stage', 'close');
});
test('implementer ตรวจงานตัวเองไม่ได้ · หลักฐานว่างไม่ได้', (t) => {
  const r = repo(t); open(r);
  bad(r.gate('add', 'C-0001', 'REVIEW', 'pass', '--by', 'implementer', '--evidence', 'looks good to me'), /implementer/);
  bad(r.gate('add', 'C-0001', 'REVIEW', 'pass', '--by', 'lead-reviewer', '--evidence', 'ok'), /หลักฐาน/);
});
test('ด่านเงื่อนไขที่เปิดไว้ต้องผ่าน', (t) => {
  const r = repo(t); open(r, '--gates', 'UI'); approve(r, 'go', 'owner-reviewer'); allGates(r); approve(r, 'accept', 'owner');
  bad(r.gate('check', 'C-0001', '--stage', 'close'), /UI/);
  pass(r, 'UI'); approve(r, 'accept', 'owner'); r.ok('cost', 'C-0001', '1'); r.ok('check', 'C-0001', '--stage', 'close');
});
test('R3: แชตไม่นับ · ต้องครบคำอนุมัติ คนที่สอง และตรวจเต็ม', (t) => {
  const r = repo(t, { risk: 'R3' }); open(r);
  bad(r.gate('approve', 'C-0001', 'go', '--role', 'owner-reviewer', '--via', 'chat'), /R3/);
  for (const [w, role] of [['ack-brief', 'owner'], ['ack-scope', 'owner-reviewer'], ['go', 'owner-reviewer']]) r.ok('approve', 'C-0001', w, '--role', role, '--via', 'card');
  allGates(r);
  for (const [w, role] of [['gates', 'owner-reviewer'], ['uat', 'owner-reviewer']]) r.ok('approve', 'C-0001', w, '--role', role, '--via', 'card');
  bad(r.gate('check', 'C-0001', '--stage', 'close'), /คนที่สอง/);
  r.ok('approve', 'C-0001', 'second', '--role', 'second', '--via', 'card'); r.ok('cost', 'C-0001', '1');
  r.ok('check', 'C-0001', '--stage', 'close');
});
test('ระดับ R / lane ในการ์ดถูกลดหลัง open = ไม่ผ่าน', (t) => {
  const r = repo(t, { risk: 'R3' }); open(r);
  r.write('docs/cards/C-0001.md', '# C-0001\n\n- lane: feature\n- R: R1\n- status: build\n');
  bad(r.gate('check', 'C-0001', '--stage', 'uat'), /ไม่ตรงกับการ์ด/);
});
test('ขึ้น prod ต้องมี deploy จาก ops บนการ์ด', (t) => {
  const r = repo(t); r.ok('open', 'C-0001', '--brief', 'docs/requirements/0001.md', '--budget-usd', '10'); approve(r, 'go', 'owner-reviewer'); allGates(r); approve(r, 'accept', 'owner');
  bad(r.gate('check', 'C-0001', '--stage', 'close'), /deploy/);
  bad(r.gate('approve', 'C-0001', 'deploy', '--role', 'ops', '--via', 'chat'), /การ์ด/);
  r.ok('approve', 'C-0001', 'deploy', '--role', 'ops', '--via', 'card'); r.ok('approve', 'C-0001', 'deploy', '--role', 'owner-reviewer', '--via', 'card'); r.ok('cost', 'C-0001', '1');
  r.ok('check', 'C-0001', '--stage', 'close');
});
test('เกินงบเงินหรือจำนวนรอบ = exit 3 และปิดไม่ได้จน Owner เพิ่มงบ', (t) => {
  const r = repo(t); full(r);
  assert.equal(r.gate('cost', 'C-0001', '6').status, 0);
  const over = r.gate('cost', 'C-0001', '6'); assert.equal(over.status, 3, over.stdout + over.stderr);
  bad(r.gate('check', 'C-0001', '--stage', 'close'), /งบ/);
  approve(r, 'budget', 'owner', '--usd', '20'); r.ok('check', 'C-0001', '--stage', 'close');
  const q = repo(t); open(q, '--max-rounds', '2');
  const fail = () => q.gate('add', 'C-0001', 'REVIEW', 'fail', '--by', 'lead-reviewer', '--evidence', 'MAJOR 1 at src/a.mjs:1');
  assert.equal(fail().status, 0);
  q.write('src/a.mjs', 'export const a = 2;\n'); q.commit('fix: a'); assert.equal(fail().status, 0);
  q.write('src/a.mjs', 'export const a = 3;\n'); q.commit('fix: b'); assert.equal(fail().status, 3);
});
test('R1 มี ADR อนุมัติล่วงหน้า = ไม่ต้อง go · ไม่มี ADR = ต้อง go', (t) => {
  const r = repo(t, { risk: 'R1' }); r.write('docs/decisions/0002-r1.md', '# ADR\n'); r.commit('docs: adr');
  open(r, '--adr', 'docs/decisions/0002-r1.md'); allGates(r); approve(r, 'accept', 'owner'); r.ok('cost', 'C-0001', '1'); r.ok('check', 'C-0001', '--stage', 'close');
  const q = repo(t, { risk: 'R1' }); open(q); allGates(q); approve(q, 'accept', 'owner'); bad(q.gate('check', 'C-0001', '--stage', 'close'), /go/);
});
test('ยังมีข้อที่ไม่ได้ตอบใน brief หรือ stack = ให้ go ไม่ได้', (t) => {
  const r = repo(t); open(r);
  r.write('docs/stack-decisions.md', '| DB | ❓ |\n'); bad(r.gate('approve', 'C-0001', 'go', '--role', 'owner-reviewer', '--via', 'chat'), /ไม่ได้ตอบ/);
  r.write('docs/stack-decisions.md', '| DB | SQLite |\n'); r.write('docs/requirements/0001.md', '- ทำ: <…>\n'); bad(r.gate('approve', 'C-0001', 'go', '--role', 'owner-reviewer', '--via', 'chat'), /ไม่ได้ตอบ/);
  r.write('docs/requirements/0001.md', '- ทำ: จองห้อง\n'); approve(r, 'go', 'owner-reviewer');
  const q = repo(t); bad(q.gate('open', 'C-0001', '--budget-usd', '10', '--no-prod'), /brief/);
});
test('ลบหรือแก้บันทึกเดิมในไฟล์ด่าน = hook ปฏิเสธ (ต่อท้ายได้อย่างเดียว)', (t) => {
  const r = repo(t); open(r); r.gate('add', 'C-0001', 'REVIEW', 'fail', '--by', 'lead-reviewer', '--evidence', 'MAJOR 1 at src/a.mjs:1'); assert.equal(r.commit('docs: gate').status, 0);
  const f = path.join(r.dir, 'docs/gates/C-0001.jsonl');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').split('\n').filter((l) => !l.includes('"fail"')).join('\n'));
  bad(r.commit('docs: tidy gate'), /ต่อท้าย/);
});
test('open ซ้ำไม่ได้ · id แปลกไม่ได้ · sha ไม่มีจริงไม่ได้', (t) => {
  const r = repo(t); open(r);
  bad(r.gate('open', 'C-0001', '--budget-usd', '99', '--no-prod'), /แล้ว/);
  bad(r.gate('check', '../x', '--stage', 'close'), /id/);
  bad(r.gate('add', 'C-0001', 'REVIEW', 'pass', '--by', 'lead-reviewer', '--evidence', 'reviewed all files', '--sha', 'deadbeef'), /sha/);
});
test('status ที่ไม่รู้จัก (เช่น done) = hook ปฏิเสธ · rejected ได้', (t) => { const r = repo(t); r.card('done'); bad(r.commit('docs: done'), /status/); r.card('rejected'); assert.equal(r.commit('docs: rejected').status, 0); });

// --- ทางหลุดที่ผู้ตรวจแยกเคยทำได้ (0.5.0 รอบแรก)
const append = (r, o) => r.write(GATES, fs.readFileSync(path.join(r.dir, GATES), 'utf8') + (typeof o === 'string' ? o : JSON.stringify(o)) + '\n');
const closeFails = (r, re) => { r.card('close'); bad(r.commit('docs: close card'), re); };
test('บรรทัดเขียนมือผิดรูป = hook ปฏิเสธ และไม่พัง', (t) => {
  for (const l of ['null', '{}', '[]', 'x', '{"t":"cost","at":"x","usd":-5}', '{"t":"cost","at":"x","usd":"$5"}', '{"t":"approve","at":"x","word":"constructor","role":"owner","via":"card"}', '{"t":"gate","at":"x","gate":"SEC","result":"skipped"}', '{"t":"gate","at":"x","gate":"SEC","result":"pass","sha":"HEAD","code":"HEAD","by":"security-engineer","evidence":"0123456789"}', '{"t":"open","at":"x"}']) {
    const r = repo(t); full(r); append(r, l);
    const c = r.gate('check', 'C-0001', '--stage', 'close'); bad(c, /รูปแบบผิด|open 1/); assert.doesNotMatch(c.stderr, /at .*gate\.mjs:/);
    bad(r.commit('docs: gate'), /รูปแบบผิด|open 1/);
  }
});
test('ย้ายหรือลบไฟล์ด่านแล้ว open ใหม่ = hook ปฏิเสธ', (t) => {
  const r = repo(t); open(r); r.gate('cost', 'C-0001', '9'); assert.equal(r.commit('docs: gate').status, 0);
  r.git('mv', GATES, 'docs/gates/old.jsonl'); open(r); bad(r.commit('docs: move'), /ย้าย/);
});
test('การ์ดชื่อ/ที่อยู่แปลก = hook ปฏิเสธ', (t) => {
  for (const f of ['docs/cards/การ์ด.md', 'docs/cards/C-0002.MD', 'docs/Cards/C-0003.md', 'docs/cards/sub/C-0004.md']) { const r = repo(t); r.write(f, '# x\n\n- lane: bug\n- R: R1\n- status: close\n'); bad(r.commit('docs: card'), /การ์ดต้องอยู่|gate/i); }
});
test('status ซ้ำ 2 บรรทัด หรือซ่อนใน comment = hook ปฏิเสธ', (t) => {
  for (const h of ['- status: build\n- status: close\n', '<!--\n- status: build\n-->\n- status: close\n']) { const r = repo(t); r.write('docs/cards/C-0001.md', '# C-0001\n\n- lane: feature\n- R: R2\n' + h); bad(r.commit('docs: card'), /มากกว่า 1|ไม่มี docs\/gates/); }
});
test('โค้ดซ่อนใน docs/ site/ templates/ .claude/ ยังนับเป็นโค้ด', (t) => {
  for (const f of ['docs/a.mjs', 'site/a.js', 'templates/a.py', '.claude/a.mjs']) { const r = repo(t); full(r); r.write(f, 'x\n'); closeFails(r, /โค้ดเปลี่ยน/); }
});
test('ลด R หรือเปลี่ยน lane หลัง open = hook ปฏิเสธ · raise เพิ่มได้', (t) => {
  const r = repo(t, { risk: 'R3' }); open(r); r.commit('docs: gate');
  r.write('docs/cards/C-0001.md', '# C-0001\n\n- lane: feature\n- R: R1\n- status: build\n'); bad(r.commit('docs: card'), /ลดระดับ/);
  r.write('docs/cards/C-0001.md', '# C-0001\n\n- lane: chore\n- R: R3\n- status: build\n'); bad(r.commit('docs: card'), /เปลี่ยน lane/);
  const q = repo(t); open(q); q.ok('raise', 'C-0001', 'R3'); bad(q.gate('raise', 'C-0001', 'R2'), /อย่างเดียว/); bad(q.gate('approve', 'C-0001', 'go', '--role', 'owner-reviewer', '--via', 'chat'), /R3/);
});
test('--no-prod ไป deploy/release ไม่ได้ · ปิดโดยไม่บันทึกต้นทุนไม่ได้ · ตัวเลขแปลกไม่ได้', (t) => {
  const r = repo(t); open(r); approve(r, 'go', 'owner-reviewer'); allGates(r); approve(r, 'accept', 'owner');
  bad(r.gate('check', 'C-0001', '--stage', 'release'), /no-prod/); bad(r.gate('check', 'C-0001', '--stage', 'close'), /ต้นทุน/);
  for (const n of ['Infinity', '-1', 'NaN', '0']) bad(r.gate('cost', 'C-0001', n), /ตัวเลข/);
  bad(r.gate('cost', 'C-0001', '1', '--gate', 'x'), /ไม่รู้จักตัวเลือก/);
});
test('R3: คำอนุมัติก่อนผลด่าน = ไม่นับ', (t) => {
  const r = repo(t, { risk: 'R3' }); open(r);
  for (const [w, role] of [['ack-brief', 'owner'], ['ack-scope', 'owner-reviewer'], ['go', 'owner-reviewer'], ['gates', 'owner-reviewer'], ['uat', 'owner-reviewer'], ['second', 'second']]) r.ok('approve', 'C-0001', w, '--role', role, '--via', 'card');
  allGates(r); bad(r.gate('check', 'C-0001', '--stage', 'close'), /หลังผลด่านล่าสุด/);
});
test('ADR ต้องอยู่ docs/decisions · pass ซ้ำบนโค้ดเดิมที่เพิ่ง fail ต้องบอกเหตุผล · pass ตอนมีโค้ดค้างไม่ได้', (t) => {
  const r = repo(t, { risk: 'R1' }); bad(r.gate('open', 'C-0001', '--brief', 'docs/requirements/0001.md', '--budget-usd', '5', '--adr', 'package.json'), /ไม่ถูกต้อง/);
  open(r); r.ok('add', 'C-0001', 'REVIEW', 'fail', '--by', 'lead-reviewer', '--evidence', 'MAJOR at src/a.mjs:1');
  bad(r.gate('add', 'C-0001', 'REVIEW', 'pass', '--by', 'lead-reviewer', '--evidence', 'now it looks fine'), /note/);
  r.write('src/a.mjs', 'export const a = 5;\n'); bad(r.gate('add', 'C-0001', 'SEC', 'pass', '--by', 'security-engineer', '--evidence', 'ASVS L1 reviewed'), /ยังไม่ commit/);
});
// --- งานปกติที่เคยถูกบล็อกผิด
test('เติมความเห็นในการ์ดที่ปิดแล้วหลังโค้ดงานอื่นเปลี่ยน = ได้', (t) => {
  const r = repo(t); full(r); r.card('close'); assert.equal(r.commit('docs: close card').status, 0);
  r.write('src/z.mjs', 'export const z = 1;\n'); assert.equal(r.commit('feat: other').status, 0);
  r.write('docs/cards/C-0001.md', fs.readFileSync(path.join(r.dir, 'docs/cards/C-0001.md'), 'utf8') + '\n---\n### x · agent\n\nหมายเหตุ\n'); const c = r.commit('docs: note'); assert.equal(c.status, 0, c.stderr);
});
test('squash / เขียน history ใหม่แต่โค้ดเท่าเดิม = ยังผ่าน · การ์ดไม่มีหัว = commit ได้ · VERSION และ changelog ไม่นับเป็นโค้ด', (t) => {
  const r = repo(t); full(r); r.git('commit', '-q', '--amend', '-m', 'chore: rewritten'); r.write('VERSION', '2\n'); r.write('CHANGELOG.md', 'x\n');
  r.ok('check', 'C-0001', '--stage', 'close'); r.write('docs/cards/C-0009.md', '# C-0009\n'); assert.equal(r.commit('docs: card').status, 0);
});
test('REVIEW ตรวจเต็มแล้วไม่ผ่าน → แก้ → ตรวจส่วนที่แก้ด้วย --from ได้ · เตือนเมื่อใช้งบ 80%', (t) => {
  const r = repo(t); open(r); approve(r, 'go', 'owner-reviewer'); ['VERIFY', 'SEC', 'REGRESSION'].forEach((g) => pass(r, g));
  r.ok('add', 'C-0001', 'REVIEW', 'fail', '--by', 'lead-reviewer', '--evidence', 'MAJOR 1 at src/a.mjs:1'); const a = r.git('rev-parse', 'HEAD');
  r.write('src/a.mjs', 'export const a = 2;\n'); r.commit('fix: a');
  ['VERIFY', 'SEC', 'REGRESSION', 'REVIEW'].forEach((g) => pass(r, g, '--from', a)); approve(r, 'accept', 'owner');
  const w = r.gate('cost', 'C-0001', '8'); assert.equal(w.status, 0); assert.match(w.stderr, /WARN/);
  r.ok('check', 'C-0001', '--stage', 'close');
});
test('audit: จับการข้าม hook (--no-verify) และการแก้บันทึกย้อนหลัง · งานที่ครบผ่าน', (t) => {
  const r = repo(t); const base = r.git('rev-parse', 'HEAD');
  r.ok('audit', `${base}..HEAD`);
  full(r); r.card('close'); assert.equal(r.commit('chore: close').status, 0);
  const ok = r.git('rev-parse', 'HEAD'); r.write('src/a.mjs', 'export const a = 3;\n'); r.commit('feat: next'); // โค้ดงานถัดไปไม่ทำให้การ์ดเดิมตก
  r.ok('audit', `${base}..HEAD`);
  r.write('docs/cards/C-0002.md', '# C-0002\n\n- lane: bug\n- R: R1\n- status: close\n'); r.git('add', '-A'); r.git('commit', '-q', '--no-verify', '-m', 'x');
  bad(r.gate('audit', `${ok}..HEAD`), /C-0002 → close/);
  const before = r.git('rev-parse', 'HEAD'); r.write(GATES, '{}\n'); r.git('add', '-A'); r.git('commit', '-q', '--no-verify', '-m', 'x');
  bad(r.gate('audit', `${before}..HEAD`), /ต่อท้ายได้อย่างเดียว/);
  assert.equal(r.gate('audit', 'nope..HEAD').status, 2); assert.equal(r.gate('audit').status, 2);
});
