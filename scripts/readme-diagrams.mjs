#!/usr/bin/env node
// readme-diagrams.mjs — วาดภาพใน README (ไทย + อังกฤษ) จากข้อมูลชุดเดียว
//   node scripts/readme-diagrams.mjs      → docs/images/{hero,workflow,team,relay,lanes}.{th,en}.svg
// workflow / บทบาท / lane เปลี่ยนใน docs/ → แก้ข้อมูลข้างล่างแล้วรันใหม่
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/config.mjs';

const OUT = path.join(ROOT, 'docs/images');
const W = 960;
const C = {
  bg: '#FBFAF6', card: '#FFFFFF', line: '#D9D5CB', ink: '#1B2233', mute: '#5B6475',
  person: ['#FFF1D6', '#B25E00'], agent: ['#DDF3EC', '#0B6B55'], skill: ['#E9E4FB', '#5336B5'], doc: ['#E8ECF2', '#3D4A60'],
  night: '#171E30', amber: '#FFA62B',
};
const SANS = "'IBM Plex Sans Thai','Noto Sans Thai','Leelawadee UI','Thonburi',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ความกว้างโดยประมาณ (สระบน/ล่างและวรรณยุกต์ไทยไม่กินที่) ใช้เผื่อที่ ไม่ต้องเป๊ะ
const width = (s, size, mono) => [...String(s)].reduce((w, ch) => w + (/[ัิ-ฺ็-๎]/.test(ch) ? 0 : mono ? 0.61 : /[฀-๿]/.test(ch) ? 0.6 : 0.57), 0) * size;
const text = (x, y, s, { size = 19, fill = C.ink, weight = 400, anchor = 'start', mono } = {}) =>
  `<text x="${x}" y="${y}" font-family="${mono ? MONO : SANS}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
const box = (x, y, w, h, { fill = C.card, stroke = C.line, r = 14, sw = 1.5, dash } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const arrow = (d, color = C.mute, both) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" marker-end="url(#a)"${both ? ' marker-start="url(#b)"' : ''}/>`;
const svg = (h, title, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${C.mute}"/></marker><marker id="b" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10 0L0 5L10 10z" fill="${C.mute}"/></marker></defs>
<rect width="${W}" height="${h}" rx="20" fill="${C.bg}"/>
${body.join('\n')}
</svg>
`;
// แถวของป้าย ขึ้นบรรทัดใหม่เมื่อเต็ม · คืน [svg, y ถัดไป]
function chips(x0, y0, maxX, items, size = 17) {
  const out = []; let x = x0, y = y0;
  for (const [kind, s] of items) {
    const w = width(s, size, true) + 22;
    if (x > x0 && x + w > maxX) { x = x0; y += size + 22; }
    out.push(box(x, y, w, size + 14, { fill: C[kind][0], stroke: 'none', r: 9 }), text(x + 11, y + size + 3, s, { size, fill: C[kind][1], mono: true, weight: 600 }));
    x += w + 8;
  }
  return [out, y + size + 14];
}
function legend(y, t) {
  const items = [['skill', t.skill], ['agent', t.agent], ['doc', t.doc], ['person', t.person]]; const out = []; let x = 40;
  for (const [k, s] of items) {
    out.push(box(x, y - 15, 20, 20, { fill: C[k][0], stroke: C[k][1], r: 6 }), text(x + 29, y + 1, s, { size: 18, fill: C.mute }));
    x += 29 + width(s, 18) + 34;
  }
  return out;
}

const T = {
  th: {
    legend: { skill: 'skill = วิธีทำงาน', agent: 'agent = ผู้ทำ', doc: 'เอกสารที่ได้', person: 'คน = ผู้อนุมัติ' },
    hero: {
      title: 'คำขอ 1 ประโยค ผ่านแผนก IT เสมือน จนเป็นระบบพร้อมคู่มือ', ask: ['“อยากได้', 'ระบบจอง', 'ห้องประชุม”'], you: 'คุณพิมพ์', dept: 'แผนก IT เสมือน',
      facts: ['10 ขั้น', '21 skill', '16 agent'], flow: ['ถามให้ชัด', 'ออกแบบ', 'เขียนเทส + โค้ด', 'agent อีกชุดตรวจ', 'ส่งขึ้นระบบ'], get: 'ได้กลับมา',
      outs: ['โค้ดพร้อมเทส', 'เอกสารทุกขั้น', 'ผลตรวจทุกด่าน', 'คู่มือผู้ใช้', 'สถานะส่งต่อได้'], human: 'คน: ตอบคำถาม · อนุมัติทุกจุดสำคัญ · รับผิดชอบผลลัพธ์',
    },
    wf: {
      title: 'งาน 1 ชิ้น เดินผ่าน 10 ขั้น', sub: 'แต่ละขั้นมี skill ให้ทำตาม มี agent ลงมือ ได้เอกสาร และมีคนยืนยันก่อนไปต่อ',
      names: ['รับงาน · ถามจนชัด', 'ความต้องการ', 'ข้อกำหนด', 'ออกแบบ', 'เขียนเทสก่อน แล้วเขียนโค้ด', 'ด่านตรวจ', 'ทดลองใช้ก่อนขึ้นจริง', 'ขึ้นระบบจริง', 'ปล่อยให้ผู้ใช้', 'ปิดงาน · ส่งต่อ'],
      docs: ['brief ผ่าน DoR', 'PRD + user stories', 'spec + รายการเทส', 'ADR + design brief', 'โค้ด + ผลเทส', 'ผลรีวิว + ผลด่าน', 'ผลทดสอบ + sign-off', 'ใบขอ deploy + runbook', 'release notes + คู่มือ', 'HANDOFF + DoD'],
      ok: ['Owner ยืนยัน', 'Owner ACK', 'Owner-reviewer ACK', 'Owner-reviewer “go”', 'Dev อ่านผลเทส', 'Owner-reviewer', 'Owner-reviewer', 'Ops + Owner-reviewer', 'Owner', 'Owner-reviewer'],
    },
    team: {
      title: 'ใครคุยกับใคร', sub: 'agent ไม่คุยกันเอง ทุกอย่างผ่าน session หลัก และบันทึกลงการ์ด', people: 'คน · ตัดสินและอนุมัติ', main: 'session หลัก', mainSub: ['คุยกับคนผ่านการ์ด', 'แจกงานและรวมผล'],
      card: 'การ์ดงาน', cardSub: ['docs/cards/C-0001.md', 'คำถาม · คำอนุมัติ · หลักฐาน'], ask: 'ถาม / อนุมัติ', post: 'อ่าน / โพสต์', brief: 'brief งาน', back: 'ผล + หลักฐาน',
      depts: ['รับงาน', 'ออกแบบ', 'พัฒนา', 'ทดสอบ', 'ความปลอดภัย', 'ขึ้นระบบ', 'เอกสาร', 'รีวิว', 'หาสาเหตุ', 'รายงาน'],
      rules: ['คนเขียนโค้ด กับคนตรวจ เป็นคนละ agent', 'agent อนุมัติแทนคนไม่ได้ · ความเงียบไม่ใช่การอนุมัติ', 'ทุกข้อเท็จจริงต้องมีที่มา ถ้าไม่ได้ตรวจ เขียนว่า “ยังไม่ได้ตรวจ”'],
    },
    relay: {
      title: 'คนส่งไม้ต่อกันยังไง', sub: 'แต่ละบทบาทรับของที่ครบ ตัดสินเรื่องของตัวเอง แล้วส่งหลักฐานต่อ', gives: 'ส่งต่อ',
      rows: [
        ['Owner', ['ตอบคำถามเป็น ก / ข', 'ตัดสินกฎธุรกิจและข้อความ', 'บอกชัดว่าอะไรไม่ทำ'], ['brief ที่ยืนยันแล้ว', 'คำว่า ACK']],
        ['Dev + agent', ['เสนอแบบสั้น ๆ ก่อนเขียน', 'เทสก่อน แล้วค่อยเขียนโค้ด', 'ตรวจเองให้ครบก่อนรบกวนคนอื่น'], ['ของครบในรอบเดียว', 'diff · เทส · ผลด่าน']],
        ['Owner-reviewer', ['ให้ “go” ก่อนเริ่มเขียนโค้ด', 'เทียบงานกับ scope ที่ตกลง', 'อ่านหลักฐาน ไม่เชื่อคำบอก'], ['“go” · GATES ผ่าน', 'ผูกกับ sha ที่ตรวจ']],
        ['Frontend', ['ตกลง contract ก่อนต่อหน้าจอ', 'เปิดหน้าจริงบน UAT', 'ดูมือถือ ธีมมืด และตอน error'], ['GATE-UI ผ่าน', 'ภาพหน้าจอ + sha']],
        ['Ops', ['รับใบขอที่ทำตามได้ทันที', 'ขึ้นทีละเป้าหมาย เฝ้าผล', 'หยุดหรือถอยได้โดยไม่ต้องรอใคร'], ['DEPLOY เสร็จ', 'ผลตรวจหลังขึ้น']],
      ],
      foot: ['ของไม่ครบ = ตีกลับพร้อมเหตุผล ไม่เดาแทน', 'โค้ดหรือสคริปต์เปลี่ยนหลังอนุมัติ = ตรวจและขออนุมัติใหม่'],
    },
    lanes: {
      title: 'งานแต่ละแบบเดินกี่ขั้น', sub: 'เลือก lane ตอน intake', lane: ['ความสามารถใหม่', 'เปลี่ยนของที่ตกลงแล้ว', 'ระบบผิดจากที่ตกลง', 'ระบบจริงเสียตอนนี้', 'ดูแลระบบ'],
      key: ['ต้องทำ', 'ย่อได้ หรือทำเมื่อกระทบ', 'ข้าม'], note: 'ขั้น 4 (เทส) และขั้น 5 (ด่าน) ไม่มี lane ไหนข้ามได้',
    },
  },
  en: {
    legend: { skill: 'skill = how', agent: 'agent = who does it', doc: 'document produced', person: 'person = approver' },
    hero: {
      title: 'One request goes through a virtual IT department and becomes a system with a manual', ask: ['“I need a', 'meeting-room', 'booking app”'], you: 'You type', dept: 'Virtual IT department',
      facts: ['10 stages', '21 skills', '16 agents'], flow: ['Ask until clear', 'Design', 'Tests + code', 'Separate check', 'Release'], get: 'You get',
      outs: ['Code with tests', 'Docs per stage', 'Gate results', 'User manual', 'Handoff state'], human: 'People: answer questions · approve every key point · own the result',
    },
    wf: {
      title: 'One piece of work, ten stages', sub: 'Each stage has a skill to follow, agents that do it, a document, and a person who confirms',
      names: ['Intake · ask until clear', 'Requirements', 'Specification', 'Design', 'Failing test first, then code', 'Quality gates', 'Try it before production', 'Go live', 'Release to users', 'Close · hand over'],
      docs: ['Brief passing DoR', 'PRD + user stories', 'Spec + test inventory', 'ADR + design brief', 'Code + test results', 'Review + gate results', 'Test results + sign-off', 'Deploy request + runbook', 'Release notes + manual', 'HANDOFF + DoD'],
      ok: ['Owner confirms', 'Owner ACK', 'Owner-reviewer ACK', 'Owner-reviewer “go”', 'Dev reads test results', 'Owner-reviewer', 'Owner-reviewer', 'Ops + Owner-reviewer', 'Owner', 'Owner-reviewer'],
    },
    team: {
      title: 'Who talks to whom', sub: 'Agents do not talk to each other: everything goes through the main session and onto the card', people: 'People · decide and approve', main: 'Main session', mainSub: ['talks to people on the card', 'hands out work, merges results'],
      card: 'Work card', cardSub: ['docs/cards/C-0001.md', 'questions · approvals · evidence'], ask: 'ask / approve', post: 'read / post', brief: 'brief', back: 'result + evidence',
      depts: ['Intake', 'Architecture', 'Development', 'Testing', 'Security', 'Release', 'Documents', 'Review', 'Root cause', 'Reporting'],
      rules: ['The agent that writes code is not the one that checks it', 'Agents cannot approve for people · silence is never approval', 'Every fact has a source; unchecked is written as “not checked”'],
    },
    relay: {
      title: 'How people pass the baton', sub: 'Each role receives a complete package, decides its own part, and passes evidence on', gives: 'Passes on',
      rows: [
        ['Owner', ['Answers with option A or B', 'Decides business rules and wording', 'Says clearly what is out of scope'], ['Confirmed brief', 'the word ACK']],
        ['Dev + agents', ['Short design before any code', 'Failing test first, then code', 'Full self-check before handing over'], ['One complete package', 'diff · tests · gates']],
        ['Owner-reviewer', ['Gives “go” before coding starts', 'Compares work with agreed scope', 'Reads evidence, not claims'], ['“go” · gates passed', 'tied to the checked sha']],
        ['Frontend', ['Agrees the contract first', 'Opens the real page on UAT', 'Checks mobile, dark mode, errors'], ['GATE-UI passed', 'screenshots + sha']],
        ['Ops', ['Gets a request ready to follow', 'One target at a time, then watches', 'May stop or roll back, no waiting'], ['Deploy finished', 'post-deploy checks']],
      ],
      foot: ['Incomplete package = sent back with the reason, never guessed', 'Code or script changed after approval = check and ask again'],
    },
    lanes: {
      title: 'Which stages each kind of work goes through', sub: 'The lane is chosen at intake', lane: ['New capability', 'Change to agreed scope', 'Differs from the spec', 'Production broken now', 'Maintenance'],
      key: ['Required', 'Short, or only if affected', 'Skipped'], note: 'No lane may skip stage 4 (tests) or stage 5 (gates)',
    },
  },
};

const STAGE = ['intake', 'requirements', 'spec', 'design', 'build', 'gates', 'UAT', 'deploy', 'release', 'close'];
const SKILLS = [['intake'], ['requirements'], ['spec'], ['design'], ['tdd'], ['gate-check', 'code-review', 'security-review'], ['uat'], ['deploy-request'], ['release-notes', 'user-manual'], ['handoff']];
const AGENTS = [['intake-analyst'], ['intake-analyst'], ['solution-architect', 'challenger', 'lead-reviewer'], ['solution-architect', 'lead-reviewer'], ['implementer'],
  ['test-engineer', 'security-engineer', 'regression-tester', 'lead-reviewer'], ['uat-release', 'qa-engineer'], ['uat-release', 'runbook-rehearsal'], ['tech-writer'], ['tech-writer', 'status-reporter']];
const DEPT = [['intake-analyst'], ['solution-architect', 'challenger'], ['implementer'], ['test-engineer', 'qa-engineer', 'regression-tester'], ['security-engineer'],
  ['uat-release', 'runbook-rehearsal', 'prod-reader'], ['tech-writer'], ['lead-reviewer', 'approval-rehearsal'], ['root-cause-analyst'], ['status-reporter']];
// 2 = ต้อง · 1 = ย่อได้ / เมื่อกระทบ · 0 = ข้าม (docs/workflow.md §ช่องทางงาน)
const LANES = { feature: '2222222222', change: '2111222222', bug: '2111222212', hotfix: '1111221212', chore: '1001222212' };

function hero(t) {
  const h = 440, b = [];
  b.push(box(28, 44, 210, 250, { fill: C.card }), text(133, 84, t.you, { size: 19, fill: C.mute, anchor: 'middle' }));
  t.ask.forEach((s, i) => b.push(text(133, 142 + i * 40, s, { size: 25, weight: 700, anchor: 'middle' })));
  b.push(arrow('M246 169H282'));
  b.push(box(290, 28, 380, 282, { fill: C.night, stroke: 'none', r: 20 }), text(480, 72, t.dept, { size: 25, weight: 700, fill: C.amber, anchor: 'middle' }));
  t.facts.forEach((s, i) => b.push(text(480 + (i - 1) * 118, 112, s, { size: 20, weight: 600, fill: '#fff', anchor: 'middle' })));
  t.flow.forEach((s, i) => {
    const y = 134 + i * 34;
    b.push(`<circle cx="346" cy="${y + 8}" r="12" fill="${C.amber}"/>`, text(346, y + 14, i + 1, { size: 16, weight: 700, anchor: 'middle' }), text(372, y + 15, s, { size: 20, fill: '#E8ECF8' }));
  });
  b.push(arrow('M678 169H714'));
  b.push(box(722, 44, 210, 250), text(827, 84, t.get, { size: 19, fill: C.mute, anchor: 'middle' }));
  t.outs.forEach((s, i) => b.push(text(744, 126 + i * 36, `✓ ${s}`, { size: 19, weight: 600, fill: C.agent[1] })));
  b.push(box(28, 342, 904, 68, { fill: C.person[0], stroke: C.person[1], r: 16 }), text(480, 384, t.human, { size: 22, weight: 700, fill: C.person[1], anchor: 'middle' }));
  b.push(arrow('M480 340V314'));
  return svg(h, t.title, b);
}

function workflow(t, lg) {
  const b = [text(40, 58, t.title, { size: 32, weight: 700 }), text(40, 92, t.sub, { size: 19, fill: C.mute }), ...legend(132, lg)];
  let y = 164;
  STAGE.forEach((s, i) => {
    const [cs, endY] = chips(112, y + 58, 596, [...SKILLS[i].map((k) => ['skill', k]), ...AGENTS[i].map((a) => ['agent', a])]);
    const h = Math.max(endY - y + 18, 112);
    b.push(box(28, y, W - 56, h));
    b.push(`<circle cx="68" cy="${y + 40}" r="24" fill="${C.night}"/>`, text(68, y + 48, i, { size: 24, weight: 700, fill: C.amber, anchor: 'middle' }));
    b.push(text(112, y + 40, t.names[i], { size: 23, weight: 700 }), ...cs);
    b.push(text(W - 48, y + 38, s, { size: 18, fill: C.mute, mono: true, anchor: 'end' }));
    const px = 616, pw = W - 48 - px;
    b.push(text(px, y + 70, `▤ ${t.docs[i]}`, { size: 18, fill: C.doc[1], weight: 600 }));
    b.push(text(px, y + 98, `✓ ${t.ok[i]}`, { size: 18, fill: C.person[1], weight: 700 }));
    if (pw < width(t.docs[i], 18) + 24) console.warn('กว้างเกิน:', t.docs[i]);
    y += h + 14;
    if (i < 9) b.push(arrow(`M68 ${y - 14}V${y - 2}`));
  });
  return svg(y + 14, t.title, b);
}

function team(t) {
  const b = [text(40, 58, t.title, { size: 32, weight: 700 }), text(40, 92, t.sub, { size: 19, fill: C.mute })];
  b.push(box(28, 118, 904, 116, { fill: C.person[0], stroke: C.person[1] }), text(480, 154, t.people, { size: 22, weight: 700, fill: C.person[1], anchor: 'middle' }));
  ['Owner', 'Owner-reviewer', 'Dev', 'Frontend', 'Ops'].forEach((p, i) => {
    const x = 46 + i * 175; b.push(box(x, 174, 166, 44, { fill: '#fff', stroke: C.person[1], r: 10 }), text(x + 83, 203, p, { size: 18, weight: 600, anchor: 'middle' }));
  });
  b.push(arrow('M700 238V300', C.mute, true), text(716, 276, t.ask, { size: 18, fill: C.mute }));
  b.push(box(28, 306, 390, 136, { fill: C.night, stroke: 'none' }), text(223, 352, t.main, { size: 26, weight: 700, fill: C.amber, anchor: 'middle' }));
  t.mainSub.forEach((s, i) => b.push(text(223, 386 + i * 30, s, { size: 19, fill: '#E8ECF8', anchor: 'middle' })));
  b.push(box(542, 306, 390, 136, { stroke: C.doc[1], sw: 2 }), text(737, 352, t.card, { size: 26, weight: 700, anchor: 'middle' }), text(737, 386, t.cardSub[0], { size: 18, mono: true, fill: C.doc[1], anchor: 'middle' }), text(737, 416, t.cardSub[1], { size: 19, fill: C.mute, anchor: 'middle' }));
  b.push(arrow('M424 374H534', C.mute, true), text(480, 360, t.post, { size: 18, fill: C.mute, anchor: 'middle' }));
  b.push(arrow('M150 446V506'), text(138, 482, t.brief, { size: 18, fill: C.mute, anchor: 'end' }), arrow('M290 506V446'), text(304, 482, t.back, { size: 18, fill: C.mute }));
  const cw = 292, gap = 14; let x = 28, y = 514;
  const order = [0, 1, 2, 3, 5, 4, 7, 6, 8, 9]; // แถวละ 3 จัดให้กล่องสูงใกล้กัน
  for (let r = 0; r < order.length; r += 3) {
    const row = order.slice(r, r + 3); const n = Math.max(...row.map((d) => DEPT[d].length)); const h = 50 + n * 36 + 8;
    row.forEach((d, i) => {
      x = 28 + i * (cw + gap);
      b.push(box(x, y, cw, h), text(x + 18, y + 33, t.depts[d], { size: 20, weight: 700 }));
      DEPT[d].forEach((a, k) => b.push(...chips(x + 18, y + 48 + k * 36, x + cw, [['agent', a]])[0]));
    });
    y += h + gap;
  }
  // ช่องว่างข้างกล่องสุดท้าย = กติกา
  const ry = y - gap - (50 + 36 + 8);
  t.rules.forEach((s, i) => b.push(text(28 + cw + gap + 14, ry + 24 + i * 31, `• ${s}`, { size: 18, weight: 600 })));
  return svg(y + 14, t.title, b);
}

function relay(t) {
  const b = [text(40, 58, t.title, { size: 32, weight: 700 }), text(40, 92, t.sub, { size: 19, fill: C.mute })];
  let y = 120;
  t.rows.forEach(([role, does, gives], i) => {
    const h = 124, dev = i === 1;
    b.push(box(28, y, W - 56, h));
    b.push(box(28, y, 226, h, { fill: dev ? C.night : C.person[0], stroke: dev ? C.night : C.person[1] }), text(141, y + 70, role, { size: 23, weight: 700, fill: dev ? C.amber : C.person[1], anchor: 'middle' }));
    does.forEach((s, k) => b.push(text(276, y + 38 + k * 32, s, { size: 19 })));
    b.push(box(632, y + 14, 284, h - 28, { fill: C.doc[0], stroke: 'none' }), text(650, y + 42, t.gives, { size: 17, fill: C.mute }));
    gives.forEach((s, k) => b.push(text(650, y + 69 + k * 27, s, { size: 18, weight: 700, fill: C.doc[1] })));
    y += h + 18;
    if (i < t.rows.length - 1) b.push(arrow(`M774 ${y - 18}V${y - 3}`));
  });
  b.push(box(28, y, W - 56, 24 + t.foot.length * 34, { fill: '#fff', stroke: C.person[1], dash: '6 5' }));
  t.foot.forEach((s, k) => b.push(text(52, y + 36 + k * 34, s, { size: 19, weight: 600, fill: C.person[1] })));
  return svg(y + 24 + t.foot.length * 34 + 28, t.title, b);
}

function lanes(t) {
  const b = [text(40, 58, t.title, { size: 32, weight: 700 }), text(40, 92, t.sub, { size: 19, fill: C.mute })];
  const x0 = 282, dx = 66, top = 190;
  b.push(box(x0 + 4 * dx - 33, 112, dx * 2, top - 112 + 5 * 86 + 4, { fill: C.person[0], stroke: C.person[1], dash: '6 5' }));
  STAGE.forEach((s, i) => b.push(text(x0 + i * dx, 144, i, { size: 24, weight: 700, anchor: 'middle' }), text(x0 + i * dx, 168, s.length > 7 ? (s === 'requirements' ? 'req' : s) : s, { size: 16, fill: C.mute, anchor: 'middle' })));
  Object.entries(LANES).forEach(([lane, v], r) => {
    const y = top + r * 86;
    b.push(`<line x1="28" y1="${y}" x2="${W - 28}" y2="${y}" stroke="${C.line}"/>`);
    b.push(text(40, y + 38, lane, { size: 22, weight: 700, mono: true, fill: C.skill[1] }), text(40, y + 66, t.lane[r], { size: 18, fill: C.mute }));
    [...v].forEach((k, i) => {
      const cx = x0 + i * dx, cy = y + 44;
      b.push(`<circle cx="${cx}" cy="${cy}" r="16" fill="${k === '2' ? C.agent[1] : '#fff'}" stroke="${k === '0' ? C.line : C.agent[1]}" stroke-width="3"/>`);
      if (k === '1') b.push(`<path d="M${cx} ${cy - 16}a16 16 0 0 0 0 32z" fill="${C.agent[1]}"/>`);
    });
  });
  const y = top + 5 * 86 + 44; let x = 56;
  t.key.forEach((s, i) => {
    b.push(`<circle cx="${x}" cy="${y - 6}" r="12" fill="${i === 0 ? C.agent[1] : '#fff'}" stroke="${i === 2 ? C.line : C.agent[1]}" stroke-width="3"/>`);
    if (i === 1) b.push(`<path d="M${x} ${y - 18}a12 12 0 0 0 0 24z" fill="${C.agent[1]}"/>`);
    b.push(text(x + 22, y, s, { size: 19 })); x += 22 + width(s, 19) + 46;
  });
  b.push(text(40, y + 44, t.note, { size: 20, weight: 700, fill: C.person[1] }));
  return svg(y + 72, t.title, b);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [lang, t] of Object.entries(T)) {
  const files = { hero: hero(t.hero), workflow: workflow(t.wf, t.legend), team: team(t.team), relay: relay(t.relay), lanes: lanes(t.lanes) };
  for (const [n, s] of Object.entries(files)) fs.writeFileSync(path.join(OUT, `${n}.${lang}.svg`), s);
}
console.log('OK', fs.readdirSync(OUT).join(' · '));
