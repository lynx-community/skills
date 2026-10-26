// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { ReadableStream, WritableStream } from "node:stream/web";
import { test } from "node:test";
import { setImmediate as nextTurn } from "node:timers/promises";
import { captureScreenshotFrame, ScreenshotTimeoutError } from "../src/command/screenshot.ts";
import { ClientId, Connector } from "../src/index.ts";
import type { App, Connection, Device, Transport, TransportConnectOptions } from "../src/transport/transport.ts";
import type { CDPRequest } from "../src/types.ts";

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

interface ScreenshotStreamHarness {
  connector: Connector;
  opened: Promise<void>;
  acknowledgementStarted: Promise<void>;
  inputClosed: Promise<void>;
  methods: string[];
  streamSignal: () => AbortSignal;
  emitFrame(data: string): void;
  closeOutput(): void;
  releaseAcknowledgement(): void;
}

function createScreenshotStreamHarness(
  harnessOptions: { blockAcknowledgement?: boolean } = {},
): ScreenshotStreamHarness {
  const opened = deferred<void>();
  const acknowledgementStarted = deferred<void>();
  const acknowledgementReleased = deferred<void>();
  const inputClosed = deferred<void>();
  const methods: string[] = [];
  let outputController!: ReadableStreamDefaultController<unknown>;
  let outputClosed = false;
  let signal!: AbortSignal;

  const connector = {
    async sendCDPStream(
      _clientId: string,
      _sessionId: number,
      input: ReadableStream<unknown>,
      options: { signal: AbortSignal },
    ) {
      signal = options.signal;
      signal.addEventListener("abort", () => acknowledgementReleased.resolve(), { once: true });
      void (async () => {
        try {
          for await (const message of input) {
            const method = (message as { method: string }).method;
            methods.push(method);
            if (method === "Page.screencastFrameAck") {
              acknowledgementStarted.resolve();
              if (harnessOptions.blockAcknowledgement) await acknowledgementReleased.promise;
              if (!signal.aborted && !outputClosed) {
                outputController.enqueue({ id: (message as { id: number }).id, result: {} });
              }
            }
          }
        } finally {
          inputClosed.resolve();
        }
      })();

      const output = new ReadableStream<unknown>({
        start(controller) {
          outputController = controller;
          signal.addEventListener("abort", () => {
            if (outputClosed) return;
            outputClosed = true;
            controller.error(signal.reason);
          }, { once: true });
          opened.resolve();
        },
      }) as ReadableStream<unknown> & AsyncDisposable & { inputClosed: Promise<void> };
      Object.assign(output, {
        inputClosed: inputClosed.promise,
        async [Symbol.asyncDispose]() {
          await inputClosed.promise;
        },
      });
      return output;
    },
    async sendCDPMessage(_clientId: string, _sessionId: number, method: string) {
      methods.push(method);
      return {};
    },
  } as unknown as Connector;

  return {
    connector,
    opened: opened.promise,
    acknowledgementStarted: acknowledgementStarted.promise,
    inputClosed: inputClosed.promise,
    methods,
    streamSignal: () => signal,
    emitFrame(data: string) {
      outputController.enqueue({ method: "Page.screencastFrame", params: { data } });
    },
    closeOutput() {
      outputClosed = true;
      outputController.close();
    },
    releaseAcknowledgement() {
      acknowledgementReleased.resolve();
    },
  };
}

test("screenshot returns a normal frame after its CDP acknowledgement response", async () => {
  const harness = createScreenshotStreamHarness();
  const capture = captureScreenshotFrame(harness.connector, "device:8901", 5, { timeoutMs: 200 });
  await harness.opened;
  harness.emitFrame("captured-frame");

  assert.equal((await capture).data, "captured-frame");
  assert.deepEqual(harness.methods, [
    "Page.startScreencast",
    "Page.screencastFrameAck",
    "Page.stopScreencast",
  ]);
});

test("screenshot times out while an open stream produces no frame", async () => {
  const harness = createScreenshotStreamHarness();
  const capture = captureScreenshotFrame(harness.connector, "device:8901", 5, { timeoutMs: 20 });
  await harness.opened;

  await assert.rejects(
    capture,
    error => error instanceof ScreenshotTimeoutError && /no Page\.screencastFrame event received/u.test(error.message),
  );
  assert.equal(harness.streamSignal().aborted, true);
  assert.deepEqual(harness.methods, ["Page.startScreencast", "Page.stopScreencast"]);
});

