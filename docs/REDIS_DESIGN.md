## InsightCode – Redis Design

เอกสารนี้อธิบายการใช้ Redis ภายในระบบ InsightCode และแนวคิดการออกแบบ

---

### 1. บทบาทของ Redis ในระบบ

ในระบบนี้ Redis ถูกใช้หลัก ๆ 2 ส่วน:

1. **BullMQ Queue Backend**
   - เป็น storage สำหรับงานคิว `submission-judge`
   - เก็บข้อมูล jobs, status, retry, delay, ฯลฯ
2. (อาจเพิ่มในอนาคต) Caching
   - ปัจจุบันยังไม่ใช้ caching โดยตรง (ใช้แค่สำหรับ queue)

ไม่มีการใช้ Redis เพื่อเก็บ session หรือ key-value application โดยตรงในเวอร์ชันนี้

---

### 2. การตั้งค่า Redis

ใน `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7
    container_name: coding_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

หมายความว่า:

- Redis รันใน container `coding_redis`
- เปิด port 6379 ออกมาให้ host ใช้งานผ่าน `localhost:6379`
- ข้อมูล persistent เก็บใน volume `redis_data`

Environment vars:

- ใน Backend:
  - `REDIS_URL="redis://localhost:6379"`
- ใน worker:
  - `REDIS_URL="redis://localhost:6379"`

---

### 3. การใช้ Redis กับ BullMQ

โครงสร้างการใช้ BullMQ:

- Backend สร้าง `Queue("submission-judge")` โดยใช้ `REDIS_URL` เชื่อมต่อ Redis
- Worker สร้าง `Worker("submission-judge")` ด้วย connection เดียวกัน
- BullMQ จัดการ:
  - job queue (รอ, กำลังทำ, เสร็จ, ล้มเหลว)
  - retry, backoff, delay

### 3.1 Job Lifecycle

1. Backend `createSubmission` เรียก `judgeQueue.add("judge", { submissionId })`
2. BullMQ บันทึก job ใหม่ลง Redis (สถานะ `waiting`)
3. Worker ที่ subscribe คิวนี้จะรับ job (สถานะ `active`)
4. Worker รัน logic (เรียก Backend internal judge)
   - ถ้าสำเร็จ: job → `completed` (แล้ว removeOnComplete=true → ถูกลบออก)
   - ถ้าล้มเหลว: job → `failed`, BullMQ จัดการ retry ตาม config

---

### 4. การ Monitor Redis & Queue

ใน `docker-compose.yml` มี service:

```yaml
redisinsight:
  image: redis/redisinsight:latest
  container_name: redisinsight
  ports:
    - "5540:5540"
  depends_on:
    - redis
  volumes:
    - redisinsight_data:/db
```

นี่คือ RedisInsight – UI สำหรับดูข้อมูลใน Redis/queue:

- สามารถใช้ดู:
  - keys ใน Redis
  - ข้อมูล queue/job จาก BullMQ
- เหมาะสำหรับ debug การ judge, ตรวจดู job ที่ fail หรือ pending

---

### 5. แนวทางขยายการใช้ Redis

ในอนาคตสามารถใช้ Redis เพิ่มเติมได้เช่น:

- **Caching**:
  - cache ของ `/api/problems` หรือ `/api/admin/stats` เพื่อลด load DB
  - ใช้ TTL key-value (เช่น `problem:{id}`, `stats:admin`)

- **Rate limiting / throttling**:
  - นับจำนวน request ต่อ IP/user ต่อช่วงเวลา (สำหรับป้องกัน abuse ของ chat/submit)

- **Pub/Sub**:
  - ส่ง event ไปยัง frontend ผ่าน websocket gateway หรือ worker อื่น ๆ

ตอนนี้ design เน้นใช้ Redis เป็น queue backend ก่อน เพื่อให้ architecture ชัดเจนและปลอดภัยสำหรับ judge งานหนัก ๆ

