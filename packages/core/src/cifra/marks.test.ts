import { describe, expect, it } from "vitest";
import { emptyMarks, nextMark, tileMarkState } from "./marks";

describe("cell marks", () => {
  it("starts with every cell unmarked", () => {
    const marks = emptyMarks();
    expect(marks).toEqual({});
    expect(emptyMarks()).not.toBe(marks);
    expect(tileMarkState(marks, 0, 0)).toBe("none");
    expect(tileMarkState(marks, 8, 4)).toBe("none");
  });

  it.each([[0, 0], [2, 4], [8, 2]])("cycles only cell %i,%i through four taps", (row, position) => {
    let marks = emptyMarks();
    for (const state of ["out", "in", "here", "none"]) {
      marks = nextMark(marks, row, position);
      expect(tileMarkState(marks, row, position)).toBe(state);
      expect(tileMarkState(marks, row + 1, position)).toBe("none");
      expect(tileMarkState(marks, row, position + 1)).toBe("none");
    }
    expect(marks).toEqual(emptyMarks());
  });

  it("keeps repeated digits independent even in the same column", () => {
    // Both cells can display the same digit. Its value is deliberately not a key.
    let marks = emptyMarks();
    for (let tap = 0; tap < 3; tap++) marks = nextMark(marks, 0, 1);
    marks = nextMark(marks, 1, 1);
    expect(tileMarkState(marks, 0, 1)).toBe("here");
    expect(tileMarkState(marks, 1, 1)).toBe("out");
    expect(tileMarkState(marks, 2, 1)).toBe("none");
    marks = nextMark(marks, 0, 1);
    expect(tileMarkState(marks, 0, 1)).toBe("none");
    expect(tileMarkState(marks, 1, 1)).toBe("out");
  });

  it("does not mutate earlier states", () => {
    const original = emptyMarks();
    Object.freeze(original);
    const first = nextMark(original, 0, 0);
    Object.freeze(first);
    const second = nextMark(first, 0, 0);
    expect(original).toEqual({});
    expect(tileMarkState(first, 0, 0)).toBe("out");
    expect(tileMarkState(second, 0, 0)).toBe("in");
  });

  it("new failed-attempt rows start empty and preserve earlier notes", () => {
    let marks = nextMark(emptyMarks(), 0, 0);
    marks = nextMark(marks, 5, 0);
    expect(tileMarkState(marks, 6, 0)).toBe("none");
    const nextAttempt = nextMark(marks, 6, 0);
    expect(tileMarkState(nextAttempt, 0, 0)).toBe("out");
    expect(tileMarkState(nextAttempt, 5, 0)).toBe("out");
    expect(tileMarkState(nextAttempt, 6, 0)).toBe("out");
    expect(tileMarkState(marks, 6, 0)).toBe("none");
  });
});
