# @workedbeforepush/opencode-dotnet-format

[OpenCode](https://opencode.ai) plugin that automatically formats .NET files (C#, F#, VB) using `dotnet format` whenever OpenCode edits them.

## Features

- Automatically runs `dotnet format style --severity info` on every edited .NET file
- Walks up the directory tree to find the nearest solution or project file (`.slnx`, `.sln`, `.csproj`, `.fsproj`, `.vbproj`)
- Scopes formatting to the edited file only using `--include`, so it runs fast
- Supports all .NET file types: `.cs`, `.vb`, `.fs`, `.fsi`, `.fsx`, `.fsscript`
- Gracefully disables itself when `dotnet` is not available on PATH

## Prerequisites

- [OpenCode](https://opencode.ai)
- [.NET SDK](https://dotnet.microsoft.com/download) installed with `dotnet` on your PATH
- An `.editorconfig` in your project for formatting rules (recommended)

## Installation

### From npm (recommended)

Add the plugin to your OpenCode config file:

**Global** (`~/.config/opencode/opencode.json`):

```json
{
  "plugin": ["@workedbeforepush/opencode-dotnet-format"]
}
```

**Project-level** (`opencode.json`):

```json
{
  "plugin": ["@workedbeforepush/opencode-dotnet-format"]
}
```

OpenCode installs npm plugins automatically at startup.

### From local file

Copy `src/index.ts` to one of the plugin directories:

- **Global:** `~/.config/opencode/plugins/dotnet-format.ts`
- **Project-level:** `.opencode/plugins/dotnet-format.ts`

Files placed in these directories are loaded automatically at startup.

## How it works

```
file.edited event fires
        |
        v
Is the file extension .cs / .vb / .fs / .fsi / .fsx / .fsscript?
        |
       yes
        |
        v
Walk parent directories for *.slnx / *.sln / *.csproj / *.fsproj / *.vbproj
        |
      found
        |
        v
dotnet format style <project-file> --include <relative-path> --severity info
        |
        v
Log result (success or warning)
```

1. OpenCode fires a `file.edited` event whenever a file is written.
2. The plugin checks if the file has a .NET extension.
3. Starting from the file's directory, it walks up the tree looking for the nearest project or solution file in priority order: `.slnx` > `.sln` > `.csproj` > `.fsproj` > `.vbproj`.
4. It runs `dotnet format style` scoped to that single file using `--include`.
5. Formatting rules come from your `.editorconfig` — the plugin does not impose any rules of its own.

## Configuration

This plugin has no configuration options. It uses whatever rules your `.editorconfig` and analyzer settings define.

To control which style rules apply and at what severity, configure them in your `.editorconfig`:

```ini
[*.cs]
# Enforce var usage
csharp_style_var_for_built_in_types = true:suggestion
csharp_style_var_when_type_is_apparent = true:suggestion

# Namespace declarations
csharp_style_namespace_declarations = file_scoped:warning

# Using directives
dotnet_sort_system_directives_first = true
```

See the [.NET code style rule options](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/code-style-rule-options) documentation for all available settings.

## Troubleshooting

Enable debug logging to see plugin output:

```bash
opencode --log-level DEBUG
```

Look for log lines with service `opencode-dotnet-format`:

```
opencode-dotnet-format  info  dotnet-format plugin loaded
opencode-dotnet-format  info  Formatting: dotnet format style MyProject.sln --include src/MyFile.cs --severity info
```

If the plugin does not load:

- Verify `dotnet --version` works in your terminal
- Check that the plugin is listed in your config or placed in the plugins directory
- Ensure you are running OpenCode v1.4.0 or later

## Development

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Build
bun run build
```

## License

MIT
