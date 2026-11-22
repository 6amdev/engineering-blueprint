# Stack

> เลือกต่อโปรเจกต์ แล้วบันทึกเป็น ADR · หน้านี้บอกค่าเริ่มต้นที่ blueprint รองรับและเกณฑ์เลือก

ทุกบรรทัดที่ต้องตัดสินก่อนเริ่มงานอยู่ `docs/stack-decisions.md` (แม่แบบ `templates/stack-decisions.md` · คำถาม `docs/intake-map.md` หมวด F)

หลักการ: ค่าเริ่มต้นเป็นกลางและสามัญ · ไม่บังคับผลิตภัณฑ์ของผู้ขายเจ้าใด · เลือกแล้วบันทึกใน `docs/decisions/` (ADR) พร้อมเหตุผลและทางเลือกที่ไม่เลือก

## เกณฑ์เลือกกลาง (ใช้กับทุกส่วน)
เรียงตามความสำคัญ: ทีมดูแลได้ · ชุมชน/การสนับสนุนระยะยาว (เวอร์ชัน LTS) · ความปลอดภัย (มีแพตช์สม่ำเสมอ) · licence เข้ากับโปรเจกต์ · ย้ายออกได้ (ไม่ผูกแน่น) · ต้นทุน · agent เขียนและทดสอบได้ง่าย (เอกสารดี ตัวอย่างเยอะ)

## ชุดตัวอย่างให้เลือก (จุดตั้งต้นสำหรับคนที่ยังไม่แน่ใจ)
ไม่ใช่ข้อบังคับ ปรับให้ตรงงานแล้วลง `docs/stack-decisions.md` · ราคาให้ตรวจ ณ วันที่เลือก
| ชุด | ประกอบด้วย | เหมาะกับ | ข้อดี | ข้อเสีย |
|---|---|---|---|---|
| A เล็กสุด | Node LTS + SQLite + HTML/CSS/JS · เครื่องเดียว | งานภายในคนน้อย ต้นแบบ | ถูก ติดตั้งง่าย dependency แทบไม่มี ย้ายง่าย | ผู้ใช้พร้อมกันและการขยายจำกัด ต้องทำ UI เอง |
| B เว็บทีม | React + TypeScript · Node API · PostgreSQL · container + reverse proxy | ระบบหลังบ้านหลายหน้า หลายคนใช้ | คนทำเป็นเยอะ ขยายได้ เทสครบ | ชิ้นส่วนมากขึ้น ต้องดูแล server และ DB |
| C เว็บสาธารณะ | เว็บแบบ static/SSR + managed DB + hosting สำเร็จรูป | ต้องติด search คนเข้าไม่แน่นอน | เริ่มเร็ว ขยายเอง | ค่าใช้จ่ายโตตามการใช้ ผูกผู้ให้บริการ |
| D องค์กร | B + SSO (OIDC) · สิทธิ์ละเอียด · audit log · คิว · log รวมศูนย์ | ข้อมูลสำคัญ หลายแผนก | ควบคุมและตรวจย้อนได้ | แพงและช้ากว่า ต้องมี Ops |
| E มือถือ | PWA ก่อน → แอป native เมื่อจำเป็น | ใช้บนมือถือเป็นหลัก | PWA ไม่ต้องขึ้น store | native แพงกว่า ต้องดูแลสองระบบ |
| F งานอัตโนมัติ / AI | worker + คิว + ตั้งเวลา + model API | ประมวลผลเอกสาร สรุป แจ้งเตือน | เริ่มเล็กได้ | ต้องคุมงบ token ตรวจคำตอบ และข้อมูลที่ส่งออก |

## backend (ค่าเริ่มต้น: Node.js LTS + ฐานข้อมูลที่เลือก)
- Runtime: Node.js เวอร์ชัน LTS ที่ยัง active · ล็อกเวอร์ชันใน `.nvmrc` / `engines`
- ฐานข้อมูล เลือกตามรูปแบบข้อมูล:
  - เชิงสัมพันธ์/ธุรกรรม/ต้อง consistency สูง (เช่น การจอง) → relational
  - เอกสารยืดหยุ่น/สคีมาเปลี่ยนบ่อย → document store
  - cache/คิว/ข้อมูลชั่วคราว → key-value
  - อนุกรมเวลา/ค้นข้อความ → ตัวเฉพาะทางเมื่อจำเป็นจริง
- ตัดสินจาก: ปริมาณข้อมูล · รูปแบบ query · ต้องการ transaction ไหม · ทีมคุ้นอะไร · วิธี backup/restore · ค่าโฮสต์
- API: REST หรือ GraphQL ตามผู้ใช้ API · มี schema/สัญญา (เช่น OpenAPI) และ version
- กรอกต่อโปรเจกต์: DB ที่เลือก · framework · ORM/query layer · แนวทาง migration

## frontend (ค่าเริ่มต้น: React)
- React + TypeScript (แนะนำ) · build tool สมัยใหม่ · component library หนึ่งชุดเพื่อความสม่ำเสมอ
- เกณฑ์: ต้อง SSR/SEO ไหม (เว็บสาธารณะ) หรือเป็นแอปที่ต้องเข้าสู่ระบบ (SPA พอ) · รองรับมือถือ 375px · a11y (WCAG 2.2 AA) · ขนาด bundle
- บังคับ: responsive 375px ทั้ง light/dark · ข้อความที่ผู้ใช้เห็นผ่านตัวจัดการข้อความ (รองรับหลายภาษาถ้าต้อง)
- กรอกต่อโปรเจกต์: framework · ระบบ styling · state management · i18n

