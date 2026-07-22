import { escapeRegex } from "../utils/string.utils";

describe("String Utilities - escapeRegex", () => {
  it("should escape special regex characters correctly", () => {
    const input = "test.*+?^${}()|[]\\string";
    const expected = "test\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\string";
    expect(escapeRegex(input)).toBe(expected);
  });

  it("should return unchanged string when no special characters exist", () => {
    const input = "hello world 123";
    expect(escapeRegex(input)).toBe("hello world 123");
  });

  it("should handle empty strings safely", () => {
    expect(escapeRegex("")).toBe("");
  });
});
