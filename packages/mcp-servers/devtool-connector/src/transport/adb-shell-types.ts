// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { AdbShellProtocolSubprocessService } from "@yume-chan/adb";

/**
 * @yume-chan/adb 3.0.0-beta.2 removes these internal aliases from shared.d.ts
 * while its public service.d.ts still imports them. Derive the missing types
 * from the unchanged public signatures without altering the upstream classes.
 * Remove this compatibility declaration when the pinned upstream release fixes it.
 *
 * Upstream reference (MIT):
 * https://github.com/yume-chan/ya-webadb/blob/main/libraries/adb/src/service/subprocess/shell/shared.ts
 */
declare module "@yume-chan/adb/esm/service/subprocess/shell/shared.js" {
  export type AdbShellProtocolId =
    (typeof AdbShellProtocolSubprocessService.PacketId)[keyof typeof AdbShellProtocolSubprocessService.PacketId];
  export type AdbShellProtocolPacket = Awaited<ReturnType<typeof AdbShellProtocolSubprocessService.Packet.deserialize>>;
}
