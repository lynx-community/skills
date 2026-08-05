// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { ReadableStream } from 'node:stream/web';
import { describe, test } from 'node:test';
import * as jpeg from 'jpeg-js';
import type { CommandData } from '../src/command/contract.ts';
import { ActionCore } from '../src/command/core.ts';
import type { DomNode } from '../src/command/snapshot.ts';
import type { Connector } from '../src/index.ts';

interface CdpCall {
  method: string;
  params: unknown;
}

function quad(x: number, y: number, width: number, height: number): number[] {
  return [x, y, x + width, y, x + width, y + height, x, y + height];
}

function page(
  options: {
    text?: string;
    disabled?: boolean;
    extra?: boolean;
    buttonNodeId?: number;
  } = {},
): DomNode {
  const buttonNodeId = options.buttonNodeId ?? 4;
  const children: DomNode[] = [
    {
      nodeId: 2,
      localName: 'input',
      attributes: ['placeholder', 'Name'],
      box_model: { content: quad(10, 20, 100, 30) },
    },
    {
      nodeId: 3,
      localName: 'scroll-view',
      box_model: { content: quad(0, 100, 200, 180) },
    },
    {
      nodeId: buttonNodeId,
      localName: 'view',
      attributes: options.disabled
        ? ['bindtap', 'tap', 'disabled', 'true']
        : ['bindtap', 'tap'],
      box_model: { content: quad(10, 300, 100, 40) },
      children: [
        {
          nodeId: buttonNodeId + 1,
          nodeType: 3,
          nodeValue: options.text ?? 'Button',
        },
      ],
    },
  ];
  if (options.extra) {
    children.push({
      nodeId: 6,
      localName: 'text',
      box_model: { content: quad(10, 350, 100, 30) },
      children: [{ nodeId: 7, nodeType: 3, nodeValue: 'After' }],
    });
  }
  return {
    nodeId: 1,
    localName: 'page',
    box_model: { content: quad(0, 0, 300, 500) },
    children,
  };
}

function fakeConnector(
  options: {
    roots?: DomNode[];
    calls?: CdpCall[];
    timeline?: string[];
    hitNodeId?: number;
    hitNode?: { nodeId?: number; backendNodeId?: number };
    beforeHitTest?: () => Promise<void>;
    clients?: Array<{ id: string; info: Record<string, unknown> }>;
    sessions?: Array<{ session_id: number; type: string; url: string }>;
    innerTextError?: Error;
    uiValues?: Record<number, string>;
  } = {},
): Connector {
  const calls = options.calls ?? [];
  const roots = [...(options.roots ?? [page()])];
  let latestRoot = roots.at(-1) ?? page();
  return {
    async listClients() {
      return options.clients ?? [];
    },
    async sendListSessionMessage() {
      return options.sessions ?? [];
    },
    async sendCDPMessage(
      _clientId: string,
      _sessionId: number,
      method: string,
      params?: unknown,
    ) {
      calls.push({ method, params });
      options.timeline?.push(method);
      if (method === 'DOM.getDocumentWithBoxModel') {
        latestRoot = roots.shift() ?? latestRoot;
        return { root: latestRoot, compress: false };
      }
      if (method === 'DOM.getNodeForLocation') {
        await options.beforeHitTest?.();
        if (options.hitNode) return options.hitNode;
        if (options.hitNodeId !== undefined)
          return { nodeId: options.hitNodeId };
        const point = params as { x: number; y: number };
        if (point.y <= 50) return { nodeId: 2 };
        if (point.y <= 280) return { nodeId: 3 };
        return { nodeId: 4 };
      }
      if (method === 'DOM.innerText') {
        if (options.innerTextError) throw options.innerTextError;
        return { rawTextValues: [{ text: 'Live value' }] };
      }
      if (method === 'UITree.getUIInfoForNode') {
        const nodeId = (params as { UINodeId: number }).UINodeId;
        const value = options.uiValues?.[nodeId];
        return value === undefined
          ? {}
          : { view: { readonlyProps: { mText: value } } };
      }
      if (method === 'Runtime.evaluate') {
        return { result: { type: 'boolean', value: true } };
      }
      if (method === 'CSS.getComputedStyleForNode') {
        return {
          computedStyle: [
            { name: 'color', value: '#fff' },
            { name: 'width', value: '100px' },
          ],
        };
      }
      return {};
    },
  } as unknown as Connector;
}

function whiteJpeg(width: number, height: number): Buffer {
  return jpeg.encode(
    { width, height, data: Buffer.alloc(width * height * 4, 255) },
    95,
  ).data;
}

