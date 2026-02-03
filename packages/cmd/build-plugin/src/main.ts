import { Command } from "commander";
import { resolve } from "node:path";
import { buildPlugin, exportPlugin } from "./lib.ts";

const program = new Command();

program
  .name("plugin-build")
  .description("A helper script for build and export your claude plugin")
  .option("-C, --cwd <cwd>", "Set current working directory", process.cwd());

program.action(async () => {
  const { cwd } = program.opts<{ cwd: string }>();
  const pkgDir = resolve(process.cwd(), cwd);
  await buildPlugin(pkgDir);
});

program
  .command("export")
  .description("Build and export your claude plugin")
  .option("--skip-build", "Skip the build step")
  .argument("<targetDir>")
  .action(async (targetDir: string, options: { skipBuild: boolean }) => {
    const { cwd } = program.opts<{ cwd: string }>();
    const pkgDir = resolve(process.cwd(), cwd);
    if (!options.skipBuild) {
      await buildPlugin(pkgDir);
    }
    await exportPlugin(pkgDir, resolve(process.cwd(), targetDir));
  });

await program.parseAsync(process.argv);
