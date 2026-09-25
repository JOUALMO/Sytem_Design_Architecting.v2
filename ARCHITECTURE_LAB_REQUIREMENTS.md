# Architecture Lab — Product Requirements and Technical Blueprint

## 1. Product definition

### Working name

**Architecture Lab** is a local-first, multi-project engineering workbench for designing, changing, simulating, and explaining software architectures before modifying a production codebase.

It is not a replacement for an IDE, a diagramming tool, a monitoring dashboard, or a project-management system. It is the layer between an idea and an implementation: a place where a developer can ask, _“If I move this responsibility, add this cache, change this event, split this module, or replace this technology, what will the system look like and what else will it affect?”_

The first implementation should be a Vite + React + TypeScript web application. It should be fast enough to feel like a developer tool, capable enough to model real architecture at a lower level than ordinary system-design canvases, and restrained enough that users are not greeted by a wall of controls.

### Product promise

For every project, Architecture Lab should give the user a trustworthy editable model of:

- The repository shape: applications, packages, folders, files, exports, and imports.
- The implementation shape: modules, classes, functions, hooks, API handlers, background jobs, event listeners, and schemas.
- The runtime shape: browser, edge, server, worker, database, cache, queue, external service, and device storage boundaries.
- The data shape: entities, DTOs, cache keys, serialization, indexes, invalidation rules, and ownership.
- The flow shape: a request or event traced step by step through code, state, persistence, caching, and side effects.
- The decision shape: alternatives, assumptions, risks, architecture decision records, and expected migration work.

The user must be able to alter this model quickly, compare alternatives, run bounded simulations, and generate a concrete change plan. Architecture Lab should make large changes safer before they are made in the real project.

### Design principle

**Deep model, calm surface.**

The domain model may be detailed; the initial screen must not expose every dimension at once. The main canvas should show only the view that answers the question currently being investigated. Detail belongs in a contextual inspector, command palette, progressive disclosure, and dedicated work modes.

---

## 2. Problem statement

Developers often reason about architecture using scattered artifacts:

- A code editor for implementation details.
- A whiteboard for boxes and arrows.
- A document for decisions.
- Browser developer tools for client runtime behavior.
- Logs and observability tools for production flows.
- Memory, chat messages, and issue trackers for the connection between all of them.

Those artifacts drift. A diagram describes services but not the folder/module that calls them. A codebase reveals a function but not the end-to-end business flow it belongs to. A migration idea can be written down but cannot be rehearsed alongside cache behavior, ownership, retries, and state transitions.

This is especially painful in applications combining server rendering, API routes, client state, multiple persistence layers, and caching. A Next.js + TypeScript project might include React Server Components, route handlers, Mongoose models, Redis cache-aside logic, RTK Query, IndexedDB offline storage, localStorage preferences, and background revalidation. A change that looks local can create stale reads, circular imports, cache incoherence, duplicate ownership, security leakage, or an impossible migration path.

Architecture Lab solves this by treating an architecture as a living, versioned, executable model. The model may begin as a manually created sketch, be imported from code, or blend both. It always preserves the distinction between what is observed from code and what is proposed by the user.

---

## 3. Audience and jobs to be done

### Primary user

The primary user is a senior or mid-level full-stack developer who maintains several real-world web applications. They want to explore substantial implementation changes—often alone at first—without creating a disposable diagram or disturbing the production repository.

They are comfortable with TypeScript, modules, APIs, databases, caching, browser storage, and deployment concepts. The UI should speak their language without turning every interaction into configuration work.

### Secondary users

- Tech leads preparing a proposal or migration plan.
- Small engineering teams reviewing a system change together.
- Consultants trying to understand a new client repository.
- Developers learning system design by editing a concrete model rather than only reading abstractions.

### Core jobs

1. **Map an unfamiliar project.** “Import this repository and show me what owns authentication, products, and cached reads.”
2. **Model a proposed change.** “Move product search from a direct MongoDB query to Redis cache-aside with invalidation after admin updates.”
3. **Trace a behavior.** “When a user edits a draft offline and comes back online, show every read, write, conflict, retry, and cache update.”
4. **Compare design alternatives.** “Compare keeping RTK Query as the server-state owner against moving this feature to server actions plus a small client store.”
5. **Plan real implementation.** “What folders, files, interfaces, tests, migrations, cache keys, and rollout steps change if we do this?”
6. **Preserve architectural memory.** “Why was this cache TTL chosen, and which functions are responsible for invalidation?”

### Non-goals for the first releases

- A general-purpose visual programming language.
- A full cloud IDE or a replacement for VS Code/JetBrains.
- Automatic proof that a distributed design is correct.
- A production APM, log aggregation, or metrics platform.
- A mandatory cloud collaboration product.
- Full support for every framework, language, and infrastructure provider on day one.
- Executing arbitrary imported source code in the browser.

---

## 4. Product vocabulary

The product must use consistent terminology. Architecture tools become confusing when “node,” “service,” “component,” and “module” are overloaded.

| Term | Meaning in Architecture Lab |
| --- | --- |
| Workspace | The user’s local collection of Architecture Lab projects and preferences. |
| Project | One modeled real project or a greenfield architecture. |
| Snapshot | An immutable captured state of a project model, usually imported from a repository. |
| Scenario | An editable proposed architecture built from a baseline snapshot or another scenario. |
| Element | Any modeled thing: folder, file, function, store, API endpoint, cache, schema, queue, etc. |
| Relationship | A typed connection between two elements, such as imports, calls, reads, writes, emits, or invalidates. |
| Flow | A named sequence of runtime steps that explains one user action, event, request, or job. |
| Contract | A boundary definition: input/output types, error behavior, auth needs, side effects, and performance expectations. |
| Concern | A cross-cutting category such as auth, caching, observability, tenancy, privacy, or offline sync. |
| Finding | A detected or manually recorded risk, inconsistency, constraint violation, or unanswered assumption. |
| Experiment | A deliberate scenario change plus its expected outcome and conclusion. |
| Decision | A lightweight ADR attached to model elements and a scenario. |

---

## 5. Product pillars

### 5.1 Repository-faithful