## เทส
- ตัวรันมาตรฐาน `node --test` สำหรับ unit/integration ฝั่ง Node · ใช้ตัวอื่นได้ถ้ามีเหตุผลใน ADR
- ระดับ: L1 unit/integration ใน dev/CI · L2 บน UAT ผ่านระบบจริง · E2E/real-UI สำหรับเส้นทางหลักที่ 375px
- พีระมิดเทส: unit มาก · integration พอสมควร · E2E น้อยแต่ครอบ journey สำคัญ
- เทสต้องเสถียร (ไม่พึ่งเวลา/ลำดับ/เครือข่ายจริง) และ RED ก่อนเขียนโค้ด
- กรอกต่อโปรเจกต์: เครื่องมือ E2E · เกณฑ์ coverage (ถ้ามี) · เครื่องมือ load test (GATE-PERF)

## infra (container · reverse proxy + TLS · log รวมศูนย์)
- Container: build image ครั้งเดียวต่อ SHA · base image ที่มีคนดูแล · รันด้วย user ไม่ใช่ root · เล็กที่สุดที่ยังพอ
- Reverse proxy + TLS: terminate TLS ที่ขอบ · บังคับ HTTPS · security headers (nosniff, frame, referrer, HSTS) · ต่ออายุใบรับรองอัตโนมัติ
- Log รวมศูนย์: structured · ค้นได้ · retention · ไม่มี PII/secret (ดู `docs/operations.md`)
- เกณฑ์เลือกโฮสต์: availability ที่ต้องการ (SLO) · งบ · ทักษะทีม · ที่ตั้งข้อมูลตามกฎหมาย (data residency) · ทางออก (exit)
- Config และ secret ผ่าน environment ไม่อยู่ใน image/git
- กรอกต่อโปรเจกต์: ผู้ให้บริการ/โฮสต์ · วิธี orchestration · โครงสร้างเครือข่าย (ไม่ใส่ IP/โฮสต์จริงใน repo สาธารณะ)

## CI/CD
- CI ที่ให้มา: secret-scan · test (ถ้ามี) · build คู่มือ · เพิ่มต่อโปรเจกต์: lint · build ของระบบ · SCA (เมื่อ GATE-DEPS) · ต้องผ่านก่อน merge
- CD: build artifact เดียว → UAT → prod โดยมีด่านอนุมัติคน · รายละเอียดใน `docs/deploy.md`
- กรอกต่อโปรเจกต์: เครื่องมือ CI/CD · runner · ที่เก็บ artifact/image

## เครื่องมือทีม (บอร์ดงาน · แชต · AI coding agent)
- บอร์ดงาน: adapter `local` (ค่าเริ่มต้น) · `trello` · `github` · `none` — เลือกตามขนาดทีมและความต้องการรายงาน
- แชต: ช่องทางแจ้งเตือน/ถามตอบ · ห้ามส่ง secret/PII
- AI coding agent: เครื่องมือใดก็ได้ที่อ่าน `AGENTS.md` · เกณฑ์: ความปลอดภัยของโค้ดที่ส่งออก · การควบคุมสิทธิ์ · นโยบายข้อมูลของผู้ให้บริการ · ต้นทุน
- กรอกต่อโปรเจกต์: เครื่องมือที่ใช้ · ใครมีสิทธิ์อะไร

## 12-Factor checklist
- [ ] 1 Codebase: repo เดียว หลาย deploy
- [ ] 2 Dependencies: ประกาศชัด + lockfile · ไม่พึ่งของที่ติดตั้งไว้ในเครื่อง
- [ ] 3 Config: อยู่ใน environment ไม่ใช่ในโค้ด
- [ ] 4 Backing services: DB/cache/คิว เป็นทรัพยากรที่เปลี่ยนได้ด้วย config
- [ ] 5 Build/release/run: แยกขั้น · release มีเวอร์ชัน = SHA
- [ ] 6 Processes: stateless · สถานะอยู่ใน backing service
- [ ] 7 Port binding: service เปิดพอร์ตเอง
- [ ] 8 Concurrency: ขยายด้วยจำนวน process
- [ ] 9 Disposability: เริ่ม/หยุดเร็ว ปิดอย่างนุ่มนวล
- [ ] 10 Dev/prod parity: สภาพแวดล้อมใกล้กันที่สุด
- [ ] 11 Logs: เขียน stdout เป็น stream ให้ระบบรวมเก็บ
- [ ] 12 Admin processes: งานครั้งเดียว (migration/สคริปต์) รันใน environment เดียวกับแอป

## ทางเลือกอื่น + เกณฑ์เลือก
- ไม่ใช่ Node.js: ได้ ถ้าทีมถนัดกว่าและมี test runner + lint + CI เทียบเท่า · ปรับคำสั่งใน `AGENTS.md` §8 และเกณฑ์เทสในหน้านี้
- ไม่ใช่ React: ได้ ถ้าเน้นเนื้อหา/SSR หรือทีมมี framework ที่ชำนาญกว่า · ต้องผ่าน a11y + 375px เท่าเดิม
- ไม่ใช้ container: ได้สำหรับระบบเล็ก ถ้ายังมี artifact ที่ immutable ต่อ SHA + ถอยได้ด้วยการสลับ
- ทุกการเบี่ยงจากค่าเริ่มต้น = ADR สั้น: บริบท · ทางเลือก · เหตุผล · ผลที่ตามมา
