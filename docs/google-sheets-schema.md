# Google Sheets Schema — JustCSPlanner

> ออกแบบฐานข้อมูลบน Google Sheets ก่อนเขียน Next.js
> หลัก: **แถวที่ 1 ของทุก sheet = ชื่อคอลัมน์ (machine key ภาษาอังกฤษ)** เป็นตัวพิมพ์เล็ก camelCase/snake ตามที่ระบุ — โค้ด Next.js จะอ่านค่าด้วยชื่อนี้ อย่าแปลงเป็นไทยในแถวหัว

---

## 0. วิธีสร้างเริ่มต้น (ทำครั้งเดียว)

1. สร้าง Google Sheet ใหม่ ตั้งชื่อ workbook เช่น `JustCSPlanner DB`
2. สร้าง tab (sheet) ตามส่วนที่ 1–5 ด้านล่าง แล้ววางหัวคอลัมน์ใน **แถว 1**
3. **แชร์ Sheet ให้ service-account email** (จาก Google Cloud) สิทธิ์ *Editor*
4. **Freeze แถว 1**: เมนู View → Freeze → 1 row (สำคัญมาก เพราะโค้ดจะใช้แถวแรกเป็นชื่อ field)
5. เก็บ `GOOGLE_SHEETS_SPREADSHEET_ID` (ส่วนของ URL ระหว่าง `/d/` กับ `/edit`)
6. เพิ่มข้อมูลตัวอย่างในแถว 2–3 เพื่อทดสอบ ก่อนเชื่อม Next.js

### กฎเกณฑ์ทั่วไป
- **ID สร้างโดยโค้ดฝั่ง server** (Next.js) ตอน insert — อย่าให้คนพิมพ์เอง เพื่อไม่ให้ซ้ำ
- วันที่/เวลาเก็บเป็น **ISO 8601** (`2026-08-14T15:00:00+07:00`) เสมอ จะได้ sort/filter/เปรียบเทียบได้
- ค่า enum (สถานะ, priority) ใช้ **Data Validation → Dropdown** ใน Sheet เพื่อกันพิมพ์ผิด
- `ActivityLog` เป็น **append-only** — ห้ามแก้/ลบแถวเดิม ใส่แถวใหม่เท่านั้น

---

## 1. Sheet `JobCards` (หัวใจของระบบ)

หัวคอลัมน์ (วางในแถว 1):

| คอลัมน์ | ชื่อ field | ชนิด/รูปแบบ | ตัวอย่าง |
|---|---|---|---|
| A | `jobId` | string, รูปแบบ `JOB-YYYY-NNNN` | `JOB-2026-0001` |
| B | `customer` | string | `LCH Logistics` |
| C | `bookingNumber` | string | `BK-12345` |
| D | `shipmentType` | enum: `FCL` / `LCL` / `Air` | `FCL` |
| E | `serviceType` | enum: `Export Sea` / `Import Sea` / `Air Freight` | `Export Sea` |
| F | `route` | string | `Bangkok → Singapore` |
| G | `origin` | string | `Laem Chabang` |
| H | `destination` | string | `Singapore` |
| I | `carrier` | string | `ONE / Pacific International` |
| J | `owner` | string (ชื่อ CS — FK ไป `Team.csId`) | `aom` |
| K | `backup` | string (อาจว่าง) | `nut` |
| L | `status` | enum (ดู §6) | `In Progress` |
| M | `priority` | enum: `Normal` / `High` / `Critical` | `High` |
| N | `deadline` | ISO datetime | `2026-08-15T15:00:00+07:00` |
| O | `cutoff` | ISO datetime | `2026-08-15T12:00:00+07:00` |
| P | `etd` | ISO datetime | `2026-08-17T08:00:00+07:00` |
| Q | `eta` | ISO datetime | `2026-08-21T06:00:00+07:00` |
| R | `latestSummary` | string (สรุปล่าสุด 1–2 บรรทัด) | `รอ SI จากลูกค้า ตรวจแล้วส่งก่อน 15:00` |
| S | `docLinks` | string (URL คั่นด้วยบรรทัดใหม่) | `https://drive.google.com/...` |
| T | `createdBy` | string | `pan` |
| U | `createdAt` | ISO datetime | `2026-08-14T09:30:00+07:00` |
| V | `updatedAt` | ISO datetime | `2026-08-14T10:05:00+07:00` |

ตัวอย่างแถว 2: `JOB-2026-0001 | LCH Logistics | BK-12345 | FCL | Export Sea | Bangkok → Singapore | Laem Chabang | Singapore | ONE | aom | nut | In Progress | High | 2026-08-15T15:00:00+07:00 | 2026-08-15T12:00:00+07:00 | 2026-08-17T08:00:00+07:00 | 2026-08-21T06:00:00+07:00 | รอ SI จากลูกค้า | https://drive.google.com/... | pan | 2026-08-14T09:30:00+07:00 | 2026-08-14T10:05:00+07:00`

**หมายเหตุ**: `owner` ต้องมี **เพียงคนเดียว** (กฎหลักของระบบ — ความรับผิดชอบชัดเจน)

---

