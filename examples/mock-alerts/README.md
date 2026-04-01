# AI Engineer Onboarding & Specification

Welcome! You are responsible for building `@momen124/ai-monitor-ai` (The AI Brain). 

Your job is completely isolated from the complicated infrastructure (OpenTelemetry, SigNoz, Keep). You are building a pure, stateless data pipeline: **JSON Alert In $\rightarrow$ LLM Analysis $\rightarrow$ Enriched JSON Alert Out**.

---

## 1. The Context (Your Boundaries)
1. The infrastructure monitors an app and detects a failure (e.g., High CPU, Database Timeout).
2. The infrastructure groups those errors and sends an HTTP POST request to your AI Engine.
3. Your engine receives a massive, noisy JSON payload containing stack traces and recent logs.
4. Your engine strips out PII (Personal Identifiable Information) to protect user data.
5. Your engine prompts an LLM (OpenAI, Anthropic, or local Ollama) to summarize the root cause.
6. Your engine returns the human-readable summary.

---

## 2. The Input Contract (Mock Data)
You don't need the actual servers running to start. This folder contains 24 mock JSON files representing every failure mode your AI will face (DB timeouts, Security DDoS, K8s CrashLoops). 

You will feed these into your functions to test them.

---

## 3. Core Components You Need To Build
You can start scaffolding these four features right now:

### A. The Redaction Pipeline (`redaction.ts`)
LLMs are third-party services. We cannot send them user emails, API keys, or passwords.
**Your Task:** Write regex-based or AST-based sanitizers to strip PII from `context.recent_logs`. 
*Challenge:* In `6-auth-jwt-expired.json`, the user email and IP must be replaced with `[REDACTED]` before the LLM sees it.

### B. The Provider Adapters (`providers/`)
We want zero vendor lock-in. 
**Your Task:** Create an interface `ILLMProvider` with a method `analyze(prompt: string): Promise<string>`. Implement two versions:
1. `OpenAIAdapter`: Connects to GPT-4o-mini.
2. `OllamaAdapter`: Connects to `localhost:11434` so we can test locally for free using `llama3`.

### C. The Prompt Engine (`prompts.ts`)
If we just dump the JSON into the LLM, it will hallucinate or write a novel. We need strict SRE formatting.
**Your Task:** Design a system prompt that forces the LLM to output exactly three bullet points:
- **Root Cause:** (e.g., "Redis cluster timeout during checkout")
- **Impact:** (e.g., "Payments are rolling back")
- **Suggested Fix:** (e.g., "Check Redis memory eviction or restart cluster-01")

### D. The Evaluation Harness (`eval.test.ts`)
How do we know if the prompt actually works?
**Your Task:** Write offline Jest tests. Feed `1-db-timeout.json` into your pipeline, get the LLM string back, and programmatically assert that the string contains the word "Redis" and does not contain user emails.

---

## 4. Your First Step Today
1. Create a fresh directory (`mkdir ai-monitor-ai-sandbox && cd ai-monitor-ai-sandbox`).
2. Run `npm init -y` and `npm install typescript ts-node openai dotenv`.
3. Pick one of the mock JSON files (like `1-db-timeout.json`).
4. Write a script `index.ts` that reads the JSON file, calls the OpenAI API with a hardcoded prompt, and `console.log`s the result. 

Once you get that script working, you will have successfully built the core of the AI Engine!
