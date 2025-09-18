# Kiro MVP Slicer - Phase 1 Requirements Distillation

**Purpose:** Transform any comprehensive Kiro specification into a minimal viable Phase 1 implementation  
**Focus:** Core Kiro artifacts - requirements.md, design.md, and tasks.md  
**Goal:** Get from complex spec to working prototype in hours, not weeks

---

## Core Philosophy

**The MVP Slice Principle:** Every complex software project has a simple core that delivers the primary value. Find that core, build it first, then iterate.

**Example Transformations:**
- **E-commerce platform:** 50 features → "Browse products, add to cart, checkout"
- **Task management app:** 30 features → "Add task, mark complete, view list"  
- **API service:** 20 endpoints → "Create, read, update, delete one resource"
- **Content management:** 40 features → "Create post, edit post, display posts"

---

## Step-by-Step Process

### Step 1: Analyze the Kiro Specification

**Read these core files in order:**
1. **requirements.md** - Understand all features and user stories
2. **design.md** - See the full technical architecture
3. **tasks.md** - Review the complete implementation plan

**Key Questions:**
- What is the core value proposition?
- What's the simplest possible version that still provides value?
- Which features are "nice to have" vs "must have"?
- What's the minimum viable user workflow?

### Step 2: Identify the Core Value Loop

**Find the Essential User Journey:**
```
User Input → Core Processing → Valuable Output
```

**Examples:**
- **Blog Platform:** Write post → Save to database → Display on web page
- **API Service:** Receive request → Process data → Return JSON response
- **File Processor:** Load file → Transform data → Save result
- **Web App:** User action → Business logic → Updated interface

**Strip Everything Else:** Authentication, configuration, multiple formats, advanced features, etc.

### Step 3: Create Phase 1 Requirements

**Use this simplified structure:**

```markdown
# [Project Name] - Phase 1 Requirements

## Core Value Proposition
**What it does:** [One sentence description]

## Essential Features (Phase 1 Only)
1. [Core feature 1 - simplified]
2. [Core feature 2 - simplified]  
3. [Core feature 3 - simplified]

## User Stories (Phase 1 Only)
- As a [user], I want [core action] so that [primary benefit]
- As a [user], I want [essential function] so that [key value]
- As a [user], I want [basic capability] so that [main outcome]

## Acceptance Criteria
**Scenario: Happy Path**
Given [simple setup]
When [user does core action]
Then [system delivers value]

## What We're NOT Building (Phase 1)
❌ [Advanced feature] - Phase 2
❌ [Complex feature] - Phase 3
❌ [Nice-to-have] - Future enhancement
```

### Step 4: Simplify the Design

**Create minimal design.md:**

```markdown
# [Project Name] - Phase 1 Design

## Architecture (Simplified)
- [Component 1] - [Core responsibility]
- [Component 2] - [Essential function]
- [Component 3] - [Basic capability]

## Technology Stack (Minimal)
- [Primary technology] - [Why chosen]
- [Essential library] - [Core functionality]
- [Basic storage] - [Simple persistence]

## Data Models (Essential Only)
- [Core entity] - [Key attributes only]
- [Primary relationship] - [If absolutely necessary]

## What We're NOT Designing (Phase 1)
❌ [Complex architecture] - Phase 2
❌ [Advanced patterns] - Phase 3
❌ [Optimization] - Future enhancement
```

### Step 5: Distill the Tasks

**Create focused tasks.md:**

```markdown
# [Project Name] - Phase 1 Tasks

## Setup (30-60 minutes)
- [ ] 1.1 Create basic project structure
- [ ] 1.2 Set up minimal dependencies
- [ ] 1.3 Create entry point

## Core Implementation (2-4 hours)
- [ ] 2.1 Implement [core feature 1]
- [ ] 2.2 Implement [core feature 2]
- [ ] 2.3 Implement [core feature 3]
- [ ] 2.4 Connect components together

## Basic Testing (1-2 hours)
- [ ] 3.1 Test happy path workflow
- [ ] 3.2 Test basic error scenarios
- [ ] 3.3 Validate core functionality

**Total Estimated Time: 4-8 hours**

## What We're NOT Implementing (Phase 1)
❌ [Complex feature] - Phase 2 (estimated +X hours)
❌ [Advanced capability] - Phase 3 (estimated +Y hours)
❌ [Nice-to-have] - Future (estimated +Z hours)
```

---

## Ruthless Feature Elimination

**Always Eliminate in Phase 1:**
- ❌ **Configuration systems** - Use hardcoded defaults
- ❌ **Multiple input/output formats** - Pick one format
- ❌ **User authentication** - Skip unless core to value
- ❌ **Complex data persistence** - Use files or simple storage
- ❌ **Advanced error handling** - Basic error messages only
- ❌ **Performance optimization** - Make it work first
- ❌ **Logging and monitoring** - Console output only
- ❌ **Customization options** - One way to do things
- ❌ **Integration with external systems** - Standalone first