test("screenshot reports a clean EOF without pretending it reached the frame timeout", async () => {
  const harness = createScreenshotStreamHarness();
  const capture = captureScreenshotFrame(harness.connector, "device:8901", 5, { timeoutMs: 1_000 });
  await harness.opened;
  harness.closeOutput();

  await assert.rejects(
    capture,
    error =>
      error instanceof Error
      && !(error instanceof ScreenshotTimeoutError)
      && error.message === "Screenshot stream ended before a usable Page.screencastFrame event was received.",
  );
  assert.deepEqual(harness.methods, ["Page.startScreencast", "Page.stopScreencast"]);
});

test("screenshot reports its acknowledgement phase when the original deadline expires", async () => {
  const harness = createScreenshotStreamHarness({ blockAcknowledgement: true });
  const capture = captureScreenshotFrame(harness.connector, "device:8901", 5, { timeoutMs: 20 });
  await harness.opened;
  harness.emitFrame("captured-frame");
  await harness.acknowledgementStarted;

  await assert.rejects(
    capture,
    error => error instanceof ScreenshotTimeoutError && /acknowledgement was not confirmed/u.test(error.message),
  );
  assert.equal(harness.streamSignal().aborted, true);
  await harness.inputClosed;
  assert.deepEqual(harness.methods, [
    "Page.startScreencast",
    "Page.screencastFrameAck",
    "Page.stopScreencast",
  ]);
});

test("screenshot acknowledges empty frames and waits for screencast cleanup", async () => {
  const inputMessages: unknown[] = [];
  const acknowledgementResponses: number[] = [];
  const cleanupMessages: string[] = [];
  const lifecycle: string[] = [];
  const firstFrameAcknowledged = deferred<void>();
  const inputClosed = deferred<void>();
  const cleanupStarted = deferred<void>();
  const cleanupReleased = deferred<void>();
  let outputController!: ReadableStreamDefaultController<unknown>;
  const connector = {
    async sendCDPMessage(_clientId: string, _sessionId: number, method: string) {
      lifecycle.push("stop");
      cleanupMessages.push(method);
      cleanupStarted.resolve();
      await cleanupReleased.promise;
      return {};
    },
    async sendCDPStream(
      _clientId: string,
      _sessionId: number,
      input: ReadableStream<unknown>,
      { signal }: { signal: AbortSignal },
    ) {
      void (async () => {
        try {
          for await (const message of input) {
            inputMessages.push(message);
            const acknowledgements = inputMessages.filter(
              entry => (entry as { method?: unknown }).method === "Page.screencastFrameAck",
            );
            if ((message as { method?: unknown }).method === "Page.screencastFrameAck") {
              const id = (message as { id: number }).id;
              if (acknowledgements.length === 1) {
                firstFrameAcknowledged.resolve();
              } else {
                const emptyFrameAckId = (acknowledgements[0] as { id: number }).id;
                acknowledgementResponses.push(emptyFrameAckId, id);
                outputController.enqueue({ id: emptyFrameAckId, result: {} });
                outputController.enqueue({ id, result: {} });
                outputController.close();
              }
            }
          }
        } finally {
          inputClosed.resolve();
        }
      })();

      const output = new ReadableStream<unknown>({
        start(controller) {
          outputController = controller;
          signal.addEventListener("abort", () => controller.error(signal.reason), { once: true });
          controller.enqueue({
            method: "Page.screencastFrame",
            params: { data: "" },
          });
          void firstFrameAcknowledged.promise.then(() => {
            controller.enqueue({
              method: "Page.screencastFrame",
              params: { data: "usable-frame" },
            });
          });
        },
      }) as ReadableStream<unknown> & AsyncDisposable & { inputClosed: Promise<void> };
      Object.assign(output, {
        inputClosed: inputClosed.promise,
        async [Symbol.asyncDispose]() {
          lifecycle.push("stream-dispose");
          await inputClosed.promise;
        },
      });
      return output;
    },
  } as unknown as Connector;

  let settled = false;
  const capture = captureScreenshotFrame(connector, "device:8901", 5, { timeoutMs: 200 });
  void capture.then(() => {
    settled = true;
  });
  await cleanupStarted.promise;
  await Promise.resolve();
  assert.equal(settled, false);
  cleanupReleased.resolve();
  const result = await capture;

  assert.equal(result.data, "usable-frame");
  assert.deepEqual(
    inputMessages.map(message => (message as { method: string }).method),
    ["Page.startScreencast", "Page.screencastFrameAck", "Page.screencastFrameAck"],
  );
  const acknowledgementIds = inputMessages
    .filter(message => (message as { method: string }).method === "Page.screencastFrameAck")
    .map(message => (message as { id: number }).id);
  assert.deepEqual(acknowledgementResponses, [acknowledgementIds[0], acknowledgementIds[1]]);
  assert.deepEqual(cleanupMessages, ["Page.stopScreencast"]);
  assert.deepEqual(lifecycle, ["stream-dispose", "stop"]);
});

