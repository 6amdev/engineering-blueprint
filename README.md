# engineering-blueprint

**แม่แบบ repo ที่ทำให้ AI coding agent ทำงานเป็นขั้นตอนเหมือนแผนก IT แทนที่จะเขียนโค้ดตามคำสั่งทีละประโยค**
clone แล้วรันคำสั่งเดียว ได้ folder โปรเจกต์ใหม่ที่มีกติกา ขั้นตอน แม่แบบเอกสาร และบทบาท agent พร้อมใช้

> สถานะ: v0.3.0 · รุ่นแรก ยังไม่ผ่านการใช้งานจริงครบรอบ · เอกสารเป็นภาษาไทย ([English summary](#english-summary))

## ทำเพื่ออะไร
AI เขียนโค้ดได้เร็ว แต่งานจริงมักพังเพราะเรื่องรอบ ๆ โค้ด:

| ปัญหา | ที่นี่จัดการยังไง |
|---|---|
| สั่งสั้น ๆ แล้ว AI เดา ได้ของไม่ตรง | skill `intake` ถามจนเข้าใจตรงกันก่อนเริ่ม |
| เปิดแชตใหม่แล้วลืมหมด | สถานะอยู่ใน `docs/HANDOFF.md` ความจำอยู่ใน `memory/` ไม่ได้อยู่ในแชต |
| โค้ดดูเสร็จแต่ไม่มีเทส | เขียนเทสจาก spec ก่อน แล้วให้อีก agent ตรวจแยก |
| token หรือรหัสผ่านหลุดเข้า git | hook สแกนก่อน commit |
| ไม่มีเอกสาร ส่งต่อไม่ได้ | แม่แบบตั้งแต่ requirement จนถึงคู่มือผู้ใช้ |
| ไม่รู้ว่าใครอนุมัติอะไร | คนอนุมัติบนการ์ด มีบทบาทและวันที่ |

## งาน 1 ชิ้นเดินยังไง
```
intake → requirements → spec → design → build → gates → UAT → deploy → release → close
```
ตัวอย่าง: คุณพิมพ์ว่า "อยากได้ระบบจองห้องประชุม"
1. **intake** ถามว่าใครใช้ จองซ้อนได้ไหม ยกเลิกยังไง → คุณยืนยัน brief
2. **requirements / spec / design** เขียนเอกสารให้คุณตรวจทีละขั้น
3. **build** เขียนเทสที่ยังไม่ผ่านก่อน แล้วเขียนโค้ดให้ผ่าน
4. **gates** agent อีกชุดตรวจความถูกต้อง ความปลอดภัย และของเดิมไม่พัง
5. **UAT → deploy** คนลองใช้และอนุมัติก่อนขึ้นจริง
6. **release / close** ได้ release notes คู่มือผู้ใช้ และสถานะล่าสุดให้คนถัดไป

งานไม่ต้องเดินครบทุกขั้นเสมอ มี 5 ช่องทาง: `feature` · `change` · `bug` · `hotfix` · `chore` (ดู [`docs/workflow.md`](docs/workflow.md) ซึ่งมีคำอธิบายศัพท์ด้วย)

## แผนกเสมือน
| บทบาท | agent (`.claude/agents/`) | skill หลัก (`.claude/skills/`) |
|---|---|---|
| วิเคราะห์ความต้องการ | `intake-analyst` | `intake` · `requirements` · `planning` |
| ออกแบบ | `solution-architect` · `challenger` | `spec` · `design` |
| พัฒนา | `implementer` | `tdd` · `bugfix` · `change-request` |
| ทดสอบ | `test-engineer` · `regression-tester` · `qa-engineer` | `gate-check` · `uat` |
| ความปลอดภัย | `security-engineer` | `security-review` |
| ขึ้นระบบและดูแล | `uat-release` · `runbook-rehearsal` · `prod-reader` | `deploy-request` · `db-script` · `hotfix` |
| เอกสาร | `tech-writer` | `user-manual` · `release-notes` |
| รีวิว | `lead-reviewer` · `approval-rehearsal` | `code-review` |
| หาสาเหตุปัญหา | `root-cause-analyst` | `postmortem` |
| รายงานและส่งต่อ | `status-reporter` | `handoff` · `post` · `retro` |

**คน** ตัดสินเรื่องธุรกิจ อนุมัติงานเสี่ยง และรับผิดชอบผลลัพธ์ (Owner · Owner-reviewer · Dev · Frontend · Ops คนเดียวถือหลายบทบาทได้)

## อะไรบังคับจริง อะไรเป็นแนวทาง
| บังคับด้วยโค้ด | เป็นคำสั่งให้ agent และ checklist ให้คน |
|---|---|
| สแกนค่าลับ IP และคำต้องห้ามตอน commit | ลำดับ 10 ขั้น และด่านทั้งหมด |
| รูปแบบ commit message | การแยกหน้าที่และการอนุมัติ |
| ตรวจร่างโพสต์ก่อนส่งขึ้นบอร์ด (ค่าลับ · IP · คำต้องห้าม · commit ที่ไม่มีจริง) | เนื้อหาเอกสารตามแม่แบบ |

ตัวสแกนช่วยลดความเสี่ยง ไม่ได้จับได้ทุกอย่าง และ repo นี้ไม่ใช่ใบรับรองมาตรฐานใด ๆ

## เหมาะ / ไม่เหมาะ
- **เหมาะ:** ทีมเล็กหรือคนเดียวที่ใช้ AI ทำงานส่วนใหญ่ · องค์กรที่อยากให้พนักงานสร้างระบบภายในอย่างมีขั้นตอน · งานที่ต้องส่งต่อ
- **ไม่เหมาะ:** สคริปต์ใช้ครั้งเดียว · ทีมที่มีกระบวนการครบอยู่แล้ว · คนที่อยากให้ AI ทำทั้งหมดโดยไม่มีคนอนุมัติ
- **ใช้กับงานที่ถูกต้องเท่านั้น:** intake ถามเรื่องสิทธิ์ในระบบ ข้อมูล และเนื้อหาก่อนเริ่ม งานที่ผิดกฎหมายหรือไม่มีสิทธิ์ = ไม่รับ

## เริ่มใช้
ต้องมี Node.js 20+ · git · AI coding agent ที่อ่าน `AGENTS.md` ได้ (เช่น Claude Code, Codex)
```bash
git clone https://github.com/6amdev/engineering-blueprint.git
cd engineering-blueprint
node scripts/new-project.mjs ../my-project    # สร้างโปรเจกต์ใหม่ (ไม่ push ไม่สร้าง remote)
cd ../my-project
npm install                                   # เปิด git hooks
node scripts/board.mjs new C-0001 "งานแรก"    # การ์ดแรก เป็นไฟล์ใน docs/cards/
```
เปิด folder ด้วย agent แล้วพิมพ์ว่า "เริ่มการ์ด C-0001 ด้วย skill intake" · จะใช้ทั้งองค์กรอ่าน [`docs/onboarding.md`](docs/onboarding.md)

บอร์ดงาน: ค่าเริ่มต้นเป็นไฟล์ใน repo ไม่ต้องสมัครอะไร · ต่อ Trello หรือ GitHub Issues ได้ (สองแบบหลังยังไม่ได้ทดสอบส่งจริง)

## โครง repo
```
AGENTS.md          กติกากลางที่ agent ทุกตัวอ่าน
docs/              workflow · ด่าน · มาตรฐาน · บทบาท · deploy · การ์ด · ADR
templates/         แม่แบบเอกสาร
.claude/skills/    ขั้นตอนทำงาน (markdown ธรรมดา)
.claude/agents/    บทบาท agent
scripts/           สร้างโปรเจกต์ · บอร์ด · ตัวสแกน
site/              ตัวอย่างคู่มือผู้ใช้ (VitePress)
memory/            ความจำของ agent (ไม่ขึ้น git)
```

## ข้อจำกัดที่รู้
- ยังไม่มีคำสั่งอัปเกรดโปรเจกต์ที่สร้างไปแล้ว
- hook ใช้กับเครื่องที่รัน `npm install` แล้วเท่านั้น
- ตัวเลขเริ่มต้นในเอกสาร (เช่นงบ performance) เป็นจุดตั้งต้น ให้ทีมปรับเอง

ร่วมพัฒนา: [`CONTRIBUTING.md`](CONTRIBUTING.md) · แจ้งช่องโหว่: [`SECURITY.md`](SECURITY.md)

## License
ตั้งใจให้ใช้ฟรี แต่ยังไม่ได้เลือก license — จนกว่าจะมีไฟล์ `LICENSE` อ่านได้ แต่ยังไม่ให้สิทธิ์คัดลอกไปใช้ต่อ

---

## English summary
A starter repo that makes AI coding agents work like a small IT department instead of answering one prompt at a time.
Run one command to get a project folder with rules (`AGENTS.md`), a 10-stage workflow from intake to user manual,
role prompts, step-by-step skills and document templates. People decide and approve; agents do the work.

**Enforced by code:** secret/IP/word scan and commit-message check (git hooks), draft check before posting to the board.
**Guidance only:** the workflow, quality gates, approvals and templates. This is v0.3.0: early, documentation in Thai, not certified against any standard.

Start: clone → `node scripts/new-project.mjs ../my-project` → `npm install` there → open it with your agent. License: meant to be free to use, but not chosen yet (no reuse rights until a `LICENSE` file exists).
