# Deploy

> UAT ก่อนเสมอ → เป้าหมายตามลำดับคงที่ · ถอยได้ทุกขั้น

หลักการ: deploy = ops ทำทีละขั้นตามใบขอที่ตรวจครบ · agent เตรียมใบและช่วยตรวจ ไม่กดขึ้น prod เอง · ทุกขั้นมี checkpoint และทางถอย

## ระดับความเสี่ยง R1 / R2 / R3
| ระดับ | ตัวอย่าง | ผู้อนุมัติ | UAT |
|---|---|---|---|
| R1 ต่ำ | ข้อความ · สไตล์ · doc · refactor ไม่เปลี่ยนพฤติกรรม | Dev + reviewer | ตามปกติ |
| R2 กลาง | feature ใหม่ · แก้ logic ไม่แตะ R3 · migration แบบ additive | Owner-reviewer | บังคับ + L2 |
| R3 สูง | auth/สิทธิ์ · ข้อมูลสำคัญทางธุรกิจ · ข้อมูลส่วนบุคคล · แก้ข้อมูลที่ย้อนไม่ได้ · security | Owner-reviewer + คนที่สองที่ไม่ใช่ผู้เขียน บันทึกบนการ์ด (ทีมคนเดียว: ดู `docs/roles/README.md`) | บังคับ + L2 + หน้าจริง (เมื่อ UI เปลี่ยน) + แผนถอยที่ลองแล้ว |

## หัวข้อบังคับของใบขอ deploy
ใช้ `templates/deploy-request.md` · ผู้ขอไล่ checklist ในใบให้ครบก่อนส่ง · Ops ตรวจซ้ำก่อนขึ้น
- SHA เต็มที่จะขึ้น และ SHA เต็มที่ใช้ถอย (ปัจจุบันบน prod)
- ระดับความเสี่ยง R1/R2/R3 + เหตุผล
- feature flag (ถ้ามี): ชื่อ · ค่าเริ่มต้น · ใครเปิด
- เป้าหมายที่ขึ้น (ตามลำดับ) · คำสั่ง/ขั้นตอนแต่ละขั้น
- แผนถอย: SHA ถอย · วิธี · แผนข้อมูล (ถ้ามี migration) · ลองบน UAT แล้วเมื่อไร
- เช็คหลังขึ้น: version = SHA · healthy · error ไม่เพิ่ม · smoke test ที่ต้องรัน
- ลิงก์: การ์ด · ผล gate ทั้งหมด · บันทึก sign-off UAT · release notes ร่าง
- หน้าต่างเวลา + ใครอยู่เฝ้า

## Pre-check ก่อนขอ
- [ ] gate ผ่านครบที่ SHA เดียวกัน (VERIFY · SEC · REGRESSION + ด่านเงื่อนไขที่เปิด: UI เมื่อ UI เปลี่ยน · PERF · A11Y · PRIVACY · DEPS) · แนบผล CI
- [ ] UAT sign-off บนการ์ด ที่ SHA เดียวกับที่จะขึ้น (SHA เปลี่ยน = UAT ใหม่)
- [ ] R3: มีคนอนุมัติคนที่สอง (ทีมคนเดียว: มีบันทึก Owner รับความเสี่ยง) · แผนถอยลองแล้ว
- [ ] migration (ถ้ามี) = forward-only + แผนถอยข้อมูล + backup ล่าสุดตรวจแล้ว (ดู `docs/db-scripts.md`)
- [ ] secret/config ใหม่ถูกตั้งที่เป้าหมายแล้ว (ไม่อยู่ใน git)
- [ ] GATE-OBS ผ่านก่อน prod ครั้งแรกของระบบ (ด้านล่าง)
- [ ] เวลาไม่ชนช่วงที่ผู้ใช้หนาแน่น/วันหยุดยาว (R3 เลี่ยงวันศุกร์เย็น)

## ลำดับเป้าหมาย
dev → UAT → prod
- กรอกต่อโปรเจกต์: ถ้ามีหลาย service/region ให้ระบุลำดับ เช่น backend ก่อน frontend, ทีละ region
- ขึ้นทีละเป้าหมาย ผ่านด่านก่อนไปต่อ · ห้ามข้ามเป้าหมาย
- สิ่งที่ backward-compatible ขึ้นก่อน (DB additive → backend → frontend) · ลบของเก่าเป็นรอบแยกทีหลัง (expand/contract)
- build artifact ครั้งเดียว ใช้ตัวเดิมทุกสภาพแวดล้อม (12-Factor: build/release/run แยก) ต่างกันเฉพาะ config

## ด่านระหว่างขั้น
ผ่านทุกข้อจึงไปเป้าหมายถัดไป · ไม่ผ่าน = หยุด → ถอย
- version ที่รันอยู่ = SHA ในใบ
- health check ผ่าน · process/container healthy · restart count = 0
- อัตรา error ไม่เพิ่มจาก baseline · latency ไม่เกินงบ
- smoke test ตาม test plan ผ่าน (L2)
- log ไม่มี error ใหม่ผิดปกติ

## Feature flag / dark launch (ทางเลือก)
ใช้เมื่อ R2/R3 หรืออยากแยก "ขึ้นโค้ด" ออกจาก "เปิดให้ผู้ใช้"
- ขึ้นโค้ดโดย flag ปิด → ตรวจ → เปิดทีละกลุ่ม (internal → ส่วนน้อย → ทั้งหมด)
- flag มีเจ้าของ + วันลบ · flag ค้างเป็น tech debt (งาน `chore`)
- ถอยได้โดยปิด flag โดยไม่ต้อง redeploy

