# Git — วิธีใช้ในทีม

> สถานะ: v0.3.0 (2026-11-21)

> ใช้กับทุกโปรเจกต์ที่สร้างจาก blueprint · มาตรฐาน: trunk-based development · Conventional Commits 1.0 · SemVer 2.0
> hook ตรวจให้เอง (`.githooks/`) · ตั้งให้อัตโนมัติตอน `npm install` (`prepare`) · ห้ามเลี่ยงด้วย `--no-verify`

## 1. กติกาหลัก
- `main` = ขึ้นได้เสมอ · ห้ามแก้ history ที่แชร์แล้ว (no force-push · no rebase บน branch ที่คนอื่นใช้)
- commit ในเครื่องเมื่อจบชิ้นงาน · **push เฉพาะเมื่อสั่ง** · remote ใหม่ = ถาม owner ก่อน (สาธารณะ/ส่วนตัว)
- commit เล็ก 1 เรื่อง · เทสผ่านก่อน commit · ไม่ commit ไฟล์ที่ไม่ได้แก้เอง (ทำงานร่วม folder กับ session อื่น)
- ใน folder ที่แชร์กัน: ห้าม `stash` / `reset` / สลับ branch ของคนอื่น → ใช้ worktree (ข้อ 6)

## 2. Branch
| ชื่อ | ใช้เมื่อ | อายุ |
|---|---|---|
| `main` | trunk · สิ่งที่ผ่านด่านแล้ว | ถาวร |
| `<type>/<card>-<สั้น>` เช่น `feat/42-password-reset` | งาน 1 การ์ด (type เดียวกับ commit) | ≤ 2–3 วัน · ลบหลัง merge |
| `hotfix/<ver>-<สั้น>` | แก้ด่วนจาก tag ที่ขึ้นจริงอยู่ | จน tag ใหม่ออก |

- งานใหญ่: แบ่งเป็นหลาย branch เล็ก + feature flag แทน branch อายุยาว
- งานเล็กมาก (docs, R1) ทำบน `main` ในเครื่องได้ ถ้าโปรเจกต์ยังไม่มี remote

