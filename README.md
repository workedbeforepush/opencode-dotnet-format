# opencode-dotnet-format

OpenCode plugin that automatically formats .NET files (C#, F#, VB) using `dotnet format` with smart project/solution resolution.

Based on [PR #16754](https://github.com/anomalyco/opencode/pull/16754) which adds built-in `dotnet-format` support to OpenCode — converted into a local plugin so it can be used today without waiting for the PR to be merged.

## What it does

When OpenCode edits a `.cs`, `.vb`, `.fs`, `.fsi`, `.fsx`, or `.fsscript` file, this plugin:

1. Walks up the directory tree to find the nearest `.slnx`, `.sln`, `.csproj`, `.fsproj`, or `.vbproj`
2. Runs `dotnet format style <project> --include <relative-file> --severity info` from the project root (style includes whitespace formatting)
3. Logs the result via OpenCode's structured logging

> **Note:** The style subcommand may crash on some .NET SDK versions (e.g. IDE0060 analyzer bug in .NET 10). When it does, the plugin logs a warning and moves on.

## Prerequisites

- [OpenCode](https://opencode.ai) installed
- [.NET SDK](https://dotnet.microsoft.com/download) installed and `dotnet` available on PATH

## Installation

Copy `src/index.ts` into your OpenCode plugins directory:

- **Global:** `~/.config/opencode/plugins/dotnet-format.ts`
- **Project-level:** `.opencode/plugins/dotnet-format.ts`

Files in these directories are automatically loaded at startup.

## How it works

```
file.edited event
       |
       v
  Is extension .cs/.vb/.fs/etc?
       |
      yes
       |
       v
  Walk parent directories
  looking for *.slnx / *.sln / *.csproj / *.fsproj / *.vbproj
       |
     found
       |
       v
  dotnet format style <project-file> --include <relative-path> --severity info
        |
        v
   Log success or warning
```

## Comparison to upstream PR

| Aspect             | This plugin                          | PR #16754                    |
| ------------------ | ------------------------------------ | ---------------------------- |
| Installation       | Local plugin file                    | Built into OpenCode core     |
| Hook mechanism     | `event` hook (filters `file.edited`) | Internal formatter pipeline  |
| Project resolution | Same directory-walking logic         | Same directory-walking logic |
