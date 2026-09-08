---
title: "Vibe Coding Prompts: The Exact Prompt for Every Stage of the Build"
date: "2026-09-08"
summary: "A colourful, spec-first playbook of 15 prompts for turning an idea into a tested, secure and maintainable product with Claude Code, MCP and modern QA guardrails."
tags: ["Vibe Coding", "Claude Code", "MCP", "AI-Augmented QA", "Automation"]
readTime: "18 min read"
---

![Vibe Coding Prompts — a 15-stage AI-assisted quality engineering playbook](/assets/blog/vibe-coding-prompts-cover.svg)

> **Vibe coding works best when the vibe has guardrails.** This is a copy-ready prompt library for moving from a raw feature idea to a reviewed, tested and maintainable change.

![The agentic build loop: context, plan, build and verify](/assets/blog/vibe-coding-loop-v2.svg)

## How to use this playbook

Replace the bracketed placeholders with your product context. Run the prompts in order when you are starting a substantial feature, or jump to the stage that matches the risk in front of you.

The operating rule is consistent throughout: make the agent show its reasoning through artifacts, keep the scope bounded and leave a human approval point wherever the blast radius is meaningful.

---

## 01 — Write a full PRD

```text
Write a complete PRD for the feature below.

Feature: [DESCRIBE FEATURE]
Users: [WHO USES IT]
Stack: [YOUR STACK]

Include:
- Problem statement and success metrics
- User stories with acceptance criteria
- Scope: what ships in v1 and what does not
- Data model changes
- Edge cases and failure states
- Open questions for me to answer

Keep it under three pages. Be specific, with no filler.
Save it as docs/prd-[feature].md so every later prompt can reference it.
```

A PRD is the first quality gate. If the problem, user and success signal are unclear, code generation only makes the ambiguity faster.

## 02 — Create your CLAUDE.md

```text
Scan this entire codebase, then generate a CLAUDE.md.

Include:
- What this project is, in two lines
- Tech stack and the versions that matter
- Commands: RUN / BUILD / TEST / LINT
- Architecture: where things live and why
- Code conventions you actually detect in the code
- Hard rules: [YOUR NON-NEGOTIABLES]
- Gotchas a new engineer would hit soon

Write rules as short imperatives. Nothing generic — only what is true
for this repository. If you are unsure about a rule, flag it instead of
inventing it.
```

Treat `CLAUDE.md` as a living team contract. It should make the next session safer, not simply longer.

## 03 — Ultra plan mode

```text
Enter plan mode. Do not write any code yet.

Task: [PASTE TASK]
Constraints: [LANGUAGE / STACK / TIME BOX]

Steps:
1. Read every file this task touches. List each file with one line on what it does today.
2. Map current behavior against target behavior.
3. Propose two or three approaches with real trade-offs: complexity, risk and blast radius.
4. Pick one and justify it in one line.
5. Break it into steps small enough to verify one at a time, each with its own check.
6. List risks and the exact rollback for each.
7. Flag anything touching AUTH, PAYMENTS or DB code for my explicit sign-off.

Then stop. Show me the plan and wait for approval before touching a file.
```

The stop is part of the prompt. A plan that immediately turns into unreviewed edits is not plan mode.

## 04 — Spec-driven development

```text
We build specs first. Write a spec for: [FEATURE]

Context: [DOCS REF] + [RFC REF]

Spec format:
- Behavior: given / when / then for every case — happy path, edge cases and failures
- API contract: inputs, outputs, error shapes and status codes
- Data: schema changes and migrations needed
- UI states: loading, empty, error and success
- Non-goals: what this spec deliberately skips
- Acceptance checklist I can verify line by line

After I approve the spec, implement exactly the spec. If reality forces a
 deviation, stop, update the spec, get approval and then continue. The spec
is the source of truth, not the code.
```

Specs give generated code a stable target and give reviewers a checklist that is independent of implementation style.

## 05 — Full UI and UX design brief

