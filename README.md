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

Repository scanning, static analysis, and source import are intentionally outside M1 and belong to later milestones. The repository view currently reflects paths entered into the model.
