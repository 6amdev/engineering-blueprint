---
name: handoff
description: บันทึกสถานะให้คนหรือ session ถัดไปรับงานต่อได้จาก repo (docs/HANDOFF.md + ADR + memory + commit). ใช้เมื่อ "ส่งต่องาน", "handoff", "จบงาน", "ปิด session", "wrap up".
---
# handoff — ส่งต่องาน

> ขั้น 9

## เมื่อไหร่ใช้
จบชิ้นงาน · ปิด session · เปลี่ยนผู้รับผิดชอบ · พักงานไปทำเรื่องอื่น

## input
สถานะการ์ด · git log/status · ผลด่าน · คำตัดสินใหม่ · สิ่งที่รอ

## ขั้นตอน
1. อ่าน `docs/HANDOFF.md` เดิมและคอมเมนต์ล่าสุด (`node scripts/board.mjs read <card>`)
2. **เขียนทับ "▶ ตอนนี้"** ตาม `templates/handoff.md`: เสร็จ (version/commit) · กำลังทำ · ขั้นถัดไปเรียงลำดับ · รอใคร (ตั้งแต่เมื่อไร · ETA ขึ้นกับอะไร) · ปัญหาที่รู้ · ระบบอยู่ที่ไหน + sha
3. ทุกข้อมีที่มา หรือ "ยังไม่ได้ตรวจ"
4. คำตัดสินใหม่ → ADR ใน `docs/decisions/`
5. `memory/` เฉพาะเรื่องที่ใช้ข้ามงาน ตาม `memory/README.md` · ไม่มีค่าลับ/IP/PII · ไม่ commit
6. ปิดการ์ด = ตรวจ DoD (`docs/workflow.md`) · ขาดข้อไหนระบุ
7. commit ในเครื่อง (Conventional Commits) · hook ต้องผ่าน · push เมื่อสั่ง
8. บอก 1 บรรทัด: คนถัดไปทำอะไรก่อน

## output
`docs/HANDOFF.md` · ADR ใหม่ · `memory/` · commit

## agents
status-reporter (สรุป) · tech-writer (เอกสาร)

## gates
ไม่มีด่านเอง · ด่านที่ค้างต้องบันทึก

## หยุดถาม owner เมื่อ (เฉพาะเรื่องที่ยังไม่ได้ตกลง · ที่ตกลงแล้วตัดสินเอง: `docs/workflow.md`)
ลำดับถัดไปมีผลต่อธุรกิจและยังไม่ชัด · จะ push/เปิด PR หรือไม่

## checklist done
- [ ] "▶ ตอนนี้" ครบ · ทุกข้อมีที่มาหรือ "ยังไม่ได้ตรวจ"
- [ ] ADR · memory อัป · commit ผ่าน hook
- [ ] 1 บรรทัดสำหรับคนถัดไป
