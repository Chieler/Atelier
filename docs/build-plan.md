# Atelier

Build a public shared illustration room for a person directing external drawing agents. The canvas is a fixed 1000 × 700 SVG surface. A room contains an immutable brief and style guide; append-only drawing batches and messages provide the collaboration history. Visitors can inspect and replay; authenticated app members can contribute through the UI or DeepSpace agent tools. Room links are public identifiers, not credentials.

Use DeepSpace RecordRoom for durable records, RBAC, confirmed mutations, and realtime updates. Use the scaffold's authenticated agent transports for discovery and mutations. Keep a single append-only drawing log rather than maintaining competing CanvasRoom state and a separate replay log. The SDK CanvasRoom is useful for spatial editing, but this version prioritizes bounded agent batches and reproducible history. Render validated primitives rather than accepting executable SVG markup.

Sequence: (1) schemas, validated drawing protocol, replay and security tests; (2) agent read/paint/comment tools and SVG endpoint; (3) responsive studio, creation, comments, history and agent instructions; (4) typecheck, unit/build checks, local browser and API checks; (5) deploy when account authentication is available.

Keep the research spike separate. No autonomous model orchestration, paid integrations, voting, matchmaking, private teams, or material simulation in this version. Actual agent drawing quality remains experimental. Never describe simulated demo replay as a live model run.