function screenshotConnector(
  base: Connector,
  jpegBase64: string,
  inputMessages: unknown[],
  timeline?: string[],
  metadata?: { deviceWidth: number; deviceHeight: number },
): Connector {
  return Object.assign(base, {
    async sendCDPStream(
      _clientId: string,
      _sessionId: number,
      input: ReadableStream<unknown>,
    ) {
      const inputClosed = (async () => {
        for await (const message of input) {
          inputMessages.push(message);
          timeline?.push((message as { method: string }).method);
        }
      })();
      const output = ReadableStream.from([
        {
          method: 'Page.screencastFrame',
          params: { data: jpegBase64, ...(metadata ? { metadata } : {}) },
        },
      ]) as ReadableStream<unknown> &
        AsyncDisposable & { inputClosed: Promise<void> };
      Object.assign(output, {
        inputClosed,
        async [Symbol.asyncDispose]() {
          await inputClosed;
        },
      });
      return output;
    },
  }) as Connector;
}

describe('snapshot ActionCore', () => {
  test('registers the daemon-owned snapshot/ref and ReactLynx surfaces', () => {
    const core = new ActionCore();
    assert.deepEqual(core.actions(), [
      'clear',
      'fill',
      'get-style',
      'get-text',
      'long-press',
      'reactlynx-component',
      'reactlynx-find',
      'reactlynx-link',
      'reactlynx-tree',
      'reactlynx-update-context',
      'reactlynx-update-prop',
      'reactlynx-update-state',
      'screenshot',
      'scroll',
      'snapshot',
      'tap',
      'wait',
    ]);
    assert.deepEqual(core.streamActions(), ['wait']);
  });

  test('annotated screenshot refreshes refs and returns one raster image with matching metadata', async () => {
    const calls: CdpCall[] = [];
    const inputMessages: unknown[] = [];
    const timeline: string[] = [];
    const sourceJpeg = whiteJpeg(300, 500);
    const connector = screenshotConnector(
      fakeConnector({ calls, timeline }),
      sourceJpeg.toString('base64'),
      inputMessages,
      timeline,
      { deviceWidth: 300, deviceHeight: 500 },
    );
    const core = new ActionCore();
    const target = { clientId: 'device:8901', sessionId: 3 };

    const result = await core.execute(
      'screenshot',
      { ...target, annotate: true },
      { connector },
    );

    assert.equal(result.ok, true, result.error?.message);
    if (!result.ok) return;
    const data = result.data as CommandData<'screenshot'>;
    assert.notEqual(data.jpegBase64, sourceJpeg.toString('base64'));
    assert.equal(data.width, 300);
    assert.equal(data.height, 500);
    assert.deepEqual(
      data.annotations?.map((annotation) => annotation.ref),
      ['@e1', '@e2', '@e3'],
    );
    assert.deepEqual(
      data.snapshot?.refs.map((ref) => ref.ref),
      ['@e1', '@e2', '@e3'],
    );
    assert.deepEqual(
      core.getSnapshot(target.clientId, target.sessionId)?.refs,
      data.snapshot?.refs,
    );

    assert.deepEqual(
      inputMessages.map((message) => (message as { method: string }).method),
      ['Page.startScreencast', 'Page.screencastFrameAck'],
    );
    assert.deepEqual((inputMessages[0] as { params: unknown }).params, {
      format: 'jpeg',
      quality: 100,
      mode: 'lynxview',
    });
    const modeIndex = timeline.indexOf('Page.startScreencast');
    const snapshotIndex = timeline.indexOf('DOM.getDocumentWithBoxModel');
    assert.ok(modeIndex >= 0);
    assert.ok(
      snapshotIndex > modeIndex,
      `snapshot must run after lynxview mode is set: ${timeline.join(' -> ')}`,
    );

    const tap = await core.execute(
      'tap',
      { ...target, ref: '@e3' },
      { connector },
    );
    assert.equal(tap.ok, true, tap.error?.message);
  });

  test('annotated screenshot refuses to guess when screencast coordinate metadata is missing', async () => {
    const calls: CdpCall[] = [];
    const connector = screenshotConnector(
      fakeConnector({ calls }),
      whiteJpeg(20, 30).toString('base64'),
      [],
    );

    const result = await new ActionCore().execute(
      'screenshot',
      { clientId: 'device:8901', sessionId: 3, annotate: true },
      { connector },
    );

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.reason, 'invalid-screenshot');
    assert.match(result.error.message, /logical-size metadata/u);
    assert.equal(
      calls.some((call) => call.method === 'DOM.getDocumentWithBoxModel'),
      false,
    );
  });

  test('unannotated screenshot preserves the captured JPEG and supports fullscreen', async () => {
    const inputMessages: unknown[] = [];
    const sourceJpeg = whiteJpeg(20, 30);
    const connector = screenshotConnector(
      fakeConnector(),
      sourceJpeg.toString('base64'),
      inputMessages,
    );
    const core = new ActionCore();

    const result = await core.execute(
      'screenshot',
      { clientId: 'device:8901', sessionId: 3, fullscreen: true },
      { connector },
    );

    assert.equal(result.ok, true, result.error?.message);
    if (!result.ok) return;
    const data = result.data as CommandData<'screenshot'>;
    assert.equal(data.jpegBase64, sourceJpeg.toString('base64'));
    assert.equal(data.annotations, undefined);
    assert.equal(data.snapshot, undefined);
    assert.deepEqual((inputMessages[0] as { params: unknown }).params, {
      format: 'jpeg',
      quality: 80,
      mode: 'fullscreen',
    });
  });

  test('screenshot capture remains compatible when Promise.withResolvers is unavailable', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      Promise,
      'withResolvers',
    );
    assert.ok(descriptor);
    Object.defineProperty(Promise, 'withResolvers', {
      ...descriptor,
      value: undefined,
    });

    try {
      const sourceJpeg = whiteJpeg(20, 30);
      const connector = screenshotConnector(
        fakeConnector(),
        sourceJpeg.toString('base64'),
        [],
      );
      const result = await new ActionCore().execute(
        'screenshot',
        { clientId: 'device:8901', sessionId: 3 },
        { connector },
      );

      assert.equal(result.ok, true, result.error?.message);
      assert.equal(
        (result.data as CommandData<'screenshot'>).jpegBase64,
        sourceJpeg.toString('base64'),
      );
    } finally {
      Object.defineProperty(Promise, 'withResolvers', descriptor);
    }
  });

  test('screenshot capture remains compatible when AbortSignal.any is unavailable', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'any');
    assert.ok(descriptor);
    Object.defineProperty(AbortSignal, 'any', {
      ...descriptor,
      value: undefined,
    });

    try {
      const sourceJpeg = whiteJpeg(20, 30);
      const connector = screenshotConnector(
        fakeConnector(),
        sourceJpeg.toString('base64'),
        [],
      );
      const result = await new ActionCore().execute(
        'screenshot',
        { clientId: 'device:8901', sessionId: 3 },
        { connector },
      );

      assert.equal(result.ok, true, result.error?.message);
      assert.equal(
        (result.data as CommandData<'screenshot'>).jpegBase64,
        sourceJpeg.toString('base64'),
      );
    } finally {
      Object.defineProperty(AbortSignal, 'any', descriptor);
    }
  });

  test('annotated screenshot rejects fullscreen before capturing a frame', async () => {
    const inputMessages: unknown[] = [];
    const connector = screenshotConnector(
      fakeConnector(),
      whiteJpeg(20, 30).toString('base64'),
      inputMessages,
    );
    const result = await new ActionCore().execute(
      'screenshot',
      {
        clientId: 'device:8901',
        sessionId: 3,
        fullscreen: true,
        annotate: true,
      },
      { connector },
    );

    assert.equal(result.ok, false);
    assert.equal(result.error?.reason, 'unsupported-option');
    assert.deepEqual(inputMessages, []);
  });

  test('caches a snapshot and executes every ref action through live validation', async () => {
    const calls: CdpCall[] = [];
    const core = new ActionCore();
    const context = { connector: fakeConnector({ calls }) };
    const target = { clientId: 'device:8901', sessionId: 3 };

    const snapshot = await core.execute('snapshot', target, context);
    assert.equal(snapshot.ok, true);
    assert.deepEqual(
      (snapshot.data as { refs: Array<{ ref: string }> }).refs.map(
        (ref) => ref.ref,
      ),
      ['@e1', '@e2', '@e3'],
    );

    assert.equal(
      (await core.execute('tap', { ...target, ref: 'e3' }, context)).ok,
      true,
    );
    assert.equal(
      (
        await core.execute(
          'long-press',
          { ...target, ref: '@e3', duration: 0 },
          context,
        )
      ).ok,
      true,
    );
    assert.equal(
      (
        await core.execute(
          'fill',
          { ...target, ref: '@e1', text: 'Alice' },
          context,
        )
      ).ok,
      true,
    );
    assert.equal(
      (await core.execute('clear', { ...target, ref: '@e1' }, context)).ok,
      true,
    );
    assert.equal(
      (
        await core.execute(
          'scroll',
          { ...target, ref: '@e2', direction: 'down' },
          context,
        )
      ).ok,
      true,
    );

    const text = await core.execute(
      'get-text',
      { ...target, ref: '@e1' },
      context,
    );
    assert.equal((text.data as { text: string }).text, 'Live value');
    const style = await core.execute(
      'get-style',
      { ...target, ref: '@e1', property: ['color'] },
      context,
    );
    assert.deepEqual((style.data as { style: Record<string, string> }).style, {
      color: '#fff',
    });

    assert.ok(calls.some((call) => call.method === 'DOM.getNodeForLocation'));
    assert.ok(calls.some((call) => call.method === 'DOM.focus'));
    assert.ok(calls.some((call) => call.method === 'Input.insertText'));
    assert.ok(
      calls.some((call) => call.method === 'Input.emulateTouchFromMouseEvent'),
    );
  });

  test('fill focuses the ref and commits text through Input.insertText', async () => {
    const calls: CdpCall[] = [];
    const core = new ActionCore();
    const context = { connector: fakeConnector({ calls }) };
    const target = { clientId: 'device:8901', sessionId: 3 };

    assert.equal((await core.execute('snapshot', target, context)).ok, true);
    assert.equal(
      (
        await core.execute(
          'fill',
          { ...target, ref: '@e1', text: 'Agent Lynx' },
          context,
        )
      ).ok,
      true,
    );

    const focusIndex = calls.findIndex((call) => call.method === 'DOM.focus');
    const insertIndex = calls.findIndex(
      (call) => call.method === 'Input.insertText',
    );
    assert.ok(focusIndex >= 0);
    assert.ok(insertIndex > focusIndex);
    assert.deepEqual(calls[insertIndex]?.params, { text: 'Agent Lynx' });
    assert.equal(
      calls.some((call) => call.method === 'DOM.setAttributesAsText'),
      false,
    );
  });

  test('fill and clear select a cached live value before replacing it through Input.insertText', async () => {
    const calls: CdpCall[] = [];
    const core = new ActionCore();
    const context = {
      connector: fakeConnector({ calls, uiValues: { 2: 'Existing value' } }),
    };
    const target = { clientId: 'device:8901', sessionId: 3 };

    assert.equal((await core.execute('snapshot', target, context)).ok, true);
    assert.equal(
      (
        await core.execute(
          'fill',
          { ...target, ref: '@e1', text: 'Replacement' },
          context,
        )
      ).ok,
      true,
    );
    assert.equal(
      (await core.execute('clear', { ...target, ref: '@e1' }, context)).ok,
      true,
    );

    const evaluateCalls = calls.filter(
      (call) => call.method === 'Runtime.evaluate',
    );
    assert.equal(evaluateCalls.length, 2);
    for (const call of evaluateCalls) {
      const expression = (call.params as { expression: string }).expression;
      assert.match(expression, /selectUniqueID\(2\)/u);
      assert.match(expression, /selectionEnd:14/u);
    }
    assert.deepEqual(
      calls
        .filter((call) => call.method === 'Input.insertText')
        .map((call) => call.params),
      [{ text: 'Replacement' }, { text: '' }],
    );
    assert.equal(
      calls.some((call) => call.method === 'DOM.setAttributesAsText'),
      false,
    );
  });

  test('fill uses the live frontend node when a stable backend node was remapped', async () => {
    const calls: CdpCall[] = [];
    const root = page();
    root.children![0]!.backendNodeId = 102;
    const core = new ActionCore();
    const context = {
      connector: fakeConnector({
        calls,
        roots: [root],
        hitNode: { nodeId: 202, backendNodeId: 102 },
      }),
    };
    const target = { clientId: 'device:8901', sessionId: 3 };

    assert.equal((await core.execute('snapshot', target, context)).ok, true);
    assert.equal(
      (
        await core.execute(
          'fill',
          { ...target, ref: '@e1', text: 'Agent Lynx' },
          context,
        )
      ).ok,
      true,
    );

    const focus = calls.find((call) => call.method === 'DOM.focus');
    assert.deepEqual(focus?.params, { nodeId: 202 });
  });

  test('fill rejects a backend match that cannot resolve a live frontend node', async () => {
    const calls: CdpCall[] = [];
    const root = page();
    root.children![0]!.backendNodeId = 102;
    const core = new ActionCore();
    const context = {
      connector: fakeConnector({
        calls,
        roots: [root],
        hitNode: { backendNodeId: 102 },
      }),
    };
    const target = { clientId: 'device:8901', sessionId: 3 };

    assert.equal((await core.execute('snapshot', target, context)).ok, true);
    const result = await core.execute(
      'fill',
      { ...target, ref: '@e1', text: 'Agent Lynx' },
      context,
    );

    assert.equal(result.error?.reason, 'stale-ref');
    assert.equal(
      calls.some((call) => call.method === 'DOM.focus'),
      false,
    );
    assert.equal(
      calls.some((call) => call.method === 'Input.insertText'),
      false,
    );
  });

  test('visible-only snapshots reparent visible descendants whose ancestors were filtered out', async () => {
    const root: DomNode = {
      nodeId: 1,
      localName: 'page',
      box_model: { content: quad(0, 0, 300, 500) },
      children: [
        {
          nodeId: 2,
          localName: 'view',
          box_model: { content: quad(0, 600, 100, 100) },
          children: [
            {
              nodeId: 3,
              localName: 'text',
              box_model: { content: quad(10, 10, 80, 20) },
              children: [
                {
                  nodeId: 4,
                  localName: 'image',
                  box_model: { content: quad(20, 15, 20, 10) },
                },
              ],
            },
          ],
        },
      ],
    };
    const core = new ActionCore();
    const result = await core.execute(
      'snapshot',
      { clientId: 'device:8901', sessionId: 3, visibleOnly: true },
      { connector: fakeConnector({ roots: [root] }) },
    );

    assert.equal(result.ok, true);
    assert.deepEqual(
      (
        result.data as { refs: Array<{ ref: string; parentRef?: string }> }
      ).refs.map((ref) => ({
        ref: ref.ref,
        parentRef: ref.parentRef,
      })),
      [
        { ref: '@e2', parentRef: undefined },
        { ref: '@e3', parentRef: '@e2' },
      ],
    );
  });

  test('uses live hit testing to exclude unpainted descendants of nested scrollers', async () => {
    const root: DomNode = {
      nodeId: 1,
      localName: 'page',
      box_model: { content: quad(0, 0, 200, 200) },
      children: [
        {
          nodeId: 2,
          localName: 'list',
          box_model: { content: quad(10, 20, 150, 120) },
          children: [
            {
              nodeId: 3,
              localName: 'view',
              box_model: { content: quad(20, 30, 120, 40) },
            },
            {
              nodeId: 4,
              localName: 'view',
              box_model: { content: quad(20, 80, 120, 40) },
            },
          ],
        },
      ],
    };
    const result = await new ActionCore().execute(
      'snapshot',
      { clientId: 'device:8901', sessionId: 3 },
      { connector: fakeConnector({ roots: [root], hitNodeId: 4 }) },
    );

    assert.equal(result.ok, true);
    const refs = (
      result.data as {
        refs: Array<{
          nodeId: number;
          flags: { visible: boolean; offscreen: boolean };
        }>;
      }
    ).refs;
    assert.deepEqual(
      refs.map((ref) => ({
        nodeId: ref.nodeId,
        visible: ref.flags.visible,
        offscreen: ref.flags.offscreen,
      })),
      [
        { nodeId: 2, visible: true, offscreen: false },
        { nodeId: 3, visible: false, offscreen: false },
        { nodeId: 4, visible: true, offscreen: false },
      ],
    );
  });

  test('keeps a painted ref visible when hit testing returns only backendNodeId', async () => {
    const root: DomNode = {
      nodeId: 1,
      localName: 'page',
      box_model: { content: quad(0, 0, 200, 200) },
      children: [
        {
          nodeId: 2,
          backendNodeId: 102,
          localName: 'list',
          box_model: { content: quad(10, 20, 150, 120) },
          children: [
            {
              nodeId: 3,
              backendNodeId: 103,
              localName: 'view',
              box_model: { content: quad(20, 30, 120, 40) },
            },
          ],
        },
      ],
    };
    const result = await new ActionCore().execute(
      'snapshot',
      { clientId: 'device:8901', sessionId: 3 },
      {
        connector: fakeConnector({
          roots: [root],
          hitNode: { backendNodeId: 103 },
        }),
      },
    );

    assert.equal(result.ok, true);
    const child = (
      result.data as {
        refs: Array<{ nodeId: number; flags: { visible: boolean } }>;
      }
    ).refs.find((ref) => ref.nodeId === 3);
    assert.equal(child?.flags.visible, true);
  });

  test('enriches visible editable refs with live non-password UITree values', async () => {
    const core = new ActionCore();
    const result = await core.execute(
      'snapshot',
      { clientId: 'device:8901', sessionId: 3 },
      { connector: fakeConnector({ uiValues: { 2: 'Alice' } }) },
    );

    assert.equal(result.ok, true);
    const input = (
      result.data as {
        refs: Array<{
          nodeId: number;
          text: string;
          attributes: Record<string, string>;
        }>;
      }
    ).refs.find((ref) => ref.nodeId === 2);
    assert.equal(input?.text, 'Alice');
    assert.deepEqual(input?.attributes, {
      value: 'Alice',
      placeholder: 'Name',
    });

    const emptyResult = await new ActionCore().execute(
      'snapshot',
      { clientId: 'device:8901', sessionId: 3 },
      { connector: fakeConnector({ uiValues: { 2: '' } }) },
    );
    const emptyInput = (
      emptyResult.data as {
        refs: Array<{
          nodeId: number;
          text: string;
          attributes: Record<string, string>;
        }>;
      }
    ).refs.find((ref) => ref.nodeId === 2);
    assert.equal(emptyInput?.text, 'Name');
    assert.deepEqual(emptyInput?.attributes, {
      value: '',
      placeholder: 'Name',
    });

    const passwordRoot: DomNode = {
      nodeId: 1,
      localName: 'page',
      box_model: { content: quad(0, 0, 100, 100) },
      children: [
        {
          nodeId: 8,
          localName: 'input',
          attributes: ['type', 'password', 'placeholder', 'Password'],
          box_model: { content: quad(0, 0, 100, 30) },
        },
      ],
    };
    const passwordResult = await new ActionCore().execute(
      'snapshot',
      { clientId: 'device:8901', sessionId: 3 },
      {
        connector: fakeConnector({
          roots: [passwordRoot],
          uiValues: { 8: 'secret' },
        }),
      },
    );
    const password = (
      passwordResult.data as {
        refs: Array<{ text: string; attributes: Record<string, string> }>;
      }
    ).refs[0];
    assert.equal(password?.text, '');
    assert.deepEqual(password?.attributes, {
      placeholder: 'Password',
      type: 'password',
    });
  });

  test('keeps partial scroll gestures inside the viewport and sends a low-inertia swipe', async () => {
    const calls: CdpCall[] = [];
    const root: DomNode = {
      nodeId: 1,
      localName: 'page',
      box_model: { content: quad(0, 0, 300, 500) },
      children: [
        {
          nodeId: 2,
          localName: 'scroll-view',
          box_model: { content: quad(0, 450, 300, 200) },
        },
      ],
    };
    const core = new ActionCore();
    const context = {
      connector: fakeConnector({ roots: [root], calls, hitNodeId: 2 }),
    };
    const target = { clientId: 'device:8901', sessionId: 3 };
    await core.execute('snapshot', target, context);

    const result = await core.execute(
      'scroll',
      { ...target, ref: '@e1', direction: 'down' },
      context,
    );
    assert.equal(result.ok, true);
    const { from, to } = result.data as {
      from: { x: number; y: number };
      to: { x: number; y: number };
    };
    assert.ok(from.x >= 0 && from.x < 50);
    assert.equal(to.x, from.x);
    assert.ok(from.y >= 450 && from.y < 500);
    assert.ok(to.y >= 450 && to.y < 500);
    assert.ok(from.y > to.y);

    const moved = calls.filter(
      (call) =>
        call.method === 'Input.emulateTouchFromMouseEvent' &&
        (call.params as { type?: string }).type === 'mouseMoved',
    );
    assert.equal(moved.length, 30);
  });

  test('returns actionable ref failures before sending unsafe input', async () => {
    const target = { clientId: 'device:8901', sessionId: 3, ref: '@e3' };
    const noSnapshot = await new ActionCore().execute('tap', target, {
      connector: fakeConnector(),
    });
    assert.equal(noSnapshot.error?.reason, 'no-snapshot');

    const coveredCore = new ActionCore();
    const coveredContext = { connector: fakeConnector({ hitNodeId: 999 }) };
    await coveredCore.execute('snapshot', target, coveredContext);
    assert.equal(
      (await coveredCore.execute('tap', target, coveredContext)).error?.reason,
      'covered',
    );

    const disabledCore = new ActionCore();
    const disabledContext = {
      connector: fakeConnector({ roots: [page({ disabled: true })] }),
    };
    await disabledCore.execute('snapshot', target, disabledContext);
    assert.equal(
      (await disabledCore.execute('tap', target, disabledContext)).error
        ?.reason,
      'disabled',
    );
    assert.equal(
      (
        await disabledCore.execute(
          'fill',
          { ...target, ref: '@e2', text: 'x' },
          disabledContext,
        )
      ).error?.reason,
      'not-editable',
    );
  });

  test('accepts a descendant hit target at the center of an interactive parent ref', async () => {
    const core = new ActionCore();
    const context = { connector: fakeConnector({ hitNodeId: 5 }) };
    const target = { clientId: 'device:8901', sessionId: 3 };
    await core.execute('snapshot', target, context);

    assert.equal(
      (await core.execute('tap', { ...target, ref: '@e3' }, context)).ok,
      true,
    );
  });

  test('aborting an input action still releases a pressed pointer', async () => {
    const calls: CdpCall[] = [];
    const core = new ActionCore();
    const context = { connector: fakeConnector({ calls }) };
    const target = { clientId: 'device:8901', sessionId: 3 };
    await core.execute('snapshot', target, context);

    const controller = new AbortController();
    const pending = core.execute(
      'long-press',
      { ...target, ref: '@e3', duration: 60_000 },
      context,
      controller.signal,
    );
    while (
      !calls.some(
        (call) =>
          call.method === 'Input.emulateTouchFromMouseEvent' &&
          (call.params as { type?: string }).type === 'mousePressed',
      )
    ) {
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
    controller.abort(new Error('test abort'));

    assert.equal((await pending).error?.reason, 'aborted');
    const touchTypes = calls
      .filter((call) => call.method === 'Input.emulateTouchFromMouseEvent')
      .map((call) => (call.params as { type?: string }).type);
    assert.deepEqual(touchTypes, ['mousePressed', 'mouseReleased']);
  });

  test('--snapshot action semantics return fresh refs and replace the daemon cache', async () => {
    const core = new ActionCore();
    const context = {
      connector: fakeConnector({ roots: [page(), page({ extra: true })] }),
    };
    const target = { clientId: 'device:8901', sessionId: 3 };
    await core.execute('snapshot', target, context);

    const result = await core.execute(
      'tap',
      { ...target, ref: '@e3', snapshotAfter: true },
      context,
    );
    assert.equal(result.ok, true);
    assert.equal(
      (result.data as { snapshot?: { refs: unknown[] } }).snapshot?.refs.length,
      4,
    );
    assert.equal(
      core.getSnapshot(target.clientId, target.sessionId)?.refs.length,
      4,
    );
  });

  test('wait SSE emits progress, then a final match and caches the fresh snapshot', async () => {
    const core = new ActionCore();
    const context = {
      connector: fakeConnector({ roots: [page(), page({ text: 'Ready' })] }),
    };
    const events = [];
    for await (const event of core.stream(
      'wait',
      {
        clientId: 'device:8901',
        sessionId: 3,
        text: 'Ready',
        timeout: 100,
        interval: 1,
      },
      context,
      new AbortController().signal,
    )) {
      events.push(event);
    }

    assert.deepEqual(
      events.map((event) => event.action),
      ['wait.progress', 'wait'],
    );
    assert.equal(events[1]?.ok, true);
    assert.ok(core.getSnapshot('device:8901', 3));
  });

  test('wait SSE emits only the final match when its first snapshot already matches', async () => {
    const core = new ActionCore();
    const calls: CdpCall[] = [];
    const context = {
      connector: fakeConnector({ calls, roots: [page({ text: 'Ready' })] }),
    };
    const events = [];
    for await (const event of core.stream(
      'wait',
      {
        clientId: 'device:8901',
        sessionId: 3,
        text: 'Ready',
        timeout: 100,
        interval: 1,
      },
      context,
      new AbortController().signal,
    )) {
      events.push(event);
    }

    assert.deepEqual(
      events.map((event) => event.action),
      ['wait'],
    );
    assert.equal(events[0]?.ok, true);
    assert.equal(events[0]?.data.matched, true);
    assert.deepEqual(
      calls.map((call) => call.method),
      ['DOM.enable', 'DOM.getDocumentWithBoxModel'],
      'text wait must not spend its deadline enriching a snapshot after the structural text already matches',
    );
  });

  test('wait reports timeout and stops promptly when its SSE request is aborted', async () => {
    const core = new ActionCore();
    const context = { connector: fakeConnector() };
    const timeout = await core.execute(
      'wait',
      {
        clientId: 'device:8901',
        sessionId: 3,
        text: 'Never',
        timeout: 0,
        interval: 1,
      },
      context,
    );
    assert.equal(timeout.error?.reason, 'timeout');

    const controller = new AbortController();
    const iterator = core
      .stream(
        'wait',
        {
          clientId: 'device:8901',
          sessionId: 3,
          text: 'Never',
          timeout: 10_000,
          interval: 10_000,
        },
        context,
        controller.signal,
      )
      [Symbol.asyncIterator]();
    assert.equal((await iterator.next()).value?.action, 'wait.progress');
    const pending = iterator.next();
    controller.abort();
    assert.equal((await pending).done, true);
  });

  test('wait treats timeout as an upper bound even when the polling interval is longer', async () => {
    const core = new ActionCore();
    const startedAt = Date.now();
    const result = await core.execute(
      'wait',
      {
        clientId: 'device:8901',
        sessionId: 3,
        text: 'Never',
        timeout: 30,
        interval: 60_000,
      },
      { connector: fakeConnector() },
    );

    assert.equal(result.error?.reason, 'timeout');
    assert.ok(
      Date.now() - startedAt < 1_000,
      'wait must sleep only until its remaining deadline',
    );
  });

  test('wait(ref) follows the cached node identity instead of a reused ordinal label', async () => {
    const core = new ActionCore();
    const context = {
      connector: fakeConnector({ roots: [page(), page({ buttonNodeId: 40 })] }),
    };
    const target = { clientId: 'device:8901', sessionId: 3 };
    await core.execute('snapshot', target, context);

    const result = await core.execute(
      'wait',
      { ...target, ref: '@e3', timeout: 20, interval: 1 },
      context,
    );
    assert.equal(result.error?.reason, 'timeout');
    assert.equal(
      core.getSnapshot(target.clientId, target.sessionId),
      undefined,
    );

    const tap = await core.execute('tap', { ...target, ref: '@e3' }, context);
    assert.equal(tap.error?.reason, 'no-snapshot');
  });

  test(
    'wait(ref) does not exceed its deadline after structural identity matches',
    { timeout: 1_000 },
    async () => {
      const refinementStarted = Promise.withResolvers<void>();
      const releaseRefinement = Promise.withResolvers<void>();
      const hitNode = { nodeId: 2, backendNodeId: 200 };
      let blockRefinement = false;
      const cachedPage = page();
      const freshPage = page();
      cachedPage.children![1]!.box_model = { content: quad(10, 20, 100, 30) };
      freshPage.children![1]!.box_model = { content: quad(10, 20, 100, 30) };
      cachedPage.children![0]!.backendNodeId = 200;
      freshPage.children![0]!.backendNodeId = 200;
      const core = new ActionCore();
      const target = { clientId: 'device:8901', sessionId: 3 };
      const context = {
        connector: fakeConnector({
          roots: [cachedPage, freshPage],
          hitNode,
          async beforeHitTest() {
            if (!blockRefinement) return;
            refinementStarted.resolve();
            await releaseRefinement.promise;
          },
        }),
      };

      try {
        await core.execute('snapshot', target, context);
        blockRefinement = true;
        hitNode.nodeId = 999;
        hitNode.backendNodeId = 999;

        const pending = core.execute(
          'wait',
          { ...target, ref: '@e1', timeout: 100, interval: 100 },
          context,
        );
        const enrichmentStartedBeforeResult = await Promise.race([
          refinementStarted.promise.then(() => true),
          pending.then(() => false),
        ]);
        assert.equal(
          enrichmentStartedBeforeResult,
          true,
          'the structural match must leave time to start enrichment',
        );

        const result = await pending;
        assert.equal(result.ok, true, result.error?.message);
        assert.equal(
          core.getSnapshot(target.clientId, target.sessionId),
          undefined,
          'an enrichment that missed the original deadline must not publish a partial snapshot',
        );
      } finally {
        releaseRefinement.resolve();
      }
    },
  );

  test('wait(ref) caches a fully enriched match within its remaining deadline', async () => {
    const hitNode = { nodeId: 2, backendNodeId: 200 };
    const cachedPage = page();
    const freshPage = page();
    cachedPage.children![0]!.backendNodeId = 200;
    freshPage.children![0]!.backendNodeId = 200;
    const core = new ActionCore();
    const target = { clientId: 'device:8901', sessionId: 3 };
    const context = {
      connector: fakeConnector({
        roots: [cachedPage, freshPage],
        hitNode,
        uiValues: { 2: 'Live value' },
      }),
    };

    await core.execute('snapshot', target, context);
    const result = await core.execute(
      'wait',
      { ...target, ref: '@e1', timeout: 100, interval: 1 },
      context,
    );

    assert.equal(result.ok, true, result.error?.message);
    const cachedRef = core.getSnapshot(target.clientId, target.sessionId)
      ?.refs[0];
    assert.equal(cachedRef?.backendNodeId, 200);
    assert.equal(cachedRef?.flags.visible, true);
    assert.equal(cachedRef?.text, 'Live value');
    assert.equal(cachedRef?.attributes.value, 'Live value');
  });

  test('get-text falls back only for the canonical unsupported-method CDP error', async () => {
    const target = { clientId: 'device:8901', sessionId: 3, ref: '@e3' };
    const unsupportedCore = new ActionCore();
    const unsupported = new Error('method missing', {
      cause: { error: { code: -32601, message: 'Method not found' } },
    });
    const unsupportedContext = {
      connector: fakeConnector({ innerTextError: unsupported }),
    };
    await unsupportedCore.execute('snapshot', target, unsupportedContext);
    const fallback = await unsupportedCore.execute(
      'get-text',
      target,
      unsupportedContext,
    );
    assert.equal(fallback.ok, true);
    assert.equal((fallback.data as { text: string }).text, 'Button');

    const brokenCore = new ActionCore();
    const brokenContext = {
      connector: fakeConnector({
        innerTextError: new Error('transport disconnected'),
      }),
    };
    await brokenCore.execute('snapshot', target, brokenContext);
    const broken = await brokenCore.execute('get-text', target, brokenContext);
    assert.equal(broken.ok, false);
    assert.match(broken.error?.message ?? '', /transport disconnected/);
  });

  test('rejects malformed optional numbers and booleans instead of applying defaults', async () => {
    const core = new ActionCore();
    const context = { connector: fakeConnector() };
    const target = { clientId: 'device:8901', sessionId: 3 };
    await core.execute('snapshot', target, context);

    assert.equal(
      (
        await core.execute(
          'long-press',
          { ...target, ref: '@e3', duration: null },
          context,
        )
      ).error?.reason,
      'bad-params',
    );
    assert.equal(
      (
        await core.execute(
          'tap',
          { ...target, ref: '@e3', snapshotAfter: 'yes' },
          context,
        )
      ).error?.reason,
      'bad-params',
    );
    assert.equal(
      (
        await core.execute(
          'wait',
          { ...target, text: 'Ready', timeout: null },
          context,
        )
      ).error?.reason,
      'bad-params',
    );
  });

  test('resolves an omitted target inside ActionCore and excludes headless auto-selection', async () => {
    const core = new ActionCore();
    const connector = fakeConnector({
      clients: [
        { id: 'headless:0', info: {} },
        { id: 'device:8901', info: {} },
      ],
      sessions: [
        { session_id: 2, type: 'lynx', url: 'two' },
        { session_id: 9, type: 'lynx', url: 'nine' },
      ],
    });

    const result = await core.execute('snapshot', {}, { connector });
    assert.equal(result.ok, true);
    assert.equal(
      (result.data as { clientId: string; sessionId: number }).clientId,
      'device:8901',
    );
    assert.equal(
      (result.data as { clientId: string; sessionId: number }).sessionId,
      9,
    );

    const headlessOnly = await core.execute(
      'snapshot',
      {},
      {
        connector: fakeConnector({ clients: [{ id: 'headless:0', info: {} }] }),
      },
    );
    assert.equal(headlessOnly.error?.reason, 'target-not-found');
    assert.match(headlessOnly.error?.message ?? '', /never auto-selected/);
  });
});