**Common Simplifications:**
- **Database → File storage** (JSON, CSV, text files)
- **Complex framework → Simple library** (Flask vs Django)
- **Rich UI → Basic interface** (CLI, simple HTML, basic desktop)
- **Multiple algorithms → Single approach** (one method, one model)
- **Real-time → Batch processing** (process on demand)
- **Multi-user → Single user** (no user management)

---

## Quality Validation

**Phase 1 Success Criteria:**
- [ ] **Delivers core value** - User gets the main benefit
- [ ] **Complete workflow** - End-to-end functionality works
- [ ] **4-8 hour implementation** - Quick to build and test
- [ ] **Extensible foundation** - Easy to add Phase 2 features
- [ ] **Proves concept** - Validates the idea works

**Red Flags (Scope too big):**
- 🚩 More than 8 hours estimated implementation
- 🚩 More than 5 core components needed
- 🚩 Requires complex setup or configuration
- 🚩 Multiple external dependencies or services
- 🚩 User workflow has more than 5 steps

---

## Example Applications

### Web Application
**Full Spec:** Social platform with posts, comments, likes, profiles, messaging, notifications
**Phase 1 Slice:** Create and view posts only
- **Requirements:** User can create post, user can view posts
- **Design:** Simple web form + display page + file storage
- **Tasks:** HTML form, save to JSON file, display list (4 hours)

### API Service
**Full Spec:** REST API with auth, rate limiting, multiple resources, caching, monitoring
**Phase 1 Slice:** CRUD operations on one resource
- **Requirements:** Create, read, update, delete items
- **Design:** Single endpoint + in-memory storage + JSON responses
- **Tasks:** FastAPI setup, CRUD functions, basic validation (5 hours)

### Desktop Application
**Full Spec:** File manager with views, plugins, themes, cloud sync
**Phase 1 Slice:** Browse and open files
- **Requirements:** User can navigate folders, user can open files
- **Design:** Tree view + file operations + basic UI
- **Tasks:** Tkinter interface, file browser, open handlers (6 hours)

### CLI Tool
**Full Spec:** Complex CLI with subcommands, config, plugins
**Phase 1 Slice:** Single command with core function
- **Requirements:** User runs command, gets processed output
- **Design:** Click CLI + core processor + file output
- **Tasks:** CLI setup, processing logic, output formatting (3 hours)

---

## Anti-Patterns to Avoid

**The "Just One More Feature" Trap:**
- ❌ "We just need authentication for it to be useful"
- ❌ "It's not complete without a database"
- ❌ "Users will expect a proper UI"
- ✅ **Instead:** Build the core, get feedback, then add features

**The "It's Not Professional" Trap:**
- ❌ "We can't show this to users, it's too basic"
- ❌ "It needs proper error handling first"
- ❌ "The code quality isn't good enough"
- ✅ **Instead:** Perfect is the enemy of good, ship the MVP

**The "Technical Debt" Trap:**
- ❌ "We need to architect this properly from the start"
- ❌ "Let's use the right database from day one"
- ❌ "We should implement proper patterns"
- ✅ **Instead:** Simple code that works, refactor in Phase 2

---

## Success Timeline

**Typical MVP Slice Timeline:**
- **Hour 1:** Analyze full Kiro spec, identify core value
- **Hour 2:** Create Phase 1 requirements.md (simplified)
- **Hour 3:** Create Phase 1 design.md (minimal)
- **Hour 4:** Create Phase 1 tasks.md (focused)
- **Hours 5-12:** Implement Phase 1 (4-8 hours)
- **Hour 13:** Test and validate core functionality

**Total: 1-2 days from complex spec to working prototype**

---

## Conclusion

**The Kiro MVP Slicer transforms any comprehensive specification into an actionable Phase 1 that:**
- ✅ **Delivers core value** in hours, not weeks
- ✅ **Proves the concept** with real working software
- ✅ **Enables rapid iteration** based on user feedback
- ✅ **Reduces project risk** by validating assumptions early
- ✅ **Builds momentum** with quick wins

**Process Summary:**
1. **Analyze** the full Kiro spec (requirements.md, design.md, tasks.md)
2. **Identify** the core value loop (input → processing → output)
3. **Eliminate** everything except essential features
4. **Create** simplified Phase 1 versions of all three documents
5. **Validate** scope is 4-8 hours of implementation
6. **Implement** and get real user feedback

**Remember:** The goal isn't to build the perfect application. The goal is to build the simplest thing that delivers value, then iterate based on real usage and feedback.

**Start simple. Ship fast. Iterate based on reality.**