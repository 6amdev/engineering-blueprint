---
name: hotfix
description: แก้เหตุบน production ด่วน — บรรเทาก่อน, แก้น้อยสุด, ย่อขั้น 1–3 และช่วง UAT ได้ แต่ไม่ข้ามเทส RED, GATE-VERIFY, GATE-SEC (เส้นทางเสี่ยงสูง), การอนุมัติ Owner/Ops และแผนถอย; ตามด้วย postmortem. ใช้เมื่อเจ้าของพูดว่า "ล่ม", "prod พัง", "ด่วน", "ลูกค้าใช้ไม่ได้", "hotfix", "production down", "incident", "urgent fix", "outage".
---
# hotfix — lane `hotfix`

> สถานะ: v0.3.0 (2026-11-21) · agent หลัก: root-cause-analyst → implementer → test-engineer · กติกาเต็ม `docs/workflow.md` (hotfix)

## ใช้เมื่อ
- prod เสียหรือเสี่ยงเสีย **ตอนนี้** และรอรอบปกติไม่ได้ · ไม่ใช่ = skill `bugfix`

## เข้า
- อาการ + เวลาเริ่ม · ผลกระทบ · sha ที่ขึ้นอยู่ · sha ก่อนหน้าที่ดี (rollback)

## ขั้นตอน
1. เปิดการ์ด lane `hotfix` · แจ้ง Owner + Ops ทันที (`board.mjs post`) · ระดับ R · คนสั่งการ 1 บทบาท
2. **บรรเทาก่อน:** rollback ไป sha ที่ดี / ปิด feature flag / จำกัดผลกระทบ — ถ้าทำได้และปลอดภัย · Ops อนุมัติก่อน
3. brief 3–5 บรรทัดในการ์ด (อาการ · ต้นเหตุที่คาด · การแก้ · ทางถอย) แทนขั้น 1–3
4. root-cause-analyst หาต้นเหตุ (`file:line@sha` · log query + ช่วงเวลา) · ต้องอ่านข้อมูลจริง = ด่าน DB-READ
5. เทส RED ที่ทำซ้ำอาการ → ไม่ผ่าน เก็บหลักฐาน (**ห้ามข้าม**)
6. แก้น้อยสุด → เขียว · ไม่ refactor · ไม่ใส่ของอื่น
7. ด่าน **ห้ามข้าม:** GATE-VERIFY · GATE-SEC เมื่อแตะเส้นทางเสี่ยงสูง (agent security-engineer) · GATE-PRIVACY ถ้าเปิด · secret scan · code review (R3: คนที่ไม่ใช่ author · ทีมคนเดียว = owner บันทึกการรับความเสี่ยง)
8. UAT ช่วงสั้น: smoke + ขั้นทำซ้ำอาการ บน sha เดียวกับที่จะขึ้น
9. ใบ deploy + **rollback plan** → ตรวจตาม checklist ด่าน DEP → Owner/Ops อนุมัติ (dated comment) → Ops ขึ้น → เฝ้าจน metric กลับปกติ
10. ภายใน 5 วันทำการ: skill `postmortem` · งานแก้ถาวร/เทสเพิ่มเข้า backlog เป็น `bug` หรือ `change` · release notes สั้น · `docs/HANDOFF.md`

## ออก
- การ์ดพร้อม timeline · เทส RED→GREEN · ผลด่าน · sha ที่ขึ้น + rollback sha · postmortem นัดแล้ว

## หยุดถาม Owner/Ops เมื่อ
- ทุกการ rollback / deploy / ปิด flag · ต้องเขียนข้อมูล prod (DB-WRITE) · ต้องแจ้งผู้ใช้หรือหน่วยงานภายนอก (เช่น ข้อมูลส่วนบุคคลหลุด) · hook หรือด่านปฏิเสธ

## ห้าม
- ข้าม RED test / GATE-VERIFY / แผนถอย · `--no-verify` · แก้บน prod โดยตรง · author อนุมัติงาน R3 ของตัวเองโดยไม่มีบันทึกการรับความเสี่ยง · ใช้ hotfix กับงานที่ไม่ด่วนจริง
