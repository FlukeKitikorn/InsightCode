# Test cases and supported languages

## Structure in the system

- **One problem = one set of test cases** (tables `problems` + `test_cases`)
- Each test case has `input_data` and `expected_output` as text (often JSON or text comparable across languages)
- **Test cases are not per-language** — the same set is used for all languages because input/output are data

## Languages actually supported (run / judge)

| Language   | Frontend (selectable) | Backend run / judge |
|------------|-----------------------|----------------------|
| JavaScript | ✅                    | ✅                   |
| TypeScript | ✅                    | ✅                   |
| Python     | ✅                    | ❌ not implemented   |
| C++        | ✅                    | ❌ not implemented   |
| Java       | ✅                    | ❌ not implemented   |
| Go         | ✅                    | ❌ not implemented   |

**Summary:** Test cases are defined per problem (one set per problem). The only languages the system actually runs and compares today are **JavaScript and TypeScript**. Python/C++/Java/Go can be selected in the frontend but the backend does not execute them yet.

To support more languages, add an executor per language in the Backend (e.g. run Python via child_process or a sandbox), reusing the same test case set (same input/expected for all languages).
