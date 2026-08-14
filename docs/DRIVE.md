# Google Drive อัปโหลดไฟล์แนบ (P3.2)

งาน (Job Card) สามารถแนบไฟล์จริงได้ — ไฟล์ถูกเก็บใน Google Drive ด้วย **service account เดียวกับ Google Sheets** (`GOOGLE_APPLICATION_CREDENTIALS`) และลิงก์ไฟล์ (`webViewLink`) ถูกเพิ่มเข้าไปใน `docLinks` ของงานนั้น (คอลัมน์เดิมที่ใช้วางลิงก์มือ)

## ตั้งค่า (ทำครั้งเดียว)

1. **สร้างโฟลเดอร์** ใน Google Drive สำหรับเก็บไฟล์แนบ เช่น `JustCSPlanner Attachments`
2. **แชร์โฟลเดอร์ให้ service account** — คลิก Share แล้วใส่อีเมล service account (ดูได้จากไฟล์ JSON ใน `GOOGLE_APPLICATION_CREDENTIALS` ฟิลด์ `client_email` ลงท้ายด้วย `.iam.gserviceaccount.com`) ให้สิทธิ์ **Editor**
3. **คัดลอก folder id** จาก URL ของโฟลเดอร์:
   `https://drive.google.com/drive/folders/<FOLDER_ID>` → เอาส่วน `<FOLDER_ID>`
4. **ตั้ง env** ใน `.env.local`:
   ```
   GOOGLE_DRIVE_FOLDER_ID=<FOLDER_ID>
   ```
   (ตัวแปร `GOOGLE_APPLICATION_CREDENTIALS` มีอยู่แล้วจากการตั้งค่า Sheets)

จนกว่าจะตั้ง `GOOGLE_DRIVE_FOLDER_ID` ปุ่มอัปโหลดจะยังแสดงผล แต่การอัปโหลดจะ fail พร้อมข้อความภาษาไทย ("ระบบอัปโหลดไฟล์ยังไม่พร้อมใช้งาน...") — ส่วนอื่นของแอปไม่กระทบ

## ข้อจำกัดการอัปโหลด

| รายการ | ค่า |
| --- | --- |
| ขนาดสูงสุด | **10 MB** ต่อไฟล์ |
| ชนิดไฟล์ที่รองรับ | pdf, docx, xlsx, pptx, png, jpg, jpeg, txt, eml, msg |

ไฟล์ที่เกินขนาดหรือชนิดไม่รองรับ → ได้รับ HTTP 400 พร้อมข้อความไทยที่ปุ่มอัปโหลด

## สิทธิ์

อัปโหลดผ่าน `POST /api/upload` (multipart/form-data: `file` + `jobId`) — เฉพาะผู้ที่แก้ไขงานนี้ได้ตาม `canEditJob`: เจ้าของงาน, ผู้รับฝาก (backup), lead, admin ผู้อื่นได้ **403** และปุ่มอัปโหลดจะไม่แสดงบนหน้า job detail

## สิ่งที่ถูกเก็บ

- **ไฟล์จริง** → ใน Drive folder ที่ตั้งค่าไว้ (ชื่อไฟล์เดิม)
- **ลิงก์** → เพิ่มต่อท้าย `JobCards.docLinks` (เก็บใน Sheet เป็นข้อความคั่นด้วย newline เหมือนเดิม) — ชิป 📎 บนหน้า job detail ลิงก์ไปที่ `webViewLink`
- วิธีวางลิงก์มือในฟอร์มสร้าง/แก้ไขงานยังใช้ได้เหมือนเดิม

## หมายเหตุ

- ยังไม่มีการเขียนแถว ActivityLog `doc_added` — `updateJob` ของ repository บันทึกเฉพาะ status/owner/deadline และไม่มี public method สำหรับเขียน activity ตรง ๆ (จะต้องเพิ่มในภายหลัง)
