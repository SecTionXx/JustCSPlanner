# คู่มือสร้าง Teams-first Freight Operations Planner พร้อม AI Bot

> เอกสารนี้เป็นคู่มือทำระบบรุ่นทดลอง (MVP) สำหรับทีม Freight Forwarder/CS โดยใช้ Microsoft Teams, Microsoft Lists, SharePoint, Power Automate และ AI API

## 1. เป้าหมายของรุ่นทดลอง

ภายในรุ่นทดลอง ผู้ใช้ต้องสามารถ:

1. สร้าง Job Card จาก Teams
2. มอบหมายงานให้ CS และกำหนด deadline
3. ให้ CS รับงาน อัปเดตสถานะ เพิ่มโน้ต และทำ To-do ผ่าน Teams
4. รับการเตือน deadline และ escalation
5. ให้ AI สรุปอีเมล/ข้อความและเสนอข้อมูล Job Card แบบร่าง
6. ให้หัวหน้าดู workload และงานเสี่ยงจาก Microsoft Lists

## 2. สิ่งที่ต้องเตรียมก่อนเริ่ม

### 2.1 บัญชีและสิทธิ์

- บัญชี Microsoft 365 ขององค์กร
- สิทธิ์สร้าง Team, Channel, Microsoft Lists และ Power Automate flow
- Shared mailbox สำหรับอีเมล booking (หากต้องการนำอีเมลเข้า)
- พื้นที่ SharePoint ของ Team สำหรับเอกสารแนบ
- บัญชี AI API และ API key สำหรับฟังก์ชัน AI

### 2.2 ตรวจสอบกับผู้ดูแลระบบ IT

ให้ตรวจสอบก่อนว่าองค์กรอนุญาตให้ใช้:

- Power Automate และ standard connectors
- Teams Workflows / Adaptive Cards
- Microsoft Lists และ SharePoint
- การสร้างแอปหรือบอตภายใน Teams
- การส่งข้อมูลไป AI API ภายนอกองค์กร
- Shared mailbox และสิทธิ์อ่านอีเมล

> หากองค์กรยังไม่อนุญาต AI API ภายนอก ให้เริ่มจาก workflow ที่ไม่มี AI ก่อน แล้วใช้ข้อมูลจำลองทดสอบ AI แยกต่างหาก

## 3. ตัดสินใจ workflow ให้ชัดก่อนสร้างระบบ

อย่าเริ่มจากสร้างเทคโนโลยี ให้เริ่มจากเลือก workflow เดียวที่ทีมใช้บ่อยที่สุด เช่น **Export Sea**

### 3.1 เก็บข้อมูลจากหัวหน้าทีมและ CS

ตอบคำถามเหล่านี้ให้ครบ:

- งานเริ่มต้นเมื่อใด: เมื่อมีอีเมลลูกค้า, ฝ่ายขายส่งต่อ, หรือมี booking confirmed?
- ใครเป็นคนเลือก CS เจ้าของงาน?
- ขั้นตอนมาตรฐานมีอะไรบ้าง?
- Deadline ใดสำคัญที่สุด: SI cut-off, cargo cut-off, ETD, ETA หรือ invoice due date?
- สถานะ “รอลูกค้า” ต้องเตือนอีกครั้งหลังผ่านไปกี่ชั่วโมงหรือกี่วัน?
- เมื่อใดต้องแจ้งหัวหน้าทีม?
- ใครมีสิทธิ์เปลี่ยน owner และปิด Job Card?

### 3.2 กำหนดสถานะมาตรฐาน

เริ่มให้น้อยและชัดเจน:

| สถานะ | ความหมาย | ผู้ใช้หลัก |
| --- | --- | --- |
| New | งานใหม่ ยังไม่มีผู้รับ | หัวหน้า/ระบบ |
| Assigned | มอบหมาย CS แล้ว | หัวหน้า/ระบบ |
| In Progress | CS เริ่มทำงาน | CS |
| Waiting Customer | รอลูกค้าหรือเอกสาร | CS |
| Blocked | มีปัญหาต้องการช่วยเหลือ | CS/หัวหน้า |
| Completed | งานเสร็จ | CS/หัวหน้า |
| Cancelled | ยกเลิก | หัวหน้า |

### 3.3 กำหนดกติกา deadline

ตัวอย่าง:

- เตือน CS ก่อน deadline 24 ชั่วโมง และ 4 ชั่วโมง
- หากงาน Critical ยังไม่อัปเดตก่อน deadline 2 ชั่วโมง ให้แจ้งหัวหน้า
- งาน Waiting Customer เกิน 24 ชั่วโมง ให้สร้าง reminder ติดตามลูกค้า
- การเลื่อน deadline ต้องมีเหตุผลและแจ้งหัวหน้า

## 4. สร้างพื้นที่ทำงานใน Microsoft Teams

### ขั้นตอน 4.1: สร้าง Team

1. สร้าง Team ชื่อ `Freight Operations` หรือชื่อที่องค์กรใช้งาน
2. กำหนด owner เป็นหัวหน้าทีมและผู้ดูแลระบบอย่างน้อย 2 คน
3. เพิ่มสมาชิก CS, หัวหน้าทีม และผู้สั่งงานตามบทบาท
4. ตั้งค่าความเป็นส่วนตัวให้เหมาะสมกับข้อมูลลูกค้า

### ขั้นตอน 4.2: สร้าง Channel

สร้างอย่างน้อย:

| Channel | วัตถุประสงค์ |
| --- | --- |
| Operations Desk | คำสั่งงานและประกาศทั่วไป |
| New Jobs | ระบบแจ้ง Job Card ใหม่ |
| Urgent & Escalation | งานใกล้กำหนด/งานมีปัญหา |
| Team Leads | ใช้สำหรับหัวหน้า; จำกัดสิทธิ์ตามจำเป็น |

