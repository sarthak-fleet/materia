import { describe, it, expect } from "vitest";
import { GRADE_META, TRADITION_LABEL, ALIGNMENT_META, SEVERITY_META } from "../grades";

describe("GRADE_META", () => {
  it("has entries for all 5 grades", () => {
    const grades = Object.keys(GRADE_META);
    expect(grades).toContain("A");
    expect(grades).toContain("B");
    expect(grades).toContain("C");
    expect(grades).toContain("D");
    expect(grades).toContain("insufficient");
    expect(grades).toHaveLength(5);
  });

  it("each grade has letter, label, color, and short", () => {
    for (const [key, meta] of Object.entries(GRADE_META)) {
      expect(meta.letter).toBeTruthy();
      expect(meta.label).toBeTruthy();
      expect(meta.color).toBeTruthy();
      expect(meta.short).toBeTruthy();
    }
  });

  it("insufficient grade uses dash letter", () => {
    expect(GRADE_META.insufficient.letter).toBe("—");
  });
});

describe("TRADITION_LABEL", () => {
  it("maps known traditions", () => {
    expect(TRADITION_LABEL.ayurveda).toBe("Ayurveda");
    expect(TRADITION_LABEL.tcm).toBe("Traditional Chinese Medicine");
    expect(TRADITION_LABEL.western).toBe("Western herbalism");
    expect(TRADITION_LABEL.other).toBe("Traditional use");
  });
});

describe("ALIGNMENT_META", () => {
  it("has 4 alignment states", () => {
    const keys = Object.keys(ALIGNMENT_META);
    expect(keys).toContain("aligns");
    expect(keys).toContain("conflicts");
    expect(keys).toContain("mixed");
    expect(keys).toContain("unstudied");
  });

  it("each alignment has label and color", () => {
    for (const meta of Object.values(ALIGNMENT_META)) {
      expect(meta.label).toBeTruthy();
      expect(meta.color).toBeTruthy();
    }
  });
});

describe("SEVERITY_META", () => {
  it("has 4 severity levels", () => {
    const keys = Object.keys(SEVERITY_META);
    expect(keys).toContain("severe");
    expect(keys).toContain("moderate");
    expect(keys).toContain("minor");
    expect(keys).toContain("theoretical");
  });

  it("each severity has label and color", () => {
    for (const meta of Object.values(SEVERITY_META)) {
      expect(meta.label).toBeTruthy();
      expect(meta.color).toBeTruthy();
    }
  });
});
