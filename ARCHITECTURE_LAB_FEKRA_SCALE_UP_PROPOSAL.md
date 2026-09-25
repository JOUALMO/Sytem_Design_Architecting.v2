# Architecture Lab: Fekra Scale-Up Product and Engineering Proposal
**Prepared:** 2026-09-25  |  **Status:** Proposal for product/technical review
**Calibration repository:** `D:\Youssef_Almoshrky\Projects\BISSENESS\Fekra`
This proposal reframes the existing Architecture Lab requirements around a real multi-domain repository. It begins with new scale-focused direction and Fekra-specific design, then includes the current product blueprint as a traceable baseline appendix. Fekra notes and source paths are evidence inputs, not claims of runtime truth. No application or production environment was executed.
# Read order and terminology
## Contents

- [Part I — Product direction](#part-i--product-direction)
  - [Executive recommendation](#executive-recommendation)
  - [Why scale changes are needed](#why-scale-changes-are-needed)
  - [Current Architecture Lab: inspected facts](#current-architecture-lab-inspected-facts)
  - [Fekra: observed profile](#fekra-observed-profile)
  - [Evidence limits](#evidence-limits)
  - [Product principles](#product-principles)
- [Part II — Fekra-specific design](#part-ii--fekra-specific-design)
  - [Initial Fekra system map](#initial-fekra-system-map-validate-before-treating-as-truth)
  - [Fekra domain maps](#fekra-domain-maps-to-build)
  - [End-to-end journeys](#end-to-end-first-journeys)
  - [Validation questions](#fekra-questions-to-resolve)
  - [Change impact template](#fekra-change-impact-template)
  - [Architecture rules](#fekra-specific-architecture-rules)
  - [First-run UX](#first-run-ux-for-fekra)
  - [Requirement matrices](#fekra-detailed-requirement-matrices)
- [Part III — Generic product requirements baseline](#part-iii--generic-product-requirements-baseline)


# Part I — Product direction
## Executive recommendation
- Reposition Architecture Lab from a canvas-first model editor into a repository-aware engineering workspace.
- Keep the canvas as one work surface among trees, catalogs, tables, search, code details, flows, decisions, and change plans.
- Represent applications, packages, domains, symbols, APIs, data, events, decisions, findings, scenarios, and plans as linked typed records.
- Index source incrementally in a durable local process and query bounded slices into the UI.
- Separate parsed facts, static inference, authored architecture, runtime observations, and proposals.
- Attach source anchor, hash, analyzer version, confidence, freshness, and review state to derived claims.
- Use Fekra to validate frontend/backend traces across auth, learning, media, assessments, payments, wallets, and analytics.
- Prioritize fast navigation, evidence coverage, and explainable impact before collaboration or AI.
- Retain simple greenfield modeling and the local-first/private-by-default product promise.
## Why scale changes are needed
- Current app persists one versioned workspace object with arrays for elements, relationships, flows, scenarios, and findings.
- Whole-object cloning and browser persistence become costly as repo facts grow.
- One graph cannot answer every repo question without overload.
- A browser directory picker is not a restartable local indexing service.
- Authored decisions must survive replacement of generated source facts.
- High analyzer cardinality caps do not make full graph rendering responsive.
- Partial parser coverage needs a first-class UX rather than a binary success badge.
## Current Architecture Lab: inspected facts
- Vite + React + TypeScript SPA.
- IndexedDB with localStorage fallback; workspace schema v1.
- Entity taxonomy spans app/package/file/function through API, database, queue, worker, external system.
- Relations include imports/calls/reads/writes/events/invalidation/routing/persistence/sync.
- TypeScript worker parses imports/symbols, hashes files, records source evidence.
- UI includes canvas, inspector, flows, scenarios, decisions, repository import, command palette, JSON/Markdown exports.
- Flow rehearsal is a deterministic model, not project code execution.
- Stack checks are static heuristics and document cross-file limitations.
- Main React module carries much view/workspace state; undo stores workspace snapshots.
## Fekra: observed profile
- Separate `frontend` and `backend` roots and manifests.
- Frontend manifest uses Next.js 16, React 19, Redux Toolkit, Zod, localforage, upload/video libraries.
- Backend manifest uses Express 5, Mongoose 8, AWS SDK, SendGrid, auth/security, TypeScript.
- Each dev command sets a 4 GB Node heap.
- Inventory was roughly 480 files excluding VCS, ignored/dependency/generated and selected lab temp paths.
- Frontend feature areas: admin, auth, class, exam, lesson, profile, video, vocabulary, year.
- Backend areas include app resources, analytics, auth, AWS, payment, email, server, services, utilities.
- Visible resource modules cover year, class, subject, course, lesson, partial, test, vocabulary, video, wallet.
- Paymob/webhooks, AWS/S3/video, analytics services/models/routes, and access middleware have distinct paths.
- Existing lab reviews note analytics overlap, video dashboard mismatch, weak test telemetry, and vocabulary as the most developed analytics base.
- Existing roadmap advises instrumentation/source-of-truth alignment before recommendation and prediction.
- Generated, archive, ignored, experimental, temporary, and log paths need explicit import classification.
## Evidence limits
- No runtime tracing, deployments, production metrics, total bytes, Git history depth, or exact tracked-file count inspected.
- A path does not prove executable registration.
- Existing lab proposals may be historical.
- Analytics ownership and API contracts need maintainer validation.
- Nothing here is a security audit or runtime correctness guarantee.
## Product principles
- Progressive disclosure; evidence first; visible freshness; graph plus hierarchy.
- Local-first with explicit connector opt-in.
- Resumable work and recoverable edits.
- Human decisions survive rescans.
- Performance budgets use representative fixtures.
- No repository code execution.
- No mandatory cloud collaboration.
- No ticket tracker replacement.
- No static-analysis claim presented as runtime truth.
- Optional AI is cited, reviewable, and never silently mutates facts.
# Part II — Fekra-specific design
## Initial Fekra system map: validate before treating as truth
- Frontend: Next application with learner, admin, profile, auth, and content feature surfaces.
- Backend: Express API with learning resources plus analytics, identity, payment, AWS and support modules.
- Candidate content hierarchy: year/class, subject/course, lesson/partial, activity. Validate cardinality through models and queries.
- Candidate learner activity: video, vocabulary, tests, exams.
- Candidate policies: admin/teacher/editor/premium/device/upload/content-management.
- Candidate payment flow: initiation, provider, webhook, order, subscription, wallet.
- Candidate media path: upload, S3, processing, CloudFront, signed URL, player, events.
- Candidate analytics path: producer, middleware, model, service, API, dashboard.
- Background job existence must be proven by executable scheduler/worker registration.
## Fekra domain maps to build
- **Identity and access** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Educational structure** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Content authoring** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Student learning** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Vocabulary mastery** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Video/media delivery** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Tests and exams** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Payments** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Student wallet** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Analytics** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Administration** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **AWS integrations** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Email** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Background jobs** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Client state** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Offline sync** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Documentation** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
- **Repository hygiene** — map entrypoints, owners, entities, contracts, consumers, tests, failures, and unresolved assumptions.
## End-to-end first journeys
- **Learner lesson:** page → feature/state → API → auth/middleware → controller/service → lesson/partial data → activity → analytics.
  - Mark every hop observed, inferred, or unverified.
  - Attach source paths and line evidence.
  - Record missing contract, auth, retry, or test evidence as a gap.
- **Vocabulary practice:** UI → local store/sync → attempt → backend → trace/mastery service → derived signal → learner/admin view.
  - Mark every hop observed, inferred, or unverified.
  - Attach source paths and line evidence.
  - Record missing contract, auth, retry, or test evidence as a gap.
- **Video playback:** selection → signed URL → permission → source/storage/CDN → player progress → analytics consumer.
  - Mark every hop observed, inferred, or unverified.
  - Attach source paths and line evidence.
  - Record missing contract, auth, retry, or test evidence as a gap.
- **Test attempt:** test authoring → delivery → answer attempt → grading → persistence → diagnostic aggregate → dashboard.
  - Mark every hop observed, inferred, or unverified.
  - Attach source paths and line evidence.
  - Record missing contract, auth, retry, or test evidence as a gap.
- **Payment and wallet:** client initiation → Paymob → webhook validation → order/subscription → transaction posting → balance read/reconciliation.
  - Mark every hop observed, inferred, or unverified.
  - Attach source paths and line evidence.
  - Record missing contract, auth, retry, or test evidence as a gap.
- **Admin content edit:** permission → form/validation → mutation → persistence → cache/state refresh → learner view.
  - Mark every hop observed, inferred, or unverified.
  - Attach source paths and line evidence.
  - Record missing contract, auth, retry, or test evidence as a gap.
- **Analytics metric:** event source → discriminator/reference/time → model → aggregation → API → dashboard definition.
  - Mark every hop observed, inferred, or unverified.
  - Attach source paths and line evidence.
  - Record missing contract, auth, retry, or test evidence as a gap.
## Fekra questions to resolve
- **Validate:** Which analytics path owns each metric and dashboard?
- **Validate:** Are old and new pipelines concurrent?
- **Validate:** What job scheduler executes in deployed environments?
- **Validate:** Which video event fields are authoritative?
- **Validate:** How are analytics requests learner-scoped?
- **Validate:** What is vocabulary local/server conflict policy?
- **Validate:** Are attempts append-only or mutable?
- **Validate:** What is source of truth for wallet balance?
- **Validate:** How are upload capabilities assigned?
- **Validate:** What deployment units and environments exist?
- **Validate:** Which directories are archived/generated/experimental?
- **Validate:** Which lab documents are approved/current?
- **Validate:** Who owns each domain and API?
## Fekra change impact template
- For content changes, include editor, validation, persistence, learner readers, cache refresh, analytics.
- For auth changes, include frontend guard, backend middleware, role model, protected routes, tests.
- For vocabulary changes, include local DB, sync, attempt event, mastery projection, consumers, calibration truth.
- For video changes, include upload permission, source/signing, storage/CDN, playback, event semantics.
- For tests, include authoring, item identity, attempts, grading, telemetry, aggregates.
- For payments, include provider call, webhook idempotency, order state, wallet ledger, support and reconciliation.
- For analytics, include event schema, owners, aggregation windows, dashboard denominator, retention/backfill.
- For admin, include mutation permission, destructive recovery, learner-facing effect.
## Fekra-specific architecture rules
- A planning doc never creates an observed implementation node.
- A route is not runtime reachable until route registration is traced.
- A Mongoose reference does not establish bounded-context ownership by itself.
- A Redux slice does not prove persistence behavior.
- An analytics model does not prove its dashboard uses it.
- A proposed cron job is labeled proposed until executable registration is found.
- Static event-name matches are weaker evidence than typed producer-to-consumer references.
- Learner progress and payment data get privacy/sensitivity annotations, not value indexing.
- Existing vocabulary algorithms are discovered and linked before proposing replacements.
- Analytics instrumentation precedes recommendation/calibration proposals.
## First-run UX for Fekra
1. Choose project root; show frontend/backend manifests.
2. Review `.gitignore`, ignored, `lab`, `Test`, generated and temp paths.
3. Show estimated file/language counts and likely app roots.
4. Ask whether `lab` docs are index-only or current architecture evidence.
5. Index structure, TS symbols, imports, manifests, routes and models.
6. Display coverage by frontend/backend and domain candidate.
7. Review suggested domain assignments and uncertainty.
8. Open one journey (learner lesson) and link source evidence.
9. Create an initial assumptions/owner review list.
10. Save map query and index commit; leave code untouched.
## Fekra detailed requirement matrices
The following requirements intentionally separate domain objects, workflows, modules, and cross-cutting concerns. Each item is suitable for design review or acceptance testing.
### Fekra object — Application
**Scope:** runtime entrypoint, owner, env, interface.
- **Stable id independent of label:** Application record has stable id independent of label.
- **Project/repository/domain scope:** Application record has project/repository/domain scope.
- **Source or author provenance:** Application record has source or author provenance.
- **Freshness state:** Application record has freshness state.
- **Explicit owner or unknown:** Application record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Application record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Application record has search by name/path/domain term.
- **Status and evidence filters:** Application record has status and evidence filters.
- **Meaningful change history:** Application record has meaningful change history.
- **Review/correction for inference:** Application record has review/correction for inference.
- **Deep link to source and neighbors:** Application record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Application record has keyboard/screenreader representation.
- **Safe cited export:** Application record has safe cited export.
- **On-demand bounded loading:** Application record has on-demand bounded loading.
- **Checkable invariant:** Application record has checkable invariant.
- **Explanation of missing evidence:** Application record has explanation of missing evidence.
### Fekra object — Package
**Scope:** manifest, exports, dependencies, release.
- **Stable id independent of label:** Package record has stable id independent of label.
- **Project/repository/domain scope:** Package record has project/repository/domain scope.
- **Source or author provenance:** Package record has source or author provenance.
- **Freshness state:** Package record has freshness state.
- **Explicit owner or unknown:** Package record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Package record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Package record has search by name/path/domain term.
- **Status and evidence filters:** Package record has status and evidence filters.
- **Meaningful change history:** Package record has meaningful change history.
- **Review/correction for inference:** Package record has review/correction for inference.
- **Deep link to source and neighbors:** Package record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Package record has keyboard/screenreader representation.
- **Safe cited export:** Package record has safe cited export.
- **On-demand bounded loading:** Package record has on-demand bounded loading.
- **Checkable invariant:** Package record has checkable invariant.
- **Explanation of missing evidence:** Package record has explanation of missing evidence.
### Fekra object — Domain
**Scope:** terms, code roots, data, journeys.
- **Stable id independent of label:** Domain record has stable id independent of label.
- **Project/repository/domain scope:** Domain record has project/repository/domain scope.
- **Source or author provenance:** Domain record has source or author provenance.
- **Freshness state:** Domain record has freshness state.
- **Explicit owner or unknown:** Domain record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Domain record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Domain record has search by name/path/domain term.
- **Status and evidence filters:** Domain record has status and evidence filters.
- **Meaningful change history:** Domain record has meaningful change history.
- **Review/correction for inference:** Domain record has review/correction for inference.
- **Deep link to source and neighbors:** Domain record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Domain record has keyboard/screenreader representation.
- **Safe cited export:** Domain record has safe cited export.
- **On-demand bounded loading:** Domain record has on-demand bounded loading.
- **Checkable invariant:** Domain record has checkable invariant.
- **Explanation of missing evidence:** Domain record has explanation of missing evidence.
### Fekra object — Route
**Scope:** method, path, middleware, handler.
- **Stable id independent of label:** Route record has stable id independent of label.
- **Project/repository/domain scope:** Route record has project/repository/domain scope.
- **Source or author provenance:** Route record has source or author provenance.
- **Freshness state:** Route record has freshness state.
- **Explicit owner or unknown:** Route record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Route record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Route record has search by name/path/domain term.
- **Status and evidence filters:** Route record has status and evidence filters.
- **Meaningful change history:** Route record has meaningful change history.
- **Review/correction for inference:** Route record has review/correction for inference.
- **Deep link to source and neighbors:** Route record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Route record has keyboard/screenreader representation.
- **Safe cited export:** Route record has safe cited export.
- **On-demand bounded loading:** Route record has on-demand bounded loading.
- **Checkable invariant:** Route record has checkable invariant.
- **Explanation of missing evidence:** Route record has explanation of missing evidence.
### Fekra object — Controller
**Scope:** inputs, auth, service calls, errors.
- **Stable id independent of label:** Controller record has stable id independent of label.
- **Project/repository/domain scope:** Controller record has project/repository/domain scope.
- **Source or author provenance:** Controller record has source or author provenance.
- **Freshness state:** Controller record has freshness state.
- **Explicit owner or unknown:** Controller record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Controller record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Controller record has search by name/path/domain term.
- **Status and evidence filters:** Controller record has status and evidence filters.
- **Meaningful change history:** Controller record has meaningful change history.
- **Review/correction for inference:** Controller record has review/correction for inference.
- **Deep link to source and neighbors:** Controller record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Controller record has keyboard/screenreader representation.
- **Safe cited export:** Controller record has safe cited export.
- **On-demand bounded loading:** Controller record has on-demand bounded loading.
- **Checkable invariant:** Controller record has checkable invariant.
- **Explanation of missing evidence:** Controller record has explanation of missing evidence.
### Fekra object — Service
**Scope:** business rules, side effects, transactions.
- **Stable id independent of label:** Service record has stable id independent of label.
- **Project/repository/domain scope:** Service record has project/repository/domain scope.
- **Source or author provenance:** Service record has source or author provenance.
- **Freshness state:** Service record has freshness state.
- **Explicit owner or unknown:** Service record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Service record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Service record has search by name/path/domain term.
- **Status and evidence filters:** Service record has status and evidence filters.
- **Meaningful change history:** Service record has meaningful change history.
- **Review/correction for inference:** Service record has review/correction for inference.
- **Deep link to source and neighbors:** Service record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Service record has keyboard/screenreader representation.
- **Safe cited export:** Service record has safe cited export.
- **On-demand bounded loading:** Service record has on-demand bounded loading.
- **Checkable invariant:** Service record has checkable invariant.
- **Explanation of missing evidence:** Service record has explanation of missing evidence.
### Fekra object — Model
**Scope:** fields, indexes, refs, readers/writers.
- **Stable id independent of label:** Model record has stable id independent of label.
- **Project/repository/domain scope:** Model record has project/repository/domain scope.
- **Source or author provenance:** Model record has source or author provenance.
- **Freshness state:** Model record has freshness state.
- **Explicit owner or unknown:** Model record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Model record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Model record has search by name/path/domain term.
- **Status and evidence filters:** Model record has status and evidence filters.
- **Meaningful change history:** Model record has meaningful change history.
- **Review/correction for inference:** Model record has review/correction for inference.
- **Deep link to source and neighbors:** Model record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Model record has keyboard/screenreader representation.
- **Safe cited export:** Model record has safe cited export.
- **On-demand bounded loading:** Model record has on-demand bounded loading.
- **Checkable invariant:** Model record has checkable invariant.
- **Explanation of missing evidence:** Model record has explanation of missing evidence.
### Fekra object — Data field
**Scope:** sensitivity, producer, consumers, retention.
- **Stable id independent of label:** Data field record has stable id independent of label.
- **Project/repository/domain scope:** Data field record has project/repository/domain scope.
- **Source or author provenance:** Data field record has source or author provenance.
- **Freshness state:** Data field record has freshness state.
- **Explicit owner or unknown:** Data field record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Data field record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Data field record has search by name/path/domain term.
- **Status and evidence filters:** Data field record has status and evidence filters.
- **Meaningful change history:** Data field record has meaningful change history.
- **Review/correction for inference:** Data field record has review/correction for inference.
- **Deep link to source and neighbors:** Data field record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Data field record has keyboard/screenreader representation.
- **Safe cited export:** Data field record has safe cited export.
- **On-demand bounded loading:** Data field record has on-demand bounded loading.
- **Checkable invariant:** Data field record has checkable invariant.
- **Explanation of missing evidence:** Data field record has explanation of missing evidence.
### Fekra object — Redux slice
**Scope:** owner, selectors, actions, persistence.
- **Stable id independent of label:** Redux slice record has stable id independent of label.
- **Project/repository/domain scope:** Redux slice record has project/repository/domain scope.
- **Source or author provenance:** Redux slice record has source or author provenance.
- **Freshness state:** Redux slice record has freshness state.
- **Explicit owner or unknown:** Redux slice record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Redux slice record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Redux slice record has search by name/path/domain term.
- **Status and evidence filters:** Redux slice record has status and evidence filters.
- **Meaningful change history:** Redux slice record has meaningful change history.
- **Review/correction for inference:** Redux slice record has review/correction for inference.
- **Deep link to source and neighbors:** Redux slice record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Redux slice record has keyboard/screenreader representation.
- **Safe cited export:** Redux slice record has safe cited export.
- **On-demand bounded loading:** Redux slice record has on-demand bounded loading.
- **Checkable invariant:** Redux slice record has checkable invariant.
- **Explanation of missing evidence:** Redux slice record has explanation of missing evidence.
### Fekra object — Frontend feature
**Scope:** route, state, API, UX outcome.
- **Stable id independent of label:** Frontend feature record has stable id independent of label.
- **Project/repository/domain scope:** Frontend feature record has project/repository/domain scope.
- **Source or author provenance:** Frontend feature record has source or author provenance.
- **Freshness state:** Frontend feature record has freshness state.
- **Explicit owner or unknown:** Frontend feature record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Frontend feature record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Frontend feature record has search by name/path/domain term.
- **Status and evidence filters:** Frontend feature record has status and evidence filters.
- **Meaningful change history:** Frontend feature record has meaningful change history.
- **Review/correction for inference:** Frontend feature record has review/correction for inference.
- **Deep link to source and neighbors:** Frontend feature record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Frontend feature record has keyboard/screenreader representation.
- **Safe cited export:** Frontend feature record has safe cited export.
- **On-demand bounded loading:** Frontend feature record has on-demand bounded loading.
- **Checkable invariant:** Frontend feature record has checkable invariant.
- **Explanation of missing evidence:** Frontend feature record has explanation of missing evidence.
### Fekra object — Analytics event
**Scope:** producer, discriminator, ref, timestamp.
- **Stable id independent of label:** Analytics event record has stable id independent of label.
- **Project/repository/domain scope:** Analytics event record has project/repository/domain scope.
- **Source or author provenance:** Analytics event record has source or author provenance.
- **Freshness state:** Analytics event record has freshness state.
- **Explicit owner or unknown:** Analytics event record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Analytics event record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Analytics event record has search by name/path/domain term.
- **Status and evidence filters:** Analytics event record has status and evidence filters.
- **Meaningful change history:** Analytics event record has meaningful change history.
- **Review/correction for inference:** Analytics event record has review/correction for inference.
- **Deep link to source and neighbors:** Analytics event record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Analytics event record has keyboard/screenreader representation.
- **Safe cited export:** Analytics event record has safe cited export.
- **On-demand bounded loading:** Analytics event record has on-demand bounded loading.
- **Checkable invariant:** Analytics event record has checkable invariant.
- **Explanation of missing evidence:** Analytics event record has explanation of missing evidence.
### Fekra object — Metric
**Scope:** aggregation, denominator, window, display.
- **Stable id independent of label:** Metric record has stable id independent of label.
- **Project/repository/domain scope:** Metric record has project/repository/domain scope.
- **Source or author provenance:** Metric record has source or author provenance.
- **Freshness state:** Metric record has freshness state.
- **Explicit owner or unknown:** Metric record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Metric record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Metric record has search by name/path/domain term.
- **Status and evidence filters:** Metric record has status and evidence filters.
- **Meaningful change history:** Metric record has meaningful change history.
- **Review/correction for inference:** Metric record has review/correction for inference.
- **Deep link to source and neighbors:** Metric record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Metric record has keyboard/screenreader representation.
- **Safe cited export:** Metric record has safe cited export.
- **On-demand bounded loading:** Metric record has on-demand bounded loading.
- **Checkable invariant:** Metric record has checkable invariant.
- **Explanation of missing evidence:** Metric record has explanation of missing evidence.
### Fekra object — Background job
**Scope:** registration, schedule, retry, deploy.
- **Stable id independent of label:** Background job record has stable id independent of label.
- **Project/repository/domain scope:** Background job record has project/repository/domain scope.
- **Source or author provenance:** Background job record has source or author provenance.
- **Freshness state:** Background job record has freshness state.
- **Explicit owner or unknown:** Background job record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Background job record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Background job record has search by name/path/domain term.
- **Status and evidence filters:** Background job record has status and evidence filters.
- **Meaningful change history:** Background job record has meaningful change history.
- **Review/correction for inference:** Background job record has review/correction for inference.
- **Deep link to source and neighbors:** Background job record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Background job record has keyboard/screenreader representation.
- **Safe cited export:** Background job record has safe cited export.
- **On-demand bounded loading:** Background job record has on-demand bounded loading.
- **Checkable invariant:** Background job record has checkable invariant.
- **Explanation of missing evidence:** Background job record has explanation of missing evidence.
### Fekra object — Payment order
**Scope:** provider id, lifecycle, idempotency.
- **Stable id independent of label:** Payment order record has stable id independent of label.
- **Project/repository/domain scope:** Payment order record has project/repository/domain scope.
- **Source or author provenance:** Payment order record has source or author provenance.
- **Freshness state:** Payment order record has freshness state.
- **Explicit owner or unknown:** Payment order record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Payment order record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Payment order record has search by name/path/domain term.
- **Status and evidence filters:** Payment order record has status and evidence filters.
- **Meaningful change history:** Payment order record has meaningful change history.
- **Review/correction for inference:** Payment order record has review/correction for inference.
- **Deep link to source and neighbors:** Payment order record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Payment order record has keyboard/screenreader representation.
- **Safe cited export:** Payment order record has safe cited export.
- **On-demand bounded loading:** Payment order record has on-demand bounded loading.
- **Checkable invariant:** Payment order record has checkable invariant.
- **Explanation of missing evidence:** Payment order record has explanation of missing evidence.
### Fekra object — Wallet transaction
**Scope:** ledger, owner, balance effect.
- **Stable id independent of label:** Wallet transaction record has stable id independent of label.
- **Project/repository/domain scope:** Wallet transaction record has project/repository/domain scope.
- **Source or author provenance:** Wallet transaction record has source or author provenance.
- **Freshness state:** Wallet transaction record has freshness state.
- **Explicit owner or unknown:** Wallet transaction record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Wallet transaction record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Wallet transaction record has search by name/path/domain term.
- **Status and evidence filters:** Wallet transaction record has status and evidence filters.
- **Meaningful change history:** Wallet transaction record has meaningful change history.
- **Review/correction for inference:** Wallet transaction record has review/correction for inference.
- **Deep link to source and neighbors:** Wallet transaction record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Wallet transaction record has keyboard/screenreader representation.
- **Safe cited export:** Wallet transaction record has safe cited export.
- **On-demand bounded loading:** Wallet transaction record has on-demand bounded loading.
- **Checkable invariant:** Wallet transaction record has checkable invariant.
- **Explanation of missing evidence:** Wallet transaction record has explanation of missing evidence.
### Fekra object — Media asset
**Scope:** source, transcode, sign, delivery.
- **Stable id independent of label:** Media asset record has stable id independent of label.
- **Project/repository/domain scope:** Media asset record has project/repository/domain scope.
- **Source or author provenance:** Media asset record has source or author provenance.
- **Freshness state:** Media asset record has freshness state.
- **Explicit owner or unknown:** Media asset record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Media asset record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Media asset record has search by name/path/domain term.
- **Status and evidence filters:** Media asset record has status and evidence filters.
- **Meaningful change history:** Media asset record has meaningful change history.
- **Review/correction for inference:** Media asset record has review/correction for inference.
- **Deep link to source and neighbors:** Media asset record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Media asset record has keyboard/screenreader representation.
- **Safe cited export:** Media asset record has safe cited export.
- **On-demand bounded loading:** Media asset record has on-demand bounded loading.
- **Checkable invariant:** Media asset record has checkable invariant.
- **Explanation of missing evidence:** Media asset record has explanation of missing evidence.
### Fekra object — Upload flow
**Scope:** permission, chunks, storage, completion.
- **Stable id independent of label:** Upload flow record has stable id independent of label.
- **Project/repository/domain scope:** Upload flow record has project/repository/domain scope.
- **Source or author provenance:** Upload flow record has source or author provenance.
- **Freshness state:** Upload flow record has freshness state.
- **Explicit owner or unknown:** Upload flow record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Upload flow record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Upload flow record has search by name/path/domain term.
- **Status and evidence filters:** Upload flow record has status and evidence filters.
- **Meaningful change history:** Upload flow record has meaningful change history.
- **Review/correction for inference:** Upload flow record has review/correction for inference.
- **Deep link to source and neighbors:** Upload flow record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Upload flow record has keyboard/screenreader representation.
- **Safe cited export:** Upload flow record has safe cited export.
- **On-demand bounded loading:** Upload flow record has on-demand bounded loading.
- **Checkable invariant:** Upload flow record has checkable invariant.
- **Explanation of missing evidence:** Upload flow record has explanation of missing evidence.
### Fekra object — Vocabulary signal
**Scope:** input attempts, aggregation, consumer.
- **Stable id independent of label:** Vocabulary signal record has stable id independent of label.
- **Project/repository/domain scope:** Vocabulary signal record has project/repository/domain scope.
- **Source or author provenance:** Vocabulary signal record has source or author provenance.
- **Freshness state:** Vocabulary signal record has freshness state.
- **Explicit owner or unknown:** Vocabulary signal record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Vocabulary signal record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Vocabulary signal record has search by name/path/domain term.
- **Status and evidence filters:** Vocabulary signal record has status and evidence filters.
- **Meaningful change history:** Vocabulary signal record has meaningful change history.
- **Review/correction for inference:** Vocabulary signal record has review/correction for inference.
- **Deep link to source and neighbors:** Vocabulary signal record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Vocabulary signal record has keyboard/screenreader representation.
- **Safe cited export:** Vocabulary signal record has safe cited export.
- **On-demand bounded loading:** Vocabulary signal record has on-demand bounded loading.
- **Checkable invariant:** Vocabulary signal record has checkable invariant.
- **Explanation of missing evidence:** Vocabulary signal record has explanation of missing evidence.
### Fekra object — Test attempt
**Scope:** item identity, answer, score, retry.
- **Stable id independent of label:** Test attempt record has stable id independent of label.
- **Project/repository/domain scope:** Test attempt record has project/repository/domain scope.
- **Source or author provenance:** Test attempt record has source or author provenance.
- **Freshness state:** Test attempt record has freshness state.
- **Explicit owner or unknown:** Test attempt record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Test attempt record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Test attempt record has search by name/path/domain term.
- **Status and evidence filters:** Test attempt record has status and evidence filters.
- **Meaningful change history:** Test attempt record has meaningful change history.
- **Review/correction for inference:** Test attempt record has review/correction for inference.
- **Deep link to source and neighbors:** Test attempt record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Test attempt record has keyboard/screenreader representation.
- **Safe cited export:** Test attempt record has safe cited export.
- **On-demand bounded loading:** Test attempt record has on-demand bounded loading.
- **Checkable invariant:** Test attempt record has checkable invariant.
- **Explanation of missing evidence:** Test attempt record has explanation of missing evidence.
### Fekra object — Decision
**Scope:** owner, alternatives, evidence, consequences.
- **Stable id independent of label:** Decision record has stable id independent of label.
- **Project/repository/domain scope:** Decision record has project/repository/domain scope.
- **Source or author provenance:** Decision record has source or author provenance.
- **Freshness state:** Decision record has freshness state.
- **Explicit owner or unknown:** Decision record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Decision record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Decision record has search by name/path/domain term.
- **Status and evidence filters:** Decision record has status and evidence filters.
- **Meaningful change history:** Decision record has meaningful change history.
- **Review/correction for inference:** Decision record has review/correction for inference.
- **Deep link to source and neighbors:** Decision record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Decision record has keyboard/screenreader representation.
- **Safe cited export:** Decision record has safe cited export.
- **On-demand bounded loading:** Decision record has on-demand bounded loading.
- **Checkable invariant:** Decision record has checkable invariant.
- **Explanation of missing evidence:** Decision record has explanation of missing evidence.
### Fekra object — Flow
**Scope:** trigger, steps, branches, validation.
- **Stable id independent of label:** Flow record has stable id independent of label.
- **Project/repository/domain scope:** Flow record has project/repository/domain scope.
- **Source or author provenance:** Flow record has source or author provenance.
- **Freshness state:** Flow record has freshness state.
- **Explicit owner or unknown:** Flow record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Flow record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Flow record has search by name/path/domain term.
- **Status and evidence filters:** Flow record has status and evidence filters.
- **Meaningful change history:** Flow record has meaningful change history.
- **Review/correction for inference:** Flow record has review/correction for inference.
- **Deep link to source and neighbors:** Flow record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Flow record has keyboard/screenreader representation.
- **Safe cited export:** Flow record has safe cited export.
- **On-demand bounded loading:** Flow record has on-demand bounded loading.
- **Checkable invariant:** Flow record has checkable invariant.
- **Explanation of missing evidence:** Flow record has explanation of missing evidence.
### Fekra object — Change plan
**Scope:** scope, impact, tests, rollout.
- **Stable id independent of label:** Change plan record has stable id independent of label.
- **Project/repository/domain scope:** Change plan record has project/repository/domain scope.
- **Source or author provenance:** Change plan record has source or author provenance.
- **Freshness state:** Change plan record has freshness state.
- **Explicit owner or unknown:** Change plan record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Change plan record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Change plan record has search by name/path/domain term.
- **Status and evidence filters:** Change plan record has status and evidence filters.
- **Meaningful change history:** Change plan record has meaningful change history.
- **Review/correction for inference:** Change plan record has review/correction for inference.
- **Deep link to source and neighbors:** Change plan record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Change plan record has keyboard/screenreader representation.
- **Safe cited export:** Change plan record has safe cited export.
- **On-demand bounded loading:** Change plan record has on-demand bounded loading.
- **Checkable invariant:** Change plan record has checkable invariant.
- **Explanation of missing evidence:** Change plan record has explanation of missing evidence.
### Fekra object — Finding
**Scope:** rule, confidence, evidence, status.
- **Stable id independent of label:** Finding record has stable id independent of label.
- **Project/repository/domain scope:** Finding record has project/repository/domain scope.
- **Source or author provenance:** Finding record has source or author provenance.
- **Freshness state:** Finding record has freshness state.
- **Explicit owner or unknown:** Finding record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Finding record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Finding record has search by name/path/domain term.
- **Status and evidence filters:** Finding record has status and evidence filters.
- **Meaningful change history:** Finding record has meaningful change history.
- **Review/correction for inference:** Finding record has review/correction for inference.
- **Deep link to source and neighbors:** Finding record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Finding record has keyboard/screenreader representation.
- **Safe cited export:** Finding record has safe cited export.
- **On-demand bounded loading:** Finding record has on-demand bounded loading.
- **Checkable invariant:** Finding record has checkable invariant.
- **Explanation of missing evidence:** Finding record has explanation of missing evidence.
### Fekra object — Documentation page
**Scope:** authority, freshness, code links.
- **Stable id independent of label:** Documentation page record has stable id independent of label.
- **Project/repository/domain scope:** Documentation page record has project/repository/domain scope.
- **Source or author provenance:** Documentation page record has source or author provenance.
- **Freshness state:** Documentation page record has freshness state.
- **Explicit owner or unknown:** Documentation page record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Documentation page record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Documentation page record has search by name/path/domain term.
- **Status and evidence filters:** Documentation page record has status and evidence filters.
- **Meaningful change history:** Documentation page record has meaningful change history.
- **Review/correction for inference:** Documentation page record has review/correction for inference.
- **Deep link to source and neighbors:** Documentation page record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Documentation page record has keyboard/screenreader representation.
- **Safe cited export:** Documentation page record has safe cited export.
- **On-demand bounded loading:** Documentation page record has on-demand bounded loading.
- **Checkable invariant:** Documentation page record has checkable invariant.
- **Explanation of missing evidence:** Documentation page record has explanation of missing evidence.
### Fekra object — Repository path
**Scope:** classification, owner, parser coverage.
- **Stable id independent of label:** Repository path record has stable id independent of label.
- **Project/repository/domain scope:** Repository path record has project/repository/domain scope.
- **Source or author provenance:** Repository path record has source or author provenance.
- **Freshness state:** Repository path record has freshness state.
- **Explicit owner or unknown:** Repository path record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Repository path record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Repository path record has search by name/path/domain term.
- **Status and evidence filters:** Repository path record has status and evidence filters.
- **Meaningful change history:** Repository path record has meaningful change history.
- **Review/correction for inference:** Repository path record has review/correction for inference.
- **Deep link to source and neighbors:** Repository path record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Repository path record has keyboard/screenreader representation.
- **Safe cited export:** Repository path record has safe cited export.
- **On-demand bounded loading:** Repository path record has on-demand bounded loading.
- **Checkable invariant:** Repository path record has checkable invariant.
- **Explanation of missing evidence:** Repository path record has explanation of missing evidence.
### Fekra object — External integration
**Scope:** credential boundary, API, failure.
- **Stable id independent of label:** External integration record has stable id independent of label.
- **Project/repository/domain scope:** External integration record has project/repository/domain scope.
- **Source or author provenance:** External integration record has source or author provenance.
- **Freshness state:** External integration record has freshness state.
- **Explicit owner or unknown:** External integration record has explicit owner or unknown.
- **Typed incoming/outgoing links:** External integration record has typed incoming/outgoing links.
- **Search by name/path/domain term:** External integration record has search by name/path/domain term.
- **Status and evidence filters:** External integration record has status and evidence filters.
- **Meaningful change history:** External integration record has meaningful change history.
- **Review/correction for inference:** External integration record has review/correction for inference.
- **Deep link to source and neighbors:** External integration record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** External integration record has keyboard/screenreader representation.
- **Safe cited export:** External integration record has safe cited export.
- **On-demand bounded loading:** External integration record has on-demand bounded loading.
- **Checkable invariant:** External integration record has checkable invariant.
- **Explanation of missing evidence:** External integration record has explanation of missing evidence.
### Fekra object — Offline operation
**Scope:** queue, ordering, retry, conflict.
- **Stable id independent of label:** Offline operation record has stable id independent of label.
- **Project/repository/domain scope:** Offline operation record has project/repository/domain scope.
- **Source or author provenance:** Offline operation record has source or author provenance.
- **Freshness state:** Offline operation record has freshness state.
- **Explicit owner or unknown:** Offline operation record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Offline operation record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Offline operation record has search by name/path/domain term.
- **Status and evidence filters:** Offline operation record has status and evidence filters.
- **Meaningful change history:** Offline operation record has meaningful change history.
- **Review/correction for inference:** Offline operation record has review/correction for inference.
- **Deep link to source and neighbors:** Offline operation record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Offline operation record has keyboard/screenreader representation.
- **Safe cited export:** Offline operation record has safe cited export.
- **On-demand bounded loading:** Offline operation record has on-demand bounded loading.
- **Checkable invariant:** Offline operation record has checkable invariant.
- **Explanation of missing evidence:** Offline operation record has explanation of missing evidence.
### Fekra object — Cache policy
**Scope:** key, expiry, invalidation, fallback.
- **Stable id independent of label:** Cache policy record has stable id independent of label.
- **Project/repository/domain scope:** Cache policy record has project/repository/domain scope.
- **Source or author provenance:** Cache policy record has source or author provenance.
- **Freshness state:** Cache policy record has freshness state.
- **Explicit owner or unknown:** Cache policy record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Cache policy record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Cache policy record has search by name/path/domain term.
- **Status and evidence filters:** Cache policy record has status and evidence filters.
- **Meaningful change history:** Cache policy record has meaningful change history.
- **Review/correction for inference:** Cache policy record has review/correction for inference.
- **Deep link to source and neighbors:** Cache policy record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Cache policy record has keyboard/screenreader representation.
- **Safe cited export:** Cache policy record has safe cited export.
- **On-demand bounded loading:** Cache policy record has on-demand bounded loading.
- **Checkable invariant:** Cache policy record has checkable invariant.
- **Explanation of missing evidence:** Cache policy record has explanation of missing evidence.
### Fekra object — Auth policy
**Scope:** actor, permission, enforcement, test.
- **Stable id independent of label:** Auth policy record has stable id independent of label.
- **Project/repository/domain scope:** Auth policy record has project/repository/domain scope.
- **Source or author provenance:** Auth policy record has source or author provenance.
- **Freshness state:** Auth policy record has freshness state.
- **Explicit owner or unknown:** Auth policy record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Auth policy record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Auth policy record has search by name/path/domain term.
- **Status and evidence filters:** Auth policy record has status and evidence filters.
- **Meaningful change history:** Auth policy record has meaningful change history.
- **Review/correction for inference:** Auth policy record has review/correction for inference.
- **Deep link to source and neighbors:** Auth policy record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Auth policy record has keyboard/screenreader representation.
- **Safe cited export:** Auth policy record has safe cited export.
- **On-demand bounded loading:** Auth policy record has on-demand bounded loading.
- **Checkable invariant:** Auth policy record has checkable invariant.
- **Explanation of missing evidence:** Auth policy record has explanation of missing evidence.
### Fekra object — Migration
**Scope:** schema, backfill, compatibility, rollback.
- **Stable id independent of label:** Migration record has stable id independent of label.
- **Project/repository/domain scope:** Migration record has project/repository/domain scope.
- **Source or author provenance:** Migration record has source or author provenance.
- **Freshness state:** Migration record has freshness state.
- **Explicit owner or unknown:** Migration record has explicit owner or unknown.
- **Typed incoming/outgoing links:** Migration record has typed incoming/outgoing links.
- **Search by name/path/domain term:** Migration record has search by name/path/domain term.
- **Status and evidence filters:** Migration record has status and evidence filters.
- **Meaningful change history:** Migration record has meaningful change history.
- **Review/correction for inference:** Migration record has review/correction for inference.
- **Deep link to source and neighbors:** Migration record has deep link to source and neighbors.
- **Keyboard/screenreader representation:** Migration record has keyboard/screenreader representation.
- **Safe cited export:** Migration record has safe cited export.
- **On-demand bounded loading:** Migration record has on-demand bounded loading.
- **Checkable invariant:** Migration record has checkable invariant.
- **Explanation of missing evidence:** Migration record has explanation of missing evidence.
### Fekra workflow coverage
#### Actor — new contributor
- **new contributor can** find entrypoint/evidence.
- **new contributor can** scope to app/domain.
- **new contributor can** trace both dependency directions.
- **new contributor can** distinguish direct fact from inference.
- **new contributor can** record assumption and owner.
- **new contributor can** inspect data/auth/API impact.
- **new contributor can** plan validation and rollout.
- **new contributor can** attach actual result.
- **new contributor can** compare before/after.
- **new contributor can** resume failed scan.
- **new contributor can** export scoped evidence.
- **new contributor can** identify stale decision.
#### Actor — frontend maintainer
- **frontend maintainer can** find entrypoint/evidence.
- **frontend maintainer can** scope to app/domain.
- **frontend maintainer can** trace both dependency directions.
- **frontend maintainer can** distinguish direct fact from inference.
- **frontend maintainer can** record assumption and owner.
- **frontend maintainer can** inspect data/auth/API impact.
- **frontend maintainer can** plan validation and rollout.
- **frontend maintainer can** attach actual result.
- **frontend maintainer can** compare before/after.
- **frontend maintainer can** resume failed scan.
- **frontend maintainer can** export scoped evidence.
- **frontend maintainer can** identify stale decision.
#### Actor — backend maintainer
- **backend maintainer can** find entrypoint/evidence.
- **backend maintainer can** scope to app/domain.
- **backend maintainer can** trace both dependency directions.
- **backend maintainer can** distinguish direct fact from inference.
- **backend maintainer can** record assumption and owner.
- **backend maintainer can** inspect data/auth/API impact.
- **backend maintainer can** plan validation and rollout.
- **backend maintainer can** attach actual result.
- **backend maintainer can** compare before/after.
- **backend maintainer can** resume failed scan.
- **backend maintainer can** export scoped evidence.
- **backend maintainer can** identify stale decision.
#### Actor — analytics owner
- **analytics owner can** find entrypoint/evidence.
- **analytics owner can** scope to app/domain.
- **analytics owner can** trace both dependency directions.
- **analytics owner can** distinguish direct fact from inference.
- **analytics owner can** record assumption and owner.
- **analytics owner can** inspect data/auth/API impact.
- **analytics owner can** plan validation and rollout.
- **analytics owner can** attach actual result.
- **analytics owner can** compare before/after.
- **analytics owner can** resume failed scan.
- **analytics owner can** export scoped evidence.
- **analytics owner can** identify stale decision.
#### Actor — payment maintainer
- **payment maintainer can** find entrypoint/evidence.
- **payment maintainer can** scope to app/domain.
- **payment maintainer can** trace both dependency directions.
- **payment maintainer can** distinguish direct fact from inference.
- **payment maintainer can** record assumption and owner.
- **payment maintainer can** inspect data/auth/API impact.
- **payment maintainer can** plan validation and rollout.
- **payment maintainer can** attach actual result.
- **payment maintainer can** compare before/after.
- **payment maintainer can** resume failed scan.
- **payment maintainer can** export scoped evidence.
- **payment maintainer can** identify stale decision.
#### Actor — content authoring developer
- **content authoring developer can** find entrypoint/evidence.
- **content authoring developer can** scope to app/domain.
- **content authoring developer can** trace both dependency directions.
- **content authoring developer can** distinguish direct fact from inference.
- **content authoring developer can** record assumption and owner.
- **content authoring developer can** inspect data/auth/API impact.
- **content authoring developer can** plan validation and rollout.
- **content authoring developer can** attach actual result.
- **content authoring developer can** compare before/after.
- **content authoring developer can** resume failed scan.
- **content authoring developer can** export scoped evidence.
- **content authoring developer can** identify stale decision.
#### Actor — incident responder
- **incident responder can** find entrypoint/evidence.
- **incident responder can** scope to app/domain.
- **incident responder can** trace both dependency directions.
- **incident responder can** distinguish direct fact from inference.
- **incident responder can** record assumption and owner.
- **incident responder can** inspect data/auth/API impact.
- **incident responder can** plan validation and rollout.
- **incident responder can** attach actual result.
- **incident responder can** compare before/after.
- **incident responder can** resume failed scan.
- **incident responder can** export scoped evidence.
- **incident responder can** identify stale decision.
#### Actor — reviewer
- **reviewer can** find entrypoint/evidence.
- **reviewer can** scope to app/domain.
- **reviewer can** trace both dependency directions.
- **reviewer can** distinguish direct fact from inference.
- **reviewer can** record assumption and owner.
- **reviewer can** inspect data/auth/API impact.
- **reviewer can** plan validation and rollout.
- **reviewer can** attach actual result.
- **reviewer can** compare before/after.
- **reviewer can** resume failed scan.
- **reviewer can** export scoped evidence.
- **reviewer can** identify stale decision.
### Fekra module checks
#### Module — repo connector
- repo connector validates project scope.
- repo connector reports progress and stable errors.
- repo connector supports bounded cancellation.
- repo connector does not modify source.
- repo connector preserves human records.
- repo connector emits evidence and freshness.
- repo connector versions analyzer output.
- repo connector shows counts and limits.
- repo connector handles malformed input.
- repo connector tests ambiguity and failure.
- repo connector labels partial coverage.
- repo connector documents blind spots.
#### Module — job coordinator
- job coordinator validates project scope.
- job coordinator reports progress and stable errors.
- job coordinator supports bounded cancellation.
- job coordinator does not modify source.
- job coordinator preserves human records.
- job coordinator emits evidence and freshness.
- job coordinator versions analyzer output.
- job coordinator shows counts and limits.
- job coordinator handles malformed input.
- job coordinator tests ambiguity and failure.
- job coordinator labels partial coverage.
- job coordinator documents blind spots.
#### Module — manifest reader
- manifest reader validates project scope.
- manifest reader reports progress and stable errors.
- manifest reader supports bounded cancellation.
- manifest reader does not modify source.
- manifest reader preserves human records.
- manifest reader emits evidence and freshness.
- manifest reader versions analyzer output.
- manifest reader shows counts and limits.
- manifest reader handles malformed input.
- manifest reader tests ambiguity and failure.
- manifest reader labels partial coverage.
- manifest reader documents blind spots.
#### Module — TypeScript parser
- TypeScript parser validates project scope.
- TypeScript parser reports progress and stable errors.
- TypeScript parser supports bounded cancellation.
- TypeScript parser does not modify source.
- TypeScript parser preserves human records.
- TypeScript parser emits evidence and freshness.
- TypeScript parser versions analyzer output.
- TypeScript parser shows counts and limits.
- TypeScript parser handles malformed input.
- TypeScript parser tests ambiguity and failure.
- TypeScript parser labels partial coverage.
- TypeScript parser documents blind spots.
#### Module — Next route analyzer
- Next route analyzer validates project scope.
- Next route analyzer reports progress and stable errors.
- Next route analyzer supports bounded cancellation.
- Next route analyzer does not modify source.
- Next route analyzer preserves human records.
- Next route analyzer emits evidence and freshness.
- Next route analyzer versions analyzer output.
- Next route analyzer shows counts and limits.
- Next route analyzer handles malformed input.
- Next route analyzer tests ambiguity and failure.
- Next route analyzer labels partial coverage.
- Next route analyzer documents blind spots.
#### Module — Express registration analyzer
- Express registration analyzer validates project scope.
- Express registration analyzer reports progress and stable errors.
- Express registration analyzer supports bounded cancellation.
- Express registration analyzer does not modify source.
- Express registration analyzer preserves human records.
- Express registration analyzer emits evidence and freshness.
- Express registration analyzer versions analyzer output.
- Express registration analyzer shows counts and limits.
- Express registration analyzer handles malformed input.
- Express registration analyzer tests ambiguity and failure.
- Express registration analyzer labels partial coverage.
- Express registration analyzer documents blind spots.
#### Module — Mongoose schema analyzer
- Mongoose schema analyzer validates project scope.
- Mongoose schema analyzer reports progress and stable errors.
- Mongoose schema analyzer supports bounded cancellation.
- Mongoose schema analyzer does not modify source.
- Mongoose schema analyzer preserves human records.
- Mongoose schema analyzer emits evidence and freshness.
- Mongoose schema analyzer versions analyzer output.
- Mongoose schema analyzer shows counts and limits.
- Mongoose schema analyzer handles malformed input.
- Mongoose schema analyzer tests ambiguity and failure.
- Mongoose schema analyzer labels partial coverage.
- Mongoose schema analyzer documents blind spots.
#### Module — Redux/RTK analyzer
- Redux/RTK analyzer validates project scope.
- Redux/RTK analyzer reports progress and stable errors.
- Redux/RTK analyzer supports bounded cancellation.
- Redux/RTK analyzer does not modify source.
- Redux/RTK analyzer preserves human records.
- Redux/RTK analyzer emits evidence and freshness.
- Redux/RTK analyzer versions analyzer output.
- Redux/RTK analyzer shows counts and limits.
- Redux/RTK analyzer handles malformed input.
- Redux/RTK analyzer tests ambiguity and failure.
- Redux/RTK analyzer labels partial coverage.
- Redux/RTK analyzer documents blind spots.
#### Module — analytics lineage analyzer
- analytics lineage analyzer validates project scope.
- analytics lineage analyzer reports progress and stable errors.
- analytics lineage analyzer supports bounded cancellation.
- analytics lineage analyzer does not modify source.
- analytics lineage analyzer preserves human records.
- analytics lineage analyzer emits evidence and freshness.
- analytics lineage analyzer versions analyzer output.
- analytics lineage analyzer shows counts and limits.
- analytics lineage analyzer handles malformed input.
- analytics lineage analyzer tests ambiguity and failure.
- analytics lineage analyzer labels partial coverage.
- analytics lineage analyzer documents blind spots.
#### Module — AWS/payment boundary analyzer
- AWS/payment boundary analyzer validates project scope.
- AWS/payment boundary analyzer reports progress and stable errors.
- AWS/payment boundary analyzer supports bounded cancellation.
- AWS/payment boundary analyzer does not modify source.
- AWS/payment boundary analyzer preserves human records.
- AWS/payment boundary analyzer emits evidence and freshness.
- AWS/payment boundary analyzer versions analyzer output.
- AWS/payment boundary analyzer shows counts and limits.
- AWS/payment boundary analyzer handles malformed input.
- AWS/payment boundary analyzer tests ambiguity and failure.
- AWS/payment boundary analyzer labels partial coverage.
- AWS/payment boundary analyzer documents blind spots.
#### Module — identity resolver
- identity resolver validates project scope.
- identity resolver reports progress and stable errors.
- identity resolver supports bounded cancellation.
- identity resolver does not modify source.
- identity resolver preserves human records.
- identity resolver emits evidence and freshness.
- identity resolver versions analyzer output.
- identity resolver shows counts and limits.
- identity resolver handles malformed input.
- identity resolver tests ambiguity and failure.
- identity resolver labels partial coverage.
- identity resolver documents blind spots.
#### Module — graph query
- graph query validates project scope.
- graph query reports progress and stable errors.
- graph query supports bounded cancellation.
- graph query does not modify source.
- graph query preserves human records.
- graph query emits evidence and freshness.
- graph query versions analyzer output.
- graph query shows counts and limits.
- graph query handles malformed input.
- graph query tests ambiguity and failure.
- graph query labels partial coverage.
- graph query documents blind spots.
#### Module — search
- search validates project scope.
- search reports progress and stable errors.
- search supports bounded cancellation.
- search does not modify source.
- search preserves human records.
- search emits evidence and freshness.
- search versions analyzer output.
- search shows counts and limits.
- search handles malformed input.
- search tests ambiguity and failure.
- search labels partial coverage.
- search documents blind spots.
#### Module — impact
- impact validates project scope.
- impact reports progress and stable errors.
- impact supports bounded cancellation.
- impact does not modify source.
- impact preserves human records.
- impact emits evidence and freshness.
- impact versions analyzer output.
- impact shows counts and limits.
- impact handles malformed input.
- impact tests ambiguity and failure.
- impact labels partial coverage.
- impact documents blind spots.
#### Module — evidence
- evidence validates project scope.
- evidence reports progress and stable errors.
- evidence supports bounded cancellation.
- evidence does not modify source.
- evidence preserves human records.
- evidence emits evidence and freshness.
- evidence versions analyzer output.
- evidence shows counts and limits.
- evidence handles malformed input.
- evidence tests ambiguity and failure.
- evidence labels partial coverage.
- evidence documents blind spots.
#### Module — export
- export validates project scope.
- export reports progress and stable errors.
- export supports bounded cancellation.
- export does not modify source.
- export preserves human records.
- export emits evidence and freshness.
- export versions analyzer output.
- export shows counts and limits.
- export handles malformed input.
- export tests ambiguity and failure.
- export labels partial coverage.
- export documents blind spots.
#### Module — migration
- migration validates project scope.
- migration reports progress and stable errors.
- migration supports bounded cancellation.
- migration does not modify source.
- migration preserves human records.
- migration emits evidence and freshness.
- migration versions analyzer output.
- migration shows counts and limits.
- migration handles malformed input.
- migration tests ambiguity and failure.
- migration labels partial coverage.
- migration documents blind spots.
#### Module — privacy filter
- privacy filter validates project scope.
- privacy filter reports progress and stable errors.
- privacy filter supports bounded cancellation.
- privacy filter does not modify source.
- privacy filter preserves human records.
- privacy filter emits evidence and freshness.
- privacy filter versions analyzer output.
- privacy filter shows counts and limits.
- privacy filter handles malformed input.
- privacy filter tests ambiguity and failure.
- privacy filter labels partial coverage.
- privacy filter documents blind spots.
#### Module — map renderer
- map renderer validates project scope.
- map renderer reports progress and stable errors.
- map renderer supports bounded cancellation.
- map renderer does not modify source.
- map renderer preserves human records.
- map renderer emits evidence and freshness.
- map renderer versions analyzer output.
- map renderer shows counts and limits.
- map renderer handles malformed input.
- map renderer tests ambiguity and failure.
- map renderer labels partial coverage.
- map renderer documents blind spots.
#### Module — finding review
- finding review validates project scope.
- finding review reports progress and stable errors.
- finding review supports bounded cancellation.
- finding review does not modify source.
- finding review preserves human records.
- finding review emits evidence and freshness.
- finding review versions analyzer output.
- finding review shows counts and limits.
- finding review handles malformed input.
- finding review tests ambiguity and failure.
- finding review labels partial coverage.
- finding review documents blind spots.
#### Module — flow model
- flow model validates project scope.
- flow model reports progress and stable errors.
- flow model supports bounded cancellation.
- flow model does not modify source.
- flow model preserves human records.
- flow model emits evidence and freshness.
- flow model versions analyzer output.
- flow model shows counts and limits.
- flow model handles malformed input.
- flow model tests ambiguity and failure.
- flow model labels partial coverage.
- flow model documents blind spots.
#### Module — bundle importer
- bundle importer validates project scope.
- bundle importer reports progress and stable errors.
- bundle importer supports bounded cancellation.
- bundle importer does not modify source.
- bundle importer preserves human records.
- bundle importer emits evidence and freshness.
- bundle importer versions analyzer output.
- bundle importer shows counts and limits.
- bundle importer handles malformed input.
- bundle importer tests ambiguity and failure.
- bundle importer labels partial coverage.
- bundle importer documents blind spots.
#### Module — fixture harness
- fixture harness validates project scope.
- fixture harness reports progress and stable errors.
- fixture harness supports bounded cancellation.
- fixture harness does not modify source.
- fixture harness preserves human records.
- fixture harness emits evidence and freshness.
- fixture harness versions analyzer output.
- fixture harness shows counts and limits.
- fixture harness handles malformed input.
- fixture harness tests ambiguity and failure.
- fixture harness labels partial coverage.
- fixture harness documents blind spots.
### Cross-cutting acceptance prompts
#### Concern — metric semantics and denominator
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — PII/payment sensitivity
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — authorization boundary
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — retry/idempotency
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — performance and query cost
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — logs/events/traces
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — API/schema compatibility
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — migration/backfill/rollback
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — cache invalidation
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — offline conflict
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — deployment evidence
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — docs freshness
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — test coverage
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — ownership
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — accessibility
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — RTL/localization
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — security controls
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — AI citations
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — source freshness
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — export redaction
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — large graph pagination
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — stable portable ids
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — analyzer extensibility
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
#### Concern — failure recovery
- Assign an evidence type.
- Expose uninspected scope.
- Add a verification fixture.
- Preserve human correction during re-index.
- Include in impact review when affected.
- Keep usable at Fekra scale.
# Part III — Generic product requirements baseline
The following appendix preserves the existing blueprint as a compatibility reference. The Fekra-specific priorities above supersede generic examples where they differ.
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

## End of consolidated proposal
