// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Connector } from '@lynx-js/devtool-connector';

export async function getFirstClient(connector: Connector): Promise<string> {
  const clients = await connector.listClients();
  const firstClient = clients[0];
  if (!firstClient) {
    throw new Error('No available clients found.');
  }
  return firstClient.id;
}

export async function getFirstSession(
  connector: Connector,
  clientId: string,
): Promise<string> {
  const sessions = await connector.sendListSessionMessage(clientId);
  const firstSession = sessions[0];
  if (!firstSession) {
    throw new Error(`No available sessions found for client: ${clientId}`);
  }
  return String(firstSession.session_id);
}
