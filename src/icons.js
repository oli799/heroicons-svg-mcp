const fs = require("node:fs");
const path = require("node:path");

const STYLE_TO_SUBDIR = Object.freeze({
  outline: "24/outline",
  solid: "24/solid",
  mini: "20/solid",
  micro: "16/solid",
});

const SUPPORTED_STYLES = Object.freeze(Object.keys(STYLE_TO_SUBDIR));
const STYLE_PRIORITY = Object.freeze({
  outline: 0,
  solid: 1,
  mini: 2,
  micro: 3,
});
const STYLE_TO_DEFAULT_CLASS = Object.freeze({
  outline: "size-6",
  solid: "size-6",
  mini: "size-5",
  micro: "size-4",
});
const iconNamesCache = new Map();
const iconPathCache = new Map();
const iconSvgCache = new Map();

function resolveHeroiconsRoot() {
  const heroiconsPackageJson = require.resolve("heroicons/package.json");
  return path.dirname(heroiconsPackageJson);
}

function assertStyle(style) {
  if (style !== undefined && !SUPPORTED_STYLES.includes(style)) {
    throw new Error(
      `Unsupported style "${style}". Supported styles: ${SUPPORTED_STYLES.join(
        ", "
      )}.`
    );
  }
}

function normalizeIconName(name) {
  return String(name ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function iconNamesCacheKey(style, heroiconsRoot) {
  return `${heroiconsRoot}::${style}`;
}

function iconPathCacheKey(name, style, heroiconsRoot) {
  return `${heroiconsRoot}::${style}::${name}`;
}

function clearIconCaches() {
  iconNamesCache.clear();
  iconPathCache.clear();
  iconSvgCache.clear();
}

function getIconNamesForStyle(style, heroiconsRoot = resolveHeroiconsRoot()) {
  assertStyle(style);

  const namesKey = iconNamesCacheKey(style, heroiconsRoot);
  const cachedNames = iconNamesCache.get(namesKey);
  if (cachedNames) {
    return [...cachedNames];
  }

  const styleSubDir = STYLE_TO_SUBDIR[style];
  const styleDir = path.join(heroiconsRoot, styleSubDir);
  const entries = fs.readdirSync(styleDir, { withFileTypes: true });

  const names = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".svg"))
    .map((entry) => entry.name.slice(0, -4))
    .sort((a, b) => a.localeCompare(b));

  iconNamesCache.set(namesKey, Object.freeze([...names]));
  return names;
}

function resolveIconFilePath(name, style, heroiconsRoot = resolveHeroiconsRoot()) {
  assertStyle(style);

  if (!style) {
    throw new Error("Style is required.");
  }

  const normalizedName = normalizeIconName(name);
  if (!/^[a-z0-9-]+$/.test(normalizedName)) {
    throw new Error(`Invalid icon name "${name}".`);
  }

  const filePathKey = iconPathCacheKey(normalizedName, style, heroiconsRoot);
  const cachedPath = iconPathCache.get(filePathKey);
  if (cachedPath) {
    return {
      iconPath: cachedPath,
      normalizedName,
      style,
    };
  }

  const styleSubDir = STYLE_TO_SUBDIR[style];
  const iconPath = path.join(heroiconsRoot, styleSubDir, `${normalizedName}.svg`);

  if (!fs.existsSync(iconPath)) {
    throw new Error(`Icon "${normalizedName}" not found in style "${style}".`);
  }

  iconPathCache.set(filePathKey, iconPath);

  return {
    iconPath,
    normalizedName,
    style,
  };
}

function listAllIcons(style, heroiconsRoot = resolveHeroiconsRoot()) {
  assertStyle(style);

  const styles = style ? [style] : SUPPORTED_STYLES;
  const iconsByStyle = {};
  const icons = [];

  for (const styleKey of styles) {
    const names = getIconNamesForStyle(styleKey, heroiconsRoot);
    iconsByStyle[styleKey] = names;

    for (const name of names) {
      icons.push({
        name,
        style: styleKey,
      });
    }
  }

  return {
    icons,
    iconsByStyle,
    styles,
    total: icons.length,
  };
}

function formatListAllIconsText(result) {
  const lines = [
    `Found ${result.total} icon variants across ${result.styles.length} style(s).`,
  ];

  for (const style of result.styles) {
    const names = result.iconsByStyle[style];
    lines.push(`${style} (${names.length}): ${names.join(", ")}`);
  }

  return lines.join("\n");
}