## 3. Commit (Conventional Commits — hook `commit-msg` ตรวจ)
```
<type>(<scope>)?!?: <สรุปสั้น ≤ 100 ตัว ภาษาอังกฤษ รูปคำสั่ง>

<ทำไม (ไม่ต้องบอกว่าแก้อะไร diff บอกแล้ว)>

Refs: <card>
BREAKING CHANGE: <ถ้ามี>
```
type: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` · `!` = breaking
→ `feat` = MINOR · `fix`/`perf` = PATCH · breaking = MAJOR (ใช้ตอนออก release)

## 4. Pull request + review
1. branch ผ่านด่านในเครื่อง (`docs/gates.md`) → push branch (เมื่อสั่ง) → เปิด PR ด้วยแม่แบบ `templates/code-review.md`
2. PR บอก: การ์ด · scope ทำ / ไม่ทำ · หลักฐานเทส (RED → GREEN · ไม่มีเทสที่เคยผ่านแล้วกลับมาไม่ผ่าน · ลิงก์ผล CI) · ความเสี่ยง R · วิธีถอย
3. CI ผ่าน (แม่แบบ `templates/github-ci.yml`) + reviewer อย่างน้อย 1 (R3: คนที่ไม่ใช่ผู้เขียน + security-engineer) → **squash merge**
4. ผู้เขียนไม่ approve งานตัวเอง (ทีมคนเดียว: ดู `docs/roles/README.md`) · แก้ตาม review เป็น commit ใหม่ ไม่ force-push ระหว่าง review
- ตั้งบน GitHub (owner ทำ): protect `main` · require PR + CI + 1 review · ห้าม force-push · ลบ branch หลัง merge

## 5. Release + tag
- เวอร์ชันตาม SemVer จาก commit ตั้งแต่ tag ก่อน · `git tag -a vX.Y.Z -m "<สรุป>"` บน commit ที่ผ่าน UAT
- CHANGELOG + release notes (skill `release-notes`) ออกพร้อม tag · deploy อ้าง tag + sha เสมอ ไม่อ้าง branch
- hotfix: branch จาก tag → แก้ + เทส → tag PATCH → merge กลับ `main`

## 6. ทำงานขนาน (worktree)
`git worktree add ../<repo>-<card> -b feat/<card>-<สั้น>` · 1 agent / session ต่อ 1 worktree · ไม่ชนไฟล์กัน
จบแล้ว `git worktree remove ../<repo>-<card>` · ห้ามสอง agent เขียนไฟล์เดียวกัน

## 7. ถอย (rollback)
- โค้ดที่ merge แล้ว: `git revert <sha>` (commit ใหม่) · ไม่ `reset` บน branch ที่แชร์
- ระบบที่ขึ้นจริง: deploy tag ก่อนหน้า ตาม `docs/deploy.md` · ข้อมูลที่เปลี่ยน = แผนถอยของ DB script (`docs/db-scripts.md`)
- ยังไม่ push: แก้ commit ล่าสุดของตัวเองได้ (`git commit --amend`) · ที่ push แล้ว = revert

## 8. ค่าลับ (hook `pre-commit` + CI ตรวจ)
- ไฟล์ห้ามเข้า git: `.env*` (ยกเว้น `.env.example`) · `.mcp.json` · `*.pem` `*.key` `*.p12` · `id_rsa*` · `blueprint.config.json` · `memory/*` · `.claude/settings.local.json`
- เนื้อหาที่ FAIL: private key · token ของ cloud / git host / แชต / AI · JWT · URL ที่มีรหัสผ่าน · `password = "…"` · IP สาธารณะ · คำต้องห้ามใน config
- ตรวจทั้ง repo: `npm run secret-scan` · เจอ = เอาออก **และ rotate ค่านั้น** (ถือว่ารั่วแล้วถ้าเคย push) · แจ้ง owner
- ตัวอย่างในเอกสารที่ตั้งใจเขียน: ใส่ `secret-scan:allow` ในบรรทัดนั้น (reviewer ต้องเห็นด้วย)

## 9. บอร์ดงาน (local · Trello · GitHub Issues · ไม่ผูก)
เลือกใน `blueprint.config.json` → `board.adapter` · ไม่ตั้ง = `local`

| adapter | การ์ดอยู่ที่ | ต้องมี | ใช้เมื่อ |
|---|---|---|---|
| `local` (ค่าเริ่มต้น) | ไฟล์ `docs/cards/<card>.md` ใน repo (`board.local.dir`) · ความเห็นต่อท้ายไฟล์ | ไม่มี | เริ่มเร็ว · ทีมเล็ก · อยากให้การ์ดย้ายไปกับ folder/git · รายละเอียด `docs/cards/README.md` |
| `trello` | การ์ด Trello (id การ์ด) | env `TRELLO_KEY` / `TRELLO_TOKEN` (ชื่อตั้งได้ใน config) | ทีมใช้ Trello อยู่แล้ว |
| `github` | GitHub Issue (เลข issue) | `gh auth login` ในเครื่อง · `board.github.repo` = `owner/name` | งานอยู่บน GitHub · อยากเชื่อม PR กับ issue |
| `none` | ไม่มี | — | ไม่ผูกบอร์ด · `post` / `read` จะหยุดพร้อมบอกเหตุผล |

- สร้างการ์ด (local): `node scripts/board.mjs new C-0001 "ชื่องาน" [--lane feature] [--risk R2]` · บอร์ดอื่นสร้างในบอร์ดนั้นเอง
- โพสต์: เขียนร่างเป็นไฟล์ → `node scripts/board.mjs post <card> <draft.md>` (draft-check + dry-run · local แสดงก้อนที่จะต่อท้าย) → เติม `--send` เมื่อพร้อม
- ผู้เขียน (local) = env `BOARD_ROLE` เป็นชื่อบทบาท เช่น `BOARD_ROLE=owner-reviewer` · ไม่ตั้ง = `agent` · ห้ามใส่ชื่อคน
- อ่านก่อนตอบ / ก่อนทวง: `node scripts/board.mjs read <card> --last 5`
- เชื่อม git กับการ์ด: ชื่อ branch มีเลขการ์ด · commit footer `Refs: <card>` · โพสต์อ้าง `file:line@sha`
- การ์ด local อยู่ใน git = audit trail: ทุกการอนุมัติ (ack · "go" · อนุมัติอ่านข้อมูลจริง · อนุมัติ deploy) เป็นความเห็นที่มีวันเวลา + บทบาท + sha

**เพิ่มบอร์ดอื่น (Jira · Linear · อื่น ๆ)** = เพิ่ม object 1 ตัวใน `adapters` ของ `scripts/board.mjs`:
```js
jira: {
  async post(id, text) { /* POST ความเห็นไปที่การ์ด id · token จาก env(board.jira.token_env) */ },
  async read(id) { /* ดึงความเห็นล่าสุด `last` รายการ แล้ว console.log แบบ "--- <เวลา> · <ผู้เขียน>" */ },
},
```
- ค่าตั้ง (URL ของ instance · ชื่อตัวแปร env) ไว้ใน `board.<ชื่อ>` ของ config · token อยู่ใน env เท่านั้น ห้ามใส่ใน config / URL
- `post` ถูกเรียกหลัง draft-check ผ่านแล้วเท่านั้น · ไม่ต้องตรวจซ้ำใน adapter · error ให้ใช้ `die(msg, 1)`
- เพิ่มชื่อใน `_adapters` ของ `blueprint.config.example.json` + แถวในตารางนี้ · ทดสอบ dry-run ก่อนส่งจริง
