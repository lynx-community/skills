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

export async function getLatestSession(
  connector: Connector,
  clientId: string,
): Promise<string> {
  const sessions = await connector.sendListSessionMessage(clientId);
  if (!sessions || sessions.length === 0) {
    throw new Error(`No available sessions found for client: ${clientId}`);
  }
  const latestSession = sessions.reduce((max, session) =>
    session.session_id > max.session_id ? session : max,
  );
  return String(latestSession.session_id);
}
