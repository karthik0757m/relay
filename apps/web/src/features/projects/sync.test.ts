// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { SyncJob } from "@/lib/api/types";

/**
 * Sync state machine unit tests.
 * Tests the logical transitions without rendering React components.
 */

type SyncStatus = SyncJob["status"];

const TERMINAL: SyncStatus[] = ["succeeded", "failed"];

function isTerminal(status: SyncStatus): boolean {
  return TERMINAL.includes(status);
}

function shouldPoll(job: SyncJob | undefined): boolean {
  if (!job) return false;
  return !isTerminal(job.status);
}

function makeJob(status: SyncStatus, progress = 0, error: string | null = null): SyncJob {
  return {
    id: "job_1",
    projectId: "turborepo",
    status,
    progress,
    error,
    startedAt: "2026-10-01T00:00:00Z",
    completedAt: status === "succeeded" || status === "failed" ? "2026-10-01T00:01:00Z" : null,
  };
}

describe("Sync state machine", () => {
  describe("isTerminal", () => {
    it("succeeded is terminal", () => expect(isTerminal("succeeded")).toBe(true));
    it("failed is terminal",    () => expect(isTerminal("failed")).toBe(true));
    it("running is not terminal", () => expect(isTerminal("running")).toBe(false));
    it("queued is not terminal",  () => expect(isTerminal("queued")).toBe(false));
  });

  describe("shouldPoll", () => {
    it("returns false when job is undefined", () => {
      expect(shouldPoll(undefined)).toBe(false);
    });
    it("returns true for queued job", () => {
      expect(shouldPoll(makeJob("queued"))).toBe(true);
    });
    it("returns true for running job", () => {
      expect(shouldPoll(makeJob("running", 50))).toBe(true);
    });
    it("returns false for succeeded job", () => {
      expect(shouldPoll(makeJob("succeeded", 100))).toBe(false);
    });
    it("returns false for failed job", () => {
      expect(shouldPoll(makeJob("failed", 25, "Rate limit exceeded"))).toBe(false);
    });
  });

  describe("progress transitions", () => {
    it("queued starts at 0%", () => {
      const job = makeJob("queued", 0);
      expect(job.progress).toBe(0);
    });
    it("running can be at any intermediate %", () => {
      const job = makeJob("running", 50);
      expect(job.progress).toBeGreaterThan(0);
      expect(job.progress).toBeLessThan(100);
    });
    it("succeeded reaches 100%", () => {
      const job = makeJob("succeeded", 100);
      expect(job.progress).toBe(100);
      expect(job.completedAt).not.toBeNull();
    });
    it("failed preserves error message", () => {
      const job = makeJob("failed", 25, "Rate limit exceeded (429)");
      expect(job.error).toBe("Rate limit exceeded (429)");
      expect(isTerminal(job.status)).toBe(true);
    });
  });

  describe("job progression sequence", () => {
    it("goes through queued -> running -> succeeded", () => {
      const states: SyncStatus[] = ["queued", "running", "succeeded"];
      const pollStates = states.map((s) => shouldPoll(makeJob(s)));
      expect(pollStates).toEqual([true, true, false]);
    });

    it("goes through queued -> running -> failed", () => {
      const states: SyncStatus[] = ["queued", "running", "failed"];
      const pollStates = states.map((s) => shouldPoll(makeJob(s)));
      expect(pollStates).toEqual([true, true, false]);
    });
  });
});
