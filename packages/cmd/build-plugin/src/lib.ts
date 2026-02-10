// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { resolve, dirname } from "node:path";
import { mkdir, writeFile, copyFile, stat } from "node:fs/promises";
import { default as packList } from "npm-packlist";

/**
 * Copy files in a package (defined by package.json `files`)
 * to target dir, should mirror the behavior of `npm pack`
 * @param pkgDir path of dir of the package
 * @param targetDir copy to
 */
export async function copyPackageFiles(
  pkgDir: string,
  targetDir: string,
  skipPackageJSON: boolean = false,
) {
  const files = await packList({ path: pkgDir });

  for (const file of files) {
    if (skipPackageJSON) {
      if (file === "package.json") {
        continue;
      }
    }
    const sourcePath = resolve(pkgDir, file);
    const targetPath = resolve(targetDir, file);
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
  }
}

export async function buildPlugin(pkgDir: string) {
  const pkgPath = `${pkgDir}/package.json`;

  // Read package.json to get the plugin name
  const { default: pkg } = await import(`file://${pkgPath}`, {
    with: { type: "json" },
  });

  if (!pkg.name.match(/^@lynx-js\/plugin-/)) {
    throw new Error("Package is not a plugin. Aborting...");
  }

  const { dependencies = {} } = pkg;

  // SKILLS
  for (const dep in dependencies) {
    const m = dep.match(/^@lynx-js\/skill-([^/]+)/);
    if (m != null) {
      const [, skillName] = m as [string, string];
      const source = resolve(pkgDir, "node_modules", dep);
      const target = resolve(pkgDir, "skills", skillName);
      await copyPackageFiles(source, target, true);
    }
  }

  // metadata files
  const metadataContent =
    JSON.stringify(
      {
        name: pkg.name.replace(/^@lynx-js\/plugin-/, ""),
        version: pkg.version,
        description: pkg.description || "",
      },
      null,
      2,
    ) + "\n"; // add newline at end of file

  // .claude-plugin
  const claudePluginDir = resolve(pkgDir, ".claude-plugin");
  await mkdir(claudePluginDir, { recursive: true });
  await writeFile(resolve(claudePluginDir, "plugin.json"), metadataContent);
}

/**
 * Validates the export target directory.
 * @param sourceDir - The absolute path to the target directory.
 * @param targetDir - The absolute path to the target directory.
 */
export async function validateDirForCopying(
  sourceDir: string,
  targetDir: string,
): Promise<void> {
  if (sourceDir === targetDir) {
    throw new Error(
      "Target directory cannot be the same as the package directory.",
    );
  }

  try {
    const stats = await stat(targetDir);
    if (!stats.isDirectory()) {
      throw new Error(
        `Target path '${targetDir}' exists but is not a directory.`,
      );
    }
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function exportPlugin(pkgDir: string, targetDir: string) {
  await validateDirForCopying(pkgDir, targetDir);
  await copyPackageFiles(pkgDir, targetDir, true);
}
