# LangGraph Migration Plan for Hirevo

## What is implemented in this PR

A graph-runtime adapter has been introduced in backend interview orchestration:

- `server/src/services/questionGeneration/interviewGraph.runtime.js`
- `server/src/sockets/interviewSocket.newStream.js`

The socket layer now calls `runInterviewStartGraph(...)` and `runInterviewTurnGraph(...)` instead of directly binding to DB workflow functions. This creates a clean seam for migrating to a real LangGraph state machine.

## Why not full LangGraph package wiring in this commit

The environment currently blocks installation of `@langchain/langgraph` from npm (403 registry policy), so this commit uses a LangGraph-ready adapter pattern without changing production behavior.

## Target architecture (when package install is available)

1. Replace runtime adapter internals with `StateGraph` implementation.
2. Represent interview state with typed graph state (`workflowSession`, `lastQuestionId`, `finalText`, `status`, `error`).
3. Nodes:
   - `initializeSession`
   - `generateQuestion`
   - `synthesizeQuestionAudio`
   - `persistTurn`
   - `completeInterview`
4. Conditional edges on `status` (`continue`, `complete`, `error`).
5. Keep STT isolated in `stt-server`; send only final transcript to interview graph.

## Operational recommendations

- Keep graph execution idempotent per `(sessionId, turnId)`.
- Persist graph checkpoints for recovery after process restarts.
- Add tracing around each node execution.
- Add integration tests for start-turn, mid-turn, and complete-turn transitions.
