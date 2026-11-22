---
name: release-notes
description: เขียน CHANGELOG (Keep a Changelog) + release notes และกำหนดเวอร์ชันตาม SemVer จาก Conventional Commits. ใช้เมื่อ "release notes", "changelog", "ออกเวอร์ชัน", "ปล่อยเวอร์ชัน", "bump version".
---
# release-notes — CHANGELOG + release notes

> ขั้น 8

## เมื่อไหร่ใช้
ทุก release ที่ขึ้น production (หลัง deploy สำเร็จ) · ข้ามส่วนฝั่งผู้ใช้ได้ถ้าผู้ใช้ไม่เห็นความต่าง แต่ CHANGELOG ยังอัป

## input
- `git log <tag-ก่อน>..<sha>` · การ์ดที่ปิดในรอบนี้ · ผล deploy · feature flag/migration ที่ผู้ใช้หรือ Ops ต้องรู้

## ขั้นตอน
1. รวม commit ตั้งแต่ tag ล่าสุด · จัดตามชนิด Conventional Commits: `feat` · `fix` · `perf` · `refactor` · `docs` · `chore` · `BREAKING CHANGE`
2. **กำหนดเวอร์ชัน SemVer** `MAJOR.MINOR.PATCH`: มี breaking change = MAJOR · ฟีเจอร์ใหม่ที่เข้ากันได้ = MINOR · แก้บั๊ก/ปรับภายใน = PATCH · (ก่อน 1.0.0 ให้ระบุกติกาในเอกสาร)
3. **CHANGELOG.md** รูปแบบ Keep a Changelog: หัว `## [x.y.z] - YYYY-MM-DD` · หมวด `Added` · `Changed` · `Deprecated` · `Removed` · `Fixed` · `Security` · ใหม่สุดอยู่บน · มี `## [Unreleased]` · ลิงก์เทียบเวอร์ชันท้ายไฟล์
4. **แยก 2 ฝั่ง** ใน release notes: **ฝั่งผู้ใช้** (ภาษาคนทั่วไป: ได้อะไรใหม่ · เปลี่ยนอะไร · ต้องทำอะไร — ข้อความผู้ใช้ owner อนุมัติ) · **ฝั่งทีม** (migration · config · flag · dependency · breaking · วิธี rollback)
5. หมวด `Security` ไม่เปิดรายละเอียดช่องโหว่จนกว่าจะแก้ครบและ owner อนุมัติ · ไม่ใส่ค่าลับ/IP/PII
6. ผูกการ์ด/PR แต่ละข้อ · ตรวจว่าไม่มีรายการที่ไม่ได้อยู่ใน scope (audit vs scope)
7. ตั้ง git tag `vX.Y.Z` ที่ sha ที่ deploy จริง (ในเครื่อง · push เมื่อสั่ง) · อัปเวอร์ชันในไฟล์ที่เกี่ยว
8. ส่งต่อ skill `user-manual` ถ้าผู้ใช้เห็นความต่าง · อัป `docs/HANDOFF.md`

## output
- `CHANGELOG.md` · `templates/release-notes.md` → `docs/releases/vX.Y.Z.md` · tag ในเครื่อง

## agents
tech-writer (หลัก) · status-reporter (สรุปการ์ด) · lead-reviewer (ตรวจ breaking/เวอร์ชัน)

## gates
ผ่าน draft-check ถ้าโพสต์ประกาศ · เวอร์ชันสอดคล้องกับชนิดการเปลี่ยน (ตรวจโดย reviewer)

## หยุดถาม owner เมื่อ
- ข้อความฝั่งผู้ใช้ · การประกาศ breaking change · ตัดสินว่ารอบนี้เป็น MAJOR/MINOR · จะเปิดเผยเรื่อง security fix หรือไม่

## checklist done
- [ ] เวอร์ชันถูกตาม SemVer · CHANGELOG อัป (Keep a Changelog) · `Unreleased` สะอาด
- [ ] แยกฝั่งผู้ใช้/ทีม · ผูกการ์ดครบ · ไม่มีค่าลับ/PII
- [ ] tag ตรง sha ที่ deploy
- [ ] ส่งต่อ `user-manual` (ถ้าจำเป็น)
