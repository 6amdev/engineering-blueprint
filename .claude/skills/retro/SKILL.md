---
name: retro
description: ทบทวนรอบงานแบบ blameless หลัง release หรือทุก N การ์ด — ตัวเลข DORA, อะไรดี อะไรติด, action ≤ 3 ข้อมีเจ้าของ, บทเรียนเป็น ADR หรือข้อเสนอแก้ blueprint. ใช้เมื่อเจ้าของพูดว่า "retro", "ทบทวน", "สรุปบทเรียน", "รอบนี้เป็นไง", "lessons learned", "retrospective", "what went well".
---
# retro — ทบทวนรอบงาน

> สถานะ: v0.3.0 (2026-11-21) · agent: status-reporter (ตัวเลข) · intake-analyst (สรุป) · แม่แบบ `templates/retro.md`

## ใช้เมื่อ
- หลังทุก release · ทุก N การ์ด (ค่า N อยู่ `docs/workflow.md`) · หลัง postmortem ที่มี action เชิงกระบวนการ

## เข้า
- git log ช่วงนั้น · การ์ดที่ปิด · บันทึก deploy · `docs/postmortems/` · retro รอบก่อน `docs/retros/`

## ขั้นตอน
1. ดึงตัวเลข DORA 4 ตัวจาก git + การ์ด + บันทึก deploy · ไม่มีข้อมูล = เขียน "ยังไม่ได้ตรวจ" ห้ามประมาณ
2. ไล่ action ของรอบก่อน: เสร็จ / ไม่เสร็จ + เพราะอะไร
3. รวบรวมข้อเท็จจริง: ด่านที่ไม่ผ่าน · ขั้นที่ย้อน · change request · hotfix · เวลารอคน (นานสุด 3 อันดับ)
4. แยก "ดี · เก็บไว้" กับ "ติด · ช้า · พัง" · เขียนเป็นระบบ/กระบวนการ ไม่ใช่ตัวคน
5. เลือก action ≤ 3 ข้อที่แก้ต้นเหตุมากสุด · ทุกข้อมีเจ้าของ (บทบาท) · กำหนด · วิธีวัด
6. บทเรียน → ADR ของโปรเจกต์ (ถ้าเป็นคำตัดสิน) · หรือข้อเสนอแก้ blueprint ที่เขียนเป็นหลักทั่วไปเท่านั้น
7. เขียน `docs/retros/YYYY-MM-DD.md` → โพสต์สรุป 5 บรรทัดในการ์ด (`board.mjs post`) → action เข้า backlog (skill `planning`)

## ออก
- `docs/retros/YYYY-MM-DD.md` · action ใน backlog · ADR ใหม่ (ถ้ามี) · `docs/HANDOFF.md` อัป

## หยุดถาม Owner เมื่อ
- action ต้องเปลี่ยนกติกา/ด่าน/บทบาท (ด่านลดไม่ได้ · เพิ่มได้แต่ต้อง ack) · action ต้องใช้งบหรือคนเพิ่ม

## ห้าม
- โทษตัวคน · ใช้ DORA ประเมินคน · คัดลอกชื่อโปรเจกต์/ลูกค้า/คนเข้า blueprint · action ไม่มีเจ้าของ