## 2. Sheet `Todos` (งานย่อยใต้ Job Card)

| คอลัมน์ | ชื่อ field | ชนิด/รูปแบบ | ตัวอย่าง |
|---|---|---|---|
| A | `todoId` | string `TODO-NNNNN` | `TODO-00001` |
| B | `jobId` | string (FK → `JobCards.jobId`) | `JOB-2026-0001` |
| C | `title` | string | `ตรวจ Shipping Instruction` |
| D | `assignee` | string (FK → `Team.csId`) | `aom` |
| E | `status` | enum: `Not Started` / `Doing` / `Waiting` / `Done` | `Not Started` |
| F | `deadline` | ISO datetime | `2026-08-15T15:00:00+07:00` |
| G | `source` | enum: `Template` / `Assigned` / `AI draft` | `Template` |
| H | `completedAt` | ISO datetime (ว่างถ้ายังไม่ Done) | |
| I | `createdBy` | string | `system` |
| J | `createdAt` | ISO datetime | `2026-08-14T09:30:00+07:00` |

---

## 3. Sheet `ActivityLog` (ประวัติ — append-only)

| คอลัมน์ | ชื่อ field | ชนิด/รูปแบบ | ตัวอย่าง |
|---|---|---|---|
| A | `logId` | string `LOG-NNNNNN` | `LOG-000001` |
| B | `jobId` | string (FK → `JobCards.jobId`) | `JOB-2026-0001` |
| C | `actor` | string (ใครทำ) | `pan` |
| D | `timestamp` | ISO datetime | `2026-08-14T10:05:00+07:00` |
| E | `event` | enum (ดู §6) | `status_changed` |
| F | `field` | string (ชื่อ field ที่เปลี่ยน) | `status` |
| G | `oldValue` | string | `New` |
| H | `newValue` | string | `In Progress` |
| I | `reason` | string (เหตุผล โดยเฉพาะตอนโยกเจ้าของ/เลื่อน deadline) | |
| J | `refLink` | string (ลิงก์ไฟล์/ข้อความที่เกี่ยวข้อง) | |

ตัวอย่างเหตุการณ์ที่ต้อง log เสมอ: สร้างงาน, เปลี่ยน status, เปลี่ยน owner (เก็บ owner เดิม + เหตุผล + เวลา), เปลี่ยน deadline, ปิดงาน

---

## 4. Sheet `Team` (รายชื่อ CS + role — sheet สนับสนุน)

ใช้สำหรับ dropdown ใน UI และตรวจสิทธิ์

| คอลัมน์ | ชื่อ field | ชนิด/รูปแบบ | ตัวอย่าง |
|---|---|---|---|
| A | `csId` | string (slug ตัวพิมพ์เล็ก) | `aom` |
| B | `displayName` | string | `อ้อม` |
| C | `role` | enum: `requester` / `cs_owner` / `cs_assistant` / `lead` / `admin` | `cs_owner` |
| D | `active` | boolean (`TRUE`/`FALSE`) | `TRUE` |
| E | `email` | string (สำหรับแจ้งเตือนภายหลัง) | `aom@example.com` |

---

## 5. Sheet `Templates` (รายการ To-do เริ่มต้นตามประเภท shipment)

เปิด Job Card ใหม่จาก template → โค้ดจะวนอ่านแถวที่ `templateType` ตรง แล้วสร้าง To-do ให้อัตโนมัติ

| คอลัมน์ | ชื่อ field | ชนิด/รูปแบบ | ตัวอย่าง |
|---|---|---|---|
| A | `templateType` | enum: `Export Sea` / `Import Sea` / `Air Freight` | `Export Sea` |
| B | `order` | number | `1` |
| C | `todoTitle` | string | `ตรวจ Booking Confirmation` |
| D | `deadlineOffsetHours` | number (ช่วงเวลาก่อน deadline ของ job) | `48` |
| E | `notes` | string | |

ตัวอย่างเนื้อหา (มาจาก design doc §11):
- **Export Sea**: ตรวจ booking · ยืนยันเรือ · รับเอกสาร · ส่ง SI · ตรวจ draft B/L · ติดตาม cut-off
- **Import Sea**: รับ Arrival Notice · ตรวจเอกสาร · ประสานเคลียร์สินค้า · แจ้งลูกค้า
- **Air Freight**: ยืนยัน flight · ตรวจ AWB · ติดตาม cargo cut-off · แจ้ง ETA

---

## 6. ค่า enum มาตรฐาน (ใช้สำหรับ Data Validation dropdown)

**`JobCards.status`**:
`New` · `In Progress` · `Waiting Customer` · `Waiting Docs` · `Blocked` · `Needs Help` · `Completed`

**`Todos.status`**:
`Not Started` · `Doing` · `Waiting` · `Done`

**`ActivityLog.event`**:
`job_created` · `job_closed` · `status_changed` · `owner_changed` · `deadline_changed` · `todo_added` · `todo_completed` · `note_added` · `doc_added`

**`Notifications.channel`**:
`in-app` · `email` · `line`

**`Notifications.status`**:
`sent` · `failed` · `read`

**`EmailInbox.source`**:
`paste` · `webhook`

