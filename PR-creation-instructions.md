# 🧠 Instruction: How to Generate Pull Request Descriptions (Markdown)

When creating a Pull Request, always generate a **clear, structured PR description in Markdown** that explains **what was added, changed, and why** from a product and technical perspective.

Follow the structure below.

---

## 🏷️ Title

Write a short, descriptive title that explains the main purpose of the PR.

**Good examples:**

* `Add Multiple Choice Translation Exercise`
* `Fix navigation bug in Topic Selection`
* `Refactor vocabulary state management`

---

## 🎯 Overview

Provide a short summary (2–4 sentences) explaining:

* What this PR introduces or fixes
* The purpose of the change
* The user or system benefit

**Focus on intent, not code.**

---

## 🛣️ User Flow (If Feature Affects UI)

Describe how a user reaches and interacts with the feature.

Use a **step-by-step flow**:

```md
## 🛣️ User Flow

1. Login  
2. Select Language  
3. Choose Learning Type  
4. Open Exercise → Multiple Choice
```

Skip this section for backend-only or internal refactors.

---

## 📋 Feature / Behavior Details

Explain how the feature behaves.

Use subsections where helpful:

```md
## 📋 Exercise Flow

### Direction Selection
Users choose translation direction before starting.

### Question Structure
- 1 word
- 4 answer options
- Progress indicator (e.g., 3/10)

### Answer Feedback
- Wrong answer → retry allowed
- Correct answer → auto-advance after 2s
```

Describe **what the user experiences**, not implementation code.

---

## ✅ Completion / Result State

If the feature has an end state (finish screen, success state, etc.), describe it:

```md
## ✅ Completion Flow

- Shows completion message
- “Practice Again” button
- No score summary
```

---

## 🔧 Technical Implementation

Explain **how** it was implemented at a high level.

Include:

* New screens/components/modules
* Updated files
* New utilities or helpers
* Navigation or routing changes
* State management changes

```md
## 🔧 Technical Implementation

- Added `MultipleChoiceTranslationExerciseScreen`
- Integrated into `AppNavigator`
- Added exercise generator in `utils/exerciseUtils.js`
```

Avoid dumping large code blocks unless absolutely necessary.

---

## ✨ Key Features / Improvements

List the main highlights.

Use bullet points:

```md
## ✨ Key Features

- Topic-based vocabulary questions
- Direction selection (native ↔ studied)
- Retry on incorrect answers
- Consistent UI with other exercises
```

---

## 🎯 Benefits

Explain **why this change is valuable**.

Focus on:

* User experience
* Learning outcomes
* Maintainability
* Consistency
* Performance (if relevant)

```md
## 🎯 Benefits

- Expands vocabulary practice options
- Encourages learning without score pressure
- Keeps exercise experience consistent
```

---

## 🧪 Testing Notes (If Applicable)

Mention how the feature was tested:

```md
## 🧪 Testing

- Tested both translation directions
- Verified retry logic on wrong answers
- Confirmed completion flow and restart behavior
```

---

## 🚫 What to Avoid

The AI agent **must NOT**:

* Paste raw diffs
* Paste entire files
* Over-explain obvious code
* Write vague descriptions like “Updated stuff” or “Fixed bugs”
* Focus only on technical details without explaining user impact

---

## 🧩 Style Rules

* Use **Markdown headings and emojis** for readability
* Keep language **clear and professional**
* Prefer **bullet points** over long paragraphs
* Explain **why**, not just **what**
* Write for **reviewers and future maintainers**

---

**Goal:**
Every PR description should allow a reviewer to understand the feature **without opening the code first**.
