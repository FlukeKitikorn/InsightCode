# Test cases กับภาษาที่รองรับ

## โครงสร้างในระบบ

- **โจทย์ 1 ข้อ = ชุด test case 1 ชุด** (ตาราง `problems` + `test_cases`)
- Test case แต่ละตัวมี `input_data` และ `expected_output` เป็นข้อความ (มักเป็น JSON หรือข้อความที่ทุกภาษารันแล้วเทียบได้)
- **ไม่ได้แยก test case ต่อภาษา** — ใช้ชุดเดียวกันทุกภาษา เพราะ input/output เป็น data

## ภาษาที่รองรับจริง (รัน/ตรวจได้)

| ภาษา        | Frontend (เลือกได้) | Backend รัน/ judge |
|-------------|---------------------|---------------------|
| JavaScript  | ✅                  | ✅                  |
| TypeScript  | ✅                  | ✅                  |
| Python      | ✅                  | ❌ ยังไม่ implement |
| C++         | ✅                  | ❌ ยังไม่ implement |
| Java        | ✅                  | ❌ ยังไม่ implement |
| Go          | ✅                  | ❌ ยังไม่ implement |

สรุป: **ตอนนี้โค้ดที่ต้องการเช็คมี test case ไว้เปรียบเทียบแล้ว (ชุดเดียวต่อโจทย์)** และ **ภาษาที่ระบบรัน/เปรียบเทียบได้จริงมีแค่ JavaScript กับ TypeScript** ภาษา Python/C++/Java/Go ฝั่ง frontend มีให้เลือกแต่ backend ยังไม่รัน

ถ้าต้องการรองรับหลายภาษา ต้องเพิ่ม executor แต่ละภาษาใน Backend (เช่น run Python ผ่าน child_process หรือ sandbox) โดยยังใช้ชุด test case เดิมได้ (input/expected เหมือนกันทุกภาษา)