> ในช่วงเริ่มต้น อย่าสร้าง Channel ตามลูกค้าหรือแต่ละ shipment มากเกินไป เพราะทำให้ข้อมูลกระจัดกระจาย

## 5. สร้าง Microsoft Lists เป็นฐานข้อมูล

เข้า Team ที่สร้างไว้ → เลือกพื้นที่ SharePoint ที่เชื่อมกับ Team → สร้าง Lists ต่อไปนี้

### ขั้นตอน 5.1: List `Job Cards`

สร้างคอลัมน์ตามตารางนี้:

| ชื่อคอลัมน์ | ประเภท | จำเป็น | หมายเหตุ |
| --- | --- | --- | --- |
| Title | Single line text | ใช่ | ใช้เป็นชื่อ Job เช่น ลูกค้า + เลข booking |
| Job ID | Single line text | ใช่ | สร้างอัตโนมัติจาก Flow |
| Customer | Single line text | ใช่ | ชื่อลูกค้า |
| Booking Number | Single line text | ไม่ | กรอกเมื่อทราบ |
| Shipment Type | Choice | ใช่ | Export Sea, Import Sea, Air Freight |
| Origin | Single line text | ไม่ | ต้นทาง |
| Destination | Single line text | ไม่ | ปลายทาง |
| Carrier | Single line text | ไม่ | สายเรือ/สายการบิน |
| Owner | Person | ใช่ | CS หลักหนึ่งคน |
| Assistant | Person | ไม่ | CS ผู้ช่วย/ผู้แทน |
| Status | Choice | ใช่ | ใช้สถานะมาตรฐานจากข้อ 3.2 |
| Priority | Choice | ใช่ | Normal, High, Critical |
| Deadline | Date and time | ใช่ | กำหนดหลักของงาน |
| SI Cut-off | Date and time | ไม่ | สำหรับงานที่เกี่ยวข้อง |
| Cargo Cut-off | Date and time | ไม่ | สำหรับงานที่เกี่ยวข้อง |
| ETD | Date and time | ไม่ | วันออกเดินทาง |
| ETA | Date and time | ไม่ | วันถึงปลายทาง |
| Latest Summary | Multiple lines text | ไม่ | สรุปจาก CS หรือ AI |
| Document Link | Hyperlink | ไม่ | ลิงก์ SharePoint folder |
| Created By | Person | ใช่ | กำหนดผ่าน Flow |
| Created At | Date and time | ใช่ | กำหนดผ่าน Flow |
| Last Updated At | Date and time | ใช่ | อัปเดตผ่าน Flow |

### ขั้นตอน 5.2: List `To-dos`

| ชื่อคอลัมน์ | ประเภท | จำเป็น |
| --- | --- | --- |
| Title | Single line text | ใช่ |
| Job Card ID | Lookup หรือ Single line text | ใช่ |
| Assigned To | Person | ใช่ |
| Status | Choice: Not Started, Doing, Waiting, Done | ใช่ |
| Deadline | Date and time | ไม่ |
| Priority | Choice | ไม่ |
| Source | Choice: Template, Manual, AI Draft | ใช่ |
| Notes | Multiple lines text | ไม่ |

### ขั้นตอน 5.3: List `Activity Log`

| ชื่อคอลัมน์ | ประเภท | ความหมาย |
| --- | --- | --- |
| Title | Single line text | ชื่อเหตุการณ์ |
| Job Card ID | Lookup หรือ Single line text | งานที่เกี่ยวข้อง |
| Action | Choice | Created, Assigned, Status Changed, Deadline Changed, Comment Added |
| Performed By | Person | ผู้ดำเนินการ |
| Performed At | Date and time | เวลาดำเนินการ |
| Details | Multiple lines text | ค่าเดิม/ค่าใหม่/เหตุผล |
| Source | Choice | Teams, Flow, AI Draft, Dashboard |

### ขั้นตอน 5.4: สร้างมุมมอง (Views)

สร้าง view ต่อไปนี้ใน `Job Cards`:

- My Jobs: Owner เป็นผู้ใช้ปัจจุบัน และ Status ไม่ใช่ Completed/Cancelled
- Urgent Today: Deadline ภายในวันนี้ หรือ Priority = Critical
- Waiting Customer: Status = Waiting Customer
- Overdue: Deadline ผ่านแล้ว และงานยังไม่ Completed/Cancelled
- Team Workload: Group by Owner และแสดง Status/Deadline
- Completed: งานปิดแล้วสำหรับดูย้อนหลัง

## 6. สร้าง Template งานตามประเภท Shipment

เริ่มต้นให้สร้าง list ชื่อ `Task Templates` แล้วเพิ่มคอลัมน์: Shipment Type, Task Name, Default Owner Role, Due Offset, Priority

### Template ตัวอย่าง: Export Sea

| ลำดับ | To-do | Deadline อ้างอิง |
| ---: | --- | --- |
| 1 | ตรวจข้อมูล booking | ทันทีหลังสร้าง Job Card |
| 2 | ยืนยัน vessel / schedule | ตามเวลาที่กำหนด |
| 3 | รับเอกสารจากลูกค้า | ก่อน SI cut-off |
| 4 | ส่ง Shipping Instruction | ก่อน SI cut-off |
| 5 | ตรวจ draft B/L | หลังได้รับ draft |
| 6 | ยืนยัน final B/L | ก่อน ETD หรือกติกาบริษัท |
| 7 | อัปเดตลูกค้า | ตาม milestone |

