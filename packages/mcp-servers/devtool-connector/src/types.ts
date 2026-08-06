// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

type Event<E extends string, D> = {
  event: E;
  data: D;
};

type CustomizedEvent<TType extends string, TData> = Event<
  'Customized',
  {
    type: TType;
    data: TData;
    /**
     * Optional request-response correlation id.
     *
     * When a request carries an `id`, the response echoes it back so the caller
     * can match which response belongs to which request — similar to how CDP
     * uses `id`.
     *
     * @see https://github.com/lynx-family/debug-router/issues/162
     */
    id?: number;
  }
>;

export type AppInfo = {
  App: string;
  AppVersion: string;
  /** Android only */
  AppProcessName?: string;
  /** iOS only */
  bundleId?: string;
  /** OpenHarmony only */
  bundleName?: string;
  debugRouterId: string;
  debugRouterVersion: string;
  deviceModel: string;
  did?: string;
  network: string;
  osVersion: string;
  sdkVersion: string;
  osType?: string;
};
export type InitializeRequest = Event<'Initialize', number>;
export type InitializeResponse = Event<
  'Register',
  {
    id: number;
    info: AppInfo;
  }
>;

export type AppResponse = CustomizedEvent<
  'App',
  {
    /** JSON string. See {@link AppResponseMessage} for parsed result. */
    message: string;
  }
>;
export type AppResponseMessage = {
  id: number;
  /** JSON string */
  result: string;
};
export type CDPRequestMessage<T = unknown> = {
  method: string;
  params?: T | undefined;
};
export type CDPRequest = CustomizedEvent<
  'CDP',
  {
    client_id: number;
    session_id: number;
    message: CDPRequestMessage & { id: number };
  }
>;
export type CDPResponse = CustomizedEvent<
  'CDP',
  {
    /** JSON string. See {@link CDPResponseMessage} for parsed result. */
    message: string;
  }
>;
export type CDPResponseMessage = { id: number } & (
  | { result: unknown }
  | { error: { code: number; message: string } }
);

export type Session = {
  session_id: number;
  type: '' | 'lynx' | 'web';
  url: string;
  /**
   * Headless (embedded-lynx) runtime metadata, present only for sessions
   * served by the headless client. Each session is backed by a dedicated
   * renderer child process; `pid`/`logFile` let callers inspect or stop it
   * (e.g. `kill <pid>`).
   */
  headless?: {
    pid?: number;
    logFile: string;
  };
};
export type ListSessionRequest = CustomizedEvent<
  'ListSession',
  Record<string, never>
>;
export type ListSessionResponse = CustomizedEvent<'SessionList', Session[]>;

/**
 * Readiness probe for the headless (embedded-lynx) runtime. The headless
 * transport downloads its binary lazily on first use; this lets the caller
 * poll for readiness and drive the (potentially long) download with its own
 * timeout instead of a single request that could be cut off.
 */
export type HeadlessPrepareState = {
  status: 'ready' | 'preparing' | 'error';
  message?: string;
};
export type HeadlessPrepareRequest = CustomizedEvent<
  'HeadlessPrepare',
  Record<string, never>
>;
export type HeadlessPrepareResponse = CustomizedEvent<
  'HeadlessPrepare',
  HeadlessPrepareState
>;

// See: https://github.com/lynx-family/lynx/blob/f36190e701964032d92e70e9515538497460ea31/platform/android/lynx_android/src/main/java/com/lynx/devtoolwrapper/DevToolSettings.java#L31-L44
export type GlobalKeys =
  | 'enable_devtool'
  | 'enable_logbox'
  | 'enable_debug_mode'
  | 'enable_dom_tree'
  | 'enable_quickjs_debug'
  | 'enable_quickjs_cache'
  | 'enable_v8'
  | 'enable_cdp_domain_dom'
  | 'enable_cdp_domain_css'
  | 'enable_cdp_domain_page'
  | 'enable_long_press_menu'
  | 'enable_highlight_touch'
  | 'enable_preview_screen_shot'
  | 'enable_pixel_copy'
  | 'enable_fsp_screenshot';