**`EmailInbox.status`**:
`new` · `linked` · `converted` · `ignored`

> ⚠️ ค่าเหล่านี้ต้องตรงทั้งใน dropdown ของ Sheet และในโค้ด Next.js — ถ้าเปลี่ยน ต้องเปลี่ยนพร้อมกันทั้งสองฝั่ง

---

## 7. สิ่งที่ต้องระวัง (สำหรับโค้ด Next.js ในขั้นถัดไป)

- **Sheet ไม่มี relational integrity**: ความสัมพันธ์ `jobId` ระหว่าง `JobCards`/`Todos`/`ActivityLog` ต้อง maintain ในโค้ด ลบ Job Card ต้องจัดการ To-do/Log ด้วย
- **ไม่มี transaction**: การเขียนหลาย sheet พร้อมกัน (เช่น สร้าง job + To-do + log) ต้องคิดเรื่องกรณีเขียนครึ่งเดียวแล้ว fail
- **เลข ID ต่อเนื่อง**: โค้ดต้องหา `max + 1` หรือใช้ timestamp-based id เพื่อกันชนกันตอนหลายคนสร้างพร้อมกัน
- **ขนาด/ปริมาณ**: เหมาะกับทีมเล็ก–กลาง ถ้าแถว/ผู้ใช้พร้อมกันเยอะขึ้น ให้พิจารณาย้ายไป DB จริง

---

## 8. Sheet `Notifications` (การแจ้งเตือน — append-only)

เก็บการแจ้งเตือนต่อผู้รับ ต่อช่องทาง (channel) ปัจจุบันมีเฉพาะ `in-app` (email/LINE จะเพิ่มใน P2.1) `notify()` สร้างแถวนี้ผ่าน in-app channel

| คอลัมน์ | ชื่อ field | ชนิด/รูปแบบ | ตัวอย่าง |
|---|---|---|---|
| A | `notifId` | string `NOTIF-NNNNNN` | `NOTIF-000001` |
| B | `jobId` | string (FK → `JobCards.jobId`, อาจว่าง) | `JOB-2026-0001` |
| C | `recipientCsId` | string (FK → `Team.csId`) | `aom` |
| D | `event` | enum (ดู §6 — `ActivityLog.event`) | `job_created` |
| E | `channel` | enum: `in-app` / `email` / `line` | `in-app` |
| F | `subject` | string | `การแจ้งเตือน: สร้างงานใหม่` |
| G | `body` | string (สรุปย่อ หลายบรรทัดได้) | `ลูกค้า: LCH Logistics\nJob: JOB-2026-0001` |
| H | `status` | enum: `sent` / `failed` / `read` | `sent` |
| I | `createdAt` | ISO datetime | `2026-08-14T09:30:00+07:00` |
| J | `readAt` | ISO datetime (ว่างถ้ายังไม่อ่าน) | |

**หมายเหตุ**: append-only — ห้ามแก้แถวเดิม ยกเว้นการ mark `status` → `read` พร้อม stamp `readAt` (กระทำผ่าน `markNotificationRead`)

---

## 9. Sheet `EmailInbox` (อีเมลเข้า — พื้นที่รอเชื่อมงาน)

Staging area สำหรับอีเมลเข้า (P3.3) — พนักงานวางข้อความเอง (`paste`) หรือรับจาก webhook (`webhook` — `POST /api/email-inbound` ป้องกันด้วย `INBOUND_SECRET`) แล้วเชื่อมเข้างานที่มีอยู่ หรือแปลงเป็นร่างงานใหม่ทีละฉบับ

| คอลัมน์ | ชื่อ field | ชนิด/รูปแบบ | ตัวอย่าง |
|---|---|---|---|
| A | `emailId` | string `EMAIL-NNNNNN` | `EMAIL-000001` |
| B | `fromAddress` | string (อีเมลผู้ส่ง) | `customer@lch.co.th` |
| C | `subject` | string | `Re: Booking BK-12345 — ส่ง SI แล้ว` |
| D | `body` | string (เนื้อความเต็ม อาจหลายบรรทัด) | `เรียน CS...\nแนบ SI ตาม booking ข้างต้น` |
| E | `receivedAt` | ISO datetime | `2026-08-14T09:30:00+07:00` |
| F | `source` | enum: `paste` / `webhook` | `paste` |
| G | `matchedJobId` | string (FK → `JobCards.jobId`, อาจว่าง) | `JOB-2026-0001` |
| H | `status` | enum: `new` / `linked` / `converted` / `ignored` | `new` |
| I | `handledBy` | string (FK → `Team.csId`, อาจว่าง) | `jantana` |
| J | `handledAt` | ISO datetime (ว่างถ้ายังไม่จัดการ) | |

**หมายเหตุ**: `emailId` และ `receivedAt` สร้างโดยโค้ดฝั่ง server เสมอ (ผ่าน `appendEmail`) — เมื่อเชื่อมงาน (`เชื่อมกับงาน`) ระบบจะ append แถว `note_added` ลง `ActivityLog` ของงานนั้นพร้อม stamp `matchedJobId` / `handledBy` / `handledAt`