The tool must model real folder paths, imports, exports, function identifiers, schema locations, and configuration files. A service box without a path to its responsible code is insufficient for this product.

### 5.2 Runtime-aware

The tool must distinguish static dependency information from runtime interactions. An import edge is not a request. A function call is not necessarily a database read. A localStorage write is not a server persistence write.

### 5.3 Change-first

The user should be able to create a scenario, modify its model, immediately see affected flows/contracts/findings, and export an implementation plan. The scenario is the main unit of thought, not the diagram file.

### 5.4 Evidence-aware

Every fact in the model needs an origin:

- **Observed**: extracted from source/configuration.
- **Declared**: added manually by the user as a fact not inferable from code.
- **Proposed**: part of a scenario, not yet in the real project.
- **Inferred**: tool-generated and explicitly marked with confidence/evidence.

The UI must never make a proposed or inferred item look like confirmed production behavior.

### 5.5 Local-first and private by default

An imported codebase may contain proprietary architecture. The default product must work without uploading source code. Project models, snapshots, scenarios, and notes live locally. Any future AI/cloud feature must be opt-in, scoped, and transparent about what leaves the machine.

### 5.6 Useful at multiple zoom levels

The user must move naturally between:

1. System context: browser, CDN, API, databases, external providers.
2. Application/package: apps, bounded contexts, shared packages.
3. Feature/module: auth, catalog, checkout, editor, notifications.
4. File/folder: exact source locations and dependencies.
5. Function/contract: functions, hooks, actions, handlers, selectors, schemas, and cache operations.

Zooming must preserve context. A selected function should always have a navigable path back to its file, feature, application, and runtime boundary.

---

## 6. Essential user journeys

### Journey A: Start from an existing Next.js repository

1. The user selects **New Project → Import local repository**.
2. They choose a repository root and the import profile detects Next.js, TypeScript, package manager, and common dependencies.
3. A local analysis process builds an initial snapshot: folders/files, imports, exports, route files, API routes, known models, stores, and configuration.
4. The user lands in an overview with a concise health summary and a suggested list of high-value flows.
5. They choose “Product detail load.” The app opens a flow view linking the route, page/server component, query function, Redis behavior, Mongoose model, and client state.
6. Clicking any element opens a right-side inspector containing its path, code reference, interfaces, relationships, ownership, tags, and linked decisions.

Success: an initial useful model exists in minutes, not days. Imperfect extraction is acceptable only when uncertainty is visible and easy to correct.

### Journey B: Rehearse a cache architecture change

1. From a baseline snapshot, the user creates a scenario called “Product read-through cache.”
2. They add a `product:{id}:v1` Redis cache key, a cache repository adapter, a 15-minute TTL, tag-based invalidation, and a fallback to MongoDB.
3. They update the Product Detail flow so that cache read, cache miss, DB query, cache fill, and response are explicit.
4. The tool highlights product update paths that write MongoDB but do not invalidate the proposed cache.
5. The user adds invalidation calls or an event-driven invalidation consumer, then compares the two designs.
6. The app generates a change set: target files/folders, new interfaces, test cases, operational concerns, rollout strategy, and open questions.

Success: the design change exposes stale-data risks before implementation and results in a plan a developer can execute.

### Journey C: Model an offline-first feature

1. The user creates a “Draft editor offline support” scenario.
2. They model client draft state, IndexedDB persistence, a sync queue, network availability, optimistic UI, API mutation, server versioning, and conflicts.
3. They play the “edit offline → reconnect” flow step by step.
4. The tool asks for missing policy decisions: conflict strategy, retry backoff, authentication expiry behavior, maximum queue size, and deletion semantics.
5. The user records a decision and exports acceptance criteria plus test matrix.

Success: client-side state, browser persistence, and server behavior are modeled as one flow rather than independent diagrams.

### Journey D: Compare two client-state strategies

1. A user selects a feature that currently combines RTK slices, RTK Query cache, component state, and localStorage.
2. They branch two scenarios: “consolidate server state in RTK Query” and “adopt server actions plus minimal Zustand/local state.”
3. Architecture Lab compares ownership, persistence, invalidation complexity, bundle impact estimates, affected files, and migration effort tags.
4. The user marks a winner, records rationale, and turns the scenario into a migration checklist.

Success: the comparison is specific to the real project, not a generic technology debate.

---

## 7. Scope by release

### Release 0 — Product foundation (must-have)

- Vite + React + TypeScript application shell.
- Local workspace and multi-project switcher.
- Manual architecture canvas with typed elements and relationships.
- Repository tree mode with editable folders/files.
- Flow editor/player for step-by-step interactions.
- Baseline snapshot and scenario branching.
- Inspector, search, command palette, undo/redo, autosave.
- Exportable Markdown change plan.
- Local persistence and an import/export project bundle format.
- A polished dark-first UI with accessible light theme.

### Release 1 — TypeScript/Next.js-aware analysis

- Local repository importer.
- TypeScript import/export graph.
- Next.js app/pages route detection.
- Function, API handler, hook, and module extraction where AST confidence is high.
- Package/dependency detection.
- Mongoose model/schema recognition.
- Redis client/cache-operation recognition.
- Redux Toolkit store/slice/selector and RTK Query endpoint recognition.
- Browser storage wrapper recognition for IndexedDB and localStorage.
- Source evidence links and re-import diff.

### Release 2 — Architecture intelligence

- Rule engine for import cycles, boundary violations, orphaned invalidation, duplicate data ownership, and persistence mismatches.
- Contract templates and compatibility checks.
- Scenario comparison view.
- Change impact graph and implementation-plan generator.
- Architecture decision records and assumptions register.
- Test-plan generator from flows.

### Release 3 — Simulation and team workflow

- Deterministic event/flow simulation with mocked latency, failure, cache, and retry behavior.
- Trace timeline and state snapshots.
- Optional Git integration (compare a selected branch/commit with a baseline).
- Commenting/review bundles and shareable sanitized exports.
- Optional collaboration and AI assistance, both explicitly opt-in.

### Explicitly defer

- Parsing and understanding all JavaScript dynamic behavior.
- Full Docker/Kubernetes/Terraform runtime import.
- Live connection to production databases or Redis.
- Auto-editing the real repository from architecture changes.
- Cloud sync as a requirement for the first usable version.

