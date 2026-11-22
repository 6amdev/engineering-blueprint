# Contributing

> สถานะ: v0.3.0 (2026-11-21)
> ขอบคุณที่ช่วยปรับ blueprint · อ่าน `AGENTS.md` ก่อน (กติกาเดียวกันใช้กับคนและ agent)

## 1. กฎข้อแรก: public-safe
repo นี้เป็นสาธารณะ · ใส่ได้เฉพาะเนื้อหาทั่วไปที่คุณมีสิทธิ์เผยแพร่ **ไม่ใส่ข้อมูลลับหรือข้อมูลส่วนบุคคล**
- บทเรียนจากงานจริง → เขียนกลับมาเป็น **หลักการทั่วไปด้วยคำของคุณเอง** เท่านั้น
- ตัวอย่างใช้ค่ากลาง: `example.com` · `R-0001` · `C-0001` · "ระบบจองห้องประชุม" · บทบาทแทนชื่อคน
- อ้างมาตรฐานด้วยชื่อ (OWASP ASVS, WCAG 2.2, ISO/IEC 25010 …) ไม่ลอกข้อความยาว
- กันพลาด: ใส่คำที่รู้ว่าห้ามหลุดไว้ใน `blueprint.config.json` → `forbidden_words` ในเครื่อง (ไฟล์นี้ไม่ขึ้น git) · hook `pre-commit` จะบล็อก

## 2. ตั้งเครื่อง
```bash
npm install            # เปิด git hooks (.githooks/) ให้อัตโนมัติ
npm run secret-scan    # สแกนทั้ง repo
npm run docs:build     # ต้องผ่านถ้าแก้ site/
```
- hook `commit-msg` = Conventional Commits · `pre-commit` = ค่าลับ / IP / คำต้องห้าม
- ห้าม `--no-verify` · ห้าม unset `core.hooksPath` · hook ปฏิเสธ = แก้ต้นเหตุ ไม่เลี่ยง

## 3. Commit (Conventional Commits 1.0)
`<type>(<scope>)?: <สรุปภาษาอังกฤษ รูปคำสั่ง>` · type: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`
- ตัวอย่าง: `docs(gates): add GATE-A11Y checklist` · `fix(board): reject card ids with path separators`
- commit เล็ก 1 เรื่อง · body บอก "ทำไม" · รายละเอียด `docs/git.md` §3

## 4. PR flow
1. fork → branch `<type>/<สั้น>` จาก `main`
2. แก้ + ทดสอบในเครื่อง (สคริปต์ที่แก้รันได้ · `npm run secret-scan` · `npm run docs:build` ถ้าแก้ site)
3. เปิด PR ตามแม่แบบ `templates/code-review.md`: แก้อะไร · ทำไม · ทดสอบยังไง · กระทบโปรเจกต์ที่สร้างไปแล้วไหม
4. CI เขียว + review อย่างน้อย 1 → squash merge · แก้ตาม review เป็น commit ใหม่ (ไม่ force-push ระหว่าง review)
5. เปลี่ยนพฤติกรรม = อัปเดต `CHANGELOG.md` (Keep a Changelog) · maintainer ขึ้น `VERSION` ตอน release (SemVer)

## 5. เสนอเปลี่ยนวิธีทำงาน (ADR)
เปลี่ยนกติกา workflow ด่าน lane บทบาท หรือเพิ่ม/ลบ skill / agent = เปิด ADR ก่อนแก้ (โครงตั้งต้นของ v0.3.0 ไม่มี ADR ย้อนหลัง):
1. คัดลอก `docs/decisions/0000-template.md` → `docs/decisions/NNNN-<slug>.md` (เลขถัดไป)
2. เขียน: บริบท (ปัญหาทั่วไป ไม่ใช่เรื่องของโปรเจกต์ใด) · ทางเลือก ≥ 2 · ข้อเสนอ · ผลตามมา · กระทบโปรเจกต์เดิมอย่างไร
3. เปิด PR ที่มีแค่ ADR (สถานะ "เสนอ") → คุยใน PR → "รับ" แล้วค่อยเปิด PR แก้จริงที่อ้าง ADR
- **ด่านไม่ลดลง:** ข้อเสนอที่ตัดด่านหรือการอนุมัติออกต้องแสดงว่าอะไรมาแทนที่ให้ความปลอดภัยเท่าเดิม

## 6. แจ้งปัญหา
- bug / ข้อเสนอทั่วไป: เปิด issue (ใช้ค่าตัวอย่าง ไม่แนบข้อมูลจริง)
- ช่องโหว่: **ห้ามเปิด issue สาธารณะ** — ดู `SECURITY.md`
