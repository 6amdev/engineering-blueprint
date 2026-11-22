# มาตรฐานที่ใช้

> สถานะ: v0.3.0 (2026-11-21) · ใช้มาตรฐานสากลที่เป็นที่รู้จัก เพื่อให้คนใหม่/agent ใหม่เข้าใจตรงกันทันที
> แต่ละข้อ: ใช้ที่ขั้นไหน · ทำไม · กฎ 1–3 บรรทัด · รายละเอียดด่านอยู่ `docs/gates.md`

## ตารางสรุป
| มาตรฐาน | ขั้นที่ใช้ | ด่าน / เอกสาร | ทำไม |
|---|---|---|---|
| DoR / DoD | 0 · 9 | `docs/workflow.md` | ทุกคนรู้ว่าเริ่มได้/เสร็จแล้วคืออะไร |
| User story + Given/When/Then | 1 · 2 | `templates/user-story.md` | เกณฑ์ผ่านกลายเป็นเทสได้ตรง ๆ |
| ISO/IEC 25010 | 0 · 1 · 2 | non-functional ใน brief/spec | ไม่ลืมคุณภาพที่ไม่ใช่ฟีเจอร์ |
| C4 model | 3 | `templates/design-brief.md` | ภาพระบบระดับเดียวกันทุกโปรเจกต์ |
| ADR (Nygard / MADR) | 3 · การตัดสินใจที่มีผลระยะยาว | `docs/decisions/` | รู้ว่าตัดสินอะไร เมื่อไร เพราะอะไร |
| Test pyramid · TDD | 4 · 5 | GATE-VERIFY | เทสเร็ว ถูก และจับบั๊กได้จริง |
| OWASP Top 10 · ASVS | 2 · 5 | GATE-SEC | checklist ความปลอดภัยที่ตรวจได้ |
| CVSS | 5 | GATE-SEC | จัดระดับช่องโหว่แบบเดียวกัน |
| SCA · SBOM | 5 | GATE-DEPS | รู้ว่าใช้ของใคร มีช่องโหว่/licence อะไร |
| WCAG 2.2 AA | 2 · 5 · 6 | GATE-A11Y | ทุกคนใช้งานได้ · หลายประเทศบังคับ |
| PDPA / GDPR (หลักการ) | 0 · 2 · 5 | GATE-PRIVACY | ข้อมูลส่วนบุคคลถูกกฎหมายและปลอดภัย |
| 12-Factor App | 3 · 4 · 7 | GATE-REGRESSION · DEP | ขึ้นได้ทุกที่ ค่าลับไม่อยู่ในโค้ด |
| Conventional Commits | 4 | hook `commit-msg` | ประวัติอ่านง่าย · สร้าง CHANGELOG ได้ |
| SemVer | 8 | `CHANGELOG.md` | ผู้ใช้รู้ว่าอัปแล้วพังไหม |
| Keep a Changelog | 8 | `CHANGELOG.md` | รูปแบบบันทึกการเปลี่ยนที่คนอ่านได้ |
| Diátaxis | 8 | `site/` · `docs/` | เอกสารแยกตามสิ่งที่ผู้อ่านต้องการ |
| SRE: SLI / SLO / error budget | 2 · 7 · ดูแล | GATE-OBS · `docs/operations.md` | ตกลงกันด้วยตัวเลขว่าระบบดีพอไหม |
| Blameless postmortem | หลัง incident | `templates/postmortem.md` | เรียนจากเหตุโดยไม่โทษคน |
| DORA metrics | retro | `templates/retro.md` | วัดว่าทีมส่งงานเร็วและนิ่งขึ้นไหม |
| RACI | ทุกขั้น | `docs/roles/` | รู้ว่าใครทำ ใครอนุมัติ ใครต้องรู้ |
| ISO/IEC 27001 Annex A (แนวคิด) | ทั้งระบบ | `AGENTS.md` §7 · `docs/git.md` | กรอบควบคุมความปลอดภัยที่องค์กรคุ้น |

## Definition of Ready / Done
- DoR ไม่ครบ = ไม่เริ่มขั้น 1 · DoD ไม่ครบ = ไม่ปิดการ์ด · ทั้งสองอยู่ `docs/workflow.md` ที่เดียว

