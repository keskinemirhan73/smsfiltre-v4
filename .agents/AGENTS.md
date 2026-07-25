# \# AGENTS Guidelines for This Repository

# 

# This repository contains a Next.js application located in the root of this repository\[cite: 1]. When

# working on the project interactively with an agent (e.g. the Codex CLI) please follow

# the guidelines below so that the development experience - in particular Hot Module

# Replacement (HMR) - continues to work smoothly\[cite: 1], and token consumption is strictly minimized.

# 

# \---

# 

# \## 0. TOKEN OPTIMIZATION \& INTERACTION RULES (CRITICAL)

# 

# To maximize token efficiency and prevent budget/limit exhaustion, the Agent MUST adhere to the following execution rules:

# 

# \* \*\*No Conversational Overhead:\*\* Do NOT reply with politeness, confirmation phrases ("Sure, I can help with that", "Got it"), or explanations of what you are about to do. Start directly with the code block or the specific analysis.

# \* \*\*Diffs \& Partial Writes Only:\*\* Never rewrite an entire file if only a few lines or a single component changes. Provide only the `diff` or the specific function/block that needs replacement.

# \* \*\*No Redundant Repetitions:\*\* Do not print unchanged placeholder code or wrap small changes inside huge unmodified blocks. Keep the context window as small as possible.

# \* \*\*Static Analysis Validation:\*\* Validate type safety (TypeScript) and potential edge cases internally before outputting code. Avoid the "fix-error-loop" which drains tokens.

# 

# \---

# 

# \## 1. Use the Development Server, \*\*not\*\* `npm run build`

# 

# \* \*\*Always use `npm run dev` (or `pnpm dev`, `yarn dev`, etc.)\*\* while iterating on the application\[cite: 1]. This starts Next.js in development mode with hot-reload enabled\[cite: 1].

# \* \*\*Do \_not\_ run `npm run build` inside the agent session\[cite: 1].\*\* Running the production build command switches the `.next` folder to production assets which disables hot reload and can leave the development server in an inconsistent state\[cite: 1]. If a production build is required, do it outside of the interactive agent workflow\[cite: 1].

# 

# \## 2. Keep Dependencies in Sync

# 

# If you add or update dependencies remember to:

# 

# 1\. Update the appropriate lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`)\[cite: 1].

# 2\. Re-start the development server so that Next.js picks up the changes\[cite: 1].

# 

# \## 3. Coding Conventions

# 

# \* Prefer TypeScript (`.tsx`/`.ts`) for new components and utilities\[cite: 1]. Strict typing must be enforced to avoid compile-time runtime errors.

# \* Co-locate component-specific styles in the same folder as the component when practical\[cite: 1].

# 

# \## 4. Useful Commands Recap

# 

# | Command       | Purpose                                           |

# | ------------- | ------------------------------------------------- |

# | `npm run dev` | Start the Next.js dev server with HMR\[cite: 1].            |

# | `npm run lint` | Run ESLint checks\[cite: 1].                               |

# | `npm run test` | Execute the test suite (if present)\[cite: 1].             |

# | `npm run build` | \*\*Production build - \_do not run during agent sessions\_\*\*\[cite: 1] |

# 

# \---

# 

# Following these practices ensures that the agent-assisted development workflow stays fast, dependable\[cite: 1], and highly cost-efficient. When in doubt, restart the dev server rather than running the production build\[cite: 1].