---

## 8. Information architecture and UI/UX requirements

### 8.1 The primary layout

The application should use a familiar developer-tool frame:

```text
+--------------------------------------------------------------------------------+
| Project switcher | Scenario | Global search / command palette | Save status   |
+------------------+-------------------------------------------------------------+
| Navigation rail  |                 Main work surface             | Inspector   |
|                  |                                                 |           |
| Overview         |  Canvas / Flow / Repository / Compare / Plan  | Contextual |
| Architecture     |                                                 | details   |
| Flows            |  Persistent, focused, keyboard-friendly       | only       |
| Repository       |                                                 |           |
| Decisions        |                                                 |           |
+------------------+-------------------------------------------------------------+
| Status bar: baseline · selected element · validation · simulation status       |
+--------------------------------------------------------------------------------+
```

Requirements:

- The left rail must be narrow, icon-supported, and expandable only when needed.
- The main work surface owns the user’s attention. Avoid permanent secondary toolbars.
- The inspector opens only when an element, relationship, finding, or flow step is selected. It can be pinned, resized, or dismissed.
- Advanced tools are discoverable through selection, right-click/context menus, command palette, and a focused “Add” action—not as dozens of always-visible buttons.
- Navigation state must be shareable inside an exported project: selected scenario, current view, filters, and pinned elements can be saved as a workspace layout.

### 8.2 Main work modes

#### Overview

The default landing area should answer: “What is this project, and where should I look?” It includes:

- Project description, tags, technology profile, repository location, baseline status.
- A small system map, not a full graph dump.
- Recently changed scenarios and decisions.
- Architecture health summary with counts and severity only; details appear on click.
- Suggested entry points: most connected features, unreviewed findings, and named flows.

#### Architecture canvas

The canvas shows elements and relationships at a chosen zoom/abstraction level. It must support:

- Pan, zoom, fit-to-selection, minimap, and keyboard navigation.
- Grouping by bounded context, runtime, layer, package, feature, or user-defined group.
- Collapsed groups with relationship aggregation.
- Relationship filtering by kind and concern.
- Multiple layouts: automatic layered flow, dependency graph, domain grouping, and manual arrangement.
- Semantic coloration, not arbitrary rainbow colors. Use color chiefly for runtime/lifecycle/state and use labels/icons for redundancy.
- A calm empty state that guides creation/import rather than displaying a blank technical grid.

#### Flow view

The flow view is a trace-oriented, left-to-right or vertical timeline. It visualizes a named scenario, such as “GET /products/[id]” or “save draft offline.” Each step identifies actor, operation, payload/contract, condition, side effect, timing, and error route.

The player includes only a concise control bar: play/pause, step, speed, reset, input preset, and failure mode. Deep inputs are located in the inspector.

#### Repository view

This mode has a folder/file tree and a dependency/ownership layer. It should not become a full source editor in v0. Instead, it provides:

- File/folder metadata and responsibility statement.
- Exports, imports, functions/classes, detected framework role, and linked runtime elements.
- Links that open source in the user’s configured external editor, with line number when available.
- Scenario overlay that marks files as added, changed, moved, deprecated, or affected.

#### Compare view

Compare a baseline with a scenario, or two scenarios. It must emphasize meaningful architectural differences:

- Elements/relationships added, removed, modified, or moved.
- Flows changed and the changed steps.
- Contracts, data ownership, persistence, and cache-policy changes.
- Findings introduced/resolved.
- Estimated implementation footprint and confidence/assumptions.

#### Plan view

Plan view turns the selected scenario into an implementation-oriented checklist. The user can edit, reorder, mark complete, and export it. This is not an issue tracker; it is a change handoff artifact.

### 8.3 Visual language

Use a premium, high-contrast developer aesthetic without copying the visual clutter of an observability console.

- Dark mode is the default: warm near-black/graphite panels, soft borders, purposeful elevation, and a restrained accent color.
- Light mode must be first-class, not an inverted afterthought.
- Typography: highly legible UI sans-serif paired with a clear monospace face for paths, functions, cache keys, and types.
- Use a deliberate spacing system (4px base unit) and large enough click targets.
- Icons should communicate a small stable vocabulary: folder, file, function, route, browser, server, database, cache, queue, external service, warning, decision.
- Animate only to explain causality: flow tokens moving, simulation states changing, panel transitions. Respect reduced-motion preferences.
- Avoid excessive gradients, glossy cards, dashboard gauges, neon “cyber” decoration, and always-on particle effects.

### 8.4 Clean-interface rules

1. One dominant task per screen.
2. No more than one primary action in a visible region.
3. Hide advanced fields behind “More options” or contextual inspector sections.
4. Default graph labels should be readable at the current zoom; never label every edge simultaneously.
5. A selected object should reveal details; an unselected canvas should remain visually quiet.
6. Empty space is functional. Do not fill it with analytics tiles.
7. Each view has a clear escape hatch: reset filters, fit canvas, return to overview, close inspector.

### 8.5 Accessibility

- WCAG 2.2 AA contrast and keyboard-operable primary flows.
- Canvas elements need a parallel keyboard-accessible outline/list representation.
- Selected state cannot rely on color alone.
- Screen-reader labels for nodes, relationships, controls, and simulation changes.
- Focus management for dialogs, command palette, and inspector.
- Reduced motion and adjustable UI density.

---

## 9. The architecture model

### 9.1 Element taxonomy

The model should be extensible. Begin with a controlled vocabulary and allow a generic custom element type later.

#### Repository elements

- Repository
- Application
- Package/workspace package
- Folder
- File
- Configuration file
- Environment variable
- Dependency/package

#### Code elements

- Module
- Export
- Function
- Class
- Interface/type
- React component
- React hook
- Next.js page/layout/template/loading/error file
- Route handler
- Server action
- Middleware
- Background job/worker
- Test/spec

#### Runtime elements

- Browser/client runtime
- Next.js server runtime
- Edge runtime
- Node process/service
- Queue worker
- Cron/scheduler
- CDN
- External API/service

#### Data/state elements

