# heroicons-svg-mcp

An MCP server that provides [Heroicons](https://github.com/tailwindlabs/heroicons) as SVG.

This server lets MCP clients (for example Claude , Cline, or Codex) easily:

- list icons by style,
- search icons by name or keywords,
- retrieve the full SVG source of a specific icon.

## Features

- Uses Heroicons 2.x from the `heroicons` npm package.
- Supported styles:
  - `outline` (24x24)
  - `solid` (24x24)
  - `mini` (20x20)
  - `micro` (16x16)
- Built-in caching for faster performance:
  - icon name cache,
  - icon file path cache,
  - SVG content cache.
- Verbose error messages when input is invalid or an icon cannot be resolved.
- Covered by tests (`vitest`).

## Requirements

- Node.js 18+
- npm

## Running

The server uses stdio MCP transport, so your MCP client should launch it with:

```bash
npx -y heroicons-svg-mcp@latest
```

### Claude Code example

Add this to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "heroicons-svg": {
      "command": "npx",
      "args": ["-y", "heroicons-svg-mcp@latest"]
    }
  }
}
```

### Cursor example

Add this to your Cursor MCP config (for example `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "heroicons-svg": {
      "command": "npx",
      "args": ["-y", "heroicons-svg-mcp@latest"]
    }
  }
}
```

Codex-style TOML example:

```toml
[mcp_servers.heroicons-svg]
command = "npx"
args = ["-y", "heroicons-svg-mcp@latest"]
```

## Available Tools

### `list_icons`

Description: lists all available Heroicons, optionally filtered by style.

Input:

- `style` (optional): `outline | solid | mini | micro`

Example input:

```json
{
  "style": "outline"
}
```

Response:

- `content[0].text`: human-readable text output.
- `structuredContent`:
  - `icons`: `{ name, style }[]`
  - `iconsByStyle`: icon names grouped by style
  - `styles`: included styles
  - `total`: total number of icon variants

### `search_icons`

Description: searches Heroicons by name or keywords, optionally filtered by style.

Input:

- `query` (required): search text
- `style` (optional): `outline | solid | mini | micro`

Example input:

```json
{
  "query": "arrow right",
  "style": "mini"
}
```

Response:

- `content[0].text`: human-readable match list.
- `structuredContent`:
  - `icons`: `{ name, style, score }[]` (ranked matches)
  - `query`: normalized search query
  - `styles`: included styles
  - `total`: total match count

### `retrieve_icon`

Description: retrieves the full SVG source for an icon.

Input:

- `name` (required): icon name (for example `academic-cap`)
- `style` (required): `outline | solid | mini | micro`

Example input:

```json
{
  "name": "academic-cap",
  "style": "outline"
}
```

Response:

- `content[0].text`: full valid SVG markup (`<svg ...>...</svg>`)
- `structuredContent`:
  - `name`
  - `style`
  - `svg` (same SVG source)

## Development

Run tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Project Structure

- `index.js`: MCP server startup and tool registration.
- `src/icons.js`: icon logic, search, retrieve, caching.
- `src/icons.test.mjs`: unit tests.

## Error Handling

Typical error cases:

- unsupported `style` value,
- missing or invalid `name`,
- icon not found in the specified style.

The server returns verbose, actionable errors so MCP clients can surface clear feedback.

Examples:

- `Unsupported style "foo". Supported styles: outline, solid, mini, micro.`
- `Invalid icon name "...".`
- `Icon "academic-cap" not found in style "mini".`

## License

- Project: ISC
- Heroicons: MIT
