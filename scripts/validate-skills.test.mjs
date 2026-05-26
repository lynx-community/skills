// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parse as parseYaml } from 'yaml';

const SKILLS_DIR = new URL('../skills', import.meta.url).pathname;

// Skills that are grandfathered in and exempt from validation.
// Each key is a directory name, each value is the reason for exemption.
// When a skill here is fixed, remove it from this list so future
// regressions will be caught.
const SKIP_LIST = new Map([
  ['habitat-usage', 'name does not start with an allowed prefix'],
]);

const ALLOWED_PREFIXES = ['lynx-', 'reactlynx-', 'ttml-', 'perflab-'];
const ALLOWED_PREFIX_RE = new RegExp(
  `^(${ALLOWED_PREFIXES.map((prefix) =>
    prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  ).join('|')})`,
);
const ALLOWED_PREFIX_LABEL = ALLOWED_PREFIXES.join(' / ');

function getSkillDirs() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function readSkillName(skillDir) {
  const skillMd = join(SKILLS_DIR, skillDir, 'SKILL.md');
  if (!existsSync(skillMd)) return null;
  const content = readFileSync(skillMd, 'utf8');

  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---', 4);
  if (end === -1) return null;

  const frontmatter = parseYaml(content.slice(4, end));
  if (!frontmatter || typeof frontmatter !== 'object') return null;
  if (!('name' in frontmatter)) return null;

  return String(frontmatter.name);
}

describe('skills validation', () => {
  it('skills directory exists', () => {
    assert.ok(
      existsSync(SKILLS_DIR),
      `skills directory not found: ${SKILLS_DIR}`,
    );
  });

  const skills = getSkillDirs();

  if (skills.length === 0) {
    it('should have at least one skill', () => {
      assert.fail('No skill directories found in skills/');
    });
    return;
  }

  for (const skillDir of skills) {
    const skipReason = SKIP_LIST.get(skillDir);
    const describeFn = skipReason ? describe.skip : describe;

    describeFn(skillDir, () => {
      const skillName = readSkillName(skillDir);

      it('has a SKILL.md with a name field', () => {
        assert.ok(
          skillName,
          'SKILL.md is missing or has no name field in frontmatter',
        );
      });

      if (skillName) {
        it('directory name matches name field', () => {
          assert.equal(
            skillDir,
            skillName,
            `Directory "${skillDir}" does not match name "${skillName}"`,
          );
        });

        it(`name starts with an allowed prefix (${ALLOWED_PREFIX_LABEL})`, () => {
          assert.match(
            skillName,
            ALLOWED_PREFIX_RE,
            `"${skillName}" does not start with an allowed prefix`,
          );
        });
      }
    });

    if (skipReason) {
      describe(`${skillDir} (SKIPPED)`, () => {
        it.skip(`reason: ${skipReason}`);
      });
    }
  }

  for (const [skipDir] of SKIP_LIST) {
    it(`SKIP_LIST entry "${skipDir}" is still needed`, () => {
      assert.ok(
        skills.includes(skipDir),
        `"${skipDir}" not found in skills/ — remove from SKIP_LIST`,
      );

      const name = readSkillName(skipDir);
      assert.ok(
        name,
        `"${skipDir}" has no valid name — but should still be checked`,
      );
      if (name) {
        const stillFails = name !== skipDir || !ALLOWED_PREFIX_RE.test(name);
        assert.ok(
          stillFails,
          `"${skipDir}" is now compliant (name="${name}") — remove from SKIP_LIST`,
        );
      }
    });
  }
});
