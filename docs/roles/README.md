# บทบาทและ RACI

> ใช้ชื่อบทบาท ไม่ใช้ชื่อคน · คนตัดสินและอนุมัติ · agent ทำงานและเสนอ

## ตารางบทบาท — คน
| บทบาท | ถืออะไร | อนุมัติอะไร | ไฟล์ |
|---|---|---|---|
| Owner | เป้าหมายธุรกิจ · ลำดับงาน · กฎธุรกิจ · ข้อความถึงผู้ใช้ | ack brief / PRD · re-ack change request · release notes ถึงผู้ใช้ | `owner-reviewer.md` |
| Owner-reviewer | ความถูกของ scope / spec / แบบ · ผลด่าน | ack scope · **"go"** · ผลด่าน · ใบ deploy · DoD | `owner-reviewer.md` |
| Dev | สั่งงาน agent · เจ้าของโค้ด เทส runbook | ไม่อนุมัติงาน R3 ของตัวเอง | `dev.md` |
| Frontend | UI / UX · contract ฝั่งหน้าจอ · ตรวจหน้าจริง | ผล GATE-UI · GATE-A11Y ฝั่งคน | `frontend.md` |
| Ops | ขึ้น UAT / prod · อ่าน DB prod · monitoring · incident | ขึ้น / หยุด / ถอย deploy · อ่านข้อมูลจริง (ผูก hash ของสคริปต์) · GATE-OBS | `ops.md` |

## แผนก IT เสมือน — agent (`.claude/agents/`)
| ฝ่าย | agent | งาน |
|---|---|---|
| BA / PM | intake-analyst (+ skill `intake` · `requirements` · `planning`) | รับคำขอ · brief · DoR · backlog · ลำดับ |
| Architect | solution-architect · challenger | spec · oracle · รายการเทส · design brief · ค้านแบบ |
| Developer | implementer | เทส RED → โค้ด ตาม spec และแบบที่ได้ "go" |
| QA | test-engineer · qa-engineer · regression-tester | GATE-VERIFY · GATE-UI / PERF / A11Y · GATE-REGRESSION |
| Security | security-engineer | GATE-SEC · GATE-PRIVACY · GATE-DEPS |
| DevOps / SRE | uat-release · runbook-rehearsal · prod-reader | ขึ้น UAT · ซ้อม runbook / GATE-OBS · เตรียมสคริปต์อ่าน และรันหลังได้อนุมัติ |
| Tech writer | tech-writer | HANDOFF · ADR · docs · คู่มือ |
| Reviewer / lead | lead-reviewer · approval-rehearsal | scope · เทียบ diff กับ scope · ซ้อมคำถามของผู้อนุมัติ |
| Support | root-cause-analyst | หาต้นเหตุแบบอ่านอย่างเดียว |
| Reporting | status-reporter | สรุปสถานะให้ทีม |

agent ไม่มีสิทธิ์ให้คำอนุมัติ ยกเว้นตรวจรับ (`accept`) ที่ Owner มอบอำนาจไว้ต่อการ์ด (R1/R2 ไม่ขึ้น prod · `docs/workflow.md`) · คำอนุมัติอื่นทุกคำมาจากคน และเป็นความเห็นบนการ์ด (ดู `docs/posting.md`)

## RACI ต่อขั้น
R = ลงมือ · A = รับผิดชอบสุดท้าย / อนุมัติ (1 บทบาทต่อแถว) · C = ถามความเห็น · I = แจ้ง

| ขั้น | Owner | Owner-reviewer | Dev | Frontend | Ops | agent ที่ลงมือ |
|---|---|---|---|---|---|---|
| 0 intake | A | C | R | C | I | intake-analyst |
| 1 requirements | A | C | R | C | I | intake-analyst · skill `requirements` |
| 2 spec | C | A | R | C | C | solution-architect · challenger · lead-reviewer |
| 3 design | I | A ("go") | R | C | C | solution-architect |
| 4 build | I | I | A | R (UI) | I | implementer |
| 5 gates | I | A | R | C (UI) | C (OBS) | ฝ่าย QA + Security |
| 6 UAT | C | A | R | R (หน้าจริง เมื่อ UI เปลี่ยน) | R (ขึ้น UAT) | uat-release · qa-engineer |
| 7 deploy | I | C | R (ใบ + runbook) | I | A | runbook-rehearsal (ซ้อม) |
| 8 release | A (ข้อความผู้ใช้) | C | R | C | I | tech-writer |
| 9 close | I | A (DoD) | R | I | I | tech-writer · status-reporter |

