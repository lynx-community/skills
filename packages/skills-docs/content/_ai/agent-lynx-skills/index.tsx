// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Minus, Plus } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import data from './data.json';
import styles from './index.module.less';
import { layoutSkills, PORT_PITCH, type SkillCard } from './layout.ts';

const layout = layoutSkills(data);
const labels = {
  en: {
    title: 'agent-lynx CLI and its companion Skills',
    commands: 'commands',
    edges: 'connections',
    provides: 'CLI provides',
    uses: 'Skill declares use',
    routes: 'Routes',
    subcommands: '02 Subcommands',
    entry: 'Command-line entry',
    noCommands: 'No CLI subcommand declared',
    capacity: 'More dependencies → taller, deeper cards',
    router: 'Discover → select a Skill → load on demand',
    reset: 'Reset zoom and selection',
    showAll: 'Show all dependencies',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
  },
  zh: {
    title: 'agent-lynx CLI 与配套 Skills',
    commands: '命令项',
    edges: '连线',
    provides: 'CLI 提供',
    uses: 'Skill 声明使用',
    routes: '路由',
    subcommands: '02 一级 subcommands',
    entry: '命令行入口',
    noCommands: '未声明 CLI 子命令',
    capacity: '高度与厚度随依赖项数增加',
    router: '发现能力 → 选择 Skill → 按需加载 → 跨能力衔接',
    reset: '复位缩放和选择',
    showAll: '显示全部依赖',
    zoomIn: '放大',
    zoomOut: '缩小',
  },
};

type Selection =
  | { kind: 'skill' | 'command'; key: string; }
  | { kind: 'edge'; skill: string; command: string; };
type View = { zoom: number; x: number; y: number; };
const initialView: View = { zoom: 1, x: 0, y: 0 };

function targetSelection(target: EventTarget): Selection | null {
  const node = (target as Element).closest('[data-kind]');
  if (node?.getAttribute('data-kind') === 'edge') {
    return {
      kind: 'edge',
      skill: node.getAttribute('data-skill')!,
      command: node.getAttribute('data-command')!,
    };
  }
  const kind = node?.getAttribute('data-kind');
  return kind === 'skill' || kind === 'command'
    ? { kind, key: node!.getAttribute('data-key')! }
    : null;
}

function clampView(view: View): View {
  return {
    zoom: view.zoom,
    x: Math.max(0, Math.min(layout.width - layout.width / view.zoom, view.x)),
    y: Math.max(0, Math.min(layout.height - layout.height / view.zoom, view.y)),
  };
}

