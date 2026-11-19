// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Preserve the original scene markup; scenario data is filled by the controller.
export const markup = String.raw`
<div id="simulator-demo">
<div class="workspace">
<svg aria-hidden="true" class="connections">
<g id="connection-paths"></g>
</svg>
<section aria-label="Agent 示例对话" class="conversation">
<header class="conv-header">
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z">
</path>
</svg><span>示例对话</span><span class="conv-meta"></span>
</header>
<div class="conversation-body">
<div class="user-bubble"></div>
<div class="agent-line">
<span aria-hidden="true" class="agent-mark"><svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M12 19h8"></path>
<path d="m4 17 6-6-6-6"></path>
</svg></span>Agent
            </div>
<div class="exchanges"></div>
<p class="agent-report"></p>
</div>
</section>
<section aria-label="当前工具调用的详情" class="detail">
<header class="detail-header">
<span id="detail-title"></span><span class="detail-index" id="detail-index"></span>
</header>
<div aria-label="macOS 桌面与已启动的 Lynx Simulator" class="scene scene-dock" data-scene-kind="run" hidden="">
<div class="mac-desktop">
<div class="desktop-menubar">
<strong>Lynx Simulator</strong><span>File</span><span>Edit</span><span>View</span><span class="desktop-time">本地运行</span>
</div>
<div class="desktop-orbit">
<div aria-hidden="true" class="runtime-icon large"></div>
<div class="launched-title">Lynx Simulator 已启动</div>
</div>
<div aria-label="macOS Dock" class="dock">
<div aria-hidden="true" class="app-placeholder">
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z">
</path>
</svg>
</div>
<div aria-hidden="true" class="app-placeholder">
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M12 19h8"></path>
<path d="m4 17 6-6-6-6"></path>
</svg>
</div>
<div aria-hidden="true" class="app-placeholder">
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<rect height="16" rx="2" width="20" x="2" y="4"></rect>
<path d="M10 4v4"></path>
<path d="M2 8h20"></path>
<path d="M6 4v4"></path>
</svg>
</div>
<div aria-hidden="true" class="app-placeholder">
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z">
</path>
<path d="M14 2v5a1 1 0 0 0 1 1h5"></path>
<path d="M10 9H8"></path>
<path d="M16 13H8"></path>
<path d="M16 17H8"></path>
</svg>
</div>
<div class="runtime-wrap">
<div aria-label="Lynx Simulator 已启动" class="runtime-icon" data-target="runtime">
</div>
<span class="dock-tip">Lynx Simulator</span>
</div>
</div>
</div>
</div>
<div class="scene scene-editor" data-scene-kind="prepare" hidden="">
<div class="editor-window">
<div class="editor-titlebar">
<div aria-hidden="true" class="traffic">
<span></span><span></span><span></span>
</div>
<span class="editor-title"></span><svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<rect height="18" rx="2" width="18" x="3" y="3"></rect>
<path d="M9 3v18"></path>
</svg>
</div>
<div class="editor-body">
<div aria-hidden="true" class="activity-bar">
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8">
</path>
<path d="M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z">
</path>
<path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1">
</path>
</svg>
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="m21 21-4.34-4.34"></path>
<circle cx="11" cy="11" r="8"></circle>
</svg>
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M15 6a9 9 0 0 0-9 9V3"></path>
<circle cx="18" cy="6" r="3"></circle>
<circle cx="6" cy="18" r="3"></circle>
</svg>
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915">
</path>
<circle cx="12" cy="12" r="3"></circle>
</svg>
</div>
<div class="editor-main">
<div class="explorer-heading">
<span>EXPLORER</span><svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="1"></circle>
<circle cx="19" cy="12" r="1"></circle>
<circle cx="5" cy="12" r="1"></circle>
</svg>
</div>
<div class="file-tree"></div>
<div class="editor-code">
<div class="editor-tabs">
<span class="editor-tab"><span class="type-ts" id="editor-tab-type">TS</span><span id="editor-tab-name"></span><svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M18 6 6 18"></path>
<path d="m6 6 12 12"></path>
</svg></span>
</div>
<div class="code-peek" id="code-peek"></div>
</div>
</div>
</div>
<div class="editor-status">
<span class="editor-branch"></span><span id="editor-language">TypeScript</span>
</div>
</div>
</div>
<div class="scene scene-env" data-scene-kind="env" hidden="">
<div class="editor-window env-editor">
<div class="editor-titlebar">
<div aria-hidden="true" class="traffic">
<span></span><span></span><span></span>
</div><span class="editor-title"></span><svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<rect height="18" rx="2" width="18" x="3" y="3"></rect>
<path d="M9 3v18"></path>
</svg>
</div>
<div class="editor-tabs">
<span class="editor-tab"><span class="type-js">JS</span><span>page-env.mjs</span><svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M18 6 6 18"></path>
<path d="m6 6 12 12"></path>
</svg></span>
</div>
<div aria-label="page-env.mjs 示例节选" class="env-code"></div>
<div class="editor-status">
<span class="editor-branch"></span><span>JavaScript ·
                  节选</span>
</div>
</div>
</div>
<div class="scene scene-open" data-scene-kind="open" hidden="">
<div class="page-window">
<div class="window-bar" data-target="open">
<div aria-hidden="true" class="traffic">
<span></span><span></span><span></span>
</div>
<span class="window-title">Lynx Simulator</span>
</div>
<div class="page-screen">
<img class="page-image" height="1500" width="780"/><span class="page-spot score" data-target="score"></span><span class="page-spot progress" data-target="progress"></span>
</div>
</div>
</div>
<div aria-label="Snapshot 树形结构节选" class="scene scene-snapshot" data-scene-kind="snapshot" hidden="">
<div class="snapshot-panel">
<header class="snapshot-panel-heading">
<svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M12 19h8"></path>
<path d="m4 17 6-6-6-6"></path>
</svg><span>agent-lynx snapshot</span>
</header>
<div aria-label="页面 Snapshot" class="snapshot-scroll" id="snapshot-scroll" tabindex="0">
<div class="snapshot" id="snapshot"></div>
</div>
<footer class="snapshot-footer">
<span id="snapshot-note"></span><button aria-controls="snapshot" aria-expanded="false" id="toggle-snapshot" type="button">
                  查看完整快照
                </button>
</footer>
</div>
</div>
</section>
</div>
<p class="media-error" hidden="" id="asset-message" role="status">
        图片暂时未加载。<button id="retry-assets" type="button">
          重新加载
        </button>
</p>
<span aria-live="polite" class="screen-reader" id="step-announcement">正在查看第三步：打开BankCards 页面。</span>
</div>
<template id="step-template"><div class="exchange">
<p class="assistant-prose"></p>
<article class="call" data-step="1">
<button aria-controls="call-body-1" aria-expanded="false" class="call-select" data-select-step="1" type="button">
<span class="step-icon"></span><span class="command-label"></span><span class="call-check"><svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M20 6 9 17l-5-5"></path>
</svg></span><svg aria-hidden="true" class="icon chevron" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="m9 18 6-6-6-6"></path>
</svg>
</button>
<div class="call-content" hidden="" id="call-body-1"></div>
</article>
</div></template><template id="step-icon-0"><svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="M12 19h8"></path>
<path d="m4 17 6-6-6-6"></path>
</svg></template><template id="step-icon-1"><svg aria-hidden="true" class="icon" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
<path d="m21 21-4.34-4.34"></path>
<circle cx="11" cy="11" r="8"></circle>
</svg></template>
`;
