# แนะนำ Model บน OpenRouter สำหรับ InsightCode

งานหลักของระบบที่ใช้ LLM:
- **วิเคราะห์โค้ดต่อ submission** — คุณภาพ โครงสร้าง ความซับซ้อน คำแนะนำ (ภาษาไทย + โค้ด)
- **สรุปแนวโน้ม** จากหลาย feedback
- **Ask AI** — ตอบคำถามจาก context (เช่น "ควรฝึกอะไรต่อ")
- **ให้คะแนนคุณภาพ** 0–100

---

## แนะนำตาม use case

### 1. วิเคราะห์โค้ดต่อ submission (เรียกบ่อย, ต่อ submission)

| ลำดับ | Model ID | เหตุผล | ราคาโดยประมาณ |
|-------|----------|--------|----------------|
| **1** | `google/gemini-2.0-flash-exp:free` | เร็ว ฟรี เหมาะรันทีละ submission ภาษาไทยได้ดี | ฟรี |
| **2** | `anthropic/claude-3.5-haiku` | เร็ว ถูก คุณภาพดี อ่านโค้ดและสรุปได้ดี | ถูก |
| **3** | `deepseek/deepseek-coder-33b-instruct` | เจาะจงเรื่องโค้ด อ่าน structure / best practice ได้ดี | ปานกลาง |
| **4** | `openai/gpt-4o-mini` | สมดุลระหว่างความเร็ว/คุณภาพ รองรับหลายภาษา | ปานกลาง |

**แนะนำเริ่มต้น:** `google/gemini-2.0-flash-exp:free` หรือ `anthropic/claude-3.5-haiku`  
- ถ้าต้องการ **ประหยัด/ฟรี** และ volume สูง → Gemini Flash (free)  
- ถ้าต้องการ **คุณภาพวิเคราะห์โค้ดชัดขึ้น** → Claude 3.5 Haiku  

---

### 2. Ask AI / สรุปแนวโน้ม (เรียกไม่บ่อย, context ยาวขึ้น)

| ลำดับ | Model ID | เหตุผล |
|-------|----------|--------|
| **1** | `anthropic/claude-3.5-sonnet` | สรุปและตอบคำถามจาก context ยาวได้ดี |
| **2** | `google/gemini-2.0-flash-exp:free` | ฟรี รองรับ context ยาว |
| **3** | `openai/gpt-4o-mini` | สมดุล ราคาไม่สูงมาก |

---

## วิธีใช้ในโปรเจกต์

1. ตั้งค่าใน `.env` (Backend หรือ worker ที่เรียก OpenRouter):

   ```env
   OPENROUTER_API_KEY="sk-or-v1-..."
   OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
   OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
   ```

2. เรียก Chat Completions API ของ OpenRouter:

   ```http
   POST https://openrouter.ai/api/v1/chat/completions
   Authorization: Bearer <OPENROUTER_API_KEY>
   HTTP-Referer: https://your-app.com   # optional แต่แนะนำ
   Content-Type: application/json

   {
     "model": "google/gemini-2.0-flash-exp:free",
     "messages": [
       { "role": "system", "content": "คุณเป็นผู้ช่วยวิเคราะห์โค้ด ให้คำแนะนำสั้นๆ เป็นภาษาไทย และให้คะแนนคุณภาพ 0-100 ในบรรทัดสุดท้ายเป็น Quality: <number>" },
       { "role": "user", "content": "ภาษา: JavaScript\n\nโค้ด:\n" + code }
     ],
     "max_tokens": 512,
     "temperature": 0.3
   }
   ```

3. แนะนำให้ **แยก model ตามงาน** (ใน config หรือ env):
   - `OPENROUTER_MODEL_ANALYZE` — ใช้วิเคราะห์โค้ดต่อ submission (เลือกแบบเร็ว/ฟรี)
   - `OPENROUTER_MODEL_ASK` — ใช้ Ask AI / สรุป (เลือกแบบรองรับ context ยาว)

---

## เช็คราคาและ model ล่าสุด

- ดูรายการ model ทั้งหมด: https://openrouter.ai/models  
- ดูราคาและ context length: https://openrouter.ai/docs  
- Filter หมวด **programming** ใน OpenRouter ได้ถ้าต้องการ model เจาะจงโค้ด

---

## สรุปสั้นๆ

| งาน | Model ที่เหมาะที่สุด |
|-----|------------------------|
| วิเคราะห์โค้ดต่อ submission (volume สูง) | `google/gemini-2.0-flash-exp:free` หรือ `anthropic/claude-3.5-haiku` |
| เจาะจงคุณภาพวิเคราะห์โค้ดมาก | `deepseek/deepseek-coder-33b-instruct` |
| Ask AI / สรุปแนวโน้ม | `anthropic/claude-3.5-sonnet` หรือ `google/gemini-2.0-flash-exp:free` |

ถ้าต้องการ **เริ่มเร็วและฟรี** ใช้ `google/gemini-2.0-flash-exp:free` ก่อน แล้วค่อยเปลี่ยนเป็น Claude Haiku หรือ DeepSeek Coder ถ้าต้องการคุณภาพวิเคราะห์โค้ดสูงขึ้น
