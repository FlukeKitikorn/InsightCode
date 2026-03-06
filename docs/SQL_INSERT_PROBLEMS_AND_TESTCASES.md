# SQL for inserting problems and test cases

Relevant tables (from Prisma schema):

- `problems`: id (uuid), title, description, difficulty (EASY/MEDIUM/HARD), created_at
- `test_cases`: id (serial), problem_id (uuid), input_data, expected_output, is_hidden

---

## 1. Insert a new problem (get id from RETURNING)

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

Keep the returned `id` for step 2.

---

## 2. Insert test cases (use problem_id from step 1)

```sql
-- Replace 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' with the actual problem id
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

## 3. Insert problem and test cases in one statement (CTE)

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

Note: The CTE yields the same `id` for every row in `INSERT INTO test_cases` because `SELECT id FROM new_problem` returns a single row.

---

## 4. Multiple problems (copy-paste and fix id)

```sql
-- Problem 1
INSERT INTO problems (id, title, description, difficulty, created_at)
VALUES (gen_random_uuid(), 'Two Sum', '...', 'EASY', NOW())
RETURNING id;

-- Use the returned id, e.g. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
INSERT INTO test_cases (problem_id, input_data, expected_output, is_hidden)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '[2,7,11,15]\n9', '[0,1]', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '[3,2,4]\n6', '[1,2]', true);

-- Problem 2
INSERT INTO problems (id, title, description, difficulty, created_at)
VALUES (gen_random_uuid(), 'Reverse String', '...', 'EASY', NOW())
RETURNING id;
-- Then INSERT INTO test_cases using the returned id
```

---

## 5. Check how many test cases each problem has

```sql
SELECT p.id, p.title, p.difficulty, COUNT(t.id) AS test_case_count
FROM problems p
LEFT JOIN test_cases t ON t.problem_id = p.id
GROUP BY p.id, p.title, p.difficulty
ORDER BY p.created_at DESC;
```

---

## 6. Delete a problem (test cases removed by CASCADE)

```sql
DELETE FROM problems WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

---

## input_data / expected_output format

- The system runs JavaScript/TypeScript and passes `input` as parsed JSON (or string).
- Common format: one line per argument or a single JSON blob.
- Example: `"[2, 7, 11, 15]\n9"` = array and target on separate lines; backend parses per problem.
- `expected_output` is compared to the result of `solve(input)` (after parsing as JSON).

---

## 7. Example: Palindrome (string)

Problem: Given a string, return `true`/`false` if it is a palindrome.

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

## 8. Example: Transpose Matrix

Problem: Given a 2D matrix (array), return its transpose.

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

## 9. Example: Average Score from JSON objects

Problem: Given an array of objects with a `score` field, return the average as a number.

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

> Note: This example assumes an empty array returns 0; adjust test cases if you need different behavior (e.g. throw).

---

## 10. Example: Two Sum (full test set)

Two Sum with broader coverage (negatives and duplicates).

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

## 11. Example: Bracket Validator

Problem (from `Backend/problems/bracket-validator/statement.md`):

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

### 11.1 Sample inputs for workspace testing

For the Bracket Validator problem in the workspace with JavaScript/TypeScript and:

```ts
export function solve(input: string): string {
  // ...
}
```

you can use these `input` values for quick runs (parsed as plain string):

- `"()"` → expect `"YES"`
- `"()[]{}"` → `"YES"`
- `"(]"` → `"NO"`
- `"([)]"` → `"NO"`
- `"{[]}"` → `"YES"`
- `"(((((())))))"` → `"YES"`
- `"((("` → `"NO"`

To test via `POST /api/submissions/run` manually:

```json
{
  "problemId": "<Bracket Validator problem id>",
  "language": "javascript",
  "code": "export function solve(input) { /* ...your implementation... */ }"
}
```

The system will compare results using the `input_data` / `expected_output` from the test cases above.
