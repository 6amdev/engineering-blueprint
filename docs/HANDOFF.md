# HANDOFF — ▶ ตอนนี้

> จบงานเมื่อไรให้อัปเดตไฟล์นี้ · เขียนให้คนที่เพิ่งเปิด repo ทำต่อได้

## ▶ ตอนนี้ (2026-11-23 · blueprint 1.0.0 + Unreleased)
- **เสร็จ:** กติกา · workflow 10 ขั้น 5 ช่องทาง · ด่าน · agent 16 · skill 23 · แม่แบบ · บอร์ด `local` · hook สแกนค่าลับและรูปแบบ commit · `draft-check` · `new-project` · `upgrade-project` · `gate.mjs audit` · CI บน GitHub (Linux · ผ่าน 2026-11-23) · CI/CD พร้อมใช้ในโปรเจกต์ใหม่ (deploy workflow + `deploy.sh`) · web doc · README
- **ถัดไป:** (1) งานจริงเล็ก ๆ ชิ้นแรกที่มีผู้ใช้ (2) วัดต้นทุนแบบ session ใหม่ 1 การ์ด (3) ให้ `gate.mjs` ครอบบอร์ด Trello/GitHub
- **กติกา (owner, 2026-11-23):** ระบบให้ agent ตัดสินใจเองหลังตกลงกันชัดแล้ว เพื่อให้งานไหล (`docs/workflow.md` → จุดอนุมัติตามระดับ R)
- **รอ owner:**
  - ยืนยันค่าเริ่มต้น: WIP ≤ 2/คน · retro ทุก 5 การ์ด/2 สัปดาห์ · p95 ≤ 300 ms, LCP ≤ 2.5 s · coverage 80% ไฟล์ที่แตะ · PR ≤ 400 บรรทัด · ASVS L1 (R2) / L2 (R3) · บล็อก CVSS ≥ 7.0 · postmortem ภายใน 5 วันทำการ · `challenger` บังคับ R2/R3 · Ops อนุมัติการอ่านข้อมูลจริง
- **ยังไม่ได้ตรวจ:** `deploy.sh` กับ server จริง (เทสใช้ ssh/rsync ปลอมในเครื่อง) · deploy workflow บน GitHub จริง · ส่งขึ้น Trello / GitHub Issues จริง · ใช้กับระบบที่มีผู้ใช้จริง · ทุก lane × R ผ่านแค่การซ้อมโดย agent (คำอนุมัติจำลอง) ยังไม่เคยใช้กับคนจริง
- **license:** Apache-2.0 (owner เลือก 2026-11-22)
- **ใช้งานจริง:** ยังไม่มี
