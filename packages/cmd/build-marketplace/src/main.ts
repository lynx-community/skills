// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { resolve } from "node:path";
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { exportPlugin } from "build-plugin";

async function buildMarketplace(pkgDir: string) {
  const pkgPath = `${pkgDir}/package.json`;

  // Read package.json to get the marketplace name
  const { default: pkg } = await import(`file://${pkgPath}`, {
    with: { type: "json" },
  });

  if (!pkg.name.match(/^@lynx-js\/marketplace-/)){
    throw new Error("Package is not a marketplace. Aborting...");
  }

  const { dependencies = {} } = pkg;

  const plugins: Array<{ name: string; description?: string; source: string }> =
    [];

  // PLUGINS
  for (const dep in dependencies) {
    if (dep.startsWith("@lynx-js/plugin-")) {
      const name = dep.replace(/^@lynx-js\/plugin-/, "");
      const source = resolve(pkgDir, "node_modules", dep);

      await exportPlugin(source, resolve(pkgDir, "plugins", name));

      const pluginMeta = JSON.parse(
        readFileSync(`${source}/package.json`, "utf-8"),
      );

      plugins.push({
        name,
        description: pluginMeta.description,
        source: `./plugins/${name}`,
        // for category or other fields
        ...(pluginMeta.claudePlugin ?? {}),
      });
    }
  }

  // metadata files
  const metadataContent =
    JSON.stringify(
      {
        name: pkg.name.replace(/^@lynx-js\/marketplace-/, ""),
        version: pkg.version,
        description: pkg.description || "A marketplace",
        owner: pkg.author || { name: "lynx" },
        plugins,
      },
      null,
      2,
    ) + "\n"; // add newline at end of file

  // .claude-plugin/marketplace.json
  const claudePluginDir = resolve(pkgDir, ".claude-plugin");
  await mkdir(claudePluginDir, { recursive: true });
  await writeFile(
    resolve(claudePluginDir, "marketplace.json"),
    metadataContent,
  );
}

const program = new Command();

program
  .name("plugin-marketplace")
  .description("A helper script for build your claude plugin marketplace")
  .option("-C, --cwd <cwd>", "Set current working directory", process.cwd());

program.action(async () => {
  const { cwd } = program.opts<{ cwd: string }>();
  const pkgDir = resolve(process.cwd(), cwd);
  await buildMarketplace(pkgDir);
});

program
  .command("export")
  .description("Build and export your claude plugin marketplace")
  .argument("<targetDir>")
  .action(async (targetDir: string, options: { skipBuild: boolean }) => {
    const { cwd } = program.opts<{ cwd: string }>();
    const pkgDir = resolve(process.cwd(), cwd);
    if (!options.skipBuild) {
      await buildMarketplace(pkgDir);
    }
    await exportPlugin(pkgDir, resolve(process.cwd(), targetDir));
  });

await program.parseAsync(process.argv);
