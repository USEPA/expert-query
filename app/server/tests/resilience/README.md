# Resilience tests

Opt-in tests that exercise the server under adverse client and network behavior
(clients that stall, stop reading, or disconnect mid-request), and verify it
degrades gracefully and reclaims resources (connections, pooled DB clients,
memory) rather than leaking or crashing.

Each test exhausts the pool, so they run serially and are kept out of the
parallel main suite. They are **excluded from `npm test`** and run only via
`npm run test:resilience`. Coverage and Allure results still combine into the
final report.

Everything here drives the **local app over HTTP only**. Never point it at a
deployed or shared environment.

## Prerequisites

A reachable dev DB, configured via env (the devshell provides it). The tests
start the app in-process on an ephemeral port, so no separate server is needed.

## Run

```sh
npm run test:resilience
```

## Configuration

Override via env where needed:

| Var | Default | Purpose |
| --- | --- | --- |
| `DB_POOL_MAX` | `10` | pool size, from `.env.local` |
| `STREAM_IDLE_TIMEOUT` | `10000` | used by `streamIdleTimeout.test.js`; from `.env.local` |
| `RST_ITERATIONS` | `500` | aborted requests `clientDisconnect.test.js` fires |
| `RST_MAX_DELAY_MS` | `50` | upper bound on `clientDisconnect.test.js`'s post-send abort delay |
