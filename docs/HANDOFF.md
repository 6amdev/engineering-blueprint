# HANDOFF — ▶ ตอนนี้

> จบงานเมื่อไรให้อัปเดตไฟล์นี้ · เขียนให้คนที่เพิ่งเปิด repo ทำต่อได้

## ▶ ตอนนี้ (2026-11-22 · blueprint 0.5.1)
- **เสร็จ:** กติกา · workflow 10 ขั้น 5 ช่องทาง · ด่าน · agent 16 · skill 23 · แม่แบบ · บอร์ด `local` · hook สแกนค่าลับและรูปแบบ commit · `draft-check` · `new-project` · web doc · README
- **ถัดไป:** (1) `upgrade-project` ดึงเวอร์ชันใหม่เข้าโปรเจกต์เดิม (งานทดลองที่สองต้องคัดลอกมือ) (2) งานทดลองถัดไป: session ใหม่ 1 การ์ด วัดต้นทุนจริง (3) ให้ `gate.mjs` ครอบบอร์ด Trello/GitHub และ CI
- **รอ owner:**
  - ยืนยันค่าเริ่มต้น: WIP ≤ 2/คน · retro ทุก 5 การ์ด/2 สัปดาห์ · p95 ≤ 300 ms, LCP ≤ 2.5 s · coverage 80% ไฟล์ที่แตะ · PR ≤ 400 บรรทัด · ASVS L1 (R2) / L2 (R3) · บล็อก CVSS ≥ 7.0 · postmortem ภายใน 5 วันทำการ · `challenger` บังคับ R2/R3 · Ops อนุมัติการอ่านข้อมูลจริง
- **ยังไม่ได้ตรวจ:** CI บน GitHub (ยังเป็นแม่แบบ `templates/github-ci.yml` ยังไม่เปิดใช้) · ส่งขึ้น Trello / GitHub Issues จริง · web doc ที่ 375px · ใช้กับระบบที่มีผู้ใช้จริง · lane/R อื่นนอกจาก feature R2 และ change R2
- **license:** Apache-2.0 (owner เลือก 2026-11-22)
- **ใช้งานจริง:** ยังไม่มี
