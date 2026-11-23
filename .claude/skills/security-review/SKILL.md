---
name: security-review
description: ตรวจความปลอดภัยตาม OWASP ASVS (ระดับตาม R) + OWASP Top 10 และส่วน GATE-PRIVACY / GATE-DEPS เมื่อเปิดไว้. ใช้เมื่อ "ตรวจความปลอดภัย", "security review", "GATE-SEC", "ตรวจสิทธิ์", "OWASP", งานแตะ auth/ข้อมูลสำคัญทางธุรกิจ/PII/ค่าลับ.
---
# security-review — ตรวจความปลอดภัย

> ด่าน GATE-SEC เป็นด่านประจำทุกงาน (ลึกตาม R)

## เมื่อไหร่ใช้
ทุกงานที่มีโค้ดเปลี่ยน (ความลึกตาม R) · บังคับเต็มเมื่อแตะสิทธิ์ · ข้อมูล · ค่าลับ · ข้อมูลสำคัญทางธุรกิจ · ข้อมูลย้อนไม่ได้ · ตอนออกแบบ (threat model) และตอน gates (ตรวจโค้ด)

## input
- diff + sha · spec · ตารางบทบาท/สิทธิ์ · ระดับ R · ด่านเงื่อนไขที่เปิด (PRIVACY · DEPS)
- ขอบเขตการทดสอบ: เฉพาะ dev/UAT ของโปรเจกต์ หรือระบบที่เจ้าของอนุญาตเป็นลายลักษณ์อักษร · ห้ามทดสอบเจาะ production

## ขั้นตอน
1. **เลือกระดับ OWASP ASVS ตาม R**: R1 = checklist พื้นฐาน (ค่าลับ · input · authz) · R2 = ASVS L1 · R3 = ASVS L2 (เพิ่มข้อ L3 ได้ถ้า owner ต้องการ) — บันทึกระดับที่ใช้บนการ์ด
2. **Threat model เบา ๆ** (STRIDE): ใครโจมตี · เข้าทางไหน · ทรัพย์สินอะไร · ถ้าพลาดเสียหายอะไร
3. **ตารางสิทธิ์ต่อบทบาท** × ทรัพยากร × การกระทำ · ตรวจ authz ฝั่ง server ทุกเส้น (กัน IDOR/BOLA · privilege escalation)
4. **ไล่ OWASP Top 10** กับ diff: access control · cryptographic failures · injection (SQL/command/XSS) · insecure design · security misconfiguration · vulnerable components · identification & authentication failures · integrity failures · logging & monitoring failures · SSRF
5. **Input/Output**: validate ที่ขอบระบบ (allowlist) · parameterized query · encode ตามบริบท · จำกัดขนาดอัปโหลด/ชนิดไฟล์ · rate limit
6. **Auth/session**: รหัสผ่านแฮชแบบ adaptive · session/token หมดอายุ · cookie `HttpOnly`/`Secure`/`SameSite` · CSRF · MFA ตามความเสี่ยง
7. **ค่าลับ**: `npm run secret-scan` ผ่าน · ไม่มีค่าลับในโค้ด/log/ไฟล์ตัวอย่าง · หมุนค่าถ้าหลุด (แจ้ง owner)
8. **Log/error**: ไม่หลุด PII/ค่าลับ/stack trace ถึงผู้ใช้ · log เหตุการณ์ความปลอดภัยครบ (login ล้มเหลว · เปลี่ยนสิทธิ์)
9. **ผูก GATE-DEPS** (ถ้ามี dependency ใหม่/อัป): SCA หาช่องโหว่ที่รู้ (ให้คะแนน CVSS) + ตรวจ licence เข้ากันได้ + SBOM · อัปเดตที่ไม่จำเป็นอย่าเพิ่ม
10. **ผูก GATE-PRIVACY** (ถ้ามีข้อมูลส่วนบุคคล): data inventory · วัตถุประสงค์ · ฐานทางกฎหมาย/ความยินยอม · ลดข้อมูลให้น้อยสุด · retention · ใครเข้าถึง · การลบ/ส่งออกตามสิทธิ์เจ้าของข้อมูล (PDPA/GDPR)
11. จัดผลตามความรุนแรง (CVSS: Critical/High/Medium/Low) · ต่อข้อ `file:line@sha` + วิธีแก้ · Critical/High = บล็อก
12. ตรวจซ้ำหลังแก้ที่ sha ใหม่ · ผลที่ยังไม่ได้ตรวจเขียน "ยังไม่ได้ตรวจ"

## output
- รายงานบนการ์ด (`templates/card-post.md`) หรือ `docs/reviews/<card>-sec.md` · ระดับ ASVS · ตารางสิทธิ์ · รายการพบ + ความรุนแรง · สถานะ PRIVACY/DEPS

## agents
security-engineer (หลัก) · challenger (threat model ตอนออกแบบ) · regression-tester (สิทธิ์เดิม)

## gates
GATE-SEC (ประจำ) · GATE-PRIVACY · GATE-DEPS (เงื่อนไข) · R3: ผู้อนุมัติคนที่สอง หรือในทีมคนเดียว owner บันทึกการรับความเสี่ยง · High/Critical ผ่านแบบมีเงื่อนไขไม่ได้

## หยุดถาม owner เมื่อ (เฉพาะเรื่องที่ยังไม่ได้ตกลง · ที่ตกลงแล้วตัดสินเอง: `docs/workflow.md`)
- ยอมรับความเสี่ยงที่เหลือ · เปลี่ยนสิทธิ์/นโยบายผู้ใช้ · ข้อมูลส่วนบุคคลชนิดใหม่ · ค่าลับหลุด · ต้องแจ้งผู้ใช้/หน่วยงาน · ข้อมูลสำคัญทางธุรกิจ

## checklist done
- [ ] ระดับ ASVS ตาม R บันทึก · threat model · ตารางสิทธิ์
- [ ] Top 10 ไล่ครบ · secret-scan ผ่าน · log ไม่หลุด
- [ ] DEPS/PRIVACY ทำแล้วถ้าเปิดไว้
- [ ] Critical/High = 0 · Medium แก้หรือ owner-reviewer รับความเสี่ยงลงวัน + ADR · ตรวจซ้ำที่ sha ล่าสุด