- Domain entity
- DTO/contract
- Mongoose schema/model
- MongoDB collection/index
- Redis client
- Redis key pattern
- Redis set/hash/stream
- RTK store
- Redux slice
- RTK Query API/end point/tag
- Client state store
- IndexedDB database/store/index
- localStorage/sessionStorage key
- Cookie
- In-memory cache
- Queue/topic

#### Human/operational elements

- User role/actor
- Admin operation
- Deployment/configuration boundary
- Feature flag
- Secret/auth credential reference (metadata only; never secret values)
- Decision/ADR
- Assumption

### 9.2 Relationship taxonomy

Relationships must be typed, directional, and optionally conditional. Relationship kinds include:

- contains / belongs-to
- imports / exports
- depends-on / peer-depends-on
- calls / invokes
- renders / composes
- handles / routes-to
- reads / writes / deletes / updates
- queries / mutates
- caches / cache-miss-falls-back-to / invalidates / expires
- persists-to / hydrates-from / synchronizes-with
- emits / consumes / publishes-to / subscribes-to
- authenticates / authorizes
- serializes-to / deserializes-from / validates
- retries / rate-limits / circuit-breaks
- observes / logs / traces / alerts
- protects / encrypts / redacts
- tested-by / documented-by / decided-by

Every relationship needs `source`, `target`, `kind`, `evidence`, `status`, `confidence`, and optional `label`, `condition`, `latency`, `failureBehavior`, and `scenarioId`.

### 9.3 Evidence model

Each imported or inferred object should retain enough source evidence to be audited:

```ts
type Evidence = {
  kind: "source" | "config" | "manual" | "inference" | "simulation";
  filePath?: string;
  startLine?: number;
  endLine?: number;
  extractor?: string;
  capturedAt: string;
  excerpt?: string;        // short, optional, local-only
  confidence?: "high" | "medium" | "low";
};
```

Inferred elements should be styled subtly differently and have a one-click way to confirm, edit, or dismiss them.

### 9.4 Ownership model

One of the most valuable capabilities is explicit ownership. Every stateful element should support:

- Owner: feature, package, service, team, or role.
- Source of truth: whether this is authoritative, derived, cached, replicated, or ephemeral.
- Read/write actors.
- Lifecycle: request, session, device, tenant, global, job, or durable.
- Sensitivity: public, internal, personal, secret-reference, regulated.
- Retention policy and deletion expectation.

This enables detection of duplicate ownership: for example, product details marked authoritative in both an RTK slice and MongoDB, or a localStorage key that stores data marked server-only.

---

## 10. Technology-specific support requirements

The app must support generic architectural concepts first, then add practical first-class behavior for the user’s stack.

### 10.1 Next.js

Detect and model:

- App Router and Pages Router separately.
- Route segments, dynamic segments, route groups, parallel routes, intercepting routes, and API/route handlers where detectable.
- `page`, `layout`, `template`, `loading`, `error`, `not-found`, `middleware`, and `route` responsibilities.
- Server Component/client component boundary using `"use client"` and server-only patterns.
- Server actions and their callers where statically traceable.
- `fetch` caching/revalidation configuration as explicit cache behavior rather than ordinary network calls.
- Runtime hints (Node/edge), middleware, redirects, and authentication boundary points.
- Environment variable references, with value redaction.

Important limitation: static analysis must state that dynamic route generation, runtime imports, indirect function references, and framework conventions may require user confirmation.

### 10.2 TypeScript

Use the TypeScript compiler API for source analysis. Capture:

- File/module imports and exports.
- Named declarations and approximate signatures.
- Interfaces/types used across a boundary.
- Alias resolution from `tsconfig` paths.
- Circular dependency candidates.
- Unused/unreachable architecture metadata only when confidence is high.

Do not attempt to display every local variable or every expression. The default granularity is exported functions plus user-promoted internal functions. The user can promote an internal function to the model from an imported file.

### 10.3 Mongoose and MongoDB

Model:

- Connection boundary and repository/data-access boundary.
- Schema/model definitions and collection name.
- Field metadata supplied manually or extracted when practical.
- Indexes, uniqueness, sparse/TTL flags, refs, and validators when detected.
- Query operations and mutation paths.
- Transactions/sessions where identifiable.
- Data ownership, tenancy, PII classification, and migration tags.

The UI should distinguish the Mongoose model in code from the MongoDB collection it represents. The former is a code element; the latter is a persistence element.

### 10.4 Redis

Model Redis as multiple potential roles, not a generic red box:

- Cache-aside/read-through/write-through/write-behind cache.
- Distributed lock.
- Rate limiter.
- Session store.
- Pub/sub or streams.
- Queue backing store (if relevant).

For every cache key pattern, collect:

- Key template and version.
- Namespace/tenant/user partitioning.
- Value schema/serialization.
- TTL/stale-while-revalidate policy.
- Population path.
- Invalidation writers and triggers.
- Miss/failure behavior.
- Stampede protection strategy.
- Sensitive-data policy.

The product should flag cache records that have a read/population path but no invalidation policy, and mutation paths which plausibly affect a cache record but lack an invalidation relationship.

### 10.5 Redux Toolkit and RTK Query

Detect/model:

- Store configuration, reducers, middleware, and slice registration.
- Slice state, actions, reducers, selectors, and async thunks.
- RTK Query API instances, endpoints, query/mutation operations, tags, invalidates/provides relationships, polling, and cache lifetime settings.
- State ownership classification: server state, UI state, workflow state, durable client state, or derived state.

Architecture Lab should encourage—not force—clear ownership. It should flag when the same server data exists in RTK Query and a manually maintained Redux slice unless marked intentionally duplicated.

### 10.6 IndexedDB

The data model must make browser persistence visible:

- Database version.
- Object stores, primary keys, indexes, and migrations.
- Values stored, encryption marker, max-size/quota expectation.
- Read/write/delete paths.
- Sync relationship to a server truth.
- Offline queue semantics, retries, conflict policy, and purge behavior.

The flow player must handle offline states and queued mutations as first-class steps.

### 10.7 localStorage, sessionStorage, cookies

Treat these as individual keys with explicit metadata, not an invisible browser implementation detail.

