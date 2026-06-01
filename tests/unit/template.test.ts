import { describe, it, expect } from "vitest";
import { interpolate, listTokens } from "@/lib/flow-runner/template";

describe("template.interpolate", () => {
  it("returns input unchanged when no tokens", () => {
    expect(interpolate("hello", {})).toBe("hello");
  });
  it("substitutes a single token", () => {
    expect(interpolate("Hello {name}", { name: "Ravi" })).toBe("Hello Ravi");
  });
  it("substitutes an array as comma-joined", () => {
    expect(interpolate("for {course}", { course: ["JEE", "NEET"] })).toBe(
      "for JEE, NEET",
    );
  });
  it("hides missing tokens silently (no raw {x} leak)", () => {
    expect(interpolate("personalize for {course}", {})).toBe("personalize for");
  });
  it("collapses double spaces from missing tokens", () => {
    expect(interpolate("foo {a} bar", {})).toBe("foo bar");
  });
  it("trims punctuation after dropped token", () => {
    expect(interpolate("hi {who}, welcome", {})).toBe("hi, welcome");
  });
});

describe("template.listTokens", () => {
  it("finds all referenced step keys", () => {
    expect(listTokens("for {course} on {date}")).toEqual(["course", "date"]);
  });
  it("dedupes", () => {
    expect(listTokens("{a} {a} {b}")).toEqual(["a", "b"]);
  });
  it("returns [] for plain text", () => {
    expect(listTokens("no tokens here")).toEqual([]);
  });
});
