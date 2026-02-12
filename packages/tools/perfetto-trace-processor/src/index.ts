// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { readFileSync } from 'node:fs';
import type { EngineMode } from '../vendor/perfetto/engine.js';
import { EngineBase } from '../vendor/perfetto/engine.js';
import { WasmBridge } from '../vendor/perfetto/wasm_bridge.js';

export class WasmEngine extends EngineBase {
  mode: EngineMode = 'WASM';
  id: string;
  declare port: MessagePort;
  declare [Symbol.dispose]: () => void;

  constructor(id: string, { wasmBinary }: { wasmBinary?: Uint8Array } = {}) {
    super();
    this.id = id;
    const wasmBridge = new WasmBridge(
      wasmBinary ??
        new Uint8Array(
          readFileSync(
            new URL('../vendor/perfetto/trace_processor.wasm', import.meta.url),
          ),
        ),
    );
    const channel = new MessageChannel();
    const { port1, port2 } = channel;
    wasmBridge.initialize(port1);
    this.port = port2;
    this.port.onmessage = this.onMessage.bind(this);
    this[Symbol.dispose] = () => {
      port1.close();
    };
  }
  onMessage(m: MessageEvent<unknown>) {
    if (m.data instanceof Uint8Array) {
      super.onRpcResponseBytes(m.data);
    } else {
      throw new Error('Unknown message type');
    }
  }
  rpcSendRequestBytes(data: Uint8Array) {
    this.port.postMessage(data);
  }
}

export type * from '../vendor/perfetto/engine.js';