- Key name/pattern, owning feature, read/write call sites.
- Data shape and serialization.
- Scope/lifetime.
- Whether it contains a preference, cache, token, draft, feature-flag assignment, or sensitive data.
- Hydration and cleanup behavior.

Security guardrails should warn—not block—when sensitive data is marked as stored in localStorage or sessionStorage.

### 10.8 Extensibility

Use a plugin-style analyzer interface from the start:

```ts
interface AnalyzerPlugin {
  id: string;
  displayName: string;
  canAnalyze(context: RepositoryContext): boolean;
  analyze(context: RepositoryContext): Promise<AnalysisContribution>;
  rules?: ArchitectureRule[];
}
```

Future plugins can add Prisma, PostgreSQL, tRPC, NestJS, TanStack Query, Zustand, Kafka, S3, Stripe, Docker Compose, Terraform, OpenTelemetry, and custom internal conventions.

---

## 11. Flows and simulation

### 11.1 Flow definition

A flow is a named, ordered graph of steps. It represents one coherent runtime behavior rather than a static dependency path.

```ts
type FlowStep = {
  id: string;
  elementId: string;
  operation: "invoke" | "read" | "write" | "cache-hit" | "cache-miss" |
             "emit" | "consume" | "validate" | "render" | "wait" | "fail";
  summary: string;
  contractId?: string;
  next: FlowTransition[];
  sideEffects?: SideEffect[];
  simulatedDurationMs?: number;
  evidenceIds: string[];
};
```

Flows may branch, retry, loop within a configured bound, and terminate with success/failure/cancelled. They should never become an unbounded general code execution engine.

### 11.2 Flow categories

- User request: page load, form submission, search, checkout.
- API request: REST/RPC route handler processing.
- Background processing: queue event, cron, cleanup job.
- Synchronization: offline replay, webhooks, cache revalidation.
- Security: sign-in, token refresh, authorization check, logout.
- Data lifecycle: create/update/delete, cache invalidation, migration.
- Failure/recovery: Redis down, database timeout, network loss, duplicate delivery.

### 11.3 Simulation contract

Simulation in early versions is deterministic and declarative. It answers “what flow would this architecture perform?” and “which branches occur under these provided conditions?” It does not execute production code.

Inputs may include:

- Cache state: hit/miss/stale/unavailable.
- Network state: online/offline/slow/failing.
- Auth state: anonymous/authenticated/expired/forbidden.
- Database response: found/not found/conflict/timeout.
- Queue delivery: once/duplicate/delayed/failing.
- Feature flag value.
- Request payload preset.

Outputs include:

- Animated trace and step timeline.
- Read/write/invalidated data list.
- Final state of modeled stores/keys.
- Error/retry path taken.
- Assumptions consumed.
- Findings triggered.

### 11.4 State snapshot panel

During a flow, the inspector can reveal a compact before/after state diff for selected stateful elements. For example:

```text
Redis: product:42:v1
- before: missing
+ after: { id: "42", name: "Lamp", version: 8 }

RTK Query: getProduct({ id: "42" })
- status: pending
+ status: fulfilled

MongoDB: products/42
  unchanged
```

Avoid showing raw payloads by default. User-provided example data should be redacted/export-safe by policy.

### 11.5 Simulation limitations to communicate

- Timing values are estimates unless user-entered or imported from telemetry later.
- Concurrency/race behavior can be represented as scenarios but not guaranteed to enumerate every interleaving.
- Data validation reflects declared contracts, not necessarily actual runtime validation.
- The simulation is a design review aid, not a substitute for integration/load/security testing.

---

## 12. Scenario, versioning, and change-impact requirements

### 12.1 Baselines and scenarios

A project contains one or more immutable baselines and mutable scenarios.

- A baseline is normally an imported repository state, tagged with repository path, git ref when available, timestamp, and analyzer version.
- A scenario points to a baseline plus a sequence of model operations (add, edit, move, remove, connect, disconnect, annotate).
- A scenario can branch from another scenario.
- The model must support a “rebase scenario on newer baseline” workflow; conflicts become explicit review items.

Do not silently overwrite a scenario after re-importing code.

### 12.2 Change operations

Use explicit operations rather than saving only a final graph. This enables auditability, undo/redo, merge, and plan generation.

Examples:

- Add `RedisKey` element.
- Change a function ownership/layer.
- Move a file from one folder to another.
- Replace a direct `reads` relationship with `cache-miss-falls-back-to` and `caches` relationships.
- Add an `invalidates` link from a mutation handler.
- Mark a module as deprecated.
- Change a contract version.

### 12.3 Impact analysis

When a model item changes, calculate a ranked impact list:

- Directly connected elements.
- Transitive dependents, bounded by user-configurable depth.
- Flows that traverse an affected element/relationship.
- Contracts read/written across the affected boundary.
- Files/source references that correspond to observed elements.
- Tests associated with the area.
- Decisions and assumptions that require re-review.

Impact must state its basis: “direct relationship,” “import path,” “flow membership,” “shared contract,” or “inferred technology convention.”

### 12.4 Change plan export

The generated plan must be editable and must never pretend to be exact source diff. It should include:

1. Goal and non-goals.
2. Baseline and scenario identifiers.
3. Architectural summary.
4. Files/folders likely added, changed, moved, or removed.
5. Contracts/data schemas/cache keys affected.
6. Ordered implementation steps.
7. Migration and compatibility strategy.
8. Tests by flow and failure mode.
9. Operational work: configuration, monitoring, cache warming, rollout/rollback.
10. Risks, assumptions, and open decisions.

Exports: Markdown in v0; JSON project bundle in v0; later PDF and issue-tracker formats.

---

## 13. Rules, findings, and guardrails

### 13.1 Rule-engine expectations

Rules must be explainable, configurable, suppressible with a reason, and scoped per project. A rule reports a finding with severity, affected elements, evidence, rationale, and suggested next actions.

Rule results are advisory. They must not block model editing or imply a false guarantee of correctness.

### 13.2 First rule set

#### Structural

- Circular import dependency detected.
- Layer rule violation (for example UI importing database package directly).
- Server-only module referenced by a client component.
- Deprecated element still has consumers.
- Orphaned function/module with no known flow or caller (low confidence by default).

#### State and data

