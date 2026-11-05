// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Command } from 'commander';
import { existsSync, readdirSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const RESOURCE_ROOTS = ['scripts', 'references', 'assets', 'examples'] as const;

export interface SkillDocument {
  name: string;
  description: string;
  body: string;
  directory: string;
  location: string;
}

interface SkillFrontmatter {
  name?: unknown;
  description?: unknown;
}

export interface RegisterSkillsCommandOptions {
  skillRoot?: string;
  skillRoots?: readonly string[];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isMissingPath(error: unknown): boolean {
  return error instanceof Error
    && (error as NodeJS.ErrnoException).code === 'ENOENT';
}

function parseFrontmatter(
  source: string,
  location: string,
): { data: SkillFrontmatter; body: string; } {
  const normalizedSource = source.startsWith('\uFEFF')
    ? source.slice(1)
    : source;
  const match = /^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/u.exec(
    normalizedSource,
  );
  if (!match) {
    throw new Error(
      `${location} must start with YAML frontmatter enclosed by --- lines.`,
    );
  }

  const frontmatter = parse(match[1] ?? '') as unknown;
  if (
    frontmatter === null || typeof frontmatter !== 'object'
    || Array.isArray(frontmatter)
  ) {
    throw new Error(`${location} frontmatter must be a YAML mapping.`);
  }

  return {
    data: frontmatter as SkillFrontmatter,
    body: normalizedSource.slice(match[0].length).trim(),
  };
}

function requireMetadataString(
  value: unknown,
  field: 'name' | 'description',
  location: string,
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `${location} frontmatter must define a non-empty ${field}.`,
    );
  }
  return value.trim();
}

export function resolveSkillRoot(moduleUrl?: string): string {
  if (moduleUrl !== undefined) {
    return path.resolve(path.dirname(fileURLToPath(moduleUrl)), '../..');
  }
  // The shared CLI entry is bundled into dist/cli.mjs, unlike the bin's
  // preserved commands/skills.mjs. Self-resolution works in either layout.
  return path.dirname(
    fileURLToPath(import.meta.resolve('agent-lynx/package.json')),
  );
}

export function resolveSkillRootsFromPackageRoot(
  packageRoot: string,
): string[] {
  const skillsDirectory = path.join(path.resolve(packageRoot), 'skills');
  if (!existsSync(skillsDirectory)) return [];

  return readdirSync(skillsDirectory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(skillsDirectory, entry.name))
    .sort();
}

export function resolveBuiltInSkillRoots(
  moduleUrl?: string,
): string[] {
  return resolveSkillRootsFromPackageRoot(resolveSkillRoot(moduleUrl));
}

export async function readSkillDocument(
  skillRoot: string,
): Promise<SkillDocument> {
  const directory = path.resolve(skillRoot);
  const location = path.join(directory, 'SKILL.md');
  const source = await fs.readFile(location, 'utf8');
  const { data, body } = parseFrontmatter(source, location);

  return {
    name: requireMetadataString(data.name, 'name', location),
    description: requireMetadataString(
      data.description,
      'description',
      location,
    ),
    body,
    directory,
    location,
  };
}

export async function readSkillDocuments(
  skillRoots: readonly string[],
): Promise<SkillDocument[]> {
  const skills = await Promise.all(skillRoots.map(readSkillDocument));
  const locationsByName = new Map<string, string>();

  for (const skill of skills) {
    const existingLocation = locationsByName.get(skill.name);
    if (existingLocation) {
      throw new Error(
        `Duplicate skill name "${skill.name}" in ${existingLocation} and ${skill.location}.`,
      );
    }
    locationsByName.set(skill.name, skill.location);
  }

  return skills;
}

async function collectResourceFiles(
  skillRoot: string,
  directory: string,
  resources: Set<string>,
): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectResourceFiles(skillRoot, entryPath, resources);
    } else if (entry.isFile()) {
      resources.add(
        path.relative(skillRoot, entryPath).split(path.sep).join('/'),
      );
    }
  }
}

export async function scanSkillResources(skillRoot: string): Promise<string[]> {
  const directory = path.resolve(skillRoot);
  const resources = new Set<string>();

  for (const root of RESOURCE_ROOTS) {
    const resourceRoot = path.join(directory, root);
    try {
      const stat = await fs.lstat(resourceRoot);
      if (!stat.isDirectory() || stat.isSymbolicLink()) continue;
      await collectResourceFiles(directory, resourceRoot, resources);
    } catch (error) {
      if (!isMissingPath(error)) throw error;
    }
  }

  return [...resources].sort();
}

export function renderAvailableSkills(
  skills: readonly SkillDocument[],
): string {
  const skillEntries = skills.map(skill =>
    `  <skill>
    <name>${skill.name}</name>
    <description>${skill.description}</description>
    <location>${skill.location}</location>
  </skill>`
  ).join('\n');
  return `<available_skills>
${skillEntries}
</available_skills>`;
}

export function renderSkillContent(
  skill: SkillDocument,
  resources: readonly string[],
): string {
  const resourceLines = resources.map(resource => `  <file>${resource}</file>`)
    .join('\n');
  return `<skill_content name="${skill.name}">
${skill.body}

Skill directory: ${skill.directory}
Relative paths in this skill are relative to the skill directory.

<skill_resources>
${resourceLines}
</skill_resources>
</skill_content>`;
}

function selectSkill(
  selector: string,
  skills: readonly SkillDocument[],
): SkillDocument {
  const skill = skills.find(candidate => candidate.name === selector);
  if (skill) return skill;

  throw new Error(
    `Unknown skill "${selector}". Available skills: ${
      skills.map(candidate => candidate.name).join(', ')
    }.`,
  );
}

async function printSkillOutput(render: () => Promise<string>): Promise<void> {
  try {
    console.log(await render());
  } catch (error) {
    console.error(errorMessage(error));
    process.exitCode = 1;
  }
}

export function registerSkillsCommand(
  program: Command,
  options: RegisterSkillsCommandOptions = {},
): void {
  const skillRoots = options.skillRoots
    ?? (options.skillRoot ? [options.skillRoot] : resolveBuiltInSkillRoots());
  const skills = program.command('skills')
    .description(
      'Discover and read the Agent Skills shipped with the agent-lynx CLI',
    );

  skills.command('list')
    .description('List available skills as agent-readable XML')
    .action(async () => {
      await printSkillOutput(async () =>
        renderAvailableSkills(await readSkillDocuments(skillRoots))
      );
    });

  skills.command('get')
    .description('Read a skill and its resources as agent-readable XML')
    .argument('<name>', 'Canonical skill name returned by skills list')
    .action(async (selector: string) => {
      await printSkillOutput(async () => {
        const skill = selectSkill(
          selector,
          await readSkillDocuments(skillRoots),
        );
        return renderSkillContent(
          skill,
          await scanSkillResources(skill.directory),
        );
      });
    });
}
