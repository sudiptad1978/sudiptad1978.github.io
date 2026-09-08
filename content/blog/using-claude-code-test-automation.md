---
title: "Using Claude Code as a Test Automation Pair Programmer"
date: "2026-09-08"
summary: "A practical workflow for using Claude Code, Playwright and MCP to generate, maintain and review test automation without outsourcing engineering judgement."
tags: ["Claude Code", "Playwright", "MCP", "AI-Augmented QA"]
readTime: "9 min read"
---

## AI assistance is most useful inside a quality system

Claude Code is not a replacement for test design, product context or engineering judgement. It is a fast pair programmer that can inspect a repository, explain unfamiliar code, draft a test, run a focused command and iterate on the result.

That distinction matters. The useful goal is not to generate the largest possible test suite. It is to shorten the distance between a risk being identified and a trustworthy automated signal being added to the delivery path.

My preferred operating model is simple:

1. Give the agent a bounded task and the relevant product context.
2. Ask for a plan before asking for code.
3. Generate the smallest useful test change.
4. Run the test locally and inspect the diff.
5. Keep the human review responsible for risk, assertions and release intent.

## Start with repository instructions

An agent produces better work when the repository explains how quality is expected to work. Keep the instructions short, explicit and versioned alongside the code.

```text
Quality checks for this repository:

- Use Playwright with TypeScript.
- Prefer user-visible roles and labels over CSS implementation details.
- Keep tests independent and deterministic.
- Never weaken an assertion to make a test pass.
- Run the smallest relevant project command before changing scope.
- Explain changed files and remaining risks in the final response.
```

The instruction about not weakening an assertion is especially important. A passing test with a missing or vague assertion is not a quality improvement; it is a quieter failure mode.

## A repeatable Playwright workflow

A practical task might be: add coverage for a new sign-in error state. I would give Claude Code the acceptance criteria, the existing test conventions and the expected command boundary.

```text
Inspect the existing Playwright tests and identify the closest sign-in flow.

Plan a test for this acceptance criterion:
When a user submits invalid credentials, the page shows an accessible
error message and keeps the user on the sign-in screen.

Before editing, list the files you expect to change and the locator strategy.
After editing, run only the focused sign-in test and report the result.
```

The important part is the sequence. The plan exposes whether the agent has understood the requirement before it changes the repository. The focused run keeps feedback fast. The final report makes the work reviewable.

A small test should read like the product behaviour it protects:

```ts
import { test, expect } from '@playwright/test';

test('shows an accessible error for invalid credentials', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: /email/i }).fill('invalid@example.com');
  await page.getByLabel(/password/i).fill('not-the-password');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('alert')).toContainText(/could not sign you in/i);
  await expect(page).toHaveURL(/sign-in/);
});
```

The assertion is specific, the locators describe user intent and the URL check protects the journey boundary. Claude Code can draft this shape quickly, but the quality engineer still decides whether these are the right signals.

## Use MCP as a controlled context boundary

The Model Context Protocol can connect an agent to tools and data sources through a consistent interface. For quality engineering, that might mean a read-only connection to test documentation, an issue tracker, a service catalogue or a local test-data utility.

Start conservatively:

- Prefer read-only tools before write-capable tools.
- Expose the smallest useful data set.
- Keep credentials and production data outside prompts.
- Make destructive actions require an explicit human step.
- Record which external context influenced a generated change.

A useful first MCP integration is not an autonomous defect bot. It is a searchable source of acceptance criteria and known product terminology that reduces context switching while keeping the change under review.

## Maintain tests, not just generate them

The highest-value use is often maintenance. When a UI change breaks a locator, Claude Code can inspect the component, compare nearby tests and propose a repair. The review question should be: does the new locator still express the user contract?

A robust maintenance prompt can be narrow:

```text
The checkout test fails because the submit button locator no longer resolves.
Inspect the current page and the recent component change.
Propose the smallest locator update that preserves the user-facing intent.
Do not change the assertion or add a fallback locator without explaining why.
Run the focused test after the change.
```

This keeps the agent from turning a locator failure into a broad, unreviewed rewrite.

## Add guardrails to CI

A reliable workflow separates generation from acceptance. A pull request can include an agent-produced change, but CI should still run the same checks as any other contribution:

- formatting and type checks
- focused Playwright tests
- the relevant regression slice
- trace, screenshot or video evidence when useful
- a human review of assertions and test data

The agent can summarize failures, group repeated symptoms and suggest a next experiment. It should not silently convert a red build into a green one or close a defect without evidence.

## Measure the quality of the workflow

Track outcomes that tell you whether the agent is helping:

- time from acceptance criterion to first useful test
- review rework on generated changes
- flaky-test rate before and after adoption
- escaped defects covered by new scenarios
- time spent triaging CI failures

Avoid measuring success by the number of generated tests. A smaller suite with clear ownership, stable signals and meaningful assertions is usually more valuable than a large suite that teams stop trusting.

## A safe adoption sequence

A pragmatic rollout can happen in four steps:

1. **Pairing:** use Claude Code locally for explanation, test plans and small test changes.
2. **Repository context:** add quality instructions, conventions and focused commands.
3. **Controlled integrations:** introduce read-only MCP tools for documentation and issue context.
4. **Delivery feedback:** connect generated changes to CI evidence and review metrics.

This sequence keeps the quality bar visible while the team learns where agent assistance is genuinely useful.

## Final thought

AI-augmented quality engineering works when the agent accelerates disciplined practice rather than replacing it. Claude Code can help turn a clear risk into a test faster. MCP can make the right context available at the right time. The quality leader still owns the question that matters most: what evidence should make this release trustworthy?

## Further reading

- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code/overview)
- [Model Context Protocol introduction](https://modelcontextprotocol.io/introduction)
- [Playwright test documentation](https://playwright.dev/docs/test-intro)