- More than one authoritative source of truth for the same entity/field.
- Client durable store lacks defined server synchronization policy.
- Browser storage key has no owner or cleanup path.
- Schema change crosses a versioned client/server contract without compatibility note.
- Sensitive data classification conflicts with storage choice.

#### Cache

- Cache key has no TTL, invalidation, or explicitly immutable policy.
- Mutation affects entity read by a cache key without known invalidation/revalidation route.
- Redis key lacks tenant/user partitioning when its data is marked tenant/user scoped.
- Cache serialization contract differs from source entity contract.
- Cache fallback failure behavior unspecified.

#### Runtime and resiliency

- External call has no timeout/retry/circuit-breaker policy recorded.
- Queue consumer has no duplicate-delivery/idempotency note.
- Flow writes durable data but has no failure/rollback strategy.
- Offline queue lacks a conflict or auth-expiry policy.
- A critical flow crosses a runtime boundary without observability relation.

### 13.3 Findings interface

Present findings in a focused drawer/list, not as a permanent giant dashboard. A selected finding should provide:

- Plain-language explanation.
- Severity and confidence.
- Why the rule triggered.
- Exact model/source evidence.
- Affected flows.
- Suggested actions, which can create a task/assumption/decision but do not auto-change architecture without user action.

---

## 14. Repository import and analysis

### 14.1 Safety model

Repository import is read-only. It must never execute project scripts, install packages, run build steps, read `.env` values, or modify the selected repository.

The importer should let users exclude paths and enforce defaults:

- Exclude `node_modules`, `.git`, build output, caches, coverage, vendor directories, media, and secret files.
- Respect `.gitignore` by default with an explicit option to include ignored source.
- Skip files above configured size limits.
- Never retain secret values; show only environment-variable names and source locations.

### 14.2 Import workflow

1. Select folder/repository.
2. Preview detected framework/package profile and excluded paths.
3. Choose an analysis depth: repository-only, module-level, or function-aware.
4. Run local static analysis with progress stages.
5. Review summary: detected elements, low-confidence inferences, skipped files, and known limitations.
6. Save as immutable baseline.
7. Open recommended overview or create a scenario.

### 14.3 Incremental re-import

Users need refresh without losing architecture work.

- Compare current repository analysis to selected baseline.
- Produce an import diff: elements found/removed/changed, source path moves where confidently detected, new dependencies.
- Allow acceptance per group or all at once.
- Preserve manual metadata when the backing observed element remains identifiable.
- Mark broken links for review rather than deleting user-authored relationships.
- Offer a scenario rebase after importing a newer baseline.

### 14.4 Analyzer quality requirements

- Every analyzer contribution must report confidence/evidence.
- The user can disable analyzer plugins per project.
- Parser failures in one file cannot fail the entire import.
- Import must operate in a worker/process that keeps the UI responsive.
- A medium TypeScript/Next.js repository should produce a repository/module-level first snapshot within a developer-tolerable time target (initial target: less than 60 seconds on a modern local machine, excluding very large monorepos).

---

## 15. Technical architecture of the Vite application

### 15.1 Recommended stack

| Concern | Recommendation | Reason |
| --- | --- | --- |
| App shell | Vite + React + TypeScript | Fast iteration, typed UI, SPA fit. |
| Routing | React Router or TanStack Router | Typed/deep-linkable internal work modes. |
| UI primitives | Radix UI or Base UI plus a custom design system | Accessibility without generic dashboard appearance. |
| Styling | Tailwind CSS with CSS variables, or CSS Modules + tokens | Fast consistent theming; avoid component-library lock-in. |
| Canvas | React Flow / XYFlow | Mature pan/zoom/node interaction; customize heavily. |
| Local app state | Zustand | Small, ergonomic state for UI and project editing. |
| Server-state | None required initially | Product is local-first; do not add request-cache complexity prematurely. |
| Persistence | IndexedDB via Dexie | Stores potentially large project snapshots/models locally. |
| Schema validation | Zod | Validate persisted bundles and import boundary data. |
| Graph analysis | Custom domain service with graphlib/dagre where helpful | Keep architectural semantics under product control. |
| Source parsing | TypeScript Compiler API / ts-morph in worker | Accurate TS module and AST analysis. |
| Simulation | Deterministic domain engine in Web Worker | Keeps flow stepping isolated and responsive. |
| Tests | Vitest + Testing Library + Playwright | Unit, component, and end-to-end coverage. |

Avoid prematurely adding Redux/RTK to Architecture Lab merely because it models Redux. The app’s internal state requirements are better served by a compact store plus a domain command layer.

### 15.2 Recommended application folder structure

```text
src/
  app/
    App.tsx
    providers.tsx
    router.tsx
    layout/
  features/
    project-browser/
    architecture-canvas/
    flow-player/
    repository-explorer/
    scenario-compare/
    plan-export/
    findings/
    command-palette/
    inspector/
  entities/
    project/
    architecture/
    flow/
    scenario/
    decision/
  shared/
    ui/
    lib/
    config/
    styles/
  domain/
    model/
    commands/
    graph/
    rules/
    impact/
    simulation/
    export/
  infrastructure/
    persistence/
    importer/
    analyzers/
    workers/
    editor-links/
  workers/
    analysis.worker.ts
    simulation.worker.ts
```

The core domain must not import React, React Flow, Dexie, or UI-specific code. UI features invoke domain commands and render domain projections. This gives the product a durable core and makes future desktop/native or hosted variants possible.

### 15.3 Core domain packages/modules

- `model`: schemas for project, baseline, scenario, elements, relationships, flows, contracts, evidence, findings, and decisions.
- `commands`: validated mutations producing operations/events; owns undo/redo grouping.
- `graph`: adjacency indexes, path queries, layout input, and impact traversal.
- `rules`: rule definitions and execution context.
- `impact`: changeset comparison and ranked impact calculation.
- `simulation`: declarative flow runner and state-diff calculator.
- `export`: Markdown/JSON serializers that redact according to export policy.
- `importer`: file indexing, analyzer orchestration, baseline creation, and diffing.

### 15.4 Persistence model

IndexedDB tables (names are illustrative):

