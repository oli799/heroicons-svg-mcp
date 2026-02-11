import { createRequire } from "node:module";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  clearIconCaches,
  SUPPORTED_STYLES,
  getIconNamesForStyle,
  listAllIcons,
  retrieveIcon,
  searchIcons,
} = require("./icons.js");

beforeEach(() => {
  clearIconCaches();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listAllIcons", () => {
  it("lists all styles when no style filter is provided", () => {
    const result = listAllIcons();

    expect(result.styles).toEqual(SUPPORTED_STYLES);
    expect(result.total).toBe(result.icons.length);

    for (const style of SUPPORTED_STYLES) {
      expect(result.iconsByStyle[style].length).toBeGreaterThan(0);
    }
  });

  it("filters icons by style", () => {
    const style = "mini";
    const result = listAllIcons(style);
    const directNames = getIconNamesForStyle(style);

    expect(result.styles).toEqual([style]);
    expect(result.iconsByStyle[style]).toEqual(directNames);
    expect(result.icons.every((icon) => icon.style === style)).toBe(true);
    expect(result.total).toBe(directNames.length);
  });

  it("throws on unsupported style", () => {
    expect(() => listAllIcons("not-a-style")).toThrow(/Unsupported style/);
  });
});

describe("searchIcons", () => {
  it("finds icons across all styles by query", () => {
    const result = searchIcons("home");

    expect(result.total).toBeGreaterThan(0);
    expect(new Set(result.icons.map((icon) => icon.style))).toEqual(
      new Set(SUPPORTED_STYLES)
    );
  });

  it("applies style filter when searching", () => {
    const result = searchIcons("arrow right", "mini");

    expect(result.total).toBeGreaterThan(0);
    expect(result.styles).toEqual(["mini"]);
    expect(result.icons.every((icon) => icon.style === "mini")).toBe(true);
  });

  it("ranks exact icon name highest in a style", () => {
    const result = searchIcons("x-mark", "micro");

    expect(result.total).toBeGreaterThan(0);
    expect(result.icons[0].name).toBe("x-mark");
    expect(result.icons[0].style).toBe("micro");
  });

  it("returns empty result for unmatched query", () => {
    const result = searchIcons("no-such-heroicon-query");

    expect(result.total).toBe(0);
    expect(result.icons).toEqual([]);
  });
});

describe("retrieveIcon", () => {
  it("returns valid SVG source for a known icon/style", () => {
    const result = retrieveIcon("academic-cap", "outline");

    expect(result.name).toBe("academic-cap");
    expect(result.style).toBe("outline");
    expect(result.svg.trim().startsWith("<svg")).toBe(true);
    expect(result.svg.includes("</svg>")).toBe(true);
  });

  it("normalizes icon name before lookup", () => {
    const result = retrieveIcon(" Academic Cap ", "outline");

    expect(result.name).toBe("academic-cap");
    expect(result.svg.trim().startsWith("<svg")).toBe(true);
  });

  it("throws when icon does not exist for style", () => {
    expect(() => retrieveIcon("not-an-icon", "mini")).toThrow(/not found/i);
  });
});

describe("caching", () => {
  it("caches icon name lookups per style", () => {
    const readdirSpy = vi.spyOn(fs, "readdirSync");

    const first = getIconNamesForStyle("outline");
    const second = getIconNamesForStyle("outline");

    expect(second).toEqual(first);
    expect(readdirSpy).toHaveBeenCalledTimes(1);
  });

  it("caches icon SVG reads per icon file", () => {
    const readFileSpy = vi.spyOn(fs, "readFileSync");

    const first = retrieveIcon("academic-cap", "outline");
    const second = retrieveIcon("academic-cap", "outline");

    expect(second.svg).toBe(first.svg);
    expect(readFileSpy).toHaveBeenCalledTimes(1);
  });
});
