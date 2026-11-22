# เอกสารต่อขั้น — จาก requirement ถึงคู่มือผู้ใช้

> ทุกงานสร้างเอกสารตามขั้นและ lane · แม่แบบอยู่ `templates/` · skill ที่เขียนอยู่ `.claude/skills/`

> ไฟล์และ folder ที่ยังไม่มี (เช่น `docs/backlog.md` `docs/glossary.md` `docs/design-system.md` `docs/retros/`) สร้างตอนใช้ครั้งแรก

| ขั้น | เอกสาร | ที่เก็บ | แม่แบบ | skill | ใครยืนยัน |
|---|---|---|---|---|---|
| ก่อน 0 วางแผน | backlog + ลำดับ + ขนาด + roadmap | `docs/backlog.md` | — (ตารางใน skill) | `planning` | owner |
| 0 intake | requirement brief (ผ่าน DoR) | `docs/requirements/NNNN-slug.md` | `requirement-brief.md` | `intake` | owner |
| 0 intake (`bug`) | bug report | การ์ด + `docs/requirements/NNNN-slug.md` | `bug-report.md` | `bugfix` | dev (R3: owner-reviewer) |
| 0 intake (`change`) | change request + impact analysis | การ์ดเดิม + `docs/requirements/NNNN-slug.md` | `change-request.md` | `change-request` | owner (re-ack) |
| 1 requirements | PRD + user stories + acceptance criteria | `docs/requirements/` | `prd.md` · `user-story.md` | `requirements` | owner |
| 2 spec | spec (SRS) + oracle + รายการเทส | `docs/specs/` | `spec.md` | `spec` | owner-reviewer |
| 3 design | ADR (การตัดสินใจที่มีผลระยะยาว) · C4 · design brief | `docs/decisions/` · `docs/specs/` | `docs/decisions/0000-template.md` · `design-brief.md` | `design` | owner-reviewer |
| 4 build | แผนเทส L1/L2/หน้าจริง + ผล L1 | `docs/test-plans/` | `test-plan-l2-uat.md` | `tdd` | dev |
| 5 gates | ผลรีวิว + ผลด่าน | การ์ด + `docs/reviews/` · `docs/gates/` | `code-review.md` | `code-review` · `gate-check` · `security-review` | owner-reviewer |
| 6 UAT | ผล L2 + หน้าจริง (เมื่อ UI เปลี่ยน) + sign-off | `docs/test-plans/` + การ์ด | `test-plan-l2-uat.md` | `uat` | owner-reviewer |
| 7 deploy | ใบขอ deploy + runbook | การ์ด + `docs/deploys/` · `docs/runbooks/` | `deploy-request.md` · `ops-runbook.md` | `deploy-request` | ops + owner-reviewer |
| 8 release | release notes + CHANGELOG | `docs/releases/` · `CHANGELOG.md` | `release-notes.md` | `release-notes` | owner (ข้อความผู้ใช้) |
| 8 release | **คู่มือผู้ใช้ (web doc)** | `site/` | `user-manual-page.md` | `user-manual` | owner |
| 9 close | DoD + HANDOFF | การ์ด + `docs/HANDOFF.md` | `handoff.md` | `handoff` | owner-reviewer |
| หลังปิด: ดูแล | runbook · postmortem · SLO | `docs/runbooks/` · `docs/postmortems/` · `docs/operations.md` | `ops-runbook.md` · `postmortem.md` | `postmortem` · `hotfix` | ops |
| หลังปิด: ทบทวน | retro + action items | `docs/retros/YYYY-MM-DD.md` | `retro.md` | `retro` | ทีม (owner รับทราบ) |

## กติกา
- เอกสารขั้นก่อนยังไม่ยืนยัน = ไม่เริ่มขั้นถัดไป (ยกเว้นขั้นที่ lane ให้ข้าม — เขียนเหตุผลในการ์ด)
- ทุกเอกสารมี: รหัส · สถานะ (draft / acked / superseded) · วันที่ · ผู้ยืนยัน (บทบาท) · ลิงก์ไปเอกสารขั้นก่อน
- เอกสารที่ ack แล้วไม่แก้เนื้อหาเงียบ ๆ · เปลี่ยน = change request หรือฉบับใหม่ที่อ้างฉบับเดิม
- ห้ามใส่ค่าลับ / IP / ข้อมูลส่วนบุคคลในเอกสารทุกชนิด

## รูปแบบรหัสเอกสาร
| ชนิด | รูปแบบ | ตัวอย่าง |
|---|---|---|
| การ์ด (board `local`) | `C-NNNN` | `C-0012` |
| requirement / brief / bug / change | `R-NNNN` → ไฟล์ `docs/requirements/NNNN-slug.md` | `R-0012` → `0012-room-booking.md` |
| user story | `R-NNNN.SNN` | `R-0012.S03` |
| acceptance criteria | `R-NNNN.SNN.ACN` | `R-0012.S03.AC2` |
| spec | `SP-NNNN` (เลขเดียวกับ R) → `docs/specs/NNNN-slug.md` | `SP-0012` |
| test | `T-NNNN-NN` (ในโค้ดใส่รหัสในชื่อเทส) | `T-0012-07` |
| ADR | `ADR-NNNN` → `docs/decisions/NNNN-slug.md` | `ADR-0005` |
| release | SemVer `vX.Y.Z` → `docs/releases/vX.Y.Z.md` | `v1.4.0` |
| postmortem / retro | วันที่ + slug → `docs/postmortems/YYYY-MM-DD-slug.md` · `docs/retros/YYYY-MM-DD.md` | `2026-11-21-login-timeout.md` |
- เลขเรียงต่อกันไม่ใช้ซ้ำ · ตัวที่ยกเลิกเก็บไว้พร้อมสถานะ `superseded` หรือ `rejected`
- lane `change` และ `bug` ได้ R ใหม่ของตัวเอง และอ้าง R เดิมที่กระทบ

## Traceability matrix: story → spec → test → release
ตารางอยู่ท้าย spec ของแต่ละงาน (`docs/specs/NNNN-slug.md`) · ทุกแถวต้องครบก่อน DoD

| story / AC | spec ข้อ | test | ผลล่าสุด (sha) | release |
|---|---|---|---|---|
| `R-0012.S03.AC2` | `SP-0012 §4.2` | `T-0012-07` | ผ่าน @`<sha สั้น>` | `v1.4.0` |

- AC ไม่มีเทส = GATE-SPEC ไม่ผ่าน · เทสไม่ชี้กลับ AC = ถามว่าเป็นของเกิน scope ไหม
- test-engineer เติมคอลัมน์ผล · skill `release-notes` เติมคอลัมน์ release · change request ที่กระทบ AC = เพิ่มแถวใหม่ ไม่ลบแถวเดิม (ใส่ `superseded`)
- bug: เพิ่มแถว `R-NNNN` ของบั๊ก → AC เดิมที่ผิด → เทส RED ที่จับบั๊ก
