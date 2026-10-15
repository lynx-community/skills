// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from 'zod';
import { clientId, sessionId, x, y } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';

const type = z.enum(['mousePressed', 'mouseReleased', 'mouseMoved'])
  .describe(
    'Gesture phase: mousePressed starts a touch, mouseMoved moves a pressed touch, and mouseReleased ends it.',
  );
const timestamp = z.number().describe(
  'Event timestamp in milliseconds since the Unix epoch, as returned by Date.now().',
);
const button = z.enum(['left', 'middle', 'right']).describe('Mouse button');
const deltaX = z.number().optional().describe(
  'Horizontal scroll delta (optional)',
);
const deltaY = z.number().optional().describe(
  'Vertical scroll delta (optional)',
);

export const EmulateTouchFromMouseEvent = defineTool({
  name: 'Input_emulateTouchFromMouseEvent',
  description:
    'Send one touch gesture event to a Lynx page. For a tap, send mousePressed then mouseReleased at the same coordinates with button left, using the same clientId and sessionId. For a drag, send mouseMoved events between press and release. Send events sequentially with nondecreasing timestamps; after a press, attempt release even if a later gesture step fails. Get coordinates from DOM_getBoxModel and validate the target with DOM_getNodeForLocation before pressing.',
  annotations: {
    readOnlyHint: false,
  },
  schema: {
    clientId,
    sessionId,
    type,
    x: x.describe(
      'Horizontal coordinate in CDP logical units, in the same coordinate space as DOM_getBoxModel and DOM_getNodeForLocation. Screenshot pixels are not interchangeable.',
    ),
    y: y.describe(
      'Vertical coordinate in CDP logical units, in the same coordinate space as DOM_getBoxModel and DOM_getNodeForLocation. Screenshot pixels are not interchangeable.',
    ),
    timestamp,
    button,
    deltaX,
    deltaY,
  },
  async handler(
    {
      params: {
        clientId,
        sessionId,
        type,
        x,
        y,
        timestamp,
        button,
        deltaX,
        deltaY,
      },
    },
    response,
    context,
  ) {
    const connector = context.connector();

    const result = await connector.sendCDPMessage(
      clientId,
      sessionId,
      'Input.emulateTouchFromMouseEvent',
      {
        type,
        x,
        y,
        timestamp,
        button,
        deltaX,
        deltaY,
      },
    );

    response.appendLines(JSON.stringify(result));
  },
});
