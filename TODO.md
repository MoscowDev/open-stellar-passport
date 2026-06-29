# TODO

- [ ] Create route: app/api/protocol/passport/health/route.ts
- [ ] Implement GET /api/protocol/passport/health (no auth) returning aggregate health JSON
- [ ] Compute passport counts from live PassportStore (lib/passport/passport)
- [ ] Compute circuitBreakers.open based on revoked passport count (threshold logic per existing code; see circuit breakers defaults)
- [ ] Compute auditLog.totalEntries and lastEntryLedger from live audit store (lib/passport/audit)
- [ ] Add vitest unit test per acceptance criteria at tests/lib/passport/health_route.test.ts (or similar)
- [ ] Ensure route test mocks next/server NextResponse.json
- [ ] Run targeted vitest test(s)