## User story + acceptance criteria (Given/When/Then)
- story: "ในฐานะ <บทบาท> ฉันต้องการ <สิ่งที่ทำ> เพื่อ <ผล>" · ผ่านเกณฑ์ INVEST (เล็ก · ตรวจได้ · แยกกันได้)
- AC เขียน Given/When/Then · 1 AC = เทสอย่างน้อย 1 ตัว · คำกำกวม ("เร็ว", "ง่าย") ต้องเป็นตัวเลข

## ISO/IEC 25010 (non-functional checklist)
- ตอน intake/spec ไล่ครบ 9 ด้านของ ISO/IEC 25010:2023: functional suitability · performance efficiency · compatibility · interaction capability (usability) · reliability · security · maintainability · flexibility (portability) · safety
- ด้านที่เกี่ยว = เขียนเป้าเป็นตัวเลข · ไม่เกี่ยว = เขียน "ไม่เกี่ยว เพราะ …" · ด้านที่มีตัวเลขเปิดด่านตาม (เช่น performance → GATE-PERF)

## ADR · C4
- ADR ต่อการตัดสินใจที่มีผลระยะยาว (ย้อนยาก · กระทบหลายส่วน) · รูปแบบ MADR: บริบท · ทางเลือก · ตัดสิน · ผลตามมา · วันที่ · ผู้ตัดสิน
- ADR ไม่แก้ย้อนหลัง · เปลี่ยนใจ = ADR ใหม่ที่ supersede ฉบับเดิม
- C4: ทำ Context + Container ทุกระบบ · Component เฉพาะส่วนที่ซับซ้อน · Code ไม่ต้องวาด

## Conventional Commits · branch strategy · SemVer · CHANGELOG
- commit: `type(scope): สรุป` (`feat` · `fix` · `docs` · `refactor` · `test` · `chore` · `perf` · `ci`) · เปลี่ยนแบบไม่เข้ากัน = `!` หรือ `BREAKING CHANGE:` · hook `commit-msg` ตรวจ
- branch สั้น อายุไม่กี่วัน · squash-merge · รายละเอียด `docs/git.md`
- SemVer `MAJOR.MINOR.PATCH`: ไม่เข้ากัน = MAJOR · ฟีเจอร์ = MINOR · แก้บั๊ก = PATCH · CHANGELOG แบบ Keep a Changelog (หัวข้อ Added · Changed · Deprecated · Removed · Fixed · Security) มี `Unreleased` ด้านบนเสมอ

## Code review checklist
- ตาม `templates/code-review.md`: ถูกตาม spec · เทสครอบ AC · อ่านรู้เรื่อง · ไม่มีค่าลับ/PII · error handling · ไม่เกิน scope
- PR เล็ก (แนะนำ ≤ 400 บรรทัดที่เปลี่ยน) · R3 ต้องมีคนอนุมัติที่ไม่ใช่ผู้เขียน (ทีมคนเดียว: ดู `docs/roles/README.md`)

## Test pyramid · coverage · contract test
- เทส unit มากสุด · integration รองลงมา · end-to-end น้อยแต่ครอบ flow หลัก · L1 = dev/CI · L2 = UAT ผ่านระบบจริง
- RED ก่อนโค้ด · oracle = spec · ห้ามแก้เทสให้ตรงโค้ด
- coverage ใช้ดูจุดที่ไม่มีเทส ไม่ใช่เป้า · กรอกต่อโปรเจกต์: ค่าต่ำสุดของโค้ดใหม่ (แนะนำ 80% บรรทัดของไฟล์ที่แตะ)
- ระบบที่คุยกันผ่าน API/event มี contract test ทั้งฝั่งเรียกและฝั่งให้

## OWASP ASVS / Top 10 · secret scanning · dependency audit · SBOM
- ทุกงานไล่ OWASP Top 10 ส่วนที่เกี่ยว · ASVS ตามระดับ R: R1 checklist พื้นฐาน · R2 ASVS L1 · R3 ASVS L2
- จัดระดับ finding ด้วย CVSS · High/Critical (≥ 7.0) บล็อก deploy
- secret scan ทุก commit (hook `pre-commit`) · SCA ทุกครั้งที่ dependency เปลี่ยน · SBOM (CycloneDX หรือ SPDX) สร้างตอน release ถ้าองค์กรต้องการ