> เริ่มจาก 5–7 งานย่อยต่อ Template ก่อน แล้วเพิ่มรายละเอียดหลังทดลองใช้จริง

## 7. สร้าง Power Automate Flows พื้นฐาน

### Flow 1: สร้าง Job Card จากฟอร์ม Teams

**เป้าหมาย:** ให้หัวหน้าหรือผู้สั่งงานสร้างงานโดยไม่ต้องเข้า Lists

1. สร้าง Microsoft Form หรือ Adaptive Card ที่เก็บ Customer, Shipment Type, Owner, Deadline, Priority และรายละเอียด
2. สร้าง cloud flow trigger เมื่อได้รับ response ใหม่
3. ตรวจฟิลด์บังคับ; หากขาด ให้ส่งข้อความขอข้อมูลเพิ่ม
4. สร้างเลข Job ID เช่น `JOB-YYYY-####`
5. สร้าง item ใน `Job Cards`
6. อ่าน `Task Templates` ตาม Shipment Type
7. สร้าง To-do list เริ่มต้นที่เกี่ยวข้อง
8. สร้าง Activity Log: `Created`
9. ส่ง Adaptive Card ถึง Owner ใน Teams พร้อมปุ่ม `รับงาน`, `ดูรายละเอียด`, `ขอความช่วยเหลือ`
10. ส่งข้อความยืนยันกลับผู้สั่งงาน

### Flow 2: รับงานและอัปเดตสถานะจาก Adaptive Card

**เป้าหมาย:** ให้ CS อัปเดตงานจาก Teams

1. สร้าง Adaptive Card สำหรับ Job Card
2. แสดง Job ID, ลูกค้า, deadline, สถานะ และรายการ To-do สำคัญ
3. ใส่ปุ่ม `รับงาน`, `เริ่มดำเนินการ`, `รอลูกค้า`, `เพิ่มอัปเดต`, `ปิดงาน`
4. สร้าง flow รับผลตอบกลับจากการ์ด
5. ตรวจสอบสิทธิ์: ผู้กดต้องเป็น Owner, Assistant หรือหัวหน้า
6. อัปเดต Status, Last Updated At และ Latest Summary ใน `Job Cards`
7. เพิ่ม Activity Log ทุกครั้ง
8. ส่ง notification เฉพาะกรณีสำคัญ เช่น Blocked หรือมีการเปลี่ยน deadline

### Flow 3: สร้างและอัปเดต To-do

1. สร้างการ์ดหรือฟอร์มย่อยสำหรับเพิ่ม To-do
2. รับ Job Card ID, ชื่องาน, ผู้รับผิดชอบ, deadline และ priority
3. สร้าง item ใน `To-dos`
4. แจ้งผู้รับผิดชอบผ่าน Teams
5. เมื่อ CS กด Done ให้ปิด To-do และบันทึก Activity Log
6. หาก To-do ทั้งหมดเสร็จ ให้เสนอให้ Owner ปิด Job Card แต่ไม่ปิดอัตโนมัติ

### Flow 4: แจ้งเตือน deadline

**เป้าหมาย:** ให้แจ้งเฉพาะคนที่ต้องดำเนินการ

1. สร้าง Scheduled cloud flow ทำงานทุก 1 ชั่วโมง
2. ค้นหา Job Card ที่ยังไม่ Completed/Cancelled
3. คัดงานที่ deadline เหลือ 24 ชั่วโมง และยังไม่เคยส่งเตือนรอบแรก
4. ส่ง Teams card ถึง Owner
5. คัดงานที่ deadline เหลือ 4 ชั่วโมง และยังไม่เคยส่งเตือนรอบสอง
6. ส่งเตือนอีกครั้ง พร้อมปุ่มอัปเดตสถานะ
7. คัดงานที่เกินกำหนดและยังไม่มีอัปเดตตามเงื่อนไข
8. ส่ง escalation ถึงหัวหน้าทีม
9. บันทึกการแจ้งเตือนใน Activity Log เพื่อไม่ให้ส่งซ้ำ

### Flow 5: อีเมลเข้า Shared Mailbox

**เป้าหมาย:** รวบรวมอีเมลและไฟล์เข้ากับงาน

1. ใช้ trigger เมื่ออีเมลใหม่เข้ากล่องกลาง
2. บันทึกไฟล์แนบลง SharePoint folder ที่กำหนด
3. เก็บ subject, sender, received time และลิงก์ไฟล์
4. ส่งข้อมูลใหั AI สรุปเป็นร่าง (ดูข้อ 8)
5. ส่ง Adaptive Card ให้ CS หรือหัวหน้าตรวจ: `ผูกกับ Job เดิม`, `สร้าง Job ใหม่`, `เก็บเป็นข้อมูลอ้างอิง`
6. หลังยืนยัน จึงเพิ่มโน้ต/เอกสาร/To-do หรือสร้าง Job Card

## 8. เชื่อม AI API อย่างปลอดภัย

### 8.1 เลือก use case แรก

เริ่มเพียง 2 use case:

1. สรุปอีเมล booking
2. แปลงข้อความใน Teams เป็น Job Card ร่าง

อย่าเริ่มจากให้ AI อ่านทุกข้อความใน Team เพราะมีค่าใช้จ่ายสูง ควบคุมข้อมูลยาก และเพิ่มโอกาสสรุปผิด

### 8.2 ข้อมูลที่ส่งให้ AI

ส่งเฉพาะข้อมูลที่จำเป็น เช่น:

- Subject และเนื้อหาอีเมล
- ข้อความคำสั่งจากผู้ใช้
- รายการสถานะและประเภท shipment ที่ระบบอนุญาต
- Job Card ที่อาจเกี่ยวข้องเพียงไม่กี่รายการ

