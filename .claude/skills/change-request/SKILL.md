---
name: change-request
description: รับคำขอเปลี่ยน scope ที่ ack แล้ว — เขียนใบ change request, วิเคราะห์ผลกระทบ, หาขั้นแรกสุดที่ต้องย้อน, ขอ Owner re-ack ก่อนทำ. ใช้เมื่อเจ้าของพูดว่า "ขอเปลี่ยน", "เพิ่มอีกนิด", "ไม่เอาแบบนี้แล้ว", "แก้ requirement", "ขอปรับ scope", "change request", "scope change", "can we also", "change the spec".
---
# change-request — lane `change`

> สถานะ: v0.3.0 (2026-11-21) · agent: intake-analyst · solution-architect · challenger (R2/R3) · แม่แบบ `templates/change-request.md`

## ใช้เมื่อ
- งานที่ owner ack scope แล้ว (brief / PRD / spec / design) ต้องเปลี่ยน · ระหว่างทำหรือหลังปล่อย
- ไม่ใช่: ระบบไม่ตรง spec (= skill `bugfix`) · งานใหม่ที่ไม่แตะของเดิม (= `feature` ผ่าน `planning` + `intake`)

## เข้า
- คำขอ · การ์ดและเอกสารเดิมที่ ack (`file@sha`) · สถานะงานตอนนี้ (อยู่ขั้นไหน)

## ขั้นตอน
1. ยืนยันว่าเป็น change จริง: เทียบกับ scope ที่ ack · ไม่แตะของเดิม = ส่ง `planning`
2. กรอก `templates/change-request.md`: เดิม / ใหม่ / เพราะ
3. impact analysis (intake-analyst + solution-architect): requirement · AC · spec · test inventory · design/ADR · interface · โค้ดที่ทำแล้ว · ระดับ R · ด่านเงื่อนไข (checklist `docs/gates.md`) · ขนาด/เวลา · ผู้ใช้/คู่มือ
4. หาขั้นแรกสุดที่ถูกกระทบ → ขั้นนั้นและหลังจากนั้นทำใหม่ · R ขึ้น = ทำขั้นที่ R ใหม่บังคับ
5. เสนอ Owner: ทางเลือก ก/ข (เช่น ทำเลย vs รอบหน้า) + แนะนำ 1 ทาง + ผลต่อเวลา + สิ่งที่บล็อก (`board.mjs post`)
6. Owner re-ack (dated comment) → อัปเอกสารที่กระทบเป็นฉบับใหม่ (ฉบับเดิม `superseded`) · เพิ่มแถว traceability ใหม่
7. กระทบเวลา/ขนาด → skill `planning` จัดลำดับใหม่ · แล้วเดินต่อจากขั้นที่ย้อน

## ออก
- ใบ change request (`R-NNNN`) · คำตัดสิน Owner · เอกสารฉบับใหม่ · ADR ถ้าเปลี่ยนคำตัดสินออกแบบ · `docs/HANDOFF.md` อัป

## หยุดถาม Owner เมื่อ
- ทุกครั้งก่อนเริ่มทำตาม scope ใหม่ (re-ack บังคับ) · change ขัดกับ ADR เดิม · ต้องทิ้งงานที่ทำไปแล้ว

## ห้าม
- ทำ scope ใหม่ก่อน re-ack · แก้เอกสารที่ ack แล้วเงียบ ๆ · ลดด่านเพราะ "เปลี่ยนนิดเดียว"
