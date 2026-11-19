// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface SkillCatalog {
  edition: string;
  catalog: { en: string; zh: string; };
  skillBaseUrl: string;
  commands: string[];
  skills: { name: string; commands: string[]; }[];
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SkillCard extends Box {
  name: string;
  commands: string[];
  titleLines: string[];
  depth: number;
  metaOffset: number;
  portOffset: number;
}

export interface Dependency {
  skill: string;
  command: string;
  path: string;
}

export interface SkillLayout {
  width: number;
  height: number;
  cli: Box;
  grid: Box;
  router: SkillCard;
  cards: SkillCard[];
  commands: (Box & { name: string; count: number; })[];
  edges: Dependency[];
}

// A stable diagram coordinate system; only the data controls card sizes and positions.
const WIDTH = 1440;
const GRID_X = 590;
const GRID_WIDTH = 820;
const CARD_WIDTH = 242;
const COLUMN_GAP = 29;
export const PORT_PITCH = 21;

function wrapName(name: string): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of name.split('-')) {
    const next = line ? `${line}-${word}` : word;
    if (next.length > 17 && line) {
      lines.push(`${line}-`);
      line = word;
    } else line = next;
  }
  lines.push(line);
  return lines;
}

export function layoutSkills(data: SkillCatalog): SkillLayout {
  const commands = new Set(data.commands);
  const names = new Set(data.skills.map(skill => skill.name));
  if (
    commands.size !== data.commands.length || names.size !== data.skills.length
  ) {
    throw new Error('Duplicate Skill or command in the diagram catalog');
  }
  for (const skill of data.skills) {
    if (
      new Set(skill.commands).size !== skill.commands.length
      || skill.commands.some(command => !commands.has(command))
    ) {
      throw new Error(`Invalid command dependencies for ${skill.name}`);
    }
  }
  const routerSource = data.skills.find(skill => skill.name === 'agent-lynx');
  if (!routerSource) {
    throw new Error('The catalog needs the agent-lynx routing Skill');
  }
  const ordered = (skill: typeof routerSource) =>
    data.commands.filter(command => skill.commands.includes(command));
  const router: SkillCard = {
    name: routerSource.name,
    commands: ordered(routerSource),
    x: GRID_X,
    y: 115,
    width: GRID_WIDTH,
    height: 122 + Math.max(0, routerSource.commands.length - 1) * PORT_PITCH,
    depth: 8,
    titleLines: ['agent-lynx'],
    metaOffset: 68,
    portOffset: 101,
  };
  const gridY = router.y + router.height + 80;
  const bottoms = [gridY + 60, gridY + 60, gridY + 60];
  const cards = data.skills.filter(skill => skill.name !== router.name)
    .sort((a, b) =>
      b.commands.length - a.commands.length || a.name.localeCompare(b.name)
    )
    .map(skill => {
      const column = bottoms.indexOf(Math.min(...bottoms));
      const titleLines = wrapName(skill.name);
      const metaOffset = 50 + (titleLines.length - 1) * 23;
      const card: SkillCard = {
        name: skill.name,
        commands: ordered(skill),
        x: GRID_X + 24 + column * (CARD_WIDTH + COLUMN_GAP),
        y: bottoms[column]!,
        width: CARD_WIDTH,
        height: metaOffset + 19 + PORT_PITCH * skill.commands.length,
        depth: Math.round((4 + Math.min(16, skill.commands.length * 0.42)) * 10)
          / 10,
        titleLines,
        metaOffset,
        portOffset: metaOffset + 14,
      };
      bottoms[column] = card.y + card.height + card.depth + 24;
      return card;
    });
  const grid = {
    x: GRID_X,
    y: gridY,
    width: GRID_WIDTH,
    height: Math.max(...bottoms) + 4 - gridY,
  };
  const commandBoxes = data.commands.map((name, index) => ({
    name,
    x: 260,
    y: gridY + 43 + index * 36,
    width: 258,
    height: 27,
    count: data.skills.filter(skill => skill.commands.includes(name)).length,
  }));
  const commandBottom = gridY + 43 + Math.max(0, commandBoxes.length - 1) * 36
    + 30;
  const commandByName = new Map(
    commandBoxes.map(command => [command.name, command]),
  );
  const edges = [router, ...cards].flatMap(card =>
    card.commands.map((command, index) => {
      const start = commandByName.get(command)!;
      const sx = start.x + start.width;
      const sy = start.y + start.height / 2;
      const ex = card.x;
      const ey = card.y + card.portOffset + index * PORT_PITCH;
      let path: string;
      if (card === router) {
        const lane = 544 + index * 13;
        path = `M ${sx} ${sy} C ${lane} ${sy}, ${lane - 10} ${ey}, ${ex} ${ey}`;
      } else if (card.x === GRID_X + 24) {
        path = `M ${sx} ${sy} C 550 ${sy}, 566 ${ey}, ${ex} ${ey}`;
      } else {
        // Ordered lanes and common control points preserve the accepted curve fan.
        // Never wrap the lane index: that reverses paths and adds crossings at bends.
        const offset = index - (card.commands.length - 1) / 2;
        const corridor = ex - 19 - offset;
        const midY = Math.round((card.y - 16.6 + offset * 1.2) * 100) / 100;
        const radius = Math.min(8, (ex - corridor) / 2, (ey - midY) / 2);
        path =
          `M ${sx} ${sy} C ${sx + 31} ${sy}, ${sx + 36} ${midY}, ${
            GRID_X - 4
          } ${midY}`
          + ` H ${corridor - radius} Q ${corridor} ${midY}, ${corridor} ${
            midY + radius
          }`
          + ` V ${ey - radius} Q ${corridor} ${ey}, ${
            corridor + radius
          } ${ey} H ${ex}`;
      }
      return { skill: card.name, command, path };
    })
  );
  return {
    width: WIDTH,
    height: Math.ceil(Math.max(grid.y + grid.height, commandBottom) + 42),
    cli: {
      x: 22,
      y: (gridY + 43 + commandBottom) / 2 - 54,
      width: 204,
      height: 108,
    },
    grid,
    router,
    cards,
    commands: commandBoxes,
    edges,
  };
}