export function AgentLynxSkills({ locale = 'en' }: { locale?: 'en' | 'zh'; }) {
  const copy = labels[locale];
  const prefix = useId().replaceAll(':', '');
  const [selection, select] = useState<Selection | null>(null);
  const [hover, setHover] = useState<Selection | null>(null);
  const [view, setView] = useState(initialView);
  const drag = useRef<
    { x: number; y: number; view: View; moved: boolean; } | null
  >(null);
  const wasDrag = useRef(false);
  const active = selection ?? hover;
  const matches = (edge: { skill: string; command: string; }) =>
    !active || (active.kind === 'skill' && edge.skill === active.key)
    || (active.kind === 'command' && edge.command === active.key)
    || (active.kind === 'edge' && edge.skill === active.skill
      && edge.command === active.command);
  const edges = layout.edges.filter(matches);
  const skills = new Set(edges.map(edge => edge.skill));
  const commands = new Set(edges.map(edge => edge.command));
  if (active?.kind === 'skill') skills.add(active.key);
  if (active?.kind === 'command') commands.add(active.key);
  const nodeClass = (kind: 'skill' | 'command', name: string) =>
    `${styles.node} ${
      !active
        ? ''
        : (kind === 'skill' ? skills : commands).has(name)
        ? styles.active
        : styles.dim
    }`;
  const pressed = (kind: 'skill' | 'command', name: string) =>
    selection?.kind === kind && selection.key === name;
  const skillUrl = (name: string) =>
    `${data.skillBaseUrl}${encodeURIComponent(name)}/SKILL.md`;
  const reset = () => {
    setView(initialView);
    select(null);
    setHover(null);
  };
  const scale = (factor: number) => setView(previous => {
    const zoom = Math.max(1, Math.min(5, previous.zoom * factor));
    return clampView({
      zoom,
      x: previous.x + layout.width / previous.zoom / 2
        - layout.width / zoom / 2,
      y: previous.y + layout.height / previous.zoom / 2
        - layout.height / zoom / 2,
    });
  });
  const markdown =
    (import.meta as ImportMeta & { env: { SSG_MD?: boolean; }; }).env.SSG_MD;
  if (markdown) {
    return (
      <table>
        <thead>
          <tr>
            <th>Skill</th>
            <th>{copy.uses}</th>
          </tr>
        </thead>
        <tbody>
          {data.skills.map(skill => (
            <tr key={skill.name}>
              <td>
                <a href={skillUrl(skill.name)}>{skill.name}</a>
              </td>
              <td>{skill.commands.join(', ') || copy.noCommands}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  function ports(card: SkillCard) {
    return card.commands.map((command, index) => {
      const y = card.y + card.portOffset + index * PORT_PITCH;
      return (
        <g
          key={command}
          className={styles.port}
          data-kind='edge'
          data-skill={card.name}
          data-command={command}
          tabIndex={0}
          role='button'
          aria-label={`${card.name} → ${command}`}
        >
          <circle cx={card.x} cy={y} r={3.3} />
          <text x={card.x + 16} y={y + 5}>{command}</text>
        </g>
      );
    });
  }
  const { router, grid, cli } = layout;
  const routeX = grid.x + grid.width / 2;
  return (
    <figure
      className={styles.figure}
      aria-label={copy.title}
      data-skill-graph={data.edition}
    >
      <div className={styles.toolbar}>
        <div className={styles.counts}>
          <strong>{data.skills.length}</strong> Skills ·{' '}
          <strong>{layout.commands.length}</strong> {copy.commands} ·{' '}
          <strong>{layout.edges.length}</strong> {copy.edges}
        </div>
        <div className={styles.legend}>
          <span>
            <i className={styles.provides} />
            {copy.provides}
          </span>
          <span>
            <i className={styles.uses} />
            {copy.uses}
          </span>
          <span>
            <i className={styles.routes} />
            {copy.routes}
          </span>
        </div>
        <div className={styles.controls}>
          <button
            type='button'
            onClick={() => scale(0.8)}
            aria-label={copy.zoomOut}
            disabled={view.zoom === 1}
          >
            <Minus size={14} />
          </button>
          <button type='button' onClick={reset} aria-label={copy.reset}>
            {Math.round(view.zoom * 100)}%
          </button>
          <button
            type='button'
            onClick={() => scale(1.25)}
            aria-label={copy.zoomIn}
            disabled={view.zoom === 5}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <svg
        className={styles.diagram}
        width={layout.width}
        height={layout.height}
        viewBox={`${view.x} ${view.y} ${layout.width / view.zoom} ${
          layout.height / view.zoom
        }`}
        role='group'
        aria-labelledby={`${prefix}-title`}
        style={{
          cursor: view.zoom > 1 ? 'grab' : undefined,
          touchAction: view.zoom > 1 ? 'none' : 'pan-y',
        }}
        onClick={event => {
          if (wasDrag.current) {
            wasDrag.current = false;
            return;
          }
          select(targetSelection(event.target));
        }}
        onFocus={event => setHover(targetSelection(event.target))}
        onBlur={() => setHover(null)}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            select(null);
            setHover(null);
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            select(targetSelection(event.target));
          }
        }}
        onPointerLeave={() => setHover(null)}
        onPointerDown={event => {
          if (view.zoom > 1 && event.button === 0) {
            drag.current = {
              x: event.clientX,
              y: event.clientY,
              view,
              moved: false,
            };
          }
          wasDrag.current = false;
        }}
        onPointerMove={event => {
          const start = drag.current;
          if (!start) {
            if (event.pointerType !== 'touch') {
              setHover(targetSelection(event.target));
            }
            return;
          }
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) + Math.abs(dy) <= 5 && !start.moved) return;
          start.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          const factor = layout.width / start.view.zoom
            / event.currentTarget.getBoundingClientRect().width;
          setView(
            clampView({
              zoom: start.view.zoom,
              x: start.view.x - dx * factor,
              y: start.view.y - dy * factor,
            }),
          );
        }}
        onPointerUp={() => {
          wasDrag.current = drag.current?.moved ?? false;
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <title id={`${prefix}-title`}>{copy.title}</title>
        <defs>
          <marker
            id={`${prefix}-arrow`}
            markerWidth='10'
            markerHeight='10'
            refX='8'
            refY='5'
            orient='auto'
          >
            <path d='M0,0 L9,5 L0,10' className={styles.arrow} />
          </marker>
        </defs>
        <text x={22} y={80} className={styles.eyebrow}>01 CLI</text>
        <text x={260} y={80} className={styles.eyebrow}>
          {copy.subcommands}
        </text>
        <text x={grid.x} y={80} className={styles.eyebrow}>
          03 {data.catalog[locale]}
        </text>
        <rect
          {...{ x: grid.x, y: grid.y, width: grid.width, height: grid.height }}
          rx={18}
          className={`${styles.boundary} ${
            active?.kind === 'skill' && active.key === router.name
              ? styles.routeBoundary
              : ''
          }`}
        />
        <text x={grid.x + 24} y={grid.y + 32} className={styles.gridCaption}>
          SKILLS / {layout.cards.length}
        </text>
        <text
          x={grid.x + grid.width - 24}
          y={grid.y + 32}
          className={styles.gridCaption}
          textAnchor='end'
        >
          {copy.capacity}
        </text>
        <path
          className={styles.cliLink}
          d={`M ${cli.x + cli.width} ${cli.y + cli.height / 2} H 240 M 240 ${
            layout.commands[0]!.y + 13.5
          } V ${layout.commands.at(-1)!.y + 13.5}`}
        />
        {layout.commands.map(command => (
          <path
            key={command.name}
            className={styles.cliLink}
            d={`M 240 ${command.y + 13.5} H ${command.x}`}
          />
        ))}
        <g>
          {layout.edges.map(edge => (
            <path
              key={`${edge.skill}:${edge.command}`}
              data-skill={edge.skill}
              data-command={edge.command}
              d={edge.path}
              className={`${styles.edge} ${
                active ? matches(edge) ? styles.edgeActive : styles.edgeDim : ''
              }`}
            >
              <title>{edge.skill} → {edge.command}</title>
            </path>
          ))}
        </g>
        <g
          className={styles.cli}
          data-kind='root'
          tabIndex={0}
          role='button'
          aria-label={copy.showAll}
        >
          <rect
            x={cli.x + 5}
            y={cli.y + 6}
            width={cli.width}
            height={cli.height}
            rx={13}
            className={styles.cliShadow}
          />
          <rect {...cli} rx={13} />
          <text x={cli.x + 18} y={cli.y + 43}>$ agent-lynx</text>
          <text x={cli.x + 18} y={cli.y + 75} className={styles.cliSubtitle}>
            {copy.entry}
          </text>
        </g>
        {layout.commands.map(command => (
          <g
            key={command.name}
            className={`${
              nodeClass('command', command.name)
            } ${styles.command}`}
            data-kind='command'
            data-key={command.name}
            tabIndex={0}
            role='button'
            aria-label={`${command.name}: ${command.count} Skills`}
            aria-pressed={pressed('command', command.name)}
          >
            <rect
              x={command.x}
              y={command.y}
              width={command.width}
              height={command.height}
              rx={7}
            />
            <text x={command.x + 12} y={command.y + 19}>{command.name}</text>
            <text
              x={command.x + command.width - 10}
              y={command.y + 19}
              className={styles.commandCount}
              textAnchor='end'
            >
              {command.count}
            </text>
          </g>
        ))}
        {layout.cards.map(card => (
          <g
            key={card.name}
            className={`${nodeClass('skill', card.name)} ${
              card.commands.length ? '' : styles.noCommands
            }`}
            data-kind='skill'
            data-key={card.name}
            tabIndex={0}
            role='button'
            aria-label={`${card.name}: ${card.commands.length} ${copy.commands}`}
            aria-pressed={pressed('skill', card.name)}
          >
            <rect
              x={card.x + card.depth}
              y={card.y + card.depth}
              width={card.width}
              height={card.height}
              rx={10}
              className={styles.depth}
            />
            <rect
              x={card.x}
              y={card.y}
              width={card.width}
              height={card.height}
              rx={10}
              className={styles.face}
            />
            {card.titleLines.map((line, index) => (
              <text
                key={index}
                x={card.x + 16}
                y={card.y + 29 + index * 23}
                className={styles.skillName}
              >
                {line}
              </text>
            ))}
            <text
              x={card.x + 16}
              y={card.y + card.metaOffset}
              className={styles.meta}
            >
              {card.commands.length
                ? `${card.commands.length} ${copy.commands}`
                : copy.noCommands}
            </text>
            {ports(card)}
          </g>
        ))}
        <g
          className={`${nodeClass('skill', router.name)} ${styles.router}`}
          data-kind='skill'
          data-key={router.name}
          tabIndex={0}
          role='button'
          aria-label='agent-lynx routing Skill'
          aria-pressed={pressed('skill', router.name)}
        >
          <rect
            x={router.x + router.depth}
            y={router.y + router.depth}
            width={router.width}
            height={router.height}
            rx={13}
            className={styles.depth}
          />
          <rect
            x={router.x}
            y={router.y}
            width={router.width}
            height={router.height}
            rx={13}
            className={styles.face}
          />
          <text
            x={router.x + 24}
            y={router.y + 38}
            className={styles.routerName}
          >
            agent-lynx
          </text>
          <text
            x={router.x + router.width - 24}
            y={router.y + 38}
            textAnchor='end'
            className={styles.routerKicker}
          >
            ROUTING SKILL
          </text>
          <text
            x={router.x + 24}
            y={router.y + 68}
            className={styles.routerSubtitle}
          >
            {copy.router}
          </text>
          {ports(router)}
        </g>
        <path
          className={styles.route}
          d={`M ${routeX} ${router.y + router.height + 9} V ${grid.y - 5}`}
          markerEnd={`url(#${prefix}-arrow)`}
        />
        <text
          x={routeX + 17}
          y={(router.y + router.height + grid.y) / 2 + 7}
          className={styles.routeLabel}
        >
          {copy.routes}
        </text>
      </svg>
    </figure>
  );
}
