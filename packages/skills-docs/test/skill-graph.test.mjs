// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  layoutSkills,
  PORT_PITCH,
} from '../content/_ai/agent-lynx-skills/layout.ts';

const catalog = JSON.parse(
  readFileSync(
    new URL('../content/_ai/agent-lynx-skills/data.json', import.meta.url),
    'utf8',
  ),
);

test('the public graph retains unconnected Skills and the routing entry', () => {
  const graph = layoutSkills(catalog);
  assert.equal(catalog.edition, 'public');
  assert.equal(new URL(catalog.skillBaseUrl).hostname, 'github.com');
  assert.deepEqual(graph.router.commands, ['skills']);
  assert.ok(
    graph.cards.some(card =>
      card.name === 'lynx-check-css-support' && card.commands.length === 0
    ),
  );
  // The diagram intentionally anticipates this Skill's planned CLI migration.
  assert.deepEqual(
    graph.cards.find(card => card.name === 'lynx-trace-record').commands,
    ['trace'],
  );
});

test('cards and dependency ports stay inside the grid when a catalog changes', () => {
  const graph = layoutSkills(catalog);
  for (const card of graph.cards) {
    assert.ok(card.x >= graph.grid.x);
    assert.ok(
      card.x + card.width + card.depth <= graph.grid.x + graph.grid.width,
    );
    assert.ok(
      card.y + card.height + card.depth <= graph.grid.y + graph.grid.height,
    );
    if (card.commands.length) {
      assert.ok(
        card.portOffset + (card.commands.length - 1) * PORT_PITCH < card.height,
      );
    }
    for (const other of graph.cards) {
      if (other === card || other.x !== card.x || other.y < card.y) continue;
      assert.ok(other.y > card.y + card.height + card.depth);
    }
  }
  const most = graph.cards[0];
  const empty = graph.cards.find(card => card.commands.length === 0);
  assert.ok(most.height > empty.height);
  assert.ok(most.depth > empty.depth);
});

test('cross-column curves retain port order beyond a short lane cycle', () => {
  const commands = Array.from({ length: 24 }, (_, i) => `command-${i}`);
  const fixture = {
    ...catalog,
    commands,
    skills: [
      { name: 'agent-lynx', commands: [commands[0]] },
      { name: 'first', commands },
      { name: 'second', commands: commands.toReversed() },
      { name: 'third', commands },
    ],
  };
  const graph = layoutSkills(fixture);
  for (const card of graph.cards.slice(1)) {
    const paths = graph.edges.filter(edge => edge.skill === card.name);
    assert.deepEqual(paths.map(edge => edge.command), commands);
    let previousY = -Infinity;
    for (const edge of paths) {
      const curve = edge.path.match(
        /^M [\d.]+ ([\d.]+) C [\d.]+ [\d.]+, [\d.]+ ([\d.]+), ([\d.]+) ([\d.]+)/,
      );
      assert.ok(curve, edge.path);
      assert.equal(
        curve[2],
        curve[4],
        'the fan joins the horizontal lane tangentially',
      );
      assert.ok(
        Number(curve[4]) > previousY,
        'lane order must not wrap or reverse',
      );
      previousY = Number(curve[4]);
      assert.match(
        edge.path,
        / Q .* V .* Q /,
        'both right-angle bends stay rounded',
      );
    }
  }
});

test('invalid catalog references fail instead of producing broken SVG paths', () => {
  assert.throws(
    () => layoutSkills({ ...catalog, commands: [] }),
    /Invalid command/,
  );
  assert.throws(
    () =>
      layoutSkills({
        ...catalog,
        skills: [...catalog.skills, catalog.skills[0]],
      }),
    /Duplicate Skill/,
  );
});
