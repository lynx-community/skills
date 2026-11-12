#!/usr/bin/env node
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/*!
 * Bundled third-party software notices:
 *
 * --- acorn (MIT) ---
 * MIT License
 *
 * Copyright (C) 2012-2022 by various contributors (see AUTHORS)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * --- eslint-scope (BSD-2-Clause) ---
 * Copyright JS Foundation and other contributors, https://js.foundation
 * Copyright (C) 2012-2013 Yusuke Suzuki (twitter: @Constellation) and other contributors.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * --- estraverse & esrecurse (BSD-2-Clause) ---
 * Copyright (C) 2012-2014 Yusuke Suzuki <utatane.tea@gmail.com>
 * Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
var __webpack_modules__ = {};
var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (void 0 !== cachedModule) return cachedModule.exports;
    var module = __webpack_module_cache__[moduleId] = {
        exports: {}
    };
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
}
__webpack_require__.m = __webpack_modules__;
(()=>{
    __webpack_require__.add = function(modules) {
        Object.assign(__webpack_require__.m, modules);
    };
})();
__webpack_require__.add({
    "../../../node_modules/.pnpm/esrecurse@4.3.0/node_modules/esrecurse/esrecurse.js" (__unused_rspack_module, exports, __webpack_require__) {
        (function() {
            'use strict';
            var estraverse = __webpack_require__("../../../node_modules/.pnpm/estraverse@5.3.0/node_modules/estraverse/estraverse.js");
            function isNode(node) {
                if (null == node) return false;
                return 'object' == typeof node && 'string' == typeof node.type;
            }
            function isProperty(nodeType, key) {
                return (nodeType === estraverse.Syntax.ObjectExpression || nodeType === estraverse.Syntax.ObjectPattern) && 'properties' === key;
            }
            function Visitor(visitor, options) {
                options = options || {};
                this.__visitor = visitor || this;
                this.__childVisitorKeys = options.childVisitorKeys ? Object.assign({}, estraverse.VisitorKeys, options.childVisitorKeys) : estraverse.VisitorKeys;
                if ('iteration' === options.fallback) this.__fallback = Object.keys;
                else if ('function' == typeof options.fallback) this.__fallback = options.fallback;
            }
            Visitor.prototype.visitChildren = function(node) {
                var type, children, i, iz, j, jz, child;
                if (null == node) return;
                type = node.type || estraverse.Syntax.Property;
                children = this.__childVisitorKeys[type];
                if (!children) if (this.__fallback) children = this.__fallback(node);
                else throw new Error('Unknown node type ' + type + '.');
                for(i = 0, iz = children.length; i < iz; ++i){
                    child = node[children[i]];
                    if (child) {
                        if (Array.isArray(child)) {
                            for(j = 0, jz = child.length; j < jz; ++j)if (child[j]) {
                                if (isNode(child[j]) || isProperty(type, children[i])) this.visit(child[j]);
                            }
                        } else if (isNode(child)) this.visit(child);
                    }
                }
            };
            Visitor.prototype.visit = function(node) {
                var type;
                if (null == node) return;
                type = node.type || estraverse.Syntax.Property;
                if (this.__visitor[type]) return void this.__visitor[type].call(this, node);
                this.visitChildren(node);
            };
            __webpack_require__("../../../node_modules/.pnpm/esrecurse@4.3.0/node_modules/esrecurse/package.json");
            exports.le = Visitor;
        })();
    },
    "../../../node_modules/.pnpm/estraverse@5.3.0/node_modules/estraverse/estraverse.js" (__unused_rspack_module, exports) {
        (function clone(exports) {
            'use strict';
            var Syntax, VisitorOption, VisitorKeys, BREAK, SKIP, REMOVE;
            function deepCopy(obj) {
                var ret = {}, key, val;
                for(key in obj)if (obj.hasOwnProperty(key)) {
                    val = obj[key];
                    if ('object' == typeof val && null !== val) ret[key] = deepCopy(val);
                    else ret[key] = val;
                }
                return ret;
            }
            function upperBound(array, func) {
                var diff, len, i, current;
                len = array.length;
                i = 0;
                while(len){
                    diff = len >>> 1;
                    current = i + diff;
                    if (func(array[current])) len = diff;
                    else {
                        i = current + 1;
                        len -= diff + 1;
                    }
                }
                return i;
            }
            Syntax = {
                AssignmentExpression: 'AssignmentExpression',
                AssignmentPattern: 'AssignmentPattern',
                ArrayExpression: 'ArrayExpression',
                ArrayPattern: 'ArrayPattern',
                ArrowFunctionExpression: 'ArrowFunctionExpression',
                AwaitExpression: 'AwaitExpression',
                BlockStatement: 'BlockStatement',
                BinaryExpression: 'BinaryExpression',
                BreakStatement: 'BreakStatement',
                CallExpression: 'CallExpression',
                CatchClause: 'CatchClause',
                ChainExpression: 'ChainExpression',
                ClassBody: 'ClassBody',
                ClassDeclaration: 'ClassDeclaration',
                ClassExpression: 'ClassExpression',
                ComprehensionBlock: 'ComprehensionBlock',
                ComprehensionExpression: 'ComprehensionExpression',
                ConditionalExpression: 'ConditionalExpression',
                ContinueStatement: 'ContinueStatement',
                DebuggerStatement: 'DebuggerStatement',
                DirectiveStatement: 'DirectiveStatement',
                DoWhileStatement: 'DoWhileStatement',
                EmptyStatement: 'EmptyStatement',
                ExportAllDeclaration: 'ExportAllDeclaration',
                ExportDefaultDeclaration: 'ExportDefaultDeclaration',
                ExportNamedDeclaration: 'ExportNamedDeclaration',
                ExportSpecifier: 'ExportSpecifier',
                ExpressionStatement: 'ExpressionStatement',
                ForStatement: 'ForStatement',
                ForInStatement: 'ForInStatement',
                ForOfStatement: 'ForOfStatement',
                FunctionDeclaration: 'FunctionDeclaration',
                FunctionExpression: 'FunctionExpression',
                GeneratorExpression: 'GeneratorExpression',
                Identifier: 'Identifier',
                IfStatement: 'IfStatement',
                ImportExpression: 'ImportExpression',
                ImportDeclaration: 'ImportDeclaration',
                ImportDefaultSpecifier: 'ImportDefaultSpecifier',
                ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
                ImportSpecifier: 'ImportSpecifier',
                Literal: 'Literal',
                LabeledStatement: 'LabeledStatement',
                LogicalExpression: 'LogicalExpression',
                MemberExpression: 'MemberExpression',
                MetaProperty: 'MetaProperty',
                MethodDefinition: 'MethodDefinition',
                ModuleSpecifier: 'ModuleSpecifier',
                NewExpression: 'NewExpression',
                ObjectExpression: 'ObjectExpression',
                ObjectPattern: 'ObjectPattern',
                PrivateIdentifier: 'PrivateIdentifier',
                Program: 'Program',
                Property: 'Property',
                PropertyDefinition: 'PropertyDefinition',
                RestElement: 'RestElement',
                ReturnStatement: 'ReturnStatement',
                SequenceExpression: 'SequenceExpression',
                SpreadElement: 'SpreadElement',
                Super: 'Super',
                SwitchStatement: 'SwitchStatement',
                SwitchCase: 'SwitchCase',
                TaggedTemplateExpression: 'TaggedTemplateExpression',
                TemplateElement: 'TemplateElement',
                TemplateLiteral: 'TemplateLiteral',
                ThisExpression: 'ThisExpression',
                ThrowStatement: 'ThrowStatement',
                TryStatement: 'TryStatement',
                UnaryExpression: 'UnaryExpression',
                UpdateExpression: 'UpdateExpression',
                VariableDeclaration: 'VariableDeclaration',
                VariableDeclarator: 'VariableDeclarator',
                WhileStatement: 'WhileStatement',
                WithStatement: 'WithStatement',
                YieldExpression: 'YieldExpression'
            };
            VisitorKeys = {
                AssignmentExpression: [
                    'left',
                    'right'
                ],
                AssignmentPattern: [
                    'left',
                    'right'
                ],
                ArrayExpression: [
                    'elements'
                ],
                ArrayPattern: [
                    'elements'
                ],
                ArrowFunctionExpression: [
                    'params',
                    'body'
                ],
                AwaitExpression: [
                    'argument'
                ],
                BlockStatement: [
                    'body'
                ],
                BinaryExpression: [
                    'left',
                    'right'
                ],
                BreakStatement: [
                    'label'
                ],
                CallExpression: [
                    'callee',
                    'arguments'
                ],
                CatchClause: [
                    'param',
                    'body'
                ],
                ChainExpression: [
                    'expression'
                ],
                ClassBody: [
                    'body'
                ],
                ClassDeclaration: [
                    'id',
                    'superClass',
                    'body'
                ],
                ClassExpression: [
                    'id',
                    'superClass',
                    'body'
                ],
                ComprehensionBlock: [
                    'left',
                    'right'
                ],
                ComprehensionExpression: [
                    'blocks',
                    'filter',
                    'body'
                ],
                ConditionalExpression: [
                    'test',
                    'consequent',
                    'alternate'
                ],
                ContinueStatement: [
                    'label'
                ],
                DebuggerStatement: [],
                DirectiveStatement: [],
                DoWhileStatement: [
                    'body',
                    'test'
                ],
                EmptyStatement: [],
                ExportAllDeclaration: [
                    'source'
                ],
                ExportDefaultDeclaration: [
                    'declaration'
                ],
                ExportNamedDeclaration: [
                    'declaration',
                    'specifiers',
                    'source'
                ],
                ExportSpecifier: [
                    'exported',
                    'local'
                ],
                ExpressionStatement: [
                    'expression'
                ],
                ForStatement: [
                    'init',
                    'test',
                    'update',
                    'body'
                ],
                ForInStatement: [
                    'left',
                    'right',
                    'body'
                ],
                ForOfStatement: [
                    'left',
                    'right',
                    'body'
                ],
                FunctionDeclaration: [
                    'id',
                    'params',
                    'body'
                ],
                FunctionExpression: [
                    'id',
                    'params',
                    'body'
                ],
                GeneratorExpression: [
                    'blocks',
                    'filter',
                    'body'
                ],
                Identifier: [],
                IfStatement: [
                    'test',
                    'consequent',
                    'alternate'
                ],
                ImportExpression: [
                    'source'
                ],
                ImportDeclaration: [
                    'specifiers',
                    'source'
                ],
                ImportDefaultSpecifier: [
                    'local'
                ],
                ImportNamespaceSpecifier: [
                    'local'
                ],
                ImportSpecifier: [
                    'imported',
                    'local'
                ],
                Literal: [],
                LabeledStatement: [
                    'label',
                    'body'
                ],
                LogicalExpression: [
                    'left',
                    'right'
                ],
                MemberExpression: [
                    'object',
                    'property'
                ],
                MetaProperty: [
                    'meta',
                    'property'
                ],
                MethodDefinition: [
                    'key',
                    'value'
                ],
                ModuleSpecifier: [],
                NewExpression: [
                    'callee',
                    'arguments'
                ],
                ObjectExpression: [
                    'properties'
                ],
                ObjectPattern: [
                    'properties'
                ],
                PrivateIdentifier: [],
                Program: [
                    'body'
                ],
                Property: [
                    'key',
                    'value'
                ],
                PropertyDefinition: [
                    'key',
                    'value'
                ],
                RestElement: [
                    'argument'
                ],
                ReturnStatement: [
                    'argument'
                ],
                SequenceExpression: [
                    'expressions'
                ],
                SpreadElement: [
                    'argument'
                ],
                Super: [],
                SwitchStatement: [
                    'discriminant',
                    'cases'
                ],
                SwitchCase: [
                    'test',
                    'consequent'
                ],
                TaggedTemplateExpression: [
                    'tag',
                    'quasi'
                ],
                TemplateElement: [],
                TemplateLiteral: [
                    'quasis',
                    'expressions'
                ],
                ThisExpression: [],
                ThrowStatement: [
                    'argument'
                ],
                TryStatement: [
                    'block',
                    'handler',
                    'finalizer'
                ],
                UnaryExpression: [
                    'argument'
                ],
                UpdateExpression: [
                    'argument'
                ],
                VariableDeclaration: [
                    'declarations'
                ],
                VariableDeclarator: [
                    'id',
                    'init'
                ],
                WhileStatement: [
                    'test',
                    'body'
                ],
                WithStatement: [
                    'object',
                    'body'
                ],
                YieldExpression: [
                    'argument'
                ]
            };
            BREAK = {};
            SKIP = {};
            REMOVE = {};
            VisitorOption = {
                Break: BREAK,
                Skip: SKIP,
                Remove: REMOVE
            };
            function Reference(parent, key) {
                this.parent = parent;
                this.key = key;
            }
            Reference.prototype.replace = function(node) {
                this.parent[this.key] = node;
            };
            Reference.prototype.remove = function() {
                if (Array.isArray(this.parent)) {
                    this.parent.splice(this.key, 1);
                    return true;
                } else {
                    this.replace(null);
                    return false;
                }
            };
            function Element(node, path, wrap, ref) {
                this.node = node;
                this.path = path;
                this.wrap = wrap;
                this.ref = ref;
            }
            function Controller() {}
            Controller.prototype.path = function() {
                var i, iz, j, jz, result, element;
                function addToPath(result, path) {
                    if (Array.isArray(path)) for(j = 0, jz = path.length; j < jz; ++j)result.push(path[j]);
                    else result.push(path);
                }
                if (!this.__current.path) return null;
                result = [];
                for(i = 2, iz = this.__leavelist.length; i < iz; ++i){
                    element = this.__leavelist[i];
                    addToPath(result, element.path);
                }
                addToPath(result, this.__current.path);
                return result;
            };
            Controller.prototype.type = function() {
                var node = this.current();
                return node.type || this.__current.wrap;
            };
            Controller.prototype.parents = function() {
                var i, iz, result;
                result = [];
                for(i = 1, iz = this.__leavelist.length; i < iz; ++i)result.push(this.__leavelist[i].node);
                return result;
            };
            Controller.prototype.current = function() {
                return this.__current.node;
            };
            Controller.prototype.__execute = function(callback, element) {
                var previous, result;
                result = void 0;
                previous = this.__current;
                this.__current = element;
                this.__state = null;
                if (callback) result = callback.call(this, element.node, this.__leavelist[this.__leavelist.length - 1].node);
                this.__current = previous;
                return result;
            };
            Controller.prototype.notify = function(flag) {
                this.__state = flag;
            };
            Controller.prototype.skip = function() {
                this.notify(SKIP);
            };
            Controller.prototype['break'] = function() {
                this.notify(BREAK);
            };
            Controller.prototype.remove = function() {
                this.notify(REMOVE);
            };
            Controller.prototype.__initialize = function(root, visitor) {
                this.visitor = visitor;
                this.root = root;
                this.__worklist = [];
                this.__leavelist = [];
                this.__current = null;
                this.__state = null;
                this.__fallback = null;
                if ('iteration' === visitor.fallback) this.__fallback = Object.keys;
                else if ('function' == typeof visitor.fallback) this.__fallback = visitor.fallback;
                this.__keys = VisitorKeys;
                if (visitor.keys) this.__keys = Object.assign(Object.create(this.__keys), visitor.keys);
            };
            function isNode(node) {
                if (null == node) return false;
                return 'object' == typeof node && 'string' == typeof node.type;
            }
            function isProperty(nodeType, key) {
                return (nodeType === Syntax.ObjectExpression || nodeType === Syntax.ObjectPattern) && 'properties' === key;
            }
            function candidateExistsInLeaveList(leavelist, candidate) {
                for(var i = leavelist.length - 1; i >= 0; --i)if (leavelist[i].node === candidate) return true;
                return false;
            }
            Controller.prototype.traverse = function(root, visitor) {
                var worklist, leavelist, element, node, nodeType, ret, key, current, current2, candidates, candidate, sentinel;
                this.__initialize(root, visitor);
                sentinel = {};
                worklist = this.__worklist;
                leavelist = this.__leavelist;
                worklist.push(new Element(root, null, null, null));
                leavelist.push(new Element(null, null, null, null));
                while(worklist.length){
                    element = worklist.pop();
                    if (element === sentinel) {
                        element = leavelist.pop();
                        ret = this.__execute(visitor.leave, element);
                        if (this.__state === BREAK || ret === BREAK) return;
                        continue;
                    }
                    if (element.node) {
                        ret = this.__execute(visitor.enter, element);
                        if (this.__state === BREAK || ret === BREAK) return;
                        worklist.push(sentinel);
                        leavelist.push(element);
                        if (this.__state === SKIP || ret === SKIP) continue;
                        node = element.node;
                        nodeType = node.type || element.wrap;
                        candidates = this.__keys[nodeType];
                        if (!candidates) if (this.__fallback) candidates = this.__fallback(node);
                        else throw new Error('Unknown node type ' + nodeType + '.');
                        current = candidates.length;
                        while((current -= 1) >= 0){
                            key = candidates[current];
                            candidate = node[key];
                            if (!candidate) continue;
                            if (Array.isArray(candidate)) {
                                current2 = candidate.length;
                                while((current2 -= 1) >= 0){
                                    if (!candidate[current2]) continue;
                                    if (candidateExistsInLeaveList(leavelist, candidate[current2])) continue;
                                    if (isProperty(nodeType, candidates[current])) element = new Element(candidate[current2], [
                                        key,
                                        current2
                                    ], 'Property', null);
                                    else {
                                        if (!isNode(candidate[current2])) continue;
                                        element = new Element(candidate[current2], [
                                            key,
                                            current2
                                        ], null, null);
                                    }
                                    worklist.push(element);
                                }
                            } else if (isNode(candidate)) {
                                if (candidateExistsInLeaveList(leavelist, candidate)) continue;
                                worklist.push(new Element(candidate, key, null, null));
                            }
                        }
                    }
                }
            };
            Controller.prototype.replace = function(root, visitor) {
                var worklist, leavelist, node, nodeType, target, element, current, current2, candidates, candidate, sentinel, outer, key;
                function removeElem(element) {
                    var i, key, nextElem, parent;
                    if (element.ref.remove()) {
                        key = element.ref.key;
                        parent = element.ref.parent;
                        i = worklist.length;
                        while(i--){
                            nextElem = worklist[i];
                            if (nextElem.ref && nextElem.ref.parent === parent) {
                                if (nextElem.ref.key < key) break;
                                --nextElem.ref.key;
                            }
                        }
                    }
                }
                this.__initialize(root, visitor);
                sentinel = {};
                worklist = this.__worklist;
                leavelist = this.__leavelist;
                outer = {
                    root: root
                };
                element = new Element(root, null, null, new Reference(outer, 'root'));
                worklist.push(element);
                leavelist.push(element);
                while(worklist.length){
                    element = worklist.pop();
                    if (element === sentinel) {
                        element = leavelist.pop();
                        target = this.__execute(visitor.leave, element);
                        if (void 0 !== target && target !== BREAK && target !== SKIP && target !== REMOVE) element.ref.replace(target);
                        if (this.__state === REMOVE || target === REMOVE) removeElem(element);
                        if (this.__state === BREAK || target === BREAK) return outer.root;
                        continue;
                    }
                    target = this.__execute(visitor.enter, element);
                    if (void 0 !== target && target !== BREAK && target !== SKIP && target !== REMOVE) {
                        element.ref.replace(target);
                        element.node = target;
                    }
                    if (this.__state === REMOVE || target === REMOVE) {
                        removeElem(element);
                        element.node = null;
                    }
                    if (this.__state === BREAK || target === BREAK) break;
                    node = element.node;
                    if (!node) continue;
                    worklist.push(sentinel);
                    leavelist.push(element);
                    if (this.__state === SKIP || target === SKIP) continue;
                    nodeType = node.type || element.wrap;
                    candidates = this.__keys[nodeType];
                    if (!candidates) if (this.__fallback) candidates = this.__fallback(node);
                    else throw new Error('Unknown node type ' + nodeType + '.');
                    current = candidates.length;
                    while((current -= 1) >= 0){
                        key = candidates[current];
                        candidate = node[key];
                        if (!candidate) continue;
                        if (Array.isArray(candidate)) {
                            current2 = candidate.length;
                            while((current2 -= 1) >= 0){
                                if (!candidate[current2]) continue;
                                if (isProperty(nodeType, candidates[current])) element = new Element(candidate[current2], [
                                    key,
                                    current2
                                ], 'Property', new Reference(candidate, current2));
                                else {
                                    if (!isNode(candidate[current2])) continue;
                                    element = new Element(candidate[current2], [
                                        key,
                                        current2
                                    ], null, new Reference(candidate, current2));
                                }
                                worklist.push(element);
                            }
                        } else if (isNode(candidate)) worklist.push(new Element(candidate, key, null, new Reference(node, key)));
                    }
                }
                return outer.root;
            };
            function traverse(root, visitor) {
                var controller = new Controller();
                return controller.traverse(root, visitor);
            }
            function replace(root, visitor) {
                var controller = new Controller();
                return controller.replace(root, visitor);
            }
            function extendCommentRange(comment, tokens) {
                var target;
                target = upperBound(tokens, function(token) {
                    return token.range[0] > comment.range[0];
                });
                comment.extendedRange = [
                    comment.range[0],
                    comment.range[1]
                ];
                if (target !== tokens.length) comment.extendedRange[1] = tokens[target].range[0];
                target -= 1;
                if (target >= 0) comment.extendedRange[0] = tokens[target].range[1];
                return comment;
            }
            function attachComments(tree, providedComments, tokens) {
                var comments = [], comment, len, i, cursor;
                if (!tree.range) throw new Error('attachComments needs range information');
                if (!tokens.length) {
                    if (providedComments.length) {
                        for(i = 0, len = providedComments.length; i < len; i += 1){
                            comment = deepCopy(providedComments[i]);
                            comment.extendedRange = [
                                0,
                                tree.range[0]
                            ];
                            comments.push(comment);
                        }
                        tree.leadingComments = comments;
                    }
                    return tree;
                }
                for(i = 0, len = providedComments.length; i < len; i += 1)comments.push(extendCommentRange(deepCopy(providedComments[i]), tokens));
                cursor = 0;
                traverse(tree, {
                    enter: function(node) {
                        var comment;
                        while(cursor < comments.length){
                            comment = comments[cursor];
                            if (comment.extendedRange[1] > node.range[0]) break;
                            if (comment.extendedRange[1] === node.range[0]) {
                                if (!node.leadingComments) node.leadingComments = [];
                                node.leadingComments.push(comment);
                                comments.splice(cursor, 1);
                            } else cursor += 1;
                        }
                        if (cursor === comments.length) return VisitorOption.Break;
                        if (comments[cursor].extendedRange[0] > node.range[1]) return VisitorOption.Skip;
                    }
                });
                cursor = 0;
                traverse(tree, {
                    leave: function(node) {
                        var comment;
                        while(cursor < comments.length){
                            comment = comments[cursor];
                            if (node.range[1] < comment.extendedRange[0]) break;
                            if (node.range[1] === comment.extendedRange[0]) {
                                if (!node.trailingComments) node.trailingComments = [];
                                node.trailingComments.push(comment);
                                comments.splice(cursor, 1);
                            } else cursor += 1;
                        }
                        if (cursor === comments.length) return VisitorOption.Break;
                        if (comments[cursor].extendedRange[0] > node.range[1]) return VisitorOption.Skip;
                    }
                });
                return tree;
            }
            exports.Syntax = Syntax;
            exports.traverse = traverse;
            exports.replace = replace;
            exports.attachComments = attachComments;
            exports.VisitorKeys = VisitorKeys;
            exports.VisitorOption = VisitorOption;
            exports.Controller = Controller;
            exports.cloneEnvironment = function() {
                return clone({});
            };
            return exports;
        })(exports);
    },
    "../../../node_modules/.pnpm/esrecurse@4.3.0/node_modules/esrecurse/package.json" (module) {
        module.exports = {};
    }
});
var astralIdentifierCodes = [
    509,
    0,
    227,
    0,
    150,
    4,
    294,
    9,
    1368,
    2,
    2,
    1,
    6,
    3,
    41,
    2,
    5,
    0,
    166,
    1,
    574,
    3,
    9,
    9,
    7,
    9,
    32,
    4,
    318,
    1,
    31,
    4,
    33,
    15,
    71,
    10,
    50,
    3,
    123,
    2,
    54,
    14,
    32,
    10,
    3,
    1,
    11,
    3,
    46,
    10,
    8,
    0,
    46,
    9,
    7,
    2,
    37,
    13,
    2,
    9,
    6,
    1,
    45,
    0,
    13,
    2,
    49,
    13,
    9,
    3,
    2,
    11,
    83,
    11,
    7,
    0,
    3,
    0,
    158,
    11,
    6,
    9,
    7,
    3,
    56,
    1,
    2,
    6,
    3,
    1,
    3,
    2,
    10,
    0,
    11,
    1,
    3,
    6,
    4,
    4,
    68,
    8,
    2,
    0,
    3,
    0,
    2,
    3,
    2,
    4,
    2,
    0,
    15,
    1,
    83,
    17,
    10,
    9,
    5,
    0,
    82,
    19,
    13,
    9,
    214,
    6,
    3,
    8,
    28,
    1,
    83,
    16,
    16,
    9,
    82,
    12,
    9,
    9,
    7,
    19,
    58,
    14,
    5,
    9,
    243,
    14,
    166,
    9,
    71,
    5,
    2,
    1,
    3,
    3,
    2,
    0,
    2,
    1,
    13,
    9,
    120,
    6,
    3,
    6,
    4,
    0,
    29,
    9,
    41,
    6,
    2,
    3,
    9,
    0,
    10,
    10,
    47,
    15,
    199,
    7,
    137,
    9,
    54,
    7,
    2,
    7,
    17,
    9,
    57,
    21,
    2,
    13,
    123,
    5,
    4,
    0,
    2,
    1,
    2,
    6,
    2,
    0,
    9,
    9,
    49,
    4,
    2,
    1,
    2,
    4,
    9,
    9,
    55,
    9,
    7,
    0,
    259,
    3,
    10,
    1,
    2,
    0,
    49,
    6,
    4,
    4,
    14,
    10,
    5350,
    0,
    7,
    14,
    11465,
    27,
    2343,
    9,
    87,
    9,
    39,
    4,
    60,
    6,
    26,
    9,
    535,
    9,
    470,
    0,
    2,
    54,
    8,
    3,
    82,
    0,
    12,
    1,
    19628,
    1,
    4178,
    9,
    519,
    45,
    3,
    22,
    481,
    1,
    61,
    4,
    4,
    5,
    9,
    7,
    3,
    6,
    31,
    3,
    149,
    2,
    12,
    2,
    9,
    1,
    3,
    0,
    33,
    1,
    1357,
    49,
    513,
    54,
    5,
    49,
    9,
    0,
    15,
    0,
    23,
    4,
    2,
    14,
    1361,
    6,
    2,
    16,
    3,
    6,
    2,
    1,
    2,
    4,
    101,
    0,
    161,
    6,
    10,
    9,
    357,
    0,
    62,
    13,
    499,
    13,
    245,
    1,
    2,
    9,
    233,
    0,
    3,
    0,
    8,
    1,
    6,
    0,
    475,
    6,
    110,
    6,
    6,
    9,
    4759,
    9,
    787719,
    239
];
var astralIdentifierStartCodes = [
    0,
    11,
    2,
    25,
    2,
    18,
    2,
    1,
    2,
    14,
    3,
    13,
    35,
    122,
    70,
    52,
    268,
    28,
    4,
    48,
    48,
    31,
    14,
    29,
    6,
    37,
    11,
    29,
    3,
    35,
    5,
    7,
    2,
    4,
    43,
    157,
    19,
    35,
    5,
    35,
    5,
    39,
    9,
    51,
    13,
    10,
    2,
    14,
    2,
    6,
    2,
    1,
    2,
    10,
    2,
    14,
    2,
    6,
    2,
    1,
    4,
    51,
    13,
    310,
    10,
    21,
    11,
    7,
    25,
    5,
    2,
    41,
    2,
    13,
    65,
    5,
    3,
    0,
    2,
    43,
    2,
    1,
    4,
    0,
    3,
    22,
    11,
    22,
    10,
    30,
    66,
    18,
    2,
    1,
    11,
    21,
    11,
    25,
    7,
    25,
    39,
    55,
    7,
    1,
    65,
    0,
    16,
    3,
    2,
    2,
    2,
    28,
    43,
    28,
    4,
    28,
    36,
    7,
    2,
    27,
    28,
    53,
    11,
    21,
    11,
    18,
    14,
    17,
    111,
    72,
    56,
    50,
    14,
    50,
    14,
    35,
    39,
    27,
    10,
    22,
    251,
    41,
    7,
    1,
    17,
    5,
    18,
    21,
    18,
    28,
    11,
    0,
    9,
    21,
    43,
    17,
    47,
    20,
    28,
    22,
    13,
    52,
    58,
    1,
    3,
    0,
    14,
    44,
    33,
    24,
    27,
    35,
    30,
    0,
    3,
    0,
    9,
    34,
    4,
    0,
    13,
    47,
    15,
    3,
    22,
    0,
    2,
    0,
    36,
    17,
    2,
    24,
    20,
    1,
    64,
    6,
    2,
    0,
    2,
    3,
    2,
    14,
    2,
    9,
    8,
    46,
    39,
    7,
    3,
    1,
    3,
    21,
    2,
    6,
    2,
    1,
    2,
    4,
    4,
    0,
    19,
    0,
    13,
    4,
    31,
    9,
    2,
    0,
    3,
    0,
    2,
    37,
    2,
    0,
    26,
    0,
    2,
    0,
    45,
    52,
    19,
    3,
    21,
    2,
    31,
    47,
    21,
    1,
    2,
    0,
    185,
    46,
    42,
    3,
    37,
    47,
    21,
    0,
    60,
    42,
    14,
    0,
    72,
    26,
    38,
    6,
    186,
    43,
    117,
    63,
    32,
    7,
    3,
    0,
    3,
    7,
    2,
    1,
    2,
    23,
    16,
    0,
    2,
    0,
    95,
    7,
    3,
    38,
    17,
    0,
    2,
    0,
    29,
    0,
    11,
    39,
    8,
    0,
    22,
    0,
    12,
    45,
    20,
    0,
    19,
    72,
    18,
    0,
    182,
    32,
    32,
    8,
    2,
    36,
    18,
    0,
    50,
    29,
    113,
    6,
    2,
    1,
    2,
    37,
    22,
    0,
    26,
    5,
    2,
    1,
    2,
    31,
    15,
    0,
    24,
    43,
    22,
    0,
    239,
    18,
    16,
    0,
    2,
    12,
    2,
    33,
    125,
    0,
    80,
    921,
    103,
    111,
    6,
    206,
    13,
    310,
    2314,
    96,
    16,
    1071,
    18,
    5,
    26,
    3994,
    6,
    582,
    6842,
    29,
    1763,
    568,
    8,
    30,
    18,
    78,
    18,
    29,
    19,
    47,
    17,
    3,
    32,
    20,
    6,
    18,
    433,
    44,
    212,
    63,
    33,
    24,
    3,
    24,
    45,
    74,
    6,
    0,
    67,
    12,
    65,
    1,
    2,
    0,
    15,
    4,
    10,
    7386,
    37,
    33,
    96,
    114,
    14,
    913,
    15,
    50,
    7710,
    3,
    2,
    6,
    2,
    1,
    2,
    296,
    10,
    0,
    30,
    2,
    3,
    0,
    15,
    4,
    8,
    395,
    2309,
    106,
    6,
    12,
    4,
    8,
    8,
    9,
    5991,
    84,
    2,
    70,
    2,
    1,
    3,
    0,
    3,
    1,
    3,
    3,
    2,
    11,
    2,
    0,
    2,
    6,
    2,
    64,
    2,
    3,
    3,
    7,
    2,
    6,
    2,
    27,
    2,
    3,
    2,
    4,
    2,
    0,
    4,
    6,
    2,
    340,
    2,
    24,
    2,
    24,
    2,
    30,
    2,
    24,
    2,
    30,
    2,
    24,
    2,
    30,
    2,
    24,
    2,
    30,
    2,
    24,
    2,
    7,
    1845,
    129,
    15,
    6,
    55,
    50,
    49,
    61,
    147,
    44,
    11,
    6,
    17,
    0,
    322,
    29,
    19,
    43,
    485,
    27,
    229,
    29,
    3,
    0,
    208,
    30,
    2,
    2,
    2,
    1,
    2,
    6,
    3,
    4,
    10,
    1,
    225,
    6,
    2,
    3,
    2,
    1,
    2,
    14,
    2,
    196,
    60,
    67,
    8,
    0,
    1205,
    3,
    2,
    26,
    2,
    1,
    2,
    0,
    3,
    0,
    2,
    9,
    2,
    3,
    2,
    0,
    2,
    0,
    7,
    0,
    5,
    0,
    2,
    0,
    2,
    0,
    2,
    2,
    2,
    1,
    2,
    0,
    3,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    1,
    2,
    0,
    3,
    3,
    2,
    6,
    2,
    3,
    2,
    3,
    2,
    0,
    2,
    9,
    2,
    16,
    6,
    2,
    2,
    4,
    2,
    16,
    4421,
    42719,
    33,
    4382,
    2,
    5773,
    3,
    7472,
    16,
    621,
    2467,
    541,
    1507,
    4938,
    6,
    8489,
    39815,
    11327
];
var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7-\u05c9\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u0897-\u089f\u08ca-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b53-\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3c\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0cf3\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d81-\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ece\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u180f-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1abf-\u1af0\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\u30fb\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua82c\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f\uff65";
var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0558\u0559\u0560-\u0588\u058b\u058c\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u0870-\u0887\u0889-\u088f\u08a0-\u08c9\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c5c\u0c5d\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cdc-\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d04-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u1711\u171f-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4c\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c8a\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u208f-\u209f\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7dd\ua7e2\ua7f1-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab69\uab6c\uab6d\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
var reservedWords = {
    3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
    5: "class enum extends super const export import",
    6: "enum",
    strict: "implements interface let package private protected public static yield",
    strictBind: "eval arguments"
};
var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";
var keywords$1 = {
    5: ecma5AndLessKeywords,
    "5module": ecma5AndLessKeywords + " export import",
    6: ecma5AndLessKeywords + " const class extends export import super"
};
var keywordRelationalOperator = /^in(stanceof)?$/;
var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
function isInAstralSet(code, set) {
    var pos = 0x10000;
    for(var i = 0; i < set.length; i += 2){
        pos += set[i];
        if (pos > code) break;
        pos += set[i + 1];
        if (pos >= code) return true;
    }
    return false;
}
function isIdentifierStart(code, astral) {
    if (code < 65) return 36 === code;
    if (code < 91) return true;
    if (code < 97) return 95 === code;
    if (code < 123) return true;
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
    if (false === astral) return false;
    return isInAstralSet(code, astralIdentifierStartCodes);
}
function isIdentifierChar(code, astral) {
    if (code < 48) return 36 === code;
    if (code < 58) return true;
    if (code < 65) return false;
    if (code < 91) return true;
    if (code < 97) return 95 === code;
    if (code < 123) return true;
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
    if (false === astral) return false;
    return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}
var acorn_TokenType = function(label, conf) {
    if (void 0 === conf) conf = {};
    this.label = label;
    this.keyword = conf.keyword;
    this.beforeExpr = !!conf.beforeExpr;
    this.startsExpr = !!conf.startsExpr;
    this.isLoop = !!conf.isLoop;
    this.isAssign = !!conf.isAssign;
    this.prefix = !!conf.prefix;
    this.postfix = !!conf.postfix;
    this.binop = conf.binop || null;
    this.updateContext = null;
};
function binop(name, prec) {
    return new acorn_TokenType(name, {
        beforeExpr: true,
        binop: prec
    });
}
var beforeExpr = {
    beforeExpr: true
}, startsExpr = {
    startsExpr: true
};
var keywords = {};
function kw(name, options) {
    if (void 0 === options) options = {};
    options.keyword = name;
    return keywords[name] = new acorn_TokenType(name, options);
}
var types$1 = {
    num: new acorn_TokenType("num", startsExpr),
    regexp: new acorn_TokenType("regexp", startsExpr),
    string: new acorn_TokenType("string", startsExpr),
    name: new acorn_TokenType("name", startsExpr),
    privateId: new acorn_TokenType("privateId", startsExpr),
    eof: new acorn_TokenType("eof"),
    bracketL: new acorn_TokenType("[", {
        beforeExpr: true,
        startsExpr: true
    }),
    bracketR: new acorn_TokenType("]"),
    braceL: new acorn_TokenType("{", {
        beforeExpr: true,
        startsExpr: true
    }),
    braceR: new acorn_TokenType("}"),
    parenL: new acorn_TokenType("(", {
        beforeExpr: true,
        startsExpr: true
    }),
    parenR: new acorn_TokenType(")"),
    comma: new acorn_TokenType(",", beforeExpr),
    semi: new acorn_TokenType(";", beforeExpr),
    colon: new acorn_TokenType(":", beforeExpr),
    dot: new acorn_TokenType("."),
    question: new acorn_TokenType("?", beforeExpr),
    questionDot: new acorn_TokenType("?."),
    arrow: new acorn_TokenType("=>", beforeExpr),
    template: new acorn_TokenType("template"),
    invalidTemplate: new acorn_TokenType("invalidTemplate"),
    ellipsis: new acorn_TokenType("...", beforeExpr),
    backQuote: new acorn_TokenType("`", startsExpr),
    dollarBraceL: new acorn_TokenType("${", {
        beforeExpr: true,
        startsExpr: true
    }),
    eq: new acorn_TokenType("=", {
        beforeExpr: true,
        isAssign: true
    }),
    assign: new acorn_TokenType("_=", {
        beforeExpr: true,
        isAssign: true
    }),
    incDec: new acorn_TokenType("++/--", {
        prefix: true,
        postfix: true,
        startsExpr: true
    }),
    prefix: new acorn_TokenType("!/~", {
        beforeExpr: true,
        prefix: true,
        startsExpr: true
    }),
    logicalOR: binop("||", 1),
    logicalAND: binop("&&", 2),
    bitwiseOR: binop("|", 3),
    bitwiseXOR: binop("^", 4),
    bitwiseAND: binop("&", 5),
    equality: binop("==/!=/===/!==", 6),
    relational: binop("</>/<=/>=", 7),
    bitShift: binop("<</>>/>>>", 8),
    plusMin: new acorn_TokenType("+/-", {
        beforeExpr: true,
        binop: 9,
        prefix: true,
        startsExpr: true
    }),
    modulo: binop("%", 10),
    star: binop("*", 10),
    slash: binop("/", 10),
    starstar: new acorn_TokenType("**", {
        beforeExpr: true
    }),
    coalesce: binop("??", 1),
    _break: kw("break"),
    _case: kw("case", beforeExpr),
    _catch: kw("catch"),
    _continue: kw("continue"),
    _debugger: kw("debugger"),
    _default: kw("default", beforeExpr),
    _do: kw("do", {
        isLoop: true,
        beforeExpr: true
    }),
    _else: kw("else", beforeExpr),
    _finally: kw("finally"),
    _for: kw("for", {
        isLoop: true
    }),
    _function: kw("function", startsExpr),
    _if: kw("if"),
    _return: kw("return", beforeExpr),
    _switch: kw("switch"),
    _throw: kw("throw", beforeExpr),
    _try: kw("try"),
    _var: kw("var"),
    _const: kw("const"),
    _while: kw("while", {
        isLoop: true
    }),
    _with: kw("with"),
    _new: kw("new", {
        beforeExpr: true,
        startsExpr: true
    }),
    _this: kw("this", startsExpr),
    _super: kw("super", startsExpr),
    _class: kw("class", startsExpr),
    _extends: kw("extends", beforeExpr),
    _export: kw("export"),
    _import: kw("import", startsExpr),
    _null: kw("null", startsExpr),
    _true: kw("true", startsExpr),
    _false: kw("false", startsExpr),
    _in: kw("in", {
        beforeExpr: true,
        binop: 7
    }),
    _instanceof: kw("instanceof", {
        beforeExpr: true,
        binop: 7
    }),
    _typeof: kw("typeof", {
        beforeExpr: true,
        prefix: true,
        startsExpr: true
    }),
    _void: kw("void", {
        beforeExpr: true,
        prefix: true,
        startsExpr: true
    }),
    _delete: kw("delete", {
        beforeExpr: true,
        prefix: true,
        startsExpr: true
    })
};
var lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = new RegExp(lineBreak.source, "g");
function isNewLine(code) {
    return 10 === code || 13 === code || 0x2028 === code || 0x2029 === code;
}
function nextLineBreak(code, from, end) {
    if (void 0 === end) end = code.length;
    for(var i = from; i < end; i++){
        var next = code.charCodeAt(i);
        if (isNewLine(next)) return i < end - 1 && 13 === next && 10 === code.charCodeAt(i + 1) ? i + 2 : i + 1;
    }
    return -1;
}
var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
var acorn_ref = Object.prototype;
var acorn_hasOwnProperty = acorn_ref.hasOwnProperty;
var acorn_toString = acorn_ref.toString;
var hasOwn = Object.hasOwn || function(obj, propName) {
    return acorn_hasOwnProperty.call(obj, propName);
};
var isArray = Array.isArray || function(obj) {
    return "[object Array]" === acorn_toString.call(obj);
};
var regexpCache = Object.create(null);
function wordsRegexp(words) {
    return regexpCache[words] || (regexpCache[words] = new RegExp("^(?:" + words.replace(/ /g, "|") + ")$"));
}
function codePointToString(code) {
    if (code <= 0xFFFF) return String.fromCharCode(code);
    code -= 0x10000;
    return String.fromCharCode((code >> 10) + 0xD800, (1023 & code) + 0xDC00);
}
var loneSurrogate = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;
var acorn_Position = function(line, col) {
    this.line = line;
    this.column = col;
};
acorn_Position.prototype.offset = function(n) {
    return new acorn_Position(this.line, this.column + n);
};
var acorn_SourceLocation = function(p, start, end) {
    this.start = start;
    this.end = end;
    if (null !== p.sourceFile) this.source = p.sourceFile;
};
function getLineInfo(input, offset) {
    for(var line = 1, cur = 0;;){
        var nextBreak = nextLineBreak(input, cur, offset);
        if (nextBreak < 0) return new acorn_Position(line, offset - cur);
        ++line;
        cur = nextBreak;
    }
}
var defaultOptions = {
    ecmaVersion: null,
    sourceType: "script",
    strict: false,
    onInsertedSemicolon: null,
    onTrailingComma: null,
    allowReserved: null,
    allowReturnOutsideFunction: false,
    allowImportExportEverywhere: false,
    allowAwaitOutsideFunction: null,
    allowSuperOutsideMethod: null,
    allowHashBang: false,
    checkPrivateFields: true,
    locations: false,
    startLocation: null,
    onToken: null,
    onComment: null,
    ranges: false,
    program: null,
    sourceFile: null,
    directSourceFile: null,
    preserveParens: false
};
var warnedAboutEcmaVersion = false;
function getOptions(opts) {
    var options = {};
    for(var opt in defaultOptions)options[opt] = opts && hasOwn(opts, opt) ? opts[opt] : defaultOptions[opt];
    if ("latest" === options.ecmaVersion) options.ecmaVersion = 1e8;
    else if (null == options.ecmaVersion) {
        if (!warnedAboutEcmaVersion && "object" == typeof console && console.warn) {
            warnedAboutEcmaVersion = true;
            console.warn("Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.");
        }
        options.ecmaVersion = 11;
    } else if (options.ecmaVersion >= 2015) options.ecmaVersion -= 2009;
    if (null == options.allowReserved) options.allowReserved = options.ecmaVersion < 5;
    if (!opts || null == opts.allowHashBang) options.allowHashBang = options.ecmaVersion >= 14;
    if (isArray(options.onToken)) {
        var tokens = options.onToken;
        options.onToken = function(token) {
            return tokens.push(token);
        };
    }
    if (isArray(options.onComment)) options.onComment = pushComment(options, options.onComment);
    if ("commonjs" === options.sourceType && options.allowAwaitOutsideFunction) throw new Error("Cannot use allowAwaitOutsideFunction with sourceType: commonjs");
    return options;
}
function pushComment(options, array) {
    return function(block, text, start, end, startLoc, endLoc) {
        var comment = {
            type: block ? "Block" : "Line",
            value: text,
            start: start,
            end: end
        };
        if (options.locations) comment.loc = new acorn_SourceLocation(this, startLoc, endLoc);
        if (options.ranges) comment.range = [
            start,
            end
        ];
        array.push(comment);
    };
}
var SCOPE_TOP = 1, SCOPE_FUNCTION = 2, SCOPE_ASYNC = 4, SCOPE_GENERATOR = 8, SCOPE_ARROW = 16, SCOPE_SIMPLE_CATCH = 32, SCOPE_SUPER = 64, SCOPE_DIRECT_SUPER = 128, SCOPE_CLASS_STATIC_BLOCK = 256, SCOPE_CLASS_FIELD_INIT = 512, SCOPE_SWITCH = 1024, SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK;
function functionFlags(async, generator) {
    return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0);
}
var BIND_NONE = 0, BIND_VAR = 1, BIND_LEXICAL = 2, BIND_FUNCTION = 3, BIND_SIMPLE_CATCH = 4, BIND_OUTSIDE = 5;
var acorn_Parser = function(options, input, startPos) {
    this.options = options = getOptions(options);
    this.sourceFile = options.sourceFile;
    this.keywords = wordsRegexp(keywords$1[options.ecmaVersion >= 6 ? 6 : "module" === options.sourceType ? "5module" : 5]);
    var reserved = "";
    if (true !== options.allowReserved) {
        reserved = reservedWords[options.ecmaVersion >= 6 ? 6 : 5 === options.ecmaVersion ? 5 : 3];
        if ("module" === options.sourceType) reserved += " await";
    }
    this.reservedWords = wordsRegexp(reserved);
    var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
    this.reservedWordsStrict = wordsRegexp(reservedStrict);
    this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
    this.input = String(input);
    this.containsEsc = false;
    this.pos = startPos || 0;
    this.curLine = 1;
    if (options.startLocation) {
        this.lineStart = this.pos - options.startLocation.column;
        this.curLine = options.startLocation.line;
    } else if (startPos) {
        this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
        if (this.options.locations) this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
    } else this.lineStart = 0;
    this.type = types$1.eof;
    this.value = null;
    this.start = this.end = this.pos;
    this.startLoc = this.endLoc = this.curPosition();
    this.lastTokEndLoc = this.lastTokStartLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;
    this.context = this.initialContext();
    this.exprAllowed = true;
    this.inModule = "module" === options.sourceType;
    this.strict = this.inModule || true === options.strict || this.strictDirective(this.pos);
    this.potentialArrowAt = -1;
    this.potentialArrowInForAwait = false;
    this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
    this.labels = [];
    this.undefinedExports = Object.create(null);
    if (0 === this.pos && options.allowHashBang && "#!" === this.input.slice(0, 2)) this.skipLineComment(2);
    this.scopeStack = [];
    this.enterScope("commonjs" === this.options.sourceType ? SCOPE_FUNCTION : SCOPE_TOP);
    this.regexpState = null;
    this.privateNameStack = [];
};
var prototypeAccessors = {
    inFunction: {
        configurable: true
    },
    inGenerator: {
        configurable: true
    },
    inAsync: {
        configurable: true
    },
    canAwait: {
        configurable: true
    },
    allowReturn: {
        configurable: true
    },
    allowSuper: {
        configurable: true
    },
    allowDirectSuper: {
        configurable: true
    },
    treatFunctionsAsVar: {
        configurable: true
    },
    allowNewDotTarget: {
        configurable: true
    },
    allowUsing: {
        configurable: true
    },
    inClassStaticBlock: {
        configurable: true
    }
};
acorn_Parser.prototype.parse = function() {
    var this$1$1 = this;
    var node = this.options.program || this.startNode();
    this.nextToken();
    return this.catchStackOverflow(function() {
        return this$1$1.parseTopLevel(node);
    });
};
prototypeAccessors.inFunction.get = function() {
    return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0;
};
prototypeAccessors.inGenerator.get = function() {
    return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0;
};
prototypeAccessors.inAsync.get = function() {
    return (this.currentVarScope().flags & SCOPE_ASYNC) > 0;
};
prototypeAccessors.canAwait.get = function() {
    for(var i = this.scopeStack.length - 1; i >= 0; i--){
        var ref = this.scopeStack[i];
        var flags = ref.flags;
        if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT)) return false;
        if (flags & SCOPE_FUNCTION) return (flags & SCOPE_ASYNC) > 0;
    }
    return this.inModule && this.options.ecmaVersion >= 13 || this.options.allowAwaitOutsideFunction;
};
prototypeAccessors.allowReturn.get = function() {
    if (this.inFunction) return true;
    if (this.options.allowReturnOutsideFunction && this.currentVarScope().flags & SCOPE_TOP) return true;
    return false;
};
prototypeAccessors.allowSuper.get = function() {
    var ref = this.currentThisScope();
    var flags = ref.flags;
    return (flags & SCOPE_SUPER) > 0 || this.options.allowSuperOutsideMethod;
};
prototypeAccessors.allowDirectSuper.get = function() {
    return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0;
};
prototypeAccessors.treatFunctionsAsVar.get = function() {
    return this.treatFunctionsAsVarInScope(this.currentScope());
};
prototypeAccessors.allowNewDotTarget.get = function() {
    for(var i = this.scopeStack.length - 1; i >= 0; i--){
        var ref = this.scopeStack[i];
        var flags = ref.flags;
        if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT) || flags & SCOPE_FUNCTION && !(flags & SCOPE_ARROW)) return true;
    }
    return false;
};
prototypeAccessors.allowUsing.get = function() {
    var ref = this.currentScope();
    var flags = ref.flags;
    if (flags & SCOPE_SWITCH) return false;
    if (!this.inModule && flags & SCOPE_TOP) return false;
    return true;
};
prototypeAccessors.inClassStaticBlock.get = function() {
    return (this.currentVarScope().flags & SCOPE_CLASS_STATIC_BLOCK) > 0;
};
acorn_Parser.extend = function() {
    var plugins = [], len = arguments.length;
    while(len--)plugins[len] = arguments[len];
    var cls = this;
    for(var i = 0; i < plugins.length; i++)cls = plugins[i](cls);
    return cls;
};
acorn_Parser.parse = function(input, options) {
    return new this(options, input).parse();
};
acorn_Parser.parseExpressionAt = function(input, pos, options) {
    var parser = new this(options, input, pos);
    parser.nextToken();
    return parser.parseExpression();
};
acorn_Parser.tokenizer = function(input, options) {
    return new this(options, input);
};
Object.defineProperties(acorn_Parser.prototype, prototypeAccessors);
var pp$9 = acorn_Parser.prototype;
var literal = /^(?:'((?:\\[^]|[^'\\])*?)'|"((?:\\[^]|[^"\\])*?)")/;
pp$9.strictDirective = function(start) {
    if (this.options.ecmaVersion < 5) return false;
    for(;;){
        skipWhiteSpace.lastIndex = start;
        start += skipWhiteSpace.exec(this.input)[0].length;
        var match = literal.exec(this.input.slice(start));
        if (!match) return false;
        if ("use strict" === (match[1] || match[2])) {
            skipWhiteSpace.lastIndex = start + match[0].length;
            var spaceAfter = skipWhiteSpace.exec(this.input), end = spaceAfter.index + spaceAfter[0].length;
            var next = this.input.charAt(end);
            return ";" === next || "}" === next || lineBreak.test(spaceAfter[0]) && !(/[(`.[+\-/*%<>=,?^&]/.test(next) || "!" === next && "=" === this.input.charAt(end + 1) || "i" === next && keywordOpAt(this, end));
        }
        start += match[0].length;
        skipWhiteSpace.lastIndex = start;
        start += skipWhiteSpace.exec(this.input)[0].length;
        if (";" === this.input[start]) start++;
    }
};
function keywordOpAt(parser, pos) {
    var end = pos + 1, stop = Math.min(parser.input.length, pos + 11);
    while(end < stop){
        var ch = parser.fullCharCodeAt(end);
        if (!isIdentifierChar(ch, true)) break;
        end += ch <= 0xffff ? 1 : 2;
    }
    return end === pos + 2 && "in" === parser.input.slice(pos, end) || end === pos + 10 && "instanceof" === parser.input.slice(pos, end);
}
pp$9.eat = function(type) {
    if (this.type !== type) return false;
    else {
        this.next();
        return true;
    }
};
pp$9.isContextual = function(name) {
    return this.type === types$1.name && this.value === name && !this.containsEsc;
};
pp$9.eatContextual = function(name) {
    if (!this.isContextual(name)) return false;
    this.next();
    return true;
};
pp$9.catchStackOverflow = function(f) {
    try {
        return f();
    } catch (e) {
        if (e instanceof Error && (/\bstack\b.*\b(exceeded|overflow)\b/i.test(e.message) || /\btoo much recursion\b/i.test(e.message))) this.raise(this.start, "Not enough stack space to parse input");
        else throw e;
    }
};
pp$9.expectContextual = function(name) {
    if (!this.eatContextual(name)) this.unexpected();
};
pp$9.canInsertSemicolon = function() {
    return this.type === types$1.eof || this.type === types$1.braceR || lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};
pp$9.insertSemicolon = function() {
    if (this.canInsertSemicolon()) {
        if (this.options.onInsertedSemicolon) this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc);
        return true;
    }
};
pp$9.semicolon = function() {
    if (!this.eat(types$1.semi) && !this.insertSemicolon()) this.unexpected();
};
pp$9.afterTrailingComma = function(tokType, notNext) {
    if (this.type === tokType) {
        if (this.options.onTrailingComma) this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc);
        if (!notNext) this.next();
        return true;
    }
};
pp$9.expect = function(type) {
    this.eat(type) || this.unexpected();
};
pp$9.unexpected = function(pos) {
    this.raise(null != pos ? pos : this.start, "Unexpected token");
};
var acorn_DestructuringErrors = function() {
    this.shorthandAssign = this.trailingComma = this.parenthesizedAssign = this.parenthesizedBind = this.doubleProto = -1;
};
pp$9.checkPatternErrors = function(refDestructuringErrors, isAssign) {
    if (!refDestructuringErrors) return;
    if (refDestructuringErrors.trailingComma > -1) this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element");
    var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
    if (parens > -1) this.raiseRecoverable(parens, isAssign ? "Assigning to rvalue" : "Parenthesized pattern");
};
pp$9.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
    if (!refDestructuringErrors) return false;
    var shorthandAssign = refDestructuringErrors.shorthandAssign;
    var doubleProto = refDestructuringErrors.doubleProto;
    if (!andThrow) return shorthandAssign >= 0 || doubleProto >= 0;
    if (shorthandAssign >= 0) this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns");
    if (doubleProto >= 0) this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property");
};
pp$9.checkYieldAwaitInDefaultParams = function() {
    if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos)) this.raise(this.yieldPos, "Yield expression cannot be a default value");
    if (this.awaitPos) this.raise(this.awaitPos, "Await expression cannot be a default value");
};
pp$9.isSimpleAssignTarget = function(expr) {
    if ("ParenthesizedExpression" === expr.type) return this.isSimpleAssignTarget(expr.expression);
    return "Identifier" === expr.type || "MemberExpression" === expr.type;
};
var pp$8 = acorn_Parser.prototype;
pp$8.parseTopLevel = function(node) {
    var exports$1 = Object.create(null);
    if (!node.body) node.body = [];
    while(this.type !== types$1.eof){
        var stmt = this.parseStatement(null, true, exports$1);
        node.body.push(stmt);
    }
    if (this.inModule) for(var i = 0, list = Object.keys(this.undefinedExports); i < list.length; i += 1){
        var name = list[i];
        this.raiseRecoverable(this.undefinedExports[name].start, "Export '" + name + "' is not defined");
    }
    this.adaptDirectivePrologue(node.body);
    this.next();
    node.sourceType = "commonjs" === this.options.sourceType ? "script" : this.options.sourceType;
    return this.finishNode(node, "Program");
};
var loopLabel = {
    kind: "loop"
}, switchLabel = {
    kind: "switch"
};
pp$8.isLet = function(context) {
    if (this.options.ecmaVersion < 6 || !this.isContextual("let")) return false;
    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length, nextCh = this.fullCharCodeAt(next);
    if (91 === nextCh || 92 === nextCh) return true;
    if (context) return false;
    if (123 === nextCh) return true;
    if (isIdentifierStart(nextCh)) {
        var start = next;
        do next += nextCh <= 0xffff ? 1 : 2;
        while (isIdentifierChar(nextCh = this.fullCharCodeAt(next)));
        if (92 === nextCh) return true;
        var ident = this.input.slice(start, next);
        if (!keywordRelationalOperator.test(ident)) return true;
    }
    return false;
};
pp$8.isAsyncFunction = function() {
    if (this.options.ecmaVersion < 8 || !this.isContextual("async")) return false;
    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length, after;
    return !lineBreak.test(this.input.slice(this.pos, next)) && "function" === this.input.slice(next, next + 8) && (next + 8 === this.input.length || !(isIdentifierChar(after = this.fullCharCodeAt(next + 8)) || 92 === after));
};
pp$8.isUsingKeyword = function(isAwaitUsing, isFor) {
    if (this.options.ecmaVersion < 17 || !this.isContextual(isAwaitUsing ? "await" : "using")) return false;
    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length;
    if (lineBreak.test(this.input.slice(this.pos, next))) return false;
    if (isAwaitUsing) {
        var usingEndPos = next + 5, after;
        if ("using" !== this.input.slice(next, usingEndPos) || usingEndPos === this.input.length || isIdentifierChar(after = this.fullCharCodeAt(usingEndPos)) || 92 === after) return false;
        skipWhiteSpace.lastIndex = usingEndPos;
        var skipAfterUsing = skipWhiteSpace.exec(this.input);
        next = usingEndPos + skipAfterUsing[0].length;
        if (skipAfterUsing && lineBreak.test(this.input.slice(usingEndPos, next))) return false;
    }
    var ch = this.fullCharCodeAt(next);
    if (!isIdentifierStart(ch) && 92 !== ch) return false;
    var idStart = next;
    do next += ch <= 0xffff ? 1 : 2;
    while (isIdentifierChar(ch = this.fullCharCodeAt(next)));
    if (92 === ch) return true;
    var id = this.input.slice(idStart, next);
    if (keywordRelationalOperator.test(id)) return false;
    if (isFor && !isAwaitUsing && "of" === id) {
        skipWhiteSpace.lastIndex = next;
        var skipAfterOf = skipWhiteSpace.exec(this.input);
        next += skipAfterOf[0].length;
        if (61 !== this.input.charCodeAt(next) || 61 === (ch = this.input.charCodeAt(next + 1)) || 62 === ch) return false;
    }
    return true;
};
pp$8.isAwaitUsing = function(isFor) {
    return this.isUsingKeyword(true, isFor);
};
pp$8.isUsing = function(isFor) {
    return this.isUsingKeyword(false, isFor);
};
pp$8.parseStatement = function(context, topLevel, exports$1) {
    var starttype = this.type, node = this.startNode(), kind;
    if (this.isLet(context)) {
        starttype = types$1._var;
        kind = "let";
    }
    switch(starttype){
        case types$1._break:
        case types$1._continue:
            return this.parseBreakContinueStatement(node, starttype.keyword);
        case types$1._debugger:
            return this.parseDebuggerStatement(node);
        case types$1._do:
            return this.parseDoStatement(node);
        case types$1._for:
            return this.parseForStatement(node);
        case types$1._function:
            if (context && (this.strict || "if" !== context && "label" !== context) && this.options.ecmaVersion >= 6) this.unexpected();
            return this.parseFunctionStatement(node, false, !context);
        case types$1._class:
            if (context) this.unexpected();
            return this.parseClass(node, true);
        case types$1._if:
            return this.parseIfStatement(node);
        case types$1._return:
            return this.parseReturnStatement(node);
        case types$1._switch:
            return this.parseSwitchStatement(node);
        case types$1._throw:
            return this.parseThrowStatement(node);
        case types$1._try:
            return this.parseTryStatement(node);
        case types$1._const:
        case types$1._var:
            kind = kind || this.value;
            if (context && "var" !== kind) this.unexpected();
            return this.parseVarStatement(node, kind);
        case types$1._while:
            return this.parseWhileStatement(node);
        case types$1._with:
            return this.parseWithStatement(node);
        case types$1.braceL:
            return this.parseBlock(true, node);
        case types$1.semi:
            return this.parseEmptyStatement(node);
        case types$1._export:
        case types$1._import:
            if (this.options.ecmaVersion > 10 && starttype === types$1._import) {
                skipWhiteSpace.lastIndex = this.pos;
                var skip = skipWhiteSpace.exec(this.input);
                var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
                if (40 === nextCh || 46 === nextCh) return this.parseExpressionStatement(node, this.parseExpression());
            }
            if (!this.options.allowImportExportEverywhere) {
                if (!topLevel) this.raise(this.start, "'import' and 'export' may only appear at the top level");
                if (!this.inModule) this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'");
            }
            return starttype === types$1._import ? this.parseImport(node) : this.parseExport(node, exports$1);
        default:
            if (this.isAsyncFunction()) {
                if (context) this.unexpected();
                this.next();
                return this.parseFunctionStatement(node, true, !context);
            }
            var usingKind = this.isAwaitUsing(false) ? "await using" : this.isUsing(false) ? "using" : null;
            if (usingKind) {
                if (!this.allowUsing) this.raise(this.start, "Using declaration cannot appear in the top level when source type is `script` or in the bare case statement");
                if (context) this.raise(this.start, "Using declaration is not allowed in single-statement positions");
                if ("await using" === usingKind) {
                    if (!this.canAwait) this.raise(this.start, "Await using cannot appear outside of async function");
                    this.next();
                }
                this.next();
                this.parseVar(node, false, usingKind);
                this.semicolon();
                return this.finishNode(node, "VariableDeclaration");
            }
            var maybeName = this.value, expr = this.parseExpression();
            if (starttype === types$1.name && "Identifier" === expr.type && this.eat(types$1.colon)) return this.parseLabeledStatement(node, maybeName, expr, context);
            else return this.parseExpressionStatement(node, expr);
    }
};
pp$8.parseBreakContinueStatement = function(node, keyword) {
    var isBreak = "break" === keyword;
    this.next();
    if (this.eat(types$1.semi) || this.insertSemicolon()) node.label = null;
    else if (this.type !== types$1.name) this.unexpected();
    else {
        node.label = this.parseIdent();
        this.semicolon();
    }
    var i = 0;
    for(; i < this.labels.length; ++i){
        var lab = this.labels[i];
        if (null == node.label || lab.name === node.label.name) {
            if (null != lab.kind && (isBreak || "loop" === lab.kind)) break;
            if (node.label && isBreak) break;
        }
    }
    if (i === this.labels.length) this.raise(node.start, "Unsyntactic " + keyword);
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
};
pp$8.parseDebuggerStatement = function(node) {
    this.next();
    this.semicolon();
    return this.finishNode(node, "DebuggerStatement");
};
pp$8.parseDoStatement = function(node) {
    this.next();
    this.labels.push(loopLabel);
    node.body = this.parseStatement("do");
    this.labels.pop();
    this.expect(types$1._while);
    node.test = this.parseParenExpression();
    if (this.options.ecmaVersion >= 6) this.eat(types$1.semi);
    else this.semicolon();
    return this.finishNode(node, "DoWhileStatement");
};
pp$8.parseForStatement = function(node) {
    this.next();
    var awaitAt = this.options.ecmaVersion >= 9 && this.canAwait && this.eatContextual("await") ? this.lastTokStart : -1;
    this.labels.push(loopLabel);
    this.enterScope(0);
    this.expect(types$1.parenL);
    if (this.type === types$1.semi) {
        if (awaitAt > -1) this.unexpected(awaitAt);
        return this.parseFor(node, null);
    }
    var isLet = this.isLet();
    if (this.type === types$1._var || this.type === types$1._const || isLet) {
        var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
        this.next();
        this.parseVar(init$1, true, kind);
        this.finishNode(init$1, "VariableDeclaration");
        return this.parseForAfterInit(node, init$1, awaitAt);
    }
    var startsWithLet = this.isContextual("let"), isForOf = false;
    var usingKind = this.isUsing(true) ? "using" : this.isAwaitUsing(true) ? "await using" : null;
    if (usingKind) {
        var init$2 = this.startNode();
        this.next();
        if ("await using" === usingKind) {
            if (!this.canAwait) this.raise(this.start, "Await using cannot appear outside of async function");
            this.next();
        }
        this.parseVar(init$2, true, usingKind);
        this.finishNode(init$2, "VariableDeclaration");
        return this.parseForAfterInit(node, init$2, awaitAt);
    }
    var containsEsc = this.containsEsc;
    var refDestructuringErrors = new acorn_DestructuringErrors;
    var initPos = this.start;
    var init = awaitAt > -1 ? this.parseExprSubscripts(refDestructuringErrors, "await") : this.parseExpression(true, refDestructuringErrors);
    if (this.type === types$1._in || (isForOf = this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
        if (awaitAt > -1) {
            if (this.type === types$1._in) this.unexpected(awaitAt);
            node.await = true;
        } else if (isForOf && this.options.ecmaVersion >= 8) if (init.start !== initPos || containsEsc || "Identifier" !== init.type || "async" !== init.name) {
            if (this.options.ecmaVersion >= 9) node.await = false;
        } else this.unexpected();
        if (startsWithLet && isForOf) this.raise(init.start, "The left-hand side of a for-of loop may not start with 'let'.");
        this.toAssignable(init, false, refDestructuringErrors);
        this.checkLValPattern(init);
        return this.parseForIn(node, init);
    } else this.checkExpressionErrors(refDestructuringErrors, true);
    if (awaitAt > -1) this.unexpected(awaitAt);
    return this.parseFor(node, init);
};
pp$8.parseForAfterInit = function(node, init, awaitAt) {
    if ((this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) && 1 === init.declarations.length) {
        if (this.type === types$1._in) {
            if (("using" === init.kind || "await using" === init.kind) && !init.declarations[0].init) this.raise(this.start, "Using declaration is not allowed in for-in loops");
            if (this.options.ecmaVersion >= 9 && awaitAt > -1) this.unexpected(awaitAt);
        } else if (this.options.ecmaVersion >= 9) node.await = awaitAt > -1;
        return this.parseForIn(node, init);
    }
    if (awaitAt > -1) this.unexpected(awaitAt);
    return this.parseFor(node, init);
};
pp$8.parseFunctionStatement = function(node, isAsync, declarationPosition) {
    this.next();
    return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync);
};
pp$8.parseIfStatement = function(node) {
    this.next();
    node.test = this.parseParenExpression();
    node.consequent = this.parseStatement("if");
    node.alternate = this.eat(types$1._else) ? this.parseStatement("if") : null;
    return this.finishNode(node, "IfStatement");
};
pp$8.parseReturnStatement = function(node) {
    if (!this.allowReturn) this.raise(this.start, "'return' outside of function");
    this.next();
    if (this.eat(types$1.semi) || this.insertSemicolon()) node.argument = null;
    else {
        node.argument = this.parseExpression();
        this.semicolon();
    }
    return this.finishNode(node, "ReturnStatement");
};
pp$8.parseSwitchStatement = function(node) {
    this.next();
    node.discriminant = this.parseParenExpression();
    node.cases = [];
    this.expect(types$1.braceL);
    this.labels.push(switchLabel);
    this.enterScope(SCOPE_SWITCH);
    var cur;
    for(var sawDefault = false; this.type !== types$1.braceR;)if (this.type === types$1._case || this.type === types$1._default) {
        var isCase = this.type === types$1._case;
        if (cur) this.finishNode(cur, "SwitchCase");
        node.cases.push(cur = this.startNode());
        cur.consequent = [];
        this.next();
        if (isCase) cur.test = this.parseExpression();
        else {
            if (sawDefault) this.raiseRecoverable(this.lastTokStart, "Multiple default clauses");
            sawDefault = true;
            cur.test = null;
        }
        this.expect(types$1.colon);
    } else {
        if (!cur) this.unexpected();
        cur.consequent.push(this.parseStatement(null));
    }
    this.exitScope();
    if (cur) this.finishNode(cur, "SwitchCase");
    this.next();
    this.labels.pop();
    return this.finishNode(node, "SwitchStatement");
};
pp$8.parseThrowStatement = function(node) {
    this.next();
    if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) this.raise(this.lastTokEnd, "Illegal newline after throw");
    node.argument = this.parseExpression();
    this.semicolon();
    return this.finishNode(node, "ThrowStatement");
};
var empty$1 = [];
pp$8.parseCatchClauseParam = function() {
    var param = this.parseBindingAtom();
    var simple = "Identifier" === param.type;
    this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
    this.checkLValPattern(param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
    this.expect(types$1.parenR);
    return param;
};
pp$8.parseTryStatement = function(node) {
    this.next();
    node.block = this.parseBlock();
    node.handler = null;
    if (this.type === types$1._catch) {
        var clause = this.startNode();
        this.next();
        if (this.eat(types$1.parenL)) clause.param = this.parseCatchClauseParam();
        else {
            if (this.options.ecmaVersion < 10) this.unexpected();
            clause.param = null;
            this.enterScope(0);
        }
        clause.body = this.parseBlock(false);
        this.exitScope();
        node.handler = this.finishNode(clause, "CatchClause");
    }
    node.finalizer = this.eat(types$1._finally) ? this.parseBlock() : null;
    if (!node.handler && !node.finalizer) this.raise(node.start, "Missing catch or finally clause");
    return this.finishNode(node, "TryStatement");
};
pp$8.parseVarStatement = function(node, kind, allowMissingInitializer) {
    this.next();
    this.parseVar(node, false, kind, allowMissingInitializer);
    this.semicolon();
    return this.finishNode(node, "VariableDeclaration");
};
pp$8.parseWhileStatement = function(node) {
    this.next();
    node.test = this.parseParenExpression();
    this.labels.push(loopLabel);
    node.body = this.parseStatement("while");
    this.labels.pop();
    return this.finishNode(node, "WhileStatement");
};
pp$8.parseWithStatement = function(node) {
    if (this.strict) this.raise(this.start, "'with' in strict mode");
    this.next();
    node.object = this.parseParenExpression();
    node.body = this.parseStatement("with");
    return this.finishNode(node, "WithStatement");
};
pp$8.parseEmptyStatement = function(node) {
    this.next();
    return this.finishNode(node, "EmptyStatement");
};
pp$8.parseLabeledStatement = function(node, maybeName, expr, context) {
    for(var i$1 = 0, list = this.labels; i$1 < list.length; i$1 += 1){
        var label = list[i$1];
        if (label.name === maybeName) this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    }
    var kind = this.type.isLoop ? "loop" : this.type === types$1._switch ? "switch" : null;
    for(var i = this.labels.length - 1; i >= 0; i--){
        var label$1 = this.labels[i];
        if (label$1.statementStart === node.start) {
            label$1.statementStart = this.start;
            label$1.kind = kind;
        } else break;
    }
    this.labels.push({
        name: maybeName,
        kind: kind,
        statementStart: this.start
    });
    node.body = this.parseStatement(context ? -1 === context.indexOf("label") ? context + "label" : context : "label");
    this.labels.pop();
    node.label = expr;
    return this.finishNode(node, "LabeledStatement");
};
pp$8.parseExpressionStatement = function(node, expr) {
    node.expression = expr;
    this.semicolon();
    return this.finishNode(node, "ExpressionStatement");
};
pp$8.parseBlock = function(createNewLexicalScope, node, exitStrict) {
    if (void 0 === createNewLexicalScope) createNewLexicalScope = true;
    if (void 0 === node) node = this.startNode();
    node.body = [];
    this.expect(types$1.braceL);
    if (createNewLexicalScope) this.enterScope(0);
    while(this.type !== types$1.braceR){
        var stmt = this.parseStatement(null);
        node.body.push(stmt);
    }
    if (exitStrict) this.strict = false;
    this.next();
    if (createNewLexicalScope) this.exitScope();
    return this.finishNode(node, "BlockStatement");
};
pp$8.parseFor = function(node, init) {
    node.init = init;
    this.expect(types$1.semi);
    node.test = this.type === types$1.semi ? null : this.parseExpression();
    this.expect(types$1.semi);
    node.update = this.type === types$1.parenR ? null : this.parseExpression();
    this.expect(types$1.parenR);
    node.body = this.parseStatement("for");
    this.exitScope();
    this.labels.pop();
    return this.finishNode(node, "ForStatement");
};
pp$8.parseForIn = function(node, init) {
    var isForIn = this.type === types$1._in;
    this.next();
    if ("VariableDeclaration" === init.type && null != init.declarations[0].init && (!isForIn || this.options.ecmaVersion < 8 || this.strict || "var" !== init.kind || "Identifier" !== init.declarations[0].id.type)) this.raise(init.start, (isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer");
    node.left = init;
    node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
    this.expect(types$1.parenR);
    node.body = this.parseStatement("for");
    this.exitScope();
    this.labels.pop();
    return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement");
};
pp$8.parseVar = function(node, isFor, kind, allowMissingInitializer) {
    node.declarations = [];
    node.kind = kind;
    for(;;){
        var decl = this.startNode();
        this.parseVarId(decl, kind);
        if (this.eat(types$1.eq)) decl.init = this.parseMaybeAssign(isFor);
        else if (allowMissingInitializer || "const" !== kind || this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) if (allowMissingInitializer || "using" !== kind && "await using" !== kind || !(this.options.ecmaVersion >= 17) || this.type === types$1._in || this.isContextual("of")) if (allowMissingInitializer || "Identifier" === decl.id.type || isFor && (this.type === types$1._in || this.isContextual("of"))) decl.init = null;
        else this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
        else this.raise(this.lastTokEnd, "Missing initializer in " + kind + " declaration");
        else this.unexpected();
        node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
        if (!this.eat(types$1.comma)) break;
    }
    return node;
};
pp$8.parseVarId = function(decl, kind) {
    decl.id = "using" === kind || "await using" === kind ? this.parseIdent() : this.parseBindingAtom();
    this.checkLValPattern(decl.id, "var" === kind ? BIND_VAR : BIND_LEXICAL, false);
};
var FUNC_STATEMENT = 1, FUNC_HANGING_STATEMENT = 2, FUNC_NULLABLE_ID = 4;
pp$8.parseFunction = function(node, statement, allowExpressionBody, isAsync, forInit) {
    this.initFunction(node);
    if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
        if (this.type === types$1.star && statement & FUNC_HANGING_STATEMENT) this.unexpected();
        node.generator = this.eat(types$1.star);
    }
    if (this.options.ecmaVersion >= 8) node.async = !!isAsync;
    if (statement & FUNC_STATEMENT) {
        node.id = statement & FUNC_NULLABLE_ID && this.type !== types$1.name ? null : this.parseIdent();
        if (node.id && !(statement & FUNC_HANGING_STATEMENT)) this.checkLValSimple(node.id, this.strict || node.generator || node.async ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION);
    }
    var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    this.enterScope(functionFlags(node.async, node.generator));
    if (!(statement & FUNC_STATEMENT)) node.id = this.type === types$1.name ? this.parseIdent() : null;
    this.parseFunctionParams(node);
    this.parseFunctionBody(node, allowExpressionBody, false, forInit);
    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, statement & FUNC_STATEMENT ? "FunctionDeclaration" : "FunctionExpression");
};
pp$8.parseFunctionParams = function(node) {
    this.expect(types$1.parenL);
    node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
    this.checkYieldAwaitInDefaultParams();
};
pp$8.parseClass = function(node, isStatement) {
    this.next();
    var oldStrict = this.strict;
    this.strict = true;
    this.parseClassId(node, isStatement);
    this.parseClassSuper(node);
    var privateNameMap = this.enterClassBody();
    var classBody = this.startNode();
    var hadConstructor = false;
    classBody.body = [];
    this.expect(types$1.braceL);
    while(this.type !== types$1.braceR){
        var element = this.parseClassElement(null !== node.superClass);
        if (element) {
            classBody.body.push(element);
            if ("MethodDefinition" === element.type && "constructor" === element.kind) {
                if (hadConstructor) this.raiseRecoverable(element.start, "Duplicate constructor in the same class");
                hadConstructor = true;
            } else if (element.key && "PrivateIdentifier" === element.key.type && isPrivateNameConflicted(privateNameMap, element)) this.raiseRecoverable(element.key.start, "Identifier '#" + element.key.name + "' has already been declared");
        }
    }
    this.strict = oldStrict;
    this.next();
    node.body = this.finishNode(classBody, "ClassBody");
    this.exitClassBody();
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
};
pp$8.parseClassElement = function(constructorAllowsSuper) {
    if (this.eat(types$1.semi)) return null;
    var ecmaVersion = this.options.ecmaVersion;
    var node = this.startNode();
    var keyName = "";
    var isGenerator = false;
    var isAsync = false;
    var kind = "method";
    var isStatic = false;
    if (this.eatContextual("static")) {
        if (ecmaVersion >= 13 && this.eat(types$1.braceL)) {
            this.parseClassStaticBlock(node);
            return node;
        }
        if (this.isClassElementNameStart() || this.type === types$1.star) isStatic = true;
        else keyName = "static";
    }
    node.static = isStatic;
    if (!keyName && ecmaVersion >= 8 && this.eatContextual("async")) if ((this.isClassElementNameStart() || this.type === types$1.star) && !this.canInsertSemicolon()) isAsync = true;
    else keyName = "async";
    if (!keyName && (ecmaVersion >= 9 || !isAsync) && this.eat(types$1.star)) isGenerator = true;
    if (!keyName && !isAsync && !isGenerator) {
        var lastValue = this.value;
        if (this.eatContextual("get") || this.eatContextual("set")) if (this.isClassElementNameStart()) kind = lastValue;
        else keyName = lastValue;
    }
    if (keyName) {
        node.computed = false;
        node.key = this.startNodeAt(this.lastTokStart, this.lastTokStartLoc);
        node.key.name = keyName;
        this.finishNode(node.key, "Identifier");
    } else this.parseClassElementName(node);
    if (ecmaVersion < 13 || this.type === types$1.parenL || "method" !== kind || isGenerator || isAsync) {
        var isConstructor = !node.static && checkKeyName(node, "constructor");
        var allowsDirectSuper = isConstructor && constructorAllowsSuper;
        if (isConstructor && "method" !== kind) this.raise(node.key.start, "Constructor can't have get/set modifier");
        node.kind = isConstructor ? "constructor" : kind;
        this.parseClassMethod(node, isGenerator, isAsync, allowsDirectSuper);
    } else this.parseClassField(node);
    return node;
};
pp$8.isClassElementNameStart = function() {
    return this.type === types$1.name || this.type === types$1.privateId || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword;
};
pp$8.parseClassElementName = function(element) {
    if (this.type === types$1.privateId) {
        if ("constructor" === this.value) this.raise(this.start, "Classes can't have an element named '#constructor'");
        element.computed = false;
        element.key = this.parsePrivateIdent();
    } else this.parsePropertyName(element);
};
pp$8.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
    var key = method.key;
    if ("constructor" === method.kind) {
        if (isGenerator) this.raise(key.start, "Constructor can't be a generator");
        if (isAsync) this.raise(key.start, "Constructor can't be an async method");
    } else if (method.static && checkKeyName(method, "prototype")) this.raise(key.start, "Classes may not have a static property named prototype");
    var value = method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);
    if ("get" === method.kind && 0 !== value.params.length) this.raiseRecoverable(value.start, "getter should have no params");
    if ("set" === method.kind && 1 !== value.params.length) this.raiseRecoverable(value.start, "setter should have exactly one param");
    if ("set" === method.kind && "RestElement" === value.params[0].type) this.raiseRecoverable(value.params[0].start, "Setter cannot use rest params");
    return this.finishNode(method, "MethodDefinition");
};
pp$8.parseClassField = function(field) {
    if (checkKeyName(field, "constructor")) this.raise(field.key.start, "Classes can't have a field named 'constructor'");
    else if (field.static && checkKeyName(field, "prototype")) this.raise(field.key.start, "Classes can't have a static field named 'prototype'");
    if (this.eat(types$1.eq)) {
        this.enterScope(SCOPE_CLASS_FIELD_INIT | SCOPE_SUPER);
        field.value = this.parseMaybeAssign();
        this.exitScope();
    } else field.value = null;
    this.semicolon();
    return this.finishNode(field, "PropertyDefinition");
};
pp$8.parseClassStaticBlock = function(node) {
    node.body = [];
    var oldLabels = this.labels;
    this.labels = [];
    this.enterScope(SCOPE_CLASS_STATIC_BLOCK | SCOPE_SUPER);
    while(this.type !== types$1.braceR){
        var stmt = this.parseStatement(null);
        node.body.push(stmt);
    }
    this.next();
    this.exitScope();
    this.labels = oldLabels;
    return this.finishNode(node, "StaticBlock");
};
pp$8.parseClassId = function(node, isStatement) {
    if (this.type === types$1.name) {
        node.id = this.parseIdent();
        if (isStatement) this.checkLValSimple(node.id, BIND_LEXICAL, false);
    } else {
        if (true === isStatement) this.unexpected();
        node.id = null;
    }
};
pp$8.parseClassSuper = function(node) {
    node.superClass = this.eat(types$1._extends) ? this.parseExprSubscripts(null, false) : null;
};
pp$8.enterClassBody = function() {
    var element = {
        declared: Object.create(null),
        used: []
    };
    this.privateNameStack.push(element);
    return element.declared;
};
pp$8.exitClassBody = function() {
    var ref = this.privateNameStack.pop();
    var declared = ref.declared;
    var used = ref.used;
    if (!this.options.checkPrivateFields) return;
    var len = this.privateNameStack.length;
    var parent = 0 === len ? null : this.privateNameStack[len - 1];
    for(var i = 0; i < used.length; ++i){
        var id = used[i];
        if (!hasOwn(declared, id.name)) if (parent) parent.used.push(id);
        else this.raiseRecoverable(id.start, "Private field '#" + id.name + "' must be declared in an enclosing class");
    }
};
function isPrivateNameConflicted(privateNameMap, element) {
    var name = element.key.name;
    var curr = privateNameMap[name];
    var next = "true";
    if ("MethodDefinition" === element.type && ("get" === element.kind || "set" === element.kind)) next = (element.static ? "s" : "i") + element.kind;
    if ("iget" === curr && "iset" === next || "iset" === curr && "iget" === next || "sget" === curr && "sset" === next || "sset" === curr && "sget" === next) {
        privateNameMap[name] = "true";
        return false;
    } else {
        if (curr) return true;
        privateNameMap[name] = next;
        return false;
    }
}
function checkKeyName(node, name) {
    var computed = node.computed;
    var key = node.key;
    return !computed && ("Identifier" === key.type && key.name === name || "Literal" === key.type && key.value === name);
}
pp$8.parseExportAllDeclaration = function(node, exports$1) {
    if (this.options.ecmaVersion >= 11) if (this.eatContextual("as")) {
        node.exported = this.parseModuleExportName();
        this.checkExport(exports$1, node.exported, this.lastTokStart);
    } else node.exported = null;
    this.expectContextual("from");
    if (this.type !== types$1.string) this.unexpected();
    node.source = this.parseExprAtom();
    if (this.options.ecmaVersion >= 16) node.attributes = this.parseWithClause();
    this.semicolon();
    return this.finishNode(node, "ExportAllDeclaration");
};
pp$8.parseExport = function(node, exports$1) {
    this.next();
    if (this.eat(types$1.star)) return this.parseExportAllDeclaration(node, exports$1);
    if (this.eat(types$1._default)) {
        this.checkExport(exports$1, "default", this.lastTokStart);
        node.declaration = this.parseExportDefaultDeclaration();
        return this.finishNode(node, "ExportDefaultDeclaration");
    }
    if (this.shouldParseExportStatement()) {
        node.declaration = this.parseExportDeclaration(node);
        if ("VariableDeclaration" === node.declaration.type) this.checkVariableExport(exports$1, node.declaration.declarations);
        else this.checkExport(exports$1, node.declaration.id, node.declaration.id.start);
        node.specifiers = [];
        node.source = null;
        if (this.options.ecmaVersion >= 16) node.attributes = [];
    } else {
        node.declaration = null;
        node.specifiers = this.parseExportSpecifiers(exports$1);
        if (this.eatContextual("from")) {
            if (this.type !== types$1.string) this.unexpected();
            node.source = this.parseExprAtom();
            if (this.options.ecmaVersion >= 16) node.attributes = this.parseWithClause();
        } else {
            for(var i = 0, list = node.specifiers; i < list.length; i += 1){
                var spec = list[i];
                this.checkUnreserved(spec.local);
                this.checkLocalExport(spec.local);
                if ("Literal" === spec.local.type) this.raise(spec.local.start, "A string literal cannot be used as an exported binding without `from`.");
            }
            node.source = null;
            if (this.options.ecmaVersion >= 16) node.attributes = [];
        }
        this.semicolon();
    }
    return this.finishNode(node, "ExportNamedDeclaration");
};
pp$8.parseExportDeclaration = function(node) {
    return this.parseStatement(null);
};
pp$8.parseExportDefaultDeclaration = function() {
    var isAsync;
    if (this.type === types$1._function || (isAsync = this.isAsyncFunction())) {
        var fNode = this.startNode();
        this.next();
        if (isAsync) this.next();
        return this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync);
    } else if (this.type === types$1._class) {
        var cNode = this.startNode();
        return this.parseClass(cNode, "nullableID");
    } else {
        var declaration = this.parseMaybeAssign();
        this.semicolon();
        return declaration;
    }
};
pp$8.checkExport = function(exports$1, name, pos) {
    if (!exports$1) return;
    if ("string" != typeof name) name = "Identifier" === name.type ? name.name : name.value;
    if (hasOwn(exports$1, name)) this.raiseRecoverable(pos, "Duplicate export '" + name + "'");
    exports$1[name] = true;
};
pp$8.checkPatternExport = function(exports$1, pat) {
    var type = pat.type;
    if ("Identifier" === type) this.checkExport(exports$1, pat, pat.start);
    else if ("ObjectPattern" === type) for(var i = 0, list = pat.properties; i < list.length; i += 1){
        var prop = list[i];
        this.checkPatternExport(exports$1, prop);
    }
    else if ("ArrayPattern" === type) for(var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1){
        var elt = list$1[i$1];
        if (elt) this.checkPatternExport(exports$1, elt);
    }
    else if ("Property" === type) this.checkPatternExport(exports$1, pat.value);
    else if ("AssignmentPattern" === type) this.checkPatternExport(exports$1, pat.left);
    else if ("RestElement" === type) this.checkPatternExport(exports$1, pat.argument);
};
pp$8.checkVariableExport = function(exports$1, decls) {
    if (!exports$1) return;
    for(var i = 0, list = decls; i < list.length; i += 1){
        var decl = list[i];
        this.checkPatternExport(exports$1, decl.id);
    }
};
pp$8.shouldParseExportStatement = function() {
    return "var" === this.type.keyword || "const" === this.type.keyword || "class" === this.type.keyword || "function" === this.type.keyword || this.isLet() || this.isAsyncFunction();
};
pp$8.parseExportSpecifier = function(exports$1) {
    var node = this.startNode();
    node.local = this.parseModuleExportName();
    node.exported = this.eatContextual("as") ? this.parseModuleExportName() : node.local;
    this.checkExport(exports$1, node.exported, node.exported.start);
    return this.finishNode(node, "ExportSpecifier");
};
pp$8.parseExportSpecifiers = function(exports$1) {
    var nodes = [], first = true;
    this.expect(types$1.braceL);
    while(!this.eat(types$1.braceR)){
        if (first) first = false;
        else {
            this.expect(types$1.comma);
            if (this.afterTrailingComma(types$1.braceR)) break;
        }
        nodes.push(this.parseExportSpecifier(exports$1));
    }
    return nodes;
};
pp$8.parseImport = function(node) {
    this.next();
    if (this.type === types$1.string) {
        node.specifiers = empty$1;
        node.source = this.parseExprAtom();
    } else {
        node.specifiers = this.parseImportSpecifiers();
        this.expectContextual("from");
        node.source = this.type === types$1.string ? this.parseExprAtom() : this.unexpected();
    }
    if (this.options.ecmaVersion >= 16) node.attributes = this.parseWithClause();
    this.semicolon();
    return this.finishNode(node, "ImportDeclaration");
};
pp$8.parseImportSpecifier = function() {
    var node = this.startNode();
    node.imported = this.parseModuleExportName();
    if (this.eatContextual("as")) node.local = this.parseIdent();
    else {
        this.checkUnreserved(node.imported);
        node.local = node.imported;
    }
    this.checkLValSimple(node.local, BIND_LEXICAL);
    return this.finishNode(node, "ImportSpecifier");
};
pp$8.parseImportDefaultSpecifier = function() {
    var node = this.startNode();
    node.local = this.parseIdent();
    this.checkLValSimple(node.local, BIND_LEXICAL);
    return this.finishNode(node, "ImportDefaultSpecifier");
};
pp$8.parseImportNamespaceSpecifier = function() {
    var node = this.startNode();
    this.next();
    this.expectContextual("as");
    node.local = this.parseIdent();
    this.checkLValSimple(node.local, BIND_LEXICAL);
    return this.finishNode(node, "ImportNamespaceSpecifier");
};
pp$8.parseImportSpecifiers = function() {
    var nodes = [], first = true;
    if (this.type === types$1.name) {
        nodes.push(this.parseImportDefaultSpecifier());
        if (!this.eat(types$1.comma)) return nodes;
    }
    if (this.type === types$1.star) {
        nodes.push(this.parseImportNamespaceSpecifier());
        return nodes;
    }
    this.expect(types$1.braceL);
    while(!this.eat(types$1.braceR)){
        if (first) first = false;
        else {
            this.expect(types$1.comma);
            if (this.afterTrailingComma(types$1.braceR)) break;
        }
        nodes.push(this.parseImportSpecifier());
    }
    return nodes;
};
pp$8.parseWithClause = function() {
    var nodes = [];
    if (!this.eat(types$1._with)) return nodes;
    this.expect(types$1.braceL);
    var attributeKeys = {};
    var first = true;
    while(!this.eat(types$1.braceR)){
        if (first) first = false;
        else {
            this.expect(types$1.comma);
            if (this.afterTrailingComma(types$1.braceR)) break;
        }
        var attr = this.parseImportAttribute();
        var keyName = "Identifier" === attr.key.type ? attr.key.name : attr.key.value;
        if (hasOwn(attributeKeys, keyName)) this.raiseRecoverable(attr.key.start, "Duplicate attribute key '" + keyName + "'");
        attributeKeys[keyName] = true;
        nodes.push(attr);
    }
    return nodes;
};
pp$8.parseImportAttribute = function() {
    var node = this.startNode();
    node.key = this.type === types$1.string ? this.parseExprAtom() : this.parseIdent("never" !== this.options.allowReserved);
    this.expect(types$1.colon);
    if (this.type !== types$1.string) this.unexpected();
    node.value = this.parseExprAtom();
    return this.finishNode(node, "ImportAttribute");
};
pp$8.parseModuleExportName = function() {
    if (this.options.ecmaVersion >= 13 && this.type === types$1.string) {
        var stringLiteral = this.parseLiteral(this.value);
        if (loneSurrogate.test(stringLiteral.value)) this.raise(stringLiteral.start, "An export name cannot include a lone surrogate.");
        return stringLiteral;
    }
    return this.parseIdent(true);
};
pp$8.adaptDirectivePrologue = function(statements) {
    for(var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i)statements[i].directive = statements[i].expression.raw.slice(1, -1);
};
pp$8.isDirectiveCandidate = function(statement) {
    return this.options.ecmaVersion >= 5 && "ExpressionStatement" === statement.type && "Literal" === statement.expression.type && "string" == typeof statement.expression.value && ("\"" === this.input[statement.start] || "'" === this.input[statement.start]);
};
var pp$7 = acorn_Parser.prototype;
pp$7.toAssignable = function(node, isBinding, refDestructuringErrors) {
    if (this.options.ecmaVersion >= 6 && node) switch(node.type){
        case "Identifier":
            if (this.inAsync && "await" === node.name) this.raise(node.start, "Cannot use 'await' as identifier inside an async function");
            break;
        case "ObjectPattern":
        case "ArrayPattern":
        case "AssignmentPattern":
        case "RestElement":
            break;
        case "ObjectExpression":
            node.type = "ObjectPattern";
            if (refDestructuringErrors) this.checkPatternErrors(refDestructuringErrors, true);
            for(var i = 0, list = node.properties; i < list.length; i += 1){
                var prop = list[i];
                this.toAssignable(prop, isBinding);
                if ("RestElement" === prop.type && ("ArrayPattern" === prop.argument.type || "ObjectPattern" === prop.argument.type)) this.raise(prop.argument.start, "Unexpected token");
            }
            break;
        case "Property":
            if ("init" !== node.kind) this.raise(node.key.start, "Object pattern can't contain getter or setter");
            this.toAssignable(node.value, isBinding);
            break;
        case "ArrayExpression":
            node.type = "ArrayPattern";
            if (refDestructuringErrors) this.checkPatternErrors(refDestructuringErrors, true);
            this.toAssignableList(node.elements, isBinding);
            break;
        case "SpreadElement":
            node.type = "RestElement";
            this.toAssignable(node.argument, isBinding);
            if ("AssignmentPattern" === node.argument.type) this.raise(node.argument.start, "Rest elements cannot have a default value");
            break;
        case "AssignmentExpression":
            if ("=" !== node.operator) this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
            node.type = "AssignmentPattern";
            delete node.operator;
            this.toAssignable(node.left, isBinding);
            break;
        case "ParenthesizedExpression":
            this.toAssignable(node.expression, isBinding, refDestructuringErrors);
            break;
        case "ChainExpression":
            this.raiseRecoverable(node.start, "Optional chaining cannot appear in left-hand side");
            break;
        case "MemberExpression":
            if (!isBinding) break;
        default:
            this.raise(node.start, "Assigning to rvalue");
    }
    else if (refDestructuringErrors) this.checkPatternErrors(refDestructuringErrors, true);
    return node;
};
pp$7.toAssignableList = function(exprList, isBinding) {
    var end = exprList.length;
    for(var i = 0; i < end; i++){
        var elt = exprList[i];
        if (elt) this.toAssignable(elt, isBinding);
    }
    if (end) {
        var last = exprList[end - 1];
        if (6 === this.options.ecmaVersion && isBinding && last && "RestElement" === last.type && "Identifier" !== last.argument.type) this.unexpected(last.argument.start);
    }
    return exprList;
};
pp$7.parseSpread = function(refDestructuringErrors) {
    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    return this.finishNode(node, "SpreadElement");
};
pp$7.parseRestBinding = function() {
    var node = this.startNode();
    this.next();
    if (6 === this.options.ecmaVersion && this.type !== types$1.name) this.unexpected();
    node.argument = this.parseBindingAtom();
    return this.finishNode(node, "RestElement");
};
pp$7.parseBindingAtom = function() {
    if (this.options.ecmaVersion >= 6) switch(this.type){
        case types$1.bracketL:
            var node = this.startNode();
            this.next();
            node.elements = this.parseBindingList(types$1.bracketR, true, true);
            return this.finishNode(node, "ArrayPattern");
        case types$1.braceL:
            return this.parseObj(true);
    }
    return this.parseIdent();
};
pp$7.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowModifiers) {
    var elts = [], first = true;
    while(!this.eat(close)){
        if (first) first = false;
        else this.expect(types$1.comma);
        if (allowEmpty && this.type === types$1.comma) elts.push(null);
        else if (allowTrailingComma && this.afterTrailingComma(close)) break;
        else if (this.type === types$1.ellipsis) {
            var rest = this.parseRestBinding();
            this.parseBindingListItem(rest);
            elts.push(rest);
            if (this.type === types$1.comma) this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
            this.expect(close);
            break;
        } else elts.push(this.parseAssignableListItem(allowModifiers));
    }
    return elts;
};
pp$7.parseAssignableListItem = function(allowModifiers) {
    var elem = this.parseMaybeDefault(this.start, this.startLoc);
    this.parseBindingListItem(elem);
    return elem;
};
pp$7.parseBindingListItem = function(param) {
    return param;
};
pp$7.parseMaybeDefault = function(startPos, startLoc, left) {
    left = left || this.parseBindingAtom();
    if (this.options.ecmaVersion < 6 || !this.eat(types$1.eq)) return left;
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.right = this.parseMaybeAssign();
    return this.finishNode(node, "AssignmentPattern");
};
pp$7.checkLValSimple = function(expr, bindingType, checkClashes) {
    if (void 0 === bindingType) bindingType = BIND_NONE;
    var isBind = bindingType !== BIND_NONE;
    switch(expr.type){
        case "Identifier":
            if (this.strict && this.reservedWordsStrictBind.test(expr.name)) this.raiseRecoverable(expr.start, (isBind ? "Binding " : "Assigning to ") + expr.name + " in strict mode");
            if (isBind) {
                if (bindingType === BIND_LEXICAL && "let" === expr.name) this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name");
                if (checkClashes) {
                    if (hasOwn(checkClashes, expr.name)) this.raiseRecoverable(expr.start, "Argument name clash");
                    checkClashes[expr.name] = true;
                }
                if (bindingType !== BIND_OUTSIDE) this.declareName(expr.name, bindingType, expr.start);
            }
            break;
        case "ChainExpression":
            this.raiseRecoverable(expr.start, "Optional chaining cannot appear in left-hand side");
            break;
        case "MemberExpression":
            if (isBind) this.raiseRecoverable(expr.start, "Binding member expression");
            break;
        case "ParenthesizedExpression":
            if (isBind) this.raiseRecoverable(expr.start, "Binding parenthesized expression");
            return this.checkLValSimple(expr.expression, bindingType, checkClashes);
        default:
            this.raise(expr.start, (isBind ? "Binding" : "Assigning to") + " rvalue");
    }
};
pp$7.checkLValPattern = function(expr, bindingType, checkClashes) {
    if (void 0 === bindingType) bindingType = BIND_NONE;
    switch(expr.type){
        case "ObjectPattern":
            for(var i = 0, list = expr.properties; i < list.length; i += 1){
                var prop = list[i];
                this.checkLValInnerPattern(prop, bindingType, checkClashes);
            }
            break;
        case "ArrayPattern":
            for(var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1){
                var elem = list$1[i$1];
                if (elem) this.checkLValInnerPattern(elem, bindingType, checkClashes);
            }
            break;
        default:
            this.checkLValSimple(expr, bindingType, checkClashes);
    }
};
pp$7.checkLValInnerPattern = function(expr, bindingType, checkClashes) {
    if (void 0 === bindingType) bindingType = BIND_NONE;
    switch(expr.type){
        case "Property":
            this.checkLValInnerPattern(expr.value, bindingType, checkClashes);
            break;
        case "AssignmentPattern":
            this.checkLValPattern(expr.left, bindingType, checkClashes);
            break;
        case "RestElement":
            this.checkLValPattern(expr.argument, bindingType, checkClashes);
            break;
        default:
            this.checkLValPattern(expr, bindingType, checkClashes);
    }
};
var acorn_TokContext = function(token, isExpr, preserveSpace, override, generator) {
    this.token = token;
    this.isExpr = !!isExpr;
    this.preserveSpace = !!preserveSpace;
    this.override = override;
    this.generator = !!generator;
};
var types = {
    b_stat: new acorn_TokContext("{", false),
    b_expr: new acorn_TokContext("{", true),
    b_tmpl: new acorn_TokContext("${", false),
    p_stat: new acorn_TokContext("(", false),
    p_expr: new acorn_TokContext("(", true),
    q_tmpl: new acorn_TokContext("`", true, true, function(p) {
        return p.tryReadTemplateToken();
    }),
    f_stat: new acorn_TokContext("function", false),
    f_expr: new acorn_TokContext("function", true),
    f_expr_gen: new acorn_TokContext("function", true, false, null, true),
    f_gen: new acorn_TokContext("function", false, false, null, true)
};
var pp$6 = acorn_Parser.prototype;
pp$6.initialContext = function() {
    return [
        types.b_stat
    ];
};
pp$6.curContext = function() {
    return this.context[this.context.length - 1];
};
pp$6.braceIsBlock = function(prevType) {
    var parent = this.curContext();
    if (parent === types.f_expr || parent === types.f_stat) return true;
    if (prevType === types$1.colon && (parent === types.b_stat || parent === types.b_expr)) return !parent.isExpr;
    if (prevType === types$1._return || prevType === types$1.name && this.exprAllowed) return lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
    if (prevType === types$1._else || prevType === types$1.semi || prevType === types$1.eof || prevType === types$1.parenR || prevType === types$1.arrow) return true;
    if (prevType === types$1.braceL) return parent === types.b_stat;
    if (prevType === types$1._var || prevType === types$1._const || prevType === types$1.name) return false;
    return !this.exprAllowed;
};
pp$6.inGeneratorContext = function() {
    for(var i = this.context.length - 1; i >= 1; i--){
        var context = this.context[i];
        if ("function" === context.token) return context.generator;
    }
    return false;
};
pp$6.updateContext = function(prevType) {
    var update, type = this.type;
    if (type.keyword && prevType === types$1.dot) this.exprAllowed = false;
    else if (update = type.updateContext) update.call(this, prevType);
    else this.exprAllowed = type.beforeExpr;
};
pp$6.overrideContext = function(tokenCtx) {
    if (this.curContext() !== tokenCtx) this.context[this.context.length - 1] = tokenCtx;
};
types$1.parenR.updateContext = types$1.braceR.updateContext = function() {
    if (1 === this.context.length) {
        this.exprAllowed = true;
        return;
    }
    var out = this.context.pop();
    if (out === types.b_stat && "function" === this.curContext().token) out = this.context.pop();
    this.exprAllowed = !out.isExpr;
};
types$1.braceL.updateContext = function(prevType) {
    this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
    this.exprAllowed = true;
};
types$1.dollarBraceL.updateContext = function() {
    this.context.push(types.b_tmpl);
    this.exprAllowed = true;
};
types$1.parenL.updateContext = function(prevType) {
    var statementParens = prevType === types$1._if || prevType === types$1._for || prevType === types$1._with || prevType === types$1._while;
    this.context.push(statementParens ? types.p_stat : types.p_expr);
    this.exprAllowed = true;
};
types$1.incDec.updateContext = function() {};
types$1._function.updateContext = types$1._class.updateContext = function(prevType) {
    if (!prevType.beforeExpr || prevType === types$1._else || prevType === types$1.semi && this.curContext() !== types.p_stat || prevType === types$1._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) || (prevType === types$1.colon || prevType === types$1.braceL) && this.curContext() === types.b_stat) this.context.push(types.f_stat);
    else this.context.push(types.f_expr);
    this.exprAllowed = false;
};
types$1.colon.updateContext = function() {
    if ("function" === this.curContext().token) this.context.pop();
    this.exprAllowed = true;
};
types$1.backQuote.updateContext = function() {
    if (this.curContext() === types.q_tmpl) this.context.pop();
    else this.context.push(types.q_tmpl);
    this.exprAllowed = false;
};
types$1.star.updateContext = function(prevType) {
    if (prevType === types$1._function) {
        var index = this.context.length - 1;
        if (this.context[index] === types.f_expr) this.context[index] = types.f_expr_gen;
        else this.context[index] = types.f_gen;
    }
    this.exprAllowed = true;
};
types$1.name.updateContext = function(prevType) {
    var allowed = false;
    if (this.options.ecmaVersion >= 6 && prevType !== types$1.dot) {
        if ("of" === this.value && !this.exprAllowed || "yield" === this.value && this.inGeneratorContext()) allowed = true;
    }
    this.exprAllowed = allowed;
};
var pp$5 = acorn_Parser.prototype;
pp$5.checkPropClash = function(prop, propHash, refDestructuringErrors) {
    if (this.options.ecmaVersion >= 9 && "SpreadElement" === prop.type) return;
    if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand)) return;
    var key = prop.key;
    var name;
    switch(key.type){
        case "Identifier":
            name = key.name;
            break;
        case "Literal":
            name = String(key.value);
            break;
        default:
            return;
    }
    var kind = prop.kind;
    if (this.options.ecmaVersion >= 6) {
        if ("__proto__" === name && "init" === kind) {
            if (propHash.proto) if (refDestructuringErrors) {
                if (refDestructuringErrors.doubleProto < 0) refDestructuringErrors.doubleProto = key.start;
            } else this.raiseRecoverable(key.start, "Redefinition of __proto__ property");
            propHash.proto = true;
        }
        return;
    }
    name = "$" + name;
    var other = propHash[name];
    if (other) {
        var redefinition;
        redefinition = "init" === kind ? this.strict && other.init || other.get || other.set : other.init || other[kind];
        if (redefinition) this.raiseRecoverable(key.start, "Redefinition of property");
    } else other = propHash[name] = {
        init: false,
        get: false,
        set: false
    };
    other[kind] = true;
};
pp$5.parseExpression = function(forInit, refDestructuringErrors) {
    var this$1$1 = this;
    return this.catchStackOverflow(function() {
        var startPos = this$1$1.start, startLoc = this$1$1.startLoc;
        var expr = this$1$1.parseMaybeAssign(forInit, refDestructuringErrors);
        if (this$1$1.type === types$1.comma) {
            var node = this$1$1.startNodeAt(startPos, startLoc);
            node.expressions = [
                expr
            ];
            while(this$1$1.eat(types$1.comma))node.expressions.push(this$1$1.parseMaybeAssign(forInit, refDestructuringErrors));
            return this$1$1.finishNode(node, "SequenceExpression");
        }
        return expr;
    });
};
pp$5.parseMaybeAssign = function(forInit, refDestructuringErrors, afterLeftParse) {
    if (this.isContextual("yield")) if (this.inGenerator) return this.parseYield(forInit);
    else this.exprAllowed = false;
    var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldDoubleProto = -1;
    if (refDestructuringErrors) {
        oldParenAssign = refDestructuringErrors.parenthesizedAssign;
        oldTrailingComma = refDestructuringErrors.trailingComma;
        oldDoubleProto = refDestructuringErrors.doubleProto;
        refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
    } else {
        refDestructuringErrors = new acorn_DestructuringErrors;
        ownDestructuringErrors = true;
    }
    var startPos = this.start, startLoc = this.startLoc;
    if (this.type === types$1.parenL || this.type === types$1.name) {
        this.potentialArrowAt = this.start;
        this.potentialArrowInForAwait = "await" === forInit;
    }
    var left = this.parseMaybeConditional(forInit, refDestructuringErrors);
    if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc);
    if (this.type.isAssign) {
        var node = this.startNodeAt(startPos, startLoc);
        node.operator = this.value;
        if (this.type === types$1.eq) left = this.toAssignable(left, false, refDestructuringErrors);
        if (!ownDestructuringErrors) {
            refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
            if (refDestructuringErrors.shorthandAssign >= left.start) refDestructuringErrors.shorthandAssign = -1;
            if (refDestructuringErrors.doubleProto >= left.start) refDestructuringErrors.doubleProto = -1;
        }
        if (this.type === types$1.eq) this.checkLValPattern(left);
        else this.checkLValSimple(left);
        node.left = left;
        this.next();
        node.right = this.parseMaybeAssign(forInit);
        if (oldDoubleProto > -1) refDestructuringErrors.doubleProto = oldDoubleProto;
        return this.finishNode(node, "AssignmentExpression");
    } else if (ownDestructuringErrors) this.checkExpressionErrors(refDestructuringErrors, true);
    if (oldParenAssign > -1) refDestructuringErrors.parenthesizedAssign = oldParenAssign;
    if (oldTrailingComma > -1) refDestructuringErrors.trailingComma = oldTrailingComma;
    return left;
};
pp$5.parseMaybeConditional = function(forInit, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseExprOps(forInit, refDestructuringErrors);
    if (this.checkExpressionErrors(refDestructuringErrors)) return expr;
    if (!("ArrowFunctionExpression" === expr.type && expr.start === startPos) && this.eat(types$1.question)) {
        var node = this.startNodeAt(startPos, startLoc);
        node.test = expr;
        node.consequent = this.parseMaybeAssign();
        this.expect(types$1.colon);
        node.alternate = this.parseMaybeAssign(forInit);
        return this.finishNode(node, "ConditionalExpression");
    }
    return expr;
};
pp$5.parseExprOps = function(forInit, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseMaybeUnary(refDestructuringErrors, false, false, forInit);
    if (this.checkExpressionErrors(refDestructuringErrors)) return expr;
    return expr.start === startPos && "ArrowFunctionExpression" === expr.type ? expr : this.parseExprOp(expr, startPos, startLoc, -1, forInit);
};
pp$5.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, forInit) {
    var prec = this.type.binop;
    if (null != prec && (!forInit || this.type !== types$1._in)) {
        if (prec > minPrec) {
            var logical = this.type === types$1.logicalOR || this.type === types$1.logicalAND;
            var coalesce = this.type === types$1.coalesce;
            if (coalesce) prec = types$1.logicalAND.binop;
            var op = this.value;
            this.next();
            var startPos = this.start, startLoc = this.startLoc;
            var right = this.parseExprOp(this.parseMaybeUnary(null, false, false, forInit), startPos, startLoc, prec, forInit);
            var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical || coalesce);
            if (logical && this.type === types$1.coalesce || coalesce && (this.type === types$1.logicalOR || this.type === types$1.logicalAND)) this.raiseRecoverable(this.start, "Logical expressions and coalesce expressions cannot be mixed. Wrap either by parentheses");
            return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, forInit);
        }
    }
    return left;
};
pp$5.buildBinary = function(startPos, startLoc, left, right, op, logical) {
    if ("PrivateIdentifier" === right.type) this.raise(right.start, "Private identifier can only be left side of binary expression");
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.operator = op;
    node.right = right;
    return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression");
};
pp$5.parseMaybeUnary = function(refDestructuringErrors, sawUnary, incDec, forInit) {
    var startPos = this.start, startLoc = this.startLoc, expr;
    if (this.isContextual("await") && this.canAwait) {
        expr = this.parseAwait(forInit);
        sawUnary = true;
    } else if (this.type.prefix) {
        var node = this.startNode(), update = this.type === types$1.incDec;
        node.operator = this.value;
        node.prefix = true;
        this.next();
        node.argument = this.parseMaybeUnary(null, true, update, forInit);
        this.checkExpressionErrors(refDestructuringErrors, true);
        if (update) this.checkLValSimple(node.argument);
        else if (this.strict && "delete" === node.operator && isLocalVariableAccess(node.argument)) this.raiseRecoverable(node.start, "Deleting local variable in strict mode");
        else if ("delete" === node.operator && isPrivateFieldAccess(node.argument)) this.raiseRecoverable(node.start, "Private fields can not be deleted");
        else sawUnary = true;
        expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
    } else if (sawUnary || this.type !== types$1.privateId) {
        expr = this.parseExprSubscripts(refDestructuringErrors, forInit);
        if (this.checkExpressionErrors(refDestructuringErrors)) return expr;
        while(this.type.postfix && !this.canInsertSemicolon()){
            var node$1 = this.startNodeAt(startPos, startLoc);
            node$1.operator = this.value;
            node$1.prefix = false;
            node$1.argument = expr;
            this.checkLValSimple(expr);
            this.next();
            expr = this.finishNode(node$1, "UpdateExpression");
        }
    } else {
        if ((forInit || 0 === this.privateNameStack.length) && this.options.checkPrivateFields) this.unexpected();
        expr = this.parsePrivateIdent();
        if (this.type !== types$1._in) this.unexpected();
    }
    if (!(!incDec && !("ArrowFunctionExpression" === expr.type && expr.start === startPos) && this.eat(types$1.starstar))) return expr;
    else {
        if (!sawUnary) return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false, false, forInit), "**", false);
        this.unexpected(this.lastTokStart);
    }
};
function isLocalVariableAccess(node) {
    return "Identifier" === node.type || "ParenthesizedExpression" === node.type && isLocalVariableAccess(node.expression);
}
function isPrivateFieldAccess(node) {
    return "MemberExpression" === node.type && "PrivateIdentifier" === node.property.type || "ChainExpression" === node.type && isPrivateFieldAccess(node.expression) || "ParenthesizedExpression" === node.type && isPrivateFieldAccess(node.expression);
}
pp$5.parseExprSubscripts = function(refDestructuringErrors, forInit) {
    var startPos = this.start, startLoc = this.startLoc;
    var oldDoubleProto = -1, oldShorthandAssign = -1;
    if (refDestructuringErrors) {
        oldDoubleProto = refDestructuringErrors.doubleProto;
        oldShorthandAssign = refDestructuringErrors.shorthandAssign;
        refDestructuringErrors.doubleProto = refDestructuringErrors.shorthandAssign = -1;
    }
    var expr = this.parseExprAtom(refDestructuringErrors, forInit);
    if ("ArrowFunctionExpression" === expr.type && ")" !== this.input.slice(this.lastTokStart, this.lastTokEnd)) return expr;
    var result = this.parseSubscripts(expr, startPos, startLoc, false, forInit);
    if (refDestructuringErrors) {
        if (result.end > expr.end) {
            this.checkExpressionErrors(refDestructuringErrors, true);
            if (refDestructuringErrors.parenthesizedAssign >= result.start) refDestructuringErrors.parenthesizedAssign = -1;
            if (refDestructuringErrors.parenthesizedBind >= result.start) refDestructuringErrors.parenthesizedBind = -1;
            if (refDestructuringErrors.trailingComma >= result.start) refDestructuringErrors.trailingComma = -1;
        }
        if (oldDoubleProto > -1) refDestructuringErrors.doubleProto = oldDoubleProto;
        if (oldShorthandAssign > -1) refDestructuringErrors.shorthandAssign = oldShorthandAssign;
    }
    return result;
};
pp$5.parseSubscripts = function(base, startPos, startLoc, noCalls, forInit) {
    var maybeAsyncArrow = this.options.ecmaVersion >= 8 && "Identifier" === base.type && "async" === base.name && this.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && this.potentialArrowAt === base.start;
    var optionalChained = false;
    while(true){
        var element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit);
        if (element.optional) optionalChained = true;
        if (element.end === base.end || "ArrowFunctionExpression" === element.type) {
            if (optionalChained) {
                var chainNode = this.startNodeAt(startPos, startLoc);
                chainNode.expression = element;
                element = this.finishNode(chainNode, "ChainExpression");
            }
            return element;
        }
        base = element;
        maybeAsyncArrow = false;
    }
};
pp$5.shouldParseAsyncArrow = function() {
    return !this.canInsertSemicolon() && this.eat(types$1.arrow);
};
pp$5.parseSubscriptAsyncArrow = function(startPos, startLoc, exprList, forInit) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true, forInit);
};
pp$5.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit) {
    var optionalSupported = this.options.ecmaVersion >= 11;
    var optional = optionalSupported && this.eat(types$1.questionDot);
    if (noCalls && optional) this.raise(this.lastTokStart, "Optional chaining cannot appear in the callee of new expressions");
    var computed = this.eat(types$1.bracketL);
    if (computed || optional && this.type !== types$1.parenL && this.type !== types$1.backQuote || this.eat(types$1.dot)) {
        var node = this.startNodeAt(startPos, startLoc);
        node.object = base;
        if (computed) {
            node.property = this.parseExpression();
            this.expect(types$1.bracketR);
        } else if (this.type === types$1.privateId && "Super" !== base.type) node.property = this.parsePrivateIdent();
        else node.property = this.parseIdent("never" !== this.options.allowReserved);
        node.computed = !!computed;
        if (optionalSupported) node.optional = optional;
        base = this.finishNode(node, "MemberExpression");
    } else if (!noCalls && this.eat(types$1.parenL)) {
        var refDestructuringErrors = new acorn_DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
        this.yieldPos = 0;
        this.awaitPos = 0;
        this.awaitIdentPos = 0;
        var exprList = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false, refDestructuringErrors);
        if (maybeAsyncArrow && !optional && this.shouldParseAsyncArrow()) {
            this.checkPatternErrors(refDestructuringErrors, false);
            this.checkYieldAwaitInDefaultParams();
            if (this.awaitIdentPos > 0) this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function");
            this.yieldPos = oldYieldPos;
            this.awaitPos = oldAwaitPos;
            this.awaitIdentPos = oldAwaitIdentPos;
            return this.parseSubscriptAsyncArrow(startPos, startLoc, exprList, forInit);
        }
        this.checkExpressionErrors(refDestructuringErrors, true);
        this.yieldPos = oldYieldPos || this.yieldPos;
        this.awaitPos = oldAwaitPos || this.awaitPos;
        this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
        var node$1 = this.startNodeAt(startPos, startLoc);
        node$1.callee = base;
        node$1.arguments = exprList;
        if (optionalSupported) node$1.optional = optional;
        base = this.finishNode(node$1, "CallExpression");
    } else if (this.type === types$1.backQuote) {
        if (optional || optionalChained) this.raise(this.start, "Optional chaining cannot appear in the tag of tagged template expressions");
        var node$2 = this.startNodeAt(startPos, startLoc);
        node$2.tag = base;
        node$2.quasi = this.parseTemplate({
            isTagged: true
        });
        base = this.finishNode(node$2, "TaggedTemplateExpression");
    }
    return base;
};
pp$5.parseExprAtom = function(refDestructuringErrors, forInit, forNew) {
    if (this.type === types$1.slash) this.readRegexp();
    var node, canBeArrow = this.potentialArrowAt === this.start;
    switch(this.type){
        case types$1._super:
            if (!this.allowSuper) this.raise(this.start, "'super' keyword outside a method");
            node = this.startNode();
            this.next();
            if (this.type === types$1.parenL && !this.allowDirectSuper) this.raise(node.start, "super() call outside constructor of a subclass");
            if (this.type !== types$1.dot && this.type !== types$1.bracketL && this.type !== types$1.parenL) this.unexpected();
            return this.finishNode(node, "Super");
        case types$1._this:
            node = this.startNode();
            this.next();
            return this.finishNode(node, "ThisExpression");
        case types$1.name:
            var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
            var id = this.parseIdent(false);
            if (this.options.ecmaVersion >= 8 && !containsEsc && "async" === id.name && !this.canInsertSemicolon() && this.eat(types$1._function)) {
                this.overrideContext(types.f_expr);
                return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true, forInit);
            }
            if (canBeArrow && !this.canInsertSemicolon()) {
                if (this.eat(types$1.arrow)) return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [
                    id
                ], false, forInit);
                if (this.options.ecmaVersion >= 8 && "async" === id.name && this.type === types$1.name && !containsEsc && (!this.potentialArrowInForAwait || "of" !== this.value || this.containsEsc)) {
                    id = this.parseIdent(false);
                    if (this.canInsertSemicolon() || !this.eat(types$1.arrow)) this.unexpected();
                    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [
                        id
                    ], true, forInit);
                }
            }
            return id;
        case types$1.regexp:
            var value = this.value;
            node = this.parseLiteral(value.value);
            node.regex = {
                pattern: value.pattern,
                flags: value.flags
            };
            return node;
        case types$1.num:
        case types$1.string:
            return this.parseLiteral(this.value);
        case types$1._null:
        case types$1._true:
        case types$1._false:
            node = this.startNode();
            node.value = this.type === types$1._null ? null : this.type === types$1._true;
            node.raw = this.type.keyword;
            this.next();
            return this.finishNode(node, "Literal");
        case types$1.parenL:
            var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow, forInit);
            if (refDestructuringErrors) {
                if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr)) refDestructuringErrors.parenthesizedAssign = start;
                if (refDestructuringErrors.parenthesizedBind < 0) refDestructuringErrors.parenthesizedBind = start;
            }
            return expr;
        case types$1.bracketL:
            node = this.startNode();
            this.next();
            node.elements = this.parseExprList(types$1.bracketR, true, true, refDestructuringErrors);
            return this.finishNode(node, "ArrayExpression");
        case types$1.braceL:
            this.overrideContext(types.b_expr);
            return this.parseObj(false, refDestructuringErrors);
        case types$1._function:
            node = this.startNode();
            this.next();
            return this.parseFunction(node, 0);
        case types$1._class:
            return this.parseClass(this.startNode(), false);
        case types$1._new:
            return this.parseNew();
        case types$1.backQuote:
            return this.parseTemplate();
        case types$1._import:
            if (this.options.ecmaVersion >= 11) return this.parseExprImport(forNew);
            else return this.unexpected();
        default:
            return this.parseExprAtomDefault();
    }
};
pp$5.parseExprAtomDefault = function() {
    this.unexpected();
};
pp$5.parseExprImport = function(forNew) {
    var node = this.startNode();
    if (this.containsEsc) this.raiseRecoverable(this.start, "Escape sequence in keyword import");
    this.next();
    if (this.type === types$1.parenL && !forNew) return this.parseDynamicImport(node);
    else if (this.type === types$1.dot) {
        var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
        meta.name = "import";
        node.meta = this.finishNode(meta, "Identifier");
        return this.parseImportMeta(node);
    } else this.unexpected();
};
pp$5.parseDynamicImport = function(node) {
    this.next();
    node.source = this.parseMaybeAssign();
    if (this.options.ecmaVersion >= 16) if (this.eat(types$1.parenR)) node.options = null;
    else {
        this.expect(types$1.comma);
        if (this.afterTrailingComma(types$1.parenR)) node.options = null;
        else {
            node.options = this.parseMaybeAssign();
            if (!this.eat(types$1.parenR)) {
                this.expect(types$1.comma);
                if (!this.afterTrailingComma(types$1.parenR)) this.unexpected();
            }
        }
    }
    else if (!this.eat(types$1.parenR)) {
        var errorPos = this.start;
        if (this.eat(types$1.comma) && this.eat(types$1.parenR)) this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
        else this.unexpected(errorPos);
    }
    return this.finishNode(node, "ImportExpression");
};
pp$5.parseImportMeta = function(node) {
    this.next();
    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);
    if ("meta" !== node.property.name) this.raiseRecoverable(node.property.start, "The only valid meta property for import is 'import.meta'");
    if (containsEsc) this.raiseRecoverable(node.start, "'import.meta' must not contain escaped characters");
    if ("module" !== this.options.sourceType && !this.options.allowImportExportEverywhere) this.raiseRecoverable(node.start, "Cannot use 'import.meta' outside a module");
    return this.finishNode(node, "MetaProperty");
};
pp$5.parseLiteral = function(value) {
    var node = this.startNode();
    node.value = value;
    node.raw = this.input.slice(this.start, this.end);
    if (110 === node.raw.charCodeAt(node.raw.length - 1)) node.bigint = null != node.value ? node.value.toString() : node.raw.slice(0, -1).replace(/_/g, "");
    this.next();
    return this.finishNode(node, "Literal");
};
pp$5.parseParenExpression = function() {
    this.expect(types$1.parenL);
    var val = this.parseExpression();
    this.expect(types$1.parenR);
    return val;
};
pp$5.shouldParseArrow = function(exprList) {
    return !this.canInsertSemicolon();
};
pp$5.parseParenAndDistinguishExpression = function(canBeArrow, forInit) {
    var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
    if (this.options.ecmaVersion >= 6) {
        this.next();
        var innerStartPos = this.start, innerStartLoc = this.startLoc;
        var exprList = [], first = true, lastIsComma = false;
        var refDestructuringErrors = new acorn_DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
        this.yieldPos = 0;
        this.awaitPos = 0;
        while(this.type !== types$1.parenR){
            first ? first = false : this.expect(types$1.comma);
            if (allowTrailingComma && this.afterTrailingComma(types$1.parenR, true)) {
                lastIsComma = true;
                break;
            } else if (this.type === types$1.ellipsis) {
                spreadStart = this.start;
                exprList.push(this.parseParenItem(this.parseRestBinding()));
                if (this.type === types$1.comma) this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
                break;
            } else exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
        }
        var innerEndPos = this.lastTokEnd, innerEndLoc = this.lastTokEndLoc;
        this.expect(types$1.parenR);
        if (canBeArrow && this.shouldParseArrow(exprList) && this.eat(types$1.arrow)) {
            this.checkPatternErrors(refDestructuringErrors, false);
            this.checkYieldAwaitInDefaultParams();
            this.yieldPos = oldYieldPos;
            this.awaitPos = oldAwaitPos;
            return this.parseParenArrowList(startPos, startLoc, exprList, forInit);
        }
        if (!exprList.length || lastIsComma) this.unexpected(this.lastTokStart);
        if (spreadStart) this.unexpected(spreadStart);
        this.checkExpressionErrors(refDestructuringErrors, true);
        this.yieldPos = oldYieldPos || this.yieldPos;
        this.awaitPos = oldAwaitPos || this.awaitPos;
        if (exprList.length > 1) {
            val = this.startNodeAt(innerStartPos, innerStartLoc);
            val.expressions = exprList;
            this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
        } else val = exprList[0];
    } else val = this.parseParenExpression();
    if (!this.options.preserveParens) return val;
    else {
        var par = this.startNodeAt(startPos, startLoc);
        par.expression = val;
        return this.finishNode(par, "ParenthesizedExpression");
    }
};
pp$5.parseParenItem = function(item) {
    return item;
};
pp$5.parseParenArrowList = function(startPos, startLoc, exprList, forInit) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, false, forInit);
};
var empty = [];
pp$5.parseNew = function() {
    if (this.containsEsc) this.raiseRecoverable(this.start, "Escape sequence in keyword new");
    var node = this.startNode();
    this.next();
    if (this.options.ecmaVersion >= 6 && this.type === types$1.dot) {
        var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
        meta.name = "new";
        node.meta = this.finishNode(meta, "Identifier");
        this.next();
        var containsEsc = this.containsEsc;
        node.property = this.parseIdent(true);
        if ("target" !== node.property.name) this.raiseRecoverable(node.property.start, "The only valid meta property for new is 'new.target'");
        if (containsEsc) this.raiseRecoverable(node.start, "'new.target' must not contain escaped characters");
        if (!this.allowNewDotTarget) this.raiseRecoverable(node.start, "'new.target' can only be used in functions and class static block");
        return this.finishNode(node, "MetaProperty");
    }
    var startPos = this.start, startLoc = this.startLoc;
    node.callee = this.parseSubscripts(this.parseExprAtom(null, false, true), startPos, startLoc, true, false);
    if ("Super" === node.callee.type) this.raiseRecoverable(startPos, "Invalid use of 'super'");
    if (this.eat(types$1.parenL)) node.arguments = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false);
    else node.arguments = empty;
    return this.finishNode(node, "NewExpression");
};
pp$5.parseTemplateElement = function(ref) {
    var isTagged = ref.isTagged;
    var elem = this.startNode();
    if (this.type === types$1.invalidTemplate) {
        if (!isTagged) this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
        elem.value = {
            raw: this.value.replace(/\r\n?/g, "\n"),
            cooked: null
        };
    } else elem.value = {
        raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
        cooked: this.value
    };
    this.next();
    elem.tail = this.type === types$1.backQuote;
    return this.finishNode(elem, "TemplateElement");
};
pp$5.parseTemplate = function(ref) {
    if (void 0 === ref) ref = {};
    var isTagged = ref.isTagged;
    if (void 0 === isTagged) isTagged = false;
    var node = this.startNode();
    this.next();
    node.expressions = [];
    var curElt = this.parseTemplateElement({
        isTagged: isTagged
    });
    node.quasis = [
        curElt
    ];
    while(!curElt.tail){
        if (this.type === types$1.eof) this.raise(this.pos, "Unterminated template literal");
        this.expect(types$1.dollarBraceL);
        node.expressions.push(this.parseExpression());
        this.expect(types$1.braceR);
        node.quasis.push(curElt = this.parseTemplateElement({
            isTagged: isTagged
        }));
    }
    this.next();
    return this.finishNode(node, "TemplateLiteral");
};
pp$5.isAsyncProp = function(prop) {
    return !prop.computed && "Identifier" === prop.key.type && "async" === prop.key.name && (this.type === types$1.name || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword || this.options.ecmaVersion >= 9 && this.type === types$1.star) && !lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};
pp$5.parseObj = function(isPattern, refDestructuringErrors) {
    var node = this.startNode(), first = true, propHash = {};
    node.properties = [];
    this.next();
    while(!this.eat(types$1.braceR)){
        if (first) first = false;
        else {
            this.expect(types$1.comma);
            if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types$1.braceR)) break;
        }
        var prop = this.parseProperty(isPattern, refDestructuringErrors);
        if (!isPattern) this.checkPropClash(prop, propHash, refDestructuringErrors);
        node.properties.push(prop);
    }
    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
};
pp$5.parseProperty = function(isPattern, refDestructuringErrors) {
    var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
    if (this.options.ecmaVersion >= 9 && this.eat(types$1.ellipsis)) {
        if (isPattern) {
            prop.argument = this.parseIdent(false);
            if (this.type === types$1.comma) this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
            return this.finishNode(prop, "RestElement");
        }
        prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
        if (this.type === types$1.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) refDestructuringErrors.trailingComma = this.start;
        return this.finishNode(prop, "SpreadElement");
    }
    if (this.options.ecmaVersion >= 6) {
        prop.method = false;
        prop.shorthand = false;
        if (isPattern || refDestructuringErrors) {
            startPos = this.start;
            startLoc = this.startLoc;
        }
        if (!isPattern) isGenerator = this.eat(types$1.star);
    }
    var containsEsc = this.containsEsc;
    this.parsePropertyName(prop);
    if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
        isAsync = true;
        isGenerator = this.options.ecmaVersion >= 9 && this.eat(types$1.star);
        this.parsePropertyName(prop);
    } else isAsync = false;
    this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
    return this.finishNode(prop, "Property");
};
pp$5.parseGetterSetter = function(prop) {
    var kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    prop.kind = kind;
    var paramCount = "get" === prop.kind ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
        var start = prop.value.start;
        if ("get" === prop.kind) this.raiseRecoverable(start, "getter should have no params");
        else this.raiseRecoverable(start, "setter should have exactly one param");
    } else if ("set" === prop.kind && "RestElement" === prop.value.params[0].type) this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params");
};
pp$5.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
    if ((isGenerator || isAsync) && this.type === types$1.colon) this.unexpected();
    if (this.eat(types$1.colon)) {
        prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
        prop.kind = "init";
    } else if (this.options.ecmaVersion >= 6 && this.type === types$1.parenL) {
        if (isPattern) this.unexpected();
        prop.method = true;
        prop.value = this.parseMethod(isGenerator, isAsync);
        prop.kind = "init";
    } else if (isPattern || containsEsc || !(this.options.ecmaVersion >= 5) || prop.computed || "Identifier" !== prop.key.type || "get" !== prop.key.name && "set" !== prop.key.name || this.type === types$1.comma || this.type === types$1.braceR || this.type === types$1.eq) if (this.options.ecmaVersion >= 6 && !prop.computed && "Identifier" === prop.key.type) {
        if (isGenerator || isAsync) this.unexpected();
        this.checkUnreserved(prop.key);
        if ("await" === prop.key.name && !this.awaitIdentPos) this.awaitIdentPos = startPos;
        if (isPattern) prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
        else if (this.type === types$1.eq && refDestructuringErrors) {
            if (refDestructuringErrors.shorthandAssign < 0) refDestructuringErrors.shorthandAssign = this.start;
            prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
        } else prop.value = this.copyNode(prop.key);
        prop.kind = "init";
        prop.shorthand = true;
    } else this.unexpected();
    else {
        if (isGenerator || isAsync) this.unexpected();
        this.parseGetterSetter(prop);
    }
};
pp$5.parsePropertyName = function(prop) {
    if (this.options.ecmaVersion >= 6) if (this.eat(types$1.bracketL)) {
        prop.computed = true;
        prop.key = this.parseMaybeAssign();
        this.expect(types$1.bracketR);
        return prop.key;
    } else prop.computed = false;
    return prop.key = this.type === types$1.num || this.type === types$1.string ? this.parseExprAtom() : this.parseIdent("never" !== this.options.allowReserved);
};
pp$5.initFunction = function(node) {
    node.id = null;
    if (this.options.ecmaVersion >= 6) node.generator = node.expression = false;
    if (this.options.ecmaVersion >= 8) node.async = false;
};
pp$5.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
    var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
    this.initFunction(node);
    if (this.options.ecmaVersion >= 6) node.generator = isGenerator;
    if (this.options.ecmaVersion >= 8) node.async = !!isAsync;
    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));
    this.expect(types$1.parenL);
    node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
    this.checkYieldAwaitInDefaultParams();
    this.parseFunctionBody(node, false, true, false);
    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, "FunctionExpression");
};
pp$5.parseArrowExpression = function(node, params, isAsync, forInit) {
    var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
    this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
    this.initFunction(node);
    if (this.options.ecmaVersion >= 8) node.async = !!isAsync;
    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    node.params = this.toAssignableList(params, true);
    this.parseFunctionBody(node, true, false, forInit);
    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, "ArrowFunctionExpression");
};
pp$5.parseFunctionBody = function(node, isArrowFunction, isMethod, forInit) {
    var isExpression = isArrowFunction && this.type !== types$1.braceL;
    var oldStrict = this.strict, useStrict = false;
    if (isExpression) {
        node.body = this.parseMaybeAssign(forInit);
        node.expression = true;
        this.checkParams(node, false);
    } else {
        var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
        if (!oldStrict || nonSimple) {
            useStrict = this.strictDirective(this.end);
            if (useStrict && nonSimple) this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list");
        }
        var oldLabels = this.labels;
        this.labels = [];
        if (useStrict) this.strict = true;
        this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
        if (this.strict && node.id) this.checkLValSimple(node.id, BIND_OUTSIDE);
        node.body = this.parseBlock(false, void 0, useStrict && !oldStrict);
        node.expression = false;
        this.adaptDirectivePrologue(node.body.body);
        this.labels = oldLabels;
    }
    this.exitScope();
};
pp$5.isSimpleParamList = function(params) {
    for(var i = 0, list = params; i < list.length; i += 1){
        var param = list[i];
        if ("Identifier" !== param.type) return false;
    }
    return true;
};
pp$5.checkParams = function(node, allowDuplicates) {
    var nameHash = Object.create(null);
    for(var i = 0, list = node.params; i < list.length; i += 1){
        var param = list[i];
        this.checkLValInnerPattern(param, BIND_VAR, allowDuplicates ? null : nameHash);
    }
};
pp$5.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
    var elts = [], first = true;
    while(!this.eat(close)){
        if (first) first = false;
        else {
            this.expect(types$1.comma);
            if (allowTrailingComma && this.afterTrailingComma(close)) break;
        }
        var elt = void 0;
        if (allowEmpty && this.type === types$1.comma) elt = null;
        else if (this.type === types$1.ellipsis) {
            elt = this.parseSpread(refDestructuringErrors);
            if (refDestructuringErrors && this.type === types$1.comma && refDestructuringErrors.trailingComma < 0) refDestructuringErrors.trailingComma = this.start;
        } else elt = this.parseMaybeAssign(false, refDestructuringErrors);
        elts.push(elt);
    }
    return elts;
};
pp$5.checkUnreserved = function(ref) {
    var start = ref.start;
    var end = ref.end;
    var name = ref.name;
    if (this.inGenerator && "yield" === name) this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator");
    if (this.inAsync && "await" === name) this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function");
    if (!(this.currentThisScope().flags & SCOPE_VAR) && "arguments" === name) this.raiseRecoverable(start, "Cannot use 'arguments' in class field initializer");
    if (this.inClassStaticBlock && ("arguments" === name || "await" === name)) this.raise(start, "Cannot use " + name + " in class static initialization block");
    if (this.keywords.test(name)) this.raise(start, "Unexpected keyword '" + name + "'");
    if (this.options.ecmaVersion < 6 && -1 !== this.input.slice(start, end).indexOf("\\")) return;
    var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
    if (re.test(name)) {
        if (!this.inAsync && "await" === name) this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function");
        this.raiseRecoverable(start, "The keyword '" + name + "' is reserved");
    }
};
pp$5.parseIdent = function(liberal) {
    var node = this.parseIdentNode();
    this.next(!!liberal);
    this.finishNode(node, "Identifier");
    if (!liberal) {
        this.checkUnreserved(node);
        if ("await" === node.name && !this.awaitIdentPos) this.awaitIdentPos = node.start;
    }
    return node;
};
pp$5.parseIdentNode = function() {
    var node = this.startNode();
    if (this.type === types$1.name) node.name = this.value;
    else if (this.type.keyword) {
        node.name = this.type.keyword;
        if (("class" === node.name || "function" === node.name) && (this.lastTokEnd !== this.lastTokStart + 1 || 46 !== this.input.charCodeAt(this.lastTokStart))) this.context.pop();
        this.type = types$1.name;
    } else this.unexpected();
    return node;
};
pp$5.parsePrivateIdent = function() {
    var node = this.startNode();
    if (this.type === types$1.privateId) node.name = this.value;
    else this.unexpected();
    this.next();
    this.finishNode(node, "PrivateIdentifier");
    if (this.options.checkPrivateFields) if (0 === this.privateNameStack.length) this.raise(node.start, "Private field '#" + node.name + "' must be declared in an enclosing class");
    else this.privateNameStack[this.privateNameStack.length - 1].used.push(node);
    return node;
};
pp$5.parseYield = function(forInit) {
    if (!this.yieldPos) this.yieldPos = this.start;
    var node = this.startNode();
    this.next();
    if (this.type === types$1.semi || this.canInsertSemicolon() || this.type !== types$1.star && !this.type.startsExpr) {
        node.delegate = false;
        node.argument = null;
    } else {
        node.delegate = this.eat(types$1.star);
        node.argument = this.parseMaybeAssign(forInit);
    }
    return this.finishNode(node, "YieldExpression");
};
pp$5.parseAwait = function(forInit) {
    if (!this.awaitPos) this.awaitPos = this.start;
    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeUnary(null, true, false, forInit);
    return this.finishNode(node, "AwaitExpression");
};
var pp$4 = acorn_Parser.prototype;
pp$4.raise = function(pos, message) {
    var loc = getLineInfo(this.input, pos);
    message += " (" + loc.line + ":" + loc.column + ")";
    if (this.sourceFile) message += " in " + this.sourceFile;
    var err = new SyntaxError(message);
    err.pos = pos;
    err.loc = loc;
    err.raisedAt = this.pos;
    throw err;
};
pp$4.raiseRecoverable = pp$4.raise;
pp$4.curPosition = function() {
    if (this.options.locations) return new acorn_Position(this.curLine, this.pos - this.lineStart);
};
var pp$3 = acorn_Parser.prototype;
var acorn_Scope = function(flags) {
    this.flags = flags;
    this.var = [];
    this.lexical = [];
    this.functions = [];
};
pp$3.enterScope = function(flags) {
    this.scopeStack.push(new acorn_Scope(flags));
};
pp$3.exitScope = function() {
    this.scopeStack.pop();
};
pp$3.treatFunctionsAsVarInScope = function(scope) {
    return scope.flags & SCOPE_FUNCTION || !this.inModule && scope.flags & SCOPE_TOP;
};
pp$3.declareName = function(name, bindingType, pos) {
    var redeclared = false;
    if (bindingType === BIND_LEXICAL) {
        var scope = this.currentScope();
        redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
        scope.lexical.push(name);
        if (this.inModule && scope.flags & SCOPE_TOP) delete this.undefinedExports[name];
    } else if (bindingType === BIND_SIMPLE_CATCH) {
        var scope$1 = this.currentScope();
        scope$1.lexical.push(name);
    } else if (bindingType === BIND_FUNCTION) {
        var scope$2 = this.currentScope();
        redeclared = this.treatFunctionsAsVar ? scope$2.lexical.indexOf(name) > -1 : scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1;
        scope$2.functions.push(name);
    } else for(var i = this.scopeStack.length - 1; i >= 0; --i){
        var scope$3 = this.scopeStack[i];
        if (scope$3.lexical.indexOf(name) > -1 && !(scope$3.flags & SCOPE_SIMPLE_CATCH && scope$3.lexical[0] === name) || !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
            redeclared = true;
            break;
        }
        scope$3.var.push(name);
        if (this.inModule && scope$3.flags & SCOPE_TOP) delete this.undefinedExports[name];
        if (scope$3.flags & SCOPE_VAR) break;
    }
    if (redeclared) this.raiseRecoverable(pos, "Identifier '" + name + "' has already been declared");
};
pp$3.checkLocalExport = function(id) {
    if (-1 === this.scopeStack[0].lexical.indexOf(id.name) && -1 === this.scopeStack[0].var.indexOf(id.name)) this.undefinedExports[id.name] = id;
};
pp$3.currentScope = function() {
    return this.scopeStack[this.scopeStack.length - 1];
};
pp$3.currentVarScope = function() {
    for(var i = this.scopeStack.length - 1;; i--){
        var scope = this.scopeStack[i];
        if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK)) return scope;
    }
};
pp$3.currentThisScope = function() {
    for(var i = this.scopeStack.length - 1;; i--){
        var scope = this.scopeStack[i];
        if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK) && !(scope.flags & SCOPE_ARROW)) return scope;
    }
};
var acorn_Node = function(parser, pos, loc) {
    this.type = "";
    this.start = pos;
    this.end = 0;
    if (parser.options.locations) this.loc = new acorn_SourceLocation(parser, loc);
    if (parser.options.directSourceFile) this.sourceFile = parser.options.directSourceFile;
    if (parser.options.ranges) this.range = [
        pos,
        0
    ];
};
var pp$2 = acorn_Parser.prototype;
pp$2.startNode = function() {
    return new acorn_Node(this, this.start, this.startLoc);
};
pp$2.startNodeAt = function(pos, loc) {
    return new acorn_Node(this, pos, loc);
};
function finishNodeAt(node, type, pos, loc) {
    node.type = type;
    node.end = pos;
    if (this.options.locations) node.loc.end = loc;
    if (this.options.ranges) node.range[1] = pos;
    return node;
}
pp$2.finishNode = function(node, type) {
    return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc);
};
pp$2.finishNodeAt = function(node, type, pos, loc) {
    return finishNodeAt.call(this, node, type, pos, loc);
};
pp$2.copyNode = function(node) {
    var newNode = new acorn_Node(this, node.start, this.startLoc);
    for(var prop in node)newNode[prop] = node[prop];
    return newNode;
};
var scriptValuesAddedInUnicode = "Berf Beria_Erfe Gara Garay Gukh Gurung_Khema Hrkt Katakana_Or_Hiragana Kawi Kirat_Rai Krai Nag_Mundari Nagm Ol_Onal Onao Sidetic Sidt Sunu Sunuwar Tai_Yo Tayo Todhri Todr Tolong_Siki Tols Tulu_Tigalari Tutg Unknown Zzzz";
var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
var ecma11BinaryProperties = ecma10BinaryProperties;
var ecma12BinaryProperties = ecma11BinaryProperties + " EBase EComp EMod EPres ExtPict";
var ecma13BinaryProperties = ecma12BinaryProperties;
var ecma14BinaryProperties = ecma13BinaryProperties;
var unicodeBinaryProperties = {
    9: ecma9BinaryProperties,
    10: ecma10BinaryProperties,
    11: ecma11BinaryProperties,
    12: ecma12BinaryProperties,
    13: ecma13BinaryProperties,
    14: ecma14BinaryProperties
};
var ecma14BinaryPropertiesOfStrings = "Basic_Emoji Emoji_Keycap_Sequence RGI_Emoji_Modifier_Sequence RGI_Emoji_Flag_Sequence RGI_Emoji_Tag_Sequence RGI_Emoji_ZWJ_Sequence RGI_Emoji";
var unicodeBinaryPropertiesOfStrings = {
    9: "",
    10: "",
    11: "",
    12: "",
    13: "",
    14: ecma14BinaryPropertiesOfStrings
};
var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";
var ecma9ScriptValues = "Adlam Adlm Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
var ecma12ScriptValues = ecma11ScriptValues + " Chorasmian Chrs Diak Dives_Akuru Khitan_Small_Script Kits Yezi Yezidi";
var ecma13ScriptValues = ecma12ScriptValues + " Cypro_Minoan Cpmn Old_Uyghur Ougr Tangsa Tnsa Toto Vithkuqi Vith";
var ecma14ScriptValues = ecma13ScriptValues + " " + scriptValuesAddedInUnicode;
var unicodeScriptValues = {
    9: ecma9ScriptValues,
    10: ecma10ScriptValues,
    11: ecma11ScriptValues,
    12: ecma12ScriptValues,
    13: ecma13ScriptValues,
    14: ecma14ScriptValues
};
var data = {};
function buildUnicodeData(ecmaVersion) {
    var d = data[ecmaVersion] = {
        binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
        binaryOfStrings: wordsRegexp(unicodeBinaryPropertiesOfStrings[ecmaVersion]),
        nonBinary: {
            General_Category: wordsRegexp(unicodeGeneralCategoryValues),
            Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
        }
    };
    d.nonBinary.Script_Extensions = d.nonBinary.Script;
    d.nonBinary.gc = d.nonBinary.General_Category;
    d.nonBinary.sc = d.nonBinary.Script;
    d.nonBinary.scx = d.nonBinary.Script_Extensions;
}
for(var acorn_i = 0, acorn_list = [
    9,
    10,
    11,
    12,
    13,
    14
]; acorn_i < acorn_list.length; acorn_i += 1){
    var acorn_ecmaVersion = acorn_list[acorn_i];
    buildUnicodeData(acorn_ecmaVersion);
}
var pp$1 = acorn_Parser.prototype;
var acorn_BranchID = function(parent, base) {
    this.parent = parent;
    this.base = base || this;
};
acorn_BranchID.prototype.separatedFrom = function(alt) {
    for(var self = this; self; self = self.parent)for(var other = alt; other; other = other.parent)if (self.base === other.base && self !== other) return true;
    return false;
};
acorn_BranchID.prototype.sibling = function() {
    return new acorn_BranchID(this.parent, this.base);
};
var acorn_RegExpValidationState = function(parser) {
    this.parser = parser;
    this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "") + (parser.options.ecmaVersion >= 13 ? "d" : "") + (parser.options.ecmaVersion >= 15 ? "v" : "");
    this.unicodeProperties = data[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
    this.source = "";
    this.flags = "";
    this.start = 0;
    this.switchU = false;
    this.switchV = false;
    this.switchN = false;
    this.pos = 0;
    this.lastIntValue = 0;
    this.lastStringValue = "";
    this.lastAssertionIsQuantifiable = false;
    this.numCapturingParens = 0;
    this.maxBackReference = 0;
    this.groupNames = Object.create(null);
    this.backReferenceNames = [];
    this.branchID = null;
};
acorn_RegExpValidationState.prototype.reset = function(start, pattern, flags) {
    var unicodeSets = -1 !== flags.indexOf("v");
    var unicode = -1 !== flags.indexOf("u");
    this.start = 0 | start;
    this.source = pattern + "";
    this.flags = flags;
    if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
        this.switchU = true;
        this.switchV = true;
        this.switchN = true;
    } else {
        this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
        this.switchV = false;
        this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
    }
};
acorn_RegExpValidationState.prototype.raise = function(message) {
    this.parser.raiseRecoverable(this.start, "Invalid regular expression: /" + this.source + "/: " + message);
};
acorn_RegExpValidationState.prototype.at = function(i, forceU) {
    if (void 0 === forceU) forceU = false;
    var s = this.source;
    var l = s.length;
    if (i >= l) return -1;
    var c = s.charCodeAt(i);
    if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) return c;
    var next = s.charCodeAt(i + 1);
    return next >= 0xDC00 && next <= 0xDFFF ? (c << 10) + next - 0x35FDC00 : c;
};
acorn_RegExpValidationState.prototype.nextIndex = function(i, forceU) {
    if (void 0 === forceU) forceU = false;
    var s = this.source;
    var l = s.length;
    if (i >= l) return l;
    var c = s.charCodeAt(i), next;
    if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l || (next = s.charCodeAt(i + 1)) < 0xDC00 || next > 0xDFFF) return i + 1;
    return i + 2;
};
acorn_RegExpValidationState.prototype.current = function(forceU) {
    if (void 0 === forceU) forceU = false;
    return this.at(this.pos, forceU);
};
acorn_RegExpValidationState.prototype.lookahead = function(forceU) {
    if (void 0 === forceU) forceU = false;
    return this.at(this.nextIndex(this.pos, forceU), forceU);
};
acorn_RegExpValidationState.prototype.advance = function(forceU) {
    if (void 0 === forceU) forceU = false;
    this.pos = this.nextIndex(this.pos, forceU);
};
acorn_RegExpValidationState.prototype.eat = function(ch, forceU) {
    if (void 0 === forceU) forceU = false;
    if (this.current(forceU) === ch) {
        this.advance(forceU);
        return true;
    }
    return false;
};
acorn_RegExpValidationState.prototype.eatChars = function(chs, forceU) {
    if (void 0 === forceU) forceU = false;
    var pos = this.pos;
    for(var i = 0, list = chs; i < list.length; i += 1){
        var ch = list[i];
        var current = this.at(pos, forceU);
        if (-1 === current || current !== ch) return false;
        pos = this.nextIndex(pos, forceU);
    }
    this.pos = pos;
    return true;
};
pp$1.validateRegExpFlags = function(state) {
    var validFlags = state.validFlags;
    var flags = state.flags;
    var u = false;
    var v = false;
    for(var i = 0; i < flags.length; i++){
        var flag = flags.charAt(i);
        if (-1 === validFlags.indexOf(flag)) this.raise(state.start, "Invalid regular expression flag");
        if (flags.indexOf(flag, i + 1) > -1) this.raise(state.start, "Duplicate regular expression flag");
        if ("u" === flag) u = true;
        if ("v" === flag) v = true;
    }
    if (this.options.ecmaVersion >= 15 && u && v) this.raise(state.start, "Invalid regular expression flag");
};
function hasProp(obj) {
    for(var _ in obj)return true;
    return false;
}
pp$1.validateRegExpPattern = function(state) {
    this.regexp_pattern(state);
    if (!state.switchN && this.options.ecmaVersion >= 9 && hasProp(state.groupNames)) {
        state.switchN = true;
        this.regexp_pattern(state);
    }
};
pp$1.regexp_pattern = function(state) {
    state.pos = 0;
    state.lastIntValue = 0;
    state.lastStringValue = "";
    state.lastAssertionIsQuantifiable = false;
    state.numCapturingParens = 0;
    state.maxBackReference = 0;
    state.groupNames = Object.create(null);
    state.backReferenceNames.length = 0;
    state.branchID = null;
    this.regexp_disjunction(state);
    if (state.pos !== state.source.length) {
        if (state.eat(0x29)) state.raise("Unmatched ')'");
        if (state.eat(0x5D) || state.eat(0x7D)) state.raise("Lone quantifier brackets");
    }
    if (state.maxBackReference > state.numCapturingParens) state.raise("Invalid escape");
    for(var i = 0, list = state.backReferenceNames; i < list.length; i += 1){
        var name = list[i];
        if (!state.groupNames[name]) state.raise("Invalid named capture referenced");
    }
};
pp$1.regexp_disjunction = function(state) {
    var trackDisjunction = this.options.ecmaVersion >= 16;
    if (trackDisjunction) state.branchID = new acorn_BranchID(state.branchID, null);
    this.regexp_alternative(state);
    while(state.eat(0x7C)){
        if (trackDisjunction) state.branchID = state.branchID.sibling();
        this.regexp_alternative(state);
    }
    if (trackDisjunction) state.branchID = state.branchID.parent;
    if (this.regexp_eatQuantifier(state, true)) state.raise("Nothing to repeat");
    if (state.eat(0x7B)) state.raise("Lone quantifier brackets");
};
pp$1.regexp_alternative = function(state) {
    while(state.pos < state.source.length && this.regexp_eatTerm(state));
};
pp$1.regexp_eatTerm = function(state) {
    if (this.regexp_eatAssertion(state)) {
        if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
            if (state.switchU) state.raise("Invalid quantifier");
        }
        return true;
    }
    if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
        this.regexp_eatQuantifier(state);
        return true;
    }
    return false;
};
pp$1.regexp_eatAssertion = function(state) {
    var start = state.pos;
    state.lastAssertionIsQuantifiable = false;
    if (state.eat(0x5E) || state.eat(0x24)) return true;
    if (state.eat(0x5C)) {
        if (state.eat(0x42) || state.eat(0x62)) return true;
        state.pos = start;
    }
    if (state.eat(0x28) && state.eat(0x3F)) {
        var lookbehind = false;
        if (this.options.ecmaVersion >= 9) lookbehind = state.eat(0x3C);
        if (state.eat(0x3D) || state.eat(0x21)) {
            this.regexp_disjunction(state);
            if (!state.eat(0x29)) state.raise("Unterminated group");
            state.lastAssertionIsQuantifiable = !lookbehind;
            return true;
        }
    }
    state.pos = start;
    return false;
};
pp$1.regexp_eatQuantifier = function(state, noError) {
    if (void 0 === noError) noError = false;
    if (this.regexp_eatQuantifierPrefix(state, noError)) {
        state.eat(0x3F);
        return true;
    }
    return false;
};
pp$1.regexp_eatQuantifierPrefix = function(state, noError) {
    return state.eat(0x2A) || state.eat(0x2B) || state.eat(0x3F) || this.regexp_eatBracedQuantifier(state, noError);
};
pp$1.regexp_eatBracedQuantifier = function(state, noError) {
    var start = state.pos;
    if (state.eat(0x7B)) {
        var min = 0, max = -1;
        if (this.regexp_eatDecimalDigits(state)) {
            min = state.lastIntValue;
            if (state.eat(0x2C) && this.regexp_eatDecimalDigits(state)) max = state.lastIntValue;
            if (state.eat(0x7D)) {
                if (-1 !== max && max < min && !noError) state.raise("numbers out of order in {} quantifier");
                return true;
            }
        }
        if (state.switchU && !noError) state.raise("Incomplete quantifier");
        state.pos = start;
    }
    return false;
};
pp$1.regexp_eatAtom = function(state) {
    return this.regexp_eatPatternCharacters(state) || state.eat(0x2E) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state);
};
pp$1.regexp_eatReverseSolidusAtomEscape = function(state) {
    var start = state.pos;
    if (state.eat(0x5C)) {
        if (this.regexp_eatAtomEscape(state)) return true;
        state.pos = start;
    }
    return false;
};
pp$1.regexp_eatUncapturingGroup = function(state) {
    var start = state.pos;
    if (state.eat(0x28)) {
        if (state.eat(0x3F)) {
            if (this.options.ecmaVersion >= 16) {
                var addModifiers = this.regexp_eatModifiers(state);
                var hasHyphen = state.eat(0x2D);
                if (addModifiers || hasHyphen) {
                    for(var i = 0; i < addModifiers.length; i++){
                        var modifier = addModifiers.charAt(i);
                        if (addModifiers.indexOf(modifier, i + 1) > -1) state.raise("Duplicate regular expression modifiers");
                    }
                    if (hasHyphen) {
                        var removeModifiers = this.regexp_eatModifiers(state);
                        if (!addModifiers && !removeModifiers && 0x3A === state.current()) state.raise("Invalid regular expression modifiers");
                        for(var i$1 = 0; i$1 < removeModifiers.length; i$1++){
                            var modifier$1 = removeModifiers.charAt(i$1);
                            if (removeModifiers.indexOf(modifier$1, i$1 + 1) > -1 || addModifiers.indexOf(modifier$1) > -1) state.raise("Duplicate regular expression modifiers");
                        }
                    }
                }
            }
            if (state.eat(0x3A)) {
                this.regexp_disjunction(state);
                if (state.eat(0x29)) return true;
                state.raise("Unterminated group");
            }
        }
        state.pos = start;
    }
    return false;
};
pp$1.regexp_eatCapturingGroup = function(state) {
    if (state.eat(0x28)) {
        if (this.options.ecmaVersion >= 9) this.regexp_groupSpecifier(state);
        else if (0x3F === state.current()) state.raise("Invalid group");
        this.regexp_disjunction(state);
        if (state.eat(0x29)) {
            state.numCapturingParens += 1;
            return true;
        }
        state.raise("Unterminated group");
    }
    return false;
};
pp$1.regexp_eatModifiers = function(state) {
    var modifiers = "";
    var ch = 0;
    while(-1 !== (ch = state.current()) && isRegularExpressionModifier(ch)){
        modifiers += codePointToString(ch);
        state.advance();
    }
    return modifiers;
};
function isRegularExpressionModifier(ch) {
    return 0x69 === ch || 0x6d === ch || 0x73 === ch;
}
pp$1.regexp_eatExtendedAtom = function(state) {
    return state.eat(0x2E) || this.regexp_eatReverseSolidusAtomEscape(state) || this.regexp_eatCharacterClass(state) || this.regexp_eatUncapturingGroup(state) || this.regexp_eatCapturingGroup(state) || this.regexp_eatInvalidBracedQuantifier(state) || this.regexp_eatExtendedPatternCharacter(state);
};
pp$1.regexp_eatInvalidBracedQuantifier = function(state) {
    if (this.regexp_eatBracedQuantifier(state, true)) state.raise("Nothing to repeat");
    return false;
};
pp$1.regexp_eatSyntaxCharacter = function(state) {
    var ch = state.current();
    if (isSyntaxCharacter(ch)) {
        state.lastIntValue = ch;
        state.advance();
        return true;
    }
    return false;
};
function isSyntaxCharacter(ch) {
    return 0x24 === ch || ch >= 0x28 && ch <= 0x2B || 0x2E === ch || 0x3F === ch || ch >= 0x5B && ch <= 0x5E || ch >= 0x7B && ch <= 0x7D;
}
pp$1.regexp_eatPatternCharacters = function(state) {
    var start = state.pos;
    var ch = 0;
    while(-1 !== (ch = state.current()) && !isSyntaxCharacter(ch))state.advance();
    return state.pos !== start;
};
pp$1.regexp_eatExtendedPatternCharacter = function(state) {
    var ch = state.current();
    if (-1 !== ch && 0x24 !== ch && !(ch >= 0x28 && ch <= 0x2B) && 0x2E !== ch && 0x3F !== ch && 0x5B !== ch && 0x5E !== ch && 0x7C !== ch) {
        state.advance();
        return true;
    }
    return false;
};
pp$1.regexp_groupSpecifier = function(state) {
    if (state.eat(0x3F)) {
        if (!this.regexp_eatGroupName(state)) state.raise("Invalid group");
        var trackDisjunction = this.options.ecmaVersion >= 16;
        var known = state.groupNames[state.lastStringValue];
        if (known) if (trackDisjunction) for(var i = 0, list = known; i < list.length; i += 1){
            var altID = list[i];
            if (!altID.separatedFrom(state.branchID)) state.raise("Duplicate capture group name");
        }
        else state.raise("Duplicate capture group name");
        if (trackDisjunction) (known || (state.groupNames[state.lastStringValue] = [])).push(state.branchID);
        else state.groupNames[state.lastStringValue] = true;
    }
};
pp$1.regexp_eatGroupName = function(state) {
    state.lastStringValue = "";
    if (state.eat(0x3C)) {
        if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E)) return true;
        state.raise("Invalid capture group name");
    }
    return false;
};
pp$1.regexp_eatRegExpIdentifierName = function(state) {
    state.lastStringValue = "";
    if (this.regexp_eatRegExpIdentifierStart(state)) {
        state.lastStringValue += codePointToString(state.lastIntValue);
        while(this.regexp_eatRegExpIdentifierPart(state))state.lastStringValue += codePointToString(state.lastIntValue);
        return true;
    }
    return false;
};
pp$1.regexp_eatRegExpIdentifierStart = function(state) {
    var start = state.pos;
    var forceU = this.options.ecmaVersion >= 11;
    var ch = state.current(forceU);
    state.advance(forceU);
    if (0x5C === ch && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) ch = state.lastIntValue;
    if (isRegExpIdentifierStart(ch)) {
        state.lastIntValue = ch;
        return true;
    }
    state.pos = start;
    return false;
};
function isRegExpIdentifierStart(ch) {
    return isIdentifierStart(ch, true) || 0x24 === ch || 0x5F === ch;
}
pp$1.regexp_eatRegExpIdentifierPart = function(state) {
    var start = state.pos;
    var forceU = this.options.ecmaVersion >= 11;
    var ch = state.current(forceU);
    state.advance(forceU);
    if (0x5C === ch && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) ch = state.lastIntValue;
    if (isRegExpIdentifierPart(ch)) {
        state.lastIntValue = ch;
        return true;
    }
    state.pos = start;
    return false;
};
function isRegExpIdentifierPart(ch) {
    return isIdentifierChar(ch, true) || 0x24 === ch || 0x5F === ch || 0x200C === ch || 0x200D === ch;
}
pp$1.regexp_eatAtomEscape = function(state) {
    if (this.regexp_eatBackReference(state) || this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state) || state.switchN && this.regexp_eatKGroupName(state)) return true;
    if (state.switchU) {
        if (0x63 === state.current()) state.raise("Invalid unicode escape");
        state.raise("Invalid escape");
    }
    return false;
};
pp$1.regexp_eatBackReference = function(state) {
    var start = state.pos;
    if (this.regexp_eatDecimalEscape(state)) {
        var n = state.lastIntValue;
        if (state.switchU) {
            if (n > state.maxBackReference) state.maxBackReference = n;
            return true;
        }
        if (n <= state.numCapturingParens) return true;
        state.pos = start;
    }
    return false;
};
pp$1.regexp_eatKGroupName = function(state) {
    if (state.eat(0x6B)) {
        if (this.regexp_eatGroupName(state)) {
            state.backReferenceNames.push(state.lastStringValue);
            return true;
        }
        state.raise("Invalid named reference");
    }
    return false;
};
pp$1.regexp_eatCharacterEscape = function(state) {
    return this.regexp_eatControlEscape(state) || this.regexp_eatCControlLetter(state) || this.regexp_eatZero(state) || this.regexp_eatHexEscapeSequence(state) || this.regexp_eatRegExpUnicodeEscapeSequence(state, false) || !state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state) || this.regexp_eatIdentityEscape(state);
};
pp$1.regexp_eatCControlLetter = function(state) {
    var start = state.pos;
    if (state.eat(0x63)) {
        if (this.regexp_eatControlLetter(state)) return true;
        state.pos = start;
    }
    return false;
};
pp$1.regexp_eatZero = function(state) {
    if (0x30 === state.current() && !isDecimalDigit(state.lookahead())) {
        state.lastIntValue = 0;
        state.advance();
        return true;
    }
    return false;
};
pp$1.regexp_eatControlEscape = function(state) {
    var ch = state.current();
    if (0x74 === ch) {
        state.lastIntValue = 0x09;
        state.advance();
        return true;
    }
    if (0x6E === ch) {
        state.lastIntValue = 0x0A;
        state.advance();
        return true;
    }
    if (0x76 === ch) {
        state.lastIntValue = 0x0B;
        state.advance();
        return true;
    }
    if (0x66 === ch) {
        state.lastIntValue = 0x0C;
        state.advance();
        return true;
    }
    if (0x72 === ch) {
        state.lastIntValue = 0x0D;
        state.advance();
        return true;
    }
    return false;
};
pp$1.regexp_eatControlLetter = function(state) {
    var ch = state.current();
    if (isControlLetter(ch)) {
        state.lastIntValue = ch % 0x20;
        state.advance();
        return true;
    }
    return false;
};
function isControlLetter(ch) {
    return ch >= 0x41 && ch <= 0x5A || ch >= 0x61 && ch <= 0x7A;
}
pp$1.regexp_eatRegExpUnicodeEscapeSequence = function(state, forceU) {
    if (void 0 === forceU) forceU = false;
    var start = state.pos;
    var switchU = forceU || state.switchU;
    if (state.eat(0x75)) {
        if (this.regexp_eatFixedHexDigits(state, 4)) {
            var lead = state.lastIntValue;
            if (switchU && lead >= 0xD800 && lead <= 0xDBFF) {
                var leadSurrogateEnd = state.pos;
                if (state.eat(0x5C) && state.eat(0x75) && this.regexp_eatFixedHexDigits(state, 4)) {
                    var trail = state.lastIntValue;
                    if (trail >= 0xDC00 && trail <= 0xDFFF) {
                        state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
                        return true;
                    }
                }
                state.pos = leadSurrogateEnd;
                state.lastIntValue = lead;
            }
            return true;
        }
        if (switchU && state.eat(0x7B) && this.regexp_eatHexDigits(state) && state.eat(0x7D) && isValidUnicode(state.lastIntValue)) return true;
        if (switchU) state.raise("Invalid unicode escape");
        state.pos = start;
    }
    return false;
};
function isValidUnicode(ch) {
    return ch >= 0 && ch <= 0x10FFFF;
}
pp$1.regexp_eatIdentityEscape = function(state) {
    if (state.switchU) {
        if (this.regexp_eatSyntaxCharacter(state)) return true;
        if (state.eat(0x2F)) {
            state.lastIntValue = 0x2F;
            return true;
        }
        return false;
    }
    var ch = state.current();
    if (0x63 !== ch && (!state.switchN || 0x6B !== ch)) {
        state.lastIntValue = ch;
        state.advance();
        return true;
    }
    return false;
};
pp$1.regexp_eatDecimalEscape = function(state) {
    state.lastIntValue = 0;
    var ch = state.current();
    if (ch >= 0x31 && ch <= 0x39) {
        do {
            state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30);
            state.advance();
        }while ((ch = state.current()) >= 0x30 && ch <= 0x39);
        return true;
    }
    return false;
};
var CharSetNone = 0;
var CharSetOk = 1;
var CharSetString = 2;
pp$1.regexp_eatCharacterClassEscape = function(state) {
    var ch = state.current();
    if (isCharacterClassEscape(ch)) {
        state.lastIntValue = -1;
        state.advance();
        return CharSetOk;
    }
    var negate = false;
    if (state.switchU && this.options.ecmaVersion >= 9 && ((negate = 0x50 === ch) || 0x70 === ch)) {
        state.lastIntValue = -1;
        state.advance();
        var result;
        if (state.eat(0x7B) && (result = this.regexp_eatUnicodePropertyValueExpression(state)) && state.eat(0x7D)) {
            if (negate && result === CharSetString) state.raise("Invalid property name");
            return result;
        }
        state.raise("Invalid property name");
    }
    return CharSetNone;
};
function isCharacterClassEscape(ch) {
    return 0x64 === ch || 0x44 === ch || 0x73 === ch || 0x53 === ch || 0x77 === ch || 0x57 === ch;
}
pp$1.regexp_eatUnicodePropertyValueExpression = function(state) {
    var start = state.pos;
    if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D)) {
        var name = state.lastStringValue;
        if (this.regexp_eatUnicodePropertyValue(state)) {
            var value = state.lastStringValue;
            this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
            return CharSetOk;
        }
    }
    state.pos = start;
    if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
        var nameOrValue = state.lastStringValue;
        return this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
    }
    return CharSetNone;
};
pp$1.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
    if (!hasOwn(state.unicodeProperties.nonBinary, name)) state.raise("Invalid property name");
    if (!state.unicodeProperties.nonBinary[name].test(value)) state.raise("Invalid property value");
};
pp$1.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
    if (state.unicodeProperties.binary.test(nameOrValue)) return CharSetOk;
    if (state.switchV && state.unicodeProperties.binaryOfStrings.test(nameOrValue)) return CharSetString;
    state.raise("Invalid property name");
};
pp$1.regexp_eatUnicodePropertyName = function(state) {
    var ch = 0;
    state.lastStringValue = "";
    while(isUnicodePropertyNameCharacter(ch = state.current())){
        state.lastStringValue += codePointToString(ch);
        state.advance();
    }
    return "" !== state.lastStringValue;
};
function isUnicodePropertyNameCharacter(ch) {
    return isControlLetter(ch) || 0x5F === ch;
}
pp$1.regexp_eatUnicodePropertyValue = function(state) {
    var ch = 0;
    state.lastStringValue = "";
    while(isUnicodePropertyValueCharacter(ch = state.current())){
        state.lastStringValue += codePointToString(ch);
        state.advance();
    }
    return "" !== state.lastStringValue;
};
function isUnicodePropertyValueCharacter(ch) {
    return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch);
}
pp$1.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
    return this.regexp_eatUnicodePropertyValue(state);
};
pp$1.regexp_eatCharacterClass = function(state) {
    if (state.eat(0x5B)) {
        var negate = state.eat(0x5E);
        var result = this.regexp_classContents(state);
        if (!state.eat(0x5D)) state.raise("Unterminated character class");
        if (negate && result === CharSetString) state.raise("Negated character class may contain strings");
        return true;
    }
    return false;
};
pp$1.regexp_classContents = function(state) {
    if (0x5D === state.current()) return CharSetOk;
    if (state.switchV) return this.regexp_classSetExpression(state);
    this.regexp_nonEmptyClassRanges(state);
    return CharSetOk;
};
pp$1.regexp_nonEmptyClassRanges = function(state) {
    while(this.regexp_eatClassAtom(state)){
        var left = state.lastIntValue;
        if (state.eat(0x2D) && this.regexp_eatClassAtom(state)) {
            var right = state.lastIntValue;
            if (state.switchU && (-1 === left || -1 === right)) state.raise("Invalid character class");
            if (-1 !== left && -1 !== right && left > right) state.raise("Range out of order in character class");
        }
    }
};
pp$1.regexp_eatClassAtom = function(state) {
    var start = state.pos;
    if (state.eat(0x5C)) {
        if (this.regexp_eatClassEscape(state)) return true;
        if (state.switchU) {
            var ch$1 = state.current();
            if (0x63 === ch$1 || isOctalDigit(ch$1)) state.raise("Invalid class escape");
            state.raise("Invalid escape");
        }
        state.pos = start;
    }
    var ch = state.current();
    if (0x5D !== ch) {
        state.lastIntValue = ch;
        state.advance();
        return true;
    }
    return false;
};
pp$1.regexp_eatClassEscape = function(state) {
    var start = state.pos;
    if (state.eat(0x62)) {
        state.lastIntValue = 0x08;
        return true;
    }
    if (state.switchU && state.eat(0x2D)) {
        state.lastIntValue = 0x2D;
        return true;
    }
    if (!state.switchU && state.eat(0x63)) {
        if (this.regexp_eatClassControlLetter(state)) return true;
        state.pos = start;
    }
    return this.regexp_eatCharacterClassEscape(state) || this.regexp_eatCharacterEscape(state);
};
pp$1.regexp_classSetExpression = function(state) {
    var result = CharSetOk, subResult;
    if (this.regexp_eatClassSetRange(state)) ;
    else if (subResult = this.regexp_eatClassSetOperand(state)) {
        if (subResult === CharSetString) result = CharSetString;
        var start = state.pos;
        while(state.eatChars([
            0x26,
            0x26
        ])){
            if (0x26 !== state.current() && (subResult = this.regexp_eatClassSetOperand(state))) {
                if (subResult !== CharSetString) result = CharSetOk;
                continue;
            }
            state.raise("Invalid character in character class");
        }
        if (start !== state.pos) return result;
        while(state.eatChars([
            0x2D,
            0x2D
        ])){
            if (this.regexp_eatClassSetOperand(state)) continue;
            state.raise("Invalid character in character class");
        }
        if (start !== state.pos) return result;
    } else state.raise("Invalid character in character class");
    for(;;)if (!this.regexp_eatClassSetRange(state)) {
        subResult = this.regexp_eatClassSetOperand(state);
        if (!subResult) return result;
        if (subResult === CharSetString) result = CharSetString;
    }
};
pp$1.regexp_eatClassSetRange = function(state) {
    var start = state.pos;
    if (this.regexp_eatClassSetCharacter(state)) {
        var left = state.lastIntValue;
        if (state.eat(0x2D) && this.regexp_eatClassSetCharacter(state)) {
            var right = state.lastIntValue;
            if (-1 !== left && -1 !== right && left > right) state.raise("Range out of order in character class");
            return true;
        }
        state.pos = start;
    }
    return false;
};
pp$1.regexp_eatClassSetOperand = function(state) {
    if (this.regexp_eatClassSetCharacter(state)) return CharSetOk;
    return this.regexp_eatClassStringDisjunction(state) || this.regexp_eatNestedClass(state);
};
pp$1.regexp_eatNestedClass = function(state) {
    var start = state.pos;
    if (state.eat(0x5B)) {
        var negate = state.eat(0x5E);
        var result = this.regexp_classContents(state);
        if (state.eat(0x5D)) {
            if (negate && result === CharSetString) state.raise("Negated character class may contain strings");
            return result;
        }
        state.pos = start;
    }
    if (state.eat(0x5C)) {
        var result$1 = this.regexp_eatCharacterClassEscape(state);
        if (result$1) return result$1;
        state.pos = start;
    }
    return null;
};
pp$1.regexp_eatClassStringDisjunction = function(state) {
    var start = state.pos;
    if (state.eatChars([
        0x5C,
        0x71
    ])) {
        if (state.eat(0x7B)) {
            var result = this.regexp_classStringDisjunctionContents(state);
            if (state.eat(0x7D)) return result;
        } else state.raise("Invalid escape");
        state.pos = start;
    }
    return null;
};
pp$1.regexp_classStringDisjunctionContents = function(state) {
    var result = this.regexp_classString(state);
    while(state.eat(0x7C))if (this.regexp_classString(state) === CharSetString) result = CharSetString;
    return result;
};
pp$1.regexp_classString = function(state) {
    var count = 0;
    while(this.regexp_eatClassSetCharacter(state))count++;
    return 1 === count ? CharSetOk : CharSetString;
};
pp$1.regexp_eatClassSetCharacter = function(state) {
    var start = state.pos;
    if (state.eat(0x5C)) {
        if (this.regexp_eatCharacterEscape(state) || this.regexp_eatClassSetReservedPunctuator(state)) return true;
        if (state.eat(0x62)) {
            state.lastIntValue = 0x08;
            return true;
        }
        state.pos = start;
        return false;
    }
    var ch = state.current();
    if (ch < 0 || ch === state.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch)) return false;
    if (isClassSetSyntaxCharacter(ch)) return false;
    state.advance();
    state.lastIntValue = ch;
    return true;
};
function isClassSetReservedDoublePunctuatorCharacter(ch) {
    return 0x21 === ch || ch >= 0x23 && ch <= 0x26 || ch >= 0x2A && ch <= 0x2C || 0x2E === ch || ch >= 0x3A && ch <= 0x40 || 0x5E === ch || 0x60 === ch || 0x7E === ch;
}
function isClassSetSyntaxCharacter(ch) {
    return 0x28 === ch || 0x29 === ch || 0x2D === ch || 0x2F === ch || ch >= 0x5B && ch <= 0x5D || ch >= 0x7B && ch <= 0x7D;
}
pp$1.regexp_eatClassSetReservedPunctuator = function(state) {
    var ch = state.current();
    if (isClassSetReservedPunctuator(ch)) {
        state.lastIntValue = ch;
        state.advance();
        return true;
    }
    return false;
};
function isClassSetReservedPunctuator(ch) {
    return 0x21 === ch || 0x23 === ch || 0x25 === ch || 0x26 === ch || 0x2C === ch || 0x2D === ch || ch >= 0x3A && ch <= 0x3E || 0x40 === ch || 0x60 === ch || 0x7E === ch;
}
pp$1.regexp_eatClassControlLetter = function(state) {
    var ch = state.current();
    if (isDecimalDigit(ch) || 0x5F === ch) {
        state.lastIntValue = ch % 0x20;
        state.advance();
        return true;
    }
    return false;
};
pp$1.regexp_eatHexEscapeSequence = function(state) {
    var start = state.pos;
    if (state.eat(0x78)) {
        if (this.regexp_eatFixedHexDigits(state, 2)) return true;
        if (state.switchU) state.raise("Invalid escape");
        state.pos = start;
    }
    return false;
};
pp$1.regexp_eatDecimalDigits = function(state) {
    var start = state.pos;
    var ch = 0;
    state.lastIntValue = 0;
    while(isDecimalDigit(ch = state.current())){
        state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30);
        state.advance();
    }
    return state.pos !== start;
};
function isDecimalDigit(ch) {
    return ch >= 0x30 && ch <= 0x39;
}
pp$1.regexp_eatHexDigits = function(state) {
    var start = state.pos;
    var ch = 0;
    state.lastIntValue = 0;
    while(isHexDigit(ch = state.current())){
        state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
        state.advance();
    }
    return state.pos !== start;
};
function isHexDigit(ch) {
    return ch >= 0x30 && ch <= 0x39 || ch >= 0x41 && ch <= 0x46 || ch >= 0x61 && ch <= 0x66;
}
function hexToInt(ch) {
    if (ch >= 0x41 && ch <= 0x46) return 10 + (ch - 0x41);
    if (ch >= 0x61 && ch <= 0x66) return 10 + (ch - 0x61);
    return ch - 0x30;
}
pp$1.regexp_eatLegacyOctalEscapeSequence = function(state) {
    if (this.regexp_eatOctalDigit(state)) {
        var n1 = state.lastIntValue;
        if (this.regexp_eatOctalDigit(state)) {
            var n2 = state.lastIntValue;
            if (n1 <= 3 && this.regexp_eatOctalDigit(state)) state.lastIntValue = 64 * n1 + 8 * n2 + state.lastIntValue;
            else state.lastIntValue = 8 * n1 + n2;
        } else state.lastIntValue = n1;
        return true;
    }
    return false;
};
pp$1.regexp_eatOctalDigit = function(state) {
    var ch = state.current();
    if (isOctalDigit(ch)) {
        state.lastIntValue = ch - 0x30;
        state.advance();
        return true;
    }
    state.lastIntValue = 0;
    return false;
};
function isOctalDigit(ch) {
    return ch >= 0x30 && ch <= 0x37;
}
pp$1.regexp_eatFixedHexDigits = function(state, length) {
    var start = state.pos;
    state.lastIntValue = 0;
    for(var i = 0; i < length; ++i){
        var ch = state.current();
        if (!isHexDigit(ch)) {
            state.pos = start;
            return false;
        }
        state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
        state.advance();
    }
    return true;
};
var acorn_Token = function(p) {
    this.type = p.type;
    this.value = p.value;
    this.start = p.start;
    this.end = p.end;
    if (p.options.locations) this.loc = new acorn_SourceLocation(p, p.startLoc, p.endLoc);
    if (p.options.ranges) this.range = [
        p.start,
        p.end
    ];
};
var pp = acorn_Parser.prototype;
pp.next = function(ignoreEscapeSequenceInKeyword) {
    if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc) this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword);
    if (this.options.onToken) this.options.onToken(new acorn_Token(this));
    this.lastTokEnd = this.end;
    this.lastTokStart = this.start;
    this.lastTokEndLoc = this.endLoc;
    this.lastTokStartLoc = this.startLoc;
    this.nextToken();
};
pp.getToken = function() {
    this.next();
    return new acorn_Token(this);
};
if ("u" > typeof Symbol) pp[Symbol.iterator] = function() {
    var this$1$1 = this;
    return {
        next: function() {
            var token = this$1$1.getToken();
            return {
                done: token.type === types$1.eof,
                value: token
            };
        }
    };
};
pp.nextToken = function() {
    var curContext = this.curContext();
    if (!curContext || !curContext.preserveSpace) this.skipSpace();
    this.start = this.pos;
    if (this.options.locations) this.startLoc = this.curPosition();
    if (this.pos >= this.input.length) return this.finishToken(types$1.eof);
    if (curContext.override) return curContext.override(this);
    else this.readToken(this.fullCharCodeAtPos());
};
pp.readToken = function(code) {
    if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || 92 === code) return this.readWord();
    return this.getTokenFromCode(code);
};
pp.fullCharCodeAt = function(pos) {
    var code = this.input.charCodeAt(pos);
    if (code <= 0xd7ff || code >= 0xdc00) return code;
    var next = this.input.charCodeAt(pos + 1);
    return next <= 0xdbff || next >= 0xe000 ? code : (code << 10) + next - 0x35fdc00;
};
pp.fullCharCodeAtPos = function() {
    return this.fullCharCodeAt(this.pos);
};
pp.skipBlockComment = function() {
    var startLoc = this.options.onComment && this.curPosition();
    var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
    if (-1 === end) this.raise(this.pos - 2, "Unterminated comment");
    this.pos = end + 2;
    if (this.options.locations) for(var nextBreak = void 0, pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1;){
        ++this.curLine;
        pos = this.lineStart = nextBreak;
    }
    if (this.options.onComment) this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos, startLoc, this.curPosition());
};
pp.skipLineComment = function(startSkip) {
    var start = this.pos;
    var startLoc = this.options.onComment && this.curPosition();
    var ch = this.input.charCodeAt(this.pos += startSkip);
    while(this.pos < this.input.length && !isNewLine(ch))ch = this.input.charCodeAt(++this.pos);
    if (this.options.onComment) this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos, startLoc, this.curPosition());
};
pp.skipSpace = function() {
    loop: while(this.pos < this.input.length){
        var ch = this.input.charCodeAt(this.pos);
        switch(ch){
            case 32:
            case 160:
                ++this.pos;
                break;
            case 13:
                if (10 === this.input.charCodeAt(this.pos + 1)) ++this.pos;
            case 10:
            case 8232:
            case 8233:
                ++this.pos;
                if (this.options.locations) {
                    ++this.curLine;
                    this.lineStart = this.pos;
                }
                break;
            case 47:
                switch(this.input.charCodeAt(this.pos + 1)){
                    case 42:
                        this.skipBlockComment();
                        break;
                    case 47:
                        this.skipLineComment(2);
                        break;
                    default:
                        break loop;
                }
                break;
            default:
                if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) ++this.pos;
                else break loop;
        }
    }
};
pp.finishToken = function(type, val) {
    this.end = this.pos;
    if (this.options.locations) this.endLoc = this.curPosition();
    var prevType = this.type;
    this.type = type;
    this.value = val;
    this.updateContext(prevType);
};
pp.readToken_dot = function() {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next >= 48 && next <= 57) return this.readNumber(true);
    var next2 = this.input.charCodeAt(this.pos + 2);
    if (this.options.ecmaVersion >= 6 && 46 === next && 46 === next2) {
        this.pos += 3;
        return this.finishToken(types$1.ellipsis);
    } else {
        ++this.pos;
        return this.finishToken(types$1.dot);
    }
};
pp.readToken_slash = function() {
    var next = this.input.charCodeAt(this.pos + 1);
    if (this.exprAllowed) {
        ++this.pos;
        return this.readRegexp();
    }
    if (61 === next) return this.finishOp(types$1.assign, 2);
    return this.finishOp(types$1.slash, 1);
};
pp.readToken_mult_modulo_exp = function(code) {
    var next = this.input.charCodeAt(this.pos + 1);
    var size = 1;
    var tokentype = 42 === code ? types$1.star : types$1.modulo;
    if (this.options.ecmaVersion >= 7 && 42 === code && 42 === next) {
        ++size;
        tokentype = types$1.starstar;
        next = this.input.charCodeAt(this.pos + 2);
    }
    if (61 === next) return this.finishOp(types$1.assign, size + 1);
    return this.finishOp(tokentype, size);
};
pp.readToken_pipe_amp = function(code) {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) {
        if (this.options.ecmaVersion >= 12) {
            var next2 = this.input.charCodeAt(this.pos + 2);
            if (61 === next2) return this.finishOp(types$1.assign, 3);
        }
        return this.finishOp(124 === code ? types$1.logicalOR : types$1.logicalAND, 2);
    }
    if (61 === next) return this.finishOp(types$1.assign, 2);
    return this.finishOp(124 === code ? types$1.bitwiseOR : types$1.bitwiseAND, 1);
};
pp.readToken_caret = function() {
    var next = this.input.charCodeAt(this.pos + 1);
    if (61 === next) return this.finishOp(types$1.assign, 2);
    return this.finishOp(types$1.bitwiseXOR, 1);
};
pp.readToken_plus_min = function(code) {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) {
        if (45 === next && !this.inModule && 62 === this.input.charCodeAt(this.pos + 2) && (0 === this.lastTokEnd || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
            this.skipLineComment(3);
            this.skipSpace();
            return this.nextToken();
        }
        return this.finishOp(types$1.incDec, 2);
    }
    if (61 === next) return this.finishOp(types$1.assign, 2);
    return this.finishOp(types$1.plusMin, 1);
};
pp.readToken_lt_gt = function(code) {
    var next = this.input.charCodeAt(this.pos + 1);
    var size = 1;
    if (next === code) {
        size = 62 === code && 62 === this.input.charCodeAt(this.pos + 2) ? 3 : 2;
        if (61 === this.input.charCodeAt(this.pos + size)) return this.finishOp(types$1.assign, size + 1);
        return this.finishOp(types$1.bitShift, size);
    }
    if (33 === next && 60 === code && !this.inModule && 45 === this.input.charCodeAt(this.pos + 2) && 45 === this.input.charCodeAt(this.pos + 3)) {
        this.skipLineComment(4);
        this.skipSpace();
        return this.nextToken();
    }
    if (61 === next) size = 2;
    return this.finishOp(types$1.relational, size);
};
pp.readToken_eq_excl = function(code) {
    var next = this.input.charCodeAt(this.pos + 1);
    if (61 === next) return this.finishOp(types$1.equality, 61 === this.input.charCodeAt(this.pos + 2) ? 3 : 2);
    if (61 === code && 62 === next && this.options.ecmaVersion >= 6) {
        this.pos += 2;
        return this.finishToken(types$1.arrow);
    }
    return this.finishOp(61 === code ? types$1.eq : types$1.prefix, 1);
};
pp.readToken_question = function() {
    var ecmaVersion = this.options.ecmaVersion;
    if (ecmaVersion >= 11) {
        var next = this.input.charCodeAt(this.pos + 1);
        if (46 === next) {
            var next2 = this.input.charCodeAt(this.pos + 2);
            if (next2 < 48 || next2 > 57) return this.finishOp(types$1.questionDot, 2);
        }
        if (63 === next) {
            if (ecmaVersion >= 12) {
                var next2$1 = this.input.charCodeAt(this.pos + 2);
                if (61 === next2$1) return this.finishOp(types$1.assign, 3);
            }
            return this.finishOp(types$1.coalesce, 2);
        }
    }
    return this.finishOp(types$1.question, 1);
};
pp.readToken_numberSign = function() {
    var ecmaVersion = this.options.ecmaVersion;
    var code = 35;
    if (ecmaVersion >= 13) {
        ++this.pos;
        code = this.fullCharCodeAtPos();
        if (isIdentifierStart(code, true) || 92 === code) return this.finishToken(types$1.privateId, this.readWord1());
    }
    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};
pp.getTokenFromCode = function(code) {
    switch(code){
        case 46:
            return this.readToken_dot();
        case 40:
            ++this.pos;
            return this.finishToken(types$1.parenL);
        case 41:
            ++this.pos;
            return this.finishToken(types$1.parenR);
        case 59:
            ++this.pos;
            return this.finishToken(types$1.semi);
        case 44:
            ++this.pos;
            return this.finishToken(types$1.comma);
        case 91:
            ++this.pos;
            return this.finishToken(types$1.bracketL);
        case 93:
            ++this.pos;
            return this.finishToken(types$1.bracketR);
        case 123:
            ++this.pos;
            return this.finishToken(types$1.braceL);
        case 125:
            ++this.pos;
            return this.finishToken(types$1.braceR);
        case 58:
            ++this.pos;
            return this.finishToken(types$1.colon);
        case 96:
            if (this.options.ecmaVersion < 6) break;
            ++this.pos;
            return this.finishToken(types$1.backQuote);
        case 48:
            var next = this.input.charCodeAt(this.pos + 1);
            if (120 === next || 88 === next) return this.readRadixNumber(16);
            if (this.options.ecmaVersion >= 6) {
                if (111 === next || 79 === next) return this.readRadixNumber(8);
                if (98 === next || 66 === next) return this.readRadixNumber(2);
            }
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
            return this.readNumber(false);
        case 34:
        case 39:
            return this.readString(code);
        case 47:
            return this.readToken_slash();
        case 37:
        case 42:
            return this.readToken_mult_modulo_exp(code);
        case 124:
        case 38:
            return this.readToken_pipe_amp(code);
        case 94:
            return this.readToken_caret();
        case 43:
        case 45:
            return this.readToken_plus_min(code);
        case 60:
        case 62:
            return this.readToken_lt_gt(code);
        case 61:
        case 33:
            return this.readToken_eq_excl(code);
        case 63:
            return this.readToken_question();
        case 126:
            return this.finishOp(types$1.prefix, 1);
        case 35:
            return this.readToken_numberSign();
    }
    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};
pp.finishOp = function(type, size) {
    var str = this.input.slice(this.pos, this.pos + size);
    this.pos += size;
    return this.finishToken(type, str);
};
pp.readRegexp = function() {
    var escaped, inClass, start = this.pos;
    for(;;){
        if (this.pos >= this.input.length) this.raise(start, "Unterminated regular expression");
        var ch = this.input.charAt(this.pos);
        if (lineBreak.test(ch)) this.raise(start, "Unterminated regular expression");
        if (escaped) escaped = false;
        else {
            if ("[" === ch) inClass = true;
            else if ("]" === ch && inClass) inClass = false;
            else if ("/" === ch && !inClass) break;
            escaped = "\\" === ch;
        }
        ++this.pos;
    }
    var pattern = this.input.slice(start, this.pos);
    ++this.pos;
    var flagsStart = this.pos;
    var flags = this.readWord1();
    if (this.containsEsc) this.unexpected(flagsStart);
    var state = this.regexpState || (this.regexpState = new acorn_RegExpValidationState(this));
    state.reset(start, pattern, flags);
    this.validateRegExpFlags(state);
    this.validateRegExpPattern(state);
    var value = null;
    try {
        value = new RegExp(pattern, flags);
    } catch (e) {}
    return this.finishToken(types$1.regexp, {
        pattern: pattern,
        flags: flags,
        value: value
    });
};
pp.readInt = function(radix, len, maybeLegacyOctalNumericLiteral) {
    var allowSeparators = this.options.ecmaVersion >= 12 && void 0 === len;
    var isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && 48 === this.input.charCodeAt(this.pos);
    var start = this.pos, total = 0, lastCode = 0;
    for(var i = 0, e = null == len ? 1 / 0 : len; i < e; ++i, ++this.pos){
        var code = this.input.charCodeAt(this.pos), val = void 0;
        if (allowSeparators && 95 === code) {
            if (isLegacyOctalNumericLiteral) this.raiseRecoverable(this.pos, "Numeric separator is not allowed in legacy octal numeric literals");
            if (95 === lastCode) this.raiseRecoverable(this.pos, "Numeric separator must be exactly one underscore");
            if (0 === i) this.raiseRecoverable(this.pos, "Numeric separator is not allowed at the first of digits");
            lastCode = code;
            continue;
        }
        val = code >= 97 ? code - 97 + 10 : code >= 65 ? code - 65 + 10 : code >= 48 && code <= 57 ? code - 48 : 1 / 0;
        if (val >= radix) break;
        lastCode = code;
        total = total * radix + val;
    }
    if (allowSeparators && 95 === lastCode) this.raiseRecoverable(this.pos - 1, "Numeric separator is not allowed at the last of digits");
    if (this.pos === start || null != len && this.pos - start !== len) return null;
    return total;
};
function stringToNumber(str, isLegacyOctalNumericLiteral) {
    if (isLegacyOctalNumericLiteral) return parseInt(str, 8);
    return parseFloat(str.replace(/_/g, ""));
}
function stringToBigInt(str) {
    if ("function" != typeof BigInt) return null;
    return BigInt(str.replace(/_/g, ""));
}
pp.readRadixNumber = function(radix) {
    var start = this.pos;
    this.pos += 2;
    var val = this.readInt(radix);
    if (null == val) this.raise(this.start + 2, "Expected number in radix " + radix);
    if (this.options.ecmaVersion >= 11 && 110 === this.input.charCodeAt(this.pos)) {
        val = stringToBigInt(this.input.slice(start, this.pos));
        ++this.pos;
    } else if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");
    return this.finishToken(types$1.num, val);
};
pp.readNumber = function(startsWithDot) {
    var start = this.pos;
    if (!startsWithDot && null === this.readInt(10, void 0, true)) this.raise(start, "Invalid number");
    var octal = this.pos - start >= 2 && 48 === this.input.charCodeAt(start);
    if (octal && this.strict) this.raise(start, "Invalid number");
    var next = this.input.charCodeAt(this.pos);
    if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && 110 === next) {
        var val$1 = stringToBigInt(this.input.slice(start, this.pos));
        ++this.pos;
        if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");
        return this.finishToken(types$1.num, val$1);
    }
    if (octal && /[89]/.test(this.input.slice(start, this.pos))) octal = false;
    if (46 === next && !octal) {
        ++this.pos;
        this.readInt(10);
        next = this.input.charCodeAt(this.pos);
    }
    if ((69 === next || 101 === next) && !octal) {
        next = this.input.charCodeAt(++this.pos);
        if (43 === next || 45 === next) ++this.pos;
        if (null === this.readInt(10)) this.raise(start, "Invalid number");
    }
    if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");
    var val = stringToNumber(this.input.slice(start, this.pos), octal);
    return this.finishToken(types$1.num, val);
};
pp.readCodePoint = function() {
    var ch = this.input.charCodeAt(this.pos), code;
    if (123 === ch) {
        if (this.options.ecmaVersion < 6) this.unexpected();
        var codePos = ++this.pos;
        code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
        ++this.pos;
        if (code > 0x10FFFF) this.invalidStringToken(codePos, "Code point out of bounds");
    } else code = this.readHexChar(4);
    return code;
};
pp.readString = function(quote) {
    var out = "", chunkStart = ++this.pos;
    for(;;){
        if (this.pos >= this.input.length) this.raise(this.start, "Unterminated string constant");
        var ch = this.input.charCodeAt(this.pos);
        if (ch === quote) break;
        if (92 === ch) {
            out += this.input.slice(chunkStart, this.pos);
            out += this.readEscapedChar(false);
            chunkStart = this.pos;
        } else if (0x2028 === ch || 0x2029 === ch) {
            if (this.options.ecmaVersion < 10) this.raise(this.start, "Unterminated string constant");
            ++this.pos;
            if (this.options.locations) {
                this.curLine++;
                this.lineStart = this.pos;
            }
        } else {
            if (isNewLine(ch)) this.raise(this.start, "Unterminated string constant");
            ++this.pos;
        }
    }
    out += this.input.slice(chunkStart, this.pos++);
    return this.finishToken(types$1.string, out);
};
var INVALID_TEMPLATE_ESCAPE_ERROR = {};
pp.tryReadTemplateToken = function() {
    this.inTemplateElement = true;
    try {
        this.readTmplToken();
    } catch (err) {
        if (err === INVALID_TEMPLATE_ESCAPE_ERROR) this.readInvalidTemplateToken();
        else throw err;
    }
    this.inTemplateElement = false;
};
pp.invalidStringToken = function(position, message) {
    if (this.inTemplateElement && this.options.ecmaVersion >= 9) throw INVALID_TEMPLATE_ESCAPE_ERROR;
    else this.raise(position, message);
};
pp.readTmplToken = function() {
    var out = "", chunkStart = this.pos;
    for(;;){
        if (this.pos >= this.input.length) this.raise(this.start, "Unterminated template");
        var ch = this.input.charCodeAt(this.pos);
        if (96 === ch || 36 === ch && 123 === this.input.charCodeAt(this.pos + 1)) {
            if (this.pos === this.start && (this.type === types$1.template || this.type === types$1.invalidTemplate)) if (36 === ch) {
                this.pos += 2;
                return this.finishToken(types$1.dollarBraceL);
            } else {
                ++this.pos;
                return this.finishToken(types$1.backQuote);
            }
            out += this.input.slice(chunkStart, this.pos);
            return this.finishToken(types$1.template, out);
        }
        if (92 === ch) {
            out += this.input.slice(chunkStart, this.pos);
            out += this.readEscapedChar(true);
            chunkStart = this.pos;
        } else if (isNewLine(ch)) {
            out += this.input.slice(chunkStart, this.pos);
            ++this.pos;
            switch(ch){
                case 13:
                    if (10 === this.input.charCodeAt(this.pos)) ++this.pos;
                case 10:
                    out += "\n";
                    break;
                default:
                    out += String.fromCharCode(ch);
                    break;
            }
            if (this.options.locations) {
                ++this.curLine;
                this.lineStart = this.pos;
            }
            chunkStart = this.pos;
        } else ++this.pos;
    }
};
pp.readInvalidTemplateToken = function() {
    for(; this.pos < this.input.length; this.pos++)switch(this.input[this.pos]){
        case "\\":
            ++this.pos;
            break;
        case "$":
            if ("{" !== this.input[this.pos + 1]) break;
        case "`":
            return this.finishToken(types$1.invalidTemplate, this.input.slice(this.start, this.pos));
        case "\r":
            if ("\n" === this.input[this.pos + 1]) ++this.pos;
        case "\n":
        case "\u2028":
        case "\u2029":
            ++this.curLine;
            this.lineStart = this.pos + 1;
            break;
    }
    this.raise(this.start, "Unterminated template");
};
pp.readEscapedChar = function(inTemplate) {
    var ch = this.input.charCodeAt(++this.pos);
    ++this.pos;
    switch(ch){
        case 110:
            return "\n";
        case 114:
            return "\r";
        case 120:
            return String.fromCharCode(this.readHexChar(2));
        case 117:
            return codePointToString(this.readCodePoint());
        case 116:
            return "\t";
        case 98:
            return "\b";
        case 118:
            return "\u000b";
        case 102:
            return "\f";
        case 13:
            if (10 === this.input.charCodeAt(this.pos)) ++this.pos;
        case 10:
            if (this.options.locations) {
                this.lineStart = this.pos;
                ++this.curLine;
            }
            return "";
        case 56:
        case 57:
            if (this.strict) this.invalidStringToken(this.pos - 1, "Invalid escape sequence");
            if (inTemplate) {
                var codePos = this.pos - 1;
                this.invalidStringToken(codePos, "Invalid escape sequence in template string");
            }
        default:
            if (ch >= 48 && ch <= 55) {
                var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
                var octal = parseInt(octalStr, 8);
                if (octal > 255) {
                    octalStr = octalStr.slice(0, -1);
                    octal = parseInt(octalStr, 8);
                }
                this.pos += octalStr.length - 1;
                ch = this.input.charCodeAt(this.pos);
                if (("0" !== octalStr || 56 === ch || 57 === ch) && (this.strict || inTemplate)) this.invalidStringToken(this.pos - 1 - octalStr.length, inTemplate ? "Octal literal in template string" : "Octal literal in strict mode");
                return String.fromCharCode(octal);
            }
            if (isNewLine(ch)) {
                if (this.options.locations) {
                    this.lineStart = this.pos;
                    ++this.curLine;
                }
                return "";
            }
            return String.fromCharCode(ch);
    }
};
pp.readHexChar = function(len) {
    var codePos = this.pos;
    var n = this.readInt(16, len);
    if (null === n) this.invalidStringToken(codePos, "Bad character escape sequence");
    return n;
};
pp.readWord1 = function() {
    this.containsEsc = false;
    var word = "", first = true, chunkStart = this.pos;
    var astral = this.options.ecmaVersion >= 6;
    while(this.pos < this.input.length){
        var ch = this.fullCharCodeAtPos();
        if (isIdentifierChar(ch, astral)) this.pos += ch <= 0xffff ? 1 : 2;
        else if (92 === ch) {
            this.containsEsc = true;
            word += this.input.slice(chunkStart, this.pos);
            var escStart = this.pos;
            if (117 !== this.input.charCodeAt(++this.pos)) this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX");
            ++this.pos;
            var esc = this.readCodePoint();
            if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral)) this.invalidStringToken(escStart, "Invalid Unicode escape");
            word += codePointToString(esc);
            chunkStart = this.pos;
        } else break;
        first = false;
    }
    return word + this.input.slice(chunkStart, this.pos);
};
pp.readWord = function() {
    var word = this.readWord1();
    var type = types$1.name;
    if (this.keywords.test(word)) type = keywords[word];
    return this.finishToken(type, word);
};
var version = "8.19.0";
acorn_Parser.acorn = {
    Parser: acorn_Parser,
    version: version,
    defaultOptions: defaultOptions,
    Position: acorn_Position,
    SourceLocation: acorn_SourceLocation,
    getLineInfo: getLineInfo,
    Node: acorn_Node,
    TokenType: acorn_TokenType,
    tokTypes: types$1,
    keywordTypes: keywords,
    TokContext: acorn_TokContext,
    tokContexts: types,
    isIdentifierChar: isIdentifierChar,
    isIdentifierStart: isIdentifierStart,
    Token: acorn_Token,
    isNewLine: isNewLine,
    lineBreak: lineBreak,
    lineBreakG: lineBreakG,
    nonASCIIwhitespace: nonASCIIwhitespace
};
function acorn_parse(input, options) {
    return acorn_Parser.parse(input, options);
}
function assert(condition, message = "Assertion failed.") {
    if (!condition) throw new Error(message);
}
const READ = 0x1;
const WRITE = 0x2;
const RW = READ | WRITE;
class Reference {
    constructor(ident, scope, flag, writeExpr, maybeImplicitGlobal, partial, init){
        this.identifier = ident;
        this.from = scope;
        this.tainted = false;
        this.resolved = null;
        this.flag = flag;
        if (this.isWrite()) {
            this.writeExpr = writeExpr;
            this.partial = partial;
            this.init = init;
        }
        this.__maybeImplicitGlobal = maybeImplicitGlobal;
    }
    isStatic() {
        return !this.tainted && this.resolved && this.resolved.scope.isStatic();
    }
    isWrite() {
        return !!(this.flag & Reference.WRITE);
    }
    isRead() {
        return !!(this.flag & Reference.READ);
    }
    isReadOnly() {
        return this.flag === Reference.READ;
    }
    isWriteOnly() {
        return this.flag === Reference.WRITE;
    }
    isReadWrite() {
        return this.flag === Reference.RW;
    }
}
Reference.READ = READ;
Reference.WRITE = WRITE;
Reference.RW = RW;
const reference = Reference;
class Variable {
    constructor(name, scope){
        this.name = name;
        this.identifiers = [];
        this.references = [];
        this.defs = [];
        this.tainted = false;
        this.stack = true;
        this.scope = scope;
    }
}
Variable.CatchClause = "CatchClause";
Variable.Parameter = "Parameter";
Variable.FunctionName = "FunctionName";
Variable.ClassName = "ClassName";
Variable.Variable = "Variable";
Variable.ImportBinding = "ImportBinding";
Variable.ImplicitGlobalVariable = "ImplicitGlobalVariable";
const lib_variable = Variable;
class Definition {
    constructor(type, name, node, parent, index, kind){
        this.type = type;
        this.name = name;
        this.node = node;
        this.parent = parent;
        this.index = index;
        this.kind = kind;
    }
}
class ParameterDefinition extends Definition {
    constructor(name, node, index, rest){
        super(lib_variable.Parameter, name, node, null, index, null);
        this.rest = rest;
    }
}
const estraverse = __webpack_require__("../../../node_modules/.pnpm/estraverse@5.3.0/node_modules/estraverse/estraverse.js");
const { Syntax } = estraverse;
function isStrictScope(scope, block, isMethodDefinition) {
    let body;
    if (scope.upper && scope.upper.isStrict) return true;
    if (isMethodDefinition) return true;
    if ("class" === scope.type || "module" === scope.type) return true;
    if ("block" === scope.type || "switch" === scope.type) return false;
    if ("function" === scope.type) {
        if (block.type === Syntax.ArrowFunctionExpression && block.body.type !== Syntax.BlockStatement) return false;
        body = block.type === Syntax.Program ? block : block.body;
        if (!body) return false;
    } else {
        if ("global" !== scope.type) return false;
        body = block;
    }
    for(let i = 0, iz = body.body.length; i < iz; ++i){
        const stmt = body.body[i];
        if ("string" != typeof stmt.directive) break;
        if ("use strict" === stmt.directive) return true;
    }
    return false;
}
function registerScope(scopeManager, scope) {
    scopeManager.scopes.push(scope);
    const scopes = scopeManager.__nodeToScope.get(scope.block);
    if (scopes) scopes.push(scope);
    else scopeManager.__nodeToScope.set(scope.block, [
        scope
    ]);
}
function shouldBeStatically(def) {
    return def.type === lib_variable.ClassName || def.type === lib_variable.Variable && "var" !== def.parent.kind;
}
class scope_Scope {
    constructor(scopeManager, type, upperScope, block, isMethodDefinition){
        this.type = type;
        this.set = new Map();
        this.taints = new Map();
        this.dynamic = "global" === this.type || "with" === this.type;
        this.block = block;
        this.through = [];
        this.variables = [];
        this.references = [];
        this.variableScope = "global" === this.type || "module" === this.type || "function" === this.type || "class-field-initializer" === this.type || "class-static-block" === this.type ? this : upperScope.variableScope;
        this.functionExpressionScope = false;
        this.directCallToEvalScope = false;
        this.thisFound = false;
        this.__left = [];
        this.upper = upperScope;
        this.isStrict = scopeManager.isStrictModeSupported() ? isStrictScope(this, block, isMethodDefinition) : false;
        this.childScopes = [];
        if (this.upper) this.upper.childScopes.push(this);
        this.__declaredVariables = scopeManager.__declaredVariables;
        registerScope(scopeManager, this);
    }
    __shouldStaticallyClose(scopeManager) {
        return !this.dynamic || scopeManager.__isOptimistic();
    }
    __shouldStaticallyCloseForGlobal(ref) {
        const name = ref.identifier.name;
        if (!this.set.has(name)) return false;
        const variable = this.set.get(name);
        const defs = variable.defs;
        return defs.length > 0 && defs.every(shouldBeStatically);
    }
    __staticCloseRef(ref) {
        if (!this.__resolve(ref)) this.__delegateToUpperScope(ref);
    }
    __dynamicCloseRef(ref) {
        let current = this;
        do {
            current.through.push(ref);
            current = current.upper;
        }while (current);
    }
    __globalCloseRef(ref) {
        if (this.__shouldStaticallyCloseForGlobal(ref)) this.__staticCloseRef(ref);
        else this.__dynamicCloseRef(ref);
    }
    __close(scopeManager) {
        let closeRef;
        closeRef = this.__shouldStaticallyClose(scopeManager) ? this.__staticCloseRef : "global" !== this.type ? this.__dynamicCloseRef : this.__globalCloseRef;
        for(let i = 0, iz = this.__left.length; i < iz; ++i){
            const ref = this.__left[i];
            closeRef.call(this, ref);
        }
        this.__left = null;
        return this.upper;
    }
    __isValidResolution(ref, variable) {
        return true;
    }
    __resolve(ref) {
        const name = ref.identifier.name;
        if (!this.set.has(name)) return false;
        const variable = this.set.get(name);
        if (!this.__isValidResolution(ref, variable)) return false;
        variable.references.push(ref);
        variable.stack = variable.stack && ref.from.variableScope === this.variableScope;
        if (ref.tainted) {
            variable.tainted = true;
            this.taints.set(variable.name, true);
        }
        ref.resolved = variable;
        return true;
    }
    __delegateToUpperScope(ref) {
        if (this.upper) this.upper.__left.push(ref);
        this.through.push(ref);
    }
    __addDeclaredVariablesOfNode(variable, node) {
        if (null == node) return;
        let variables = this.__declaredVariables.get(node);
        if (null == variables) {
            variables = [];
            this.__declaredVariables.set(node, variables);
        }
        if (!variables.includes(variable)) variables.push(variable);
    }
    __defineGeneric(name, set, variables, node, def) {
        let variable;
        variable = set.get(name);
        if (!variable) {
            variable = new lib_variable(name, this);
            set.set(name, variable);
            variables.push(variable);
        }
        if (def) {
            variable.defs.push(def);
            this.__addDeclaredVariablesOfNode(variable, def.node);
            this.__addDeclaredVariablesOfNode(variable, def.parent);
        }
        if (node) variable.identifiers.push(node);
    }
    __define(node, def) {
        if (node && node.type === Syntax.Identifier) this.__defineGeneric(node.name, this.set, this.variables, node, def);
    }
    __referencing(node, assign, writeExpr, maybeImplicitGlobal, partial, init) {
        if (!node || node.type !== Syntax.Identifier && "JSXIdentifier" !== node.type) return;
        if ("super" === node.name) return;
        const ref = new reference(node, this, assign || reference.READ, writeExpr, maybeImplicitGlobal, !!partial, !!init);
        this.references.push(ref);
        this.__left.push(ref);
    }
    __detectEval() {
        let current = this;
        this.directCallToEvalScope = true;
        do {
            current.dynamic = true;
            current = current.upper;
        }while (current);
    }
    __detectThis() {
        this.thisFound = true;
    }
    __isClosed() {
        return null === this.__left;
    }
    resolve(ident) {
        let ref, i, iz;
        assert(this.__isClosed(), "Scope should be closed.");
        assert(ident.type === Syntax.Identifier, "Target should be identifier.");
        for(i = 0, iz = this.references.length; i < iz; ++i){
            ref = this.references[i];
            if (ref.identifier === ident) return ref;
        }
        return null;
    }
    isStatic() {
        return !this.dynamic;
    }
    isArgumentsMaterialized() {
        return true;
    }
    isThisMaterialized() {
        return true;
    }
    isUsedName(name) {
        if (this.set.has(name)) return true;
        for(let i = 0, iz = this.through.length; i < iz; ++i)if (this.through[i].identifier.name === name) return true;
        return false;
    }
}
class GlobalScope extends scope_Scope {
    constructor(scopeManager, block){
        super(scopeManager, "global", null, block, false);
        this.implicit = {
            set: new Map(),
            variables: [],
            left: []
        };
    }
    __close(scopeManager) {
        const implicit = [];
        for(let i = 0, iz = this.__left.length; i < iz; ++i){
            const ref = this.__left[i];
            if (ref.__maybeImplicitGlobal && !this.set.has(ref.identifier.name)) implicit.push(ref.__maybeImplicitGlobal);
        }
        for(let i = 0, iz = implicit.length; i < iz; ++i){
            const info = implicit[i];
            this.__defineImplicit(info.pattern, new Definition(lib_variable.ImplicitGlobalVariable, info.pattern, info.node, null, null, null));
        }
        this.implicit.left = this.__left;
        return super.__close(scopeManager);
    }
    __defineImplicit(node, def) {
        if (node && node.type === Syntax.Identifier) this.__defineGeneric(node.name, this.implicit.set, this.implicit.variables, node, def);
    }
}
class ModuleScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "module", upperScope, block, false);
    }
}
class FunctionExpressionNameScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "function-expression-name", upperScope, block, false);
        this.__define(block.id, new Definition(lib_variable.FunctionName, block.id, block, null, null, null));
        this.functionExpressionScope = true;
    }
}
class CatchScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "catch", upperScope, block, false);
    }
}
class WithScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "with", upperScope, block, false);
    }
    __close(scopeManager) {
        if (this.__shouldStaticallyClose(scopeManager)) return super.__close(scopeManager);
        for(let i = 0, iz = this.__left.length; i < iz; ++i){
            const ref = this.__left[i];
            ref.tainted = true;
            this.__delegateToUpperScope(ref);
        }
        this.__left = null;
        return this.upper;
    }
}
class BlockScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "block", upperScope, block, false);
    }
}
class SwitchScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "switch", upperScope, block, false);
    }
}
class FunctionScope extends scope_Scope {
    constructor(scopeManager, upperScope, block, isMethodDefinition){
        super(scopeManager, "function", upperScope, block, isMethodDefinition);
        if (this.block.type !== Syntax.ArrowFunctionExpression) this.__defineArguments();
    }
    isArgumentsMaterialized() {
        if (this.block.type === Syntax.ArrowFunctionExpression) return false;
        if (!this.isStatic()) return true;
        const variable = this.set.get("arguments");
        assert(variable, "Always have arguments variable.");
        return variable.tainted || 0 !== variable.references.length;
    }
    isThisMaterialized() {
        if (!this.isStatic()) return true;
        return this.thisFound;
    }
    __defineArguments() {
        this.__defineGeneric("arguments", this.set, this.variables, null, null);
        this.taints.set("arguments", true);
    }
    __isValidResolution(ref, variable) {
        if ("Program" === this.block.type) return true;
        const bodyStart = this.block.body.range[0];
        return !(variable.scope === this && ref.identifier.range[0] < bodyStart && variable.defs.every((d)=>d.name.range[0] >= bodyStart));
    }
}
class ForScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "for", upperScope, block, false);
    }
}
class ClassScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "class", upperScope, block, false);
    }
}
class ClassFieldInitializerScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "class-field-initializer", upperScope, block, true);
    }
}
class ClassStaticBlockScope extends scope_Scope {
    constructor(scopeManager, upperScope, block){
        super(scopeManager, "class-static-block", upperScope, block, true);
    }
}
class ScopeManager {
    constructor(options){
        this.scopes = [];
        this.globalScope = null;
        this.__nodeToScope = new WeakMap();
        this.__currentScope = null;
        this.__options = options;
        this.__declaredVariables = new WeakMap();
    }
    __isOptimistic() {
        return this.__options.optimistic;
    }
    __ignoreEval() {
        return this.__options.ignoreEval;
    }
    __isJSXEnabled() {
        return true === this.__options.jsx;
    }
    isGlobalReturn() {
        return this.__options.nodejsScope || "commonjs" === this.__options.sourceType;
    }
    isModule() {
        return "module" === this.__options.sourceType;
    }
    isImpliedStrict() {
        return this.__options.impliedStrict;
    }
    isStrictModeSupported() {
        return this.__options.ecmaVersion >= 5;
    }
    __get(node) {
        return this.__nodeToScope.get(node);
    }
    getDeclaredVariables(node) {
        return this.__declaredVariables.get(node) || [];
    }
    acquire(node, inner) {
        function predicate(testScope) {
            if ("function" === testScope.type && testScope.functionExpressionScope) return false;
            return true;
        }
        const scopes = this.__get(node);
        if (!scopes || 0 === scopes.length) return null;
        if (1 === scopes.length) return scopes[0];
        if (inner) for(let i = scopes.length - 1; i >= 0; --i){
            const scope = scopes[i];
            if (predicate(scope)) return scope;
        }
        else for(let i = 0, iz = scopes.length; i < iz; ++i){
            const scope = scopes[i];
            if (predicate(scope)) return scope;
        }
        return null;
    }
    acquireAll(node) {
        return this.__get(node);
    }
    release(node, inner) {
        const scopes = this.__get(node);
        if (scopes && scopes.length) {
            const scope = scopes[0].upper;
            if (!scope) return null;
            return this.acquire(scope.block, inner);
        }
        return null;
    }
    attach() {}
    detach() {}
    __nestScope(scope) {
        if (scope instanceof GlobalScope) {
            assert(null === this.__currentScope);
            this.globalScope = scope;
        }
        this.__currentScope = scope;
        return scope;
    }
    __nestGlobalScope(node) {
        return this.__nestScope(new GlobalScope(this, node));
    }
    __nestBlockScope(node) {
        return this.__nestScope(new BlockScope(this, this.__currentScope, node));
    }
    __nestFunctionScope(node, isMethodDefinition) {
        return this.__nestScope(new FunctionScope(this, this.__currentScope, node, isMethodDefinition));
    }
    __nestForScope(node) {
        return this.__nestScope(new ForScope(this, this.__currentScope, node));
    }
    __nestCatchScope(node) {
        return this.__nestScope(new CatchScope(this, this.__currentScope, node));
    }
    __nestWithScope(node) {
        return this.__nestScope(new WithScope(this, this.__currentScope, node));
    }
    __nestClassScope(node) {
        return this.__nestScope(new ClassScope(this, this.__currentScope, node));
    }
    __nestClassFieldInitializerScope(node) {
        return this.__nestScope(new ClassFieldInitializerScope(this, this.__currentScope, node));
    }
    __nestClassStaticBlockScope(node) {
        return this.__nestScope(new ClassStaticBlockScope(this, this.__currentScope, node));
    }
    __nestSwitchScope(node) {
        return this.__nestScope(new SwitchScope(this, this.__currentScope, node));
    }
    __nestModuleScope(node) {
        return this.__nestScope(new ModuleScope(this, this.__currentScope, node));
    }
    __nestFunctionExpressionNameScope(node) {
        return this.__nestScope(new FunctionExpressionNameScope(this, this.__currentScope, node));
    }
    __isES6() {
        return this.__options.ecmaVersion >= 6;
    }
}
const scope_manager = ScopeManager;
const esrecurse = __webpack_require__("../../../node_modules/.pnpm/esrecurse@4.3.0/node_modules/esrecurse/esrecurse.js");
const { Syntax: pattern_visitor_Syntax } = estraverse;
function getLast(xs) {
    return xs.at(-1) || null;
}
class PatternVisitor extends esrecurse.le {
    static isPattern(node) {
        const nodeType = node.type;
        return nodeType === pattern_visitor_Syntax.Identifier || nodeType === pattern_visitor_Syntax.ObjectPattern || nodeType === pattern_visitor_Syntax.ArrayPattern || nodeType === pattern_visitor_Syntax.SpreadElement || nodeType === pattern_visitor_Syntax.RestElement || nodeType === pattern_visitor_Syntax.AssignmentPattern;
    }
    constructor(options, rootPattern, callback){
        super(null, options);
        this.rootPattern = rootPattern;
        this.callback = callback;
        this.assignments = [];
        this.rightHandNodes = [];
        this.restElements = [];
    }
    Identifier(pattern) {
        const lastRestElement = getLast(this.restElements);
        this.callback(pattern, {
            topLevel: pattern === this.rootPattern,
            rest: null != lastRestElement && lastRestElement.argument === pattern,
            assignments: this.assignments
        });
    }
    Property(property) {
        if (property.computed) this.rightHandNodes.push(property.key);
        this.visit(property.value);
    }
    ArrayPattern(pattern) {
        for(let i = 0, iz = pattern.elements.length; i < iz; ++i){
            const element = pattern.elements[i];
            this.visit(element);
        }
    }
    AssignmentPattern(pattern) {
        this.assignments.push(pattern);
        this.visit(pattern.left);
        this.rightHandNodes.push(pattern.right);
        this.assignments.pop();
    }
    RestElement(pattern) {
        this.restElements.push(pattern);
        this.visit(pattern.argument);
        this.restElements.pop();
    }
    MemberExpression(node) {
        if (node.computed) this.rightHandNodes.push(node.property);
        this.rightHandNodes.push(node.object);
    }
    SpreadElement(node) {
        this.visit(node.argument);
    }
    ArrayExpression(node) {
        node.elements.forEach(this.visit, this);
    }
    AssignmentExpression(node) {
        this.assignments.push(node);
        this.visit(node.left);
        this.rightHandNodes.push(node.right);
        this.assignments.pop();
    }
    CallExpression(node) {
        node.arguments.forEach((a)=>{
            this.rightHandNodes.push(a);
        });
        this.visit(node.callee);
    }
}
const pattern_visitor = PatternVisitor;
const { Syntax: referencer_Syntax } = estraverse;
function traverseIdentifierInPattern(options, rootPattern, referencer, callback) {
    const visitor = new pattern_visitor(options, rootPattern, callback);
    visitor.visit(rootPattern);
    if (null != referencer) visitor.rightHandNodes.forEach(referencer.visit, referencer);
}
class Importer extends esrecurse.le {
    constructor(declaration, referencer){
        super(null, referencer.options);
        this.declaration = declaration;
        this.referencer = referencer;
    }
    visitImport(id, specifier) {
        this.referencer.visitPattern(id, (pattern)=>{
            this.referencer.currentScope().__define(pattern, new Definition(lib_variable.ImportBinding, pattern, specifier, this.declaration, null, null));
        });
    }
    ImportNamespaceSpecifier(node) {
        const local = node.local || node.id;
        if (local) this.visitImport(local, node);
    }
    ImportDefaultSpecifier(node) {
        const local = node.local || node.id;
        this.visitImport(local, node);
    }
    ImportSpecifier(node) {
        const local = node.local || node.id;
        if (node.name) this.visitImport(node.name, node);
        else this.visitImport(local, node);
    }
}
class Referencer extends esrecurse.le {
    constructor(options, scopeManager){
        super(null, options);
        this.options = options;
        this.scopeManager = scopeManager;
        this.parent = null;
        this.isInnerMethodDefinition = false;
    }
    currentScope() {
        return this.scopeManager.__currentScope;
    }
    close(node) {
        while(this.currentScope() && node === this.currentScope().block)this.scopeManager.__currentScope = this.currentScope().__close(this.scopeManager);
    }
    pushInnerMethodDefinition(isInnerMethodDefinition) {
        const previous = this.isInnerMethodDefinition;
        this.isInnerMethodDefinition = isInnerMethodDefinition;
        return previous;
    }
    popInnerMethodDefinition(isInnerMethodDefinition) {
        this.isInnerMethodDefinition = isInnerMethodDefinition;
    }
    referencingDefaultValue(pattern, assignments, maybeImplicitGlobal, init) {
        const scope = this.currentScope();
        assignments.forEach((assignment)=>{
            scope.__referencing(pattern, reference.WRITE, assignment.right, maybeImplicitGlobal, pattern !== assignment.left, init);
        });
    }
    visitPattern(node, options, callback) {
        let visitPatternOptions = options;
        let visitPatternCallback = callback;
        if ("function" == typeof options) {
            visitPatternCallback = options;
            visitPatternOptions = {
                processRightHandNodes: false
            };
        }
        traverseIdentifierInPattern(this.options, node, visitPatternOptions.processRightHandNodes ? this : null, visitPatternCallback);
    }
    visitFunction(node) {
        let i, iz;
        if (node.type === referencer_Syntax.FunctionDeclaration) this.currentScope().__define(node.id, new Definition(lib_variable.FunctionName, node.id, node, null, null, null));
        if (node.type === referencer_Syntax.FunctionExpression && node.id) this.scopeManager.__nestFunctionExpressionNameScope(node);
        this.scopeManager.__nestFunctionScope(node, this.isInnerMethodDefinition);
        const that = this;
        function visitPatternCallback(pattern, info) {
            that.currentScope().__define(pattern, new ParameterDefinition(pattern, node, i, info.rest));
            that.referencingDefaultValue(pattern, info.assignments, null, true);
        }
        for(i = 0, iz = node.params.length; i < iz; ++i)this.visitPattern(node.params[i], {
            processRightHandNodes: true
        }, visitPatternCallback);
        if (node.rest) this.visitPattern({
            type: "RestElement",
            argument: node.rest
        }, (pattern)=>{
            this.currentScope().__define(pattern, new ParameterDefinition(pattern, node, node.params.length, true));
        });
        if (node.body) if (node.body.type === referencer_Syntax.BlockStatement) this.visitChildren(node.body);
        else this.visit(node.body);
        this.close(node);
    }
    visitClass(node) {
        if (node.type === referencer_Syntax.ClassDeclaration) this.currentScope().__define(node.id, new Definition(lib_variable.ClassName, node.id, node, null, null, null));
        this.scopeManager.__nestClassScope(node);
        if (node.id) this.currentScope().__define(node.id, new Definition(lib_variable.ClassName, node.id, node));
        this.visit(node.superClass);
        this.visit(node.body);
        this.close(node);
    }
    visitProperty(node) {
        let previous;
        if (node.computed) this.visit(node.key);
        const isMethodDefinition = node.type === referencer_Syntax.MethodDefinition;
        if (isMethodDefinition) previous = this.pushInnerMethodDefinition(true);
        this.visit(node.value);
        if (isMethodDefinition) this.popInnerMethodDefinition(previous);
    }
    visitForIn(node) {
        if (node.left.type === referencer_Syntax.VariableDeclaration && "var" !== node.left.kind) this.scopeManager.__nestForScope(node);
        if (node.left.type === referencer_Syntax.VariableDeclaration) {
            this.visit(node.left);
            this.visitPattern(node.left.declarations[0].id, (pattern)=>{
                this.currentScope().__referencing(pattern, reference.WRITE, node.right, null, true, true);
            });
        } else this.visitPattern(node.left, {
            processRightHandNodes: true
        }, (pattern, info)=>{
            let maybeImplicitGlobal = null;
            if (!this.currentScope().isStrict) maybeImplicitGlobal = {
                pattern,
                node
            };
            this.referencingDefaultValue(pattern, info.assignments, maybeImplicitGlobal, false);
            this.currentScope().__referencing(pattern, reference.WRITE, node.right, maybeImplicitGlobal, true, false);
        });
        this.visit(node.right);
        this.visit(node.body);
        this.close(node);
    }
    visitVariableDeclaration(variableTargetScope, type, node, index) {
        const decl = node.declarations[index];
        const init = decl.init;
        this.visitPattern(decl.id, {
            processRightHandNodes: true
        }, (pattern, info)=>{
            variableTargetScope.__define(pattern, new Definition(type, pattern, decl, node, index, node.kind));
            this.referencingDefaultValue(pattern, info.assignments, null, true);
            if (init) this.currentScope().__referencing(pattern, reference.WRITE, init, null, !info.topLevel, true);
        });
    }
    AssignmentExpression(node) {
        if (pattern_visitor.isPattern(node.left)) if ("=" === node.operator) this.visitPattern(node.left, {
            processRightHandNodes: true
        }, (pattern, info)=>{
            let maybeImplicitGlobal = null;
            if (!this.currentScope().isStrict) maybeImplicitGlobal = {
                pattern,
                node
            };
            this.referencingDefaultValue(pattern, info.assignments, maybeImplicitGlobal, false);
            this.currentScope().__referencing(pattern, reference.WRITE, node.right, maybeImplicitGlobal, !info.topLevel, false);
        });
        else this.currentScope().__referencing(node.left, reference.RW, node.right);
        else this.visit(node.left);
        this.visit(node.right);
    }
    CatchClause(node) {
        this.scopeManager.__nestCatchScope(node);
        this.visitPattern(node.param, {
            processRightHandNodes: true
        }, (pattern, info)=>{
            this.currentScope().__define(pattern, new Definition(lib_variable.CatchClause, pattern, node, null, null, null));
            this.referencingDefaultValue(pattern, info.assignments, null, true);
        });
        this.visit(node.body);
        this.close(node);
    }
    Program(node) {
        this.scopeManager.__nestGlobalScope(node);
        if (this.scopeManager.isGlobalReturn()) {
            this.currentScope().isStrict = false;
            this.scopeManager.__nestFunctionScope(node, false);
        }
        if (this.scopeManager.__isES6() && this.scopeManager.isModule()) this.scopeManager.__nestModuleScope(node);
        if (this.scopeManager.isStrictModeSupported() && this.scopeManager.isImpliedStrict()) this.currentScope().isStrict = true;
        this.visitChildren(node);
        this.close(node);
    }
    Identifier(node) {
        this.currentScope().__referencing(node);
    }
    PrivateIdentifier() {}
    UpdateExpression(node) {
        if (pattern_visitor.isPattern(node.argument)) this.currentScope().__referencing(node.argument, reference.RW, null);
        else this.visitChildren(node);
    }
    MemberExpression(node) {
        this.visit(node.object);
        if (node.computed) this.visit(node.property);
    }
    Property(node) {
        this.visitProperty(node);
    }
    PropertyDefinition(node) {
        const { computed, key, value } = node;
        if (computed) this.visit(key);
        if (value) {
            this.scopeManager.__nestClassFieldInitializerScope(value);
            this.visit(value);
            this.close(value);
        }
    }
    StaticBlock(node) {
        this.scopeManager.__nestClassStaticBlockScope(node);
        this.visitChildren(node);
        this.close(node);
    }
    MethodDefinition(node) {
        this.visitProperty(node);
    }
    BreakStatement() {}
    ContinueStatement() {}
    LabeledStatement(node) {
        this.visit(node.body);
    }
    ForStatement(node) {
        if (node.init && node.init.type === referencer_Syntax.VariableDeclaration && "var" !== node.init.kind) this.scopeManager.__nestForScope(node);
        this.visitChildren(node);
        this.close(node);
    }
    ClassExpression(node) {
        this.visitClass(node);
    }
    ClassDeclaration(node) {
        this.visitClass(node);
    }
    CallExpression(node) {
        if (!this.scopeManager.__ignoreEval() && node.callee.type === referencer_Syntax.Identifier && "eval" === node.callee.name) this.currentScope().variableScope.__detectEval();
        this.visitChildren(node);
    }
    BlockStatement(node) {
        if (this.scopeManager.__isES6()) this.scopeManager.__nestBlockScope(node);
        this.visitChildren(node);
        this.close(node);
    }
    ThisExpression() {
        this.currentScope().variableScope.__detectThis();
    }
    WithStatement(node) {
        this.visit(node.object);
        this.scopeManager.__nestWithScope(node);
        this.visit(node.body);
        this.close(node);
    }
    VariableDeclaration(node) {
        const variableTargetScope = "var" === node.kind ? this.currentScope().variableScope : this.currentScope();
        for(let i = 0, iz = node.declarations.length; i < iz; ++i){
            const decl = node.declarations[i];
            this.visitVariableDeclaration(variableTargetScope, lib_variable.Variable, node, i);
            if (decl.init) this.visit(decl.init);
        }
    }
    SwitchStatement(node) {
        this.visit(node.discriminant);
        if (this.scopeManager.__isES6()) this.scopeManager.__nestSwitchScope(node);
        for(let i = 0, iz = node.cases.length; i < iz; ++i)this.visit(node.cases[i]);
        this.close(node);
    }
    FunctionDeclaration(node) {
        this.visitFunction(node);
    }
    FunctionExpression(node) {
        this.visitFunction(node);
    }
    ForOfStatement(node) {
        this.visitForIn(node);
    }
    ForInStatement(node) {
        this.visitForIn(node);
    }
    ArrowFunctionExpression(node) {
        this.visitFunction(node);
    }
    ImportDeclaration(node) {
        assert(this.scopeManager.__isES6() && this.scopeManager.isModule(), "ImportDeclaration should appear when the mode is ES6 and in the module context.");
        const importer = new Importer(node, this);
        importer.visit(node);
    }
    visitExportDeclaration(node) {
        if (node.source) return;
        if (node.declaration) return void this.visit(node.declaration);
        this.visitChildren(node);
    }
    ExportDeclaration(node) {
        this.visitExportDeclaration(node);
    }
    ExportAllDeclaration(node) {
        this.visitExportDeclaration(node);
    }
    ExportDefaultDeclaration(node) {
        this.visitExportDeclaration(node);
    }
    ExportNamedDeclaration(node) {
        this.visitExportDeclaration(node);
    }
    ExportSpecifier(node) {
        const local = node.id || node.local;
        this.visit(local);
    }
    MetaProperty() {}
    JSXIdentifier(node) {
        if (this.scopeManager.__isJSXEnabled() && "this" !== node.name) this.currentScope().__referencing(node);
    }
    JSXMemberExpression(node) {
        this.visit(node.object);
    }
    JSXElement(node) {
        if (this.scopeManager.__isJSXEnabled()) {
            this.visit(node.openingElement);
            node.children.forEach(this.visit, this);
        } else this.visitChildren(node);
    }
    JSXOpeningElement(node) {
        if (this.scopeManager.__isJSXEnabled()) {
            const nameNode = node.name;
            const isComponentName = "JSXIdentifier" === nameNode.type && nameNode.name[0].toUpperCase() === nameNode.name[0];
            const isComponent = isComponentName || "JSXMemberExpression" === nameNode.type;
            if (isComponent) this.visit(nameNode);
        }
        node.attributes.forEach(this.visit, this);
    }
    JSXAttribute(node) {
        if (node.value) this.visit(node.value);
    }
    JSXExpressionContainer(node) {
        this.visit(node.expression);
    }
    JSXNamespacedName(node) {
        this.visit(node.namespace);
        this.visit(node.name);
    }
}
const lib_referencer = Referencer;
function lib_defaultOptions() {
    return {
        optimistic: false,
        nodejsScope: false,
        impliedStrict: false,
        sourceType: "script",
        ecmaVersion: 5,
        childVisitorKeys: null,
        fallback: "iteration"
    };
}
function updateDeeply(target, override) {
    function isHashObject(value) {
        return "object" == typeof value && value instanceof Object && !(value instanceof Array) && !(value instanceof RegExp);
    }
    for(const key in override)if (Object.hasOwn(override, key)) {
        const val = override[key];
        if (isHashObject(val)) if (isHashObject(target[key])) updateDeeply(target[key], val);
        else target[key] = updateDeeply({}, val);
        else target[key] = val;
    }
    return target;
}
function analyze(tree, providedOptions) {
    const options = updateDeeply(lib_defaultOptions(), providedOptions);
    const scopeManager = new scope_manager(options);
    const referencer = new lib_referencer(options, scopeManager);
    referencer.visit(tree);
    assert(null === scopeManager.__currentScope, "currentScope should be null.");
    return scopeManager;
}
const UTF8_BOM = '\uFEFF';
const COMMENT_START = '<!--';
const COMMENT_END = '-->';
const CDATA_START = '<![CDATA[';
const LYNX_DOCTYPE = '<!doctype lynx>';
const END_TAG_START = '</';
const BACKGROUND_WRAPPER_PARAMS = [
    'require',
    'module',
    'exports',
    'Card',
    'setTimeout',
    'setInterval',
    'clearInterval',
    'clearTimeout',
    'NativeModules',
    'tt',
    'console',
    'Component',
    'TaroLynx',
    'nativeAppId',
    'Behavior',
    'LynxJSBI',
    'lynx',
    'window',
    'document',
    'frames',
    'self',
    'location',
    'navigator',
    'localStorage',
    'history',
    'Caches',
    'screen',
    'alert',
    'confirm',
    'prompt',
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'webkit',
    'Reporter',
    'print',
    'global',
    'requestAnimationFrame',
    'cancelAnimationFrame'
];
const BACKGROUND_WRAPPER_PARAM_SET = new Set(BACKGROUND_WRAPPER_PARAMS);
const BACKGROUND_WRAPPER_PREFIX = `(function(${BACKGROUND_WRAPPER_PARAMS.join(', ')}){\n`;
const BACKGROUND_WRAPPER_SUFFIX = '\n});';
const ECMASCRIPT_GLOBALS = new Set([
    'AggregateError',
    'Array',
    'ArrayBuffer',
    'BigInt',
    'BigInt64Array',
    'BigUint64Array',
    'Boolean',
    'DataView',
    'Date',
    'Error',
    'EvalError',
    'FinalizationRegistry',
    'Float32Array',
    'Float64Array',
    'Function',
    'Infinity',
    'Int16Array',
    'Int32Array',
    'Int8Array',
    'JSON',
    'Map',
    'Math',
    'NaN',
    'Number',
    'Object',
    'Promise',
    'Proxy',
    'RangeError',
    'ReferenceError',
    'Reflect',
    'RegExp',
    'Set',
    'String',
    'Symbol',
    'SyntaxError',
    'TypeError',
    'URIError',
    'Uint16Array',
    'Uint32Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'WeakMap',
    'WeakRef',
    'WeakSet',
    'decodeURI',
    'decodeURIComponent',
    'encodeURI',
    'encodeURIComponent',
    'escape',
    'eval',
    'globalThis',
    'isFinite',
    'isNaN',
    'parseFloat',
    'parseInt',
    'undefined',
    'unescape'
]);
const MAIN_RUNTIME_GLOBALS = new Set([
    'SystemInfo',
    'cancelAnimationFrame',
    'clearInterval',
    'clearTimeout',
    'console',
    'lynx',
    'requestAnimationFrame',
    'setInterval',
    'setTimeout'
]);
const FORBIDDEN_MAIN_THREAD_APIS = new Set([
    '__AddEvent',
    '__CreateFor',
    '__CreateIf',
    '__CreateStyleObject',
    '__SetLepusInitData',
    '__SetStyleObject',
    '__UpdateForChildCount',
    '__UpdateIfNodeIndex',
    '__UpdateStyleObject'
]);
const MAIN_THREAD_ELEMENT_PAPI_GLOBALS = new Set([
    '_ReportError',
    '__AddClass',
    '__AddConfig',
    '__AddDataset',
    '__AddEventListener',
    '__AddInlineStyle',
    '__AdoptStyleSheet',
    '__AppendElement',
    '__AsyncResolveElement',
    '__AsyncResolveSubtree',
    '__CleanUp',
    '__CloneElement',
    '__ConsumeGesture',
    '__CreateBlock',
    '__CreateComponent',
    '__CreateCompose',
    '__CreateComputation',
    '__CreateElement',
    '__CreateElementTemplate',
    '__CreateElementWithProperties',
    '__CreateEvent',
    '__CreateFrame',
    '__CreateImage',
    '__CreateList',
    '__CreateMemo',
    '__CreateNonElement',
    '__CreatePage',
    '__CreateRawText',
    '__CreateScope',
    '__CreateScrollView',
    '__CreateSignal',
    '__CreateText',
    '__CreateTypedElementTemplate',
    '__CreateView',
    '__CreateWrapperElement',
    '__DispatchEvent',
    '__ElementAnimate',
    '__ElementFromBinary',
    '__ElementIsEqual',
    '__FirstElement',
    '__FlushElementTree',
    '__GetAttributeByName',
    '__GetAttributeNames',
    '__GetAttributes',
    '__GetChildren',
    '__GetClasses',
    '__GetComponentID',
    '__GetComposeContentElement',
    '__GetComposeMountElement',
    '__GetComputedStyleByKey',
    '__GetConfig',
    '__GetDataByKey',
    '__GetDataset',
    '__GetDiffData',
    '__GetElementByAttrSlot',
    '__GetElementByUniqueID',
    '__GetElementUniqueID',
    '__GetEvent',
    '__GetEvents',
    '__GetID',
    '__GetInlineStyle',
    '__GetInlineStyles',
    '__GetPageElement',
    '__GetParent',
    '__GetScope',
    '__GetTag',
    '__GetTemplateParts',
    '__InsertElementAt',
    '__InsertElementBefore',
    '__InsertNodeToElementTemplate',
    '__InvalidateElement',
    '__InvalidateLayout',
    '__InvokeMethod',
    '__InvokeUIMethod',
    '__IsPartElement',
    '__IsTemplateElement',
    '__LastElement',
    '__LoadLepusChunk',
    '__LoadStyleSheet',
    '__MarkAsyncFlushRoot',
    '__MarkPartElement',
    '__MarkTemplateElement',
    '__MeasureElement',
    '__MeasureTextElement',
    '__MoveElements',
    '__NextElement',
    '__OnCleanUp',
    '__OnLifecycleEvent',
    '__PlaceElement',
    '__QueryComponent',
    '__QuerySelector',
    '__QuerySelectorAll',
    '__ReadSignal',
    '__RemoveElement',
    '__RemoveElementsAt',
    '__RemoveEventListener',
    '__RemoveEventListeners',
    '__RemoveGestureDetector',
    '__RemoveNodeFromElementTemplate',
    '__RemoveStyleSheet',
    '__ReplaceElement',
    '__ReplaceElements',
    '__ReplaceStyleSheets',
    '__ResolveElementSubtree',
    '__RunUpdates',
    '__SerializeElementTemplate',
    '__SetAttribute',
    '__SetAttributeOfElementTemplate',
    '__SetCSSId',
    '__SetClasses',
    '__SetComposeModifier',
    '__SetConfig',
    '__SetCustomLayout',
    '__SetDataset',
    '__SetEvents',
    '__SetGestureDetector',
    '__SetGestureState',
    '__SetID',
    '__SetInlineStyles',
    '__SetListItemInfoOfTemplate',
    '__StopImmediatePropagation',
    '__StopPropagation',
    '__SwapElement',
    '__UnTrack',
    '__UpdateComponentID',
    '__UpdateComponentInfo',
    '__UpdateListCallbacks',
    '__WriteSignal'
]);
const ALLOWED_BACKGROUND_WRAPPER_PARAMS = new Set([
    'NativeModules',
    'cancelAnimationFrame',
    'clearInterval',
    'clearTimeout',
    'console',
    'fetch',
    'lynx',
    'requestAnimationFrame',
    'setInterval',
    'setTimeout'
]);
const BACKGROUND_GLOBAL_OBJECT_EXTRAS = new Set([
    'SystemInfo',
    'console'
]);
const BACKGROUND_ONLY_IDENTIFIERS = new Set([
    'NativeModules',
    'fetch'
]);
const MAIN_BUILTIN_GLOBALS = new Set([
    ...ECMASCRIPT_GLOBALS,
    ...MAIN_RUNTIME_GLOBALS,
    ...MAIN_THREAD_ELEMENT_PAPI_GLOBALS
]);
const BACKGROUND_GLOBAL_THIS_BUILTINS = new Set([
    ...ECMASCRIPT_GLOBALS,
    ...BACKGROUND_GLOBAL_OBJECT_EXTRAS
]);
const OBJECT_PROTOTYPE_PROPERTIES = new Set(Object.getOwnPropertyNames(Object.prototype));
const TIMING_PIPELINE_GLOBAL_HINT = 'Timing pipeline helpers are mounted on `lynx.performance` (for example `lynx.performance._generatePipelineOptions()`), not as bare `__*` globals.';
const GLOBAL_HINTS = {
    Atomics: '`Atomics` and `SharedArrayBuffer` are not built into Lynx runtimes by default.',
    Buffer: 'Node.js `Buffer` does not exist in Lynx. Use `Uint8Array`, `ArrayBuffer`, or `DataView`.',
    Float16Array: '`Float16Array` is not built into Lynx QuickJS/PrimJS runtimes; use `Float32Array` or `Float64Array`.',
    Image: 'Browser `Image` constructor does not exist in Lynx. Use `__CreateImage(pageId)` on the main thread.',
    Intl: 'Lynx does not build in `Intl` by default; format numbers/dates in JS or load an explicit helper.',
    Iterator: 'Global `Iterator` helpers are not built into Lynx QuickJS/PrimJS runtimes; iterate with standard loops or `Array.from(...)`.',
    LynxJSBI: '`LynxJSBI` is an internal runtime wrapper helper, not a supported `.lynxml` global; use standard `BigInt`.',
    React: 'ReactLynx is not available in Vanilla Lynx `.lynxml` artifacts; use Element PAPI directly.',
    SharedArrayBuffer: '`SharedArrayBuffer` and `Atomics` are not built into Lynx runtimes by default.',
    TextCodecHelper: '`TextCodecHelper` is not part of the portable `.lynxml` global allowlist; pass strings directly or handle UTF-8 bytes in JS (`Uint8Array`) or host `NativeModules`.',
    TextDecoder: "`TextDecoder` is not a supported Lynx global in `.lynxml` scripts; decode text via `fetch` response `.text()` / `.json()`, plain JS (`Uint8Array`), or host `NativeModules`.",
    TextEncoder: "`TextEncoder` is not a supported Lynx global in `.lynxml` scripts; pass strings directly or encode UTF-8 bytes in JS (`Uint8Array`) or host `NativeModules`.",
    WebSocket: '`WebSocket` is undefined in Lynx; use `fetch` or host `NativeModules` in `<script thread="background">`.',
    XMLHttpRequest: '`XMLHttpRequest` is undefined in Lynx; use `fetch` in `<script thread="background">`.',
    __AddTimingListener: TIMING_PIPELINE_GLOBAL_HINT,
    __BindPipelineIDWithTimingFlag: TIMING_PIPELINE_GLOBAL_HINT,
    __CreateGestureDetector: '`__CreateGestureDetector` is a legacy Radon global not registered on the Fiber main thread; use `__SetGestureDetector` / `__RemoveGestureDetector`.',
    __GeneratePipelineOptions: TIMING_PIPELINE_GLOBAL_HINT,
    __MarkTiming: TIMING_PIPELINE_GLOBAL_HINT,
    __OnPipelineStart: TIMING_PIPELINE_GLOBAL_HINT,
    __SetStaticStyle: '`__SetStaticStyle` is a legacy Radon global not registered on the Fiber main thread; use `__AddInlineStyle` or `__SetInlineStyles`.',
    document: '`document` is undefined in Lynx. Create and mutate UI nodes in `<script thread="main">` with Element PAPI (`__CreatePage`, `__CreateView`, `__CreateText`, etc.).',
    exports: "CommonJS `exports` is not part of raw `.lynxml` scripts; load external bundles with `lynx.fetchBundle()` and `lynx.loadScript()`.",
    getElementById: 'Bare `getElementById` is not installed as a global; use `lynx.getElementById(id)` on `<script thread="background">` or Element PAPI handles on `<script thread="main">`.',
    getNapiLoader: 'Bare `getNapiLoader` is not available in isolated page contexts; use `lynx.getNapiLoader()` on `<script thread="background">`.',
    global: '`global` is undefined in Lynx; use `globalThis` for global scope or `lynx` / `SystemInfo` for runtime APIs.',
    localStorage: '`localStorage` is undefined in Lynx; use `lynx.setSessionStorageItem` / `lynx.getSessionStorageItem` or host `NativeModules`.',
    module: "CommonJS `module` is not part of raw `.lynxml` scripts; load external bundles with `lynx.fetchBundle()` and `lynx.loadScript()`.",
    navigator: '`navigator` is undefined in Lynx; read platform/device metadata from `SystemInfo`.',
    performance: '`performance` is not a Lynx global. Use either `Date.now()` or the `requestAnimationFrame` callback timestamp consistently (without mixing the two), or `lynx.performance` for trace/timing observation (it has no `.now()`).',
    process: 'Node.js `process` is not a Lynx global.',
    processData: 'Define `processData` on `globalThis` (for example `Object.assign(globalThis, { processData(data) { ... } })`) in `<script thread="main">` before calling it.',
    queueMicrotask: 'Global `queueMicrotask` is not defined across Lynx runtimes; use `Promise.resolve().then(...)` (or `lynx.queueMicrotask(...)` on the background thread).',
    require: "CommonJS `require` is not supported in `.lynxml` scripts; load external background bundles with `lynx.fetchBundle()` and `lynx.loadScript()`.",
    self: '`self` is undefined in Lynx; use `globalThis`.',
    window: '`window` is undefined in Lynx; use `globalThis` for global scope or `lynx` / `SystemInfo` for runtime APIs.'
};
function isASCIIWhitespace(ch) {
    return ' ' === ch || '\t' === ch || '\n' === ch || '\r' === ch || '\f' === ch;
}
function isASCIIAlpha(ch) {
    return ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z';
}
function isLynxmlNameChar(ch) {
    return isASCIIAlpha(ch) || ch >= '0' && ch <= '9' || '-' === ch;
}
function trimASCIIWhitespace(value) {
    let start = 0;
    let end = value.length;
    while(start < end && isASCIIWhitespace(value[start]))start += 1;
    while(end > start && isASCIIWhitespace(value[end - 1]))end -= 1;
    return value.slice(start, end);
}
function findASCIIWhitespace(value) {
    for(let i = 0; i < value.length; i += 1)if (isASCIIWhitespace(value[i])) return i;
    return -1;
}
function isOpeningTag(source, position, tagName) {
    if (position >= source.length || '<' !== source[position] || !source.startsWith(tagName, position + 1)) return false;
    const boundary = position + tagName.length + 1;
    return boundary < source.length && ('>' === source[boundary] || isASCIIWhitespace(source[boundary]));
}
function findStartTagEnd(source, tagStart) {
    let quote = null;
    for(let i = tagStart + 1; i < source.length; i += 1){
        const ch = source[i];
        if (null !== quote) {
            if (ch === quote) quote = null;
            continue;
        }
        if ('"' === ch || "'" === ch) {
            quote = ch;
            continue;
        }
        if ('>' === ch) return i;
    }
    return -1;
}
function endTagLengthAt(source, position, tagName) {
    if (!source.startsWith(END_TAG_START, position)) return null;
    let cursor = position + END_TAG_START.length;
    if (!source.startsWith(tagName, cursor)) return null;
    cursor += tagName.length;
    if (cursor >= source.length || !isASCIIWhitespace(source[cursor]) && '>' !== source[cursor]) return null;
    while(cursor < source.length && isASCIIWhitespace(source[cursor]))cursor += 1;
    if (cursor >= source.length || '>' !== source[cursor]) return null;
    return cursor + 1 - position;
}
function findRawTextEndTag(source, startOffset, tagName) {
    let search = startOffset;
    while(search < source.length){
        const candidate = source.indexOf('<', search);
        if (-1 === candidate) break;
        const length = endTagLengthAt(source, candidate, tagName);
        if (null !== length) return {
            start: candidate,
            length
        };
        search = candidate + 1;
    }
    return null;
}
function isQuotedAttribute(attributes, attributeName, expectedValue) {
    if (0 === attributes.length || !attributes.startsWith(attributeName)) return false;
    let rest = trimASCIIWhitespace(attributes.slice(attributeName.length));
    if (0 === rest.length || '=' !== rest[0]) return false;
    rest = trimASCIIWhitespace(rest.slice(1));
    const quote = rest[0];
    if (rest.length < 3 || '"' !== quote && "'" !== quote) return false;
    const closingQuote = rest.indexOf(quote, 1);
    if (closingQuote !== rest.length - 1 || closingQuote <= 1) return false;
    return void 0 === expectedValue || rest.slice(1, closingQuote) === expectedValue;
}
function buildLineStarts(source) {
    const starts = [
        0
    ];
    for(let i = 0; i < source.length; i += 1)if ('\n' === source[i]) starts.push(i + 1);
    return starts;
}
function offsetToLineColumn(lineStarts, sourceLength, rawOffset) {
    const offset = Math.max(0, Math.min(rawOffset, sourceLength));
    let low = 0;
    let high = lineStarts.length - 1;
    while(low < high){
        const mid = Math.ceil((low + high) / 2);
        if ((lineStarts[mid] ?? 0) <= offset) low = mid;
        else high = mid - 1;
    }
    const lineStart = lineStarts[low] ?? 0;
    return {
        line: low + 1,
        column: offset - lineStart + 1
    };
}
function parseEnvelope(source, lineStarts, issues) {
    const addEnvelopeError = (offset, message, hint)=>{
        const { line, column } = offsetToLineColumn(lineStarts, source.length, offset);
        const issue = {
            line,
            column,
            code: 'envelope-error',
            message
        };
        if (void 0 !== hint) issue.hint = hint;
        issues.push(issue);
        return null;
    };
    let position = source.startsWith(UTF8_BOM) ? UTF8_BOM.length : 0;
    const consumeIgnorable = ()=>{
        for(;;){
            while(position < source.length && isASCIIWhitespace(source[position]))position += 1;
            if (!source.startsWith(COMMENT_START, position)) return true;
            const commentEnd = source.indexOf(COMMENT_END, position + COMMENT_START.length);
            if (-1 === commentEnd) {
                addEnvelopeError(position, 'Unterminated XML comment.');
                return false;
            }
            position = commentEnd + COMMENT_END.length;
        }
    };
    let probe = position;
    while(probe < source.length && isASCIIWhitespace(source[probe]))probe += 1;
    if (source.startsWith('<?xml', probe) || source.startsWith('<?XML', probe)) return addEnvelopeError(probe, 'XML declarations (`<?xml ...?>`) are not allowed in `.lynxml`.', 'Start the document directly with `<!doctype lynx>`.');
    if (!source.startsWith(LYNX_DOCTYPE, position)) return addEnvelopeError(position, 'Document must start with exact `<!doctype lynx>`.', 'Remove leading whitespace or non-Lynx doctype declarations before `<!doctype lynx>`.');
    position += LYNX_DOCTYPE.length;
    if (!consumeIgnorable()) return null;
    if (!isOpeningTag(source, position, 'lynx')) return addEnvelopeError(position, 'Expected lowercase `<lynx engine-version="...">` root element after `<!doctype lynx>`.');
    const rootOpenEnd = findStartTagEnd(source, position);
    if (-1 === rootOpenEnd) return addEnvelopeError(position, 'Unterminated `<lynx>` opening tag.');
    const rootTagBody = trimASCIIWhitespace(source.slice(position + 1, rootOpenEnd));
    const rootNameEnd = findASCIIWhitespace(rootTagBody);
    const rootAttrs = -1 === rootNameEnd ? '' : trimASCIIWhitespace(rootTagBody.slice(rootNameEnd));
    if (rootAttrs.endsWith('/')) return addEnvelopeError(position, 'Self-closing tags (`/>`) are not supported in `.lynxml`.');
    if (!isQuotedAttribute(rootAttrs, 'engine-version')) return addEnvelopeError(position, '`<lynx>` requires exactly one non-empty quoted `engine-version` attribute.');
    position = rootOpenEnd + 1;
    let style;
    let mainScript;
    let backgroundScript;
    let maxRankSeen = -1;
    let lastClosedTagName;
    let rootClosed = false;
    for(;;){
        if (!consumeIgnorable()) return null;
        const lynxEndLen = endTagLengthAt(source, position, 'lynx');
        if (null !== lynxEndLen) {
            if (7 !== lynxEndLen) return addEnvelopeError(position, 'Closing tag `</lynx>` must not contain whitespace before `>`; write exact `</lynx>`.');
            position += lynxEndLen;
            rootClosed = true;
            break;
        }
        if (position >= source.length) break;
        if ('<' !== source[position]) {
            const hasLaterClose = void 0 !== lastClosedTagName && null !== findRawTextEndTag(source, position, lastClosedTagName);
            return addEnvelopeError(position, "Unexpected text content outside `<style>` and `<script>` blocks.", hasLaterClose ? `A source block cannot contain a literal \`</${lastClosedTagName}>\` closing tag (including optional whitespace before \`>\`), even inside strings or comments.` : void 0);
        }
        const sectionStart = position;
        const tagEnd = findStartTagEnd(source, position);
        if (-1 === tagEnd) return addEnvelopeError(sectionStart, 'Unterminated opening tag.');
        if (source.startsWith(END_TAG_START, sectionStart)) {
            const rawClose = trimASCIIWhitespace(source.slice(sectionStart + 1, tagEnd));
            return addEnvelopeError(sectionStart, `Unexpected closing tag \`<${rawClose}>\` inside \`<lynx>\`.`);
        }
        if (source.startsWith('<!', sectionStart) || source.startsWith('<?', sectionStart)) return addEnvelopeError(sectionStart, "Expected `<style>` or `<script>` start tag inside `<lynx>`.");
        const nameStart = sectionStart + 1;
        let nameEndPos = nameStart;
        while(nameEndPos < tagEnd && isLynxmlNameChar(source[nameEndPos]))nameEndPos += 1;
        if (nameEndPos === nameStart || !isASCIIAlpha(source[nameStart])) return addEnvelopeError(sectionStart, 'Invalid element start tag inside `<lynx>`: tag name must start immediately after `<` with an ASCII letter.');
        const tagName = source.slice(nameStart, nameEndPos);
        if (nameEndPos < tagEnd && !isASCIIWhitespace(source[nameEndPos])) {
            if (source.startsWith('/>', nameEndPos)) return addEnvelopeError(sectionStart, 'Self-closing tags (`/>`) are not supported in `.lynxml`.');
            return addEnvelopeError(sectionStart, `Invalid start tag \`<${tagName}>\` inside \`<lynx>\`: expected whitespace before attributes.`);
        }
        const attrs = trimASCIIWhitespace(source.slice(nameEndPos, tagEnd));
        if (attrs.endsWith('/')) return addEnvelopeError(sectionStart, 'Self-closing tags (`/>`) are not supported in `.lynxml`.');
        const rawTag = trimASCIIWhitespace(source.slice(nameStart, tagEnd));
        let rawSectionTag;
        let rank;
        if ('style' === tagName) {
            if (0 !== attrs.length) return addEnvelopeError(sectionStart, '`<style>` does not accept attributes.');
            if (void 0 !== style) return addEnvelopeError(sectionStart, 'Duplicate `<style>` block.');
            rank = 0;
            rawSectionTag = 'style';
        } else {
            if ("script" !== tagName) return addEnvelopeError(sectionStart, `Unsupported top-level element \`<${tagName}>\` inside \`<lynx>\`.`, 'Do not place `<config>` or UI markup in `<lynx>`; create UI nodes with Element PAPI in `<script thread="main">`.');
            rawSectionTag = "script";
            if (isQuotedAttribute(attrs, 'thread', 'main')) {
                if (void 0 !== mainScript) return addEnvelopeError(sectionStart, 'Duplicate `<script thread="main">` block.');
                rank = 1;
            } else {
                if (!isQuotedAttribute(attrs, 'thread', 'background')) return addEnvelopeError(sectionStart, '`<script>` requires exactly one quoted `thread="main"` or `thread="background"` attribute.');
                if (void 0 !== backgroundScript) return addEnvelopeError(sectionStart, 'Duplicate `<script thread="background">` block.');
                rank = 2;
            }
        }
        if (rank < maxRankSeen) return addEnvelopeError(sectionStart, `Out-of-order \`<${rawTag}>\` block inside \`<lynx>\`.`, 'Use canonical block order: optional `<style>`, required `<script thread="main">`, then optional `<script thread="background">`.');
        maxRankSeen = rank;
        const contentStart = tagEnd + 1;
        const endTag = findRawTextEndTag(source, contentStart, rawSectionTag);
        if (null === endTag) return addEnvelopeError(sectionStart, `Missing closing tag \`</${rawSectionTag}>\`.`);
        if (endTag.length !== END_TAG_START.length + rawSectionTag.length + 1) {
            const hasLaterClose = null !== findRawTextEndTag(source, endTag.start + endTag.length, rawSectionTag);
            return addEnvelopeError(endTag.start, `Closing tag \`</${rawSectionTag}>\` must not contain whitespace before \`>\`; write exact \`</${rawSectionTag}>\`.`, hasLaterClose ? `A source block cannot contain a literal \`</${rawSectionTag}>\` closing tag (including optional whitespace before \`>\`), even inside strings or comments.` : void 0);
        }
        const content = source.slice(contentStart, endTag.start);
        if (trimASCIIWhitespace(content).startsWith(CDATA_START)) return addEnvelopeError(contentStart, 'CDATA sections (`<![CDATA[`) are not supported in `.lynxml`.', 'Keep CSS and JavaScript source text raw without CDATA or XML escaping.');
        const section = {
            content,
            contentStart
        };
        if (0 === rank) style = section;
        else if (1 === rank) mainScript = section;
        else backgroundScript = section;
        lastClosedTagName = rawSectionTag;
        position = endTag.start + endTag.length;
    }
    if (!rootClosed) return addEnvelopeError(position, 'Missing closing tag `</lynx>`.');
    if (!consumeIgnorable()) return null;
    if (position !== source.length) return addEnvelopeError(position, 'Unexpected content after `</lynx>`.');
    if (void 0 === mainScript) return addEnvelopeError(position, 'Missing required `<script thread="main">` block.');
    if (0 === trimASCIIWhitespace(mainScript.content).length) return addEnvelopeError(mainScript.contentStart, '`<script thread="main">` must not be empty.', 'Create the page root with `__CreatePage("0", 0)` and render initial UI in `<script thread="main">`.');
    return {
        style,
        mainScript,
        backgroundScript
    };
}
function isAstNode(value) {
    return 'object' == typeof value && null !== value && 'string' == typeof value.type && 'number' == typeof value.start && 'number' == typeof value.end;
}
function forEachChildAstNode(node, callback) {
    for (const [key, value] of Object.entries(node))if ('range' !== key && 'loc' !== key) {
        if (Array.isArray(value)) {
            for (const item of value)if (isAstNode(item)) callback(item);
        } else if (isAstNode(value)) callback(value);
    }
}
function unwrapExpression(node) {
    let current = node ?? null;
    while(null !== current && ('ParenthesizedExpression' === current.type || 'ChainExpression' === current.type))current = current.expression ?? null;
    return current;
}
function isFunctionBoundary(node) {
    return 'FunctionDeclaration' === node.type || 'FunctionExpression' === node.type || 'ArrowFunctionExpression' === node.type;
}
function extractStaticString(node) {
    const unwrapped = unwrapExpression(node);
    if (null === unwrapped) return null;
    if ('Literal' === unwrapped.type && 'string' == typeof unwrapped.value) return unwrapped.value;
    if ('TemplateLiteral' === unwrapped.type && (unwrapped.expressions?.length ?? 0) === 0 && (unwrapped.quasis?.length ?? 0) === 1) {
        const quasi = unwrapped.quasis?.[0];
        return quasi ? quasi.value.cooked ?? quasi.value.raw : null;
    }
    return null;
}
function extractStaticMemberProperty(memberNode) {
    if ('MemberExpression' !== memberNode.type || !memberNode.property) return null;
    if (!memberNode.computed) return 'Identifier' === memberNode.property.type ? memberNode.property.name ?? null : null;
    return extractStaticString(memberNode.property);
}
function extractStaticObjectPropertyKey(propNode) {
    if ('Property' !== propNode.type || !propNode.key) return null;
    if (!propNode.computed && 'Identifier' === propNode.key.type) return propNode.key.name ?? null;
    return extractStaticString(propNode.key);
}
function classifyDisallowedGlobal(name, thread, viaGlobalThis = false) {
    const displaySymbol = viaGlobalThis ? `globalThis.${name}` : name;
    if (FORBIDDEN_MAIN_THREAD_APIS.has(name)) {
        if ('main' === thread) return {
            code: 'forbidden-api',
            message: `\`${displaySymbol}\` is a compiler-only or legacy Element PAPI global and must not be used in Vanilla Lynx.`,
            hint: 'Use `__AddEventListener`, `__SetInlineStyles`, and imperative JS loops/conditionals with `__ReplaceElements` instead.'
        };
        return {
            code: 'wrong-thread-global',
            message: `\`${displaySymbol}\` is a main-thread-only API (and compiler-only/legacy) and cannot be used in \`<script thread="background">\`.`,
            hint: 'Keep UI tree creation and mutation in `<script thread="main">`, and send serializable patches from the background thread.'
        };
    }
    if ('background' === thread && MAIN_THREAD_ELEMENT_PAPI_GLOBALS.has(name)) return {
        code: 'wrong-thread-global',
        message: `\`${displaySymbol}\` is a main-thread Element PAPI global and cannot be called in \`<script thread="background">\`.`,
        hint: 'Dispatch a serializable patch via `lynx.getCoreContext().dispatchEvent(...)` and apply Element PAPI mutations in `<script thread="main">`.'
    };
    if ('main' === thread && BACKGROUND_ONLY_IDENTIFIERS.has(name)) return {
        code: 'wrong-thread-global',
        message: `\`${displaySymbol}\` is only available in \`<script thread="background">\`, not \`<script thread="main">\`.`,
        hint: 'Move async requests, `fetch`, and `NativeModules` calls to `<script thread="background">` and pass serializable results to the main thread.'
    };
    if ('background' === thread && viaGlobalThis && ALLOWED_BACKGROUND_WRAPPER_PARAMS.has(name) && !BACKGROUND_GLOBAL_THIS_BUILTINS.has(name)) return {
        code: 'undeclared-global',
        message: `\`${displaySymbol}\` is not defined on \`<script thread="background">\`; \`${name}\` is injected as an \`app-service.js\` wrapper parameter rather than a \`globalThis\` property.`,
        hint: `Reference \`${name}\` directly as a bare identifier in \`<script thread="background">\`.`
    };
    const hint = GLOBAL_HINTS[name];
    const result = {
        code: 'undeclared-global',
        message: `\`${displaySymbol}\` is not a declared identifier or supported Lynx global in \`<script thread="${thread}">\`.`
    };
    if (void 0 !== hint) result.hint = hint;
    return result;
}
function hasEsmImportOrExport(programNode) {
    const body = Array.isArray(programNode.body) ? programNode.body : [];
    return body.some((stmt)=>'ImportDeclaration' === stmt.type || 'ExportNamedDeclaration' === stmt.type || 'ExportDefaultDeclaration' === stmt.type || 'ExportAllDeclaration' === stmt.type);
}
function reportSyntaxFailure(error, section, localOffsetAdjust, thread, lineStarts, sourceLength, issues) {
    const syntaxError = error;
    const rawPos = 'number' == typeof syntaxError.pos ? syntaxError.pos : 0;
    const clampedLocal = Math.max(0, Math.min(rawPos + localOffsetAdjust, section.content.length));
    const { line, column } = offsetToLineColumn(lineStarts, sourceLength, section.contentStart + clampedLocal);
    const rawMessage = (syntaxError.message ?? 'JavaScript syntax error').replace(/\s*\(\d+:\d+\)$/, '');
    const redeclaredMatch = /^Identifier '([^']+)' has already been declared$/.exec(rawMessage);
    if (null === redeclaredMatch) try {
        const moduleAst = acorn_parse(section.content, {
            ecmaVersion: 'latest',
            sourceType: 'module'
        });
        if (hasEsmImportOrExport(moduleAst)) return void issues.push({
            line,
            column,
            code: 'unsupported-syntax',
            thread,
            message: `ESM \`import\`/\`export\` syntax is not supported in raw \`.lynxml\` \`<script thread="${thread}">\`: ${rawMessage}.`,
            hint: "Write classic script statements in `.lynxml`, or build external background modules separately and load them with `lynx.fetchBundle()` + `lynx.loadScript()`."
        });
    } catch  {}
    const collidedParam = redeclaredMatch?.[1];
    const issue = {
        line,
        column,
        code: 'syntax-error',
        thread,
        message: `JavaScript syntax error in \`<script thread="${thread}">\`: ${rawMessage}.`
    };
    if ('background' === thread && void 0 !== collidedParam && BACKGROUND_WRAPPER_PARAM_SET.has(collidedParam)) {
        issue.symbol = collidedParam;
        issue.hint = `\`<script thread="background">\` executes inside Lynx's \`app-service.js\` factory function where \`${collidedParam}\` is already a formal parameter; rename this top-level lexical binding or scope it inside a block/function.`;
    }
    issues.push(issue);
}
function analyzeScriptSection(section, thread, lineStarts, sourceLength, issues) {
    let program;
    let offsetAdjust = 0;
    let userStart = 0;
    let userEnd = section.content.length;
    if ('background' === thread) {
        const wrappedSource = `${BACKGROUND_WRAPPER_PREFIX}${section.content}${BACKGROUND_WRAPPER_SUFFIX}`;
        try {
            program = acorn_parse(wrappedSource, {
                ecmaVersion: 'latest',
                sourceType: "script",
                ranges: true
            });
        } catch (error) {
            reportSyntaxFailure(error, section, -BACKGROUND_WRAPPER_PREFIX.length, thread, lineStarts, sourceLength, issues);
            return;
        }
        const topBody = Array.isArray(program.body) ? program.body : [];
        const candidateFn = 1 === topBody.length ? unwrapExpression(topBody[0]?.expression) : null;
        const candidateBlock = candidateFn?.type === 'FunctionExpression' && isAstNode(candidateFn.body) ? candidateFn.body : null;
        const expectedBlockStart = BACKGROUND_WRAPPER_PREFIX.length - 2;
        const expectedBlockEnd = BACKGROUND_WRAPPER_PREFIX.length + section.content.length + 2;
        if (null === candidateBlock || candidateBlock.start !== expectedBlockStart || candidateBlock.end !== expectedBlockEnd) {
            try {
                acorn_parse(section.content, {
                    ecmaVersion: 'latest',
                    sourceType: "script",
                    allowReturnOutsideFunction: true
                });
            } catch (standaloneError) {
                reportSyntaxFailure(standaloneError, section, 0, thread, lineStarts, sourceLength, issues);
                return;
            }
            const prematureEnd = null !== candidateBlock ? candidateBlock.end - 1 - BACKGROUND_WRAPPER_PREFIX.length : 0;
            const { line, column } = offsetToLineColumn(lineStarts, sourceLength, section.contentStart + Math.max(0, Math.min(prematureEnd, section.content.length)));
            issues.push({
                line,
                column,
                code: 'syntax-error',
                thread,
                message: 'JavaScript syntax error in `<script thread="background">`: unbalanced closing brace `}`.'
            });
            return;
        }
        offsetAdjust = -BACKGROUND_WRAPPER_PREFIX.length;
        userStart = BACKGROUND_WRAPPER_PREFIX.length;
        userEnd = BACKGROUND_WRAPPER_PREFIX.length + section.content.length;
    } else try {
        program = acorn_parse(section.content, {
            ecmaVersion: 'latest',
            sourceType: "script",
            ranges: true
        });
    } catch (error) {
        reportSyntaxFailure(error, section, 0, thread, lineStarts, sourceLength, issues);
        return;
    }
    const scopeManager = analyze(program, {
        ecmaVersion: 2025,
        sourceType: "script",
        optimistic: true
    });
    let wrapperFnNode = null;
    let wrapperScope = null;
    if ('background' === thread) {
        const firstStmt = Array.isArray(program.body) ? program.body[0] : void 0;
        wrapperFnNode = unwrapExpression(firstStmt?.expression);
        if (null !== wrapperFnNode) wrapperScope = scopeManager.acquire(wrapperFnNode);
    }
    const isUserAstNode = (node)=>node.start >= userStart && node.end <= userEnd;
    const referenceByIdentifier = new Map();
    for (const scope of scopeManager.scopes)for (const ref of scope.references){
        const idNode = ref.identifier;
        if (isUserAstNode(idNode)) referenceByIdentifier.set(idNode, ref);
    }
    const parentByNode = new Map();
    const buildParents = (node)=>{
        forEachChildAstNode(node, (child)=>{
            parentByNode.set(child, node);
            buildParents(child);
        });
    };
    buildParents(program);
    const isEagerlyInside = (node, container)=>{
        if (!container) return false;
        let current = node;
        while(void 0 !== current){
            if (current === container) return true;
            if (isFunctionBoundary(current)) break;
            current = parentByNode.get(current);
        }
        return false;
    };
    const findEnclosingThisOwner = (thisNode)=>{
        let child = thisNode;
        let parent = parentByNode.get(child);
        while(void 0 !== parent){
            if ('FunctionDeclaration' === parent.type || 'FunctionExpression' === parent.type || 'StaticBlock' === parent.type || 'Program' === parent.type) return parent;
            if ('PropertyDefinition' === parent.type && parent.value === child) return parent;
            child = parent;
            parent = parentByNode.get(child);
        }
        return null;
    };
    const isUnshadowedGlobal = (expr, expectedName)=>{
        const unwrapped = unwrapExpression(expr);
        if (null === unwrapped || 'Identifier' !== unwrapped.type || unwrapped.name !== expectedName) return false;
        const ref = referenceByIdentifier.get(unwrapped);
        return void 0 !== ref && null === ref.resolved;
    };
    const isGlobalThis = (expr, visited = new Set())=>{
        const unwrapped = unwrapExpression(expr);
        if (null === unwrapped || visited.has(unwrapped)) return false;
        if ('ThisExpression' === unwrapped.type) return 'main' === thread && findEnclosingThisOwner(unwrapped) === program;
        if (isUnshadowedGlobal(unwrapped, 'globalThis')) return true;
        if ('MemberExpression' === unwrapped.type && 'globalThis' === extractStaticMemberProperty(unwrapped)) {
            const nextVisited = new Set(visited);
            nextVisited.add(unwrapped);
            return isGlobalThis(unwrapped.object, nextVisited);
        }
        if ('Identifier' === unwrapped.type) {
            const ref = referenceByIdentifier.get(unwrapped);
            const def = ref?.resolved?.defs.length === 1 ? ref.resolved.defs[0] : void 0;
            const declarator = def?.node;
            if (def?.type === 'Variable' && def.parent?.kind === 'const' && declarator?.type === 'VariableDeclarator' && declarator.id === def.name) {
                const nextVisited = new Set(visited);
                nextVisited.add(unwrapped);
                return isGlobalThis(declarator.init, nextVisited);
            }
        }
        return false;
    };
    const sectionIssues = [];
    const reportAtNode = (node, code, message, symbol, hint)=>{
        const localOffset = Math.max(0, Math.min(node.start + offsetAdjust, section.content.length));
        const { line, column } = offsetToLineColumn(lineStarts, sourceLength, section.contentStart + localOffset);
        const issue = {
            line,
            column,
            code,
            thread,
            message
        };
        if (void 0 !== symbol) issue.symbol = symbol;
        if (void 0 !== hint) issue.hint = hint;
        sectionIssues.push(issue);
    };
    const customGlobalDefs = new Map();
    const writeMemberNodes = new Set();
    const registerCustomGlobal = (propName, eagerRhsGuard)=>{
        if (FORBIDDEN_MAIN_THREAD_APIS.has(propName)) return;
        let list = customGlobalDefs.get(propName);
        if (!list) {
            list = [];
            customGlobalDefs.set(propName, list);
        }
        list.push(eagerRhsGuard);
    };
    const reportOrRegisterGlobalWrite = (reportNode, propName, viaGlobalThis, eagerRhsGuard)=>{
        if (FORBIDDEN_MAIN_THREAD_APIS.has(propName)) {
            const classification = classifyDisallowedGlobal(propName, thread, viaGlobalThis);
            reportAtNode(reportNode, classification.code, classification.message, propName, classification.hint);
            return;
        }
        registerCustomGlobal(propName, eagerRhsGuard);
    };
    if ('main' === thread) {
        for (const variable of scopeManager.globalScope.variables)for (const def of variable.defs)if ('FunctionName' === def.type || 'Variable' === def.type && def.parent?.kind === 'var') reportOrRegisterGlobalWrite(def.node, variable.name, false);
    }
    const collectGlobalDefinitions = (node)=>{
        if (isUserAstNode(node)) {
            if ('AssignmentExpression' === node.type && ('=' === node.operator || '??=' === node.operator || '||=' === node.operator)) {
                const lhs = unwrapExpression(node.left);
                if (lhs?.type === 'MemberExpression') {
                    if ('=' === node.operator) writeMemberNodes.add(lhs);
                    if (isGlobalThis(lhs.object)) {
                        const propName = extractStaticMemberProperty(lhs);
                        if (null !== propName) {
                            writeMemberNodes.add(lhs);
                            reportOrRegisterGlobalWrite(lhs, propName, true, node.right);
                        }
                    }
                }
            } else if ('CallExpression' === node.type) {
                const callee = unwrapExpression(node.callee);
                const args = node.arguments ?? [];
                if (callee?.type === 'MemberExpression' && isUnshadowedGlobal(callee.object, 'Object') && args.length >= 2 && isGlobalThis(args[0])) {
                    const method = extractStaticMemberProperty(callee);
                    if ('assign' === method) for (const sourceArg of args.slice(1)){
                        const obj = unwrapExpression(sourceArg);
                        if (obj?.type === 'ObjectExpression') for (const prop of obj.properties ?? []){
                            const keyName = extractStaticObjectPropertyKey(prop);
                            if (null !== keyName) reportOrRegisterGlobalWrite(node, keyName, true, prop.value);
                        }
                    }
                    else if ('defineProperty' === method && args.length >= 3) {
                        const keyName = extractStaticString(args[1]);
                        if (null !== keyName) reportOrRegisterGlobalWrite(node, keyName, true, args[2]);
                    }
                }
            }
        }
        forEachChildAstNode(node, collectGlobalDefinitions);
    };
    collectGlobalDefinitions(program);
    const isCustomGlobalDefinedForRead = (propName, readNode)=>{
        const guards = customGlobalDefs.get(propName);
        if (!guards) return false;
        return guards.some((guard)=>!isEagerlyInside(readNode, guard));
    };
    const isWrapperParamUserInitialized = (variable, readNode)=>{
        for (const def of variable.defs){
            const defNode = def.node;
            if (defNode !== wrapperFnNode && isUserAstNode(defNode)) {
                if ('FunctionName' === def.type) return true;
                if ('Variable' === def.type) {
                    if ('VariableDeclarator' === defNode.type && null != defNode.init && !isEagerlyInside(readNode, defNode.init)) return true;
                    const varDecl = parentByNode.get(defNode);
                    const loopStmt = varDecl ? parentByNode.get(varDecl) : void 0;
                    if ((loopStmt?.type === 'ForInStatement' || loopStmt?.type === 'ForOfStatement') && loopStmt.left === varDecl && !isEagerlyInside(readNode, loopStmt.right)) return true;
                }
            }
        }
        for (const varRef of variable.references){
            const refId = varRef.identifier;
            if (isUserAstNode(refId) && varRef.isWriteOnly()) {
                const parent = parentByNode.get(refId);
                if (parent?.type === 'AssignmentExpression' && '=' === parent.operator && parent.left === refId && !isEagerlyInside(readNode, parent.right)) return true;
            }
        }
        return false;
    };
    const checkGlobalThisPropertyRead = (reportNode, propName)=>{
        if (FORBIDDEN_MAIN_THREAD_APIS.has(propName)) {
            const classification = classifyDisallowedGlobal(propName, thread, true);
            reportAtNode(reportNode, classification.code, classification.message, propName, classification.hint);
            return;
        }
        const builtinSet = 'main' === thread ? MAIN_BUILTIN_GLOBALS : BACKGROUND_GLOBAL_THIS_BUILTINS;
        if (builtinSet.has(propName) || OBJECT_PROTOTYPE_PROPERTIES.has(propName) || isCustomGlobalDefinedForRead(propName, reportNode)) return;
        const classification = classifyDisallowedGlobal(propName, thread, true);
        reportAtNode(reportNode, classification.code, classification.message, propName, classification.hint);
    };
    for (const [idNode, ref] of referenceByIdentifier){
        const name = idNode.name;
        if (void 0 === name) continue;
        if (null !== ref.resolved) {
            if ('main' === thread && ref.resolved.scope === scopeManager.globalScope && FORBIDDEN_MAIN_THREAD_APIS.has(name) && ref.isRead() && ref.resolved.defs.some((def)=>'FunctionName' === def.type || 'Variable' === def.type && def.parent?.kind === 'var')) {
                const classification = classifyDisallowedGlobal(name, thread, false);
                reportAtNode(idNode, classification.code, classification.message, name, classification.hint);
                continue;
            }
            if ('background' === thread && null !== wrapperScope && ref.resolved.scope === wrapperScope && BACKGROUND_WRAPPER_PARAM_SET.has(name) && !ALLOWED_BACKGROUND_WRAPPER_PARAMS.has(name) && ref.isRead() && !isWrapperParamUserInitialized(ref.resolved, idNode)) {
                const classification = classifyDisallowedGlobal(name, thread, false);
                reportAtNode(idNode, classification.code, classification.message, name, classification.hint);
            }
            continue;
        }
        if (FORBIDDEN_MAIN_THREAD_APIS.has(name)) {
            const classification = classifyDisallowedGlobal(name, thread, false);
            reportAtNode(idNode, classification.code, classification.message, name, classification.hint);
            continue;
        }
        const builtinGlobals = 'main' === thread ? MAIN_BUILTIN_GLOBALS : BACKGROUND_GLOBAL_THIS_BUILTINS;
        if (builtinGlobals.has(name) || isCustomGlobalDefinedForRead(name, idNode)) continue;
        const classification = classifyDisallowedGlobal(name, thread, false);
        reportAtNode(idNode, classification.code, classification.message, name, classification.hint);
    }
    const walkStructuralChecks = (node)=>{
        if (isUserAstNode(node)) switch(node.type){
            case 'WithStatement':
                reportAtNode(node, 'unsupported-syntax', `\`with\` statements are not supported in \`<script thread="${thread}">\`.`);
                break;
            case 'ImportExpression':
                reportAtNode(node, 'unsupported-syntax', `Dynamic \`import()\` is not supported in raw \`.lynxml\` \`<script thread="${thread}">\`.`, void 0, 'Load external background bundles with `lynx.fetchBundle()` and `lynx.loadScript()`.');
                break;
            case 'MemberExpression':
                if (!writeMemberNodes.has(node) && isGlobalThis(node.object)) {
                    const propName = extractStaticMemberProperty(node);
                    if (null !== propName) checkGlobalThisPropertyRead(node, propName);
                }
                break;
            case 'VariableDeclarator':
                if (node.id?.type === 'ObjectPattern' && isGlobalThis(node.init)) for (const prop of node.id.properties ?? []){
                    const propName = extractStaticObjectPropertyKey(prop);
                    if (null !== propName) checkGlobalThisPropertyRead(prop, propName);
                }
                break;
            case 'AssignmentExpression':
            case 'AssignmentPattern':
                if (node.left?.type === 'ObjectPattern' && isGlobalThis(node.right)) for (const prop of node.left.properties ?? []){
                    const propName = extractStaticObjectPropertyKey(prop);
                    if (null !== propName) checkGlobalThisPropertyRead(prop, propName);
                }
                break;
            default:
                break;
        }
        forEachChildAstNode(node, walkStructuralChecks);
    };
    walkStructuralChecks(program);
    sectionIssues.sort((a, b)=>a.line - b.line || a.column - b.column);
    issues.push(...sectionIssues);
}
function checkLynxmlSource(source) {
    const issues = [];
    const lineStarts = buildLineStarts(source);
    const envelope = parseEnvelope(source, lineStarts, issues);
    if (null !== envelope) {
        if (void 0 !== envelope.mainScript) analyzeScriptSection(envelope.mainScript, 'main', lineStarts, source.length, issues);
        if (void 0 !== envelope.backgroundScript) analyzeScriptSection(envelope.backgroundScript, 'background', lineStarts, source.length, issues);
    }
    issues.sort((a, b)=>a.line - b.line || a.column - b.column);
    return {
        ok: 0 === issues.length,
        issues
    };
}
function formatUsage() {
    return 'Usage: node check-lynxml.mjs [--json] <file.lynxml|-> [...]\n\nStatically validates build-free Lynx XML (.lynxml) artifacts:\n  - Document envelope (`<!doctype lynx>`, `<lynx engine-version="...">`, canonical block order)\n  - JavaScript syntax in `<script thread="main">` and `<script thread="background">`\n  - Thread-specific Lynx global allowlists and forbidden APIs';
}
function runCli(argv) {
    let jsonOutput = false;
    const targets = [];
    for (const arg of argv){
        if ('--help' === arg || '-h' === arg) return void console.log(formatUsage());
        if ('--json' === arg) {
            jsonOutput = true;
            continue;
        }
        if (arg.startsWith('-') && '-' !== arg) {
            console.error(`Unknown option: ${arg}\n\n${formatUsage()}`);
            process.exitCode = 1;
            return;
        }
        targets.push(arg);
    }
    if (0 === targets.length) {
        console.error(formatUsage());
        process.exitCode = 1;
        return;
    }
    const fileReports = [];
    let allOk = true;
    for (const target of targets){
        const displayFile = '-' === target ? '<stdin>' : target;
        let source;
        try {
            source = '-' === target ? readFileSync(0, 'utf8') : readFileSync(resolve(target), 'utf8');
        } catch (error) {
            allOk = false;
            const message = error instanceof Error ? error.message : String(error);
            fileReports.push({
                file: displayFile,
                ok: false,
                issues: [
                    {
                        line: 1,
                        column: 1,
                        code: 'envelope-error',
                        message: `Failed to read file: ${message}`
                    }
                ]
            });
            continue;
        }
        const result = checkLynxmlSource(source);
        if (!result.ok) allOk = false;
        fileReports.push({
            file: displayFile,
            ok: result.ok,
            issues: result.issues
        });
    }
    if (jsonOutput) console.log(JSON.stringify({
        ok: allOk,
        files: fileReports
    }, null, 2));
    else for (const report of fileReports){
        if (report.ok) {
            console.log(`OK ${report.file}`);
            continue;
        }
        const shownHints = new Set();
        for (const issue of report.issues){
            const scopeLabel = void 0 !== issue.thread ? `${issue.code}/${issue.thread}` : issue.code;
            console.error(`${report.file}:${issue.line}:${issue.column} error [${scopeLabel}] ${issue.message}`);
            if (void 0 !== issue.hint && !shownHints.has(issue.hint)) {
                shownHints.add(issue.hint);
                console.error(`  Hint: ${issue.hint}`);
            }
        }
    }
    if (!allOk) process.exitCode = 1;
}
function isDirectExecution() {
    const entry = process.argv[1];
    if (void 0 === entry) return false;
    try {
        return realpathSync(resolve(entry)) === realpathSync(fileURLToPath(import.meta.url));
    } catch  {
        return resolve(entry) === resolve(fileURLToPath(import.meta.url));
    }
}
if (isDirectExecution()) runCli(process.argv.slice(2));
export { checkLynxmlSource };
