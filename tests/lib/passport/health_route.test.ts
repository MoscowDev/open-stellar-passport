import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/protocol/passport/health/route";

import {
  resetPassportStore,
  issuePassport,
} from "@/lib/passport/passport";
import { revokePassport, resetRevocationStore } from "@/lib/passport/revocation";
import { resetAuditStore } from "@/lib/passport/audit";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
      const headers = new Headers(init?.headers);
      return {
        status: init?.status ?? 200,
        headers,
        json: async () => body,
      } as unknown as Response;
    },
  },
}));

describe("GET /api/protocol/passport/health", () => {
  beforeEach(() => {
    resetPassportStore();
    resetRevocationStore();
    resetAuditStore();
    vi.useFakeTimers();
    vi.setSystemTime("2026-06-26T16:00:00.000Z");
  });

  it("returns aggregate health without sensitive data and counts live data", async () => {
    // 3 passports
    issuePassport("p1", "A1", "admin");
    issuePassport("p2", "A2", "admin");
    issuePassport("p3", "A3", "admin");

    // revoke 1
    revokePassport("p2", { reason: "policy_violation" }, "admin");

    // issuePassport + revokePassport already append audit entries.



    const res = await GET(new Request("http://localhost/api/protocol/passport/health"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;

    expect(body.status).toBe("ok");
    expect(body.checkedAt).toBe("2026-06-26T16:00:00.000Z");

    expect(body.passports).toEqual({
      total: 3,
      active: 2,
      revoked: 1,
      expired: 0,
    });

    // Current lightweight circuit-breaker logic treats revoked passports as open breakers.
    expect(body.circuitBreakers).toEqual({
      open: 1,
      total: 3,
    });

    expect(body.auditLog.totalEntries).toBeGreaterThanOrEqual(3);
    expect(typeof body.auditLog.lastEntryLedger).toBe("number");
    // lastEntryLedger is derived from the newest audit entry timestamp; exact value may vary in this repo.
    expect(body.auditLog.lastEntryLedger).toBeGreaterThan(0);

    // ensure it doesn't leak agentIds
    expect(JSON.stringify(body)).not.toContain("A1");
    expect(JSON.stringify(body)).not.toContain("A2");
    expect(JSON.stringify(body)).not.toContain("A3");
  });
});