class DelayedScreenshotTransport implements Transport {
  readonly acknowledgement = deferred<Error | undefined>();
  readonly acknowledgementStarted = deferred<void>();
  readonly acknowledgementWritten = deferred<void>();
  readonly events: string[] = [];
  readonly methods: string[] = [];
  #acknowledgementResponse: ((error?: { code: number; message: string }) => void) | undefined;

  respondToAcknowledgement(error?: { code: number; message: string }): void {
    const respond = this.#acknowledgementResponse;
    this.#acknowledgementResponse = undefined;
    respond?.(error);
  }

  async close(): Promise<void> {}

  async listDevices(): Promise<Device[]> {
    return [{ id: "screenshot-device", os: "Android" }];
  }

  async listAvailableApps(): Promise<App[]> {
    return [];
  }

  async openApp(): Promise<void> {}

  async connect<TInput, TOutput>({ signal }: TransportConnectOptions): Promise<Connection<TOutput, TInput>> {
    signal?.throwIfAborted();
    const lifetime = new AbortController();
    const abort = () => lifetime.abort(signal?.reason);
    signal?.addEventListener("abort", abort, { once: true });
    let output!: ReadableStreamDefaultController<TOutput>;
    const closed = new Promise<never>((_resolve, reject) => {
      lifetime.signal.addEventListener("abort", () => {
        output.error(lifetime.signal.reason);
        reject(lifetime.signal.reason);
      }, { once: true });
    });
    void closed.catch(() => {});
    const respond = (message: unknown) => {
      output.enqueue({
        event: "Customized",
        data: { type: "CDP", data: { session_id: 5, message: JSON.stringify(message) } },
      } as TOutput);
    };
    const readable = new ReadableStream<TOutput>({
      start(controller) {
        output = controller;
      },
      cancel: () => {
        this.events.push("cancel");
        lifetime.abort(new Error("Screenshot connection canceled"));
      },
    });
    const writable = new WritableStream<TInput>({
      write: async (chunk) => {
        const { id, method } = (chunk as CDPRequest).data.data.message;
        this.methods.push(method);
        if (method === "Page.startScreencast") {
          respond({ method: "Page.screencastFrame", params: { data: "captured-frame" } });
        } else if (method === "Page.screencastFrameAck") {
          this.events.push("ack-started");
          this.acknowledgementStarted.resolve();
          const error = await Promise.race([this.acknowledgement.promise, closed]);
          if (error) throw error;
          this.events.push("ack-written");
          this.acknowledgementWritten.resolve();
          this.#acknowledgementResponse = (error) => {
            this.events.push("ack-response");
            respond(error ? { id, error } : { id, result: {} });
          };
        } else if (method === "Page.stopScreencast") {
          this.events.push("stop");
          respond({ id, result: {} });
        }
      },
    });
    return {
      readable,
      writable,
      [Symbol.asyncDispose]: async () => {
        this.events.push("dispose");
        signal?.removeEventListener("abort", abort);
        lifetime.abort(new Error("Screenshot connection disposed"));
      },
    };
  }
}

const screenshotClientId = ClientId.serialize("screenshot-device", 8901);

