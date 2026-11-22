---
name: bugfix
description: แก้บั๊กแบบมีหลักฐาน — ทำซ้ำ, หาต้นเหตุ, เขียนเทส RED ที่จับบั๊ก, แก้น้อยสุด, ผ่านด่าน, UAT, deploy. ใช้เมื่อเจ้าของพูดว่า "บั๊ก", "พัง", "error", "ใช้ไม่ได้", "ไม่ตรงที่ควร", "แก้บั๊ก", "bug", "broken", "fix this", "doesn't work", "regression". ถ้า prod เสียตอนนี้ใช้ skill hotfix.
---
# bugfix — lane `bug`

> สถานะ: v0.3.0 (2026-11-21) · agent: intake-analyst · root-cause-analyst · implementer · test-engineer · แม่แบบ `templates/bug-report.md`

## ใช้เมื่อ
- ระบบทำไม่ตรง spec/AC ที่ ack แล้ว · prod ไม่ได้เสียหนักตอนนี้ (หนัก = skill `hotfix`)

## เข้า
- คำแจ้ง (ข้อความ · ภาพ · log) · spec / AC ที่เกี่ยว · sha ที่เกิด

## ขั้นตอน
1. intake ย่อ: กรอก `templates/bug-report.md` · severity S1–S4 · ระดับ R · lane (`bug` หรือ `hotfix`) · checklist เปิดด่าน (`docs/gates.md`)
2. ทำซ้ำบน dev/UAT ด้วยข้อมูลสมมติ · ทำซ้ำไม่ได้ = เก็บหลักฐานเพิ่ม (log query + ช่วงเวลา) ห้ามเดาแก้
3. root-cause-analyst หาต้นเหตุ: `file:line@sha` + ทำไมเทสเดิมไม่จับ · ต้องอ่านข้อมูลจริง = ด่าน DB-READ
4. ตัดสิน: การแก้ทำให้กลับมาตรง spec เดิม = ข้ามขั้น 1–3 (เขียนเหตุผลในการ์ด) · เปลี่ยนพฤติกรรม/spec = ทำ 1–3 หรือส่ง skill `change-request`
5. เขียนเทส RED ที่จับอาการ (`T-NNNN-NN`) → รันให้ไม่ผ่าน เก็บเป็นหลักฐานเทสที่ไม่ผ่านก่อนแก้
6. แก้น้อยสุดให้เขียว (skill `tdd`) · ของอื่นที่เห็นระหว่างทาง = แยกการ์ด
7. ด่าน: GATE-VERIFY · GATE-SEC · GATE-REGRESSION · code review · GATE-UI ถ้า UI เปลี่ยน · ด่านเงื่อนไขที่เปิด (skill `gate-check`)
8. UAT (skill `uat`) ยืนยันอาการหายตามขั้นทำซ้ำ → deploy (skill `deploy-request`)
9. เพิ่มแถว traceability (`docs/documents.md`) · release notes ถ้าผู้ใช้เห็น · DoD · `docs/HANDOFF.md`

## ออก
- bug report ครบ · เทส RED→GREEN · ผลด่าน · sha ที่ขึ้น · CHANGELOG หัวข้อ `Fixed`

## หยุดถาม Owner เมื่อ
- ไม่แน่ใจว่าพฤติกรรมไหนถูก (spec ไม่บอก) · การแก้แตะเส้นทาง R3 · ต้องแก้ข้อมูลที่เสียไปแล้ว (DB-WRITE) · ต้องแจ้งผู้ใช้

## ห้าม
- แก้โดยไม่มีเทส RED · แก้เทสให้ตรงโค้ด · ปิดบั๊กที่ทำซ้ำไม่ได้ว่า "แก้แล้ว" · ใส่ข้อมูลจริงของผู้ใช้ในเทส/การ์ด
