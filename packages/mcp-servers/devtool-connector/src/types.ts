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
  }
>;

export type AppInfo = {
  App: string;
  AppVersion: string;
  /** Android only */
  AppProcessName?: string;
  /** iOS only */
  bundleId?: string;
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

export type XdbJsbRequest = CustomizedEvent<
  'xdb_jsb',
  {
    client_id: number;
    session_id: number;
    message: { type: string };
  }
>;

export type XdbJsbResponse = CustomizedEvent<
  'xdb_jsb',
  {
    client_id: number;
    session_id: number;
    /** JSON string */
    message: string;
  }
>;

export type XdbGlobalPropsRequest = CustomizedEvent<
  'xdb_globalprops',
  {
    client_id: number;
    session_id: number;
    message: { type: string; timestamp: string };
  }
>;

export type XdbGlobalPropsResponse = CustomizedEvent<
  'xdb_globalprops',
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
  xdb_jsb: XdbJsbResponse;
  xdb_globalprops: XdbGlobalPropsResponse;
};
export type CustomizedResponseMessageMap = {
  App: AppResponseMessage;
  CDP: CDPResponseMessage;
  xdb_jsb: unknown;
  xdb_globalprops: unknown;
};

export type Response =
  | InitializeResponse
  | ListSessionResponse
  | AppResponse
  | CDPResponse
  | GetGlobalSwitchResponse
  | SetGlobalSwitchResponse
  | XdbJsbResponse
  | XdbGlobalPropsResponse
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
