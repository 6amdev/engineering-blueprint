---
name: spec
description: เขียน spec (SRS) พร้อม oracle (ผลที่ถูกต้องต่อเคส) และ test inventory ให้ลงมือได้โดยไม่ต้องตีความ ผ่านการตรวจค้านและตรวจ scope ก่อนขอ ack. ใช้เมื่อ "เขียน spec", "specification", "test inventory", "oracle", หลัง PRD ได้ ack.
---
# spec — ข้อกำหนดที่ตรวจได้ + test inventory

> ขั้น 2

## เมื่อไหร่ใช้
หลัง PRD ได้ ack · ข้ามได้ถ้า R1 (ใช้ brief + test inventory ย่อบนการ์ด) · lane `change` ทำเฉพาะส่วนที่เปลี่ยน · `bug` ทำเมื่อการแก้เปลี่ยนพฤติกรรม

## input
- PRD + stories + G/W/T ที่ ack แล้ว · โค้ด/สัญญาเดิม (API · schema) · ระดับ R · ด่านเงื่อนไขที่เปิด

## ขั้นตอน
1. **ไล่ทุก story → พฤติกรรมที่ตรวจได้** เป็นข้อเลขใน spec (`SP-NNNN §x.y`) อ้าง story `R-NNNN.SNN` และ AC · ใช้ภาษา "ต้อง/ห้าม/อาจ" (MUST/MUST NOT/MAY) แบบ RFC 2119 · ข้อละ 1 เรื่อง · ตรวจได้ด้วยเทส
2. **เคสผิดปกติทุกตัว**: ข้อมูลว่าง · ซ้ำ · เกินขีดจำกัด · หมดเวลา · ล้มกลางทาง · พร้อมกัน · ไม่มีสิทธิ์ · อินพุตอันตราย · ผลเมื่อบริการข้างเคียงล่ม
3. **Oracle**: ระบุผลที่ถูกต้องของแต่ละเคสจาก requirement หรือตัวอย่างที่ owner ยืนยัน ไม่คัดจากพฤติกรรมของโค้ด · มีตัวอย่างอินพุต→เอาต์พุต
4. **สัญญา (interface)**: API/event/schema · รหัสข้อผิดพลาด · ความเข้ากันได้ย้อนหลัง · migration · permission ต่อ endpoint
5. **NFR ที่ตรวจได้**: งบ latency/ปริมาณ (→ GATE-PERF) · a11y (→ GATE-A11Y) · ข้อมูลส่วนบุคคล (→ GATE-PRIVACY) · dependency ใหม่ (→ GATE-DEPS) · log/metric/SLO (→ GATE-OBS)
6. **test inventory** ต่อ AC รหัส `T-NNNN-NN`: **L1** (unit/integration ใน dev/CI) · **L2** (UAT ผ่านระบบจริง) · **หน้าจริง** เมื่อ UI เปลี่ยน (375px · ทั้งธีม) · ระบุว่าเทสไหนต้องเขียนก่อนโค้ด
7. **Traceability** ท้าย spec: story → AC → ข้อ spec → เทส → release (`docs/documents.md`) ไม่มีแถวขาด
8. ส่ง **challenger** ตรวจค้าน (R2/R3) · แก้ตามข้อค้านหรือบันทึกเหตุผลที่ไม่รับ
9. **lead-reviewer** ตรวจ scope (ส่วนเกิน · ช่องว่าง) → ขอ **ack** จาก owner-reviewer (skill `post`)

## output
- `templates/spec.md` → `docs/specs/NNNN-slug.md` (`SP-NNNN` · มี test inventory และ traceability ในไฟล์เดียวกัน) · อัป HANDOFF

## agents
solution-architect (เขียน) · challenger (ตรวจค้าน) · lead-reviewer (scope) · approval-rehearsal (ซ้อมคำถามก่อนขอ ack)

## gates
GATE-SPEC: owner-reviewer ack ก่อนขั้น design · challenger บังคับ R2/R3

## หยุดถาม owner เมื่อ
- spec ไม่ระบุพฤติกรรมในเคสที่กระทบธุรกิจ · เส้นทางเสี่ยงสูง · ข้อความผู้ใช้ · สิ่งที่ขัดกับ PRD ที่ ack แล้ว (ต้องเปิด `change`)

## checklist done
- [ ] ทุก story มีข้อ spec (`SP-NNNN §x.y`) · เคสผิดปกติครบ · oracle ไม่ได้มาจากโค้ด
- [ ] test inventory L1/L2/หน้าจริง ต่อเกณฑ์ผ่าน
- [ ] ด่านเงื่อนไขระบุ · traceability ครบ
- [ ] challenger + lead-reviewer ผ่าน · owner-reviewer ack ลงวัน
