export class WasmBridge {
  constructor(wasmBinary: Uint8Array);
  initialize(port: MessagePort): void;
}