- `projects`: project metadata and current settings.
- `baselines`: immutable metadata, analyzer profile, source fingerprint.
- `scenarioOperations`: append-only edits grouped into undoable transactions.
- `materializedModels`: optional cached projections for fast opening.
- `flows`, `decisions`, `findings`, `layouts`, `exports`.
- `settings`: global UI/editor preferences.

Keep the source code itself out of the model database by default. Store stable evidence references and only short optional excerpts if the user approves. This reduces privacy risk and database size.

### 15.5 Performance requirements

- Initial application shell interactive in under 2.5 seconds on a normal development machine with a warm cache.
- Canvas manipulation stays near 60fps for a typical view; large models use grouping, virtualization, and level-of-detail rendering.
- Layout and static analysis run off the UI thread.
- Persist edits asynchronously and visibly report durable save status.
- Search is indexed locally; results appear as the user types for normal project sizes.
- Do not render thousands of labels/edges when zoomed out.

### 15.6 Reliability requirements

- Every edit is undoable/redoable unless it is an explicitly irreversible project cleanup.
- Auto-save must survive reload/crash after a short debounce.
- Bundle import validates schema version and offers migration or safe read-only fallback.
- Background analysis must be cancellable.
- Error states need actionable recovery: retry parser, ignore file, reset layout, restore a prior scenario revision, export diagnostics.

---

## 16. Data contracts and example model

### 16.1 Project model

```ts
type ArchitectureProject = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  technologyProfile: TechnologyProfile[];
  baselines: BaselineRef[];
  scenarios: ScenarioRef[];
  settings: ProjectSettings;
};
```

### 16.2 Element model

```ts
type ArchitectureElement = {
  id: string;
  kind: ElementKind;
  name: string;
  description?: string;
  status: "observed" | "declared" | "proposed" | "inferred" | "deprecated";
  path?: string;
  parentId?: string;
  tags: string[];
  concerns: ConcernId[];
  ownership?: Ownership;
  contractIds: string[];
  evidenceIds: string[];
  metadata: Record<string, unknown>;
};
```

### 16.3 Example: product detail cache flow

```text
Browser /products/42
  → Next.js page (server component)
  → getProduct(id)
  → Redis GET product:42:v1
    ├─ hit → validate DTO → render product
    └─ miss → Mongoose Product.findById(id)
                ├─ found → Redis SETEX product:42:v1 → validate DTO → render product
                └─ absent → render not-found

Admin update product 42
  → PATCH /api/products/42
  → validate UpdateProductInput
  → Product.findByIdAndUpdate(...)
  → Redis DEL product:42:v1
  → audit/event side effect
```

The model should explicitly join these flows through the entity and cache key; the cache deletion must not be represented as a decorative arrow unrelated to the read flow.

---

## 17. Interactions and command palette

### 17.1 Command-first operations

The command palette is essential for a developer-heavy but clean interface. It should offer actions and searchable entities:

- Create project / import repository / import bundle.
- Create scenario from baseline.
- Add element, relationship, flow, decision, assumption, or rule exception.
- Jump to route, file, function, cache key, entity, or decision.
- Focus selected element in canvas, repository, flow, or comparison.
- Run analysis, simulation, validation, auto-layout, export plan.
- Toggle theme/density/inspector/minimap.

Keyboard patterns should be conventional: `Ctrl/Cmd + K` command palette, `Ctrl/Cmd + Z` undo, `Ctrl/Cmd + Shift + Z` redo, `/` search, `Esc` clear selection/close temporary UI.

### 17.2 Contextual creation

The `Add` action adapts to context:

- Empty canvas: add a system, feature, runtime boundary, or import repository.
- Selected folder: add a folder/file/module.
- Selected function: add a call/read/write/cache/invalidation relationship or promote it to a flow step.
- Selected flow: add step, condition, error branch, retry, or state assertion.
- Selected finding: create a decision, assumption, or scenario fix.

### 17.3 Inspector sections

The inspector presents only relevant sections, in this order:

1. Identity and status.
2. Responsibility and owner.
3. Behavior/contract.
4. Connections and affected flows.
5. Technology-specific settings.
6. Evidence/source links.
7. Decisions/assumptions/findings.
8. Advanced metadata.

---

## 18. Security, privacy, and export policy

### 18.1 Local-first guarantee

The base application must make no network request for repository analysis, model persistence, or simulation. Include a visible privacy statement in import UI.

### 18.2 Sensitive data handling

- Ignore `.env`, `.pem`, credential files, and secret manager exports by default.
- Extract only variable identifiers from source references; never values.
- Redact example payload fields tagged secret/PII from exports by default.
- Avoid storing full source contents in project bundles.
- Let users mark entire projects as “restricted,” disabling future sharing/AI integrations by default.

### 18.3 Future cloud/AI features

If later added, cloud analysis must:

- Be opt-in per project and operation.
- Show an exact data-scope preview.
- Permit path/content redaction.
- Work with structured model summaries where possible rather than raw source.
- Keep model-generated suggestions distinguishable from observed facts.

---

## 19. Testing and acceptance criteria

### 19.1 Product acceptance criteria for the foundation

- A user can create and switch between at least several independent projects without mixing their data.
- A project can have one baseline and multiple scenarios.
- A user can create folder/file/function/cache/database elements, connect them with typed relationships, and undo/redo every edit.
- A user can create a multi-branch flow and play it with cache hit/miss and online/offline inputs.
- A user can inspect a selected element without losing canvas context.
- A user can compare baseline vs scenario and export an editable Markdown implementation plan.
- The main interface remains usable at 1280px width without permanent control overload.
- Keyboard-only navigation can reach primary navigation, canvas outline, inspector, command palette, and flow controls.
- Local reload preserves the active project and unsaved edits are not lost.

### 19.2 Importer acceptance criteria

- Import never executes project code or reads secret values.
- A TypeScript project produces file/module import relationships with evidence paths.
- A typical Next.js app detects route files and client/server component boundaries where the convention is explicit.
- Unsupported/dynamic code is skipped with a transparent explanation, not fabricated architecture.
- A re-import produces a reviewable diff and preserves user-authored scenario changes.

### 19.3 Test matrix

