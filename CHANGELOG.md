# Changelog (blueprint)

## 0.4.0 — 2026-11-22 (บทเรียนจากการเดินครบรอบครั้งแรก)
- จุดอนุมัติตามระดับ R: R1 ตรวจรับครั้งเดียว · R2 "go" + ตรวจรับ · R3 แบบเต็ม · มอบอำนาจต่อการ์ดได้ · ด่านยังครบ
- อนุมัติในแชต (มือถือ) บันทึกบนการ์ดได้สำหรับ R1/R2
- `requirement-brief-lite.md` สำหรับงานเล็ก · DoR อยู่ที่เดียว · แม่แบบโพสต์เหลือรูปเดียว · ตัวเลขที่ agent เติมแยกเป็น "ข้อสมมติ"
- agent อ่านเฉพาะ brief + ไฟล์ที่จำเป็น · brief ต้องอ้างข้อ spec
- GATE-VERIFY R2/R3 ต้องใส่บั๊กลอง · กติกาตรวจซ้ำเมื่อ sha เปลี่ยน
- `scripts/cost-report.mjs` สรุป token และต้นทุน
- แก้: hook รับรหัสการ์ดตัวใหญ่ใน scope · `npm install` แล้วไฟล์ lock ไม่เปลี่ยน

## 0.3.0 — 2026-11-22 (เผยแพร่ครั้งแรก)
- "1 แผนก": agent 16 ตัวมีบทบาทตามแผนก (BA/PM · solution-architect · dev · QA · security · DevOps/SRE · tech writer · reviewer) + tools แบบสิทธิ์น้อยสุด
- ช่องทางงาน 5 แบบ: feature · change · bug · hotfix · chore · ระดับเสี่ยง R1–R3 · planning ก่อน · retro หลัง
- skill ใหม่: `planning` · `retro` · `bugfix` · `hotfix` · `change-request` (รวม 21) · skill เดิมทุกตัวมีเนื้อหาเต็ม
- ด่านแบบเปิดตามงาน: GATE-PERF · GATE-A11Y · GATE-PRIVACY · GATE-DEPS · GATE-OBS · `docs/gates.md` มีเกณฑ์ผ่านวัดได้
- เอกสารเต็ม: workflow · gates · standards · roles + RACI ตามขนาดทีม · deploy · UAT · operations · db-scripts · stack · posting · agents
- `docs/onboarding.md`: เริ่มใช้ในองค์กร 30 นาที · governance · ตาราง compliance · ความปลอดภัยของการใช้ AI agent
- แม่แบบ 19 ชิ้นพร้อมกรอก (ใหม่: change-request · bug-report · retro)
- บอร์ด `local` เป็นค่าเริ่มต้น: การ์ดเป็นไฟล์ `docs/cards/` ไม่ต้องใช้ Trello · `board.mjs new|post|read`
- README บอกว่าทำเพื่ออะไร ตัวอย่างงาน 1 ชิ้น และอะไรบังคับจริง/อะไรเป็นแนวทาง · `SECURITY.md` · `CONTRIBUTING.md`
- README แบบเห็นภาพ ไทย + อังกฤษ (`README.en.md`) · ภาพวาดจาก `scripts/readme-diagrams.mjs`
- license Apache-2.0 · โปรเจกต์ใหม่ได้ `LICENSE-blueprint`

## 0.2.0 — 2026-11-21
- `docs/git.md`: branch · Conventional Commits · PR + review · SemVer tag · hotfix · worktree · rollback · ค่าลับ · บอร์ด
- git hooks `.githooks/` (เปิดเองตอน `npm install`): `commit-msg` ตรวจรูป commit · `pre-commit` สแกนค่าลับ / IP / ไฟล์ต้องห้าม · `npm run secret-scan` ทั้ง repo
- `scripts/board.mjs`: บอร์ดเลือกได้ none · trello · github · dry-run ก่อน · ต้องผ่าน draft-check
- `scripts/draft-check.mjs`: ส่วน FAIL ใช้ได้แล้ว (ค่าลับ · IP · คำต้องห้าม · sha · ลายเซ็น · "ไม่ตอบ = …")
- CI ตัวอย่าง `templates/github-ci.yml` · new-project เปิด hook ให้โปรเจกต์ใหม่

## 0.1.0 — 2026-11-21
- โครงแรก: AGENTS.md · workflow + DoR/DoD · skill 16 ตัว (intake เต็ม) · แม่แบบ · web doc · memory ใน folder · new-project
