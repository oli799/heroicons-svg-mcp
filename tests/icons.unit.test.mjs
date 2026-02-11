import { createRequire } from "node:module";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  clearIconCaches,
  SUPPORTED_STYLES,
  formatListAllIconsText,
  formatSearchIconsText,
  getIconNamesForStyle,
  listAllIcons,
  resolveIconFilePath,
  retrieveIcon,
  searchIcons,
} = require("../src/icons.js");

const EXPECTED_CHAT_BUBBLE_LEFT_RIGHT_BY_STYLE = Object.freeze({
  outline: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
</svg>`,
  solid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
  <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
  <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
</svg>`,
  mini: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
  <path d="M3.505 2.365A41.369 41.369 0 0 1 9 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 0 0-.577-.069 43.141 43.141 0 0 0-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 0 1 5 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914Z" />
  <path d="M14 6c-.762 0-1.52.02-2.271.062C10.157 6.148 9 7.472 9 8.998v2.24c0 1.519 1.147 2.839 2.71 2.935.214.013.428.024.642.034.2.009.385.09.518.224l2.35 2.35a.75.75 0 0 0 1.28-.531v-2.07c1.453-.195 2.5-1.463 2.5-2.915V8.998c0-1.526-1.157-2.85-2.729-2.936A41.645 41.645 0 0 0 14 6Z" />
</svg>`,
  micro: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4">
  <path d="M1 8.849c0 1 .738 1.851 1.734 1.947L3 10.82v2.429a.75.75 0 0 0 1.28.53l1.82-1.82A3.484 3.484 0 0 1 5.5 10V9A3.5 3.5 0 0 1 9 5.5h4V4.151c0-1-.739-1.851-1.734-1.947a44.539 44.539 0 0 0-8.532 0C1.738 2.3 1 3.151 1 4.151V8.85Z" />
  <path d="M7 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.25v1.25a.75.75 0 0 1-1.28.53L9.69 12H9a2 2 0 0 1-2-2V9Z" />
</svg>`,
});

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

  it("returns empty result for empty query input", () => {
    const result = searchIcons("   ");

    expect(result.total).toBe(0);
    expect(result.icons).toEqual([]);
    expect(result.styles).toEqual(SUPPORTED_STYLES);
  });

  it("supports token-based matching even when full normalized query does not match", () => {
    const result = searchIcons("acad cap", "outline");
    const academicCap = result.icons.find((icon) => icon.name === "academic-cap");

    expect(academicCap).toBeDefined();
    expect(academicCap.score).toBeGreaterThanOrEqual(72);
  });

  it("scores normalized phrase matches and prefix matches", () => {
    const normalized = searchIcons("academic cap", "outline");
    const prefix = searchIcons("academ", "outline");

    const normalizedMatch = normalized.icons.find((icon) => icon.name === "academic-cap");
    const prefixMatch = prefix.icons.find((icon) => icon.name === "academic-cap");

    expect(normalizedMatch).toBeDefined();
    expect(normalizedMatch.score).toBeGreaterThanOrEqual(80);
    expect(prefixMatch).toBeDefined();
    expect(prefixMatch.score).toBeGreaterThanOrEqual(100);
  });
});

describe("retrieveIcon", () => {
  it("returns valid SVG source for a known icon/style", () => {
    const result = retrieveIcon("academic-cap", "outline");

    expect(result.name).toBe("academic-cap");
    expect(result.style).toBe("outline");
    expect(result.svg.trim().startsWith("<svg")).toBe(true);
    expect(result.svg.includes("</svg>")).toBe(true);
    expect(result.svg).toContain('class="size-6"');
    expect(result.svg).not.toContain("aria-hidden=");
    expect(result.svg).not.toContain("data-slot=");
  });

  it("normalizes icon name before lookup", () => {
    const result = retrieveIcon(" Academic Cap ", "outline");

    expect(result.name).toBe("academic-cap");
    expect(result.svg.trim().startsWith("<svg")).toBe(true);
  });

  it("throws when icon does not exist for style", () => {
    expect(() => retrieveIcon("not-an-icon", "mini")).toThrow(/not found/i);
  });

  it("returns exact copy-style SVG for chat-bubble-left-right in all styles", () => {
    for (const style of SUPPORTED_STYLES) {
      const result = retrieveIcon("chat-bubble-left-right", style);
      expect(result.svg).toBe(EXPECTED_CHAT_BUBBLE_LEFT_RIGHT_BY_STYLE[style]);
    }
  });

  it("returns canonical copy-style formatting for requested icons", () => {
    const samples = [
      { name: "academic-cap", style: "outline", className: "size-6" },
      { name: "academic-cap", style: "solid", className: "size-6" },
      { name: "academic-cap", style: "mini", className: "size-5" },
      { name: "academic-cap", style: "micro", className: "size-4" },
    ];

    for (const sample of samples) {
      const result = retrieveIcon(sample.name, sample.style);
      const lines = result.svg.split("\n");

      expect(lines[0]).toContain(`<svg `);
      expect(lines[0]).toContain(`class="${sample.className}"`);
      expect(lines[lines.length - 1]).toBe("</svg>");
      expect(result.svg).not.toContain("aria-hidden=");
      expect(result.svg).not.toContain("data-slot=");
      expect(result.svg).toMatch(/\n  <path .* \/>/);
    }
  });

  it("throws a verbose error when source is not a valid svg root", () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue("<g></g>");

    expect(() => retrieveIcon("academic-cap", "outline")).toThrow(
      /Invalid SVG source: missing <svg> root element/
    );
  });

  it("formats empty svg bodies to canonical copy format", () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-slot="icon"></svg>'
    );

    const result = retrieveIcon("academic-cap", "outline");

    expect(result.svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" class="size-6">\n</svg>'
    );
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

  it("caches icon file path resolution for the same normalized icon name", () => {
    const existsSpy = vi.spyOn(fs, "existsSync");

    const first = resolveIconFilePath("Academic Cap", "outline");
    const second = resolveIconFilePath("academic-cap", "outline");

    expect(second.iconPath).toBe(first.iconPath);
    expect(existsSpy).toHaveBeenCalledTimes(1);
  });
});

describe("formatters", () => {
  it("formats list_icons text output", () => {
    const result = listAllIcons("outline");
    const text = formatListAllIconsText(result);

    expect(text).toContain("Found");
    expect(text).toContain("outline (");
  });

  it("formats search_icons text output for empty and non-empty results", () => {
    const emptyText = formatSearchIconsText({
      icons: [],
      query: "missing",
      styles: ["outline"],
      total: 0,
    });
    const nonEmpty = searchIcons("academic-cap", "outline");
    const nonEmptyText = formatSearchIconsText(nonEmpty);

    expect(emptyText).toBe('No icons found for "missing".');
    expect(nonEmptyText).toContain('Found');
    expect(nonEmptyText).toContain('outline: academic-cap');
  });
});

describe("resolveIconFilePath", () => {
  it("throws when style is missing", () => {
    expect(() => resolveIconFilePath("academic-cap")).toThrow(/Style is required/);
  });

  it("throws for invalid icon names", () => {
    expect(() => resolveIconFilePath("acad../cap", "outline")).toThrow(
      /Invalid icon name/
    );
  });
});