## การถอย (rollback)
ลองบน UAT ก่อนเสมอ · เป้าหมาย: ถอยได้ในไม่กี่นาที
| ชนิด | วิธี |
|---|---|
| โค้ด/artifact | atomic swap กลับไป release ก่อนหน้า (เก็บ release เก่าอย่างน้อย 1 ชุด) หรือ deploy SHA ถอยในใบ |
| config/flag | คืนค่าเดิม/ปิด flag |
| DB | migration forward-only: ถอยด้วย migration ใหม่ที่ย้อนผล หรือ restore จาก backup (ระบุแผนในใบ) · ถ้าข้อมูลใหม่ทำให้โค้ดเก่าพัง ใช้ expand/contract |
- ถอยเมื่อ: ด่านไม่ผ่าน · error พุ่ง · SLO burn สูง · ผู้ใช้กระทบ — ถอยก่อน สืบทีหลัง
- ถอยแล้ว: เช็คด่านเหมือนตอนขึ้น · เขียนลงการ์ด · เปิดงาน `bug`/postmortem ตามความรุนแรง

## Hotfix deploy path
ใช้ skill `hotfix` · เส้นทางย่อ ไม่ใช่เส้นทางข้าม
- ย่อได้: stages 1–3 · หน้าต่าง UAT · เอกสารยาว
- ข้ามไม่ได้: เทส RED · GATE-VERIFY · GATE-SEC (เมื่อแตะเส้นทางเสี่ยงสูง R3) · อนุมัติ Owner/Ops · แผนถอย
- ใบขอ deploy ยังต้องมี SHA ขึ้น/ถอย + เช็คหลังขึ้น · ไล่ checklist ในใบเหมือนเดิม
- หลังจบ: postmortem (skill `postmortem`) + งานตามเก็บเข้า backlog

## หลังขึ้น: เฝ้า · ตรวจข้อมูล
- หน้าต่างเฝ้า (watch window): กรอกต่อโปรเจกต์: ระยะเวลา (แนะนำ R1 30 นาที · R2 2 ชม. · R3 24 ชม.) · ดู error rate, latency, restart, log, metric ธุรกิจสำคัญ
- ก่อนพ้นหน้าต่าง ห้ามเริ่ม deploy ซ้อน
- ตรวจข้อมูล: ถ้ามี migration/backfill ยืนยันว่าข้อมูลครบ (นับ/ตรวจตัวอย่างด้วยสคริปต์อ่านอย่างเดียว) แล้วบันทึกบนการ์ด
- ปิด: บันทึกผลบนการ์ด → release notes → อัปเดต `docs/HANDOFF.md`

## GATE-OBS (ก่อน prod ครั้งแรก)
runbook-rehearsal/ops ตรวจ ผ่านครบจึงขึ้น prod:
- [ ] logs: มีโครงสร้าง ไม่มี PII/secret รวมศูนย์ค้นได้
- [ ] metrics: อัตราคำขอ · error · latency · saturation
- [ ] alert: ผูกกับ SLO + มีผู้รับ
- [ ] dashboard: ดูสถานะรวมได้ในหน้าเดียว
- [ ] SLO กำหนดแล้ว (ดู `docs/operations.md`) · runbook ใน `docs/runbooks/` มี (`templates/ops-runbook.md`)
- [ ] backup + ทดสอบ restore แล้ว

## CI/CD pipeline
- **CI** (`.github/workflows/ci.yml` · new-project วางให้ · ทำงานเองทุก push/PR เมื่อมี repo บน GitHub): secret-scan · `gate.mjs audit` ทุก commit · lint · test · build ของโปรเจกต์ (ถ้ามี script ชื่อนั้น) · build คู่มือ · ต้องผ่านก่อน merge
- **CD** (`.github/workflows/deploy.yml` + `scripts/deploy.sh` · new-project วางให้): กดเองที่ GitHub → Actions → deploy → เลือก deploy/rollback · uat/prod · การ์ด → ตรวจด่านและคำอนุมัติบนโค้ดนั้นด้วย `gate.mjs check` (prod = ขั้น release) → build → ขึ้นแบบสลับ folder → เช็ค `HEALTH_URL` → ไม่ผ่านถอยเอง · ไม่รันเองตอน push เพราะขึ้นระบบต้องมีคนตัดสิน
- ตั้งครั้งเดียวต่อโปรเจกต์: GitHub → Settings → Environments → `uat` · `prod` (prod ติ๊ก Required reviewers = Ops + Owner-reviewer) → ใส่ secrets `DEPLOY_HOST` · `DEPLOY_USER` · `DEPLOY_SSH_KEY` (key เฉพาะ deploy ไม่ใช่ของคน) · `DEPLOY_KNOWN_HOSTS` (`ssh-keyscan <host>`) · `DEPLOY_PATH` · `HEALTH_URL` · บน server ให้เว็บ/service ชี้ไปที่ `<DEPLOY_PATH>/current`
- กรอกต่อโปรเจกต์: ระบบที่ไม่ได้ขึ้นแบบ ssh + ไฟล์ (cloud · container) แก้ `upload` / `swap` ใน `scripts/deploy.sh` · service ที่ต้อง restart เติมใน `after_swap` · ใบขอ deploy ยังต้องมีเหมือนเดิม (workflow ไม่แทนใบ)

## DORA metrics ที่ติดตาม
ดูเป็นแนวโน้มต่อทีม ไม่ใช้วัดตัวบุคคล · ทบทวนใน retro
| metric | ความหมาย | ที่มา |
|---|---|---|
| Deployment frequency | ความถี่ขึ้น prod | ใบ deploy / release |
| Lead time for changes | จาก commit → prod | git + การ์ด |
| Change failure rate | % deploy ที่ต้องถอย/hotfix | ใบ + การ์ด hotfix |
| Time to restore (MTTR) | จากเริ่ม incident → กลับปกติ | postmortem |
