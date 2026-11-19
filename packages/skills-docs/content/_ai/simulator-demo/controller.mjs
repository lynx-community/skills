// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function initialize(container, config, locale) {
  const lifetime = new AbortController();
  const objectURLs = new Set();
  const on = (target, event, listener, options = {}) =>
    target.addEventListener(event, listener, {
      ...options,
      signal: lifetime.signal,
    });
  const root = container.querySelector('#simulator-demo');
  const workspace = root.querySelector('.workspace');
  const paths = root.querySelector('#connection-paths');
  const current = { step: config.defaultStep, focus: null };
  const english = locale === 'en' && Boolean(config.english);
  const text = (zh, en) => english ? en : zh;
  const stepCount = config.steps.length;
  const info = Object.fromEntries(
    config.steps.map((
      step,
      i,
    ) => [i + 1, [
      english ? config.english.titles[i] : step.title,
      step.index,
    ]]),
  );
  const kind = () => config.steps[current.step - 1].kind;
  const peek = config.peek;
  const snapshotLines = config.snapshot.snapshotLines;
  let animation = 0;
  container.lang = english ? 'en' : 'zh-CN';
  for (const [key, value] of Object.entries(config.layout)) {
    root.style.setProperty(key, value);
  }
  config.steps.forEach((step, i) => {
    const number = String(i + 1);
    const row = container.querySelector('#step-template').content
      .firstElementChild.cloneNode(true);
    row.dataset.exchange = number;
    row.classList.toggle('inspect-exchange', step.kind === 'env');
    const prose = row.querySelector('.assistant-prose');
    if (step.prose === null) prose.remove();
    else prose.innerHTML = step.prose;
    row.querySelector('.call').dataset.step = number;
    const button = row.querySelector('.call-select');
    button.dataset.selectStep = number;
    button.setAttribute('aria-controls', 'call-body-' + number);
    const icon = container.querySelector('#step-icon-' + step.icon).content
      .cloneNode(true);
    row.querySelector('.step-icon').replaceWith(icon);
    const label = row.querySelector('.command-label');
    label.innerHTML = step.label;
    label.classList.toggle('natural-label', step.naturalLabel);
    const body = row.querySelector('.call-content');
    body.id = 'call-body-' + number;
    body.innerHTML = step.content;
    root.querySelector('.exchanges').append(row);
    root.querySelector('[data-scene-kind="' + step.kind + '"]').dataset.scene =
      number;
  });
  for (const [selector, html] of Object.entries(config.html)) {
    root.querySelector(selector).innerHTML = html;
  }
  for (const [selector, attributes] of Object.entries(config.attributes)) {
    for (const [key, value] of Object.entries(attributes)) {
      root.querySelector(selector).setAttribute(key, value);
    }
  }
  if (english) {
    for (const patch of config.english.patches) {
      const node = root.querySelector(patch.selector);
      if (patch.text !== undefined) node.textContent = patch.text;
      if (patch.html !== undefined) node.innerHTML = patch.html;
      if (patch.firstText !== undefined) {
        node.firstChild.textContent = patch.firstText;
      }
      if (patch.lastText !== undefined) {
        node.lastChild.textContent = patch.lastText;
      }
      for (const [key, value] of Object.entries(patch.attributes ?? {})) {
        node.setAttribute(key, value);
      }
    }
  }
  const snapshotElement = root.querySelector('#snapshot');
  const snapshotScroller = root.querySelector('#snapshot-scroll');
  const snapshotToggle = root.querySelector('#toggle-snapshot');
  const snapshotNote = root.querySelector('#snapshot-note');
  const snapshotStructure = new Map();
  const ancestors = [];
  const excerptRefs = new Set(config.snapshot.excerptRefs);
  const snapshotTargets = new Map(config.snapshot.snapshotTargets);
  const displayedStructure = new Map();
  let fullSnapshot = false;
  function makeSvg(tag, attributes) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) =>
      e.setAttribute(key, value)
    );
    return e;
  }
  const treeSvg = makeSvg('svg', {
    class: 'tree-lines',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  snapshotLines.forEach((line) => {
    const match = /@e\d+/.exec(line);
    if (!match) return;
    const ref = match[0],
      depth = match.index / 3;
    snapshotStructure.set(ref, {
      depth,
      parent: ancestors[depth - 1],
      line,
      offset: match.index,
    });
    ancestors[depth] = ref;
    ancestors.length = depth + 1;
  });
  function renderSnapshot() {
    snapshotElement.replaceChildren(treeSvg);
    displayedStructure.clear();
    const entries = [...snapshotStructure].filter(
      ([ref]) => fullSnapshot || excerptRefs.has(ref),
    );
    for (const [ref, node] of entries) {
      let parent = node.parent;
      while (parent && !displayedStructure.has(parent)) {
        parent = snapshotStructure.get(parent).parent;
      }
      const depth = parent ? displayedStructure.get(parent).depth + 1 : 0;
      displayedStructure.set(ref, { depth, parent });
      if (!fullSnapshot && node.parent && parent !== node.parent) {
        const omission = document.createElement('div');
        omission.className = 'snapshot-row omission';
        omission.textContent = '…';
        omission.style.paddingInlineStart =
          `calc(${depth} * var(--tree-indent) + 3px)`;
        omission.setAttribute(
          'aria-label',
          text('省略中间容器', 'Intermediate containers omitted'),
        );
        snapshotElement.append(omission);
      }
      const row = document.createElement('div');
      row.className = 'snapshot-row';
      row.dataset.nodeRef = ref;
      row.style.setProperty('--depth', depth);
      const branch = document.createElement('span');
      branch.className = 'tree-branch';
      branch.textContent = node.line.slice(0, node.offset);
      branch.setAttribute('aria-hidden', 'true');
      const key = snapshotTargets.get(ref);
      const token = document.createElement(
        key && key !== 'snapshot' ? 'button' : 'span',
      );
      token.className = 'ref-token';
      token.textContent = ref;
      if (key) token.dataset.target = key;
      if (key && key !== 'snapshot') {
        token.type = 'button';
        token.classList.add('is-target');
        token.setAttribute(
          'aria-label',
          ref + node.line.slice(node.offset + ref.length),
        );
        on(token, 'mouseenter', () => focus(key));
        on(token, 'mouseleave', () => focus(null));
        on(token, 'focus', () => focus(key));
        on(token, 'blur', () => focus(null));
        on(token, 'click', () => focus(key));
      }
      row.append(
        branch,
        token,
        document.createTextNode(
          node.line.slice(node.offset + ref.length),
        ),
      );
      snapshotElement.append(row);
    }
    if (!fullSnapshot) {
      const tail = document.createElement('div');
      tail.className = 'snapshot-row omission';
      tail.textContent = '…';
      tail.style.paddingInlineStart = 'calc(3 * var(--tree-indent) + 3px)';
      snapshotElement.append(tail);
    }
    snapshotNote.textContent = (fullSnapshot
      ? text('完整快照', 'Full snapshot')
      : text('快照节选', 'Snapshot excerpt'))
      + ' · '
      + snapshotStructure.size
      + text(' 个引用', ' refs');
    snapshotToggle.textContent = fullSnapshot
      ? text('返回节选', 'Show excerpt')
      : text('查看完整快照', 'Show full snapshot');
    snapshotToggle.setAttribute('aria-expanded', String(fullSnapshot));
    snapshotScroller.scrollTop = 0;
    snapshotScroller.scrollLeft = 0;
    queue();
  }
  function drawSnapshotTree() {
    if (kind() !== 'snapshot') return;
    const bounds = snapshotElement.getBoundingClientRect();
    if (!bounds.width) return;
    treeSvg.setAttribute(
      'viewBox',
      `0 0 ${bounds.width} ${bounds.height}`,
    );
    const rows = new Map(
      [...snapshotElement.querySelectorAll('[data-node-ref]')].map(
        (row) => [row.dataset.nodeRef, row],
      ),
    );
    const branches = new Map();
    rows.forEach((row, ref) => {
      const parent = displayedStructure.get(ref).parent;
      if (!parent || !rows.has(parent)) return;
      const branch = row
          .querySelector('.tree-branch')
          .getBoundingClientRect(),
        rect = row.getBoundingClientRect();
      if (!branches.has(parent)) branches.set(parent, []);
      branches.get(parent).push({
        x: branch.right - bounds.left,
        y: rect.top - bounds.top + rect.height / 2,
      });
    });
    treeSvg.replaceChildren();
    branches.forEach((children, parent) => {
      const rail = children[0].x - 8,
        top = rows.get(parent).getBoundingClientRect().bottom
          - bounds.top
          - 0.5,
        last = children.at(-1);
      const d =
        `M ${rail} ${top} V ${last.y - 4} Q ${rail} ${last.y} ${
          rail + 4
        } ${last.y} H ${last.x - 3}`
        + children
          .slice(0, -1)
          .map((p) => ` M ${rail} ${p.y} H ${p.x - 3}`)
          .join('');
      treeSvg.append(makeSvg('path', { d, 'data-parent-ref': parent }));
    });
  }
  on(snapshotToggle, 'click', () => {
    fullSnapshot = !fullSnapshot;
    current.focus = null;
    renderSnapshot();
  });
  on(snapshotScroller, 'scroll', queue, { passive: true });

  const source = (k) =>
    [...root.querySelectorAll('[data-link]')].find(
      (e) => e.dataset.link === k && e.getClientRects().length,
    );
  const target = (k) =>
    [...root.querySelectorAll('[data-target]')].find(
      (e) => e.dataset.target === k && e.getClientRects().length,
    );
  function pairs() {
    if (kind() === 'run') return [['runtime', 'runtime']];
    if (kind() === 'prepare') {
      const map = {
        dependency: 'request',
        request: 'request',
        business: 'business',
        env: 'env',
      };
      return current.focus && map[current.focus]
        ? [
          [current.focus, map[current.focus]],
          ...(current.focus === 'env'
            ? [['request', 'request']]
            : [['env', 'env']]),
        ]
        : [
          ['request', 'request'],
          ['env', 'env'],
        ];
    }
    if (kind() === 'env') {
      return config.steps[current.step - 1].connections;
    }
    if (kind() === 'open') {
      return [
        [
          current.focus === 'open' ? 'open' : 'score',
          current.focus === 'open' ? 'open' : 'score',
        ],
        ['progress', 'progress'],
      ];
    }
    return [
      [
        current.focus === 'snapshot' ? 'snapshot' : 'node-score',
        current.focus === 'snapshot' ? 'snapshot' : 'node-score',
      ],
      ['node-progress', 'node-progress'],
    ];
  }
  function draw() {
    animation = 0;
    paths.replaceChildren();
    drawSnapshotTree();
    root
      .querySelectorAll('.linked,.focused')
      .forEach((e) => e.classList.remove('linked', 'focused'));
    const box = workspace.getBoundingClientRect();
    const stacked = container.clientWidth <= 680;
    for (const [from, to] of pairs()) {
      const a = source(from),
        b = target(to);
      if (!a || !b) continue;
      b.classList.add('linked');
      const focused = current.focus === from;
      if (focused) {
        a.classList.add('focused');
        b.classList.add('focused');
      }
      if (stacked) continue;
      const ar = a.getBoundingClientRect(),
        br = b.getBoundingClientRect();
      if (kind() === 'snapshot') {
        const visible = snapshotScroller.getBoundingClientRect();
        if (
          br.top < visible.top
          || br.bottom > visible.bottom
          || br.left < visible.left
          || br.right > visible.right
        ) {
          continue;
        }
      }
      const x1 = ar.right - box.left + 5,
        y1 = ar.top + ar.height / 2 - box.top,
        x2 = br.left - box.left - 4,
        y2 = br.top + br.height / 2 - box.top;
      const exitX = Math.max(
        x1 + 8,
        root.querySelector('.conversation').getBoundingClientRect()
          .right
          - box.left
          + 7,
      );
      const bend = Math.max(25, (x2 - exitX) * 0.48);
      // The first value's line passes above the second value on the same row.
      const exitY = kind() === 'open' && from === 'score'
        ? ar.top - box.top - 4
        : y1;
      const departure = exitY === y1
        ? `M${x1} ${y1}`
        : `M${x1} ${y1} C${x1 + 4} ${y1},${x1 + 4} ${exitY},${x1 + 8} ${exitY}`;
      const ns = 'http://www.w3.org/2000/svg';
      const line = document.createElementNS(ns, 'path');
      line.setAttribute(
        'd',
        `${departure} H${exitX} C${exitX + bend} ${exitY},${
          x2 - bend
        } ${y2},${x2} ${y2}`,
      );
      line.dataset.connection = from;
      if (focused) line.classList.add('focused');
      else if (current.focus) line.classList.add('dim');
      paths.append(line);
      for (
        const [cx, cy, r] of [
          [x1, y1, 2.2],
          [x2, y2, 2.6],
        ]
      ) {
        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', cx);
        dot.setAttribute('cy', cy);
        dot.setAttribute('r', r);
        if (current.focus && !focused) dot.classList.add('dim');
        paths.append(dot);
      }
    }
  }
  function queue() {
    if (!animation && !lifetime.signal.aborted) {
      animation = requestAnimationFrame(draw);
    }
  }
  function inspect(file) {
    root.querySelector('#code-peek').innerHTML = peek[file];
    root.querySelector('#editor-tab-name').textContent = config.files[file];
    const type = root.querySelector('#editor-tab-type');
    type.textContent = file === 'env' ? 'JS' : 'TS';
    type.className = file === 'env' ? 'type-js' : 'type-ts';
    root.querySelector('#editor-language').textContent = file === 'env'
      ? 'JavaScript'
      : 'TypeScript';
    queue();
  }
  function setStep(step, announce = true) {
    if (!info[step]) return;
    current.step = step;
    current.focus = null;
    root.dataset.activeStep = String(step);
    root.dataset.defaultStep = String(step === config.defaultStep);
    root
      .querySelectorAll('[data-step]')
      .forEach((e) =>
        e.classList.toggle('active', Number(e.dataset.step) === step)
      );
    root.querySelectorAll('[data-select-step]').forEach((e) => {
      const selected = Number(e.dataset.selectStep) === step;
      e.setAttribute('aria-expanded', String(selected));
      if (selected) e.setAttribute('aria-current', 'step');
      else e.removeAttribute('aria-current');
    });
    root
      .querySelectorAll('.call-content')
      .forEach((e, i) => (e.hidden = i + 1 !== step));
    root
      .querySelectorAll('[data-scene]')
      .forEach((e) => (e.hidden = Number(e.dataset.scene) !== step));
    root.querySelector('#detail-title').textContent = info[step][0];
    root.querySelector('#detail-index').textContent = info[step][1];
    if (kind() === 'prepare') inspect('request');
    if (kind() === 'snapshot') {
      fullSnapshot = false;
      renderSnapshot();
    }
    if (announce) {
      root.querySelector('#step-announcement').textContent = english
        ? `Step ${step}: ${info[step][0]}.`
        : `正在查看第 ${step} 步：${info[step][0]}。`;
    }
    queue();
  }
  function focus(key) {
    current.focus = key;
    queue();
  }
  root.querySelectorAll('[data-select-step]').forEach((e) => {
    on(e, 'click', () => setStep(Number(e.dataset.selectStep)));
    on(e, 'keydown', (event) => {
      if (
        !['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(
          event.key,
        )
      ) {
        return;
      }
      event.preventDefault();
      const forward = ['ArrowDown', 'ArrowRight'].includes(event.key);
      const next =
        ((Number(e.dataset.selectStep) - 1 + (forward ? 1 : stepCount - 1))
          % stepCount) + 1;
      setStep(next);
      root.querySelector(`[data-select-step="${next}"]`).focus();
    });
  });
  root.querySelectorAll('[data-link]').forEach((e) => {
    on(e, 'mouseenter', () => focus(e.dataset.link));
    on(e, 'mouseleave', () => focus(null));
    on(e, 'focus', () => focus(e.dataset.link));
    on(e, 'blur', () => focus(null));
    on(e, 'click', () => {
      if (e.dataset.file) inspect(e.dataset.file);
      focus(e.dataset.link);
    });
  });
  root.querySelectorAll('[data-inspect]').forEach((e) =>
    on(e, 'click', () => {
      inspect(e.dataset.inspect);
      focus(
        e.dataset.target === 'business' ? 'business' : e.dataset.target,
      );
    })
  );
  root
    .querySelectorAll('[data-focus-node]')
    .forEach((e) => on(e, 'click', () => focus(e.dataset.focusNode)));
  const observer = new ResizeObserver(queue);
  observer.observe(workspace);
  on(window, 'resize', queue);
  document.fonts.ready.then(queue);
  setStep(config.defaultStep, false);
  root.dataset.ready = 'true';
  const pageImage = root.querySelector('.page-image');
  const message = root.querySelector('#asset-message');
  const runtimeURL = config.media.icon;
  const fontURL = config.media.font;
  let loading = false,
    demoFont = null;
  async function imageURL(url) {
    const response = await fetch(url, {
      credentials: 'omit',
      headers: config.media.headers,
      signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(20000)]),
    });
    if (!response.ok) {
      throw new Error('Image request failed: ' + response.status);
    }
    const blob = await response.blob();
    lifetime.signal.throwIfAborted();
    const objectURL = URL.createObjectURL(blob);
    objectURLs.add(objectURL);
    const probe = new Image();
    probe.src = objectURL;
    await probe.decode();
    return objectURL;
  }
  async function loadFont() {
    const response = await fetch(fontURL, {
      credentials: 'omit',
      headers: config.media.headers,
      signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(20000)]),
    });
    if (!response.ok) {
      throw new Error('Font request failed: ' + response.status);
    }
    const face = new FontFace(
      'JetBrains Mono',
      await response.arrayBuffer(),
      { weight: '400', style: 'normal' },
    );
    await face.load();
    lifetime.signal.throwIfAborted();
    if (demoFont) document.fonts.delete(demoFont);
    document.fonts.add(face);
    demoFont = face;
  }
  async function loadAssets() {
    if (loading) return;
    loading = true;
    message.hidden = true;
    root.dataset.mediaReady = 'false';
    try {
      await Promise.all([
        loadFont().catch(() => {}),
        imageURL(config.media.page).then(async (url) => {
          pageImage.src = url;
          await pageImage.decode();
        }),
        imageURL(runtimeURL).then((url) =>
          root.style.setProperty('--runtime-image', 'url("' + url + '")')
        ),
      ]);
      root.dataset.mediaReady = 'true';
      queue();
    } catch {
      message.hidden = false;
    } finally {
      loading = false;
    }
  }
  on(root.querySelector('#retry-assets'), 'click', loadAssets);
  loadAssets();

  return () => {
    lifetime.abort();
    observer.disconnect();
    cancelAnimationFrame(animation);
    for (const url of objectURLs) URL.revokeObjectURL(url);
    if (demoFont) document.fonts.delete(demoFont);
  };
}