## WCAG 2.2 AA
- ทุก UI ที่ผู้ใช้เห็น: contrast · คีย์บอร์ด · focus · label · alt · เป้าแตะ ≥ 24px (แนะนำ 44px) · ไม่ใช้สีอย่างเดียวสื่อความหมาย
- ตรวจด้วยเครื่องมืออัตโนมัติ + ตรวจมือ (เครื่องมือจับได้ไม่หมด)

## PDPA / GDPR (หลักการ)
- เก็บเท่าที่จำเป็น · มีวัตถุประสงค์ + ฐานทางกฎหมาย · เก็บไม่นานเกินจำเป็น · ปลอดภัย · เจ้าของข้อมูลขอดู/แก้/ลบได้ · privacy by design
- ไม่ใช่คำแนะนำทางกฎหมาย · กรอกต่อโปรเจกต์: กฎหมายที่ใช้บังคับ + ผู้ดูแลข้อมูลส่วนบุคคลขององค์กร

## 12-Factor App
- config + ค่าลับมาจาก environment ไม่อยู่ใน repo · build / release / run แยกกัน · process ไม่เก็บ state ในเครื่อง · log ออก stdout · dev/UAT/prod ใกล้กันมากสุด

## CI/CD · progressive delivery · feature flag
- แม่แบบ CI (`templates/github-ci.yml`) รัน secret scan · เทส (ถ้ามี) · build คู่มือ ทุก push/PR · lint เพิ่มต่อโปรเจกต์ · deploy จาก sha ที่ผ่าน UAT เท่านั้น
- ขึ้นทีละเป้าหมาย (เช่น ทีละเครื่อง / canary) + เฝ้า · R3 มีสวิตช์ปิด (feature flag) · flag ที่เปิดเต็มแล้วต้องลบออกภายในรอบถัดไป

## SLO/SLI · incident · blameless postmortem
- ทุก service มี SLI (เช่น สัดส่วน request สำเร็จ · latency p95) + SLO + error budget · alert ตาม budget burn
- incident: บรรเทาก่อน หาต้นเหตุทีหลัง · postmortem แบบ blameless (ระบบ/กระบวนการ ไม่ใช่คน) · action item มีเจ้าของ + กำหนด
- กรอกต่อโปรเจกต์: ค่า SLO ต่อ service ใน `docs/operations.md`

## DORA metrics
- วัด 4 ตัวทุก retro: deployment frequency · lead time for changes · change failure rate · time to restore service
- ใช้ดูแนวโน้มของทีมเอง ไม่ใช้เทียบหรือประเมินคน · ข้อมูลมาจาก git + การ์ด + บันทึก deploy

## Diátaxis (เอกสาร)
- แยกเอกสาร 4 แบบ: tutorial (เรียน) · how-to (ทำงานให้เสร็จ) · reference (ค้น) · explanation (เข้าใจ) · หน้าเดียวไม่ปนหลายแบบ
- คู่มือผู้ใช้ใน `site/` เน้น how-to + reference · `docs/` ของทีมเน้น reference + explanation

## RACI
- ทุกขั้นมี R (ทำ) · A (อนุมัติ, 1 บทบาทเท่านั้น) · C (ปรึกษา) · I (แจ้ง) · ตารางอยู่ `docs/roles/`
- งาน R3: A ต้องไม่ใช่ผู้เขียน · ทีมคนเดียวใช้การรับความเสี่ยงของ Owner ที่บันทึกไว้ ซึ่งอ่อนกว่า (`docs/roles/README.md`)

## ISO/IEC 27001 Annex A (แนวคิด)
- ใช้เป็นกรอบคิด ไม่ได้อ้างว่าได้รับรอง: least privilege · แยกหน้าที่ · จัดการค่าลับ · log การเข้าถึง · change management (การ์ด + อนุมัติ) · backup + ซ้อมกู้คืนทุกไตรมาส
