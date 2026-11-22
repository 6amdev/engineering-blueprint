# Security policy

> สถานะ: v0.3.0 (2026-11-21)

## แจ้งช่องโหว่ (แบบส่วนตัว)
**อย่าเปิด issue / PR / discussion สาธารณะ** สำหรับช่องโหว่ — ใช้ GitHub Security Advisories ของ repo นี้:
1. ไปที่แท็บ **Security** ของ repo → **Advisories** → **Report a vulnerability** (private vulnerability reporting)
2. บอก: ไฟล์ / สคริปต์ / hook ที่เกี่ยว · วิธีทำซ้ำ (ขั้นตอนสั้น ๆ) · ผลกระทบ · เวอร์ชัน (`VERSION` หรือ commit sha)
3. ห้ามแนบค่าลับจริง ข้อมูลส่วนบุคคล หรือข้อมูลของระบบที่ไม่ใช่ของคุณ · ใช้ค่าตัวอย่าง (`example.com`, token ปลอม)

ถ้าแท็บ Report a vulnerability ยังไม่เปิด: เปิด issue สาธารณะที่บอกแค่ "ขอช่องทางแจ้งปัญหาความปลอดภัย" โดยไม่ใส่รายละเอียด

## เราจะทำอะไร
- ตอบรับภายใน 7 วัน · ประเมินความรุนแรงด้วย CVSS · แจ้งแผนแก้
- แก้ใน advisory แบบส่วนตัว → ออกเวอร์ชันใหม่ (SemVer PATCH) + บันทึกใน `CHANGELOG.md` → เปิดเผย advisory หลังมีตัวแก้
- ให้เครดิตผู้แจ้งใน advisory ถ้าต้องการ

## ขอบเขต
| อยู่ในขอบเขต | ไม่อยู่ |
|---|---|
| `scripts/` (`draft-check.mjs` · `board.mjs` · `new-project.mjs`) · `.githooks/` · `scripts/hooks/` | โปรเจกต์ที่สร้างจาก blueprint (เจ้าของโปรเจกต์ดูแลเอง) |
| secret scan ตรวจไม่เจอสิ่งที่ควรเจอ (false negative) · `draft-check` ปล่อยสิ่งที่ควรจับ | dependency ของ VitePress (แจ้งที่ต้นทาง) |
| กติกา / แม่แบบที่พาให้ทำสิ่งไม่ปลอดภัย (เช่นชวนข้ามด่าน) | ปัญหาของเครื่องมือ AI เอง |
| path traversal / command injection ในสคริปต์ | |

## เวอร์ชันที่ดูแล
เฉพาะเวอร์ชันล่าสุดบน `main`
