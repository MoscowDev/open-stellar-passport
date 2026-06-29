import { NextResponse } from "next/server";
import {
  getAllPassports,
  type PassportRecord,
} from "@/lib/passport/passport";
import { listAuditEntries } from "@/lib/passport/audit";

const CHECKED_AT_ISO = (): string => new Date().toISOString();

function computePassportStats(passports: PassportRecord[]) {
  const total = passports.length;
  const active = passports.filter((p) => p.status === "active").length;
  const revoked = passports.filter((p) => p.status === "revoked").length;
  const expired = passports.filter((p) => p.status === "expired").length;

  return { total, active, revoked, expired };
}

function computeCircuitBreakerStats(passports: PassportRecord[]) {
  // For this lightweight health endpoint we treat each revoked passport
  // as an opened breaker, and the total number of breakers equals total
  // known passports.
  const total = passports.length;
  const open = passports.filter((p) => p.status === "revoked").length;
  return { open, total };
}

function computeAuditLogStats() {
  // Health endpoint should return aggregate audit stats without exposing details.
  // Note: this repository's audit log is a shared in-memory store used by the app.
  // We rely on the live listAuditEntries() output.
  const entries = listAuditEntries();
  const totalEntries = entries.length;

  // lastEntryLedger is implemented as the latest audit timestamp in millis.
  const last = entries[0];
  const lastEntryLedger = last ? Number(new Date(last.timestamp).getTime()) : 0;

  return { totalEntries, lastEntryLedger };
}

export async function GET() {
  const passports = getAllPassports();

  const status = "ok" as const;

  const checkedAt = CHECKED_AT_ISO();

  const passportStats = computePassportStats(passports);
  const circuitBreakers = computeCircuitBreakerStats(passports);
  const auditLog = computeAuditLogStats();

  return NextResponse.json(
    {
      status,
      passports: passportStats,
      circuitBreakers,
      auditLog,
      checkedAt,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

