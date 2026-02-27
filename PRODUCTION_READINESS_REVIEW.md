# Production Readiness Review (Hirevo)

This document captures high-impact improvements to move this repository from a development-oriented setup toward production readiness.

## Current posture summary

The repository currently looks optimized for local development:
- Containers mount source volumes and run dev servers (`vite`, `npm run start` without build stages).
- API and socket services are exposed with broad defaults.
- Security middleware and runtime hardening are minimal.
- Observability, CI/CD checks, and operational guardrails are incomplete.

---

## Priority 0 (immediate, before internet exposure)

### 1) Lock down configuration and secrets management

**Why:** Credentials and env handling are currently development-style.

**Recommended changes:**
- Replace hardcoded compose credentials with environment/secret injection (Vault, AWS Secrets Manager, Docker/K8s secrets).
- Add strict environment schema validation at process startup (e.g., `zod`/`envalid`).
- Create `.env.example` files with required keys and safe placeholders.
- Fail fast when critical keys are missing.

**Repo signals:**
- `compose.yml` contains inline MongoDB root credentials.
- `server/src/index.js` and `stt-server/src/index.js` load env but do not validate required variables.

### 2) Add API security baseline middleware

**Why:** The API currently accepts broad CORS defaults and has no common HTTP hardening layers.

**Recommended changes:**
- Configure CORS with explicit `origin` allowlist from env (no wildcard in production).
- Add `helmet`.
- Add request rate limiting per IP for public endpoints and socket handshake routes.
- Add payload size and content-type validation for upload/transcription routes.

**Repo signals:**
- `server/src/app.js` uses `app.use(cors())` with defaults.
- Parsing middleware is duplicated and not centrally policy-driven.

### 3) Production Docker images (multi-stage + non-root)

**Why:** Current Dockerfiles are single-stage and suitable for development, not optimized or hardened for production.

**Recommended changes:**
- Use multi-stage builds (`builder` + `runtime`) and copy only build artifacts.
- Use `npm ci --omit=dev` in runtime stage.
- Run as non-root user.
- Add healthcheck instructions and deterministic base image tags.

**Repo signals:**
- All service Dockerfiles use `node:20`, install full dependencies, and run as root.
- Client container runs `npm run dev` (Vite dev server), not built static assets.

---

## Priority 1 (first production iteration)

### 4) Introduce a production deploy topology

**Recommended changes:**
- Separate dev and prod compose/K8s manifests.
- Put client behind Nginx/CDN; serve built assets.
- Put API and websocket services behind reverse proxy with TLS termination, request timeouts, and websocket upgrade config.
- Remove bind mounts and `node_modules` anonymous volume pattern in production.

### 5) Reliability and fault tolerance for realtime interview flow

**Recommended changes:**
- Add socket reconnection policies and idempotent session state restoration.
- Add queueing/backpressure for transcription bursts.
- Add timeout/circuit-breaker/retry policy around third-party STT/LLM/TTS calls.
- Add graceful shutdown hooks to drain active sessions before process exit.

**Repo signals:**
- Core interview system relies heavily on socket orchestration (`server/src/sockets/*`, `stt-server/src/stt/*`).

### 6) Data model and persistence hardening

**Recommended changes:**
- Ensure indexes and TTL policies on interview/session collections.
- Add migration/versioning strategy (e.g., migrate-mongo).
- Standardize schema validation and sanitize user-submitted content.

---

## Priority 2 (operational maturity)

### 7) Observability (logs, metrics, traces)

**Recommended changes:**
- Structured logs (`pino`) with request/session correlation IDs.
- Metrics: API latency, socket connection count, STT/LLM provider latency/error rates.
- Distributed tracing for request → socket → provider calls.
- Alerting SLOs and error budget policy.

### 8) CI/CD quality gates

**Recommended changes:**
- Add CI pipeline for lint, tests, dependency audit, and image build.
- Add contract/integration tests for socket events and interview lifecycle.
- Block merges on failing checks.

### 9) Dependency and supply-chain hygiene

**Recommended changes:**
- Pin Node/image versions to explicit patches.
- Enable scheduled dependency updates and automated security scans.
- Generate SBOM and image vulnerability reports.

---

## Suggested implementation plan (2-week sprint)

### Week 1
1. Split dev/prod manifests and Dockerfiles.
2. Add env schema validation + `.env.example` templates.
3. Add `helmet`, strict CORS, and rate limiting.
4. Add health/readiness endpoints with dependency checks.

### Week 2
1. Add structured logging and baseline metrics.
2. Implement socket reliability improvements and graceful shutdown.
3. Add CI pipeline gates (lint/test/audit/build).
4. Run load testing for interview + transcription paths and tune limits.

---

## Exit criteria for “production-ready v1”

- No hardcoded credentials in repo/manifests.
- Production images are non-root, minimal, and reproducible.
- API/socket paths protected by CORS policy, security headers, and rate limits.
- Health/readiness/observability in place with alerts.
- CI gates prevent regressions and known vulnerable dependencies.