export type GetGlobalSwitchRequest = CustomizedEvent<
  'GetGlobalSwitch',
  {
    client_id: number;
    session_id: number;
    message: { global_key: GlobalKeys };
  }
>;
export type GetGlobalSwitchResponse = CustomizedEvent<
  'GetGlobalSwitch',
  {
    client_id: number;
    session_id: number;
    message: string | boolean | { global_value: string | boolean };
  }
>;
export type SetGlobalSwitchRequest = CustomizedEvent<
  'SetGlobalSwitch',
  {
    client_id: number;
    session_id: number;
    message: { global_key: GlobalKeys; global_value: boolean };
  }
>;
export type SetGlobalSwitchResponse = CustomizedEvent<
  'SetGlobalSwitch',
  {
    client_id: number;
    session_id: number;
    /** JSON string */
    message: string;
  }
>;

export type CustomizedResponseMap = {
  App: AppResponse;
  CDP: CDPResponse;
};
export type CustomizedResponseMessageMap = {
  App: AppResponseMessage;
  CDP: CDPResponseMessage;
};

export type Response =
  | InitializeResponse
  | ListSessionResponse
  | AppResponse
  | CDPResponse
  | GetGlobalSwitchResponse
  | SetGlobalSwitchResponse
  | HeadlessPrepareResponse;

export function isInitializeResponse(
  response: Response,
): response is InitializeResponse {
  return response.event === 'Register';
}

export function isHeadlessPrepareResponse(
  response: Response,
): response is HeadlessPrepareResponse {
  return (
    response.event === 'Customized' && response.data.type === 'HeadlessPrepare'
  );
}

export function isListSessionResponse(
  response: Response,
): response is ListSessionResponse {
  return (
    response.event === 'Customized' && response.data.type === 'SessionList'
  );
}

/**
 * Create a type guard that accepts a Customized response only when its `id`
 * correlates with the given request `id`.
 *
 * Correlation rules (matching CDP id semantics):
 * 1. Response has NO `id` field → accept (old SDK that doesn't support id yet)
 * 2. Response `id` matches our request `id` → accept (our response)
 * 3. Response `id` is -1 → reject (response to a request without id from another old client)
 * 4. Response `id` is a different positive number → reject (response to another client's request)
 *
 * @param baseFilter - A type guard to check the response type (e.g. isListSessionResponse)
 * @param requestId - The id we sent in the request
 *
 * @example
 * ```ts
 * // For ListSession:
 * new FilterTransformStream(createCorrelatedFilter(isListSessionResponse, id))
 * // For GetGlobalSwitch (future):
 * new FilterTransformStream(createCorrelatedFilter(isGetGlobalSwitchResponse, id))
 * ```
 *
 * @see https://github.com/lynx-family/debug-router/issues/162
 */
export function createCorrelatedFilter<T extends Response>(
  baseFilter: (response: Response) => response is T,
  requestId: number,
): (response: Response) => response is T {
  return (response: Response): response is T => {
    if (!baseFilter(response)) return false;
    // Only Customized events carry the id field
    if (response.event !== 'Customized') return true;
    const responseId = (response.data as { id?: number }).id;
    // Case 1: old SDK, no id in response — accept
    if (responseId === undefined) return true;
    // Case 2: our id echoed back — accept
    // Case 3 & 4: different id (including -1) — reject
    return responseId === requestId;
  };
}

export function isGetGlobalSwitchResponse(
  response: Response,
): response is GetGlobalSwitchResponse {
  return (
    response.event === 'Customized' && response.data.type === 'GetGlobalSwitch'
  );
}

export function isSetGlobalSwitchResponse(
  response: Response,
): response is SetGlobalSwitchResponse {
  return (
    response.event === 'Customized' && response.data.type === 'SetGlobalSwitch'
  );
}

export function isCustomizedResponseWithType<
  T extends keyof CustomizedResponseMap,
>(response: Response, type: T): response is CustomizedResponseMap[T] {
  return response.event === 'Customized' && response.data.type === type;
}