หลีกเลี่ยงการส่งข้อมูลที่ไม่จำเป็น เช่น ประวัติแชตทั้งหมด หรือเอกสารลูกค้าทั้งหมดในคราวเดียว

### 8.3 รูปแบบผลลัพธ์ที่ AI ต้องส่งกลับ

กำหนดให้ AI ส่งข้อมูลที่มีโครงสร้าง เช่น:

```json
{
  "customer": "",
  "booking_number": "",
  "shipment_type": "",
  "origin": "",
  "destination": "",
  "deadline": "",
  "summary": "",
  "suggested_todos": [],
  "missing_information": [],
  "confidence": "low|medium|high"
}
```

### 8.4 ขั้นตอน AI-to-confirmation

1. Flow รับข้อความหรืออีเมล
2. ระบบเรียก AI API เพื่อสรุป/แยกข้อมูล
3. Flow ตรวจว่าค่าอยู่ในรายการที่อนุญาต เช่น Shipment Type และ Status
4. Flow สร้าง Adaptive Card แสดงข้อมูลที่ AI ดึงได้ พร้อมข้อมูลที่ขาด
5. CS หรือหัวหน้ากด `ยืนยัน`, `แก้ไข`, หรือ `ยกเลิก`
6. เฉพาะผลที่ยืนยันแล้วจึงถูกเขียนลง Lists
7. บันทึกใน Activity Log ว่าข้อมูลมาจาก AI draft และผู้ใดยืนยัน

### 8.5 หลักการ prompt สำหรับ AI

กำหนดหน้าที่ให้ชัด:

- สรุปเฉพาะข้อเท็จจริงในข้อความ
- ห้ามเดาข้อมูลที่ไม่มี
- ระบุ field ที่ไม่พบเป็น `null` หรือ `missing_information`
- ใช้ค่า Shipment Type และ Status จากรายการที่ระบบส่งให้เท่านั้น
- หากไม่มั่นใจ ต้องลด confidence และเสนอคำถามชี้แจง

## 9. ทำ AI Bot ใน Teams ระยะถัดไป

เมื่อ workflow/ข้อมูลเริ่มนิ่ง ให้ทำ Teams Bot เพื่อให้ผู้ใช้ @mention หรือคุยกับบอตได้

### ความสามารถเริ่มต้นของบอต

- `สร้างงาน` — สร้าง Job Card ร่างแล้วให้ยืนยัน
- `สรุปงานของฉัน` — อ่าน Job Card ที่ Owner เป็นผู้ถาม
- `งานใกล้ deadline` — รายงานงานเสี่ยง
- `ค้นหา job` — ค้นด้วย Job ID, booking number หรือลูกค้า
- `สรุปอีเมลนี้` — สรุปและเสนอ action items
- `อัปเดต job` — เสนอการเปลี่ยนสถานะ/โน้ต แล้วให้ยืนยัน

### หลักการสิทธิ์ของบอต

- ผู้ใช้เห็นเฉพาะ Job Card ที่ตนเองมีสิทธิ์
- การถามใน Channel ให้ตอบเฉพาะข้อมูลที่เหมาะกับสมาชิกใน Channel
- การแก้ Owner, Deadline, หรือการปิดงาน ต้องใช้การ์ดอนุมัติและตรวจ role
- ให้บอตเริ่มทำงานเมื่อถูก @mention เพื่อไม่อ่านบทสนทนาที่ไม่เกี่ยวข้อง

## 10. การทดสอบก่อนเปิดใช้จริง

### 10.1 สร้างชุดข้อมูลทดสอบ

สร้างตัวอย่างอย่างน้อย:

- Job Card ปกติ 10 งาน
- งานใกล้ deadline 3 งาน
- งานเกินกำหนด 2 งาน
- งาน Waiting Customer 3 งาน
- CS 3–5 คนที่ workload ต่างกัน
- อีเมลตัวอย่างที่ข้อมูลครบ, ข้อมูลไม่ครบ และข้อมูลคลุมเครือ

### 10.2 ทดสอบกรณีสำคัญ

- สร้างงานพร้อมข้อมูลครบ
- สร้างงานที่ไม่มี Owner หรือ Deadline
- CS ที่ไม่ใช่เจ้าของพยายามแก้ข้อมูลสำคัญ
- CS กดรับงานและอัปเดตสถานะ
- แจ้งเตือน 24 ชั่วโมง/4 ชั่วโมงทำงานถูกต้อง
- งานที่หมดกำหนดถูก escalation เพียงครั้งเดียว
- AI สรุปอีเมลที่มีข้อมูลขาด และไม่เดาข้อมูล
- AI เสนอ Job เดิมผิด ต้องให้ผู้ใช้แก้ก่อนบันทึกได้
- ลิงก์เอกสารเปิดได้เฉพาะผู้มีสิทธิ์

### 10.3 เกณฑ์ผ่านก่อนใช้งานจริง

- งานใหม่มี Owner และ deadline ครบทุกงาน
- CS อัปเดตสถานะจาก Teams ได้โดยไม่ต้องแก้ใน Lists
- การแจ้งเตือนไม่ส่งซ้ำหรือรบกวนเกินจำเป็น
- ข้อมูล AI ไม่มีการบันทึกจริงหากยังไม่ถูกยืนยัน
- หัวหน้าดูงานค้างและ workload ได้ภายในไม่กี่คลิก

## 11. แผนทดลองใช้ 4 สัปดาห์