```text
Create a full UI/UX design brief for: [SCREEN OR FLOW]

Audience: [AUDIENCE]
Brand: [COLORS / FONTS / VIBE]

Deliver:
- User journey through the flow, step by step
- Layout per screen: hierarchy, spacing and breakpoints
- Component inventory with every state — hover, empty, error and loading
- Typography and color tokens
- Motion: what animates, duration and easing
- Accessibility notes

Study patterns from [TWO OR THREE PRODUCTS YOU ADMIRE] for direction.
Never copy them.
```

This keeps visual quality in the same conversation as behavior, responsive states and accessibility instead of leaving design as a last-minute polish pass.

## 06 — Implementation plan

```text
Create an implementation plan for: [APPROVED SPEC / PRD]

Rules:
- Sequence steps so the app compiles and runs after every single step.
- For each step list: files touched, what changes, how I verify it works.
- Flag steps needing a migration or new dependency.
- Put the riskiest unknowns first.
- Size each step: S / M / L.

Output a numbered build sequence I can run one step at a time.
Wait for my “go” between steps.
```

A good implementation plan makes progress observable. Every step should leave the repository in a state that can be checked, run and rolled back.

## 07 — Wire up an MCP server

```text
Wire up an MCP server for: [SERVICE / API]

What I need it to do: [TODO TO BE DONE]

Steps:
1. Check for an official or well-maintained existing server first. Name your source.
2. If one exists, give the exact install command and the .mcp.json config scoped to this project.
3. If not, scaffold one with the MCP SDK: tools, auth, error handling and typed responses.
4. Add only the tools I will actually use: [LIST].
5. Wire secrets through environment variables. Never hardcode keys in config.
6. Verify the connection, call one tool and show me the output.
7. Document each tool in two lines so future sessions know when to reach for it.
```

Start with the smallest useful tool surface. Read-only context and explicit permissions are better foundations than an agent with unrestricted access.

## 08 — Connect your database

```text
Connect this app to [POSTGRES / SUPABASE / YOUR DB].

Requirements:
- Plan the client that fits this stack. Justify it in one line.
- Name environment variables, add them to .env.example and never commit real values.
- Define tables for [ENTITIES] with types, relations and indexes for [WANTED QUERIES].
- Create and run migrations, then show the rollback for each one.
- Add one typed query helper per table — no raw SQL scattered through components.
- Add access rules or row-level security if this is multi-tenant.
- Add connection pooling if we are serverless.

Then prove it: write one row, read it back and show me the output.
```

Database work is a high-blast-radius stage. The migration and rollback requirement makes the safety boundary explicit before the agent touches production-shaped data.

## 09 — Find security gaps

```text
Audit this codebase for security gaps. Attack it like you win.

Focus areas: [AUTH / PAYMENTS / USER DATA]

Check:
- Secrets in code, config or git history
- Injection: SQL, RCE, command and path traversal
- Auth: routes missing checks, dead sessions and broken redirects
- CORS: can user B read user A’s data?
- File uploads: input validation at every form
- Dependency CVEs: run the audit and read it
- Rate limiting on [SENSITIVE ENDPOINTS]
- What leaks through error messages and logs

Rank findings by severity with exact file and line references.
For critical findings, give a safe reproduction and the fix.
List the next ten tickets with effort estimates.
```

Do not ask an agent to perform an offensive test against a system it is not authorized to assess. Keep the scope, environment and evidence explicit.

## 10 — Debug an error fast

```text
Debug this error. Do not guess.

Error: [PASTE FULL ERROR + STACK TRACE]
When it happens: [STEPS TO REPRODUCE]

Steps:
1. Read the stack trace and open the exact files involved.
2. State expected versus actual behavior in one line.
3. List three hypotheses, ranked by likelihood.
4. Prove or kill each one with logs or a tiny test — not vibes.
5. Fix the root cause, not the symptom.
6. Search the repo for the same pattern. If it can break here, it can break elsewhere.
7. Add a regression test that fails without the fix.
8. Explain in two lines why it broke and why it should not break this way again.
```

The most valuable output is not only a patch. It is a smaller uncertainty set and a regression guard that preserves the new understanding.

## 11 — E2E test your application

