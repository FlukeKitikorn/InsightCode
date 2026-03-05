  # SQL สำหรับใส่โจทย์และ Test Case เข้าระบบ

  ตารางที่เกี่ยวข้อง (จาก Prisma schema):

  - `problems`: id (uuid), title, description, difficulty (EASY/MEDIUM/HARD), created_at
  - `test_cases`: id (serial), problem_id (uuid), input_data, expected_output, is_hidden

  ---

  ## 1. ใส่โจทย์ใหม่ (ได้ id กลับจาก RETURNING)

  ```sql
  INSERT INTO problems (id, title, description, difficulty, created_at)
  VALUES (
    gen_random_uuid(),
    'Two Sum',
    'Given an array of integers and a target, return indices of the two numbers that add up to target. You may assume exactly one solution.',
    'EASY',
    NOW()
  )
  RETURNING id, title, difficulty, created_at;
  ```

  เก็บค่า `id` จากผลลัพธ์ไว้ใช้ในขั้นตอนที่ 2

  ---

  ## 2. ใส่ Test Case (ใช้ problem_id จากขั้นที่ 1)

  ```sql
  -- แทนที่ 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' ด้วย id จริงของโจทย์
  INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
  VALUES
    ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', '[2, 7, 11, 15]
  9', '[0, 1]', false),
    ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', '[3, 2, 4]
  6', '[1, 2]', true),
    ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', '[3, 3]
  6', '[0, 1]', true);
  ```

  ---

  ## 3. ใส่โจทย์ + Test Case ในคำสั่งเดียว (ใช้ CTE)

  ```sql
  WITH new_problem AS (
    INSERT INTO problems (id, title, description, difficulty, created_at)
    VALUES (
      gen_random_uuid(),
      'Reverse String',
      'Reverse the input string. Input is a JSON string e.g. "hello".',
      'EASY',
      NOW()
    )
    RETURNING id
  )
  INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
  SELECT id, '"hello"', '"olleh"', false FROM new_problem
  UNION ALL
  SELECT id, '"world"', '"dlrow"', true FROM new_problem;
  ```

  หมายเหตุ: CTE แบบนี้จะได้ `id` เดียวกันทุกแถวใน `INSERT INTO test_cases` เพราะ `SELECT id FROM new_problem` ให้แถวเดียว

  ---

  ## 4. ตัวอย่างหลายโจทย์ (copy-paste แก้ id ได้)

  ```sql
  -- โจทย์ที่ 1
  INSERT INTO problems (id, title, description, difficulty, created_at)
  VALUES (gen_random_uuid(), 'Two Sum', '...', 'EASY', NOW())
  RETURNING id;

  -- ใช้ id ที่ได้ เช่น 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
  VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '[2,7,11,15]\n9', '[0,1]', false),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '[3,2,4]\n6', '[1,2]', true);

  -- โจทย์ที่ 2
  INSERT INTO problems (id, title, description, difficulty, created_at)
  VALUES (gen_random_uuid(), 'Reverse String', '...', 'EASY', NOW())
  RETURNING id;
  -- แล้ว INSERT INTO test_cases ตาม id ที่ได้
  ```

  ---

  ## 5. เช็คว่าโจทย์มี test case กี่ตัว

  ```sql
  SELECT p.id, p.title, p.difficulty, COUNT(t.id) AS test_case_count
  FROM problems p
  LEFT JOIN test_cases t ON t.problem_id = p.id
  GROUP BY p.id, p.title, p.difficulty
  ORDER BY p.created_at DESC;
  ```

  ---

  ## 6. ลบโจทย์ (จะลบ test case ตาม CASCADE)

  ```sql
  DELETE FROM problems WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
  ```

  ---

  ## รูปแบบ input_data / expected_output

  - ระบบรัน JavaScript/TypeScript โดยส่ง `input` เป็น parsed JSON (หรือ string)
  - รูปแบบที่ใช้กัน: หนึ่งบรรทัดต่อหนึ่ง argument หรือ JSON หนึ่งก้อน
  - ตัวอย่าง: `"[2, 7, 11, 15]\n9"` = array กับ target แยกบรรทัด โค้ดฝั่ง backend จะ parse ตามโจทย์
  - `expected_output` ใช้เทียบกับผลที่ได้จาก `solve(input)` (หลัง parse เป็น JSON แล้วเทียบ)

  ---

  ## 7. ตัวอย่างโจทย์ Palindrome (string)

  โจทย์: รับ string แล้วคืน `true/false` ว่าเป็น palindrome หรือไม่

  ```sql
  WITH new_problem AS (
    INSERT INTO problems (id, title, description, difficulty, created_at)
    VALUES (
      gen_random_uuid(),
      'Is Palindrome',
      'Given a string s, return true if s is a palindrome, false otherwise. Palindrome reads the same forward and backward.',
      'EASY',
      NOW()
    )
    RETURNING id
  )
  INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
  SELECT id, '"racecar"', 'true', false FROM new_problem
  UNION ALL
  SELECT id, '"abba"', 'true', true FROM new_problem
  UNION ALL
  SELECT id, '"abc"', 'false', true FROM new_problem
  UNION ALL
  SELECT id, '""', 'true', true FROM new_problem;
  ```

  ---

  ## 8. ตัวอย่างโจทย์ Transpose Matrix

  โจทย์: รับเมทริกซ์ (array 2 มิติ) แล้วคืน transpose ของเมทริกซ์

  ```sql
  WITH new_problem AS (
    INSERT INTO problems (id, title, description, difficulty, created_at)
    VALUES (
      gen_random_uuid(),
      'Transpose Matrix',
      'Given a 2D matrix, return its transpose. The transpose of a matrix is obtained by turning all rows into columns and vice versa.',
      'MEDIUM',
      NOW()
    )
    RETURNING id
  )
  INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
  SELECT id, '[[1,2,3],[4,5,6]]', '[[1,4],[2,5],[3,6]]', false FROM new_problem
  UNION ALL
  SELECT id, '[[1],[2],[3]]', '[[1,2,3]]', true FROM new_problem
  UNION ALL
  SELECT id, '[]', '[]', true FROM new_problem;
  ```

  ---

  ## 9. ตัวอย่างโจทย์ Average Score จาก JSON objects

  โจทย์: รับ array ของ object ที่มี field `score` แล้วคืนค่าเฉลี่ย (เป็นตัวเลข)

  ```sql
  WITH new_problem AS (
    INSERT INTO problems (id, title, description, difficulty, created_at)
    VALUES (
      gen_random_uuid(),
      'Average Score',
      'Given an array of objects with a numeric field \"score\", return the average score as a number. Assume at least one element unless specified otherwise.',
      'EASY',
      NOW()
    )
    RETURNING id
  )
  INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
  SELECT id, '[{"score":10},{"score":20},{"score":30}]', '20', false FROM new_problem
  UNION ALL
  SELECT id, '[{"score":5}]', '5', true FROM new_problem
  UNION ALL
  SELECT id, '[{"score":0},{"score":100}]', '50', true FROM new_problem
  UNION ALL
  SELECT id, '[]', '0', true FROM new_problem;
  ```

  > หมายเหตุ: โจทย์นี้สมมติว่า array ว่างให้คืน 0 ถ้าต้องการ behavior อื่น (เช่น throw error) ให้ปรับ test case ตาม requirement จริง

  ---

  ## 10. ตัวอย่างโจทย์ Two Sum (เวอร์ชันพร้อม test case ครบชุด)

  รวมตัวอย่าง Two Sum ที่ครอบคลุมกรณีมากขึ้น (รวมลบและ duplicate)

  ```sql
  WITH new_problem AS (
    INSERT INTO problems (id, title, description, difficulty, created_at)
    VALUES (
      gen_random_uuid(),
      'Two Sum (extended)',
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Assume exactly one solution and you may not use the same element twice.',
      'EASY',
      NOW()
    )
    RETURNING id
  )
  INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
  SELECT id, '[2,7,11,15]
  9', '[0,1]', false FROM new_problem
  UNION ALL
  SELECT id, '[3,2,4]
  6', '[1,2]', true FROM new_problem
  UNION ALL
  SELECT id, '[3,3]
  6', '[0,1]', true FROM new_problem
  UNION ALL
  SELECT id, '[-1,-2,-3,-4,-5]
  -8', '[2,4]', true FROM new_problem;
  ```

  ---

  ## 11. ตัวอย่างโจทย์ Bracket Validator

  โจทย์ (จาก `Backend/problems/bracket-validator/statement.md`):

  > Given a string S consisting only of (), {}, [] characters, determine whether the brackets are properly matched.  
  > Input: A single line string S (1 ≤ |S| ≤ 10^5)  
  > Output: Print YES if valid, otherwise NO.

  ```sql
  WITH new_problem AS (
    INSERT INTO problems (id, title, description, difficulty, created_at)
    VALUES (
      gen_random_uuid(),
      'Bracket Validator',
      'Given a string S consisting only of (), {}, [] characters, determine whether the brackets are properly matched. Print YES if valid, otherwise NO.',
      'EASY',
      NOW()
    )
    RETURNING id
  )
  INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
  SELECT id, '"()"', '"YES"', false FROM new_problem
  UNION ALL
  SELECT id, '"()[]{}"', '"YES"', true FROM new_problem
  UNION ALL
  SELECT id, '"(]"', '"NO"', true FROM new_problem
  UNION ALL
  SELECT id, '"([)]"', '"NO"', true FROM new_problem
  UNION ALL
  SELECT id, '"{[]}"', '"YES"', true FROM new_problem
  UNION ALL
  SELECT id, '"(((((())))))"', '"YES"', true FROM new_problem
  UNION ALL
  SELECT id, '"((("', '"NO"', true FROM new_problem;
  ```

  ### 11.1 ชุด input สำหรับทดสอบใน workspace (คัดลอกไปวางได้เลย)

  เมื่อคุณเลือกโจทย์ Bracket Validator ในหน้า workspace และใช้ภาษา JavaScript/TypeScript โดยให้ฟังก์ชันเป็น:

  ```ts
  export function solve(input: string): string {
    // ...
  }
  ```

  สามารถใช้ค่า `input` ต่อไปนี้เพื่อรันเช็คง่าย ๆ (จะถูก parse เป็น string ตรง ๆ):

  - `"()"` → ต้องได้ `"YES"`
  - `"()[]{}"` → `"YES"`
  - `"(]"` → `"NO"`
  - `"([)]"` → `"NO"`
  - `"{[]}"` → `"YES"`
  - `"(((((())))))"` → `"YES"`
  - `"((("` → `"NO"`

  หากต้องการตรวจสอบผ่าน API `POST /api/submissions/run` แบบ manual:

  ```json
  {
    "problemId": "<id ของ Bracket Validator>",
    "language": "javascript",
    "code": "export function solve(input) { /* ...your implementation... */ }"
  }
  ```

  ระบบจะใช้ `input_data`/`expected_output` จาก test_cases ข้างต้นในการเปรียบเทียบผลลัพธ์ให้โดยอัตโนมัติ