| สัปดาห์ | สิ่งที่ทำ | ผลลัพธ์ |
| --- | --- | --- |
| 1 | สร้าง Lists, template และ Teams channels | โครงสร้างข้อมูลพร้อม |
| 2 | สร้าง Flow งานใหม่/อัปเดต/แจ้งเตือน | ทีมทดลอง workflow หลัก |
| 3 | เพิ่ม AI draft สำหรับอีเมลและคำสั่ง Teams | CS ยืนยันข้อมูล AI ได้ |
| 4 | ทดลองใช้งานจริงกับทีมเล็ก วิเคราะห์ปัญหา | รายการปรับปรุงก่อนขยาย |

## 12. แนวทางควบคุมต้นทุน

- ใช้ Teams, Lists, SharePoint และ standard Power Automate connectors ที่องค์กรมีอยู่ก่อน
- ให้ AI ทำงานจาก trigger เฉพาะ: อีเมลใหม่, ปุ่ม “สรุปด้วย AI”, หรือ @mention บอต
- จำกัดความยาวของข้อความ/เอกสารที่ส่งให้ AI
- ส่งข้อมูลผลลัพธ์แบบโครงสร้างเพื่อลดการเรียกซ้ำ
- ตั้งงบและติดตามจำนวนครั้งเรียก AI API รายเดือน
- เริ่มจาก flow ที่ไม่มี premium connector แล้วจึงประเมินความจำเป็นก่อนเพิ่มบริการ

## 13. การส่งมอบรุ่น MVP

ก่อนจบ MVP ควรมีสิ่งต่อไปนี้:

- Microsoft Team และ Channels ที่ใช้งานจริง
- Lists: Job Cards, To-dos, Activity Log, Task Templates
- Flows: สร้างงาน, อัปเดตงาน, To-do, แจ้งเตือน, escalation
- SharePoint document structure
- คู่มือสั้นสำหรับผู้สั่งงาน, CS และหัวหน้าทีม
- ชุดข้อมูลทดสอบและผลการทดสอบ
- AI draft flow อย่างน้อย 1 use case พร้อมการ์ดยืนยัน
- รายงานข้อจำกัด/ค่าใช้จ่าย และแผนระยะถัดไปสำหรับ Teams Bot

## 14. สรุปลำดับการทำงานที่แนะนำ

1. ตกลง workflow และสถานะก่อน
2. สร้าง Lists และ views
3. สร้าง Team/Channel และสิทธิ์
4. ทำ Power Automate สำหรับงานใหม่และอัปเดตก่อน
5. เพิ่ม deadline/escalation หลังข้อมูลเริ่มนิ่ง
6. เพิ่มอีเมลเข้าและ SharePoint เอกสาร
7. เชื่อม AI เพื่อสร้าง “ร่าง” พร้อมการยืนยัน
8. ทดลองกับทีมเล็ก 4 สัปดาห์
9. ปรับกติกาและ template
10. ตัดสินใจลงทุนทำ Teams Bot แบบเต็มรูปแบบเมื่อ workflow ผ่านการพิสูจน์แล้ว

## 15. รายละเอียด Nodes/Actions ของ Power Automate

> ใน Power Automate คำว่า node ในเอกสารนี้หมายถึง Trigger, Action, Condition, Loop, Scope และการจัดการข้อผิดพลาดที่วางต่อกันใน Cloud Flow

### 15.1 มาตรฐานก่อนเริ่มสร้างทุก Flow

ก่อนสร้าง Flow ให้ตั้งมาตรฐานร่วมกันดังนี้:

- ตั้งชื่อ Flow เป็น `Fxx - ชื่อ flow` เช่น `F01 - Create Job Card from Teams`
- เก็บค่าคงที่ เช่น Team ID, Channel ID, ชื่อ Lists, URL SharePoint และอีเมลหัวหน้าทีมใน Environment Variables หรือรายการตั้งค่ากลาง
- ใช้ `Scope - Try`, `Scope - Catch` และ `Scope - Finally` กับ flow สำคัญ
- ทุกครั้งที่สร้าง/แก้ Job Card ให้เพิ่มรายการใน `Activity Log`
- ทุก flow ที่ส่งการแจ้งเตือน ให้เก็บ timestamp ของการส่งไว้เพื่อป้องกันการแจ้งซ้ำ
- กำหนด naming ของ action ให้สื่อความหมาย เช่น `Get_Job_Card`, `Update_Job_Status`, `Post_Card_To_Owner`

### 15.2 Flow F01 — สร้าง Job Card จาก Microsoft Forms/Teams

**วัตถุประสงค์:** รับคำขอจากผู้สั่งงาน แล้วสร้าง Job Card และ To-do เริ่มต้น

**Trigger:** `Microsoft Forms - When a new response is submitted`