## RACI ต่อช่องทางงาน (lane)
| lane | ใคร ack ตอนเข้า | ขั้นที่ใช้ | ใครอนุมัติปิด | ไม่ข้ามเด็ดขาด |
|---|---|---|---|---|
| `feature` | Owner (brief) | 0–9 | Owner-reviewer (DoD) | ทุกด่าน |
| `change` | Owner re-ack หลัง impact analysis | กลับขั้นแรกที่โดนกระทบ → จนจบ | Owner-reviewer | template `templates/change-request.md` · skill `change-request` |
| `bug` | Owner-reviewer (ยืนยันว่าเป็น defect) | 0 → 4–9 · 1–3 เมื่อพฤติกรรม/spec เปลี่ยน | Owner-reviewer | เทส RED ก่อนแก้ · root-cause-analyst หาต้นเหตุ |
| `hotfix` | Ops + Owner-reviewer | ย่อ 1–3 และช่วง UAT ได้ | Ops (deploy) · Owner-reviewer (ด่าน) | เทส RED · GATE-VERIFY · GATE-SEC (เมื่อแตะเส้นทางเสี่ยงสูง R3) · แผนถอย · postmortem |
| `chore` | Dev (แจ้ง Owner-reviewer) | 0 (ย่อ) · 4–7 · 9 | Owner-reviewer | GATE-DEPS เมื่ออัป dependency |

## ตามขนาดทีม
| ขนาด | ใครถือบทบาทไหน | แยกหน้าที่ (R3) |
|---|---|---|
| 1 คน | คนเดียวถือทุกบทบาท · agent ช่วยตรวจทุกด่าน | หาคนที่สองตรวจก่อน (เพื่อนร่วมงาน / ที่ปรึกษา) · ไม่มีจริง ๆ: Owner บันทึก **รับความเสี่ยง** ชัดเจนบนการ์ด (sha · เหตุผลที่ไม่มีคนที่สอง · ความเสี่ยงที่รับ · ผลด่านที่อ่านแล้ว) · **อ่อนกว่า**การมีคนที่สอง ไม่ใช่การแยกหน้าที่ |
| 2–3 คน | คน A = Owner + Owner-reviewer · คน B = Dev + Frontend · คน C = Ops (มี 2 คน → Ops อยู่กับคนที่ไม่ได้เขียนชิ้นนั้น) | คนเขียน ≠ คนให้ "go" / ผ่านด่าน / อนุมัติ deploy ของงาน R3 |
| 5–10 คน | แยกครบ · Owner-reviewer ≥ 2 ผลัดกัน · Ops ≥ 2 (มีสำรองตอน incident + on-call) · Frontend แยกจาก Dev | R3: ผู้ตรวจที่ไม่ได้เขียน + Ops ที่ไม่ได้เขียน · คนขออ่านข้อมูลจริง ≠ คนอนุมัติ |

ทีม ≥ 2 คน: คนเขียนชิ้นไหน ห้ามเป็นผู้อนุมัติคนเดียวของงาน R3 ชิ้นนั้น · ทีมคนเดียวใช้การรับความเสี่ยงข้างบน · บันทึกบนการ์ดเสมอ

## กรอกต่อโปรเจกต์
- กรอกต่อโปรเจกต์: ใครถือบทบาทไหน — ชื่อบทบาท → handle บนบอร์ด (ไม่ใส่เบอร์ / อีเมลส่วนตัวใน git)
- กรอกต่อโปรเจกต์: ระบบ / repo / environment ไหน ใครดูแล — ตาราง ระบบ · บทบาทเจ้าของ · บทบาทสำรอง
- กรอกต่อโปรเจกต์: เวลาทำงาน + เขตเวลา + เวลาตอบที่ทีมตกลง (ใช้กับการทวงใน `docs/posting.md`)
- กรอกต่อโปรเจกต์: ช่องทางติดต่อ — ปกติ (การ์ด) · ด่วน / incident · นอกเวลา (ใครรับ on-call)
- กรอกต่อโปรเจกต์: ขนาดทีมที่ใช้ และใครคือคนที่สองสำหรับงาน R3