test(
  "screenshot waits for a CDP frame acknowledgement response before closing the connection",
  { timeout: 2_000 },
  async () => {
    const transport = new DelayedScreenshotTransport();
    const capture = captureScreenshotFrame(new Connector([transport]), screenshotClientId, 5);
    void capture.catch(() => {});
    try {
      await transport.acknowledgementStarted.promise;
      await nextTurn();
      assert.deepEqual(transport.events, ["ack-started"]);
      transport.acknowledgement.resolve(undefined);
      await transport.acknowledgementWritten.promise;
      await nextTurn();
      assert.equal(transport.events.includes("dispose"), false);
      transport.respondToAcknowledgement();
      assert.equal((await capture).data, "captured-frame");
      assert.deepEqual(transport.events.filter(event => event !== "cancel"), [
        "ack-started",
        "ack-written",
        "ack-response",
        "dispose",
        "stop",
        "dispose",
      ]);
      assert.deepEqual(transport.methods, ["Page.startScreencast", "Page.screencastFrameAck", "Page.stopScreencast"]);
    } finally {
      transport.acknowledgement.resolve(undefined);
      if (!transport.events.includes("dispose")) transport.respondToAcknowledgement();
      await capture.catch(() => {});
    }
  },
);

test("screenshot preserves an acknowledgement write failure after receiving a frame", { timeout: 2_000 }, async () => {
  const transport = new DelayedScreenshotTransport();
  const failure = new Error("Acknowledgement write failed");
  const capture = captureScreenshotFrame(new Connector([transport]), screenshotClientId, 5);
  const rejected = assert.rejects(capture, error => error === failure);
  await transport.acknowledgementStarted.promise;
  transport.acknowledgement.resolve(failure);
  await rejected;
  assert.equal(transport.events.includes("stop"), true);
  assert.equal(transport.events.filter(event => event === "dispose").length, 2);
});

test("screenshot reports a CDP frame acknowledgement error", { timeout: 2_000 }, async () => {
  const transport = new DelayedScreenshotTransport();
  const capture = captureScreenshotFrame(new Connector([transport]), screenshotClientId, 5);
  await transport.acknowledgementStarted.promise;
  transport.acknowledgement.resolve(undefined);
  await transport.acknowledgementWritten.promise;
  transport.respondToAcknowledgement({ code: -32000, message: "ack rejected" });

  await assert.rejects(capture, error => error instanceof Error && error.message === "CDP request error: ack rejected");
  assert.equal(transport.events.includes("stop"), true);
});

test(
  "screenshot times out when the runtime does not respond to the frame acknowledgement",
  { timeout: 2_000 },
  async () => {
    const transport = new DelayedScreenshotTransport();
    const capture = captureScreenshotFrame(new Connector([transport]), screenshotClientId, 5, { timeoutMs: 50 });
    await transport.acknowledgementStarted.promise;
    transport.acknowledgement.resolve(undefined);
    await transport.acknowledgementWritten.promise;

    await assert.rejects(
      capture,
      error => error instanceof ScreenshotTimeoutError && /acknowledgement was not confirmed/u.test(error.message),
    );
    assert.equal(transport.events.includes("ack-response"), false);
    assert.equal(transport.events.includes("stop"), true);
  },
);

test("screenshot cancellation interrupts a pending acknowledgement and stops casting", { timeout: 2_000 }, async () => {
  const transport = new DelayedScreenshotTransport();
  const controller = new AbortController();
  const reason = new Error("Screenshot caller canceled");
  const capture = captureScreenshotFrame(new Connector([transport]), screenshotClientId, 5, {
    signal: controller.signal,
  });
  const rejected = assert.rejects(capture, error => error === reason);
  await transport.acknowledgementStarted.promise;
  controller.abort(reason);
  await rejected;
  assert.equal(transport.events.includes("ack-written"), false);
  assert.equal(transport.events.includes("stop"), true);
  assert.equal(transport.events.filter(event => event === "dispose").length, 2);
});

test("screenshot timeout interrupts a pending acknowledgement with its phase", { timeout: 2_000 }, async () => {
  const transport = new DelayedScreenshotTransport();
  const capture = captureScreenshotFrame(new Connector([transport]), screenshotClientId, 5, { timeoutMs: 50 });
  await assert.rejects(
    capture,
    error => error instanceof ScreenshotTimeoutError && /acknowledgement was not confirmed/u.test(error.message),
  );
  assert.equal(transport.events.includes("ack-written"), false);
  assert.equal(transport.events.includes("stop"), true);
  assert.equal(transport.events.filter(event => event === "dispose").length, 2);
});