| ลำดับ | Node / Action | Connector | การตั้งค่าหลัก |
| ---: | --- | --- | --- |
| 1 | When a new response is submitted | Microsoft Forms | เลือกฟอร์ม `Create Freight Job` |
| 2 | Get response details | Microsoft Forms | ใช้ Response ID จาก Trigger |
| 3 | Initialize variable: JobYear | Variables | String = ปีปัจจุบัน |
| 4 | Initialize variable: JobSequence | Variables | Integer = 0; ใช้ประกอบ Job ID |
| 5 | Get items: Job Cards | SharePoint | Filter งานที่สร้างในปีปัจจุบัน; Top Count = 1; เรียงลำดับล่าสุด |
| 6 | Compose: New Job ID | Data Operations | สร้างรูปแบบ `JOB-YYYY-####` |
| 7 | Condition: ข้อมูลบังคับครบหรือไม่ | Control | ตรวจ Customer, Shipment Type, Owner, Deadline |
| 8A | Post message: ขอข้อมูลเพิ่ม | Microsoft Teams | ทำเมื่อข้อมูลไม่ครบ; ส่งถึงผู้ส่งฟอร์ม |
| 8B | Terminate: Incomplete | Control | สถานะ Cancelled หรือ Succeeded ตามนโยบาย |
| 9 | Create item: Job Cards | SharePoint | เขียนข้อมูล Job Card หลัก |
| 10 | Get items: Task Templates | SharePoint | Filter ตาม Shipment Type |
| 11 | Apply to each: Template item | Control | วนสร้าง To-do ทุกข้อใน template |
| 12 | Create item: To-dos | SharePoint | Title, Job ID, Assigned To, Deadline, Source = Template |
| 13 | Create item: Activity Log | SharePoint | Action = Created; Source = Teams/Form |
| 14 | Create adaptive card | Data Operations / Teams | สร้างการ์ดสรุป Job Card สำหรับ CS |
| 15 | Post adaptive card and wait for a response | Microsoft Teams | ส่งถึง Owner; ปุ่ม รับงาน/ขอความช่วยเหลือ |
| 16 | Condition: ผลตอบกลับจาก CS | Control | แยก Accepted / Need Help |
| 17 | Update item: Job Cards | SharePoint | เปลี่ยน Status เป็น Assigned หรือ In Progress ตามผลตอบกลับ |
| 18 | Post message: ยืนยันการสร้างงาน | Microsoft Teams | แจ้งผู้สั่งงานพร้อม Job ID และ Owner |

**หมายเหตุการออกแบบ:** ถ้าใช้ `Post adaptive card and wait for a response` Flow อาจรอเป็นเวลานาน ให้กำหนด timeout และมี Flow ติดตามงานที่ยังไม่ถูกรับแยกต่างหาก

### 15.3 Flow F02 — รับงานและอัปเดตสถานะจาก Teams Card

**วัตถุประสงค์:** ให้ CS กดปุ่มใน Teams เพื่ออัปเดต Job Card โดยไม่ต้องเปิด Lists

**Trigger ที่เลือกใช้:** `Microsoft Teams - When someone responds to an adaptive card`

| ลำดับ | Node / Action | Connector | การตั้งค่าหลัก |
| ---: | --- | --- | --- |
| 1 | When someone responds to an adaptive card | Microsoft Teams | รับ `JobID`, `Action`, `Comment` จาก card data |
| 2 | Parse JSON: Card response | Data Operations | แยกค่า JobID, Action, Comment, RequestedDeadline |
| 3 | Get items: Job Cards | SharePoint | Filter Query ตาม Job ID; Top Count = 1 |
| 4 | Condition: พบ Job Card หรือไม่ | Control | ถ้าไม่พบ ส่งข้อความแจ้ง CS และจบ Flow |
| 5 | Compose: Current Job | Data Operations | เลือก item แรกจากผลค้นหา |
| 6 | Condition: ผู้ตอบมีสิทธิ์หรือไม่ | Control | เทียบ responder กับ Owner/Assistant/หัวหน้า |
| 7A | Post message: ไม่มีสิทธิ์ | Microsoft Teams | ส่งเฉพาะผู้ตอบ |
| 7B | Terminate: Unauthorized | Control | หยุด Flow |
| 8 | Switch: Action | Control | แยก `Accept`, `Start`, `Waiting`, `Blocked`, `Complete`, `Request Deadline Change` |
| 9 | Update item: Job Cards | SharePoint | เปลี่ยน Status, Latest Summary, Last Updated At |
| 10 | Create item: Activity Log | SharePoint | Action ตามที่ CS กด, Details = Comment |
| 11 | Condition: Action ต้องแจ้งหัวหน้าหรือไม่ | Control | จริงเมื่อ Blocked, Complete, เปลี่ยน deadline |
| 12 | Post message in chat/channel | Microsoft Teams | แจ้ง Owner/หัวหน้าตามความจำเป็น |
| 13 | Post message: อัปเดตสำเร็จ | Microsoft Teams | ส่งกลับ CS |

**ข้อแนะนำ:** ปุ่ม `Complete` ควรตรวจ To-do ที่ยังไม่ Done ก่อน หากยังค้าง ให้ส่งการ์ดสรุปรายการค้าง และให้หัวหน้ายืนยันกรณีจำเป็น

### 15.4 Flow F03 — เพิ่มและปิด To-do

**วัตถุประสงค์:** ให้ CS เพิ่มงานย่อยและติ๊กงานเสร็จจาก Teams

**Trigger:** `Microsoft Teams - When someone responds to an adaptive card` หรือ `Power Apps - When an action is performed`

| ลำดับ | Node / Action | Connector | การตั้งค่าหลัก |
| ---: | --- | --- | --- |
| 1 | Trigger รับคำตอบจากการ์ด | Teams / Power Apps | รับ Operation = CreateTodo หรือ CompleteTodo |
| 2 | Parse JSON | Data Operations | อ่าน Job ID, To-do ID, title, assignee, deadline |
| 3 | Switch: Operation | Control | แยกสร้าง/แก้/ปิด To-do |
| 4A | Create item: To-dos | SharePoint | ใช้เมื่อ CreateTodo |
| 4B | Update item: To-dos | SharePoint | ใช้เมื่อ CompleteTodo หรือแก้ deadline |
| 5 | Create item: Activity Log | SharePoint | บันทึกการกระทำทุกครั้ง |
| 6 | Condition: มีผู้รับผิดชอบใหม่หรือไม่ | Control | ถ้ามี ให้ส่งการ์ดแจ้งงาน |
| 7 | Get items: To-dos | SharePoint | Filter ตาม Job ID และ Status ไม่ใช่ Done |
| 8 | Condition: ยังมี To-do ค้างหรือไม่ | Control | ถ้าไม่เหลือ ให้ส่ง card เสนอปิด Job Card |