```text
Write Playwright E2E tests for: [FLOW]

Stack: [YOUR STACK]
UI: [SERVER-ROUTED / SEPARATE]

Guidelines:
- Money paths first: [CHECKOUT / SIGNUP] / [CORE ACTIONS]
- Test what the user sees, not implementation details.
- Selectors: roles and labels, never brittle CSS chains.
- Add an unhappy path per flow: bad input, network failure and expired session.
- Keep tests independent and safe to run in any order.
- Use isolated data for each test.
- Run headless in CI and headed locally for debugging.
- Capture screenshots and traces on failure only.

Run the suite, show the results, fix what fails and tell me what remains uncovered.
```

This is where product intent becomes executable evidence. Keep the suite small enough to trust and broad enough to protect the money path.

## 12 — Clean up dead code

```text
Find and delete dead code in this repository.

Scope: [WHOLE REPO / SPECIFIC FOLDER]

Targets:
- Unused exports, components, hooks and utilities
- Unreachable branches and commented-out blocks
- package.json dependencies nothing imports
- Feature flags stuck always-on or always-off
- Duplicate logic that should merge into one
- Dead CSS classes and unused assertions

Verify with a search before every deletion. Dynamic imports and string
references count. Delete in small commits, run BUILD and TESTS after each
one, and report total lines removed plus anything you were not certain about.
```

Dead-code cleanup is still a change. Small commits and a verification pass protect the repository from a well-intentioned deletion that removes a runtime path.

## 13 — Write clean Git commits

```text
Commit my staged changes properly.

Convention: [CONVENTIONAL COMMITS / YOUR FORMAT]
Stack: [YOUR STACK + PACKAGE MANAGER]

Rules:
- Split unrelated changes into separate commits.
- Format: type(scope): what changed and why.
- Use feat / fix / refactor / chore / docs / test.
- Keep the subject under 50 characters and use imperative mood.
- Write a body explaining the why, wrapped at 72 characters.
- Reference the ticket: [TICKET ID].
- Never mix a refactor with a behavior change in one commit.
- Never commit secrets, .env files or generated files.

Show me the plan — files per commit, messages and checks — before committing.
Then commit one at a time so I can step through them.
```

A clean history is an operational tool. It makes review, rollback and release notes much easier for the next quality engineer.

## 14 — Hooks as guardrails

```text
Set up Claude Code hooks as guardrails here.

Stack: [YOUR STACK + PACKAGE MANAGER]

Hooks:
- PostToolUse: run [LINT + TYPECHECK] after every file edit and feed errors back.
- PreToolUse: block edits to [PROTECTED PATHS] — migrations, SQL, PRD and docs.
- Stop: run [TEST SUITE] before a session ends.
- Notification: sound a clear alert when my input is needed.

Write the root scripts and settings.json entries. Keep each script under 20
lines. On a non-zero exit, print a clear message so the agent knows exactly
what to fix. Trigger each hook on purpose and show me it working.
```

Hooks turn process expectations into executable guardrails. Keep them fast, explicit and easy to disable for a documented reason.

## 15 — Turn a task into a skill

```text
Turn this repetitive task into a Claude Code skill.

The task I keep doing: [DESCRIBE TASK + STEPS]
Audience: [YOUR STACK / TECHNOLOGIES]

Steps:
- Create ~/.claude/skills/[the-skill.md].
- Add frontmatter: name and description with the exact trigger phrases I use.
- Write a numbered workflow, conventions and edge cases.
- Explain what it should use as context versus infer on its own.
- Define what “done” looks like.

Dry-run the skill on a real example. Refine it until the output matches how
I do the task by hand.
```

A skill is a repeatable quality pattern with a name. It is valuable when it captures the decisions a team wants to make consistently, not when it merely wraps a long prompt.

## The quality bar for vibe coding

These prompts are intentionally less magical than the phrase “vibe coding” suggests. They ask for artifacts, constraints, evidence and approval because an AI-assisted workflow should raise the quality bar, not lower it.

A strong session leaves behind more than code:

- a decision trail
- a testable specification
- a small, reviewable diff
- evidence from the right checks
- a clear list of remaining risks

That is the version of vibe coding worth scaling.

## Further reading

- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code/overview)
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- [Playwright test documentation](https://playwright.dev/docs/test-intro)
