# Architecture Lab

A local-first workspace for shaping architecture models, rehearsing flows, branching scenarios, and exporting change plans.

## Run locally

```sh
npm install
npm run dev
```

The app stores workspace data in IndexedDB on this browser profile, with a local-storage fallback if IndexedDB is unavailable. No source code or project data is sent to a service. The starter Product Platform model is sample data that can be edited or removed.

## M1 workflows

- Switch between local projects or create a new greenfield model.
- Add typed architecture elements and relationships, arrange elements on the map, and edit details in the inspector.
- Create a baseline from the active scenario, then branch scenarios from that model.
- Model flows with linked elements, multiple outcomes, and a step-by-step player.
- Browse manually modeled repository paths and compare scenario elements against the baseline.
- Undo and redo edits with `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z`.
- Open the command palette with `Ctrl/Cmd+K`; search elements with `/`.
- Export a Markdown change plan or a JSON workspace bundle; import a validated JSON bundle.
- Import a local repository with the browser directory picker (or a directory-selection fallback), review scan limits and findings, and apply or re-import observed source facts.
- Inspect evidence paths and line numbers for TypeScript imports, exported declarations, package manifests, and detected Next.js route conventions.
- Review stack-aware findings for Mongoose, Redis cache behavior, RTK Query tags, IndexedDB upgrades, offline event handling, and browser storage. Findings link back to source and show dependent modules through the imported local dependency graph; resolve or suppress decisions persist across matching re-imports.
- Annotate flow steps with deterministic cache, database, failure, network, and queue actions; rehearse cold/warm cache, dependency failure, and offline/online presets while inspecting state diffs.
- Compare the active scenario against the baseline or another scenario across elements, relationships, and flow actions; record decisions and assumptions and generate validation cases plus rollout/rollback guidance.
- Export/import a portable single-project JSON bundle alongside the full-workspace bundle. Project imports merge as a separate project; workspace imports restore the whole local workspace.

Repository analysis is read-only. It never executes project code, skips common generated/dependency/VCS directories and secret-like filenames by default, and records parser failures or unresolved local imports as review notes. Re-import updates the source baseline while preserving changed scenario records and retaining prior baseline snapshots. Only model data, file metadata, hashes, and evidence references are persisted; source text is not saved.

Stack review uses conservative static heuristics, not runtime proof or whole-project type analysis. Cross-file cache invalidation, dynamic key construction, framework wrappers, and schema upgrades outside the matched file can be missed; each finding shows confidence and should be checked against the surrounding code.

Flow rehearsal is a deterministic model, not application execution: it operates on an in-memory cache/database/network/queue state and never contacts real dependencies. Generated test cases and rollout steps are planning prompts to validate in the target system.