### 15.5 Flow F04 — แจ้งเตือน Deadline และ Escalation

**วัตถุประสงค์:** ตรวจงานตามรอบเวลา ส่ง reminder และแจ้งหัวหน้าเมื่อเสี่ยงหรือเกินกำหนด

**Trigger:** `Recurrence`

ตั้งเวลาเริ่มต้นทุก 1 ชั่วโมงในเขตเวลา `Asia/Bangkok`

| ลำดับ | Node / Action | Connector | การตั้งค่าหลัก |
| ---: | --- | --- | --- |
| 1 | Recurrence | Schedule | ทุก 1 ชั่วโมง |
| 2 | Initialize variable: NowLocal | Variables | เวลาปัจจุบันของ Asia/Bangkok |
| 3 | Get items: Job Cards | SharePoint | ดึงเฉพาะ Status ที่ยังไม่ Completed/Cancelled |
| 4 | Apply to each: Job Card | Control | วนตรวจ Job Card |
| 5 | Compose: HoursToDeadline | Data Operations | คำนวณส่วนต่างเวลา deadline - ตอนนี้ |
| 6 | Condition: ใกล้ครบ 24 ชั่วโมงหรือไม่ | Control | ตรวจช่วงเวลาและ `Reminder24SentAt` ว่าง |
| 7 | Post adaptive card | Microsoft Teams | ส่งถึง Owner พร้อมปุ่มอัปเดตสถานะ |
| 8 | Update item: Job Cards | SharePoint | บันทึก `Reminder24SentAt` |
| 9 | Condition: ใกล้ครบ 4 ชั่วโมงหรือไม่ | Control | ตรวจ `Reminder4SentAt` ว่าง |
| 10 | Post adaptive card | Microsoft Teams | ส่งเตือนลำดับที่สอง |
| 11 | Update item: Job Cards | SharePoint | บันทึก `Reminder4SentAt` |
| 12 | Condition: Overdue หรือไม่ | Control | Deadline < Now และ Status ยังไม่เสร็จ |
| 13 | Condition: ต้อง Escalate หรือไม่ | Control | ตรวจ `EscalatedAt` ว่าง และเวลาผ่านตามกติกา |
| 14 | Post adaptive card/message | Microsoft Teams | ส่งถึงหัวหน้าทีม + ลิงก์ Job Card |
| 15 | Update item: Job Cards | SharePoint | บันทึก `EscalatedAt` |
| 16 | Create item: Activity Log | SharePoint | บันทึก reminder หรือ escalation |

**คอลัมน์เพิ่มเติมใน Job Cards ที่ต้องสร้าง:** `Reminder24SentAt`, `Reminder4SentAt`, `EscalatedAt` เป็น Date and Time เพื่อกันการส่งเตือนซ้ำ

**แนวทางเพิ่มประสิทธิภาพ:** หากรายการ Job Card มีจำนวนมาก ให้ใช้ Filter Query ของ SharePoint ดึงเฉพาะงานที่ deadline อยู่ในช่วงที่สนใจ แทนการวนทุก item

### 15.6 Flow F05 — สรุปอีเมลและเสนอ AI Draft

**วัตถุประสงค์:** ให้ AI สรุปอีเมล booking และนำเสนอข้อมูลร่างให้ CS ยืนยัน

**Trigger:** `Office 365 Outlook - When a new email arrives in a shared mailbox (V2)`

| ลำดับ | Node / Action | Connector | การตั้งค่าหลัก |
| ---: | --- | --- | --- |
| 1 | When a new email arrives in a shared mailbox (V2) | Office 365 Outlook | ระบุกล่องกลางและโฟลเดอร์ Inbox |
| 2 | Condition: เป็นอีเมลที่ต้องประมวลผลหรือไม่ | Control | ตรวจ sender/domain/subject/flag ตามกติกา |
| 3 | Html to text | Content Conversion | แปลงเนื้อหาอีเมลเป็นข้อความ |
| 4 | Compose: Email Context | Data Operations | รวม subject, sender, received time, body แบบจำกัดขนาด |
| 5 | Apply to each: Attachments | Control | ทำเมื่ออีเมลมีไฟล์แนบ |
| 6 | Get attachment | Office 365 Outlook | ดึงไฟล์แนบทีละไฟล์ |
| 7 | Create file | SharePoint | เก็บไฟล์ในโฟลเดอร์ Inbox Staging หรือ Job Folder |
| 8 | HTTP / AI API Action | AI API | ส่ง Email Context เพื่อให้สรุปเป็น JSON |
| 9 | Parse JSON: AI Result | Data Operations | แยก customer, booking, deadline, summary, missing fields |
| 10 | Get items: Job Cards | SharePoint | ค้น Booking Number/Customer เพื่อหา Job ที่อาจเกี่ยวข้อง |
| 11 | Compose: Candidate Jobs | Data Operations | เตรียมรายการ job สูงสุด 3 รายการให้ผู้ใช้เลือก |
| 12 | Post adaptive card and wait for a response | Microsoft Teams | ให้ CS เลือก `ผูก Job เดิม`, `สร้าง Job ใหม่`, `เก็บเป็นโน้ต` |
| 13 | Switch: User Decision | Control | แยกการทำงานตามการยืนยัน |
| 14A | Update item: Job Cards | SharePoint | เมื่อผูก Job เดิม; อัปเดต Latest Summary/Document Link |
| 14B | Create item: Job Cards | SharePoint | เมื่อยืนยันสร้างใหม่ |
| 14C | Create item: Activity Log | SharePoint | เมื่อเก็บเป็นข้อมูลอ้างอิง |
| 15 | Create item: Activity Log | SharePoint | บันทึก AI draft และผู้ยืนยัน |
| 16 | Post message: ดำเนินการสำเร็จ | Microsoft Teams | แจ้งผู้ยืนยัน |

