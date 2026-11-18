# Drawing research and product implications

An agy research agent surveyed agentic sketching and SVG generation while Codex built this app. The full working report is retained separately in the parent workspace at `spike/AGENTIC_DRAWING_RESEARCH.md`. Its first version contained unsupported timing/cost claims; those were sent back for correction. The original spikes did not measure end-to-end authoring latency or cost.

Two independently checked primary sources inform this product:

- [Teaching an Agent to Sketch One Part at a Time](https://arxiv.org/abs/2603.19500), Du et al., March 2026, revised April 2026: a trained multimodal agent uses part-level sketch annotations and intermediate visual feedback. This is evidence for a structured part-by-part process in its evaluated setting; it does not establish that an ordinary coding agent can paint convincing textured scenes.
- [IntroSVG](https://arxiv.org/abs/2603.09312), Wang et al., March 2026: a generator–critic framework learns from rendered SVG feedback using training and preference optimization. Its reported improvement is not something this app gains merely by adding a critique prompt.

The practical direction is to support labelled drawing batches, preserve source operations, make rendered work accessible for inspection, and keep feedback attached to the room. These are useful platform capabilities regardless of which agent or model contributes. Training a drawing model and providing an automatic quality judge are outside this submission.

Our own uncontrolled brush comparison gave better mark control without a clear artistic improvement. That is a result for that experiment, not a universal limit of LLM drawing. More brush physics is therefore not justified by our present evidence. Image references and better visual feedback are the next product experiments.