function normalizeForSearch(value) {
  return value.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function scoreMatch(iconName, query) {
  const rawName = iconName.toLowerCase();
  const normalizedName = normalizeForSearch(iconName);
  const rawQuery = query.toLowerCase().trim();
  const normalizedQuery = normalizeForSearch(query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  const rawIncludes = rawName.includes(rawQuery);
  const normalizedIncludes = normalizedName.includes(normalizedQuery);
  const allTokensMatch = queryTokens.length > 0
    ? queryTokens.every((token) => normalizedName.includes(token))
    : false;

  if (!rawIncludes && !normalizedIncludes && !allTokensMatch) {
    return null;
  }

  let score = 0;

  if (rawName === rawQuery) {
    score += 120;
  } else if (rawName.startsWith(rawQuery)) {
    score += 100;
  } else if (normalizedIncludes || rawIncludes) {
    score += 80;
  } else if (allTokensMatch) {
    score += 60;
  }

  for (const token of queryTokens) {
    if (rawName.split("-").includes(token)) {
      score += 8;
    } else if (normalizedName.includes(token)) {
      score += 4;
    }
  }

  return score;
}

function searchIcons(query, style, heroiconsRoot = resolveHeroiconsRoot()) {
  assertStyle(style);

  const trimmedQuery = String(query ?? "").trim();
  if (trimmedQuery.length === 0) {
    return {
      icons: [],
      query: trimmedQuery,
      styles: style ? [style] : SUPPORTED_STYLES,
      total: 0,
    };
  }

  const listed = listAllIcons(style, heroiconsRoot);
  const matched = [];

  for (const icon of listed.icons) {
    const score = scoreMatch(icon.name, trimmedQuery);
    if (score === null) {
      continue;
    }

    matched.push({
      name: icon.name,
      style: icon.style,
      score,
    });
  }

  matched.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const styleOrder = STYLE_PRIORITY[a.style] - STYLE_PRIORITY[b.style];
    if (styleOrder !== 0) {
      return styleOrder;
    }

    return a.name.localeCompare(b.name);
  });

  return {
    icons: matched,
    query: trimmedQuery,
    styles: listed.styles,
    total: matched.length,
  };
}

function formatSearchIconsText(result) {
  if (result.total === 0) {
    return `No icons found for "${result.query}".`;
  }

  const lines = [
    `Found ${result.total} matches for "${result.query}" across ${result.styles.length} style(s).`,
  ];

  for (const icon of result.icons) {
    lines.push(`${icon.style}: ${icon.name}`);
  }

  return lines.join("\n");
}

function normalizeWhitespace(value) {
  return value.replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
}

function normalizeChildTagForCopy(tag) {
  const normalized = normalizeWhitespace(tag);
  return normalized.replace(/\s*\/>$/, " />");
}

function normalizeSvgForCopy(rawSvg, style) {
  const defaultClass = STYLE_TO_DEFAULT_CLASS[style] || "size-6";
  const svgMatch = rawSvg.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
  if (!svgMatch) {
    throw new Error("Invalid SVG source: missing <svg> root element.");
  }

  const svgAttrs = normalizeWhitespace(
    svgMatch[1]
      .replace(/\s+aria-hidden="[^"]*"/g, "")
      .replace(/\s+data-slot="[^"]*"/g, "")
  );

  const attrsWithClass = /\bclass="/.test(svgAttrs)
    ? svgAttrs
    : `${svgAttrs} class="${defaultClass}"`;

  const childTags = (svgMatch[2].match(/<[^>]+>/g) || []).map((tag) =>
    normalizeChildTagForCopy(tag)
  );

  const openTag = `<svg ${attrsWithClass}>`;
  if (childTags.length === 0) {
    return `${openTag}\n</svg>`;
  }

  return `${openTag}\n${childTags.map((tag) => `  ${tag}`).join("\n")}\n</svg>`;
}

function retrieveIcon(name, style, heroiconsRoot = resolveHeroiconsRoot()) {
  const { iconPath, normalizedName } = resolveIconFilePath(name, style, heroiconsRoot);
  let svg = iconSvgCache.get(iconPath);
  if (svg === undefined) {
    const rawSvg = fs.readFileSync(iconPath, "utf8");
    svg = normalizeSvgForCopy(rawSvg, style);
    iconSvgCache.set(iconPath, svg);
  }

  return {
    name: normalizedName,
    style,
    svg,
  };
}

module.exports = {
  STYLE_TO_SUBDIR,
  SUPPORTED_STYLES,
  clearIconCaches,
  formatListAllIconsText,
  formatSearchIconsText,
  getIconNamesForStyle,
  listAllIcons,
  normalizeIconName,
  resolveIconFilePath,
  retrieveIcon,
  resolveHeroiconsRoot,
  searchIcons,
};
