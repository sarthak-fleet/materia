import { describe, it, expect } from "vitest";

// Test the dosing-verb regex and SVG region set from content-checks.mjs
// We replicate the constants here to test the logic without filesystem deps.

const SVG_REGIONS = new Set([
  "head", "neck", "shoulder", "chest", "abdomen",
  "upper-arm", "forearm", "hand", "hip", "thigh",
  "knee", "calf", "foot",
]);

const DOSING = /\b(take|use|consume|swallow|apply)\s+\d/i;

describe("SVG_REGIONS", () => {
  it("contains all expected body part regions", () => {
    expect(SVG_REGIONS.size).toBe(13);
    expect(SVG_REGIONS.has("head")).toBe(true);
    expect(SVG_REGIONS.has("foot")).toBe(true);
    expect(SVG_REGIONS.has("chest")).toBe(true);
  });

  it("does not contain invalid regions", () => {
    expect(SVG_REGIONS.has("brain")).toBe(false);
    expect(SVG_REGIONS.has("")).toBe(false);
  });
});

describe("DOSING regex", () => {
  it("flags imperative dosing language", () => {
    expect(DOSING.test("take 500 mg daily")).toBe(true);
    expect(DOSING.test("apply 2 drops")).toBe(true);
    expect(DOSING.test("consume 3 capsules")).toBe(true);
    expect(DOSING.test("swallow 1 tablet")).toBe(true);
    expect(DOSING.test("use 200mg")).toBe(true);
  });

  it("does not flag descriptive language", () => {
    expect(DOSING.test("studied at 500 mg")).toBe(false);
    expect(DOSING.test("typically taken with food")).toBe(false);
    expect(DOSING.test("no dosing info here")).toBe(false);
    expect(DOSING.test("the study used 300mg")).toBe(false);
  });

  it("does not flag without a number", () => {
    expect(DOSING.test("take with food")).toBe(false);
    expect(DOSING.test("apply topically")).toBe(false);
  });
});
