# OpenRouter model recommendations for InsightCode

Main LLM use cases in the system:

- **Per-submission code analysis** — quality, structure, complexity, suggestions (natural language + code)
- **Trend summarization** from multiple feedback items
- **Ask AI** — answer questions from context (e.g. “What should I practice next?”)
- **Quality score** 0–100 per submission

---

## Recommendations by use case

### 1. Per-submission code analysis (frequent, one call per submission)

| Rank | Model ID | Reason | Cost (approx) |
|------|----------|--------|----------------|
| **1** | `google/gemini-2.0-flash-exp:free` | Fast, free, good for per-submission runs, works well with Thai | Free |
| **2** | `anthropic/claude-3.5-haiku` | Fast, cheap, good quality, reads code and summarizes well | Low |
| **3** | `deepseek/deepseek-coder-33b-instruct` | Code-focused, good at structure / best practices | Medium |
| **4** | `openai/gpt-4o-mini` | Balanced speed/quality, multilingual | Medium |

**Suggested default:** `google/gemini-2.0-flash-exp:free` or `anthropic/claude-3.5-haiku`  
- For **free / low cost** and high volume → Gemini Flash (free)  
- For **clearer code analysis** → Claude 3.5 Haiku  

---

### 2. Ask AI / trend summarization (less frequent, longer context)

| Rank | Model ID | Reason |
|------|----------|--------|
| **1** | `anthropic/claude-3.5-sonnet` | Good at summarizing and answering from long context |
| **2** | `google/gemini-2.0-flash-exp:free` | Free, supports long context |
| **3** | `openai/gpt-4o-mini` | Balanced, moderate cost |

---

## How to use in the project

1. Set in `.env` (Backend or any service calling OpenRouter):

   ```env
   OPENROUTER_API_KEY="sk-or-v1-..."
   OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
   OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
   ```

2. Call OpenRouter Chat Completions API (e.g. from `Backend/src/lib/openrouter.ts`):

   - Use `openRouterChat({ messages, max_tokens, temperature })` with system + user messages.
   - For code analysis, send code + language + test result summary; ask for short feedback and a quality score 0–100.

3. Optional: use **separate env keys per task**:
   - `OPENROUTER_MODEL_ANALYZE` — per-submission code analysis (fast/free model)
   - `OPENROUTER_MODEL_ASK` — Ask AI / summarization (model with long context)

---

## Checking pricing and latest models

- Model list: https://openrouter.ai/models  
- Pricing and context length: https://openrouter.ai/docs  
- Use the **programming** filter on OpenRouter for code-focused models.

---

## Quick summary

| Task | Best-fit model |
|------|----------------|
| Per-submission code analysis (high volume) | `google/gemini-2.0-flash-exp:free` or `anthropic/claude-3.5-haiku` |
| Highest code analysis quality | `deepseek/deepseek-coder-33b-instruct` |
| Ask AI / trend summarization | `anthropic/claude-3.5-sonnet` or `google/gemini-2.0-flash-exp:free` |

For a **quick, free start**, use `google/gemini-2.0-flash-exp:free` first, then switch to Claude Haiku or DeepSeek Coder if you need better analysis quality.