- Unit tests for domain commands, operation inversion, graph traversal, diffing, rule evaluation, and simulation branching.
- Property-based tests for operation replay and scenario materialization where practical.
- Component tests for inspector, command palette, canvas outline, and export preview.
- End-to-end tests for create project, scenario branch, cache-flow simulation, export, reload recovery, and repository import fixture.
- Fixture repositories: small Next.js app, monorepo, dynamic-import case, Mongoose+Redis case, RTK+IndexedDB offline case, malformed TypeScript case.
- Accessibility tests with automated checks plus keyboard path regression coverage.

---

## 20. Example implementation plan generated by the product

This section describes the quality of output Architecture Lab should create—not a fixed implementation for every project.

```md
# Change plan: Product read-through cache

## Goal
Reduce repeated product-detail database reads while preserving read-after-write consistency
for product edits.

## Architectural change
- Add `ProductCacheRepository` around Redis.
- Route product reads through cache-aside behavior.
- Invalidate versioned product cache keys after successful product writes.
- Keep MongoDB/Mongoose as the authoritative product source.

## Likely implementation areas
- `src/features/catalog/server/get-product.ts` — use cache repository before Mongoose query.
- `src/infrastructure/cache/product-cache.repository.ts` — new key construction, DTO serialization,
  TTL, miss handling.
- `src/features/catalog/server/update-product.ts` — invalidate cache after durable mutation.
- `src/features/catalog/contracts/product.dto.ts` — stable cache/response serialization contract.
- `tests/catalog/product-cache.integration.test.ts` — hit, miss, invalidation, Redis failure.

## Required decisions
- Cache TTL and stale-read tolerance.
- Whether reads may serve stale data during Redis recovery.
- Key version migration policy when Product DTO changes.

## Test paths
1. First read misses cache, queries MongoDB, then fills Redis.
2. Second read hits cache and avoids MongoDB.
3. Update invalidates the key; next read returns updated product.
4. Redis unavailable: read falls back to MongoDB and update still succeeds.
5. Product absent: cache no result only if negative-cache policy is approved.
```

---

## 21. Delivery milestones

### Milestone 1: A convincing manual architecture lab

Deliver the Vite application with local project persistence, manual system/repository elements, relationships, canvas, inspector, flows, scenarios, undo/redo, clean styling, and Markdown export.

Definition of done: a developer can model the product-cache example and generate a useful change plan without importing any code.

### Milestone 2: Source-grounded TypeScript/Next.js model

Deliver read-only local import, TypeScript dependency extraction, Next.js route/component roles, source evidence, baseline snapshots, and re-import diff.

Definition of done: a developer can import a representative Next.js repository, navigate from overview to a route/module/function, and correct uncertain extraction.

### Milestone 3: Stack-aware architecture review

Deliver Mongoose, Redis, Redux Toolkit/RTK Query, IndexedDB, and browser-storage analyzers, plus first findings and impact analysis.

Definition of done: the imported product-cache/offline-sync fixtures produce traceable cache/state findings that the user can review and suppress/resolve.

### Milestone 4: Scenario simulation and mature planning

Deliver deterministic flow simulation, state diffs, robust compare mode, decisions/assumptions, tests/rollout generation, and project export/import maturity.

Definition of done: a developer can rehearse cache miss/hit/failure and offline/online paths, compare alternatives, and hand a scenario to an implementer as a plan.

---

## 22. Risks and decisions to make before development

### Browser-only Vite versus a desktop shell

Browser security restricts arbitrary directory scanning and source file access. The first Vite version can use user-selected files/directories where supported, a local companion process, or imported analysis bundles. For frictionless local repository analysis and “open source at line” behavior, a later Tauri/Electron shell is compelling.

Recommendation: build the domain/UI as a Vite web app first, with importer and editor integration behind interfaces. Decide early whether initial users can accept a folder-selection/import-bundle workflow; do not hardwire browser APIs into domain logic.

### Manual model versus automatic extraction

Fully automatic architecture extraction is seductive and unreliable for dynamic application code. Manual-only modeling is flexible but expensive.

Recommendation: support a hybrid model from day one. Automation provides a fast baseline with evidence and confidence; the user curates the important architecture. Never hide uncertainty.

### Graph scale

Large repositories can produce unusable dependency hairballs.

Recommendation: make grouping, scope filters, zoom levels, and named views core features—not a later visualization patch. The main overview should never render the full raw dependency graph.

### Meaning of “function-level” support

Showing every function creates noise and is inaccurate for dynamic dispatch.

Recommendation: import exported/top-level function candidates, allow user promotion of internals, and put function-level content behind file/module selection. The system should model meaningful functions, not every AST node.

### Simulation expectations

Users could misunderstand a visual simulation as executable truth.

Recommendation: label simulation as model-based, show assumptions prominently, and encourage generated integration tests for validation.

---

## 23. Success metrics

Early metrics should measure usefulness and trust rather than engagement vanity metrics.

- Time from project creation to first meaningful modeled flow.
- Time from baseline to a shareable/exported change plan.
- Percentage of imported elements/relationships reviewed, confirmed, changed, or dismissed.
- Number of findings discovered before real implementation (qualitative initially).
- Scenario-to-plan completion rate.
- Re-import success rate without broken manual metadata.
- Median canvas/search responsiveness for target project size.
- User-reported confidence before versus after using a scenario.
- Frequency of exports/reopened decisions, indicating architectural memory value.

Avoid optimizing for total nodes, total diagrams, or time spent in the app.

---

## 24. Final product stance

Architecture Lab should feel like a private engineering flight simulator. The developer brings a real project or a serious idea, constructs a model that is grounded in the repository, changes it freely in a scenario, traces consequences through code and data, and leaves with an implementation plan that respects the messy details of real systems.

The differentiator is not merely drawing better boxes. It is the connection between folders, files, functions, runtime flows, state ownership, cache behavior, and proposed changes—without sacrificing a clean, premium interface.

The recommended first build is intentionally narrow: a beautiful Vite + React + TypeScript local-first scenario workspace with a strong domain model, canvas, flows, scenarios, and Markdown plans. That foundation creates the correct place to add Next.js, Mongoose, Redis, IndexedDB, RTK, and browser-storage intelligence without turning the application into an unmaintainable collection of visual features.
