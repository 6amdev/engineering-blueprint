# Spec: <ชื่อเรื่อง>

> ขั้น 2 · โครงแบบ SRS (ISO/IEC/IEEE 29148) · oracle ของเทส = ไฟล์นี้ — ห้ามแก้เทสให้ตรงโค้ด
> ห้ามใส่ค่าลับ / IP / ข้อมูลส่วนบุคคล (PII)
> สถานะ: v0.3.0 (2026-11-21)

## ส่วนหัว
| ช่อง | ค่า |
|---|---|
| id | `SP-NNNN` · `docs/specs/NNNN-slug.md` · card `C-0001` |
| สถานะ | ร่าง / รอ review / อนุมัติ |
| วันที่ | YYYY-MM-DD |
| ผู้เขียน (role) | solution-architect / Dev |
| ผู้ยืนยัน (role) | Owner-reviewer |
| เอกสารขั้นก่อน | PRD: <ลิงก์> · stories: R-NNNN.S01.. |
| lane · ระดับ R | feature · R1/R2/R3 |

## ขอบเขต + คำนิยาม
- ครอบคลุม: <...> · ไม่ครอบคลุม: <...>
- คำศัพท์: <คำ = ความหมายเดียวทั้งเอกสาร>

## ข้อกำหนดเชิงหน้าที่ (FR)
<!-- 1 ข้อ = 1 ประโยค "ระบบต้อง..." ตรวจได้ ไม่ซ้อน และมี id ให้เทสอ้างถึง -->
| id | ข้อกำหนด | story | ลำดับ |
|---|---|---|---|
| FR-1 | ระบบต้อง <...> | R-NNNN.S01 | Must |

## กฎธุรกิจ + ตาราง oracle
<!-- ตัวอย่างอินพุต -> ผลที่ถูก; เทสอ่านค่าจากที่นี่ ครอบคลุมค่าขอบ -->
| # | อินพุต / สถานะ | ผลที่ต้องได้ | FR |
|---|---|---|---|
| O-1 | <...> | <...> | FR-1 |
| O-2 (ขอบ) | <...> | <...> | FR-1 |

## เคสผิดปกติ / error
| # | เงื่อนไข | พฤติกรรม | ข้อความ / รหัส | log / alert |
|---|---|---|---|---|
| E-1 | อินพุตไม่ถูกต้อง | ปฏิเสธ ไม่เขียนข้อมูล | <...> | <...> |
| E-2 | ไม่มีสิทธิ์ | 403 | <...> | audit |
| E-3 | ระบบรอบข้างล่ม / timeout | <retry / degrade> | <...> | <...> |
| E-4 | ซ้ำ / พร้อมกัน | idempotent | <...> | <...> |

## ข้อมูล + interface
- โมเดลข้อมูล: <ตาราง/ฟิลด์ · ชนิด · constraint> · migration: <ย้อนได้ไหม>
- API / contract: <endpoint · request/response · เวอร์ชัน · ลิงก์ schema>
- สิทธิ์: <role -> action>

## NFR (ISO/IEC 25010)
| คุณลักษณะ | ข้อกำหนดที่วัดได้ | วิธีตรวจ |
|---|---|---|
| Performance | <p95 · ปริมาณ> | <GATE-PERF / เครื่องมือ> |
| Security | <ASVS ตามระดับ R (R2 = L1 · R3 = L2) · input validation · secret> | GATE-SEC |
| Usability / a11y | <WCAG 2.2 AA · 375px · สองธีม> | GATE-UI / GATE-A11Y |
| Reliability | <SLO · retry · backup> | <...> |
| Privacy | <purpose · retention> | GATE-PRIVACY |

## รายการเทส (test inventory)
<!-- ทุก FR/oracle/error ต้องมีอย่างน้อย 1 เทส; เขียนก่อนโค้ด (RED) -->
| เทส | ระดับ | ครอบคลุม | ที่อยู่ | สถานะ |
|---|---|---|---|---|
| T-NNNN-01 | L1 (unit/integration) | FR-1 · O-1 | <path> | RED |
| T-NNNN-02 | L2 (UAT ผ่านระบบจริง) | FR-1 · E-2 | <ขั้นใน test plan> | - |
| T-NNNN-03 | หน้าจริง (375px · สองธีม · เมื่อ UI เปลี่ยน) | R-NNNN.S01.AC1 | <...> | - |

## traceability
| story / AC | spec ข้อ | test | ผลล่าสุด (sha) | release |
|---|---|---|---|---|
| R-NNNN.S01.AC1 | SP-NNNN §<ข้อ> | T-NNNN-01 | <...> | <vX.Y.Z> |

## ถอย / migration / flag
- feature flag: <ชื่อ/ไม่มี> · วิธีถอย: <...>

## ตรวจก่อนขออนุมัติ
- [ ] ทุก FR มี story + เทส · ทุก error มีเทส
- [ ] oracle มีค่าขอบ
- [ ] NFR มีตัวเลขและวิธีตรวจ
- [ ] ไม่มีคำคลุมเครือ (เร็ว, ง่าย, เหมาะสม)
- [ ] lead-reviewer ตรวจ scope · challenger ค้าน spec แล้ว (R2/R3)
- [ ] ไม่มีคำถามค้างที่ block
