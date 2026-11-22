---
name: requirements
description: แปลง brief จาก intake เป็น PRD + user stories + acceptance criteria (Given/When/Then) + NFR แล้วขอ owner ack. ใช้เมื่อ "เขียน PRD", "แตก user story", "requirements", "ความต้องการ", หลัง intake ผ่าน DoR.
---
# requirements — brief เป็น PRD + user stories

> ขั้น 1

## เมื่อไหร่ใช้
หลัง intake ผ่าน DoR · lane `feature` เสมอ · `change` ใช้เฉพาะส่วนที่เปลี่ยน · `bug` ข้ามยกเว้นการแก้เปลี่ยนพฤติกรรม · งานเล็ก R1 ใช้ brief แทน PRD ได้ (ระบุบนการ์ด)

## input
- `docs/requirements/NNNN-slug.md` (brief) · ADR/โค้ดเดิม · ระดับ R · ด่านเงื่อนไขที่เปิดไว้

## ขั้นตอน
1. **อ่าน brief + repo** · ตอบเองได้จากเอกสาร = ไม่ถามซ้ำ
2. **PRD** จาก `templates/prd.md`: ปัญหา · เป้าหมายพร้อมตัวชี้วัด · ผู้ใช้/persona · ขอบเขต (ทำ / **ไม่ทำ**) · สมมติฐาน · ข้อจำกัด · ความเสี่ยง · ความขึ้นต่อกัน
3. **แตกเป็น user story** (`templates/user-story.md`) รูป "ในฐานะ <บทบาท> ฉันต้องการ <ทำ> เพื่อ <ผล>" รหัส `R-NNNN.SNN` (AC = `R-NNNN.SNN.ACN`) · ตามหลัก INVEST (เล็กพอ · ทดสอบได้ · มีค่าเอง)
4. **ทุก story มี acceptance criteria แบบ Given/When/Then** อย่างน้อย 1 ต่อ flow + 1 ต่อเคสผิดปกติหลัก (ว่าง · ซ้ำ · หมดเวลา · ไม่มีสิทธิ์ · พร้อมกัน) · ตรวจได้ด้วยตัวเลข/ตัวอย่าง ไม่ใช้คำลอย ("เร็ว" "ง่าย")
5. **NFR** ตามหัวข้อ ISO/IEC 25010 ที่เกี่ยว: ประสิทธิภาพ · ความปลอดภัย · ความเชื่อถือได้ (SLO) · การใช้งานได้ · การเข้าถึง (WCAG 2.2 AA) · ความเป็นส่วนตัว
6. **จัดลำดับ** MoSCoW (Must/Should/Could/Won't) → MVP vs ทีหลัง · ประเมินขนาด T-shirt คร่าว ๆ
7. **ยืนยันด่านเงื่อนไข**: ระบุว่าเปิดอะไร (UI · PERF · A11Y · PRIVACY · DEPS · OBS) พร้อมเหตุผล · ยืนยัน/แก้ระดับ R
8. **ตาราง traceability**: เป้าหมาย → story → เกณฑ์ผ่าน (ใช้ต่อใน spec)
9. ส่ง owner ยืนยันผ่าน skill `post`: สรุป PRD 5 บรรทัด · ตัวเลือก ก/ข + แนะนำ 1 + เหตุผล + สิ่งที่บล็อก · รอ **ack** บนการ์ด (ลงวัน)

## output
- PRD + stories ใน `docs/requirements/` ใช้เลข `R-NNNN` เดียวกับ brief (แม่แบบ `templates/prd.md` · `templates/user-story.md`) · อัป HANDOFF

## agents
intake-analyst (หลัก) · approval-rehearsal (ซ้อมคำถามก่อนขอ ack) · challenger (ตรวจค้าน R3)

## gates
owner ack ก่อนไป spec · ทุก story มี G/W/T · ไม่มีข้อ "ยังไม่ได้ตรวจ" ที่บล็อกการเริ่ม

## หยุดถาม owner เมื่อ
- กฎธุรกิจ · ลำดับ MVP · เส้นทางเสี่ยงสูง · ข้อความถึงผู้ใช้ · เป้าวัดผล/ตัวเลข SLO

## checklist done
- [ ] PRD ครบหัวข้อ · "ไม่ทำ" ระบุชัด
- [ ] ทุก story มี G/W/T รวมเคสผิดปกติ · NFR ระบุ
- [ ] MoSCoW + MVP · ด่านเงื่อนไข + R ยืนยัน
- [ ] owner ack ลงวันบนการ์ด
