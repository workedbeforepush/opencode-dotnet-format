import path from "path";

const DOTNET_EXTENSIONS = new Set([
  ".cs",
  ".vb",
  ".fs",
  ".fsi",
  ".fsx",
  ".fsscript",
]);

const PROJECT_PATTERNS = [
  "*.slnx",
  "*.sln",
  "*.csproj",
  "*.fsproj",
  "*.vbproj",
];

interface ProjectInfo {
  projectFile: string;
  projectDir: string;
  relativeFile: string;
}

async function findNearestProject(
  file: string,
): Promise<ProjectInfo | undefined> {
  let current = path.dirname(file);

  while (true) {
    for (const pattern of PROJECT_PATTERNS) {
      const glob = new Bun.Glob(pattern);
      const matches = Array.from(
        glob.scanSync({ cwd: current, absolute: true }),
      ).sort();

      if (matches[0]) {
        const root = path.dirname(matches[0]);
        const rel = path.relative(root, file);

        // file is outside this project
        if (!rel || rel.startsWith("..")) continue;

        return {
          projectFile: path.basename(matches[0]),
          projectDir: root,
          relativeFile: rel.split(path.sep).join("/"),
        };
      }
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return undefined;
}

function isDotnetAvailable(): boolean {
  try {
    Bun.spawnSync(["dotnet", "--version"], {
      stdout: "ignore",
      stderr: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export const DotnetFormatPlugin = async ({ client, $, directory }) => {
  if (!isDotnetAvailable()) {
    await client.app.log({
      body: {
        service: "opencode-dotnet-format",
        level: "info",
        message: "dotnet CLI not found on PATH — plugin disabled",
      },
    });
    return {};
  }

  await client.app.log({
    body: {
      service: "opencode-dotnet-format",
      level: "info",
      message: "dotnet-format plugin loaded",
    },
  });

  return {
    event: async ({ event }) => {
      if (event.type !== "file.edited") return;

      const file: string =
        (event.properties as any)?.file ??
        (event.properties as any)?.path ??
        "";
      if (!file) return;

      const ext = path.extname(file);
      if (!DOTNET_EXTENSIONS.has(ext)) return;

      const project = await findNearestProject(file);
      if (!project) {
        await client.app.log({
          body: {
            service: "opencode-dotnet-format",
            level: "warn",
            message: `No .NET project/solution found for ${file}`,
          },
        });
        return;
      }

      const command = [
        "dotnet",
        "format",
        "style",
        project.projectFile,
        "--include",
        project.relativeFile,
        "--severity",
        "info",
      ];

      await client.app.log({
        body: {
          service: "opencode-dotnet-format",
          level: "info",
          message: `Formatting: ${command.join(" ")}`,
          extra: { cwd: project.projectDir, file },
        },
      });

      try {
        const proc = Bun.spawn(command, {
          cwd: project.projectDir,
          stdout: "ignore",
          stderr: "pipe",
        });

        const exitCode = await proc.exited;

        if (exitCode !== 0) {
          const stderr = await new Response(proc.stderr).text();
          await client.app.log({
            body: {
              service: "opencode-dotnet-format",
              level: "warn",
              message: `dotnet format exited with code ${exitCode}`,
              extra: { stderr, command: command.join(" ") },
            },
          });
        }
      } catch (err) {
        await client.app.log({
          body: {
            service: "opencode-dotnet-format",
            level: "warn",
            message: `dotnet format failed: ${err}`,
          },
        });
      }
    },
  };
};
