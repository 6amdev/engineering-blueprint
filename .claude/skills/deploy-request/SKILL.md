---
name: deploy-request
description: จัดทำใบขอ deploy ที่ผู้อนุมัติและ Ops ใช้ได้ทันที — sha ขึ้น/ถอย, ลำดับเป้าหมาย, runbook, ทางถอย. ใช้เมื่อ "ขอ deploy", "ขึ้น prod", "deploy request", "ใบขอขึ้นระบบ", หลังผ่าน UAT.
---
# deploy-request — ใบขอ deploy

> สถานะ: v0.3.0 (2026-11-21) · ขั้น 7

## เมื่อไหร่ใช้
งานผ่าน UAT แล้ว (stage 6) และด่านทั้งหมดผ่าน · ทุก lane ที่ต้องขึ้น production (hotfix ใช้ใบเดียวกันแบบย่อ แต่ไม่ข้าม rollback plan และการอนุมัติ)

## input
- การ์ด · sha ที่ผ่าน UAT · ผลทุกด่าน · test plan L2 + ผล · สถานะ conditional gates ที่เปิดไว้ (รวม GATE-OBS)

## ขั้นตอน
1. **ระดับ R ต่อส่วน** ของงาน (โค้ด · migration · config · ข้อมูล) · ส่วนที่ R3 ระบุผู้อนุมัติคนที่สอง หรือบันทึกการรับความเสี่ยงของ owner (ทีมคนเดียว)
2. **ระบุ commit แบบ hash เต็ม** ทั้งตัวที่จะขึ้นและตัวที่จะย้อนกลับไปใช้ · sha base ต้องเป็น ancestor ของ sha ขึ้น (`git merge-base --is-ancestor`) · sha ตรงกับที่ผ่าน UAT
3. **ลำดับเป้าหมาย** (เช่น UAT → prod ทีละกลุ่ม) + **ด่านระหว่างขั้น**: ตัวชี้วัดที่ดู · เกณฑ์ไปต่อ · เกณฑ์หยุด · เวลาเฝ้า
4. **migration/ข้อมูล**: ย้อนกลับได้ไหม · backup ที่ไหน · ลำดับก่อน/หลังโค้ด (expand → migrate → contract)
5. **rollback plan**: คำสั่ง/ขั้นตอนถอย · เวลาที่ใช้ · จุดที่ย้อนไม่ได้ (ถ้ามี = R3)
6. **GATE-OBS** (ถ้าเปิด): ยืนยันว่า log · metrics · alert · dashboard · SLO · runbook พร้อมก่อนขึ้น
7. **runbook + checklist ให้ Ops** จาก `templates/ops-runbook.md`: คำสั่งทีละขั้น · ผลที่ควรเห็น · เมื่อผิดปกติทำอะไร · ใครติดต่อ
8. **หน้าต่างเวลา** + ผู้ใช้ที่ได้รับผลกระทบ + ต้องประกาศไหม (ข้อความถึงผู้ใช้ = owner อนุมัติ)
9. ตรวจใบด้วย checklist ท้าย skill นี้และด่าน DEP (`docs/gates.md`) · sha/ancestor ตรวจด้วย git หรือผล CI · ครบแล้วโพสต์ผ่าน skill `post`
10. รอการอนุมัติเป็นคอมเมนต์ลงวัน + บทบาท + sha · deploy เฉพาะ sha ที่อนุมัติ · sha เปลี่ยน = ตรวจและขอใหม่

## output
- `templates/deploy-request.md` → `docs/deploys/<card>-deploy-request.md` + โพสต์บนการ์ด

## agents
uat-release (เตรียมใบ + ยืนยัน sha) · runbook-rehearsal (เดิน runbook หาช่องว่าง · GATE-OBS) · lead-reviewer (ตรวจใบ)

## gates
ต้องผ่านครบก่อนยื่น: GATE-VERIFY · GATE-SEC · GATE-REGRESSION · GATE-UI (ถ้า UI เปลี่ยน) · code review · conditional gates ที่เปิดไว้ (PERF · A11Y · PRIVACY · DEPS) · GATE-OBS (ถ้าเปิด)

## หยุดถาม owner เมื่อ
- มีขั้นย้อนกลับไม่ได้ · downtime ที่ผู้ใช้เห็น · เลือกหน้าต่างเวลา · ข้อความประกาศผู้ใช้ · R3 ต้องการผู้อนุมัติคนที่สอง

## checklist done
- [ ] sha ขึ้น/ถอยเต็ม 40 · base เป็น ancestor · ตรง UAT
- [ ] ลำดับเป้าหมาย + ด่านระหว่างขั้น + rollback plan ครบ
- [ ] runbook ให้ Ops · GATE-OBS ผ่าน (ถ้าเปิด)
- [ ] ผลทุกด่านอ้าง sha เดียวกับใบ · ด่าน DEP ตรวจครบ · โพสต์แล้ว
- [ ] การอนุมัติบนการ์ด (ใคร · วัน · sha)
