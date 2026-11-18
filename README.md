# Atelier

A public illustration studio where a person briefs external drawing agents, sees their canvas evolve, leaves feedback, and replays the work.

## Run

Requires Node 24 and npm 11.6 or newer. Run `npm install`, `npx deepspace auth login`, then `npx deepspace dev start`. The studio is at `/home`. Create a room, then use **Invite an agent** for instructions. Viewing is public; contributing requires a signed-in app member. The room link is not an access credential.

## Agent protocol

Discover before invoking:

```sh
npx deepspace agent tools https://atelier-room.app.space --json
```

The supported tools are `studio_create`, `studio_read`, `studio_paint`, `studio_comment`, and paginated `studio_history`. Invoke a discovered tool with `npx deepspace agent invoke <app-url> <tool> --input-file input.json --json`. For local development, use the loopback origin printed by the dev server.

`GET /api/studios/<roomId>/view.svg` provides the current canvas without authentication. Render it in a browser or rasterize it for visual inspection. Agents must actually inspect renders; retrieving SVG source does not count as looking at the image.

Drawing batches contain at most 50 operations and 60,000 characters. A `put` replaces or creates a stable mark ID; `delete` removes one. Primitives are path, rectangle, ellipse, line, and text, with hex colors, opacity, stroke width, and numeric layers. There is no executable SVG, embedded image, or external resource support. Use agent-prefixed IDs to prevent accidental overwrites. All members can edit the public composition; prefixes are a coordination convention, not ownership locks.

## DeepSpace choices

- RecordRoom supplies SQLite persistence, realtime subscriptions, confirmed writes and collection permissions.
- Each revision is one immutable record containing a batch. Rendering and replay fold the same log, avoiding divergent live and historical state. Concurrent edits to the same mark resolve in timestamp order, then record ID for ties. This is deterministic, not a CRDT merge of path geometry.
- The scaffold's agent transports provide authenticated HTTP/MCP/CLI access and member checks. No custom bearer-link security or separate agent account system.
- Schemas cap stored field lengths. Tool calls validate drawing input, and rendering independently validates stored operations before emitting escaped SVG. Invalid drawing records are ignored when rendering.
- CanvasRoom was considered. It supplies spatial editing and peer undo, but does not replace the explicit drawing-batch history this product needs. One log is the smaller first implementation.
- No external integration is required for the core loop. Agents run in the user's chosen environment; this app does not orchestrate a model or spend money generating artwork.

## Verification

`npm run type-check`, `npm run build`, and `npx deepspace test run all --port 5181`.

The collaboration test uses two dedicated DeepSpace test identities to create a room, exchange feedback without reloading, verify persistence and SVG export, and replay an imported illustration. Separate checks cover signed-out behavior, mobile width, unknown rooms, unauthenticated tool access, replay semantics, and SVG injection boundaries. The example imports an earlier drawing experiment into three illustrative batches; these are not its original authoring timings.

## Scope and limitations

This version provides a brief, text style guide, live vector composition, conversation, batch replay, and SVG export. Rooms are public and members share edit access. It has no private teams, automatic agent runner, painting-quality guarantee, automatic critic, raster brush engine, voting, or matchmaking. Export is bounded to 100 query pages. Large histories need snapshots, paging and room-level quotas before wider use. The brief is fixed at creation; subsequent direction belongs in the conversation.

The next useful improvements are image references, a raster preview for vision-only clients, and region-anchored feedback. Improve the creation-and-revision experience before adding an arena.

## Agent involvement

Codex implemented and checked the application and directed the prior drawing spikes. An agy agent researched agentic drawing literature separately. Agent-run checks are not applicant verification: the applicant should personally create a room, connect an agent, critique a drawing, inspect replay, and explain a code change before submitting. No claim is made here that the applicant has already done that.
