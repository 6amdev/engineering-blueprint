---
name: planning
description: จัด backlog ก่อน intake — รวมคำขอ จัดลำดับ (RICE / MoSCoW) ประเมินขนาด (T-shirt) วาง roadmap คุม WIP limit แล้วเลือกการ์ดถัดไป. ใช้เมื่อเจ้าของพูดว่า "ทำอะไรก่อนดี", "จัดลำดับงาน", "วางแผน", "roadmap", "backlog", "งานถัดไป", "plan the backlog", "prioritize", "what next", "sprint planning".
---
# planning — จัด backlog ก่อนหยิบงาน

> agent: intake-analyst (BA/PM) · ต่อด้วย skill `intake`

## ใช้เมื่อ
- มีคำขอใหม่หลายเรื่อง · จบ release · retro เสนอให้จัดใหม่ · change request กระทบเวลา/ขนาด

## เข้า
- `docs/backlog.md` (ไม่มี = สร้าง) · `docs/HANDOFF.md` · การ์ดที่เปิดอยู่ · ผล retro ล่าสุด `docs/retros/`

## ขั้นตอน
1. รวมคำขอเป็นแถวใน `docs/backlog.md`: รหัส · ชื่อสั้น · lane เบื้องต้น · ใครขอ (บทบาท) · ขึ้นกับอะไร
2. ประเมินขนาด T-shirt: S (≤ 1 วัน) · M (2–3 วัน) · L (≤ 1 สัปดาห์) · XL (> 1 สัปดาห์ = **แตกก่อน**) · ไม่รู้ = spike ขนาด S เพื่อหาคำตอบ
3. จัดลำดับ:
   - มีข้อมูลตัวเลข → RICE = Reach × Impact × Confidence ÷ Effort (เขียนค่าที่ใช้ทุกช่อง)
   - ไม่มี → MoSCoW (Must / Should / Could / Won't this time)
   - `hotfix` แซงทุกอย่าง · `bug` S1–S2 แซง feature · ช่องโหว่ High/Critical จาก GATE-DEPS ขึ้นบน
4. roadmap: Now (รอบนี้) · Next · Later · ไม่ใส่วันที่ที่ไม่มีใครรับปาก
5. เช็ค WIP limit (`docs/workflow.md`) · เกิน = ไม่หยิบใหม่ ให้ปิดงานค้างก่อน
6. เสนอลำดับให้ Owner เป็นตัวเลือก ก/ข + แนะนำ 1 ทาง + เหตุผล · Owner ยืนยัน (dated comment)
7. การ์ดบนสุดที่ไม่ติดอะไร → ส่ง skill `intake`

## ออก
- `docs/backlog.md` อัป (ตาราง: รหัส · lane · ขนาด · คะแนน/MoSCoW · Now/Next/Later · ขึ้นกับ) · การ์ดถัดไป · `docs/HANDOFF.md` อัป

## หยุดถาม Owner เมื่อ
- ลำดับขึ้นกับคุณค่าทางธุรกิจที่ repo ไม่บอก · ต้องตัดของที่เคยรับปาก · คำขอขัดกัน · ต้องจัดเป็น Won't
- ความเงียบไม่ใช่การอนุมัติ · ลำดับเปลี่ยนเมื่อ Owner ยืนยัน

## ห้าม
- หยิบ XL โดยไม่แตก · ใส่วันเสร็จแทนทีม · ข้าม intake เพราะ "อยู่ใน backlog แล้ว"