**ข้อควรระวัง:** `HTTP` หรือ connector ที่เรียก AI API ภายนอกอาจเป็น premium connector ขึ้นกับรูปแบบการเชื่อมต่อและไลเซนส์ขององค์กร ให้ IT ตรวจสอบก่อนสร้าง production flow

### 15.7 Flow F06 — สรุปงานประจำวันให้หัวหน้าทีม

**วัตถุประสงค์:** ส่งภาพรวมงานที่ต้องตัดสินใจโดยไม่รบกวนด้วยแจ้งเตือนรายรายการ

**Trigger:** `Recurrence` วันทำการ เวลา 08:30

| ลำดับ | Node / Action | Connector | การตั้งค่าหลัก |
| ---: | --- | --- | --- |
| 1 | Recurrence | Schedule | วันจันทร์–ศุกร์ 08:30 |
| 2 | Get items: Job Cards | SharePoint | ดึงงาน Active |
| 3 | Filter array: Overdue | Data Operations | คัด deadline ผ่านแล้ว |
| 4 | Filter array: Due Today | Data Operations | คัด deadline ภายในวันนี้ |
| 5 | Filter array: Blocked | Data Operations | คัด Status = Blocked |
| 6 | Select: Workload fields | Data Operations | เลือก Owner/Status/Job ID เพื่อสรุป |
| 7 | Compose: Summary Body | Data Operations | สร้างข้อความ/ข้อมูลสำหรับการ์ด |
| 8 | Post adaptive card in a chat or channel | Microsoft Teams | ส่ง Channel Team Leads |
| 9 | Create item: Activity Log | SharePoint | Action = Daily Summary Sent |

### 15.8 Flow F07 — คำสั่ง Teams ไปสู่ AI Draft (ระยะ AI Bot เบื้องต้น)

**วัตถุประสงค์:** ให้ผู้ใช้เรียก AI จากข้อความที่เลือกหรือฟอร์ม โดยยังไม่ต้องสร้าง Teams Bot เต็มรูปแบบ

**Trigger ที่เหมาะสม:** `Microsoft Teams - For a selected message` หรือปุ่มใน Workflow/Power Apps

| ลำดับ | Node / Action | Connector | การตั้งค่าหลัก |
| ---: | --- | --- | --- |
| 1 | For a selected message | Microsoft Teams | ผู้ใช้กด Flow จากเมนูข้อความที่ต้องการ |
| 2 | Get message details | Microsoft Teams | อ่านข้อความที่เลือกและข้อมูลผู้ส่ง |
| 3 | Condition: ผู้ใช้มีสิทธิ์หรือไม่ | Control | ตรวจ role หรือ membership |
| 4 | Compose: AI Input | Data Operations | ใส่ข้อความ + task schema ที่อนุญาต |
| 5 | HTTP / AI API Action | AI API | ขอให้สรุป/สร้าง Job Draft JSON |
| 6 | Parse JSON | Data Operations | ตรวจรูปแบบผลลัพธ์ |
| 7 | Post adaptive card and wait for a response | Microsoft Teams | แสดง Draft พร้อม ยืนยัน/แก้ไข/ยกเลิก |
| 8 | Condition: User Approved | Control | บันทึกเฉพาะที่อนุมัติ |
| 9 | Create/Update item | SharePoint | เขียน Job Card หรือ To-do |
| 10 | Create item: Activity Log | SharePoint | Source = AI Draft |

### 15.9 รูปแบบ Error Handling ที่ใช้ซ้ำ

ทุก Flow สำคัญให้ใช้โครงนี้:

1. `Scope - Try`: ใส่ actions หลักทั้งหมด
2. `Scope - Catch`: กำหนด `Configure run after` ให้ทำงานเมื่อ Try failed, timed out หรือ skipped
3. ภายใน Catch ใช้ `Compose: Error Summary` เพื่อเก็บชื่อ flow, เวลาที่เกิด และ Job ID ถ้ามี
4. `Create item: Flow Error Log` ใน List แยก หรือ `Activity Log`
5. `Post message` ถึง channel ผู้ดูแลเฉพาะเมื่อ error กระทบงานจริง
6. `Scope - Finally`: ทำงานเสมอ เช่น ปิดสถานะ processing หรือบันทึกเวลาจบ

ไม่ควรส่งรายละเอียด error ทางเทคนิคให้ CS ในแชต ให้ส่งข้อความสั้นว่าระบบบันทึกไม่สำเร็จและให้ลองใหม่/แจ้งผู้ดูแล พร้อม Job ID ที่เกี่ยวข้อง

### 15.10 Checklist หลังสร้าง Flow

- ตรวจ connection ทุกตัวด้วย service account หรือบัญชีที่ทีมอนุญาต
- ทดสอบ permission ของ CS, หัวหน้า และผู้ดูแลแยกกัน
- ทดสอบกรณีข้อมูลว่าง, วันที่ผิด, owner ไม่มีอยู่, และ Job ID ไม่พบ
- ตรวจ Flow run history ทุกวันในช่วงทดลอง
- ตั้ง owner ร่วมอย่างน้อย 2 คนสำหรับ flow สำคัญ
- เปิด/ปิด flow ผ่าน change process ไม่แก้ production โดยไม่ทดสอบ
- กำหนด Data Loss Prevention policy ร่วมกับ IT สำหรับ connector ที่เกี่ยวข้อง
