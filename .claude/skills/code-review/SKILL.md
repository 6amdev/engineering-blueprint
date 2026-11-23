---
name: code-review
description: รีวิวโค้ดก่อน merge ตาม checklist มาตรฐาน — correctness · tests · readability · security · performance. ใช้เมื่อ "รีวิวโค้ด", "ตรวจ PR", "code review", "review this diff", "ก่อน merge".
---
# code-review — รีวิวโค้ดก่อน merge

## เมื่อไหร่ใช้
ก่อน merge ทุกครั้ง (ขั้น 5) · ผู้รีวิวไม่ใช่ผู้เขียน · จำนวนผู้รีวิวตามระดับ R ใน `docs/workflow.md` · R3 = คนที่สอง หรือในทีมคนเดียว owner บันทึกการรับความเสี่ยงบนการ์ด

## input
- diff / PR / branch + sha · spec และ test inventory ของการ์ด · ADR + design brief · ผล GATE-VERIFY

## ขั้นตอน
1. **อ่าน spec ก่อนอ่านโค้ด** — รู้ก่อนว่าโค้ดควรทำอะไร · ไล่ diff เทียบทีละข้อของ spec
2. **Correctness** — ตรงทุกข้อใน scope · ไม่ทำเกิน scope · เคสผิดปกติ (ว่าง · ซ้ำ · หมดเวลา · พร้อมกัน · ไม่มีสิทธิ์) · error handling ไม่กลืน error · ทำซ้ำได้ (idempotent) ถ้าต้อง
3. **Tests** — มีหลักฐานเทสที่ไม่ผ่านก่อนแก้ · เทสตรวจพฤติกรรมไม่ใช่รายละเอียดภายใน · ครอบเคสผิดปกติ · ไม่มีการแก้เทสให้ตรงโค้ด · ชุดเทสเต็มไม่มีเทสล้มเพิ่มจาก base
4. **Readability / maintainability** — ชื่อสื่อ · ฟังก์ชันสั้นทำเรื่องเดียว · ตาม pattern เดิมของ repo · ไม่มีโค้ดตาย/คอมเมนต์โค้ดทิ้ง · ไม่เพิ่ม dependency โดยไม่จำเป็น
5. **Security** — input validation · authz ฝั่ง server · query แบบ parameterized · ไม่มีค่าลับ/PII ใน log/error/โค้ด (เจอปมใหญ่ → ส่ง skill `security-review`)
6. **Performance** — N+1 · query ไม่มี index · loop ซ้อนบนข้อมูลโตได้ · งาน sync ที่ควร async · ไม่มี limit/timeout (เกี่ยวข้อง GATE-PERF ถ้าเปิดไว้)
7. **Docs/ops** — migration ย้อนได้ · config ใหม่มีค่า default · log พอสืบสวน · เอกสาร/CHANGELOG ที่ต้องอัป
8. แยกระดับทุกข้อ: **blocker** (ต้องแก้) · **should** (ควรแก้) · **nit** (เล็ก ไม่บล็อก) · ทุกข้อมี `file:line@sha`
9. สรุปผล: ผ่าน / ผ่านแบบมีเงื่อนไข / ไม่ผ่าน · ไม่ผ่าน = ส่งกลับ implementer แล้วรีวิวรอบใหม่เฉพาะส่วนที่แก้ + ส่วนที่ได้รับผลกระทบ

## output
- `templates/code-review.md` → บันทึกใน `docs/reviews/<card>-<n>.md` หรือเป็นโพสต์บนการ์ด (skill `post`)

## agents
lead-reviewer (หลัก) · ใช้ผลจาก test-engineer · security-engineer

## gates
เป็นด่าน "code review" ใน `docs/gates.md` · ผ่านแล้วจึงไป UAT · ไม่ผ่านห้ามอ้อมด้วยการ merge ก่อน

## หยุดถาม owner เมื่อ (เฉพาะเรื่องที่ยังไม่ได้ตกลง · ที่ตกลงแล้วตัดสินเอง: `docs/workflow.md`)
- เจอการเปลี่ยนพฤติกรรมที่ spec ไม่ได้พูดถึง (ธุรกิจ) · เส้นทางเสี่ยงสูง (auth · ข้อมูลสำคัญทางธุรกิจ · ข้อมูลย้อนไม่ได้ · PII) · ข้อความถึงผู้ใช้เปลี่ยน
- รูปแบบโพสต์: คำถาม · ตัวเลือก ก/ข · แนะนำ 1 ทาง + เหตุผล · สิ่งที่ถูกบล็อก

## checklist done
- [ ] ผู้รีวิวไม่ใช่ผู้เขียน (R3: คนที่สอง หรือบันทึกการรับความเสี่ยงของ owner ในทีมคนเดียว)
- [ ] ครบหัวข้อ 2–7 · ทุกข้อพบมี `file:line@sha` และระดับ
- [ ] blocker = 0 · ผลสรุปบันทึกแล้ว
- [ ] ข้อที่ไม่ได้ตรวจเขียน "ยังไม่ได้ตรวจ"
