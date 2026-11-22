# การ์ดงานแบบ local (`docs/cards/`)

> สถานะ: v0.3.0 (2026-11-21)
> ใช้เมื่อ `board.adapter` = `local` (ค่าเริ่มต้น) · 1 การ์ด = 1 ไฟล์ markdown · อยู่ใน git = ย้ายไปกับ folder และเป็น audit trail
> คำสั่งทั้งหมดผ่าน `scripts/board.mjs` · ตั้งโฟลเดอร์อื่นได้ที่ `board.local.dir`

## 1. คำสั่ง
```bash
node scripts/board.mjs new C-0001 "ระบบจองห้องประชุม: จองล่วงหน้า" --lane feature --risk R2
node scripts/board.mjs post C-0001 .scratch/post.md            # draft-check + dry-run: แสดงก้อนที่จะต่อท้าย
BOARD_ROLE=owner-reviewer node scripts/board.mjs post C-0001 .scratch/post.md --send
node scripts/board.mjs read C-0001 --last 5                    # อ่านล่าสุดก่อนตอบ / ก่อนทวง
```
- `post` ไม่ผ่าน draft-check = ไม่ต่อท้าย (ค่าลับ · IP สาธารณะ · คำต้องห้าม · commit hash เต็มที่ไม่มีใน repo · ลายเซ็นถ้าตั้งไว้) · ห้ามแก้ไฟล์การ์ดตรง ๆ เพื่อเลี่ยง
- การ์ดยังไม่มีแล้ว `post --send` = สร้างไฟล์ที่มีแค่ `# <card>` ให้ · ควรใช้ `new` ก่อนเพื่อให้มีหัวการ์ดครบ

## 2. id การ์ด
- รูปแบบแนะนำ `C-0001` (เลขเรียง 4 หลัก) · ใช้ได้เฉพาะ `A-Z a-z 0-9 . _ -` (สคริปต์ปฏิเสธ `/` `\` และอื่น ๆ กัน path traversal)
- id ไม่เปลี่ยนตลอดอายุการ์ด · ใช้ใน branch (`feat/C-0001-booking`) · commit footer `Refs: C-0001` · requirement `docs/requirements/NNNN-slug.md`

## 3. รูปแบบไฟล์
```markdown
# C-0001 · ระบบจองห้องประชุม: จองล่วงหน้า

- lane: feature
- R: R2
- status: intake
- created: 2026-11-21

---
### 2026-11-21T09:30:00.000Z · agent

<ข้อความโพสต์ ตามแม่แบบ templates/card-post.md>
```
- หัวการ์ด (ส่วนบนก่อน `---` แรก) แก้ได้ด้วยมือ: เปลี่ยน `status` / `R` / `lane` ตามงาน แล้วโพสต์บอกเหตุผล 1 บรรทัด
- ความเห็น = ต่อท้ายเท่านั้น · ห้ามแก้หรือลบก้อนเก่า (ผิดให้โพสต์ใหม่แก้) · เวลาเป็น ISO 8601 UTC
- ผู้เขียน = ชื่อบทบาทจาก env `BOARD_ROLE` (`owner` · `owner-reviewer` · `dev` · `frontend` · `ops` · ชื่อ agent) · ไม่ตั้ง = `agent` · ห้ามใส่ชื่อคน · agent ห้ามตั้งเป็นบทบาทของคน · ค่านี้ไม่ยืนยันตัวตน (ดูตัวตนจริงจาก commit / สิทธิ์ของ repo)

## 4. lane (ช่องทางงาน · เลือกตอน intake)
| lane | ใช้เมื่อ | ขั้นที่ผ่าน |
|---|---|---|
| `feature` | ความสามารถใหม่ | ทุกขั้น 0–9 |
| `change` | ขอเปลี่ยนสิ่งที่ ack แล้ว (`templates/change-request.md`) | วิเคราะห์ผลกระทบ → กลับไปขั้นแรกสุดที่โดน · owner ack ใหม่ |
| `bug` | ข้อบกพร่อง (`templates/bug-report.md`) | ทำซ้ำอาการ → เทส RED → แก้ → gates → UAT → deploy |
| `hotfix` | แก้เหตุบน production | ย่อได้ แต่ไม่ข้ามเทส RED · GATE-VERIFY · GATE-SEC (เมื่อแตะเส้นทางเสี่ยงสูง R3) · อนุมัติ · แผนถอย · postmortem |
| `chore` | ดูแลระบบ (อัปเดต dependency · tech debt · refactor ไม่เปลี่ยนพฤติกรรม) | 0 (ย่อ) · 4–7 · 9 · GATE-DEPS ถ้าเปลี่ยน dependency |

## 5. status (ตามขั้นใน `docs/workflow.md`)
`intake` → `requirements` → `spec` → `design` → `build` → `gates` → `uat` → `deploy` → `release` → `close`
- `uat` · `deploy` · `release` · `close` ต้องผ่าน `gate.mjs check` (hook ตรวจตอน commit) · status อื่นนอกรายการ hook ปฏิเสธ · ไม่รับงาน = `rejected`
- เพิ่มได้ 1 ค่า: `blocked` (โพสต์บอกว่ารอใคร · ตั้งแต่เมื่อไร · ปลดด้วยอะไร) · กลับมาให้ใส่ขั้นเดิม
- lane ที่ข้ามขั้น (เช่น `bug`) ข้ามค่า status นั้นไปเลย ไม่ต้องใส่ทุกค่า

## 6. R (ความเสี่ยง)
`R1` ต่ำ · `R2` กลาง · `R3` สูง (นิยามใน `docs/workflow.md`) · ยังไม่ประเมิน = `R?`
- R3: ต้องมีคนที่สองอนุมัติ · ทีมคนเดียว = Owner บันทึกรับความเสี่ยงชัดเจนบนการ์ด ซึ่งอ่อนกว่า (`docs/roles/README.md`)

## 7. การอนุมัติ = ความเห็นบนการ์ด
ตอบในแชต: session หลักบันทึกแทนด้วยบทบาท `agent` ตาม `docs/posting.md` (ไม่ตั้ง `BOARD_ROLE` เป็นคน)
ack brief/PRD · "go" · อนุมัติอ่านข้อมูลจริง (ผูก hash ของสคริปต์) · อนุมัติ deploy → โพสต์ด้วย `BOARD_ROLE` ของผู้อนุมัติ + sha / ลิงก์
→ git history + ไฟล์การ์ด = audit trail (เท่าที่สิทธิ์ของ repo และตัวตนใน commit เชื่อถือได้)
