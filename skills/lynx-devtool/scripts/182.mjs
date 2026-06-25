import { Server, Socket } from "net";
import { isatty } from "node:tty";
import { formatWithOptions, inspect } from "node:util";
import promises from "node:fs/promises";
import node_os from "node:os";
import node_path from "node:path";
import { TransformStream as web_TransformStream } from "node:stream/web";
import { spawn as external_node_child_process_spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { createRequire } from "node:module";
import node_net from "node:net";
import { setTimeout as promises_setTimeout } from "node:timers/promises";
import { Duplex } from "node:stream";
import { on, once } from "node:events";
import { __webpack_require__ } from "./rslib-runtime.mjs";
import { createRequire as __rspack_createRequire } from "node:module";
const __rspack_createRequire_require = __rspack_createRequire(import.meta.url);
import * as __rspack_external_node_net_0373943e from "node:net";
__webpack_require__.add({
    "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/conventions.js" (__unused_rspack_module, exports) {
        function find(list, predicate, ac) {
            if (void 0 === ac) ac = Array.prototype;
            if (list && 'function' == typeof ac.find) return ac.find.call(list, predicate);
            for(var i = 0; i < list.length; i++)if (hasOwn(list, i)) {
                var item = list[i];
                if (predicate.call(void 0, item, i, list)) return item;
            }
        }
        function freeze(object, oc) {
            if (void 0 === oc) oc = Object;
            if (oc && 'function' == typeof oc.getOwnPropertyDescriptors) object = oc.create(null, oc.getOwnPropertyDescriptors(object));
            return oc && 'function' == typeof oc.freeze ? oc.freeze(object) : object;
        }
        function hasOwn(object, key) {
            return Object.prototype.hasOwnProperty.call(object, key);
        }
        function assign(target, source) {
            if (null === target || 'object' != typeof target) throw new TypeError('target is not an object');
            for(var key in source)if (hasOwn(source, key)) target[key] = source[key];
            return target;
        }
        var HTML_BOOLEAN_ATTRIBUTES = freeze({
            allowfullscreen: true,
            async: true,
            autofocus: true,
            autoplay: true,
            checked: true,
            controls: true,
            default: true,
            defer: true,
            disabled: true,
            formnovalidate: true,
            hidden: true,
            ismap: true,
            itemscope: true,
            loop: true,
            multiple: true,
            muted: true,
            nomodule: true,
            novalidate: true,
            open: true,
            playsinline: true,
            readonly: true,
            required: true,
            reversed: true,
            selected: true
        });
        function isHTMLBooleanAttribute(name) {
            return hasOwn(HTML_BOOLEAN_ATTRIBUTES, name.toLowerCase());
        }
        var HTML_VOID_ELEMENTS = freeze({
            area: true,
            base: true,
            br: true,
            col: true,
            embed: true,
            hr: true,
            img: true,
            input: true,
            link: true,
            meta: true,
            param: true,
            source: true,
            track: true,
            wbr: true
        });
        function isHTMLVoidElement(tagName) {
            return hasOwn(HTML_VOID_ELEMENTS, tagName.toLowerCase());
        }
        var HTML_RAW_TEXT_ELEMENTS = freeze({
            script: false,
            style: false,
            textarea: true,
            title: true
        });
        function isHTMLRawTextElement(tagName) {
            var key = tagName.toLowerCase();
            return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && !HTML_RAW_TEXT_ELEMENTS[key];
        }
        function isHTMLEscapableRawTextElement(tagName) {
            var key = tagName.toLowerCase();
            return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && HTML_RAW_TEXT_ELEMENTS[key];
        }
        function isHTMLMimeType(mimeType) {
            return mimeType === MIME_TYPE.HTML;
        }
        function hasDefaultHTMLNamespace(mimeType) {
            return isHTMLMimeType(mimeType) || mimeType === MIME_TYPE.XML_XHTML_APPLICATION;
        }
        var MIME_TYPE = freeze({
            HTML: 'text/html',
            XML_APPLICATION: 'application/xml',
            XML_TEXT: 'text/xml',
            XML_XHTML_APPLICATION: 'application/xhtml+xml',
            XML_SVG_IMAGE: 'image/svg+xml'
        });
        var _MIME_TYPES = Object.keys(MIME_TYPE).map(function(key) {
            return MIME_TYPE[key];
        });
        function isValidMimeType(mimeType) {
            return _MIME_TYPES.indexOf(mimeType) > -1;
        }
        var NAMESPACE = freeze({
            HTML: 'http://www.w3.org/1999/xhtml',
            SVG: 'http://www.w3.org/2000/svg',
            XML: 'http://www.w3.org/XML/1998/namespace',
            XMLNS: 'http://www.w3.org/2000/xmlns/'
        });
        exports.assign = assign;
        exports.find = find;
        exports.freeze = freeze;
        exports.HTML_BOOLEAN_ATTRIBUTES = HTML_BOOLEAN_ATTRIBUTES;
        exports.HTML_RAW_TEXT_ELEMENTS = HTML_RAW_TEXT_ELEMENTS;
        exports.HTML_VOID_ELEMENTS = HTML_VOID_ELEMENTS;
        exports.hasDefaultHTMLNamespace = hasDefaultHTMLNamespace;
        exports.hasOwn = hasOwn;
        exports.isHTMLBooleanAttribute = isHTMLBooleanAttribute;
        exports.isHTMLRawTextElement = isHTMLRawTextElement;
        exports.isHTMLEscapableRawTextElement = isHTMLEscapableRawTextElement;
        exports.isHTMLMimeType = isHTMLMimeType;
        exports.isHTMLVoidElement = isHTMLVoidElement;
        exports.isValidMimeType = isValidMimeType;
        exports.MIME_TYPE = MIME_TYPE;
        exports.NAMESPACE = NAMESPACE;
    },
    "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/dom-parser.js" (__unused_rspack_module, exports, __webpack_require__) {
        var conventions = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/conventions.js");
        var dom = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/dom.js");
        var errors = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/errors.js");
        var entities = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/entities.js");
        var sax = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/sax.js");
        var DOMImplementation = dom.DOMImplementation;
        var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
        var isHTMLMimeType = conventions.isHTMLMimeType;
        var isValidMimeType = conventions.isValidMimeType;
        var MIME_TYPE = conventions.MIME_TYPE;
        var NAMESPACE = conventions.NAMESPACE;
        var ParseError = errors.ParseError;
        var XMLReader = sax.XMLReader;
        function normalizeLineEndings(input) {
            return input.replace(/\r[\n\u0085]/g, '\n').replace(/[\r\u0085\u2028\u2029]/g, '\n');
        }
        function DOMParser(options) {
            options = options || {};
            if (void 0 === options.locator) options.locator = true;
            this.assign = options.assign || conventions.assign;
            this.domHandler = options.domHandler || DOMHandler;
            this.onError = options.onError || options.errorHandler;
            if (options.errorHandler && 'function' != typeof options.errorHandler) throw new TypeError('errorHandler object is no longer supported, switch to onError!');
            if (options.errorHandler) options.errorHandler('warning', 'The `errorHandler` option has been deprecated, use `onError` instead!', this);
            this.normalizeLineEndings = options.normalizeLineEndings || normalizeLineEndings;
            this.locator = !!options.locator;
            this.xmlns = this.assign(Object.create(null), options.xmlns);
        }
        DOMParser.prototype.parseFromString = function(source, mimeType) {
            if (!isValidMimeType(mimeType)) throw new TypeError('DOMParser.parseFromString: the provided mimeType "' + mimeType + '" is not valid.');
            var defaultNSMap = this.assign(Object.create(null), this.xmlns);
            var entityMap = entities.XML_ENTITIES;
            var defaultNamespace = defaultNSMap[''] || null;
            if (hasDefaultHTMLNamespace(mimeType)) {
                entityMap = entities.HTML_ENTITIES;
                defaultNamespace = NAMESPACE.HTML;
            } else if (mimeType === MIME_TYPE.XML_SVG_IMAGE) defaultNamespace = NAMESPACE.SVG;
            defaultNSMap[''] = defaultNamespace;
            defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
            var domBuilder = new this.domHandler({
                mimeType: mimeType,
                defaultNamespace: defaultNamespace,
                onError: this.onError
            });
            var locator = this.locator ? {} : void 0;
            if (this.locator) domBuilder.setDocumentLocator(locator);
            var sax = new XMLReader();
            sax.errorHandler = domBuilder;
            sax.domBuilder = domBuilder;
            var isXml = !conventions.isHTMLMimeType(mimeType);
            if (isXml && 'string' != typeof source) sax.errorHandler.fatalError('source is not a string');
            sax.parse(this.normalizeLineEndings(String(source)), defaultNSMap, entityMap);
            if (!domBuilder.doc.documentElement) sax.errorHandler.fatalError('missing root element');
            return domBuilder.doc;
        };
        function DOMHandler(options) {
            var opt = options || {};
            this.mimeType = opt.mimeType || MIME_TYPE.XML_APPLICATION;
            this.defaultNamespace = opt.defaultNamespace || null;
            this.cdata = false;
            this.currentElement = void 0;
            this.doc = void 0;
            this.locator = void 0;
            this.onError = opt.onError;
        }
        function position(locator, node) {
            node.lineNumber = locator.lineNumber;
            node.columnNumber = locator.columnNumber;
        }
        DOMHandler.prototype = {
            startDocument: function() {
                var impl = new DOMImplementation();
                this.doc = isHTMLMimeType(this.mimeType) ? impl.createHTMLDocument(false) : impl.createDocument(this.defaultNamespace, '');
            },
            startElement: function(namespaceURI, localName, qName, attrs) {
                var doc = this.doc;
                var el = doc.createElementNS(namespaceURI, qName || localName);
                var len = attrs.length;
                appendElement(this, el);
                this.currentElement = el;
                this.locator && position(this.locator, el);
                for(var i = 0; i < len; i++){
                    var namespaceURI = attrs.getURI(i);
                    var value = attrs.getValue(i);
                    var qName = attrs.getQName(i);
                    var attr = doc.createAttributeNS(namespaceURI, qName);
                    this.locator && position(attrs.getLocator(i), attr);
                    attr.value = attr.nodeValue = value;
                    el.setAttributeNode(attr);
                }
            },
            endElement: function(namespaceURI, localName, qName) {
                this.currentElement = this.currentElement.parentNode;
            },
            startPrefixMapping: function(prefix, uri) {},
            endPrefixMapping: function(prefix) {},
            processingInstruction: function(target, data) {
                var ins = this.doc.createProcessingInstruction(target, data);
                this.locator && position(this.locator, ins);
                appendElement(this, ins);
            },
            ignorableWhitespace: function(ch, start, length) {},
            characters: function(chars, start, length) {
                chars = _toString.apply(this, arguments);
                if (chars) {
                    if (this.cdata) var charNode = this.doc.createCDATASection(chars);
                    else var charNode = this.doc.createTextNode(chars);
                    if (this.currentElement) this.currentElement.appendChild(charNode);
                    else if (/^\s*$/.test(chars)) this.doc.appendChild(charNode);
                    this.locator && position(this.locator, charNode);
                }
            },
            skippedEntity: function(name) {},
            endDocument: function() {
                this.doc.normalize();
            },
            setDocumentLocator: function(locator) {
                if (locator) locator.lineNumber = 0;
                this.locator = locator;
            },
            comment: function(chars, start, length) {
                chars = _toString.apply(this, arguments);
                var comm = this.doc.createComment(chars);
                this.locator && position(this.locator, comm);
                appendElement(this, comm);
            },
            startCDATA: function() {
                this.cdata = true;
            },
            endCDATA: function() {
                this.cdata = false;
            },
            startDTD: function(name, publicId, systemId, internalSubset) {
                var impl = this.doc.implementation;
                if (impl && impl.createDocumentType) {
                    var dt = impl.createDocumentType(name, publicId, systemId, internalSubset);
                    this.locator && position(this.locator, dt);
                    appendElement(this, dt);
                    this.doc.doctype = dt;
                }
            },
            reportError: function(level, message) {
                if ('function' == typeof this.onError) try {
                    this.onError(level, message, this);
                } catch (e) {
                    throw new ParseError('Reporting ' + level + ' "' + message + '" caused ' + e, this.locator);
                }
                else console.error('[xmldom ' + level + ']\t' + message, _locator(this.locator));
            },
            warning: function(message) {
                this.reportError('warning', message);
            },
            error: function(message) {
                this.reportError('error', message);
            },
            fatalError: function(message) {
                this.reportError('fatalError', message);
                throw new ParseError(message, this.locator);
            }
        };
        function _locator(l) {
            if (l) return '\n@#[line:' + l.lineNumber + ',col:' + l.columnNumber + ']';
        }
        function _toString(chars, start, length) {
            if ('string' == typeof chars) return chars.substr(start, length);
            if (chars.length >= start + length || start) return new java.lang.String(chars, start, length) + '';
            return chars;
        }
        'endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl'.replace(/\w+/g, function(key) {
            DOMHandler.prototype[key] = function() {
                return null;
            };
        });
        function appendElement(handler, node) {
            if (handler.currentElement) handler.currentElement.appendChild(node);
            else handler.doc.appendChild(node);
        }
        function onErrorStopParsing(level) {
            if ('error' === level) throw 'onErrorStopParsing';
        }
        function onWarningStopParsing() {
            throw 'onWarningStopParsing';
        }
        exports.__DOMHandler = DOMHandler;
        exports.DOMParser = DOMParser;
        exports.normalizeLineEndings = normalizeLineEndings;
        exports.onErrorStopParsing = onErrorStopParsing;
        exports.onWarningStopParsing = onWarningStopParsing;
    },
    "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/dom.js" (__unused_rspack_module, exports, __webpack_require__) {
        var conventions = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/conventions.js");
        var find = conventions.find;
        var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
        var hasOwn = conventions.hasOwn;
        var isHTMLMimeType = conventions.isHTMLMimeType;
        var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
        var isHTMLVoidElement = conventions.isHTMLVoidElement;
        var MIME_TYPE = conventions.MIME_TYPE;
        var NAMESPACE = conventions.NAMESPACE;
        var PDC = Symbol();
        var errors = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/errors.js");
        var DOMException = errors.DOMException;
        var DOMExceptionName = errors.DOMExceptionName;
        var g = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/grammar.js");
        function checkSymbol(symbol) {
            if (symbol !== PDC) throw new TypeError('Illegal constructor');
        }
        function notEmptyString(input) {
            return '' !== input;
        }
        function splitOnASCIIWhitespace(input) {
            return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
        }
        function orderedSetReducer(current, element) {
            if (!hasOwn(current, element)) current[element] = true;
            return current;
        }
        function toOrderedSet(input) {
            if (!input) return [];
            var list = splitOnASCIIWhitespace(input);
            return Object.keys(list.reduce(orderedSetReducer, {}));
        }
        function arrayIncludes(list) {
            return function(element) {
                return list && -1 !== list.indexOf(element);
            };
        }
        function validateQualifiedName(qualifiedName) {
            if (!g.QName_exact.test(qualifiedName)) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'invalid character in qualified name "' + qualifiedName + '"');
        }
        function validateAndExtract(namespace, qualifiedName) {
            validateQualifiedName(qualifiedName);
            namespace = namespace || null;
            var prefix = null;
            var localName = qualifiedName;
            if (qualifiedName.indexOf(':') >= 0) {
                var splitResult = qualifiedName.split(':');
                prefix = splitResult[0];
                localName = splitResult[1];
            }
            if (null !== prefix && null === namespace) throw new DOMException(DOMException.NAMESPACE_ERR, 'prefix is non-null and namespace is null');
            if ('xml' === prefix && namespace !== conventions.NAMESPACE.XML) throw new DOMException(DOMException.NAMESPACE_ERR, 'prefix is "xml" and namespace is not the XML namespace');
            if (('xmlns' === prefix || 'xmlns' === qualifiedName) && namespace !== conventions.NAMESPACE.XMLNS) throw new DOMException(DOMException.NAMESPACE_ERR, 'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace');
            if (namespace === conventions.NAMESPACE.XMLNS && 'xmlns' !== prefix && 'xmlns' !== qualifiedName) throw new DOMException(DOMException.NAMESPACE_ERR, 'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"');
            return [
                namespace,
                prefix,
                localName
            ];
        }
        function copy(src, dest) {
            for(var p in src)if (hasOwn(src, p)) dest[p] = src[p];
        }
        function _extends(Class, Super) {
            var pt = Class.prototype;
            if (!(pt instanceof Super)) {
                function t() {}
                t.prototype = Super.prototype;
                t = new t();
                copy(pt, t);
                Class.prototype = pt = t;
            }
            if (pt.constructor != Class) {
                if ('function' != typeof Class) console.error('unknown Class:' + Class);
                pt.constructor = Class;
            }
        }
        var NodeType = {};
        var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
        var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
        var TEXT_NODE = NodeType.TEXT_NODE = 3;
        var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
        var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
        var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
        var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
        var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
        var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
        var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
        var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
        var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
        var DocumentPosition = conventions.freeze({
            DOCUMENT_POSITION_DISCONNECTED: 1,
            DOCUMENT_POSITION_PRECEDING: 2,
            DOCUMENT_POSITION_FOLLOWING: 4,
            DOCUMENT_POSITION_CONTAINS: 8,
            DOCUMENT_POSITION_CONTAINED_BY: 16,
            DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
        });
        function commonAncestor(a, b) {
            if (b.length < a.length) return commonAncestor(b, a);
            var c = null;
            for(var n in a){
                if (a[n] !== b[n]) break;
                c = a[n];
            }
            return c;
        }
        function docGUID(doc) {
            if (!doc.guid) doc.guid = Math.random();
            return doc.guid;
        }
        function NodeList() {}
        NodeList.prototype = {
            length: 0,
            item: function(index) {
                return index >= 0 && index < this.length ? this[index] : null;
            },
            toString: function(options) {
                var opts;
                opts = 'function' == typeof options ? {
                    requireWellFormed: false,
                    splitCDATASections: true,
                    nodeFilter: options
                } : options ? {
                    requireWellFormed: !!options.requireWellFormed,
                    splitCDATASections: false !== options.splitCDATASections,
                    nodeFilter: options.nodeFilter || null
                } : {
                    requireWellFormed: false,
                    splitCDATASections: true,
                    nodeFilter: null
                };
                for(var buf = [], i = 0; i < this.length; i++)serializeToString(this[i], buf, null, opts);
                return buf.join('');
            },
            filter: function(predicate) {
                return Array.prototype.filter.call(this, predicate);
            },
            indexOf: function(item) {
                return Array.prototype.indexOf.call(this, item);
            }
        };
        NodeList.prototype[Symbol.iterator] = function() {
            var me = this;
            var index = 0;
            return {
                next: function() {
                    if (index < me.length) return {
                        value: me[index++],
                        done: false
                    };
                    return {
                        done: true
                    };
                },
                return: function() {
                    return {
                        done: true
                    };
                }
            };
        };
        function LiveNodeList(node, refresh) {
            this._node = node;
            this._refresh = refresh;
            _updateLiveList(this);
        }
        function _updateLiveList(list) {
            var inc = list._node._inc || list._node.ownerDocument._inc;
            if (list._inc !== inc) {
                var ls = list._refresh(list._node);
                __set__(list, 'length', ls.length);
                if (!list.$$length || ls.length < list.$$length) {
                    for(var i = ls.length; i in list; i++)if (hasOwn(list, i)) delete list[i];
                }
                copy(ls, list);
                list._inc = inc;
            }
        }
        LiveNodeList.prototype.item = function(i) {
            _updateLiveList(this);
            return this[i] || null;
        };
        _extends(LiveNodeList, NodeList);
        function NamedNodeMap() {}
        function _findNodeIndex(list, node) {
            var i = 0;
            while(i < list.length){
                if (list[i] === node) return i;
                i++;
            }
        }
        function _addNamedNode(el, list, newAttr, oldAttr) {
            if (oldAttr) list[_findNodeIndex(list, oldAttr)] = newAttr;
            else {
                list[list.length] = newAttr;
                list.length++;
            }
            if (el) {
                newAttr.ownerElement = el;
                var doc = el.ownerDocument;
                if (doc) {
                    oldAttr && _onRemoveAttribute(doc, el, oldAttr);
                    _onAddAttribute(doc, el, newAttr);
                }
            }
        }
        function _removeNamedNode(el, list, attr) {
            var i = _findNodeIndex(list, attr);
            if (i >= 0) {
                var lastIndex = list.length - 1;
                while(i <= lastIndex)list[i] = list[++i];
                list.length = lastIndex;
                if (el) {
                    var doc = el.ownerDocument;
                    if (doc) _onRemoveAttribute(doc, el, attr);
                    attr.ownerElement = null;
                }
            }
        }
        NamedNodeMap.prototype = {
            length: 0,
            item: NodeList.prototype.item,
            getNamedItem: function(localName) {
                if (this._ownerElement && this._ownerElement._isInHTMLDocumentAndNamespace()) localName = localName.toLowerCase();
                var i = 0;
                while(i < this.length){
                    var attr = this[i];
                    if (attr.nodeName === localName) return attr;
                    i++;
                }
                return null;
            },
            setNamedItem: function(attr) {
                var el = attr.ownerElement;
                if (el && el !== this._ownerElement) throw new DOMException(DOMException.INUSE_ATTRIBUTE_ERR);
                var oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);
                if (oldAttr === attr) return attr;
                _addNamedNode(this._ownerElement, this, attr, oldAttr);
                return oldAttr;
            },
            setNamedItemNS: function(attr) {
                return this.setNamedItem(attr);
            },
            removeNamedItem: function(localName) {
                var attr = this.getNamedItem(localName);
                if (!attr) throw new DOMException(DOMException.NOT_FOUND_ERR, localName);
                _removeNamedNode(this._ownerElement, this, attr);
                return attr;
            },
            removeNamedItemNS: function(namespaceURI, localName) {
                var attr = this.getNamedItemNS(namespaceURI, localName);
                if (!attr) throw new DOMException(DOMException.NOT_FOUND_ERR, namespaceURI ? namespaceURI + ' : ' + localName : localName);
                _removeNamedNode(this._ownerElement, this, attr);
                return attr;
            },
            getNamedItemNS: function(namespaceURI, localName) {
                if (!namespaceURI) namespaceURI = null;
                var i = 0;
                while(i < this.length){
                    var node = this[i];
                    if (node.localName === localName && node.namespaceURI === namespaceURI) return node;
                    i++;
                }
                return null;
            }
        };
        NamedNodeMap.prototype[Symbol.iterator] = function() {
            var me = this;
            var index = 0;
            return {
                next: function() {
                    if (index < me.length) return {
                        value: me[index++],
                        done: false
                    };
                    return {
                        done: true
                    };
                },
                return: function() {
                    return {
                        done: true
                    };
                }
            };
        };
        function DOMImplementation() {}
        DOMImplementation.prototype = {
            hasFeature: function(feature, version) {
                return true;
            },
            createDocument: function(namespaceURI, qualifiedName, doctype) {
                var contentType = MIME_TYPE.XML_APPLICATION;
                if (namespaceURI === NAMESPACE.HTML) contentType = MIME_TYPE.XML_XHTML_APPLICATION;
                else if (namespaceURI === NAMESPACE.SVG) contentType = MIME_TYPE.XML_SVG_IMAGE;
                var doc = new Document(PDC, {
                    contentType: contentType
                });
                doc.implementation = this;
                doc.childNodes = new NodeList();
                doc.doctype = doctype || null;
                if (doctype) doc.appendChild(doctype);
                if (qualifiedName) {
                    var root = doc.createElementNS(namespaceURI, qualifiedName);
                    doc.appendChild(root);
                }
                return doc;
            },
            createDocumentType: function(qualifiedName, publicId, systemId, internalSubset) {
                validateQualifiedName(qualifiedName);
                var node = new DocumentType(PDC);
                node.name = qualifiedName;
                node.nodeName = qualifiedName;
                node.publicId = publicId || '';
                node.systemId = systemId || '';
                node.internalSubset = internalSubset || '';
                node.childNodes = new NodeList();
                return node;
            },
            createHTMLDocument: function(title) {
                var doc = new Document(PDC, {
                    contentType: MIME_TYPE.HTML
                });
                doc.implementation = this;
                doc.childNodes = new NodeList();
                if (false !== title) {
                    doc.doctype = this.createDocumentType('html');
                    doc.doctype.ownerDocument = doc;
                    doc.appendChild(doc.doctype);
                    var htmlNode = doc.createElement('html');
                    doc.appendChild(htmlNode);
                    var headNode = doc.createElement('head');
                    htmlNode.appendChild(headNode);
                    if ('string' == typeof title) {
                        var titleNode = doc.createElement('title');
                        titleNode.appendChild(doc.createTextNode(title));
                        headNode.appendChild(titleNode);
                    }
                    htmlNode.appendChild(doc.createElement('body'));
                }
                return doc;
            }
        };
        function Node(symbol) {
            checkSymbol(symbol);
        }
        Node.prototype = {
            firstChild: null,
            lastChild: null,
            previousSibling: null,
            nextSibling: null,
            parentNode: null,
            get parentElement () {
                return this.parentNode && this.parentNode.nodeType === this.ELEMENT_NODE ? this.parentNode : null;
            },
            childNodes: null,
            ownerDocument: null,
            nodeValue: null,
            namespaceURI: null,
            prefix: null,
            localName: null,
            baseURI: 'about:blank',
            get isConnected () {
                var rootNode = this.getRootNode();
                return rootNode && rootNode.nodeType === rootNode.DOCUMENT_NODE;
            },
            contains: function(other) {
                if (!other) return false;
                var parent = other;
                do {
                    if (this === parent) return true;
                    parent = parent.parentNode;
                }while (parent);
                return false;
            },
            getRootNode: function(options) {
                var parent = this;
                do {
                    if (!parent.parentNode) return parent;
                    parent = parent.parentNode;
                }while (parent);
            },
            isEqualNode: function(otherNode) {
                if (!otherNode) return false;
                var stack = [
                    {
                        node: this,
                        other: otherNode
                    }
                ];
                while(stack.length > 0){
                    var pair = stack.pop();
                    var node = pair.node;
                    var other = pair.other;
                    if (node.nodeType !== other.nodeType) return false;
                    switch(node.nodeType){
                        case node.DOCUMENT_TYPE_NODE:
                            if (node.name !== other.name) return false;
                            if (node.publicId !== other.publicId) return false;
                            if (node.systemId !== other.systemId) return false;
                            break;
                        case node.ELEMENT_NODE:
                            if (node.namespaceURI !== other.namespaceURI) return false;
                            if (node.prefix !== other.prefix) return false;
                            if (node.localName !== other.localName) return false;
                            if (node.attributes.length !== other.attributes.length) return false;
                            for(var i = 0; i < node.attributes.length; i++){
                                var attr = node.attributes.item(i);
                                var otherAttr = other.getAttributeNodeNS(attr.namespaceURI, attr.localName);
                                if (!otherAttr) return false;
                                stack.push({
                                    node: attr,
                                    other: otherAttr
                                });
                            }
                            break;
                        case node.ATTRIBUTE_NODE:
                            if (node.namespaceURI !== other.namespaceURI) return false;
                            if (node.localName !== other.localName) return false;
                            if (node.value !== other.value) return false;
                            break;
                        case node.PROCESSING_INSTRUCTION_NODE:
                            if (node.target !== other.target || node.data !== other.data) return false;
                            break;
                        case node.TEXT_NODE:
                        case node.CDATA_SECTION_NODE:
                        case node.COMMENT_NODE:
                            if (node.data !== other.data) return false;
                            break;
                    }
                    if (node.childNodes.length !== other.childNodes.length) return false;
                    for(var i = node.childNodes.length - 1; i >= 0; i--)stack.push({
                        node: node.childNodes[i],
                        other: other.childNodes[i]
                    });
                }
                return true;
            },
            isSameNode: function(otherNode) {
                return this === otherNode;
            },
            insertBefore: function(newChild, refChild) {
                return _insertBefore(this, newChild, refChild);
            },
            replaceChild: function(newChild, oldChild) {
                _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
                if (oldChild) this.removeChild(oldChild);
            },
            removeChild: function(oldChild) {
                return _removeChild(this, oldChild);
            },
            appendChild: function(newChild) {
                return this.insertBefore(newChild, null);
            },
            hasChildNodes: function() {
                return null != this.firstChild;
            },
            cloneNode: function(deep) {
                return cloneNode(this.ownerDocument || this, this, deep);
            },
            normalize: function() {
                walkDOM(this, null, {
                    enter: function(node) {
                        var child = node.firstChild;
                        while(child){
                            var next = child.nextSibling;
                            if (null !== next && next.nodeType === TEXT_NODE && child.nodeType === TEXT_NODE) {
                                node.removeChild(next);
                                child.appendData(next.data);
                            } else child = next;
                        }
                        return true;
                    }
                });
            },
            isSupported: function(feature, version) {
                return this.ownerDocument.implementation.hasFeature(feature, version);
            },
            lookupPrefix: function(namespaceURI) {
                var el = this;
                while(el){
                    var map = el._nsMap;
                    if (map) {
                        for(var n in map)if (hasOwn(map, n) && map[n] === namespaceURI) return n;
                    }
                    el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
                }
                return null;
            },
            lookupNamespaceURI: function(prefix) {
                var el = this;
                while(el){
                    var map = el._nsMap;
                    if (map) {
                        if (hasOwn(map, prefix)) return map[prefix];
                    }
                    el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
                }
                return null;
            },
            isDefaultNamespace: function(namespaceURI) {
                var prefix = this.lookupPrefix(namespaceURI);
                return null == prefix;
            },
            compareDocumentPosition: function(other) {
                if (this === other) return 0;
                var node1 = other;
                var node2 = this;
                var attr1 = null;
                var attr2 = null;
                if (node1 instanceof Attr) {
                    attr1 = node1;
                    node1 = attr1.ownerElement;
                }
                if (node2 instanceof Attr) {
                    attr2 = node2;
                    node2 = attr2.ownerElement;
                    if (attr1 && node1 && node2 === node1) for(var i = 0, attr; attr = node2.attributes[i]; i++){
                        if (attr === attr1) return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
                        if (attr === attr2) return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
                    }
                }
                if (!node1 || !node2 || node2.ownerDocument !== node1.ownerDocument) return DocumentPosition.DOCUMENT_POSITION_DISCONNECTED + DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + (docGUID(node2.ownerDocument) > docGUID(node1.ownerDocument) ? DocumentPosition.DOCUMENT_POSITION_FOLLOWING : DocumentPosition.DOCUMENT_POSITION_PRECEDING);
                if (attr2 && node1 === node2) return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
                if (attr1 && node1 === node2) return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
                var chain1 = [];
                var ancestor1 = node1.parentNode;
                while(ancestor1){
                    if (!attr2 && ancestor1 === node2) return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
                    chain1.push(ancestor1);
                    ancestor1 = ancestor1.parentNode;
                }
                chain1.reverse();
                var chain2 = [];
                var ancestor2 = node2.parentNode;
                while(ancestor2){
                    if (!attr1 && ancestor2 === node1) return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
                    chain2.push(ancestor2);
                    ancestor2 = ancestor2.parentNode;
                }
                chain2.reverse();
                var ca = commonAncestor(chain1, chain2);
                for(var n in ca.childNodes){
                    var child = ca.childNodes[n];
                    if (child === node2) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
                    if (child === node1) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
                    if (chain2.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
                    if (chain1.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
                }
                return 0;
            }
        };
        function _xmlEncoder(c) {
            return '<' == c && '&lt;' || '>' == c && '&gt;' || '&' == c && '&amp;' || '"' == c && '&quot;' || '&#' + c.charCodeAt() + ';';
        }
        copy(NodeType, Node);
        copy(NodeType, Node.prototype);
        copy(DocumentPosition, Node);
        copy(DocumentPosition, Node.prototype);
        function _visitNode(node, callback) {
            walkDOM(node, null, {
                enter: function(n) {
                    return callback(n) ? walkDOM.STOP : true;
                }
            });
        }
        function walkDOM(node, context, callbacks) {
            var stack = [
                {
                    node: node,
                    context: context,
                    phase: walkDOM.ENTER
                }
            ];
            while(stack.length > 0){
                var frame = stack.pop();
                if (frame.phase === walkDOM.ENTER) {
                    var childContext = callbacks.enter(frame.node, frame.context);
                    if (childContext === walkDOM.STOP) return walkDOM.STOP;
                    stack.push({
                        node: frame.node,
                        context: childContext,
                        phase: walkDOM.EXIT
                    });
                    if (null == childContext) continue;
                    var child = frame.node.lastChild;
                    while(child){
                        stack.push({
                            node: child,
                            context: childContext,
                            phase: walkDOM.ENTER
                        });
                        child = child.previousSibling;
                    }
                } else if (callbacks.exit) callbacks.exit(frame.node, frame.context);
            }
        }
        walkDOM.STOP = Symbol('walkDOM.STOP');
        walkDOM.ENTER = 0;
        walkDOM.EXIT = 1;
        function Document(symbol, options) {
            checkSymbol(symbol);
            var opt = options || {};
            this.ownerDocument = this;
            this.contentType = opt.contentType || MIME_TYPE.XML_APPLICATION;
            this.type = isHTMLMimeType(this.contentType) ? 'html' : 'xml';
        }
        function _onAddAttribute(doc, el, newAttr) {
            doc && doc._inc++;
            var ns = newAttr.namespaceURI;
            if (ns === NAMESPACE.XMLNS) el._nsMap[newAttr.prefix ? newAttr.localName : ''] = newAttr.value;
        }
        function _onRemoveAttribute(doc, el, newAttr, remove) {
            doc && doc._inc++;
            var ns = newAttr.namespaceURI;
            if (ns === NAMESPACE.XMLNS) delete el._nsMap[newAttr.prefix ? newAttr.localName : ''];
        }
        function _onUpdateChild(doc, parent, newChild) {
            if (doc && doc._inc) {
                doc._inc++;
                var childNodes = parent.childNodes;
                if (newChild && !newChild.nextSibling) childNodes[childNodes.length++] = newChild;
                else {
                    var child = parent.firstChild;
                    var i = 0;
                    while(child){
                        childNodes[i++] = child;
                        child = child.nextSibling;
                    }
                    childNodes.length = i;
                    delete childNodes[childNodes.length];
                }
            }
        }
        function _removeChild(parentNode, child) {
            if (parentNode !== child.parentNode) throw new DOMException(DOMException.NOT_FOUND_ERR, "child's parent is not parent");
            var oldPreviousSibling = child.previousSibling;
            var oldNextSibling = child.nextSibling;
            if (oldPreviousSibling) oldPreviousSibling.nextSibling = oldNextSibling;
            else parentNode.firstChild = oldNextSibling;
            if (oldNextSibling) oldNextSibling.previousSibling = oldPreviousSibling;
            else parentNode.lastChild = oldPreviousSibling;
            _onUpdateChild(parentNode.ownerDocument, parentNode);
            child.parentNode = null;
            child.previousSibling = null;
            child.nextSibling = null;
            return child;
        }
        function hasValidParentNodeType(node) {
            return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
        }
        function hasInsertableNodeType(node) {
            return node && (node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_TYPE_NODE || node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE || node.nodeType === Node.TEXT_NODE);
        }
        function isDocTypeNode(node) {
            return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
        }
        function isElementNode(node) {
            return node && node.nodeType === Node.ELEMENT_NODE;
        }
        function isTextNode(node) {
            return node && node.nodeType === Node.TEXT_NODE;
        }
        function isElementInsertionPossible(doc, child) {
            var parentChildNodes = doc.childNodes || [];
            if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) return false;
            var docTypeNode = find(parentChildNodes, isDocTypeNode);
            return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
        }
        function isElementReplacementPossible(doc, child) {
            var parentChildNodes = doc.childNodes || [];
            function hasElementChildThatIsNotChild(node) {
                return isElementNode(node) && node !== child;
            }
            if (find(parentChildNodes, hasElementChildThatIsNotChild)) return false;
            var docTypeNode = find(parentChildNodes, isDocTypeNode);
            return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
        }
        function assertPreInsertionValidity1to5(parent, node, child) {
            if (!hasValidParentNodeType(parent)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Unexpected parent node type ' + parent.nodeType);
            if (child && child.parentNode !== parent) throw new DOMException(DOMException.NOT_FOUND_ERR, 'child not in parent');
            if (!hasInsertableNodeType(node) || isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Unexpected node type ' + node.nodeType + ' for parent node type ' + parent.nodeType);
        }
        function assertPreInsertionValidityInDocument(parent, node, child) {
            var parentChildNodes = parent.childNodes || [];
            var nodeChildNodes = node.childNodes || [];
            if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                var nodeChildElements = nodeChildNodes.filter(isElementNode);
                if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'More than one element or text in fragment');
                if (1 === nodeChildElements.length && !isElementInsertionPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Element in fragment can not be inserted before doctype');
            }
            if (isElementNode(node)) {
                if (!isElementInsertionPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Only one element can be added and only after doctype');
            }
            if (isDocTypeNode(node)) {
                if (find(parentChildNodes, isDocTypeNode)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Only one doctype is allowed');
                var parentElementChild = find(parentChildNodes, isElementNode);
                if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Doctype can only be inserted before an element');
                if (!child && parentElementChild) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Doctype can not be appended since element is present');
            }
        }
        function assertPreReplacementValidityInDocument(parent, node, child) {
            var parentChildNodes = parent.childNodes || [];
            var nodeChildNodes = node.childNodes || [];
            if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                var nodeChildElements = nodeChildNodes.filter(isElementNode);
                if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'More than one element or text in fragment');
                if (1 === nodeChildElements.length && !isElementReplacementPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Element in fragment can not be inserted before doctype');
            }
            if (isElementNode(node)) {
                if (!isElementReplacementPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Only one element can be added and only after doctype');
            }
            if (isDocTypeNode(node)) {
                function hasDoctypeChildThatIsNotChild(node) {
                    return isDocTypeNode(node) && node !== child;
                }
                if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Only one doctype is allowed');
                var parentElementChild = find(parentChildNodes, isElementNode);
                if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, 'Doctype can only be inserted before an element');
            }
        }
        function _insertBefore(parent, node, child, _inDocumentAssertion) {
            assertPreInsertionValidity1to5(parent, node, child);
            if (parent.nodeType === Node.DOCUMENT_NODE) (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
            var cp = node.parentNode;
            if (cp) cp.removeChild(node);
            if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
                var newFirst = node.firstChild;
                if (null == newFirst) return node;
                var newLast = node.lastChild;
            } else newFirst = newLast = node;
            var pre = child ? child.previousSibling : parent.lastChild;
            newFirst.previousSibling = pre;
            newLast.nextSibling = child;
            if (pre) pre.nextSibling = newFirst;
            else parent.firstChild = newFirst;
            if (null == child) parent.lastChild = newLast;
            else child.previousSibling = newLast;
            do newFirst.parentNode = parent;
            while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
            _onUpdateChild(parent.ownerDocument || parent, parent, node);
            if (node.nodeType == DOCUMENT_FRAGMENT_NODE) node.firstChild = node.lastChild = null;
            return node;
        }
        Document.prototype = {
            implementation: null,
            nodeName: '#document',
            nodeType: DOCUMENT_NODE,
            doctype: null,
            documentElement: null,
            _inc: 1,
            insertBefore: function(newChild, refChild) {
                if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
                    var child = newChild.firstChild;
                    while(child){
                        var next = child.nextSibling;
                        this.insertBefore(child, refChild);
                        child = next;
                    }
                    return newChild;
                }
                _insertBefore(this, newChild, refChild);
                newChild.ownerDocument = this;
                if (null === this.documentElement && newChild.nodeType === ELEMENT_NODE) this.documentElement = newChild;
                return newChild;
            },
            removeChild: function(oldChild) {
                var removed = _removeChild(this, oldChild);
                if (removed === this.documentElement) this.documentElement = null;
                return removed;
            },
            replaceChild: function(newChild, oldChild) {
                _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
                newChild.ownerDocument = this;
                if (oldChild) this.removeChild(oldChild);
                if (isElementNode(newChild)) this.documentElement = newChild;
            },
            importNode: function(importedNode, deep) {
                return importNode(this, importedNode, deep);
            },
            getElementById: function(id) {
                var rtv = null;
                _visitNode(this.documentElement, function(node) {
                    if (node.nodeType == ELEMENT_NODE) {
                        if (node.getAttribute('id') == id) {
                            rtv = node;
                            return true;
                        }
                    }
                });
                return rtv;
            },
            createElement: function(tagName) {
                var node = new Element(PDC);
                node.ownerDocument = this;
                if ('html' === this.type) tagName = tagName.toLowerCase();
                if (hasDefaultHTMLNamespace(this.contentType)) node.namespaceURI = NAMESPACE.HTML;
                node.nodeName = tagName;
                node.tagName = tagName;
                node.localName = tagName;
                node.childNodes = new NodeList();
                var attrs = node.attributes = new NamedNodeMap();
                attrs._ownerElement = node;
                return node;
            },
            createDocumentFragment: function() {
                var node = new DocumentFragment(PDC);
                node.ownerDocument = this;
                node.childNodes = new NodeList();
                return node;
            },
            createTextNode: function(data) {
                var node = new Text(PDC);
                node.ownerDocument = this;
                node.childNodes = new NodeList();
                node.appendData(data);
                return node;
            },
            createComment: function(data) {
                var node = new Comment(PDC);
                node.ownerDocument = this;
                node.childNodes = new NodeList();
                node.appendData(data);
                return node;
            },
            createCDATASection: function(data) {
                if (-1 !== data.indexOf(']]>')) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'data contains "]]>"');
                var node = new CDATASection(PDC);
                node.ownerDocument = this;
                node.childNodes = new NodeList();
                node.appendData(data);
                return node;
            },
            createProcessingInstruction: function(target, data) {
                var node = new ProcessingInstruction(PDC);
                node.ownerDocument = this;
                node.childNodes = new NodeList();
                node.nodeName = node.target = target;
                node.nodeValue = node.data = data;
                return node;
            },
            createAttribute: function(name) {
                if (!g.QName_exact.test(name)) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'invalid character in name "' + name + '"');
                if ('html' === this.type) name = name.toLowerCase();
                return this._createAttribute(name);
            },
            _createAttribute: function(name) {
                var node = new Attr(PDC);
                node.ownerDocument = this;
                node.childNodes = new NodeList();
                node.name = name;
                node.nodeName = name;
                node.localName = name;
                node.specified = true;
                return node;
            },
            createEntityReference: function(name) {
                if (!g.Name.test(name)) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'not a valid xml name "' + name + '"');
                if ('html' === this.type) throw new DOMException('document is an html document', DOMExceptionName.NotSupportedError);
                var node = new EntityReference(PDC);
                node.ownerDocument = this;
                node.childNodes = new NodeList();
                node.nodeName = name;
                return node;
            },
            createElementNS: function(namespaceURI, qualifiedName) {
                var validated = validateAndExtract(namespaceURI, qualifiedName);
                var node = new Element(PDC);
                var attrs = node.attributes = new NamedNodeMap();
                node.childNodes = new NodeList();
                node.ownerDocument = this;
                node.nodeName = qualifiedName;
                node.tagName = qualifiedName;
                node.namespaceURI = validated[0];
                node.prefix = validated[1];
                node.localName = validated[2];
                attrs._ownerElement = node;
                return node;
            },
            createAttributeNS: function(namespaceURI, qualifiedName) {
                var validated = validateAndExtract(namespaceURI, qualifiedName);
                var node = new Attr(PDC);
                node.ownerDocument = this;
                node.childNodes = new NodeList();
                node.nodeName = qualifiedName;
                node.name = qualifiedName;
                node.specified = true;
                node.namespaceURI = validated[0];
                node.prefix = validated[1];
                node.localName = validated[2];
                return node;
            }
        };
        _extends(Document, Node);
        function Element(symbol) {
            checkSymbol(symbol);
            this._nsMap = Object.create(null);
        }
        Element.prototype = {
            nodeType: ELEMENT_NODE,
            attributes: null,
            getQualifiedName: function() {
                return this.prefix ? this.prefix + ':' + this.localName : this.localName;
            },
            _isInHTMLDocumentAndNamespace: function() {
                return 'html' === this.ownerDocument.type && this.namespaceURI === NAMESPACE.HTML;
            },
            hasAttributes: function() {
                return !!(this.attributes && this.attributes.length);
            },
            hasAttribute: function(name) {
                return !!this.getAttributeNode(name);
            },
            getAttribute: function(name) {
                var attr = this.getAttributeNode(name);
                return attr ? attr.value : null;
            },
            getAttributeNode: function(name) {
                if (this._isInHTMLDocumentAndNamespace()) name = name.toLowerCase();
                return this.attributes.getNamedItem(name);
            },
            setAttribute: function(name, value) {
                if (this._isInHTMLDocumentAndNamespace()) name = name.toLowerCase();
                var attr = this.getAttributeNode(name);
                if (attr) attr.value = attr.nodeValue = '' + value;
                else {
                    attr = this.ownerDocument._createAttribute(name);
                    attr.value = attr.nodeValue = '' + value;
                    this.setAttributeNode(attr);
                }
            },
            removeAttribute: function(name) {
                var attr = this.getAttributeNode(name);
                attr && this.removeAttributeNode(attr);
            },
            setAttributeNode: function(newAttr) {
                return this.attributes.setNamedItem(newAttr);
            },
            setAttributeNodeNS: function(newAttr) {
                return this.attributes.setNamedItemNS(newAttr);
            },
            removeAttributeNode: function(oldAttr) {
                return this.attributes.removeNamedItem(oldAttr.nodeName);
            },
            removeAttributeNS: function(namespaceURI, localName) {
                var old = this.getAttributeNodeNS(namespaceURI, localName);
                old && this.removeAttributeNode(old);
            },
            hasAttributeNS: function(namespaceURI, localName) {
                return null != this.getAttributeNodeNS(namespaceURI, localName);
            },
            getAttributeNS: function(namespaceURI, localName) {
                var attr = this.getAttributeNodeNS(namespaceURI, localName);
                return attr ? attr.value : null;
            },
            setAttributeNS: function(namespaceURI, qualifiedName, value) {
                var validated = validateAndExtract(namespaceURI, qualifiedName);
                var localName = validated[2];
                var attr = this.getAttributeNodeNS(namespaceURI, localName);
                if (attr) attr.value = attr.nodeValue = '' + value;
                else {
                    attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
                    attr.value = attr.nodeValue = '' + value;
                    this.setAttributeNode(attr);
                }
            },
            getAttributeNodeNS: function(namespaceURI, localName) {
                return this.attributes.getNamedItemNS(namespaceURI, localName);
            },
            getElementsByClassName: function(classNames) {
                var classNamesSet = toOrderedSet(classNames);
                return new LiveNodeList(this, function(base) {
                    var ls = [];
                    if (classNamesSet.length > 0) _visitNode(base, function(node) {
                        if (node !== base && node.nodeType === ELEMENT_NODE) {
                            var nodeClassNames = node.getAttribute('class');
                            if (nodeClassNames) {
                                var matches = classNames === nodeClassNames;
                                if (!matches) {
                                    var nodeClassNamesSet = toOrderedSet(nodeClassNames);
                                    matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
                                }
                                if (matches) ls.push(node);
                            }
                        }
                    });
                    return ls;
                });
            },
            getElementsByTagName: function(qualifiedName) {
                var isHTMLDocument = 'html' === (this.nodeType === DOCUMENT_NODE ? this : this.ownerDocument).type;
                var lowerQualifiedName = qualifiedName.toLowerCase();
                return new LiveNodeList(this, function(base) {
                    var ls = [];
                    _visitNode(base, function(node) {
                        if (node === base || node.nodeType !== ELEMENT_NODE) return;
                        if ('*' === qualifiedName) ls.push(node);
                        else {
                            var nodeQualifiedName = node.getQualifiedName();
                            var matchingQName = isHTMLDocument && node.namespaceURI === NAMESPACE.HTML ? lowerQualifiedName : qualifiedName;
                            if (nodeQualifiedName === matchingQName) ls.push(node);
                        }
                    });
                    return ls;
                });
            },
            getElementsByTagNameNS: function(namespaceURI, localName) {
                return new LiveNodeList(this, function(base) {
                    var ls = [];
                    _visitNode(base, function(node) {
                        if (node !== base && node.nodeType === ELEMENT_NODE && ('*' === namespaceURI || node.namespaceURI === namespaceURI) && ('*' === localName || node.localName == localName)) ls.push(node);
                    });
                    return ls;
                });
            }
        };
        Document.prototype.getElementsByClassName = Element.prototype.getElementsByClassName;
        Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
        Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
        _extends(Element, Node);
        function Attr(symbol) {
            checkSymbol(symbol);
            this.namespaceURI = null;
            this.prefix = null;
            this.ownerElement = null;
        }
        Attr.prototype.nodeType = ATTRIBUTE_NODE;
        _extends(Attr, Node);
        function CharacterData(symbol) {
            checkSymbol(symbol);
        }
        CharacterData.prototype = {
            data: '',
            substringData: function(offset, count) {
                return this.data.substring(offset, offset + count);
            },
            appendData: function(text) {
                text = this.data + text;
                this.nodeValue = this.data = text;
                this.length = text.length;
            },
            insertData: function(offset, text) {
                this.replaceData(offset, 0, text);
            },
            deleteData: function(offset, count) {
                this.replaceData(offset, count, '');
            },
            replaceData: function(offset, count, text) {
                var start = this.data.substring(0, offset);
                var end = this.data.substring(offset + count);
                text = start + text + end;
                this.nodeValue = this.data = text;
                this.length = text.length;
            }
        };
        _extends(CharacterData, Node);
        function Text(symbol) {
            checkSymbol(symbol);
        }
        Text.prototype = {
            nodeName: '#text',
            nodeType: TEXT_NODE,
            splitText: function(offset) {
                var text = this.data;
                var newText = text.substring(offset);
                text = text.substring(0, offset);
                this.data = this.nodeValue = text;
                this.length = text.length;
                var newNode = this.ownerDocument.createTextNode(newText);
                if (this.parentNode) this.parentNode.insertBefore(newNode, this.nextSibling);
                return newNode;
            }
        };
        _extends(Text, CharacterData);
        function Comment(symbol) {
            checkSymbol(symbol);
        }
        Comment.prototype = {
            nodeName: '#comment',
            nodeType: COMMENT_NODE
        };
        _extends(Comment, CharacterData);
        function CDATASection(symbol) {
            checkSymbol(symbol);
        }
        CDATASection.prototype = {
            nodeName: '#cdata-section',
            nodeType: CDATA_SECTION_NODE
        };
        _extends(CDATASection, Text);
        function DocumentType(symbol) {
            checkSymbol(symbol);
        }
        DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
        _extends(DocumentType, Node);
        function Notation(symbol) {
            checkSymbol(symbol);
        }
        Notation.prototype.nodeType = NOTATION_NODE;
        _extends(Notation, Node);
        function Entity(symbol) {
            checkSymbol(symbol);
        }
        Entity.prototype.nodeType = ENTITY_NODE;
        _extends(Entity, Node);
        function EntityReference(symbol) {
            checkSymbol(symbol);
        }
        EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
        _extends(EntityReference, Node);
        function DocumentFragment(symbol) {
            checkSymbol(symbol);
        }
        DocumentFragment.prototype.nodeName = '#document-fragment';
        DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
        _extends(DocumentFragment, Node);
        function ProcessingInstruction(symbol) {
            checkSymbol(symbol);
        }
        ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
        _extends(ProcessingInstruction, CharacterData);
        function XMLSerializer() {}
        XMLSerializer.prototype.serializeToString = function(node, options) {
            return nodeSerializeToString.call(node, options);
        };
        Node.prototype.toString = nodeSerializeToString;
        function nodeSerializeToString(options) {
            var opts;
            opts = 'function' == typeof options ? {
                requireWellFormed: false,
                splitCDATASections: true,
                nodeFilter: options
            } : null != options ? {
                requireWellFormed: !!options.requireWellFormed,
                splitCDATASections: false !== options.splitCDATASections,
                nodeFilter: options.nodeFilter || null
            } : {
                requireWellFormed: false,
                splitCDATASections: true,
                nodeFilter: null
            };
            var buf = [];
            var refNode = this.nodeType === DOCUMENT_NODE && this.documentElement || this;
            var prefix = refNode.prefix;
            var uri = refNode.namespaceURI;
            if (uri && null == prefix) {
                var prefix = refNode.lookupPrefix(uri);
                if (null == prefix) var visibleNamespaces = [
                    {
                        namespace: uri,
                        prefix: null
                    }
                ];
            }
            serializeToString(this, buf, visibleNamespaces, opts);
            return buf.join('');
        }
        function needNamespaceDefine(node, isHTML, visibleNamespaces) {
            var prefix = node.prefix || '';
            var uri = node.namespaceURI;
            if (!uri) return false;
            if ('xml' === prefix && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) return false;
            var i = visibleNamespaces.length;
            while(i--){
                var ns = visibleNamespaces[i];
                if (ns.prefix === prefix) return ns.namespace !== uri;
            }
            return true;
        }
        function addSerializedAttribute(buf, qualifiedName, value) {
            buf.push(' ', qualifiedName, '="', value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), '"');
        }
        function serializeToString(node, buf, visibleNamespaces, opts) {
            if (!visibleNamespaces) visibleNamespaces = [];
            var nodeFilter = opts.nodeFilter;
            var requireWellFormed = opts.requireWellFormed;
            var splitCDATASections = opts.splitCDATASections;
            var doc = node.nodeType === DOCUMENT_NODE ? node : node.ownerDocument;
            var isHTML = 'html' === doc.type;
            walkDOM(node, {
                ns: visibleNamespaces
            }, {
                enter: function(n, ctx) {
                    var namespaces = ctx.ns;
                    if (nodeFilter) {
                        n = nodeFilter(n);
                        if (!n) return null;
                        if ('string' == typeof n) {
                            buf.push(n);
                            return null;
                        }
                    }
                    switch(n.nodeType){
                        case ELEMENT_NODE:
                            var attrs = n.attributes;
                            var len = attrs.length;
                            var nodeName = n.tagName;
                            var prefixedNodeName = nodeName;
                            if (!isHTML && !n.prefix && n.namespaceURI) {
                                var defaultNS;
                                for(var ai = 0; ai < attrs.length; ai++)if ('xmlns' === attrs.item(ai).name) {
                                    defaultNS = attrs.item(ai).value;
                                    break;
                                }
                                if (!defaultNS) for(var nsi = namespaces.length - 1; nsi >= 0; nsi--){
                                    var nsEntry = namespaces[nsi];
                                    if ('' === nsEntry.prefix && nsEntry.namespace === n.namespaceURI) {
                                        defaultNS = nsEntry.namespace;
                                        break;
                                    }
                                }
                                if (defaultNS !== n.namespaceURI) for(var nsi = namespaces.length - 1; nsi >= 0; nsi--){
                                    var nsEntry = namespaces[nsi];
                                    if (nsEntry.namespace === n.namespaceURI) {
                                        if (nsEntry.prefix) prefixedNodeName = nsEntry.prefix + ':' + nodeName;
                                        break;
                                    }
                                }
                            }
                            buf.push('<', prefixedNodeName);
                            var childNamespaces = namespaces.slice();
                            for(var i = 0; i < len; i++){
                                var attr = attrs.item(i);
                                if ('xmlns' == attr.prefix) childNamespaces.push({
                                    prefix: attr.localName,
                                    namespace: attr.value
                                });
                                else if ('xmlns' == attr.nodeName) childNamespaces.push({
                                    prefix: '',
                                    namespace: attr.value
                                });
                            }
                            for(var i = 0; i < len; i++){
                                var attr = attrs.item(i);
                                if (needNamespaceDefine(attr, isHTML, childNamespaces)) {
                                    var attrPrefix = attr.prefix || '';
                                    var uri = attr.namespaceURI;
                                    addSerializedAttribute(buf, attrPrefix ? 'xmlns:' + attrPrefix : 'xmlns', uri);
                                    childNamespaces.push({
                                        prefix: attrPrefix,
                                        namespace: uri
                                    });
                                }
                                var filteredAttr = nodeFilter ? nodeFilter(attr) : attr;
                                if (filteredAttr) if ('string' == typeof filteredAttr) buf.push(filteredAttr);
                                else addSerializedAttribute(buf, filteredAttr.name, filteredAttr.value);
                            }
                            if (nodeName === prefixedNodeName && needNamespaceDefine(n, isHTML, childNamespaces)) {
                                var nodePrefix = n.prefix || '';
                                var uri = n.namespaceURI;
                                addSerializedAttribute(buf, nodePrefix ? 'xmlns:' + nodePrefix : 'xmlns', uri);
                                childNamespaces.push({
                                    prefix: nodePrefix,
                                    namespace: uri
                                });
                            }
                            var canCloseTag = !n.firstChild;
                            if (canCloseTag && (isHTML || n.namespaceURI === NAMESPACE.HTML)) canCloseTag = isHTMLVoidElement(nodeName);
                            if (canCloseTag) {
                                buf.push('/>');
                                return null;
                            }
                            buf.push('>');
                            if (isHTML && isHTMLRawTextElement(nodeName)) {
                                var child = n.firstChild;
                                while(child){
                                    if (child.data) buf.push(child.data);
                                    else serializeToString(child, buf, childNamespaces.slice(), opts);
                                    child = child.nextSibling;
                                }
                                buf.push('</', prefixedNodeName, '>');
                                return null;
                            }
                            return {
                                ns: childNamespaces,
                                tag: prefixedNodeName
                            };
                        case DOCUMENT_NODE:
                        case DOCUMENT_FRAGMENT_NODE:
                            if (requireWellFormed && n.nodeType === DOCUMENT_NODE && null == n.documentElement) throw new DOMException('The Document has no documentElement', DOMExceptionName.InvalidStateError);
                            return {
                                ns: namespaces
                            };
                        case ATTRIBUTE_NODE:
                            addSerializedAttribute(buf, n.name, n.value);
                            return null;
                        case TEXT_NODE:
                            if (requireWellFormed && g.InvalidChar.test(n.data)) throw new DOMException('The Text node data contains characters outside the XML Char production', DOMExceptionName.InvalidStateError);
                            buf.push(n.data.replace(/[<&>]/g, _xmlEncoder));
                            return null;
                        case CDATA_SECTION_NODE:
                            if (requireWellFormed && -1 !== n.data.indexOf(']]>')) throw new DOMException('The CDATASection data contains "]]>"', DOMExceptionName.InvalidStateError);
                            if (splitCDATASections) buf.push(g.CDATA_START, n.data.replace(/]]>/g, ']]]]><![CDATA[>'), g.CDATA_END);
                            else buf.push(g.CDATA_START, n.data, g.CDATA_END);
                            return null;
                        case COMMENT_NODE:
                            if (requireWellFormed) {
                                if (g.InvalidChar.test(n.data)) throw new DOMException('The comment node data contains characters outside the XML Char production', DOMExceptionName.InvalidStateError);
                                if (-1 !== n.data.indexOf('--') || '-' === n.data[n.data.length - 1]) throw new DOMException('The comment node data contains "--" or ends with "-"', DOMExceptionName.InvalidStateError);
                            }
                            buf.push(g.COMMENT_START, n.data, g.COMMENT_END);
                            return null;
                        case DOCUMENT_TYPE_NODE:
                            var pubid = n.publicId;
                            var sysid = n.systemId;
                            if (requireWellFormed) {
                                if (pubid && !g.PubidLiteral_match.test(pubid)) throw new DOMException('DocumentType publicId is not a valid PubidLiteral', DOMExceptionName.InvalidStateError);
                                if (sysid && '.' !== sysid && !g.SystemLiteral_match.test(sysid)) throw new DOMException('DocumentType systemId is not a valid SystemLiteral', DOMExceptionName.InvalidStateError);
                                if (n.internalSubset && -1 !== n.internalSubset.indexOf(']>')) throw new DOMException('DocumentType internalSubset contains "]>"', DOMExceptionName.InvalidStateError);
                            }
                            buf.push(g.DOCTYPE_DECL_START, ' ', n.name);
                            if (pubid) {
                                buf.push(' ', g.PUBLIC, ' ', pubid);
                                if (sysid && '.' !== sysid) buf.push(' ', sysid);
                            } else if (sysid && '.' !== sysid) buf.push(' ', g.SYSTEM, ' ', sysid);
                            if (n.internalSubset) buf.push(' [', n.internalSubset, ']');
                            buf.push('>');
                            return null;
                        case PROCESSING_INSTRUCTION_NODE:
                            if (requireWellFormed) {
                                if (-1 !== n.target.indexOf(':') || 'xml' === n.target.toLowerCase()) throw new DOMException('The ProcessingInstruction target is not well-formed', DOMExceptionName.InvalidStateError);
                                if (g.InvalidChar.test(n.data)) throw new DOMException('The ProcessingInstruction data contains characters outside the XML Char production', DOMExceptionName.InvalidStateError);
                                if (-1 !== n.data.indexOf('?>')) throw new DOMException('The ProcessingInstruction data contains "?>"', DOMExceptionName.InvalidStateError);
                            }
                            buf.push('<?', n.target, ' ', n.data, '?>');
                            return null;
                        case ENTITY_REFERENCE_NODE:
                            buf.push('&', n.nodeName, ';');
                            return null;
                        default:
                            buf.push('??', n.nodeName);
                            return null;
                    }
                },
                exit: function(n, childCtx) {
                    if (childCtx && childCtx.tag) buf.push('</', childCtx.tag, '>');
                }
            });
        }
        function importNode(doc, node, deep) {
            var destRoot;
            walkDOM(node, null, {
                enter: function(srcNode, destParent) {
                    var destNode = srcNode.cloneNode(false);
                    destNode.ownerDocument = doc;
                    destNode.parentNode = null;
                    if (null === destParent) destRoot = destNode;
                    else destParent.appendChild(destNode);
                    var shouldDeep = srcNode.nodeType === ATTRIBUTE_NODE || deep;
                    return shouldDeep ? destNode : null;
                }
            });
            return destRoot;
        }
        function cloneNode(doc, node, deep) {
            var destRoot;
            walkDOM(node, null, {
                enter: function(srcNode, destParent) {
                    var destNode = new srcNode.constructor(PDC);
                    for(var n in srcNode)if (hasOwn(srcNode, n)) {
                        var v = srcNode[n];
                        if ('object' != typeof v) {
                            if (v != destNode[n]) destNode[n] = v;
                        }
                    }
                    if (srcNode.childNodes) destNode.childNodes = new NodeList();
                    destNode.ownerDocument = doc;
                    var shouldDeep = deep;
                    switch(destNode.nodeType){
                        case ELEMENT_NODE:
                            var attrs = srcNode.attributes;
                            var attrs2 = destNode.attributes = new NamedNodeMap();
                            var len = attrs.length;
                            attrs2._ownerElement = destNode;
                            for(var i = 0; i < len; i++)destNode.setAttributeNode(cloneNode(doc, attrs.item(i), true));
                            break;
                        case ATTRIBUTE_NODE:
                            shouldDeep = true;
                    }
                    if (null !== destParent) destParent.appendChild(destNode);
                    else destRoot = destNode;
                    return shouldDeep ? destNode : null;
                }
            });
            return destRoot;
        }
        function __set__(object, key, value) {
            object[key] = value;
        }
        function childrenRefresh(node) {
            var ls = [];
            var child = node.firstChild;
            while(child){
                if (child.nodeType === ELEMENT_NODE) ls.push(child);
                child = child.nextSibling;
            }
            return ls;
        }
        try {
            if (Object.defineProperty) {
                Object.defineProperty(LiveNodeList.prototype, 'length', {
                    get: function() {
                        _updateLiveList(this);
                        return this.$$length;
                    }
                });
                Object.defineProperty(Node.prototype, 'textContent', {
                    get: function() {
                        if (this.nodeType === ELEMENT_NODE || this.nodeType === DOCUMENT_FRAGMENT_NODE) {
                            var buf = [];
                            walkDOM(this, null, {
                                enter: function(n) {
                                    if (n.nodeType === ELEMENT_NODE || n.nodeType === DOCUMENT_FRAGMENT_NODE) return true;
                                    if (n.nodeType === PROCESSING_INSTRUCTION_NODE || n.nodeType === COMMENT_NODE) return null;
                                    buf.push(n.nodeValue);
                                }
                            });
                            return buf.join('');
                        }
                        return this.nodeValue;
                    },
                    set: function(data) {
                        switch(this.nodeType){
                            case ELEMENT_NODE:
                            case DOCUMENT_FRAGMENT_NODE:
                                while(this.firstChild)this.removeChild(this.firstChild);
                                if (data || String(data)) this.appendChild(this.ownerDocument.createTextNode(data));
                                break;
                            default:
                                this.data = data;
                                this.value = data;
                                this.nodeValue = data;
                        }
                    }
                });
                Object.defineProperty(Element.prototype, 'children', {
                    get: function() {
                        return new LiveNodeList(this, childrenRefresh);
                    }
                });
                Object.defineProperty(Document.prototype, 'children', {
                    get: function() {
                        return new LiveNodeList(this, childrenRefresh);
                    }
                });
                Object.defineProperty(DocumentFragment.prototype, 'children', {
                    get: function() {
                        return new LiveNodeList(this, childrenRefresh);
                    }
                });
                __set__ = function(object, key, value) {
                    object['$$' + key] = value;
                };
            }
        } catch (e) {}
        exports._updateLiveList = _updateLiveList;
        exports.Attr = Attr;
        exports.CDATASection = CDATASection;
        exports.CharacterData = CharacterData;
        exports.Comment = Comment;
        exports.Document = Document;
        exports.DocumentFragment = DocumentFragment;
        exports.DocumentType = DocumentType;
        exports.DOMImplementation = DOMImplementation;
        exports.Element = Element;
        exports.Entity = Entity;
        exports.EntityReference = EntityReference;
        exports.LiveNodeList = LiveNodeList;
        exports.NamedNodeMap = NamedNodeMap;
        exports.Node = Node;
        exports.NodeList = NodeList;
        exports.Notation = Notation;
        exports.Text = Text;
        exports.ProcessingInstruction = ProcessingInstruction;
        exports.walkDOM = walkDOM;
        exports.XMLSerializer = XMLSerializer;
    },
    "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/entities.js" (__unused_rspack_module, exports, __webpack_require__) {
        var freeze = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/conventions.js").freeze;
        exports.XML_ENTITIES = freeze({
            amp: '&',
            apos: "'",
            gt: '>',
            lt: '<',
            quot: '"'
        });
        exports.HTML_ENTITIES = freeze({
            Aacute: '\u00C1',
            aacute: '\u00E1',
            Abreve: '\u0102',
            abreve: '\u0103',
            ac: '\u223E',
            acd: '\u223F',
            acE: '\u223E\u0333',
            Acirc: '\u00C2',
            acirc: '\u00E2',
            acute: '\u00B4',
            Acy: '\u0410',
            acy: '\u0430',
            AElig: '\u00C6',
            aelig: '\u00E6',
            af: '\u2061',
            Afr: '\uD835\uDD04',
            afr: '\uD835\uDD1E',
            Agrave: '\u00C0',
            agrave: '\u00E0',
            alefsym: '\u2135',
            aleph: '\u2135',
            Alpha: '\u0391',
            alpha: '\u03B1',
            Amacr: '\u0100',
            amacr: '\u0101',
            amalg: '\u2A3F',
            AMP: '\u0026',
            amp: '\u0026',
            And: '\u2A53',
            and: '\u2227',
            andand: '\u2A55',
            andd: '\u2A5C',
            andslope: '\u2A58',
            andv: '\u2A5A',
            ang: '\u2220',
            ange: '\u29A4',
            angle: '\u2220',
            angmsd: '\u2221',
            angmsdaa: '\u29A8',
            angmsdab: '\u29A9',
            angmsdac: '\u29AA',
            angmsdad: '\u29AB',
            angmsdae: '\u29AC',
            angmsdaf: '\u29AD',
            angmsdag: '\u29AE',
            angmsdah: '\u29AF',
            angrt: '\u221F',
            angrtvb: '\u22BE',
            angrtvbd: '\u299D',
            angsph: '\u2222',
            angst: '\u00C5',
            angzarr: '\u237C',
            Aogon: '\u0104',
            aogon: '\u0105',
            Aopf: '\uD835\uDD38',
            aopf: '\uD835\uDD52',
            ap: '\u2248',
            apacir: '\u2A6F',
            apE: '\u2A70',
            ape: '\u224A',
            apid: '\u224B',
            apos: '\u0027',
            ApplyFunction: '\u2061',
            approx: '\u2248',
            approxeq: '\u224A',
            Aring: '\u00C5',
            aring: '\u00E5',
            Ascr: '\uD835\uDC9C',
            ascr: '\uD835\uDCB6',
            Assign: '\u2254',
            ast: '\u002A',
            asymp: '\u2248',
            asympeq: '\u224D',
            Atilde: '\u00C3',
            atilde: '\u00E3',
            Auml: '\u00C4',
            auml: '\u00E4',
            awconint: '\u2233',
            awint: '\u2A11',
            backcong: '\u224C',
            backepsilon: '\u03F6',
            backprime: '\u2035',
            backsim: '\u223D',
            backsimeq: '\u22CD',
            Backslash: '\u2216',
            Barv: '\u2AE7',
            barvee: '\u22BD',
            Barwed: '\u2306',
            barwed: '\u2305',
            barwedge: '\u2305',
            bbrk: '\u23B5',
            bbrktbrk: '\u23B6',
            bcong: '\u224C',
            Bcy: '\u0411',
            bcy: '\u0431',
            bdquo: '\u201E',
            becaus: '\u2235',
            Because: '\u2235',
            because: '\u2235',
            bemptyv: '\u29B0',
            bepsi: '\u03F6',
            bernou: '\u212C',
            Bernoullis: '\u212C',
            Beta: '\u0392',
            beta: '\u03B2',
            beth: '\u2136',
            between: '\u226C',
            Bfr: '\uD835\uDD05',
            bfr: '\uD835\uDD1F',
            bigcap: '\u22C2',
            bigcirc: '\u25EF',
            bigcup: '\u22C3',
            bigodot: '\u2A00',
            bigoplus: '\u2A01',
            bigotimes: '\u2A02',
            bigsqcup: '\u2A06',
            bigstar: '\u2605',
            bigtriangledown: '\u25BD',
            bigtriangleup: '\u25B3',
            biguplus: '\u2A04',
            bigvee: '\u22C1',
            bigwedge: '\u22C0',
            bkarow: '\u290D',
            blacklozenge: '\u29EB',
            blacksquare: '\u25AA',
            blacktriangle: '\u25B4',
            blacktriangledown: '\u25BE',
            blacktriangleleft: '\u25C2',
            blacktriangleright: '\u25B8',
            blank: '\u2423',
            blk12: '\u2592',
            blk14: '\u2591',
            blk34: '\u2593',
            block: '\u2588',
            bne: '\u003D\u20E5',
            bnequiv: '\u2261\u20E5',
            bNot: '\u2AED',
            bnot: '\u2310',
            Bopf: '\uD835\uDD39',
            bopf: '\uD835\uDD53',
            bot: '\u22A5',
            bottom: '\u22A5',
            bowtie: '\u22C8',
            boxbox: '\u29C9',
            boxDL: '\u2557',
            boxDl: '\u2556',
            boxdL: '\u2555',
            boxdl: '\u2510',
            boxDR: '\u2554',
            boxDr: '\u2553',
            boxdR: '\u2552',
            boxdr: '\u250C',
            boxH: '\u2550',
            boxh: '\u2500',
            boxHD: '\u2566',
            boxHd: '\u2564',
            boxhD: '\u2565',
            boxhd: '\u252C',
            boxHU: '\u2569',
            boxHu: '\u2567',
            boxhU: '\u2568',
            boxhu: '\u2534',
            boxminus: '\u229F',
            boxplus: '\u229E',
            boxtimes: '\u22A0',
            boxUL: '\u255D',
            boxUl: '\u255C',
            boxuL: '\u255B',
            boxul: '\u2518',
            boxUR: '\u255A',
            boxUr: '\u2559',
            boxuR: '\u2558',
            boxur: '\u2514',
            boxV: '\u2551',
            boxv: '\u2502',
            boxVH: '\u256C',
            boxVh: '\u256B',
            boxvH: '\u256A',
            boxvh: '\u253C',
            boxVL: '\u2563',
            boxVl: '\u2562',
            boxvL: '\u2561',
            boxvl: '\u2524',
            boxVR: '\u2560',
            boxVr: '\u255F',
            boxvR: '\u255E',
            boxvr: '\u251C',
            bprime: '\u2035',
            Breve: '\u02D8',
            breve: '\u02D8',
            brvbar: '\u00A6',
            Bscr: '\u212C',
            bscr: '\uD835\uDCB7',
            bsemi: '\u204F',
            bsim: '\u223D',
            bsime: '\u22CD',
            bsol: '\u005C',
            bsolb: '\u29C5',
            bsolhsub: '\u27C8',
            bull: '\u2022',
            bullet: '\u2022',
            bump: '\u224E',
            bumpE: '\u2AAE',
            bumpe: '\u224F',
            Bumpeq: '\u224E',
            bumpeq: '\u224F',
            Cacute: '\u0106',
            cacute: '\u0107',
            Cap: '\u22D2',
            cap: '\u2229',
            capand: '\u2A44',
            capbrcup: '\u2A49',
            capcap: '\u2A4B',
            capcup: '\u2A47',
            capdot: '\u2A40',
            CapitalDifferentialD: '\u2145',
            caps: '\u2229\uFE00',
            caret: '\u2041',
            caron: '\u02C7',
            Cayleys: '\u212D',
            ccaps: '\u2A4D',
            Ccaron: '\u010C',
            ccaron: '\u010D',
            Ccedil: '\u00C7',
            ccedil: '\u00E7',
            Ccirc: '\u0108',
            ccirc: '\u0109',
            Cconint: '\u2230',
            ccups: '\u2A4C',
            ccupssm: '\u2A50',
            Cdot: '\u010A',
            cdot: '\u010B',
            cedil: '\u00B8',
            Cedilla: '\u00B8',
            cemptyv: '\u29B2',
            cent: '\u00A2',
            CenterDot: '\u00B7',
            centerdot: '\u00B7',
            Cfr: '\u212D',
            cfr: '\uD835\uDD20',
            CHcy: '\u0427',
            chcy: '\u0447',
            check: '\u2713',
            checkmark: '\u2713',
            Chi: '\u03A7',
            chi: '\u03C7',
            cir: '\u25CB',
            circ: '\u02C6',
            circeq: '\u2257',
            circlearrowleft: '\u21BA',
            circlearrowright: '\u21BB',
            circledast: '\u229B',
            circledcirc: '\u229A',
            circleddash: '\u229D',
            CircleDot: '\u2299',
            circledR: '\u00AE',
            circledS: '\u24C8',
            CircleMinus: '\u2296',
            CirclePlus: '\u2295',
            CircleTimes: '\u2297',
            cirE: '\u29C3',
            cire: '\u2257',
            cirfnint: '\u2A10',
            cirmid: '\u2AEF',
            cirscir: '\u29C2',
            ClockwiseContourIntegral: '\u2232',
            CloseCurlyDoubleQuote: '\u201D',
            CloseCurlyQuote: '\u2019',
            clubs: '\u2663',
            clubsuit: '\u2663',
            Colon: '\u2237',
            colon: '\u003A',
            Colone: '\u2A74',
            colone: '\u2254',
            coloneq: '\u2254',
            comma: '\u002C',
            commat: '\u0040',
            comp: '\u2201',
            compfn: '\u2218',
            complement: '\u2201',
            complexes: '\u2102',
            cong: '\u2245',
            congdot: '\u2A6D',
            Congruent: '\u2261',
            Conint: '\u222F',
            conint: '\u222E',
            ContourIntegral: '\u222E',
            Copf: '\u2102',
            copf: '\uD835\uDD54',
            coprod: '\u2210',
            Coproduct: '\u2210',
            COPY: '\u00A9',
            copy: '\u00A9',
            copysr: '\u2117',
            CounterClockwiseContourIntegral: '\u2233',
            crarr: '\u21B5',
            Cross: '\u2A2F',
            cross: '\u2717',
            Cscr: '\uD835\uDC9E',
            cscr: '\uD835\uDCB8',
            csub: '\u2ACF',
            csube: '\u2AD1',
            csup: '\u2AD0',
            csupe: '\u2AD2',
            ctdot: '\u22EF',
            cudarrl: '\u2938',
            cudarrr: '\u2935',
            cuepr: '\u22DE',
            cuesc: '\u22DF',
            cularr: '\u21B6',
            cularrp: '\u293D',
            Cup: '\u22D3',
            cup: '\u222A',
            cupbrcap: '\u2A48',
            CupCap: '\u224D',
            cupcap: '\u2A46',
            cupcup: '\u2A4A',
            cupdot: '\u228D',
            cupor: '\u2A45',
            cups: '\u222A\uFE00',
            curarr: '\u21B7',
            curarrm: '\u293C',
            curlyeqprec: '\u22DE',
            curlyeqsucc: '\u22DF',
            curlyvee: '\u22CE',
            curlywedge: '\u22CF',
            curren: '\u00A4',
            curvearrowleft: '\u21B6',
            curvearrowright: '\u21B7',
            cuvee: '\u22CE',
            cuwed: '\u22CF',
            cwconint: '\u2232',
            cwint: '\u2231',
            cylcty: '\u232D',
            Dagger: '\u2021',
            dagger: '\u2020',
            daleth: '\u2138',
            Darr: '\u21A1',
            dArr: '\u21D3',
            darr: '\u2193',
            dash: '\u2010',
            Dashv: '\u2AE4',
            dashv: '\u22A3',
            dbkarow: '\u290F',
            dblac: '\u02DD',
            Dcaron: '\u010E',
            dcaron: '\u010F',
            Dcy: '\u0414',
            dcy: '\u0434',
            DD: '\u2145',
            dd: '\u2146',
            ddagger: '\u2021',
            ddarr: '\u21CA',
            DDotrahd: '\u2911',
            ddotseq: '\u2A77',
            deg: '\u00B0',
            Del: '\u2207',
            Delta: '\u0394',
            delta: '\u03B4',
            demptyv: '\u29B1',
            dfisht: '\u297F',
            Dfr: '\uD835\uDD07',
            dfr: '\uD835\uDD21',
            dHar: '\u2965',
            dharl: '\u21C3',
            dharr: '\u21C2',
            DiacriticalAcute: '\u00B4',
            DiacriticalDot: '\u02D9',
            DiacriticalDoubleAcute: '\u02DD',
            DiacriticalGrave: '\u0060',
            DiacriticalTilde: '\u02DC',
            diam: '\u22C4',
            Diamond: '\u22C4',
            diamond: '\u22C4',
            diamondsuit: '\u2666',
            diams: '\u2666',
            die: '\u00A8',
            DifferentialD: '\u2146',
            digamma: '\u03DD',
            disin: '\u22F2',
            div: '\u00F7',
            divide: '\u00F7',
            divideontimes: '\u22C7',
            divonx: '\u22C7',
            DJcy: '\u0402',
            djcy: '\u0452',
            dlcorn: '\u231E',
            dlcrop: '\u230D',
            dollar: '\u0024',
            Dopf: '\uD835\uDD3B',
            dopf: '\uD835\uDD55',
            Dot: '\u00A8',
            dot: '\u02D9',
            DotDot: '\u20DC',
            doteq: '\u2250',
            doteqdot: '\u2251',
            DotEqual: '\u2250',
            dotminus: '\u2238',
            dotplus: '\u2214',
            dotsquare: '\u22A1',
            doublebarwedge: '\u2306',
            DoubleContourIntegral: '\u222F',
            DoubleDot: '\u00A8',
            DoubleDownArrow: '\u21D3',
            DoubleLeftArrow: '\u21D0',
            DoubleLeftRightArrow: '\u21D4',
            DoubleLeftTee: '\u2AE4',
            DoubleLongLeftArrow: '\u27F8',
            DoubleLongLeftRightArrow: '\u27FA',
            DoubleLongRightArrow: '\u27F9',
            DoubleRightArrow: '\u21D2',
            DoubleRightTee: '\u22A8',
            DoubleUpArrow: '\u21D1',
            DoubleUpDownArrow: '\u21D5',
            DoubleVerticalBar: '\u2225',
            DownArrow: '\u2193',
            Downarrow: '\u21D3',
            downarrow: '\u2193',
            DownArrowBar: '\u2913',
            DownArrowUpArrow: '\u21F5',
            DownBreve: '\u0311',
            downdownarrows: '\u21CA',
            downharpoonleft: '\u21C3',
            downharpoonright: '\u21C2',
            DownLeftRightVector: '\u2950',
            DownLeftTeeVector: '\u295E',
            DownLeftVector: '\u21BD',
            DownLeftVectorBar: '\u2956',
            DownRightTeeVector: '\u295F',
            DownRightVector: '\u21C1',
            DownRightVectorBar: '\u2957',
            DownTee: '\u22A4',
            DownTeeArrow: '\u21A7',
            drbkarow: '\u2910',
            drcorn: '\u231F',
            drcrop: '\u230C',
            Dscr: '\uD835\uDC9F',
            dscr: '\uD835\uDCB9',
            DScy: '\u0405',
            dscy: '\u0455',
            dsol: '\u29F6',
            Dstrok: '\u0110',
            dstrok: '\u0111',
            dtdot: '\u22F1',
            dtri: '\u25BF',
            dtrif: '\u25BE',
            duarr: '\u21F5',
            duhar: '\u296F',
            dwangle: '\u29A6',
            DZcy: '\u040F',
            dzcy: '\u045F',
            dzigrarr: '\u27FF',
            Eacute: '\u00C9',
            eacute: '\u00E9',
            easter: '\u2A6E',
            Ecaron: '\u011A',
            ecaron: '\u011B',
            ecir: '\u2256',
            Ecirc: '\u00CA',
            ecirc: '\u00EA',
            ecolon: '\u2255',
            Ecy: '\u042D',
            ecy: '\u044D',
            eDDot: '\u2A77',
            Edot: '\u0116',
            eDot: '\u2251',
            edot: '\u0117',
            ee: '\u2147',
            efDot: '\u2252',
            Efr: '\uD835\uDD08',
            efr: '\uD835\uDD22',
            eg: '\u2A9A',
            Egrave: '\u00C8',
            egrave: '\u00E8',
            egs: '\u2A96',
            egsdot: '\u2A98',
            el: '\u2A99',
            Element: '\u2208',
            elinters: '\u23E7',
            ell: '\u2113',
            els: '\u2A95',
            elsdot: '\u2A97',
            Emacr: '\u0112',
            emacr: '\u0113',
            empty: '\u2205',
            emptyset: '\u2205',
            EmptySmallSquare: '\u25FB',
            emptyv: '\u2205',
            EmptyVerySmallSquare: '\u25AB',
            emsp: '\u2003',
            emsp13: '\u2004',
            emsp14: '\u2005',
            ENG: '\u014A',
            eng: '\u014B',
            ensp: '\u2002',
            Eogon: '\u0118',
            eogon: '\u0119',
            Eopf: '\uD835\uDD3C',
            eopf: '\uD835\uDD56',
            epar: '\u22D5',
            eparsl: '\u29E3',
            eplus: '\u2A71',
            epsi: '\u03B5',
            Epsilon: '\u0395',
            epsilon: '\u03B5',
            epsiv: '\u03F5',
            eqcirc: '\u2256',
            eqcolon: '\u2255',
            eqsim: '\u2242',
            eqslantgtr: '\u2A96',
            eqslantless: '\u2A95',
            Equal: '\u2A75',
            equals: '\u003D',
            EqualTilde: '\u2242',
            equest: '\u225F',
            Equilibrium: '\u21CC',
            equiv: '\u2261',
            equivDD: '\u2A78',
            eqvparsl: '\u29E5',
            erarr: '\u2971',
            erDot: '\u2253',
            Escr: '\u2130',
            escr: '\u212F',
            esdot: '\u2250',
            Esim: '\u2A73',
            esim: '\u2242',
            Eta: '\u0397',
            eta: '\u03B7',
            ETH: '\u00D0',
            eth: '\u00F0',
            Euml: '\u00CB',
            euml: '\u00EB',
            euro: '\u20AC',
            excl: '\u0021',
            exist: '\u2203',
            Exists: '\u2203',
            expectation: '\u2130',
            ExponentialE: '\u2147',
            exponentiale: '\u2147',
            fallingdotseq: '\u2252',
            Fcy: '\u0424',
            fcy: '\u0444',
            female: '\u2640',
            ffilig: '\uFB03',
            fflig: '\uFB00',
            ffllig: '\uFB04',
            Ffr: '\uD835\uDD09',
            ffr: '\uD835\uDD23',
            filig: '\uFB01',
            FilledSmallSquare: '\u25FC',
            FilledVerySmallSquare: '\u25AA',
            fjlig: '\u0066\u006A',
            flat: '\u266D',
            fllig: '\uFB02',
            fltns: '\u25B1',
            fnof: '\u0192',
            Fopf: '\uD835\uDD3D',
            fopf: '\uD835\uDD57',
            ForAll: '\u2200',
            forall: '\u2200',
            fork: '\u22D4',
            forkv: '\u2AD9',
            Fouriertrf: '\u2131',
            fpartint: '\u2A0D',
            frac12: '\u00BD',
            frac13: '\u2153',
            frac14: '\u00BC',
            frac15: '\u2155',
            frac16: '\u2159',
            frac18: '\u215B',
            frac23: '\u2154',
            frac25: '\u2156',
            frac34: '\u00BE',
            frac35: '\u2157',
            frac38: '\u215C',
            frac45: '\u2158',
            frac56: '\u215A',
            frac58: '\u215D',
            frac78: '\u215E',
            frasl: '\u2044',
            frown: '\u2322',
            Fscr: '\u2131',
            fscr: '\uD835\uDCBB',
            gacute: '\u01F5',
            Gamma: '\u0393',
            gamma: '\u03B3',
            Gammad: '\u03DC',
            gammad: '\u03DD',
            gap: '\u2A86',
            Gbreve: '\u011E',
            gbreve: '\u011F',
            Gcedil: '\u0122',
            Gcirc: '\u011C',
            gcirc: '\u011D',
            Gcy: '\u0413',
            gcy: '\u0433',
            Gdot: '\u0120',
            gdot: '\u0121',
            gE: '\u2267',
            ge: '\u2265',
            gEl: '\u2A8C',
            gel: '\u22DB',
            geq: '\u2265',
            geqq: '\u2267',
            geqslant: '\u2A7E',
            ges: '\u2A7E',
            gescc: '\u2AA9',
            gesdot: '\u2A80',
            gesdoto: '\u2A82',
            gesdotol: '\u2A84',
            gesl: '\u22DB\uFE00',
            gesles: '\u2A94',
            Gfr: '\uD835\uDD0A',
            gfr: '\uD835\uDD24',
            Gg: '\u22D9',
            gg: '\u226B',
            ggg: '\u22D9',
            gimel: '\u2137',
            GJcy: '\u0403',
            gjcy: '\u0453',
            gl: '\u2277',
            gla: '\u2AA5',
            glE: '\u2A92',
            glj: '\u2AA4',
            gnap: '\u2A8A',
            gnapprox: '\u2A8A',
            gnE: '\u2269',
            gne: '\u2A88',
            gneq: '\u2A88',
            gneqq: '\u2269',
            gnsim: '\u22E7',
            Gopf: '\uD835\uDD3E',
            gopf: '\uD835\uDD58',
            grave: '\u0060',
            GreaterEqual: '\u2265',
            GreaterEqualLess: '\u22DB',
            GreaterFullEqual: '\u2267',
            GreaterGreater: '\u2AA2',
            GreaterLess: '\u2277',
            GreaterSlantEqual: '\u2A7E',
            GreaterTilde: '\u2273',
            Gscr: '\uD835\uDCA2',
            gscr: '\u210A',
            gsim: '\u2273',
            gsime: '\u2A8E',
            gsiml: '\u2A90',
            Gt: '\u226B',
            GT: '\u003E',
            gt: '\u003E',
            gtcc: '\u2AA7',
            gtcir: '\u2A7A',
            gtdot: '\u22D7',
            gtlPar: '\u2995',
            gtquest: '\u2A7C',
            gtrapprox: '\u2A86',
            gtrarr: '\u2978',
            gtrdot: '\u22D7',
            gtreqless: '\u22DB',
            gtreqqless: '\u2A8C',
            gtrless: '\u2277',
            gtrsim: '\u2273',
            gvertneqq: '\u2269\uFE00',
            gvnE: '\u2269\uFE00',
            Hacek: '\u02C7',
            hairsp: '\u200A',
            half: '\u00BD',
            hamilt: '\u210B',
            HARDcy: '\u042A',
            hardcy: '\u044A',
            hArr: '\u21D4',
            harr: '\u2194',
            harrcir: '\u2948',
            harrw: '\u21AD',
            Hat: '\u005E',
            hbar: '\u210F',
            Hcirc: '\u0124',
            hcirc: '\u0125',
            hearts: '\u2665',
            heartsuit: '\u2665',
            hellip: '\u2026',
            hercon: '\u22B9',
            Hfr: '\u210C',
            hfr: '\uD835\uDD25',
            HilbertSpace: '\u210B',
            hksearow: '\u2925',
            hkswarow: '\u2926',
            hoarr: '\u21FF',
            homtht: '\u223B',
            hookleftarrow: '\u21A9',
            hookrightarrow: '\u21AA',
            Hopf: '\u210D',
            hopf: '\uD835\uDD59',
            horbar: '\u2015',
            HorizontalLine: '\u2500',
            Hscr: '\u210B',
            hscr: '\uD835\uDCBD',
            hslash: '\u210F',
            Hstrok: '\u0126',
            hstrok: '\u0127',
            HumpDownHump: '\u224E',
            HumpEqual: '\u224F',
            hybull: '\u2043',
            hyphen: '\u2010',
            Iacute: '\u00CD',
            iacute: '\u00ED',
            ic: '\u2063',
            Icirc: '\u00CE',
            icirc: '\u00EE',
            Icy: '\u0418',
            icy: '\u0438',
            Idot: '\u0130',
            IEcy: '\u0415',
            iecy: '\u0435',
            iexcl: '\u00A1',
            iff: '\u21D4',
            Ifr: '\u2111',
            ifr: '\uD835\uDD26',
            Igrave: '\u00CC',
            igrave: '\u00EC',
            ii: '\u2148',
            iiiint: '\u2A0C',
            iiint: '\u222D',
            iinfin: '\u29DC',
            iiota: '\u2129',
            IJlig: '\u0132',
            ijlig: '\u0133',
            Im: '\u2111',
            Imacr: '\u012A',
            imacr: '\u012B',
            image: '\u2111',
            ImaginaryI: '\u2148',
            imagline: '\u2110',
            imagpart: '\u2111',
            imath: '\u0131',
            imof: '\u22B7',
            imped: '\u01B5',
            Implies: '\u21D2',
            in: '\u2208',
            incare: '\u2105',
            infin: '\u221E',
            infintie: '\u29DD',
            inodot: '\u0131',
            Int: '\u222C',
            int: '\u222B',
            intcal: '\u22BA',
            integers: '\u2124',
            Integral: '\u222B',
            intercal: '\u22BA',
            Intersection: '\u22C2',
            intlarhk: '\u2A17',
            intprod: '\u2A3C',
            InvisibleComma: '\u2063',
            InvisibleTimes: '\u2062',
            IOcy: '\u0401',
            iocy: '\u0451',
            Iogon: '\u012E',
            iogon: '\u012F',
            Iopf: '\uD835\uDD40',
            iopf: '\uD835\uDD5A',
            Iota: '\u0399',
            iota: '\u03B9',
            iprod: '\u2A3C',
            iquest: '\u00BF',
            Iscr: '\u2110',
            iscr: '\uD835\uDCBE',
            isin: '\u2208',
            isindot: '\u22F5',
            isinE: '\u22F9',
            isins: '\u22F4',
            isinsv: '\u22F3',
            isinv: '\u2208',
            it: '\u2062',
            Itilde: '\u0128',
            itilde: '\u0129',
            Iukcy: '\u0406',
            iukcy: '\u0456',
            Iuml: '\u00CF',
            iuml: '\u00EF',
            Jcirc: '\u0134',
            jcirc: '\u0135',
            Jcy: '\u0419',
            jcy: '\u0439',
            Jfr: '\uD835\uDD0D',
            jfr: '\uD835\uDD27',
            jmath: '\u0237',
            Jopf: '\uD835\uDD41',
            jopf: '\uD835\uDD5B',
            Jscr: '\uD835\uDCA5',
            jscr: '\uD835\uDCBF',
            Jsercy: '\u0408',
            jsercy: '\u0458',
            Jukcy: '\u0404',
            jukcy: '\u0454',
            Kappa: '\u039A',
            kappa: '\u03BA',
            kappav: '\u03F0',
            Kcedil: '\u0136',
            kcedil: '\u0137',
            Kcy: '\u041A',
            kcy: '\u043A',
            Kfr: '\uD835\uDD0E',
            kfr: '\uD835\uDD28',
            kgreen: '\u0138',
            KHcy: '\u0425',
            khcy: '\u0445',
            KJcy: '\u040C',
            kjcy: '\u045C',
            Kopf: '\uD835\uDD42',
            kopf: '\uD835\uDD5C',
            Kscr: '\uD835\uDCA6',
            kscr: '\uD835\uDCC0',
            lAarr: '\u21DA',
            Lacute: '\u0139',
            lacute: '\u013A',
            laemptyv: '\u29B4',
            lagran: '\u2112',
            Lambda: '\u039B',
            lambda: '\u03BB',
            Lang: '\u27EA',
            lang: '\u27E8',
            langd: '\u2991',
            langle: '\u27E8',
            lap: '\u2A85',
            Laplacetrf: '\u2112',
            laquo: '\u00AB',
            Larr: '\u219E',
            lArr: '\u21D0',
            larr: '\u2190',
            larrb: '\u21E4',
            larrbfs: '\u291F',
            larrfs: '\u291D',
            larrhk: '\u21A9',
            larrlp: '\u21AB',
            larrpl: '\u2939',
            larrsim: '\u2973',
            larrtl: '\u21A2',
            lat: '\u2AAB',
            lAtail: '\u291B',
            latail: '\u2919',
            late: '\u2AAD',
            lates: '\u2AAD\uFE00',
            lBarr: '\u290E',
            lbarr: '\u290C',
            lbbrk: '\u2772',
            lbrace: '\u007B',
            lbrack: '\u005B',
            lbrke: '\u298B',
            lbrksld: '\u298F',
            lbrkslu: '\u298D',
            Lcaron: '\u013D',
            lcaron: '\u013E',
            Lcedil: '\u013B',
            lcedil: '\u013C',
            lceil: '\u2308',
            lcub: '\u007B',
            Lcy: '\u041B',
            lcy: '\u043B',
            ldca: '\u2936',
            ldquo: '\u201C',
            ldquor: '\u201E',
            ldrdhar: '\u2967',
            ldrushar: '\u294B',
            ldsh: '\u21B2',
            lE: '\u2266',
            le: '\u2264',
            LeftAngleBracket: '\u27E8',
            LeftArrow: '\u2190',
            Leftarrow: '\u21D0',
            leftarrow: '\u2190',
            LeftArrowBar: '\u21E4',
            LeftArrowRightArrow: '\u21C6',
            leftarrowtail: '\u21A2',
            LeftCeiling: '\u2308',
            LeftDoubleBracket: '\u27E6',
            LeftDownTeeVector: '\u2961',
            LeftDownVector: '\u21C3',
            LeftDownVectorBar: '\u2959',
            LeftFloor: '\u230A',
            leftharpoondown: '\u21BD',
            leftharpoonup: '\u21BC',
            leftleftarrows: '\u21C7',
            LeftRightArrow: '\u2194',
            Leftrightarrow: '\u21D4',
            leftrightarrow: '\u2194',
            leftrightarrows: '\u21C6',
            leftrightharpoons: '\u21CB',
            leftrightsquigarrow: '\u21AD',
            LeftRightVector: '\u294E',
            LeftTee: '\u22A3',
            LeftTeeArrow: '\u21A4',
            LeftTeeVector: '\u295A',
            leftthreetimes: '\u22CB',
            LeftTriangle: '\u22B2',
            LeftTriangleBar: '\u29CF',
            LeftTriangleEqual: '\u22B4',
            LeftUpDownVector: '\u2951',
            LeftUpTeeVector: '\u2960',
            LeftUpVector: '\u21BF',
            LeftUpVectorBar: '\u2958',
            LeftVector: '\u21BC',
            LeftVectorBar: '\u2952',
            lEg: '\u2A8B',
            leg: '\u22DA',
            leq: '\u2264',
            leqq: '\u2266',
            leqslant: '\u2A7D',
            les: '\u2A7D',
            lescc: '\u2AA8',
            lesdot: '\u2A7F',
            lesdoto: '\u2A81',
            lesdotor: '\u2A83',
            lesg: '\u22DA\uFE00',
            lesges: '\u2A93',
            lessapprox: '\u2A85',
            lessdot: '\u22D6',
            lesseqgtr: '\u22DA',
            lesseqqgtr: '\u2A8B',
            LessEqualGreater: '\u22DA',
            LessFullEqual: '\u2266',
            LessGreater: '\u2276',
            lessgtr: '\u2276',
            LessLess: '\u2AA1',
            lesssim: '\u2272',
            LessSlantEqual: '\u2A7D',
            LessTilde: '\u2272',
            lfisht: '\u297C',
            lfloor: '\u230A',
            Lfr: '\uD835\uDD0F',
            lfr: '\uD835\uDD29',
            lg: '\u2276',
            lgE: '\u2A91',
            lHar: '\u2962',
            lhard: '\u21BD',
            lharu: '\u21BC',
            lharul: '\u296A',
            lhblk: '\u2584',
            LJcy: '\u0409',
            ljcy: '\u0459',
            Ll: '\u22D8',
            ll: '\u226A',
            llarr: '\u21C7',
            llcorner: '\u231E',
            Lleftarrow: '\u21DA',
            llhard: '\u296B',
            lltri: '\u25FA',
            Lmidot: '\u013F',
            lmidot: '\u0140',
            lmoust: '\u23B0',
            lmoustache: '\u23B0',
            lnap: '\u2A89',
            lnapprox: '\u2A89',
            lnE: '\u2268',
            lne: '\u2A87',
            lneq: '\u2A87',
            lneqq: '\u2268',
            lnsim: '\u22E6',
            loang: '\u27EC',
            loarr: '\u21FD',
            lobrk: '\u27E6',
            LongLeftArrow: '\u27F5',
            Longleftarrow: '\u27F8',
            longleftarrow: '\u27F5',
            LongLeftRightArrow: '\u27F7',
            Longleftrightarrow: '\u27FA',
            longleftrightarrow: '\u27F7',
            longmapsto: '\u27FC',
            LongRightArrow: '\u27F6',
            Longrightarrow: '\u27F9',
            longrightarrow: '\u27F6',
            looparrowleft: '\u21AB',
            looparrowright: '\u21AC',
            lopar: '\u2985',
            Lopf: '\uD835\uDD43',
            lopf: '\uD835\uDD5D',
            loplus: '\u2A2D',
            lotimes: '\u2A34',
            lowast: '\u2217',
            lowbar: '\u005F',
            LowerLeftArrow: '\u2199',
            LowerRightArrow: '\u2198',
            loz: '\u25CA',
            lozenge: '\u25CA',
            lozf: '\u29EB',
            lpar: '\u0028',
            lparlt: '\u2993',
            lrarr: '\u21C6',
            lrcorner: '\u231F',
            lrhar: '\u21CB',
            lrhard: '\u296D',
            lrm: '\u200E',
            lrtri: '\u22BF',
            lsaquo: '\u2039',
            Lscr: '\u2112',
            lscr: '\uD835\uDCC1',
            Lsh: '\u21B0',
            lsh: '\u21B0',
            lsim: '\u2272',
            lsime: '\u2A8D',
            lsimg: '\u2A8F',
            lsqb: '\u005B',
            lsquo: '\u2018',
            lsquor: '\u201A',
            Lstrok: '\u0141',
            lstrok: '\u0142',
            Lt: '\u226A',
            LT: '\u003C',
            lt: '\u003C',
            ltcc: '\u2AA6',
            ltcir: '\u2A79',
            ltdot: '\u22D6',
            lthree: '\u22CB',
            ltimes: '\u22C9',
            ltlarr: '\u2976',
            ltquest: '\u2A7B',
            ltri: '\u25C3',
            ltrie: '\u22B4',
            ltrif: '\u25C2',
            ltrPar: '\u2996',
            lurdshar: '\u294A',
            luruhar: '\u2966',
            lvertneqq: '\u2268\uFE00',
            lvnE: '\u2268\uFE00',
            macr: '\u00AF',
            male: '\u2642',
            malt: '\u2720',
            maltese: '\u2720',
            Map: '\u2905',
            map: '\u21A6',
            mapsto: '\u21A6',
            mapstodown: '\u21A7',
            mapstoleft: '\u21A4',
            mapstoup: '\u21A5',
            marker: '\u25AE',
            mcomma: '\u2A29',
            Mcy: '\u041C',
            mcy: '\u043C',
            mdash: '\u2014',
            mDDot: '\u223A',
            measuredangle: '\u2221',
            MediumSpace: '\u205F',
            Mellintrf: '\u2133',
            Mfr: '\uD835\uDD10',
            mfr: '\uD835\uDD2A',
            mho: '\u2127',
            micro: '\u00B5',
            mid: '\u2223',
            midast: '\u002A',
            midcir: '\u2AF0',
            middot: '\u00B7',
            minus: '\u2212',
            minusb: '\u229F',
            minusd: '\u2238',
            minusdu: '\u2A2A',
            MinusPlus: '\u2213',
            mlcp: '\u2ADB',
            mldr: '\u2026',
            mnplus: '\u2213',
            models: '\u22A7',
            Mopf: '\uD835\uDD44',
            mopf: '\uD835\uDD5E',
            mp: '\u2213',
            Mscr: '\u2133',
            mscr: '\uD835\uDCC2',
            mstpos: '\u223E',
            Mu: '\u039C',
            mu: '\u03BC',
            multimap: '\u22B8',
            mumap: '\u22B8',
            nabla: '\u2207',
            Nacute: '\u0143',
            nacute: '\u0144',
            nang: '\u2220\u20D2',
            nap: '\u2249',
            napE: '\u2A70\u0338',
            napid: '\u224B\u0338',
            napos: '\u0149',
            napprox: '\u2249',
            natur: '\u266E',
            natural: '\u266E',
            naturals: '\u2115',
            nbsp: '\u00A0',
            nbump: '\u224E\u0338',
            nbumpe: '\u224F\u0338',
            ncap: '\u2A43',
            Ncaron: '\u0147',
            ncaron: '\u0148',
            Ncedil: '\u0145',
            ncedil: '\u0146',
            ncong: '\u2247',
            ncongdot: '\u2A6D\u0338',
            ncup: '\u2A42',
            Ncy: '\u041D',
            ncy: '\u043D',
            ndash: '\u2013',
            ne: '\u2260',
            nearhk: '\u2924',
            neArr: '\u21D7',
            nearr: '\u2197',
            nearrow: '\u2197',
            nedot: '\u2250\u0338',
            NegativeMediumSpace: '\u200B',
            NegativeThickSpace: '\u200B',
            NegativeThinSpace: '\u200B',
            NegativeVeryThinSpace: '\u200B',
            nequiv: '\u2262',
            nesear: '\u2928',
            nesim: '\u2242\u0338',
            NestedGreaterGreater: '\u226B',
            NestedLessLess: '\u226A',
            NewLine: '\u000A',
            nexist: '\u2204',
            nexists: '\u2204',
            Nfr: '\uD835\uDD11',
            nfr: '\uD835\uDD2B',
            ngE: '\u2267\u0338',
            nge: '\u2271',
            ngeq: '\u2271',
            ngeqq: '\u2267\u0338',
            ngeqslant: '\u2A7E\u0338',
            nges: '\u2A7E\u0338',
            nGg: '\u22D9\u0338',
            ngsim: '\u2275',
            nGt: '\u226B\u20D2',
            ngt: '\u226F',
            ngtr: '\u226F',
            nGtv: '\u226B\u0338',
            nhArr: '\u21CE',
            nharr: '\u21AE',
            nhpar: '\u2AF2',
            ni: '\u220B',
            nis: '\u22FC',
            nisd: '\u22FA',
            niv: '\u220B',
            NJcy: '\u040A',
            njcy: '\u045A',
            nlArr: '\u21CD',
            nlarr: '\u219A',
            nldr: '\u2025',
            nlE: '\u2266\u0338',
            nle: '\u2270',
            nLeftarrow: '\u21CD',
            nleftarrow: '\u219A',
            nLeftrightarrow: '\u21CE',
            nleftrightarrow: '\u21AE',
            nleq: '\u2270',
            nleqq: '\u2266\u0338',
            nleqslant: '\u2A7D\u0338',
            nles: '\u2A7D\u0338',
            nless: '\u226E',
            nLl: '\u22D8\u0338',
            nlsim: '\u2274',
            nLt: '\u226A\u20D2',
            nlt: '\u226E',
            nltri: '\u22EA',
            nltrie: '\u22EC',
            nLtv: '\u226A\u0338',
            nmid: '\u2224',
            NoBreak: '\u2060',
            NonBreakingSpace: '\u00A0',
            Nopf: '\u2115',
            nopf: '\uD835\uDD5F',
            Not: '\u2AEC',
            not: '\u00AC',
            NotCongruent: '\u2262',
            NotCupCap: '\u226D',
            NotDoubleVerticalBar: '\u2226',
            NotElement: '\u2209',
            NotEqual: '\u2260',
            NotEqualTilde: '\u2242\u0338',
            NotExists: '\u2204',
            NotGreater: '\u226F',
            NotGreaterEqual: '\u2271',
            NotGreaterFullEqual: '\u2267\u0338',
            NotGreaterGreater: '\u226B\u0338',
            NotGreaterLess: '\u2279',
            NotGreaterSlantEqual: '\u2A7E\u0338',
            NotGreaterTilde: '\u2275',
            NotHumpDownHump: '\u224E\u0338',
            NotHumpEqual: '\u224F\u0338',
            notin: '\u2209',
            notindot: '\u22F5\u0338',
            notinE: '\u22F9\u0338',
            notinva: '\u2209',
            notinvb: '\u22F7',
            notinvc: '\u22F6',
            NotLeftTriangle: '\u22EA',
            NotLeftTriangleBar: '\u29CF\u0338',
            NotLeftTriangleEqual: '\u22EC',
            NotLess: '\u226E',
            NotLessEqual: '\u2270',
            NotLessGreater: '\u2278',
            NotLessLess: '\u226A\u0338',
            NotLessSlantEqual: '\u2A7D\u0338',
            NotLessTilde: '\u2274',
            NotNestedGreaterGreater: '\u2AA2\u0338',
            NotNestedLessLess: '\u2AA1\u0338',
            notni: '\u220C',
            notniva: '\u220C',
            notnivb: '\u22FE',
            notnivc: '\u22FD',
            NotPrecedes: '\u2280',
            NotPrecedesEqual: '\u2AAF\u0338',
            NotPrecedesSlantEqual: '\u22E0',
            NotReverseElement: '\u220C',
            NotRightTriangle: '\u22EB',
            NotRightTriangleBar: '\u29D0\u0338',
            NotRightTriangleEqual: '\u22ED',
            NotSquareSubset: '\u228F\u0338',
            NotSquareSubsetEqual: '\u22E2',
            NotSquareSuperset: '\u2290\u0338',
            NotSquareSupersetEqual: '\u22E3',
            NotSubset: '\u2282\u20D2',
            NotSubsetEqual: '\u2288',
            NotSucceeds: '\u2281',
            NotSucceedsEqual: '\u2AB0\u0338',
            NotSucceedsSlantEqual: '\u22E1',
            NotSucceedsTilde: '\u227F\u0338',
            NotSuperset: '\u2283\u20D2',
            NotSupersetEqual: '\u2289',
            NotTilde: '\u2241',
            NotTildeEqual: '\u2244',
            NotTildeFullEqual: '\u2247',
            NotTildeTilde: '\u2249',
            NotVerticalBar: '\u2224',
            npar: '\u2226',
            nparallel: '\u2226',
            nparsl: '\u2AFD\u20E5',
            npart: '\u2202\u0338',
            npolint: '\u2A14',
            npr: '\u2280',
            nprcue: '\u22E0',
            npre: '\u2AAF\u0338',
            nprec: '\u2280',
            npreceq: '\u2AAF\u0338',
            nrArr: '\u21CF',
            nrarr: '\u219B',
            nrarrc: '\u2933\u0338',
            nrarrw: '\u219D\u0338',
            nRightarrow: '\u21CF',
            nrightarrow: '\u219B',
            nrtri: '\u22EB',
            nrtrie: '\u22ED',
            nsc: '\u2281',
            nsccue: '\u22E1',
            nsce: '\u2AB0\u0338',
            Nscr: '\uD835\uDCA9',
            nscr: '\uD835\uDCC3',
            nshortmid: '\u2224',
            nshortparallel: '\u2226',
            nsim: '\u2241',
            nsime: '\u2244',
            nsimeq: '\u2244',
            nsmid: '\u2224',
            nspar: '\u2226',
            nsqsube: '\u22E2',
            nsqsupe: '\u22E3',
            nsub: '\u2284',
            nsubE: '\u2AC5\u0338',
            nsube: '\u2288',
            nsubset: '\u2282\u20D2',
            nsubseteq: '\u2288',
            nsubseteqq: '\u2AC5\u0338',
            nsucc: '\u2281',
            nsucceq: '\u2AB0\u0338',
            nsup: '\u2285',
            nsupE: '\u2AC6\u0338',
            nsupe: '\u2289',
            nsupset: '\u2283\u20D2',
            nsupseteq: '\u2289',
            nsupseteqq: '\u2AC6\u0338',
            ntgl: '\u2279',
            Ntilde: '\u00D1',
            ntilde: '\u00F1',
            ntlg: '\u2278',
            ntriangleleft: '\u22EA',
            ntrianglelefteq: '\u22EC',
            ntriangleright: '\u22EB',
            ntrianglerighteq: '\u22ED',
            Nu: '\u039D',
            nu: '\u03BD',
            num: '\u0023',
            numero: '\u2116',
            numsp: '\u2007',
            nvap: '\u224D\u20D2',
            nVDash: '\u22AF',
            nVdash: '\u22AE',
            nvDash: '\u22AD',
            nvdash: '\u22AC',
            nvge: '\u2265\u20D2',
            nvgt: '\u003E\u20D2',
            nvHarr: '\u2904',
            nvinfin: '\u29DE',
            nvlArr: '\u2902',
            nvle: '\u2264\u20D2',
            nvlt: '\u003C\u20D2',
            nvltrie: '\u22B4\u20D2',
            nvrArr: '\u2903',
            nvrtrie: '\u22B5\u20D2',
            nvsim: '\u223C\u20D2',
            nwarhk: '\u2923',
            nwArr: '\u21D6',
            nwarr: '\u2196',
            nwarrow: '\u2196',
            nwnear: '\u2927',
            Oacute: '\u00D3',
            oacute: '\u00F3',
            oast: '\u229B',
            ocir: '\u229A',
            Ocirc: '\u00D4',
            ocirc: '\u00F4',
            Ocy: '\u041E',
            ocy: '\u043E',
            odash: '\u229D',
            Odblac: '\u0150',
            odblac: '\u0151',
            odiv: '\u2A38',
            odot: '\u2299',
            odsold: '\u29BC',
            OElig: '\u0152',
            oelig: '\u0153',
            ofcir: '\u29BF',
            Ofr: '\uD835\uDD12',
            ofr: '\uD835\uDD2C',
            ogon: '\u02DB',
            Ograve: '\u00D2',
            ograve: '\u00F2',
            ogt: '\u29C1',
            ohbar: '\u29B5',
            ohm: '\u03A9',
            oint: '\u222E',
            olarr: '\u21BA',
            olcir: '\u29BE',
            olcross: '\u29BB',
            oline: '\u203E',
            olt: '\u29C0',
            Omacr: '\u014C',
            omacr: '\u014D',
            Omega: '\u03A9',
            omega: '\u03C9',
            Omicron: '\u039F',
            omicron: '\u03BF',
            omid: '\u29B6',
            ominus: '\u2296',
            Oopf: '\uD835\uDD46',
            oopf: '\uD835\uDD60',
            opar: '\u29B7',
            OpenCurlyDoubleQuote: '\u201C',
            OpenCurlyQuote: '\u2018',
            operp: '\u29B9',
            oplus: '\u2295',
            Or: '\u2A54',
            or: '\u2228',
            orarr: '\u21BB',
            ord: '\u2A5D',
            order: '\u2134',
            orderof: '\u2134',
            ordf: '\u00AA',
            ordm: '\u00BA',
            origof: '\u22B6',
            oror: '\u2A56',
            orslope: '\u2A57',
            orv: '\u2A5B',
            oS: '\u24C8',
            Oscr: '\uD835\uDCAA',
            oscr: '\u2134',
            Oslash: '\u00D8',
            oslash: '\u00F8',
            osol: '\u2298',
            Otilde: '\u00D5',
            otilde: '\u00F5',
            Otimes: '\u2A37',
            otimes: '\u2297',
            otimesas: '\u2A36',
            Ouml: '\u00D6',
            ouml: '\u00F6',
            ovbar: '\u233D',
            OverBar: '\u203E',
            OverBrace: '\u23DE',
            OverBracket: '\u23B4',
            OverParenthesis: '\u23DC',
            par: '\u2225',
            para: '\u00B6',
            parallel: '\u2225',
            parsim: '\u2AF3',
            parsl: '\u2AFD',
            part: '\u2202',
            PartialD: '\u2202',
            Pcy: '\u041F',
            pcy: '\u043F',
            percnt: '\u0025',
            period: '\u002E',
            permil: '\u2030',
            perp: '\u22A5',
            pertenk: '\u2031',
            Pfr: '\uD835\uDD13',
            pfr: '\uD835\uDD2D',
            Phi: '\u03A6',
            phi: '\u03C6',
            phiv: '\u03D5',
            phmmat: '\u2133',
            phone: '\u260E',
            Pi: '\u03A0',
            pi: '\u03C0',
            pitchfork: '\u22D4',
            piv: '\u03D6',
            planck: '\u210F',
            planckh: '\u210E',
            plankv: '\u210F',
            plus: '\u002B',
            plusacir: '\u2A23',
            plusb: '\u229E',
            pluscir: '\u2A22',
            plusdo: '\u2214',
            plusdu: '\u2A25',
            pluse: '\u2A72',
            PlusMinus: '\u00B1',
            plusmn: '\u00B1',
            plussim: '\u2A26',
            plustwo: '\u2A27',
            pm: '\u00B1',
            Poincareplane: '\u210C',
            pointint: '\u2A15',
            Popf: '\u2119',
            popf: '\uD835\uDD61',
            pound: '\u00A3',
            Pr: '\u2ABB',
            pr: '\u227A',
            prap: '\u2AB7',
            prcue: '\u227C',
            prE: '\u2AB3',
            pre: '\u2AAF',
            prec: '\u227A',
            precapprox: '\u2AB7',
            preccurlyeq: '\u227C',
            Precedes: '\u227A',
            PrecedesEqual: '\u2AAF',
            PrecedesSlantEqual: '\u227C',
            PrecedesTilde: '\u227E',
            preceq: '\u2AAF',
            precnapprox: '\u2AB9',
            precneqq: '\u2AB5',
            precnsim: '\u22E8',
            precsim: '\u227E',
            Prime: '\u2033',
            prime: '\u2032',
            primes: '\u2119',
            prnap: '\u2AB9',
            prnE: '\u2AB5',
            prnsim: '\u22E8',
            prod: '\u220F',
            Product: '\u220F',
            profalar: '\u232E',
            profline: '\u2312',
            profsurf: '\u2313',
            prop: '\u221D',
            Proportion: '\u2237',
            Proportional: '\u221D',
            propto: '\u221D',
            prsim: '\u227E',
            prurel: '\u22B0',
            Pscr: '\uD835\uDCAB',
            pscr: '\uD835\uDCC5',
            Psi: '\u03A8',
            psi: '\u03C8',
            puncsp: '\u2008',
            Qfr: '\uD835\uDD14',
            qfr: '\uD835\uDD2E',
            qint: '\u2A0C',
            Qopf: '\u211A',
            qopf: '\uD835\uDD62',
            qprime: '\u2057',
            Qscr: '\uD835\uDCAC',
            qscr: '\uD835\uDCC6',
            quaternions: '\u210D',
            quatint: '\u2A16',
            quest: '\u003F',
            questeq: '\u225F',
            QUOT: '\u0022',
            quot: '\u0022',
            rAarr: '\u21DB',
            race: '\u223D\u0331',
            Racute: '\u0154',
            racute: '\u0155',
            radic: '\u221A',
            raemptyv: '\u29B3',
            Rang: '\u27EB',
            rang: '\u27E9',
            rangd: '\u2992',
            range: '\u29A5',
            rangle: '\u27E9',
            raquo: '\u00BB',
            Rarr: '\u21A0',
            rArr: '\u21D2',
            rarr: '\u2192',
            rarrap: '\u2975',
            rarrb: '\u21E5',
            rarrbfs: '\u2920',
            rarrc: '\u2933',
            rarrfs: '\u291E',
            rarrhk: '\u21AA',
            rarrlp: '\u21AC',
            rarrpl: '\u2945',
            rarrsim: '\u2974',
            Rarrtl: '\u2916',
            rarrtl: '\u21A3',
            rarrw: '\u219D',
            rAtail: '\u291C',
            ratail: '\u291A',
            ratio: '\u2236',
            rationals: '\u211A',
            RBarr: '\u2910',
            rBarr: '\u290F',
            rbarr: '\u290D',
            rbbrk: '\u2773',
            rbrace: '\u007D',
            rbrack: '\u005D',
            rbrke: '\u298C',
            rbrksld: '\u298E',
            rbrkslu: '\u2990',
            Rcaron: '\u0158',
            rcaron: '\u0159',
            Rcedil: '\u0156',
            rcedil: '\u0157',
            rceil: '\u2309',
            rcub: '\u007D',
            Rcy: '\u0420',
            rcy: '\u0440',
            rdca: '\u2937',
            rdldhar: '\u2969',
            rdquo: '\u201D',
            rdquor: '\u201D',
            rdsh: '\u21B3',
            Re: '\u211C',
            real: '\u211C',
            realine: '\u211B',
            realpart: '\u211C',
            reals: '\u211D',
            rect: '\u25AD',
            REG: '\u00AE',
            reg: '\u00AE',
            ReverseElement: '\u220B',
            ReverseEquilibrium: '\u21CB',
            ReverseUpEquilibrium: '\u296F',
            rfisht: '\u297D',
            rfloor: '\u230B',
            Rfr: '\u211C',
            rfr: '\uD835\uDD2F',
            rHar: '\u2964',
            rhard: '\u21C1',
            rharu: '\u21C0',
            rharul: '\u296C',
            Rho: '\u03A1',
            rho: '\u03C1',
            rhov: '\u03F1',
            RightAngleBracket: '\u27E9',
            RightArrow: '\u2192',
            Rightarrow: '\u21D2',
            rightarrow: '\u2192',
            RightArrowBar: '\u21E5',
            RightArrowLeftArrow: '\u21C4',
            rightarrowtail: '\u21A3',
            RightCeiling: '\u2309',
            RightDoubleBracket: '\u27E7',
            RightDownTeeVector: '\u295D',
            RightDownVector: '\u21C2',
            RightDownVectorBar: '\u2955',
            RightFloor: '\u230B',
            rightharpoondown: '\u21C1',
            rightharpoonup: '\u21C0',
            rightleftarrows: '\u21C4',
            rightleftharpoons: '\u21CC',
            rightrightarrows: '\u21C9',
            rightsquigarrow: '\u219D',
            RightTee: '\u22A2',
            RightTeeArrow: '\u21A6',
            RightTeeVector: '\u295B',
            rightthreetimes: '\u22CC',
            RightTriangle: '\u22B3',
            RightTriangleBar: '\u29D0',
            RightTriangleEqual: '\u22B5',
            RightUpDownVector: '\u294F',
            RightUpTeeVector: '\u295C',
            RightUpVector: '\u21BE',
            RightUpVectorBar: '\u2954',
            RightVector: '\u21C0',
            RightVectorBar: '\u2953',
            ring: '\u02DA',
            risingdotseq: '\u2253',
            rlarr: '\u21C4',
            rlhar: '\u21CC',
            rlm: '\u200F',
            rmoust: '\u23B1',
            rmoustache: '\u23B1',
            rnmid: '\u2AEE',
            roang: '\u27ED',
            roarr: '\u21FE',
            robrk: '\u27E7',
            ropar: '\u2986',
            Ropf: '\u211D',
            ropf: '\uD835\uDD63',
            roplus: '\u2A2E',
            rotimes: '\u2A35',
            RoundImplies: '\u2970',
            rpar: '\u0029',
            rpargt: '\u2994',
            rppolint: '\u2A12',
            rrarr: '\u21C9',
            Rrightarrow: '\u21DB',
            rsaquo: '\u203A',
            Rscr: '\u211B',
            rscr: '\uD835\uDCC7',
            Rsh: '\u21B1',
            rsh: '\u21B1',
            rsqb: '\u005D',
            rsquo: '\u2019',
            rsquor: '\u2019',
            rthree: '\u22CC',
            rtimes: '\u22CA',
            rtri: '\u25B9',
            rtrie: '\u22B5',
            rtrif: '\u25B8',
            rtriltri: '\u29CE',
            RuleDelayed: '\u29F4',
            ruluhar: '\u2968',
            rx: '\u211E',
            Sacute: '\u015A',
            sacute: '\u015B',
            sbquo: '\u201A',
            Sc: '\u2ABC',
            sc: '\u227B',
            scap: '\u2AB8',
            Scaron: '\u0160',
            scaron: '\u0161',
            sccue: '\u227D',
            scE: '\u2AB4',
            sce: '\u2AB0',
            Scedil: '\u015E',
            scedil: '\u015F',
            Scirc: '\u015C',
            scirc: '\u015D',
            scnap: '\u2ABA',
            scnE: '\u2AB6',
            scnsim: '\u22E9',
            scpolint: '\u2A13',
            scsim: '\u227F',
            Scy: '\u0421',
            scy: '\u0441',
            sdot: '\u22C5',
            sdotb: '\u22A1',
            sdote: '\u2A66',
            searhk: '\u2925',
            seArr: '\u21D8',
            searr: '\u2198',
            searrow: '\u2198',
            sect: '\u00A7',
            semi: '\u003B',
            seswar: '\u2929',
            setminus: '\u2216',
            setmn: '\u2216',
            sext: '\u2736',
            Sfr: '\uD835\uDD16',
            sfr: '\uD835\uDD30',
            sfrown: '\u2322',
            sharp: '\u266F',
            SHCHcy: '\u0429',
            shchcy: '\u0449',
            SHcy: '\u0428',
            shcy: '\u0448',
            ShortDownArrow: '\u2193',
            ShortLeftArrow: '\u2190',
            shortmid: '\u2223',
            shortparallel: '\u2225',
            ShortRightArrow: '\u2192',
            ShortUpArrow: '\u2191',
            shy: '\u00AD',
            Sigma: '\u03A3',
            sigma: '\u03C3',
            sigmaf: '\u03C2',
            sigmav: '\u03C2',
            sim: '\u223C',
            simdot: '\u2A6A',
            sime: '\u2243',
            simeq: '\u2243',
            simg: '\u2A9E',
            simgE: '\u2AA0',
            siml: '\u2A9D',
            simlE: '\u2A9F',
            simne: '\u2246',
            simplus: '\u2A24',
            simrarr: '\u2972',
            slarr: '\u2190',
            SmallCircle: '\u2218',
            smallsetminus: '\u2216',
            smashp: '\u2A33',
            smeparsl: '\u29E4',
            smid: '\u2223',
            smile: '\u2323',
            smt: '\u2AAA',
            smte: '\u2AAC',
            smtes: '\u2AAC\uFE00',
            SOFTcy: '\u042C',
            softcy: '\u044C',
            sol: '\u002F',
            solb: '\u29C4',
            solbar: '\u233F',
            Sopf: '\uD835\uDD4A',
            sopf: '\uD835\uDD64',
            spades: '\u2660',
            spadesuit: '\u2660',
            spar: '\u2225',
            sqcap: '\u2293',
            sqcaps: '\u2293\uFE00',
            sqcup: '\u2294',
            sqcups: '\u2294\uFE00',
            Sqrt: '\u221A',
            sqsub: '\u228F',
            sqsube: '\u2291',
            sqsubset: '\u228F',
            sqsubseteq: '\u2291',
            sqsup: '\u2290',
            sqsupe: '\u2292',
            sqsupset: '\u2290',
            sqsupseteq: '\u2292',
            squ: '\u25A1',
            Square: '\u25A1',
            square: '\u25A1',
            SquareIntersection: '\u2293',
            SquareSubset: '\u228F',
            SquareSubsetEqual: '\u2291',
            SquareSuperset: '\u2290',
            SquareSupersetEqual: '\u2292',
            SquareUnion: '\u2294',
            squarf: '\u25AA',
            squf: '\u25AA',
            srarr: '\u2192',
            Sscr: '\uD835\uDCAE',
            sscr: '\uD835\uDCC8',
            ssetmn: '\u2216',
            ssmile: '\u2323',
            sstarf: '\u22C6',
            Star: '\u22C6',
            star: '\u2606',
            starf: '\u2605',
            straightepsilon: '\u03F5',
            straightphi: '\u03D5',
            strns: '\u00AF',
            Sub: '\u22D0',
            sub: '\u2282',
            subdot: '\u2ABD',
            subE: '\u2AC5',
            sube: '\u2286',
            subedot: '\u2AC3',
            submult: '\u2AC1',
            subnE: '\u2ACB',
            subne: '\u228A',
            subplus: '\u2ABF',
            subrarr: '\u2979',
            Subset: '\u22D0',
            subset: '\u2282',
            subseteq: '\u2286',
            subseteqq: '\u2AC5',
            SubsetEqual: '\u2286',
            subsetneq: '\u228A',
            subsetneqq: '\u2ACB',
            subsim: '\u2AC7',
            subsub: '\u2AD5',
            subsup: '\u2AD3',
            succ: '\u227B',
            succapprox: '\u2AB8',
            succcurlyeq: '\u227D',
            Succeeds: '\u227B',
            SucceedsEqual: '\u2AB0',
            SucceedsSlantEqual: '\u227D',
            SucceedsTilde: '\u227F',
            succeq: '\u2AB0',
            succnapprox: '\u2ABA',
            succneqq: '\u2AB6',
            succnsim: '\u22E9',
            succsim: '\u227F',
            SuchThat: '\u220B',
            Sum: '\u2211',
            sum: '\u2211',
            sung: '\u266A',
            Sup: '\u22D1',
            sup: '\u2283',
            sup1: '\u00B9',
            sup2: '\u00B2',
            sup3: '\u00B3',
            supdot: '\u2ABE',
            supdsub: '\u2AD8',
            supE: '\u2AC6',
            supe: '\u2287',
            supedot: '\u2AC4',
            Superset: '\u2283',
            SupersetEqual: '\u2287',
            suphsol: '\u27C9',
            suphsub: '\u2AD7',
            suplarr: '\u297B',
            supmult: '\u2AC2',
            supnE: '\u2ACC',
            supne: '\u228B',
            supplus: '\u2AC0',
            Supset: '\u22D1',
            supset: '\u2283',
            supseteq: '\u2287',
            supseteqq: '\u2AC6',
            supsetneq: '\u228B',
            supsetneqq: '\u2ACC',
            supsim: '\u2AC8',
            supsub: '\u2AD4',
            supsup: '\u2AD6',
            swarhk: '\u2926',
            swArr: '\u21D9',
            swarr: '\u2199',
            swarrow: '\u2199',
            swnwar: '\u292A',
            szlig: '\u00DF',
            Tab: '\u0009',
            target: '\u2316',
            Tau: '\u03A4',
            tau: '\u03C4',
            tbrk: '\u23B4',
            Tcaron: '\u0164',
            tcaron: '\u0165',
            Tcedil: '\u0162',
            tcedil: '\u0163',
            Tcy: '\u0422',
            tcy: '\u0442',
            tdot: '\u20DB',
            telrec: '\u2315',
            Tfr: '\uD835\uDD17',
            tfr: '\uD835\uDD31',
            there4: '\u2234',
            Therefore: '\u2234',
            therefore: '\u2234',
            Theta: '\u0398',
            theta: '\u03B8',
            thetasym: '\u03D1',
            thetav: '\u03D1',
            thickapprox: '\u2248',
            thicksim: '\u223C',
            ThickSpace: '\u205F\u200A',
            thinsp: '\u2009',
            ThinSpace: '\u2009',
            thkap: '\u2248',
            thksim: '\u223C',
            THORN: '\u00DE',
            thorn: '\u00FE',
            Tilde: '\u223C',
            tilde: '\u02DC',
            TildeEqual: '\u2243',
            TildeFullEqual: '\u2245',
            TildeTilde: '\u2248',
            times: '\u00D7',
            timesb: '\u22A0',
            timesbar: '\u2A31',
            timesd: '\u2A30',
            tint: '\u222D',
            toea: '\u2928',
            top: '\u22A4',
            topbot: '\u2336',
            topcir: '\u2AF1',
            Topf: '\uD835\uDD4B',
            topf: '\uD835\uDD65',
            topfork: '\u2ADA',
            tosa: '\u2929',
            tprime: '\u2034',
            TRADE: '\u2122',
            trade: '\u2122',
            triangle: '\u25B5',
            triangledown: '\u25BF',
            triangleleft: '\u25C3',
            trianglelefteq: '\u22B4',
            triangleq: '\u225C',
            triangleright: '\u25B9',
            trianglerighteq: '\u22B5',
            tridot: '\u25EC',
            trie: '\u225C',
            triminus: '\u2A3A',
            TripleDot: '\u20DB',
            triplus: '\u2A39',
            trisb: '\u29CD',
            tritime: '\u2A3B',
            trpezium: '\u23E2',
            Tscr: '\uD835\uDCAF',
            tscr: '\uD835\uDCC9',
            TScy: '\u0426',
            tscy: '\u0446',
            TSHcy: '\u040B',
            tshcy: '\u045B',
            Tstrok: '\u0166',
            tstrok: '\u0167',
            twixt: '\u226C',
            twoheadleftarrow: '\u219E',
            twoheadrightarrow: '\u21A0',
            Uacute: '\u00DA',
            uacute: '\u00FA',
            Uarr: '\u219F',
            uArr: '\u21D1',
            uarr: '\u2191',
            Uarrocir: '\u2949',
            Ubrcy: '\u040E',
            ubrcy: '\u045E',
            Ubreve: '\u016C',
            ubreve: '\u016D',
            Ucirc: '\u00DB',
            ucirc: '\u00FB',
            Ucy: '\u0423',
            ucy: '\u0443',
            udarr: '\u21C5',
            Udblac: '\u0170',
            udblac: '\u0171',
            udhar: '\u296E',
            ufisht: '\u297E',
            Ufr: '\uD835\uDD18',
            ufr: '\uD835\uDD32',
            Ugrave: '\u00D9',
            ugrave: '\u00F9',
            uHar: '\u2963',
            uharl: '\u21BF',
            uharr: '\u21BE',
            uhblk: '\u2580',
            ulcorn: '\u231C',
            ulcorner: '\u231C',
            ulcrop: '\u230F',
            ultri: '\u25F8',
            Umacr: '\u016A',
            umacr: '\u016B',
            uml: '\u00A8',
            UnderBar: '\u005F',
            UnderBrace: '\u23DF',
            UnderBracket: '\u23B5',
            UnderParenthesis: '\u23DD',
            Union: '\u22C3',
            UnionPlus: '\u228E',
            Uogon: '\u0172',
            uogon: '\u0173',
            Uopf: '\uD835\uDD4C',
            uopf: '\uD835\uDD66',
            UpArrow: '\u2191',
            Uparrow: '\u21D1',
            uparrow: '\u2191',
            UpArrowBar: '\u2912',
            UpArrowDownArrow: '\u21C5',
            UpDownArrow: '\u2195',
            Updownarrow: '\u21D5',
            updownarrow: '\u2195',
            UpEquilibrium: '\u296E',
            upharpoonleft: '\u21BF',
            upharpoonright: '\u21BE',
            uplus: '\u228E',
            UpperLeftArrow: '\u2196',
            UpperRightArrow: '\u2197',
            Upsi: '\u03D2',
            upsi: '\u03C5',
            upsih: '\u03D2',
            Upsilon: '\u03A5',
            upsilon: '\u03C5',
            UpTee: '\u22A5',
            UpTeeArrow: '\u21A5',
            upuparrows: '\u21C8',
            urcorn: '\u231D',
            urcorner: '\u231D',
            urcrop: '\u230E',
            Uring: '\u016E',
            uring: '\u016F',
            urtri: '\u25F9',
            Uscr: '\uD835\uDCB0',
            uscr: '\uD835\uDCCA',
            utdot: '\u22F0',
            Utilde: '\u0168',
            utilde: '\u0169',
            utri: '\u25B5',
            utrif: '\u25B4',
            uuarr: '\u21C8',
            Uuml: '\u00DC',
            uuml: '\u00FC',
            uwangle: '\u29A7',
            vangrt: '\u299C',
            varepsilon: '\u03F5',
            varkappa: '\u03F0',
            varnothing: '\u2205',
            varphi: '\u03D5',
            varpi: '\u03D6',
            varpropto: '\u221D',
            vArr: '\u21D5',
            varr: '\u2195',
            varrho: '\u03F1',
            varsigma: '\u03C2',
            varsubsetneq: '\u228A\uFE00',
            varsubsetneqq: '\u2ACB\uFE00',
            varsupsetneq: '\u228B\uFE00',
            varsupsetneqq: '\u2ACC\uFE00',
            vartheta: '\u03D1',
            vartriangleleft: '\u22B2',
            vartriangleright: '\u22B3',
            Vbar: '\u2AEB',
            vBar: '\u2AE8',
            vBarv: '\u2AE9',
            Vcy: '\u0412',
            vcy: '\u0432',
            VDash: '\u22AB',
            Vdash: '\u22A9',
            vDash: '\u22A8',
            vdash: '\u22A2',
            Vdashl: '\u2AE6',
            Vee: '\u22C1',
            vee: '\u2228',
            veebar: '\u22BB',
            veeeq: '\u225A',
            vellip: '\u22EE',
            Verbar: '\u2016',
            verbar: '\u007C',
            Vert: '\u2016',
            vert: '\u007C',
            VerticalBar: '\u2223',
            VerticalLine: '\u007C',
            VerticalSeparator: '\u2758',
            VerticalTilde: '\u2240',
            VeryThinSpace: '\u200A',
            Vfr: '\uD835\uDD19',
            vfr: '\uD835\uDD33',
            vltri: '\u22B2',
            vnsub: '\u2282\u20D2',
            vnsup: '\u2283\u20D2',
            Vopf: '\uD835\uDD4D',
            vopf: '\uD835\uDD67',
            vprop: '\u221D',
            vrtri: '\u22B3',
            Vscr: '\uD835\uDCB1',
            vscr: '\uD835\uDCCB',
            vsubnE: '\u2ACB\uFE00',
            vsubne: '\u228A\uFE00',
            vsupnE: '\u2ACC\uFE00',
            vsupne: '\u228B\uFE00',
            Vvdash: '\u22AA',
            vzigzag: '\u299A',
            Wcirc: '\u0174',
            wcirc: '\u0175',
            wedbar: '\u2A5F',
            Wedge: '\u22C0',
            wedge: '\u2227',
            wedgeq: '\u2259',
            weierp: '\u2118',
            Wfr: '\uD835\uDD1A',
            wfr: '\uD835\uDD34',
            Wopf: '\uD835\uDD4E',
            wopf: '\uD835\uDD68',
            wp: '\u2118',
            wr: '\u2240',
            wreath: '\u2240',
            Wscr: '\uD835\uDCB2',
            wscr: '\uD835\uDCCC',
            xcap: '\u22C2',
            xcirc: '\u25EF',
            xcup: '\u22C3',
            xdtri: '\u25BD',
            Xfr: '\uD835\uDD1B',
            xfr: '\uD835\uDD35',
            xhArr: '\u27FA',
            xharr: '\u27F7',
            Xi: '\u039E',
            xi: '\u03BE',
            xlArr: '\u27F8',
            xlarr: '\u27F5',
            xmap: '\u27FC',
            xnis: '\u22FB',
            xodot: '\u2A00',
            Xopf: '\uD835\uDD4F',
            xopf: '\uD835\uDD69',
            xoplus: '\u2A01',
            xotime: '\u2A02',
            xrArr: '\u27F9',
            xrarr: '\u27F6',
            Xscr: '\uD835\uDCB3',
            xscr: '\uD835\uDCCD',
            xsqcup: '\u2A06',
            xuplus: '\u2A04',
            xutri: '\u25B3',
            xvee: '\u22C1',
            xwedge: '\u22C0',
            Yacute: '\u00DD',
            yacute: '\u00FD',
            YAcy: '\u042F',
            yacy: '\u044F',
            Ycirc: '\u0176',
            ycirc: '\u0177',
            Ycy: '\u042B',
            ycy: '\u044B',
            yen: '\u00A5',
            Yfr: '\uD835\uDD1C',
            yfr: '\uD835\uDD36',
            YIcy: '\u0407',
            yicy: '\u0457',
            Yopf: '\uD835\uDD50',
            yopf: '\uD835\uDD6A',
            Yscr: '\uD835\uDCB4',
            yscr: '\uD835\uDCCE',
            YUcy: '\u042E',
            yucy: '\u044E',
            Yuml: '\u0178',
            yuml: '\u00FF',
            Zacute: '\u0179',
            zacute: '\u017A',
            Zcaron: '\u017D',
            zcaron: '\u017E',
            Zcy: '\u0417',
            zcy: '\u0437',
            Zdot: '\u017B',
            zdot: '\u017C',
            zeetrf: '\u2128',
            ZeroWidthSpace: '\u200B',
            Zeta: '\u0396',
            zeta: '\u03B6',
            Zfr: '\u2128',
            zfr: '\uD835\uDD37',
            ZHcy: '\u0416',
            zhcy: '\u0436',
            zigrarr: '\u21DD',
            Zopf: '\u2124',
            zopf: '\uD835\uDD6B',
            Zscr: '\uD835\uDCB5',
            zscr: '\uD835\uDCCF',
            zwj: '\u200D',
            zwnj: '\u200C'
        });
        exports.entityMap = exports.HTML_ENTITIES;
    },
    "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/errors.js" (__unused_rspack_module, exports, __webpack_require__) {
        var conventions = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/conventions.js");
        function extendError(constructor, writableName) {
            constructor.prototype = Object.create(Error.prototype, {
                constructor: {
                    value: constructor
                },
                name: {
                    value: constructor.name,
                    enumerable: true,
                    writable: writableName
                }
            });
        }
        var DOMExceptionName = conventions.freeze({
            Error: 'Error',
            IndexSizeError: 'IndexSizeError',
            DomstringSizeError: 'DomstringSizeError',
            HierarchyRequestError: 'HierarchyRequestError',
            WrongDocumentError: 'WrongDocumentError',
            InvalidCharacterError: 'InvalidCharacterError',
            NoDataAllowedError: 'NoDataAllowedError',
            NoModificationAllowedError: 'NoModificationAllowedError',
            NotFoundError: 'NotFoundError',
            NotSupportedError: 'NotSupportedError',
            InUseAttributeError: 'InUseAttributeError',
            InvalidStateError: 'InvalidStateError',
            SyntaxError: 'SyntaxError',
            InvalidModificationError: 'InvalidModificationError',
            NamespaceError: 'NamespaceError',
            InvalidAccessError: 'InvalidAccessError',
            ValidationError: 'ValidationError',
            TypeMismatchError: 'TypeMismatchError',
            SecurityError: 'SecurityError',
            NetworkError: 'NetworkError',
            AbortError: 'AbortError',
            URLMismatchError: 'URLMismatchError',
            QuotaExceededError: 'QuotaExceededError',
            TimeoutError: 'TimeoutError',
            InvalidNodeTypeError: 'InvalidNodeTypeError',
            DataCloneError: 'DataCloneError',
            EncodingError: 'EncodingError',
            NotReadableError: 'NotReadableError',
            UnknownError: 'UnknownError',
            ConstraintError: 'ConstraintError',
            DataError: 'DataError',
            TransactionInactiveError: 'TransactionInactiveError',
            ReadOnlyError: 'ReadOnlyError',
            VersionError: 'VersionError',
            OperationError: 'OperationError',
            NotAllowedError: 'NotAllowedError',
            OptOutError: 'OptOutError'
        });
        var DOMExceptionNames = Object.keys(DOMExceptionName);
        function isValidDomExceptionCode(value) {
            return 'number' == typeof value && value >= 1 && value <= 25;
        }
        function endsWithError(value) {
            return 'string' == typeof value && value.substring(value.length - DOMExceptionName.Error.length) === DOMExceptionName.Error;
        }
        function DOMException(messageOrCode, nameOrMessage) {
            if (isValidDomExceptionCode(messageOrCode)) {
                this.name = DOMExceptionNames[messageOrCode];
                this.message = nameOrMessage || '';
            } else {
                this.message = messageOrCode;
                this.name = endsWithError(nameOrMessage) ? nameOrMessage : DOMExceptionName.Error;
            }
            if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
        }
        extendError(DOMException, true);
        Object.defineProperties(DOMException.prototype, {
            code: {
                enumerable: true,
                get: function() {
                    var code = DOMExceptionNames.indexOf(this.name);
                    if (isValidDomExceptionCode(code)) return code;
                    return 0;
                }
            }
        });
        var ExceptionCode = {
            INDEX_SIZE_ERR: 1,
            DOMSTRING_SIZE_ERR: 2,
            HIERARCHY_REQUEST_ERR: 3,
            WRONG_DOCUMENT_ERR: 4,
            INVALID_CHARACTER_ERR: 5,
            NO_DATA_ALLOWED_ERR: 6,
            NO_MODIFICATION_ALLOWED_ERR: 7,
            NOT_FOUND_ERR: 8,
            NOT_SUPPORTED_ERR: 9,
            INUSE_ATTRIBUTE_ERR: 10,
            INVALID_STATE_ERR: 11,
            SYNTAX_ERR: 12,
            INVALID_MODIFICATION_ERR: 13,
            NAMESPACE_ERR: 14,
            INVALID_ACCESS_ERR: 15,
            VALIDATION_ERR: 16,
            TYPE_MISMATCH_ERR: 17,
            SECURITY_ERR: 18,
            NETWORK_ERR: 19,
            ABORT_ERR: 20,
            URL_MISMATCH_ERR: 21,
            QUOTA_EXCEEDED_ERR: 22,
            TIMEOUT_ERR: 23,
            INVALID_NODE_TYPE_ERR: 24,
            DATA_CLONE_ERR: 25
        };
        var entries = Object.entries(ExceptionCode);
        for(var i = 0; i < entries.length; i++){
            var key = entries[i][0];
            DOMException[key] = entries[i][1];
        }
        function ParseError(message, locator) {
            this.message = message;
            this.locator = locator;
            if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
        }
        extendError(ParseError);
        exports.DOMException = DOMException;
        exports.DOMExceptionName = DOMExceptionName;
        exports.ExceptionCode = ExceptionCode;
        exports.ParseError = ParseError;
    },
    "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/grammar.js" (__unused_rspack_module, exports) {
        function detectUnicodeSupport(RegExpImpl) {
            try {
                if ('function' != typeof RegExpImpl) RegExpImpl = RegExp;
                var match = new RegExpImpl("\uD834\uDF06", 'u').exec('𝌆');
                return !!match && 2 === match[0].length;
            } catch (error) {}
            return false;
        }
        var UNICODE_SUPPORT = detectUnicodeSupport();
        function chars(regexp) {
            if ('[' !== regexp.source[0]) throw new Error(regexp + ' can not be used with chars');
            return regexp.source.slice(1, regexp.source.lastIndexOf(']'));
        }
        function chars_without(regexp, search) {
            if ('[' !== regexp.source[0]) throw new Error('/' + regexp.source + '/ can not be used with chars_without');
            if (!search || 'string' != typeof search) throw new Error(JSON.stringify(search) + ' is not a valid search');
            if (-1 === regexp.source.indexOf(search)) throw new Error('"' + search + '" is not is /' + regexp.source + '/');
            if ('-' === search && 1 !== regexp.source.indexOf(search)) throw new Error('"' + search + '" is not at the first postion of /' + regexp.source + '/');
            return new RegExp(regexp.source.replace(search, ''), UNICODE_SUPPORT ? 'u' : '');
        }
        function reg(args) {
            var self = this;
            return new RegExp(Array.prototype.slice.call(arguments).map(function(part) {
                var isStr = 'string' == typeof part;
                if (isStr && void 0 === self && '|' === part) throw new Error('use regg instead of reg to wrap expressions with `|`!');
                return isStr ? part : part.source;
            }).join(''), UNICODE_SUPPORT ? 'mu' : 'm');
        }
        function regg(args) {
            if (0 === arguments.length) throw new Error('no parameters provided');
            return reg.apply(regg, [
                '(?:'
            ].concat(Array.prototype.slice.call(arguments), [
                ')'
            ]));
        }
        var UNICODE_REPLACEMENT_CHARACTER = '\uFFFD';
        var Char = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;
        if (UNICODE_SUPPORT) Char = reg('[', chars(Char), "\\u{10000}-\\u{10FFFF}", ']');
        var InvalidChar = new RegExp('[^' + chars(Char) + ']', UNICODE_SUPPORT ? 'u' : '');
        var _SChar = /[\x20\x09\x0D\x0A]/;
        var SChar_s = chars(_SChar);
        var S = reg(_SChar, '+');
        var S_OPT = reg(_SChar, '*');
        var NameStartChar = /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
        if (UNICODE_SUPPORT) NameStartChar = reg('[', chars(NameStartChar), "\\u{10000}-\\u{10FFFF}", ']');
        var NameStartChar_s = chars(NameStartChar);
        var NameChar = reg('[', NameStartChar_s, chars(/[-.0-9\xB7]/), chars(/[\u0300-\u036F\u203F-\u2040]/), ']');
        var Name = reg(NameStartChar, NameChar, '*');
        var Nmtoken = reg(NameChar, '+');
        var EntityRef = reg('&', Name, ';');
        var CharRef = regg(/&#[0-9]+;|&#x[0-9a-fA-F]+;/);
        var Reference = regg(EntityRef, '|', CharRef);
        var PEReference = reg('%', Name, ';');
        var EntityValue = regg(reg('"', regg(/[^%&"]/, '|', PEReference, '|', Reference), '*', '"'), '|', reg("'", regg(/[^%&']/, '|', PEReference, '|', Reference), '*', "'"));
        var AttValue = regg('"', regg(/[^<&"]/, '|', Reference), '*', '"', '|', "'", regg(/[^<&']/, '|', Reference), '*', "'");
        var NCNameStartChar = chars_without(NameStartChar, ':');
        var NCNameChar = chars_without(NameChar, ':');
        var NCName = reg(NCNameStartChar, NCNameChar, '*');
        var QName = reg(NCName, regg(':', NCName), '?');
        var QName_exact = reg('^', QName, '$');
        var QName_group = reg('(', QName, ')');
        var SystemLiteral = regg(/"[^"]*"|'[^']*'/);
        var PI = reg(/^<\?/, '(', Name, ')', regg(S, '(', Char, '*?)'), '?', /\?>/);
        var PubidChar = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/;
        var PubidLiteral = regg('"', PubidChar, '*"', '|', "'", chars_without(PubidChar, "'"), "*'");
        var COMMENT_START = '<!--';
        var COMMENT_END = '-->';
        var Comment = reg(COMMENT_START, regg(chars_without(Char, '-'), '|', reg('-', chars_without(Char, '-'))), '*', COMMENT_END);
        var PCDATA = '#PCDATA';
        var Mixed = regg(reg(/\(/, S_OPT, PCDATA, regg(S_OPT, /\|/, S_OPT, QName), '*', S_OPT, /\)\*/), '|', reg(/\(/, S_OPT, PCDATA, S_OPT, /\)/));
        var _children_quantity = /[?*+]?/;
        var children1 = reg(/\([^>]+\)/, _children_quantity);
        var contentspec = regg('EMPTY', '|', 'ANY', '|', Mixed, '|', children1);
        var ELEMENTDECL_START = '<!ELEMENT';
        var elementdecl = reg(ELEMENTDECL_START, S, regg(QName, '|', PEReference), S, regg(contentspec, '|', PEReference), S_OPT, '>');
        var NotationType = reg('NOTATION', S, /\(/, S_OPT, Name, regg(S_OPT, /\|/, S_OPT, Name), '*', S_OPT, /\)/);
        var Enumeration = reg(/\(/, S_OPT, Nmtoken, regg(S_OPT, /\|/, S_OPT, Nmtoken), '*', S_OPT, /\)/);
        var EnumeratedType = regg(NotationType, '|', Enumeration);
        var AttType = regg(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/, '|', EnumeratedType);
        var DefaultDecl = regg(/#REQUIRED|#IMPLIED/, '|', regg(regg('#FIXED', S), '?', AttValue));
        var AttDef = regg(S, Name, S, AttType, S, DefaultDecl);
        var ATTLIST_DECL_START = '<!ATTLIST';
        var AttlistDecl = reg(ATTLIST_DECL_START, S, Name, AttDef, '*', S_OPT, '>');
        var ABOUT_LEGACY_COMPAT = 'about:legacy-compat';
        var ABOUT_LEGACY_COMPAT_SystemLiteral = regg('"' + ABOUT_LEGACY_COMPAT + '"', '|', "'" + ABOUT_LEGACY_COMPAT + "'");
        var SYSTEM = 'SYSTEM';
        var PUBLIC = 'PUBLIC';
        var ExternalID = regg(regg(SYSTEM, S, SystemLiteral), '|', regg(PUBLIC, S, PubidLiteral, S, SystemLiteral));
        var ExternalID_match = reg('^', regg(regg(SYSTEM, S, '(?<SystemLiteralOnly>', SystemLiteral, ')'), '|', regg(PUBLIC, S, '(?<PubidLiteral>', PubidLiteral, ')', S, '(?<SystemLiteral>', SystemLiteral, ')')));
        var PubidLiteral_match = reg('^', PubidLiteral, '$');
        var SystemLiteral_match = reg('^', SystemLiteral, '$');
        var NDataDecl = regg(S, 'NDATA', S, Name);
        var EntityDef = regg(EntityValue, '|', regg(ExternalID, NDataDecl, '?'));
        var ENTITY_DECL_START = '<!ENTITY';
        var GEDecl = reg(ENTITY_DECL_START, S, Name, S, EntityDef, S_OPT, '>');
        var PEDef = regg(EntityValue, '|', ExternalID);
        var PEDecl = reg(ENTITY_DECL_START, S, '%', S, Name, S, PEDef, S_OPT, '>');
        var EntityDecl = regg(GEDecl, '|', PEDecl);
        var PublicID = reg(PUBLIC, S, PubidLiteral);
        var NotationDecl = reg('<!NOTATION', S, Name, S, regg(ExternalID, '|', PublicID), S_OPT, '>');
        var Eq = reg(S_OPT, '=', S_OPT);
        var VersionNum = /1[.]\d+/;
        var VersionInfo = reg(S, 'version', Eq, regg("'", VersionNum, "'", '|', '"', VersionNum, '"'));
        var EncName = /[A-Za-z][-A-Za-z0-9._]*/;
        var EncodingDecl = regg(S, 'encoding', Eq, regg('"', EncName, '"', '|', "'", EncName, "'"));
        var SDDecl = regg(S, 'standalone', Eq, regg("'", regg('yes', '|', 'no'), "'", '|', '"', regg('yes', '|', 'no'), '"'));
        var XMLDecl = reg(/^<\?xml/, VersionInfo, EncodingDecl, '?', SDDecl, '?', S_OPT, /\?>/);
        var DOCTYPE_DECL_START = '<!DOCTYPE';
        var CDATA_START = '<![CDATA[';
        var CDATA_END = ']]>';
        var CDStart = /<!\[CDATA\[/;
        var CDEnd = /\]\]>/;
        var CData = reg(Char, '*?', CDEnd);
        var CDSect = reg(CDStart, CData);
        exports.chars = chars;
        exports.chars_without = chars_without;
        exports.detectUnicodeSupport = detectUnicodeSupport;
        exports.reg = reg;
        exports.regg = regg;
        exports.ABOUT_LEGACY_COMPAT = ABOUT_LEGACY_COMPAT;
        exports.ABOUT_LEGACY_COMPAT_SystemLiteral = ABOUT_LEGACY_COMPAT_SystemLiteral;
        exports.AttlistDecl = AttlistDecl;
        exports.CDATA_START = CDATA_START;
        exports.CDATA_END = CDATA_END;
        exports.CDSect = CDSect;
        exports.Char = Char;
        exports.Comment = Comment;
        exports.COMMENT_START = COMMENT_START;
        exports.COMMENT_END = COMMENT_END;
        exports.DOCTYPE_DECL_START = DOCTYPE_DECL_START;
        exports.elementdecl = elementdecl;
        exports.EntityDecl = EntityDecl;
        exports.EntityValue = EntityValue;
        exports.ExternalID = ExternalID;
        exports.ExternalID_match = ExternalID_match;
        exports.Name = Name;
        exports.NotationDecl = NotationDecl;
        exports.Reference = Reference;
        exports.PEReference = PEReference;
        exports.PI = PI;
        exports.PUBLIC = PUBLIC;
        exports.PubidLiteral = PubidLiteral;
        exports.PubidLiteral_match = PubidLiteral_match;
        exports.QName = QName;
        exports.QName_exact = QName_exact;
        exports.QName_group = QName_group;
        exports.S = S;
        exports.SChar_s = SChar_s;
        exports.S_OPT = S_OPT;
        exports.SYSTEM = SYSTEM;
        exports.SystemLiteral = SystemLiteral;
        exports.SystemLiteral_match = SystemLiteral_match;
        exports.InvalidChar = InvalidChar;
        exports.UNICODE_REPLACEMENT_CHARACTER = UNICODE_REPLACEMENT_CHARACTER;
        exports.UNICODE_SUPPORT = UNICODE_SUPPORT;
        exports.XMLDecl = XMLDecl;
    },
    "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/index.js" (__unused_rspack_module, exports, __webpack_require__) {
        var conventions = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/conventions.js");
        conventions.assign;
        conventions.hasDefaultHTMLNamespace;
        conventions.isHTMLMimeType;
        conventions.isValidMimeType;
        conventions.MIME_TYPE;
        conventions.NAMESPACE;
        var errors = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/errors.js");
        errors.DOMException;
        errors.DOMExceptionName;
        errors.ExceptionCode;
        errors.ParseError;
        var dom = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/dom.js");
        dom.Attr;
        dom.CDATASection;
        dom.CharacterData;
        dom.Comment;
        dom.Document;
        dom.DocumentFragment;
        dom.DocumentType;
        dom.DOMImplementation;
        dom.Element;
        dom.Entity;
        dom.EntityReference;
        dom.LiveNodeList;
        dom.NamedNodeMap;
        dom.Node;
        dom.NodeList;
        dom.Notation;
        dom.ProcessingInstruction;
        dom.Text;
        dom.XMLSerializer;
        var domParser = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/dom-parser.js");
        exports.S4 = domParser.DOMParser;
        domParser.normalizeLineEndings;
        domParser.onErrorStopParsing;
        domParser.onWarningStopParsing;
    },
    "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/sax.js" (__unused_rspack_module, exports, __webpack_require__) {
        var conventions = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/conventions.js");
        var g = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/grammar.js");
        var errors = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/errors.js");
        var isHTMLEscapableRawTextElement = conventions.isHTMLEscapableRawTextElement;
        var isHTMLMimeType = conventions.isHTMLMimeType;
        var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
        var hasOwn = conventions.hasOwn;
        var NAMESPACE = conventions.NAMESPACE;
        var ParseError = errors.ParseError;
        var DOMException = errors.DOMException;
        var S_TAG = 0;
        var S_ATTR = 1;
        var S_ATTR_SPACE = 2;
        var S_EQ = 3;
        var S_ATTR_NOQUOT_VALUE = 4;
        var S_ATTR_END = 5;
        var S_TAG_SPACE = 6;
        var S_TAG_CLOSE = 7;
        function XMLReader() {}
        XMLReader.prototype = {
            parse: function(source, defaultNSMap, entityMap) {
                var domBuilder = this.domBuilder;
                domBuilder.startDocument();
                _copy(defaultNSMap, defaultNSMap = Object.create(null));
                parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);
                domBuilder.endDocument();
            }
        };
        var ENTITY_REG = /&#?\w+;?/g;
        function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
            var isHTML = isHTMLMimeType(domBuilder.mimeType);
            if (source.indexOf(g.UNICODE_REPLACEMENT_CHARACTER) >= 0) errorHandler.warning('Unicode replacement character detected, source encoding issues?');
            function fixedFromCharCode(code) {
                if (!(code > 0xffff)) return String.fromCharCode(code);
                code -= 0x10000;
                var surrogate1 = 0xd800 + (code >> 10), surrogate2 = 0xdc00 + (0x3ff & code);
                return String.fromCharCode(surrogate1, surrogate2);
            }
            function entityReplacer(a) {
                var complete = ';' === a[a.length - 1] ? a : a + ';';
                if (!isHTML && complete !== a) {
                    errorHandler.error('EntityRef: expecting ;');
                    return a;
                }
                var match = g.Reference.exec(complete);
                if (!match || match[0].length !== complete.length) {
                    errorHandler.error('entity not matching Reference production: ' + a);
                    return a;
                }
                var k = complete.slice(1, -1);
                if (hasOwn(entityMap, k)) return entityMap[k];
                if ('#' === k.charAt(0)) return fixedFromCharCode(parseInt(k.substring(1).replace('x', '0x')));
                errorHandler.error('entity not found:' + a);
                return a;
            }
            function appendText(end) {
                if (end > start) {
                    var xt = source.substring(start, end).replace(ENTITY_REG, entityReplacer);
                    locator && position(start);
                    domBuilder.characters(xt, 0, end - start);
                    start = end;
                }
            }
            var lineStart = 0;
            var lineEnd = 0;
            var linePattern = /\r\n?|\n|$/g;
            var locator = domBuilder.locator;
            function position(p, m) {
                while(p >= lineEnd && (m = linePattern.exec(source))){
                    lineStart = lineEnd;
                    lineEnd = m.index + m[0].length;
                    locator.lineNumber++;
                }
                locator.columnNumber = p - lineStart + 1;
            }
            var parseStack = [
                {
                    currentNSMap: defaultNSMapCopy
                }
            ];
            var unclosedTags = [];
            var start = 0;
            while(true){
                try {
                    var tagStart = source.indexOf('<', start);
                    if (tagStart < 0) {
                        if (!isHTML && unclosedTags.length > 0) return errorHandler.fatalError('unclosed xml tag(s): ' + unclosedTags.join(', '));
                        if (!source.substring(start).match(/^\s*$/)) {
                            var doc = domBuilder.doc;
                            var text = doc.createTextNode(source.substring(start));
                            if (doc.documentElement) return errorHandler.error('Extra content at the end of the document');
                            doc.appendChild(text);
                            domBuilder.currentElement = text;
                        }
                        return;
                    }
                    if (tagStart > start) {
                        var fromSource = source.substring(start, tagStart);
                        if (!isHTML && 0 === unclosedTags.length) {
                            fromSource = fromSource.replace(new RegExp(g.S_OPT.source, 'g'), '');
                            fromSource && errorHandler.error("Unexpected content outside root element: '" + fromSource + "'");
                        }
                        appendText(tagStart);
                    }
                    switch(source.charAt(tagStart + 1)){
                        case '/':
                            var end = source.indexOf('>', tagStart + 2);
                            var tagNameRaw = source.substring(tagStart + 2, end > 0 ? end : void 0);
                            if (!tagNameRaw) return errorHandler.fatalError('end tag name missing');
                            var tagNameMatch = end > 0 && g.reg('^', g.QName_group, g.S_OPT, '$').exec(tagNameRaw);
                            if (!tagNameMatch) return errorHandler.fatalError('end tag name contains invalid characters: "' + tagNameRaw + '"');
                            if (!domBuilder.currentElement && !domBuilder.doc.documentElement) return;
                            var currentTagName = unclosedTags[unclosedTags.length - 1] || domBuilder.currentElement.tagName || domBuilder.doc.documentElement.tagName || '';
                            if (currentTagName !== tagNameMatch[1]) {
                                var tagNameLower = tagNameMatch[1].toLowerCase();
                                if (!isHTML || currentTagName.toLowerCase() !== tagNameLower) return errorHandler.fatalError('Opening and ending tag mismatch: "' + currentTagName + '" != "' + tagNameRaw + '"');
                            }
                            var config = parseStack.pop();
                            unclosedTags.pop();
                            var localNSMap = config.localNSMap;
                            domBuilder.endElement(config.uri, config.localName, currentTagName);
                            if (localNSMap) {
                                for(var prefix in localNSMap)if (hasOwn(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
                            }
                            end++;
                            break;
                        case '?':
                            locator && position(tagStart);
                            end = parseProcessingInstruction(source, tagStart, domBuilder, errorHandler);
                            break;
                        case '!':
                            locator && position(tagStart);
                            end = parseDoctypeCommentOrCData(source, tagStart, domBuilder, errorHandler, isHTML);
                            break;
                        default:
                            locator && position(tagStart);
                            var el = new ElementAttributes();
                            var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
                            var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler, isHTML);
                            var len = el.length;
                            if (!el.closed) if (isHTML && conventions.isHTMLVoidElement(el.tagName)) el.closed = true;
                            else unclosedTags.push(el.tagName);
                            if (locator && len) {
                                var locator2 = copyLocator(locator, {});
                                for(var i = 0; i < len; i++){
                                    var a = el[i];
                                    position(a.offset);
                                    a.locator = copyLocator(locator, {});
                                }
                                domBuilder.locator = locator2;
                                if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
                                domBuilder.locator = locator;
                            } else if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
                            if (isHTML && !el.closed) end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
                            else end++;
                    }
                } catch (e) {
                    if (e instanceof ParseError) throw e;
                    if (e instanceof DOMException) throw new ParseError(e.name + ': ' + e.message, domBuilder.locator, e);
                    errorHandler.error('element parse error: ' + e);
                    end = -1;
                }
                if (end > start) start = end;
                else appendText(Math.max(tagStart, start) + 1);
            }
        }
        function copyLocator(f, t) {
            t.lineNumber = f.lineNumber;
            t.columnNumber = f.columnNumber;
            return t;
        }
        function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler, isHTML) {
            function addAttribute(qname, value, startIndex) {
                if (hasOwn(el.attributeNames, qname)) return errorHandler.fatalError('Attribute ' + qname + ' redefined');
                if (!isHTML && value.indexOf('<') >= 0) return errorHandler.fatalError("Unescaped '<' not allowed in attributes values");
                el.addValue(qname, value.replace(/[\t\n\r]/g, ' ').replace(ENTITY_REG, entityReplacer), startIndex);
            }
            var attrName;
            var value;
            var p = ++start;
            var s = S_TAG;
            while(true){
                var c = source.charAt(p);
                switch(c){
                    case '=':
                        if (s === S_ATTR) {
                            attrName = source.slice(start, p);
                            s = S_EQ;
                        } else if (s === S_ATTR_SPACE) s = S_EQ;
                        else throw new Error('attribute equal must after attrName');
                        break;
                    case "'":
                    case '"':
                        if (s === S_EQ || s === S_ATTR) {
                            if (s === S_ATTR) {
                                errorHandler.warning('attribute value must after "="');
                                attrName = source.slice(start, p);
                            }
                            start = p + 1;
                            p = source.indexOf(c, start);
                            if (p > 0) {
                                value = source.slice(start, p);
                                addAttribute(attrName, value, start - 1);
                                s = S_ATTR_END;
                            } else throw new Error("attribute value no end '" + c + "' match");
                        } else if (s == S_ATTR_NOQUOT_VALUE) {
                            value = source.slice(start, p);
                            addAttribute(attrName, value, start);
                            errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ')!!');
                            start = p + 1;
                            s = S_ATTR_END;
                        } else throw new Error('attribute value must after "="');
                        break;
                    case '/':
                        switch(s){
                            case S_TAG:
                                el.setTagName(source.slice(start, p));
                            case S_ATTR_END:
                            case S_TAG_SPACE:
                            case S_TAG_CLOSE:
                                s = S_TAG_CLOSE;
                                el.closed = true;
                            case S_ATTR_NOQUOT_VALUE:
                            case S_ATTR:
                                break;
                            case S_ATTR_SPACE:
                                el.closed = true;
                                break;
                            default:
                                throw new Error("attribute invalid close char('/')");
                        }
                        break;
                    case '':
                        errorHandler.error('unexpected end of input');
                        if (s == S_TAG) el.setTagName(source.slice(start, p));
                        return p;
                    case '>':
                        switch(s){
                            case S_TAG:
                                el.setTagName(source.slice(start, p));
                            case S_ATTR_END:
                            case S_TAG_SPACE:
                            case S_TAG_CLOSE:
                                break;
                            case S_ATTR_NOQUOT_VALUE:
                            case S_ATTR:
                                value = source.slice(start, p);
                                if ('/' === value.slice(-1)) {
                                    el.closed = true;
                                    value = value.slice(0, -1);
                                }
                            case S_ATTR_SPACE:
                                if (s === S_ATTR_SPACE) value = attrName;
                                if (s == S_ATTR_NOQUOT_VALUE) {
                                    errorHandler.warning('attribute "' + value + '" missed quot(")!');
                                    addAttribute(attrName, value, start);
                                } else {
                                    if (!isHTML) errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
                                    addAttribute(value, value, start);
                                }
                                break;
                            case S_EQ:
                                if (!isHTML) return errorHandler.fatalError('AttValue: \' or " expected');
                        }
                        return p;
                    case '\u0080':
                        c = ' ';
                    default:
                        if (c <= ' ') switch(s){
                            case S_TAG:
                                el.setTagName(source.slice(start, p));
                                s = S_TAG_SPACE;
                                break;
                            case S_ATTR:
                                attrName = source.slice(start, p);
                                s = S_ATTR_SPACE;
                                break;
                            case S_ATTR_NOQUOT_VALUE:
                                var value = source.slice(start, p);
                                errorHandler.warning('attribute "' + value + '" missed quot(")!!');
                                addAttribute(attrName, value, start);
                            case S_ATTR_END:
                                s = S_TAG_SPACE;
                                break;
                        }
                        else switch(s){
                            case S_ATTR_SPACE:
                                if (!isHTML) errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
                                addAttribute(attrName, attrName, start);
                                start = p;
                                s = S_ATTR;
                                break;
                            case S_ATTR_END:
                                errorHandler.warning('attribute space is required"' + attrName + '"!!');
                            case S_TAG_SPACE:
                                s = S_ATTR;
                                start = p;
                                break;
                            case S_EQ:
                                s = S_ATTR_NOQUOT_VALUE;
                                start = p;
                                break;
                            case S_TAG_CLOSE:
                                throw new Error("elements closed character '/' and '>' must be connected to");
                        }
                }
                p++;
            }
        }
        function appendElement(el, domBuilder, currentNSMap) {
            var tagName = el.tagName;
            var localNSMap = null;
            var i = el.length;
            while(i--){
                var a = el[i];
                var qName = a.qName;
                var value = a.value;
                var nsp = qName.indexOf(':');
                if (nsp > 0) {
                    var prefix = a.prefix = qName.slice(0, nsp);
                    var localName = qName.slice(nsp + 1);
                    var nsPrefix = 'xmlns' === prefix && localName;
                } else {
                    localName = qName;
                    prefix = null;
                    nsPrefix = 'xmlns' === qName && '';
                }
                a.localName = localName;
                if (false !== nsPrefix) {
                    if (null == localNSMap) {
                        localNSMap = Object.create(null);
                        _copy(currentNSMap, currentNSMap = Object.create(null));
                    }
                    currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
                    a.uri = NAMESPACE.XMLNS;
                    domBuilder.startPrefixMapping(nsPrefix, value);
                }
            }
            var i = el.length;
            while(i--){
                a = el[i];
                if (a.prefix) {
                    if ('xml' === a.prefix) a.uri = NAMESPACE.XML;
                    if ('xmlns' !== a.prefix) a.uri = currentNSMap[a.prefix];
                }
            }
            var nsp = tagName.indexOf(':');
            if (nsp > 0) {
                prefix = el.prefix = tagName.slice(0, nsp);
                localName = el.localName = tagName.slice(nsp + 1);
            } else {
                prefix = null;
                localName = el.localName = tagName;
            }
            var ns = el.uri = currentNSMap[prefix || ''];
            domBuilder.startElement(ns, localName, tagName, el);
            if (el.closed) {
                domBuilder.endElement(ns, localName, tagName);
                if (localNSMap) {
                    for(prefix in localNSMap)if (hasOwn(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
                }
            } else {
                el.currentNSMap = currentNSMap;
                el.localNSMap = localNSMap;
                return true;
            }
        }
        function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
            var isEscapableRaw = isHTMLEscapableRawTextElement(tagName);
            if (isEscapableRaw || isHTMLRawTextElement(tagName)) {
                var elEndStart = source.indexOf('</' + tagName + '>', elStartEnd);
                var text = source.substring(elStartEnd + 1, elEndStart);
                if (isEscapableRaw) text = text.replace(ENTITY_REG, entityReplacer);
                domBuilder.characters(text, 0, text.length);
                return elEndStart;
            }
            return elStartEnd + 1;
        }
        function _copy(source, target) {
            for(var n in source)if (hasOwn(source, n)) target[n] = source[n];
        }
        function parseUtils(source, start) {
            var index = start;
            function char(n) {
                n = n || 0;
                return source.charAt(index + n);
            }
            function skip(n) {
                n = n || 1;
                index += n;
            }
            function skipBlanks() {
                var blanks = 0;
                while(index < source.length){
                    var c = char();
                    if (' ' !== c && '\n' !== c && '\t' !== c && '\r' !== c) return blanks;
                    blanks++;
                    skip();
                }
                return -1;
            }
            function substringFromIndex() {
                return source.substring(index);
            }
            function substringStartsWith(text) {
                return source.substring(index, index + text.length) === text;
            }
            function substringStartsWithCaseInsensitive(text) {
                return source.substring(index, index + text.length).toUpperCase() === text.toUpperCase();
            }
            function getMatch(args) {
                var expr = g.reg('^', args);
                var match = expr.exec(substringFromIndex());
                if (match) {
                    skip(match[0].length);
                    return match[0];
                }
                return null;
            }
            return {
                char: char,
                getIndex: function() {
                    return index;
                },
                getMatch: getMatch,
                getSource: function() {
                    return source;
                },
                skip: skip,
                skipBlanks: skipBlanks,
                substringFromIndex: substringFromIndex,
                substringStartsWith: substringStartsWith,
                substringStartsWithCaseInsensitive: substringStartsWithCaseInsensitive
            };
        }
        function parseDoctypeInternalSubset(p, errorHandler) {
            function parsePI(p, errorHandler) {
                var match = g.PI.exec(p.substringFromIndex());
                if (!match) return errorHandler.fatalError('processing instruction is not well-formed at position ' + p.getIndex());
                if ('xml' === match[1].toLowerCase()) return errorHandler.fatalError('xml declaration is only allowed at the start of the document, but found at position ' + p.getIndex());
                p.skip(match[0].length);
                return match[0];
            }
            var source = p.getSource();
            if ('[' === p.char()) {
                p.skip(1);
                var intSubsetStart = p.getIndex();
                while(p.getIndex() < source.length){
                    p.skipBlanks();
                    if (']' === p.char()) {
                        var internalSubset = source.substring(intSubsetStart, p.getIndex());
                        p.skip(1);
                        return internalSubset;
                    }
                    var current = null;
                    if ('<' === p.char() && '!' === p.char(1)) switch(p.char(2)){
                        case 'E':
                            if ('L' === p.char(3)) current = p.getMatch(g.elementdecl);
                            else if ('N' === p.char(3)) current = p.getMatch(g.EntityDecl);
                            break;
                        case 'A':
                            current = p.getMatch(g.AttlistDecl);
                            break;
                        case 'N':
                            current = p.getMatch(g.NotationDecl);
                            break;
                        case '-':
                            current = p.getMatch(g.Comment);
                            break;
                    }
                    else if ('<' === p.char() && '?' === p.char(1)) current = parsePI(p, errorHandler);
                    else {
                        if ('%' !== p.char()) return errorHandler.fatalError('Error detected in Markup declaration');
                        current = p.getMatch(g.PEReference);
                    }
                    if (!current) return errorHandler.fatalError('Error in internal subset at position ' + p.getIndex());
                }
                return errorHandler.fatalError('doctype internal subset is not well-formed, missing ]');
            }
        }
        function parseDoctypeCommentOrCData(source, start, domBuilder, errorHandler, isHTML) {
            var p = parseUtils(source, start);
            switch(isHTML ? p.char(2).toUpperCase() : p.char(2)){
                case '-':
                    var comment = p.getMatch(g.Comment);
                    if (!comment) return errorHandler.fatalError('comment is not well-formed at position ' + p.getIndex());
                    domBuilder.comment(comment, g.COMMENT_START.length, comment.length - g.COMMENT_START.length - g.COMMENT_END.length);
                    return p.getIndex();
                case '[':
                    var cdata = p.getMatch(g.CDSect);
                    if (!cdata) return errorHandler.fatalError('Invalid CDATA starting at position ' + start);
                    if (!isHTML && !domBuilder.currentElement) return errorHandler.fatalError('CDATA outside of element');
                    domBuilder.startCDATA();
                    domBuilder.characters(cdata, g.CDATA_START.length, cdata.length - g.CDATA_START.length - g.CDATA_END.length);
                    domBuilder.endCDATA();
                    return p.getIndex();
                case 'D':
                    if (domBuilder.doc && domBuilder.doc.documentElement) return errorHandler.fatalError('Doctype not allowed inside or after documentElement at position ' + p.getIndex());
                    if (isHTML ? !p.substringStartsWithCaseInsensitive(g.DOCTYPE_DECL_START) : !p.substringStartsWith(g.DOCTYPE_DECL_START)) return errorHandler.fatalError('Expected ' + g.DOCTYPE_DECL_START + ' at position ' + p.getIndex());
                    p.skip(g.DOCTYPE_DECL_START.length);
                    if (p.skipBlanks() < 1) return errorHandler.fatalError('Expected whitespace after ' + g.DOCTYPE_DECL_START + ' at position ' + p.getIndex());
                    var doctype = {
                        name: void 0,
                        publicId: void 0,
                        systemId: void 0,
                        internalSubset: void 0
                    };
                    doctype.name = p.getMatch(g.Name);
                    if (!doctype.name) return errorHandler.fatalError('doctype name missing or contains unexpected characters at position ' + p.getIndex());
                    if (isHTML && 'html' !== doctype.name.toLowerCase()) errorHandler.warning('Unexpected DOCTYPE in HTML document at position ' + p.getIndex());
                    p.skipBlanks();
                    if (p.substringStartsWith(g.PUBLIC) || p.substringStartsWith(g.SYSTEM)) {
                        var match = g.ExternalID_match.exec(p.substringFromIndex());
                        if (!match) return errorHandler.fatalError('doctype external id is not well-formed at position ' + p.getIndex());
                        if (void 0 !== match.groups.SystemLiteralOnly) doctype.systemId = match.groups.SystemLiteralOnly;
                        else {
                            doctype.systemId = match.groups.SystemLiteral;
                            doctype.publicId = match.groups.PubidLiteral;
                        }
                        p.skip(match[0].length);
                    } else if (isHTML && p.substringStartsWithCaseInsensitive(g.SYSTEM)) {
                        p.skip(g.SYSTEM.length);
                        if (p.skipBlanks() < 1) return errorHandler.fatalError('Expected whitespace after ' + g.SYSTEM + ' at position ' + p.getIndex());
                        doctype.systemId = p.getMatch(g.ABOUT_LEGACY_COMPAT_SystemLiteral);
                        if (!doctype.systemId) return errorHandler.fatalError('Expected ' + g.ABOUT_LEGACY_COMPAT + ' in single or double quotes after ' + g.SYSTEM + ' at position ' + p.getIndex());
                    }
                    if (isHTML && doctype.systemId && !g.ABOUT_LEGACY_COMPAT_SystemLiteral.test(doctype.systemId)) errorHandler.warning('Unexpected doctype.systemId in HTML document at position ' + p.getIndex());
                    if (!isHTML) {
                        p.skipBlanks();
                        doctype.internalSubset = parseDoctypeInternalSubset(p, errorHandler);
                    }
                    p.skipBlanks();
                    if ('>' !== p.char()) return errorHandler.fatalError('doctype not terminated with > at position ' + p.getIndex());
                    p.skip(1);
                    domBuilder.startDTD(doctype.name, doctype.publicId, doctype.systemId, doctype.internalSubset);
                    domBuilder.endDTD();
                    return p.getIndex();
                default:
                    return errorHandler.fatalError('Not well-formed XML starting with "<!" at position ' + start);
            }
        }
        function parseProcessingInstruction(source, start, domBuilder, errorHandler) {
            var match = source.substring(start).match(g.PI);
            if (!match) return errorHandler.fatalError('Invalid processing instruction starting at position ' + start);
            if ('xml' === match[1].toLowerCase()) {
                if (start > 0) return errorHandler.fatalError('processing instruction at position ' + start + ' is an xml declaration which is only at the start of the document');
                if (!g.XMLDecl.test(source.substring(start))) return errorHandler.fatalError('xml declaration is not well-formed');
            }
            domBuilder.processingInstruction(match[1], match[2]);
            return start + match[0].length;
        }
        function ElementAttributes() {
            this.attributeNames = Object.create(null);
        }
        ElementAttributes.prototype = {
            setTagName: function(tagName) {
                if (!g.QName_exact.test(tagName)) throw new Error('invalid tagName:' + tagName);
                this.tagName = tagName;
            },
            addValue: function(qName, value, offset) {
                if (!g.QName_exact.test(qName)) throw new Error('invalid attribute:' + qName);
                this.attributeNames[qName] = this.length;
                this[this.length++] = {
                    qName: qName,
                    value: value,
                    offset: offset
                };
            },
            length: 0,
            getLocalName: function(i) {
                return this[i].localName;
            },
            getLocator: function(i) {
                return this[i].locator;
            },
            getQName: function(i) {
                return this[i].qName;
            },
            getURI: function(i) {
                return this[i].uri;
            },
            getValue: function(i) {
                return this[i].value;
            }
        };
        exports.XMLReader = XMLReader;
        exports.parseUtils = parseUtils;
        exports.parseDoctypeCommentOrCData = parseDoctypeCommentOrCData;
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/buffer-util.js" (module, __unused_rspack_exports, __webpack_require__) {
        const { EMPTY_BUFFER } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/constants.js");
        const FastBuffer = Buffer[Symbol.species];
        function concat(list, totalLength) {
            if (0 === list.length) return EMPTY_BUFFER;
            if (1 === list.length) return list[0];
            const target = Buffer.allocUnsafe(totalLength);
            let offset = 0;
            for(let i = 0; i < list.length; i++){
                const buf = list[i];
                target.set(buf, offset);
                offset += buf.length;
            }
            if (offset < totalLength) return new FastBuffer(target.buffer, target.byteOffset, offset);
            return target;
        }
        function _mask(source, mask, output, offset, length) {
            for(let i = 0; i < length; i++)output[offset + i] = source[i] ^ mask[3 & i];
        }
        function _unmask(buffer, mask) {
            for(let i = 0; i < buffer.length; i++)buffer[i] ^= mask[3 & i];
        }
        function toArrayBuffer(buf) {
            if (buf.length === buf.buffer.byteLength) return buf.buffer;
            return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
        }
        function toBuffer(data) {
            toBuffer.readOnly = true;
            if (Buffer.isBuffer(data)) return data;
            let buf;
            if (data instanceof ArrayBuffer) buf = new FastBuffer(data);
            else if (ArrayBuffer.isView(data)) buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
            else {
                buf = Buffer.from(data);
                toBuffer.readOnly = false;
            }
            return buf;
        }
        module.exports = {
            concat,
            mask: _mask,
            toArrayBuffer,
            toBuffer,
            unmask: _unmask
        };
        if (!process.env.WS_NO_BUFFER_UTIL) try {
            const bufferUtil = __webpack_require__(Object(function() {
                var e = new Error("Cannot find module 'bufferutil'");
                e.code = 'MODULE_NOT_FOUND';
                throw e;
            }()));
            module.exports.mask = function(source, mask, output, offset, length) {
                if (length < 48) _mask(source, mask, output, offset, length);
                else bufferUtil.mask(source, mask, output, offset, length);
            };
            module.exports.unmask = function(buffer, mask) {
                if (buffer.length < 32) _unmask(buffer, mask);
                else bufferUtil.unmask(buffer, mask);
            };
        } catch (e) {}
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/constants.js" (module) {
        const BINARY_TYPES = [
            'nodebuffer',
            'arraybuffer',
            'fragments'
        ];
        const hasBlob = "u" > typeof Blob;
        if (hasBlob) BINARY_TYPES.push('blob');
        module.exports = {
            BINARY_TYPES,
            CLOSE_TIMEOUT: 30000,
            EMPTY_BUFFER: Buffer.alloc(0),
            GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
            hasBlob,
            kForOnEventAttribute: Symbol('kIsForOnEventAttribute'),
            kListener: Symbol('kListener'),
            kStatusCode: Symbol('status-code'),
            kWebSocket: Symbol('websocket'),
            NOOP: ()=>{}
        };
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/event-target.js" (module, __unused_rspack_exports, __webpack_require__) {
        const { kForOnEventAttribute, kListener } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/constants.js");
        const kCode = Symbol('kCode');
        const kData = Symbol('kData');
        const kError = Symbol('kError');
        const kMessage = Symbol('kMessage');
        const kReason = Symbol('kReason');
        const kTarget = Symbol('kTarget');
        const kType = Symbol('kType');
        const kWasClean = Symbol('kWasClean');
        class Event {
            constructor(type){
                this[kTarget] = null;
                this[kType] = type;
            }
            get target() {
                return this[kTarget];
            }
            get type() {
                return this[kType];
            }
        }
        Object.defineProperty(Event.prototype, 'target', {
            enumerable: true
        });
        Object.defineProperty(Event.prototype, 'type', {
            enumerable: true
        });
        class CloseEvent extends Event {
            constructor(type, options = {}){
                super(type);
                this[kCode] = void 0 === options.code ? 0 : options.code;
                this[kReason] = void 0 === options.reason ? '' : options.reason;
                this[kWasClean] = void 0 === options.wasClean ? false : options.wasClean;
            }
            get code() {
                return this[kCode];
            }
            get reason() {
                return this[kReason];
            }
            get wasClean() {
                return this[kWasClean];
            }
        }
        Object.defineProperty(CloseEvent.prototype, 'code', {
            enumerable: true
        });
        Object.defineProperty(CloseEvent.prototype, 'reason', {
            enumerable: true
        });
        Object.defineProperty(CloseEvent.prototype, 'wasClean', {
            enumerable: true
        });
        class ErrorEvent extends Event {
            constructor(type, options = {}){
                super(type);
                this[kError] = void 0 === options.error ? null : options.error;
                this[kMessage] = void 0 === options.message ? '' : options.message;
            }
            get error() {
                return this[kError];
            }
            get message() {
                return this[kMessage];
            }
        }
        Object.defineProperty(ErrorEvent.prototype, 'error', {
            enumerable: true
        });
        Object.defineProperty(ErrorEvent.prototype, 'message', {
            enumerable: true
        });
        class MessageEvent extends Event {
            constructor(type, options = {}){
                super(type);
                this[kData] = void 0 === options.data ? null : options.data;
            }
            get data() {
                return this[kData];
            }
        }
        Object.defineProperty(MessageEvent.prototype, 'data', {
            enumerable: true
        });
        const EventTarget = {
            addEventListener (type, handler, options = {}) {
                for (const listener of this.listeners(type))if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) return;
                let wrapper;
                if ('message' === type) wrapper = function(data, isBinary) {
                    const event = new MessageEvent('message', {
                        data: isBinary ? data : data.toString()
                    });
                    event[kTarget] = this;
                    callListener(handler, this, event);
                };
                else if ('close' === type) wrapper = function(code, message) {
                    const event = new CloseEvent('close', {
                        code,
                        reason: message.toString(),
                        wasClean: this._closeFrameReceived && this._closeFrameSent
                    });
                    event[kTarget] = this;
                    callListener(handler, this, event);
                };
                else if ('error' === type) wrapper = function(error) {
                    const event = new ErrorEvent('error', {
                        error,
                        message: error.message
                    });
                    event[kTarget] = this;
                    callListener(handler, this, event);
                };
                else {
                    if ('open' !== type) return;
                    wrapper = function() {
                        const event = new Event('open');
                        event[kTarget] = this;
                        callListener(handler, this, event);
                    };
                }
                wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
                wrapper[kListener] = handler;
                if (options.once) this.once(type, wrapper);
                else this.on(type, wrapper);
            },
            removeEventListener (type, handler) {
                for (const listener of this.listeners(type))if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
                    this.removeListener(type, listener);
                    break;
                }
            }
        };
        module.exports = {
            CloseEvent,
            ErrorEvent,
            Event,
            EventTarget,
            MessageEvent
        };
        function callListener(listener, thisArg, event) {
            if ('object' == typeof listener && listener.handleEvent) listener.handleEvent.call(listener, event);
            else listener.call(thisArg, event);
        }
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/extension.js" (module, __unused_rspack_exports, __webpack_require__) {
        const { tokenChars } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/validation.js");
        function push(dest, name, elem) {
            if (void 0 === dest[name]) dest[name] = [
                elem
            ];
            else dest[name].push(elem);
        }
        function parse(header) {
            const offers = Object.create(null);
            let params = Object.create(null);
            let mustUnescape = false;
            let isEscaping = false;
            let inQuotes = false;
            let extensionName;
            let paramName;
            let start = -1;
            let code = -1;
            let end = -1;
            let i = 0;
            for(; i < header.length; i++){
                code = header.charCodeAt(i);
                if (void 0 === extensionName) if (-1 === end && 1 === tokenChars[code]) {
                    if (-1 === start) start = i;
                } else if (0 !== i && (0x20 === code || 0x09 === code)) {
                    if (-1 === end && -1 !== start) end = i;
                } else if (0x3b === code || 0x2c === code) {
                    if (-1 === start) throw new SyntaxError(`Unexpected character at index ${i}`);
                    if (-1 === end) end = i;
                    const name = header.slice(start, end);
                    if (0x2c === code) {
                        push(offers, name, params);
                        params = Object.create(null);
                    } else extensionName = name;
                    start = end = -1;
                } else throw new SyntaxError(`Unexpected character at index ${i}`);
                else if (void 0 === paramName) if (-1 === end && 1 === tokenChars[code]) {
                    if (-1 === start) start = i;
                } else if (0x20 === code || 0x09 === code) {
                    if (-1 === end && -1 !== start) end = i;
                } else if (0x3b === code || 0x2c === code) {
                    if (-1 === start) throw new SyntaxError(`Unexpected character at index ${i}`);
                    if (-1 === end) end = i;
                    push(params, header.slice(start, end), true);
                    if (0x2c === code) {
                        push(offers, extensionName, params);
                        params = Object.create(null);
                        extensionName = void 0;
                    }
                    start = end = -1;
                } else if (0x3d === code && -1 !== start && -1 === end) {
                    paramName = header.slice(start, i);
                    start = end = -1;
                } else throw new SyntaxError(`Unexpected character at index ${i}`);
                else if (isEscaping) {
                    if (1 !== tokenChars[code]) throw new SyntaxError(`Unexpected character at index ${i}`);
                    if (-1 === start) start = i;
                    else if (!mustUnescape) mustUnescape = true;
                    isEscaping = false;
                } else if (inQuotes) if (1 === tokenChars[code]) {
                    if (-1 === start) start = i;
                } else if (0x22 === code && -1 !== start) {
                    inQuotes = false;
                    end = i;
                } else if (0x5c === code) isEscaping = true;
                else throw new SyntaxError(`Unexpected character at index ${i}`);
                else if (0x22 === code && 0x3d === header.charCodeAt(i - 1)) inQuotes = true;
                else if (-1 === end && 1 === tokenChars[code]) {
                    if (-1 === start) start = i;
                } else if (-1 !== start && (0x20 === code || 0x09 === code)) {
                    if (-1 === end) end = i;
                } else if (0x3b === code || 0x2c === code) {
                    if (-1 === start) throw new SyntaxError(`Unexpected character at index ${i}`);
                    if (-1 === end) end = i;
                    let value = header.slice(start, end);
                    if (mustUnescape) {
                        value = value.replace(/\\/g, '');
                        mustUnescape = false;
                    }
                    push(params, paramName, value);
                    if (0x2c === code) {
                        push(offers, extensionName, params);
                        params = Object.create(null);
                        extensionName = void 0;
                    }
                    paramName = void 0;
                    start = end = -1;
                } else throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (-1 === start || inQuotes || 0x20 === code || 0x09 === code) throw new SyntaxError('Unexpected end of input');
            if (-1 === end) end = i;
            const token = header.slice(start, end);
            if (void 0 === extensionName) push(offers, token, params);
            else {
                if (void 0 === paramName) push(params, token, true);
                else mustUnescape ? push(params, paramName, token.replace(/\\/g, '')) : push(params, paramName, token);
                push(offers, extensionName, params);
            }
            return offers;
        }
        function format(extensions) {
            return Object.keys(extensions).map((extension)=>{
                let configurations = extensions[extension];
                if (!Array.isArray(configurations)) configurations = [
                    configurations
                ];
                return configurations.map((params)=>[
                        extension
                    ].concat(Object.keys(params).map((k)=>{
                        let values = params[k];
                        if (!Array.isArray(values)) values = [
                            values
                        ];
                        return values.map((v)=>true === v ? k : `${k}=${v}`).join('; ');
                    })).join('; ')).join(', ');
            }).join(', ');
        }
        module.exports = {
            format,
            parse
        };
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/limiter.js" (module) {
        const kDone = Symbol('kDone');
        const kRun = Symbol('kRun');
        class Limiter {
            constructor(concurrency){
                this[kDone] = ()=>{
                    this.pending--;
                    this[kRun]();
                };
                this.concurrency = concurrency || 1 / 0;
                this.jobs = [];
                this.pending = 0;
            }
            add(job) {
                this.jobs.push(job);
                this[kRun]();
            }
            [kRun]() {
                if (this.pending === this.concurrency) return;
                if (this.jobs.length) {
                    const job = this.jobs.shift();
                    this.pending++;
                    job(this[kDone]);
                }
            }
        }
        module.exports = Limiter;
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/permessage-deflate.js" (module, __unused_rspack_exports, __webpack_require__) {
        const zlib = __webpack_require__("zlib");
        const bufferUtil = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/buffer-util.js");
        const Limiter = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/limiter.js");
        const { kStatusCode } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/constants.js");
        const FastBuffer = Buffer[Symbol.species];
        const TRAILER = Buffer.from([
            0x00,
            0x00,
            0xff,
            0xff
        ]);
        const kPerMessageDeflate = Symbol('permessage-deflate');
        const kTotalLength = Symbol('total-length');
        const kCallback = Symbol('callback');
        const kBuffers = Symbol('buffers');
        const kError = Symbol('error');
        let zlibLimiter;
        class PerMessageDeflate {
            constructor(options){
                this._options = options || {};
                this._threshold = void 0 !== this._options.threshold ? this._options.threshold : 1024;
                this._maxPayload = 0 | this._options.maxPayload;
                this._isServer = !!this._options.isServer;
                this._deflate = null;
                this._inflate = null;
                this.params = null;
                if (!zlibLimiter) {
                    const concurrency = void 0 !== this._options.concurrencyLimit ? this._options.concurrencyLimit : 10;
                    zlibLimiter = new Limiter(concurrency);
                }
            }
            static get extensionName() {
                return 'permessage-deflate';
            }
            offer() {
                const params = {};
                if (this._options.serverNoContextTakeover) params.server_no_context_takeover = true;
                if (this._options.clientNoContextTakeover) params.client_no_context_takeover = true;
                if (this._options.serverMaxWindowBits) params.server_max_window_bits = this._options.serverMaxWindowBits;
                if (this._options.clientMaxWindowBits) params.client_max_window_bits = this._options.clientMaxWindowBits;
                else if (null == this._options.clientMaxWindowBits) params.client_max_window_bits = true;
                return params;
            }
            accept(configurations) {
                configurations = this.normalizeParams(configurations);
                this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
                return this.params;
            }
            cleanup() {
                if (this._inflate) {
                    this._inflate.close();
                    this._inflate = null;
                }
                if (this._deflate) {
                    const callback = this._deflate[kCallback];
                    this._deflate.close();
                    this._deflate = null;
                    if (callback) callback(new Error('The deflate stream was closed while data was being processed'));
                }
            }
            acceptAsServer(offers) {
                const opts = this._options;
                const accepted = offers.find((params)=>{
                    if (false === opts.serverNoContextTakeover && params.server_no_context_takeover || params.server_max_window_bits && (false === opts.serverMaxWindowBits || 'number' == typeof opts.serverMaxWindowBits && opts.serverMaxWindowBits > params.server_max_window_bits) || 'number' == typeof opts.clientMaxWindowBits && !params.client_max_window_bits) return false;
                    return true;
                });
                if (!accepted) throw new Error('None of the extension offers can be accepted');
                if (opts.serverNoContextTakeover) accepted.server_no_context_takeover = true;
                if (opts.clientNoContextTakeover) accepted.client_no_context_takeover = true;
                if ('number' == typeof opts.serverMaxWindowBits) accepted.server_max_window_bits = opts.serverMaxWindowBits;
                if ('number' == typeof opts.clientMaxWindowBits) accepted.client_max_window_bits = opts.clientMaxWindowBits;
                else if (true === accepted.client_max_window_bits || false === opts.clientMaxWindowBits) delete accepted.client_max_window_bits;
                return accepted;
            }
            acceptAsClient(response) {
                const params = response[0];
                if (false === this._options.clientNoContextTakeover && params.client_no_context_takeover) throw new Error('Unexpected parameter "client_no_context_takeover"');
                if (params.client_max_window_bits) {
                    if (false === this._options.clientMaxWindowBits || 'number' == typeof this._options.clientMaxWindowBits && params.client_max_window_bits > this._options.clientMaxWindowBits) throw new Error('Unexpected or invalid parameter "client_max_window_bits"');
                } else if ('number' == typeof this._options.clientMaxWindowBits) params.client_max_window_bits = this._options.clientMaxWindowBits;
                return params;
            }
            normalizeParams(configurations) {
                configurations.forEach((params)=>{
                    Object.keys(params).forEach((key)=>{
                        let value = params[key];
                        if (value.length > 1) throw new Error(`Parameter "${key}" must have only a single value`);
                        value = value[0];
                        if ('client_max_window_bits' === key) {
                            if (true !== value) {
                                const num = +value;
                                if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
                                value = num;
                            } else if (!this._isServer) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
                        } else if ('server_max_window_bits' === key) {
                            const num = +value;
                            if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
                            value = num;
                        } else if ('client_no_context_takeover' === key || 'server_no_context_takeover' === key) {
                            if (true !== value) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
                        } else throw new Error(`Unknown parameter "${key}"`);
                        params[key] = value;
                    });
                });
                return configurations;
            }
            decompress(data, fin, callback) {
                zlibLimiter.add((done)=>{
                    this._decompress(data, fin, (err, result)=>{
                        done();
                        callback(err, result);
                    });
                });
            }
            compress(data, fin, callback) {
                zlibLimiter.add((done)=>{
                    this._compress(data, fin, (err, result)=>{
                        done();
                        callback(err, result);
                    });
                });
            }
            _decompress(data, fin, callback) {
                const endpoint = this._isServer ? 'client' : 'server';
                if (!this._inflate) {
                    const key = `${endpoint}_max_window_bits`;
                    const windowBits = 'number' != typeof this.params[key] ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
                    this._inflate = zlib.createInflateRaw({
                        ...this._options.zlibInflateOptions,
                        windowBits
                    });
                    this._inflate[kPerMessageDeflate] = this;
                    this._inflate[kTotalLength] = 0;
                    this._inflate[kBuffers] = [];
                    this._inflate.on('error', inflateOnError);
                    this._inflate.on('data', inflateOnData);
                }
                this._inflate[kCallback] = callback;
                this._inflate.write(data);
                if (fin) this._inflate.write(TRAILER);
                this._inflate.flush(()=>{
                    const err = this._inflate[kError];
                    if (err) {
                        this._inflate.close();
                        this._inflate = null;
                        callback(err);
                        return;
                    }
                    const data = bufferUtil.concat(this._inflate[kBuffers], this._inflate[kTotalLength]);
                    if (this._inflate._readableState.endEmitted) {
                        this._inflate.close();
                        this._inflate = null;
                    } else {
                        this._inflate[kTotalLength] = 0;
                        this._inflate[kBuffers] = [];
                        if (fin && this.params[`${endpoint}_no_context_takeover`]) this._inflate.reset();
                    }
                    callback(null, data);
                });
            }
            _compress(data, fin, callback) {
                const endpoint = this._isServer ? 'server' : 'client';
                if (!this._deflate) {
                    const key = `${endpoint}_max_window_bits`;
                    const windowBits = 'number' != typeof this.params[key] ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
                    this._deflate = zlib.createDeflateRaw({
                        ...this._options.zlibDeflateOptions,
                        windowBits
                    });
                    this._deflate[kTotalLength] = 0;
                    this._deflate[kBuffers] = [];
                    this._deflate.on('data', deflateOnData);
                }
                this._deflate[kCallback] = callback;
                this._deflate.write(data);
                this._deflate.flush(zlib.Z_SYNC_FLUSH, ()=>{
                    if (!this._deflate) return;
                    let data = bufferUtil.concat(this._deflate[kBuffers], this._deflate[kTotalLength]);
                    if (fin) data = new FastBuffer(data.buffer, data.byteOffset, data.length - 4);
                    this._deflate[kCallback] = null;
                    this._deflate[kTotalLength] = 0;
                    this._deflate[kBuffers] = [];
                    if (fin && this.params[`${endpoint}_no_context_takeover`]) this._deflate.reset();
                    callback(null, data);
                });
            }
        }
        module.exports = PerMessageDeflate;
        function deflateOnData(chunk) {
            this[kBuffers].push(chunk);
            this[kTotalLength] += chunk.length;
        }
        function inflateOnData(chunk) {
            this[kTotalLength] += chunk.length;
            if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) return void this[kBuffers].push(chunk);
            this[kError] = new RangeError('Max payload size exceeded');
            this[kError].code = 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH';
            this[kError][kStatusCode] = 1009;
            this.removeListener('data', inflateOnData);
            this.reset();
        }
        function inflateOnError(err) {
            this[kPerMessageDeflate]._inflate = null;
            if (this[kError]) return void this[kCallback](this[kError]);
            err[kStatusCode] = 1007;
            this[kCallback](err);
        }
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/receiver.js" (module, __unused_rspack_exports, __webpack_require__) {
        const { Writable } = __webpack_require__("stream");
        const PerMessageDeflate = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/permessage-deflate.js");
        const { BINARY_TYPES, EMPTY_BUFFER, kStatusCode, kWebSocket } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/constants.js");
        const { concat, toArrayBuffer, unmask } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/buffer-util.js");
        const { isValidStatusCode, isValidUTF8 } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/validation.js");
        const FastBuffer = Buffer[Symbol.species];
        const GET_INFO = 0;
        const GET_PAYLOAD_LENGTH_16 = 1;
        const GET_PAYLOAD_LENGTH_64 = 2;
        const GET_MASK = 3;
        const GET_DATA = 4;
        const INFLATING = 5;
        const DEFER_EVENT = 6;
        class Receiver extends Writable {
            constructor(options = {}){
                super();
                this._allowSynchronousEvents = void 0 !== options.allowSynchronousEvents ? options.allowSynchronousEvents : true;
                this._binaryType = options.binaryType || BINARY_TYPES[0];
                this._extensions = options.extensions || {};
                this._isServer = !!options.isServer;
                this._maxBufferedChunks = 0 | options.maxBufferedChunks;
                this._maxFragments = 0 | options.maxFragments;
                this._maxPayload = 0 | options.maxPayload;
                this._skipUTF8Validation = !!options.skipUTF8Validation;
                this[kWebSocket] = void 0;
                this._bufferedBytes = 0;
                this._buffers = [];
                this._compressed = false;
                this._payloadLength = 0;
                this._mask = void 0;
                this._fragmented = 0;
                this._masked = false;
                this._fin = false;
                this._opcode = 0;
                this._totalPayloadLength = 0;
                this._messageLength = 0;
                this._fragments = [];
                this._errored = false;
                this._loop = false;
                this._state = GET_INFO;
            }
            _write(chunk, encoding, cb) {
                if (0x08 === this._opcode && this._state == GET_INFO) return cb();
                if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) return void cb(this.createError(RangeError, 'Too many buffered chunks', false, 1008, 'WS_ERR_TOO_MANY_BUFFERED_PARTS'));
                this._bufferedBytes += chunk.length;
                this._buffers.push(chunk);
                this.startLoop(cb);
            }
            consume(n) {
                this._bufferedBytes -= n;
                if (n === this._buffers[0].length) return this._buffers.shift();
                if (n < this._buffers[0].length) {
                    const buf = this._buffers[0];
                    this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
                    return new FastBuffer(buf.buffer, buf.byteOffset, n);
                }
                const dst = Buffer.allocUnsafe(n);
                do {
                    const buf = this._buffers[0];
                    const offset = dst.length - n;
                    if (n >= buf.length) dst.set(this._buffers.shift(), offset);
                    else {
                        dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
                        this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
                    }
                    n -= buf.length;
                }while (n > 0);
                return dst;
            }
            startLoop(cb) {
                this._loop = true;
                do switch(this._state){
                    case GET_INFO:
                        this.getInfo(cb);
                        break;
                    case GET_PAYLOAD_LENGTH_16:
                        this.getPayloadLength16(cb);
                        break;
                    case GET_PAYLOAD_LENGTH_64:
                        this.getPayloadLength64(cb);
                        break;
                    case GET_MASK:
                        this.getMask();
                        break;
                    case GET_DATA:
                        this.getData(cb);
                        break;
                    case INFLATING:
                    case DEFER_EVENT:
                        this._loop = false;
                        return;
                }
                while (this._loop);
                if (!this._errored) cb();
            }
            getInfo(cb) {
                if (this._bufferedBytes < 2) {
                    this._loop = false;
                    return;
                }
                const buf = this.consume(2);
                if ((0x30 & buf[0]) !== 0x00) {
                    const error = this.createError(RangeError, 'RSV2 and RSV3 must be clear', true, 1002, 'WS_ERR_UNEXPECTED_RSV_2_3');
                    cb(error);
                    return;
                }
                const compressed = (0x40 & buf[0]) === 0x40;
                if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
                    const error = this.createError(RangeError, 'RSV1 must be clear', true, 1002, 'WS_ERR_UNEXPECTED_RSV_1');
                    cb(error);
                    return;
                }
                this._fin = (0x80 & buf[0]) === 0x80;
                this._opcode = 0x0f & buf[0];
                this._payloadLength = 0x7f & buf[1];
                if (0x00 === this._opcode) {
                    if (compressed) {
                        const error = this.createError(RangeError, 'RSV1 must be clear', true, 1002, 'WS_ERR_UNEXPECTED_RSV_1');
                        cb(error);
                        return;
                    }
                    if (!this._fragmented) {
                        const error = this.createError(RangeError, 'invalid opcode 0', true, 1002, 'WS_ERR_INVALID_OPCODE');
                        cb(error);
                        return;
                    }
                    this._opcode = this._fragmented;
                } else if (0x01 === this._opcode || 0x02 === this._opcode) {
                    if (this._fragmented) {
                        const error = this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, 'WS_ERR_INVALID_OPCODE');
                        cb(error);
                        return;
                    }
                    this._compressed = compressed;
                } else if (this._opcode > 0x07 && this._opcode < 0x0b) {
                    if (!this._fin) {
                        const error = this.createError(RangeError, 'FIN must be set', true, 1002, 'WS_ERR_EXPECTED_FIN');
                        cb(error);
                        return;
                    }
                    if (compressed) {
                        const error = this.createError(RangeError, 'RSV1 must be clear', true, 1002, 'WS_ERR_UNEXPECTED_RSV_1');
                        cb(error);
                        return;
                    }
                    if (this._payloadLength > 0x7d || 0x08 === this._opcode && 1 === this._payloadLength) {
                        const error = this.createError(RangeError, `invalid payload length ${this._payloadLength}`, true, 1002, 'WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH');
                        cb(error);
                        return;
                    }
                } else {
                    const error = this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, 'WS_ERR_INVALID_OPCODE');
                    cb(error);
                    return;
                }
                if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
                this._masked = (0x80 & buf[1]) === 0x80;
                if (this._isServer) {
                    if (!this._masked) {
                        const error = this.createError(RangeError, 'MASK must be set', true, 1002, 'WS_ERR_EXPECTED_MASK');
                        cb(error);
                        return;
                    }
                } else if (this._masked) {
                    const error = this.createError(RangeError, 'MASK must be clear', true, 1002, 'WS_ERR_UNEXPECTED_MASK');
                    cb(error);
                    return;
                }
                if (126 === this._payloadLength) this._state = GET_PAYLOAD_LENGTH_16;
                else if (127 === this._payloadLength) this._state = GET_PAYLOAD_LENGTH_64;
                else this.haveLength(cb);
            }
            getPayloadLength16(cb) {
                if (this._bufferedBytes < 2) {
                    this._loop = false;
                    return;
                }
                this._payloadLength = this.consume(2).readUInt16BE(0);
                this.haveLength(cb);
            }
            getPayloadLength64(cb) {
                if (this._bufferedBytes < 8) {
                    this._loop = false;
                    return;
                }
                const buf = this.consume(8);
                const num = buf.readUInt32BE(0);
                if (num > Math.pow(2, 21) - 1) {
                    const error = this.createError(RangeError, 'Unsupported WebSocket frame: payload length > 2^53 - 1', false, 1009, 'WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH');
                    cb(error);
                    return;
                }
                this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
                this.haveLength(cb);
            }
            haveLength(cb) {
                if (this._payloadLength && this._opcode < 0x08) {
                    this._totalPayloadLength += this._payloadLength;
                    if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
                        const error = this.createError(RangeError, 'Max payload size exceeded', false, 1009, 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH');
                        cb(error);
                        return;
                    }
                }
                if (this._masked) this._state = GET_MASK;
                else this._state = GET_DATA;
            }
            getMask() {
                if (this._bufferedBytes < 4) {
                    this._loop = false;
                    return;
                }
                this._mask = this.consume(4);
                this._state = GET_DATA;
            }
            getData(cb) {
                let data = EMPTY_BUFFER;
                if (this._payloadLength) {
                    if (this._bufferedBytes < this._payloadLength) {
                        this._loop = false;
                        return;
                    }
                    data = this.consume(this._payloadLength);
                    if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) unmask(data, this._mask);
                }
                if (this._opcode > 0x07) return void this.controlMessage(data, cb);
                if (this._compressed) {
                    this._state = INFLATING;
                    this.decompress(data, cb);
                    return;
                }
                if (data.length) {
                    if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
                        const error = this.createError(RangeError, 'Too many message fragments', false, 1008, 'WS_ERR_TOO_MANY_BUFFERED_PARTS');
                        cb(error);
                        return;
                    }
                    this._messageLength = this._totalPayloadLength;
                    this._fragments.push(data);
                }
                this.dataMessage(cb);
            }
            decompress(data, cb) {
                const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
                perMessageDeflate.decompress(data, this._fin, (err, buf)=>{
                    if (err) return cb(err);
                    if (buf.length) {
                        this._messageLength += buf.length;
                        if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
                            const error = this.createError(RangeError, 'Max payload size exceeded', false, 1009, 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH');
                            cb(error);
                            return;
                        }
                        if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
                            const error = this.createError(RangeError, 'Too many message fragments', false, 1008, 'WS_ERR_TOO_MANY_BUFFERED_PARTS');
                            cb(error);
                            return;
                        }
                        this._fragments.push(buf);
                    }
                    this.dataMessage(cb);
                    if (this._state === GET_INFO) this.startLoop(cb);
                });
            }
            dataMessage(cb) {
                if (!this._fin) {
                    this._state = GET_INFO;
                    return;
                }
                const messageLength = this._messageLength;
                const fragments = this._fragments;
                this._totalPayloadLength = 0;
                this._messageLength = 0;
                this._fragmented = 0;
                this._fragments = [];
                if (2 === this._opcode) {
                    let data;
                    data = 'nodebuffer' === this._binaryType ? concat(fragments, messageLength) : 'arraybuffer' === this._binaryType ? toArrayBuffer(concat(fragments, messageLength)) : 'blob' === this._binaryType ? new Blob(fragments) : fragments;
                    if (this._allowSynchronousEvents) {
                        this.emit('message', data, true);
                        this._state = GET_INFO;
                    } else {
                        this._state = DEFER_EVENT;
                        setImmediate(()=>{
                            this.emit('message', data, true);
                            this._state = GET_INFO;
                            this.startLoop(cb);
                        });
                    }
                } else {
                    const buf = concat(fragments, messageLength);
                    if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
                        const error = this.createError(Error, 'invalid UTF-8 sequence', true, 1007, 'WS_ERR_INVALID_UTF8');
                        cb(error);
                        return;
                    }
                    if (this._state === INFLATING || this._allowSynchronousEvents) {
                        this.emit('message', buf, false);
                        this._state = GET_INFO;
                    } else {
                        this._state = DEFER_EVENT;
                        setImmediate(()=>{
                            this.emit('message', buf, false);
                            this._state = GET_INFO;
                            this.startLoop(cb);
                        });
                    }
                }
            }
            controlMessage(data, cb) {
                if (0x08 === this._opcode) {
                    if (0 === data.length) {
                        this._loop = false;
                        this.emit('conclude', 1005, EMPTY_BUFFER);
                        this.end();
                    } else {
                        const code = data.readUInt16BE(0);
                        if (!isValidStatusCode(code)) {
                            const error = this.createError(RangeError, `invalid status code ${code}`, true, 1002, 'WS_ERR_INVALID_CLOSE_CODE');
                            cb(error);
                            return;
                        }
                        const buf = new FastBuffer(data.buffer, data.byteOffset + 2, data.length - 2);
                        if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
                            const error = this.createError(Error, 'invalid UTF-8 sequence', true, 1007, 'WS_ERR_INVALID_UTF8');
                            cb(error);
                            return;
                        }
                        this._loop = false;
                        this.emit('conclude', code, buf);
                        this.end();
                    }
                    this._state = GET_INFO;
                    return;
                }
                if (this._allowSynchronousEvents) {
                    this.emit(0x09 === this._opcode ? 'ping' : 'pong', data);
                    this._state = GET_INFO;
                } else {
                    this._state = DEFER_EVENT;
                    setImmediate(()=>{
                        this.emit(0x09 === this._opcode ? 'ping' : 'pong', data);
                        this._state = GET_INFO;
                        this.startLoop(cb);
                    });
                }
            }
            createError(ErrorCtor, message, prefix, statusCode, errorCode) {
                this._loop = false;
                this._errored = true;
                const err = new ErrorCtor(prefix ? `Invalid WebSocket frame: ${message}` : message);
                Error.captureStackTrace(err, this.createError);
                err.code = errorCode;
                err[kStatusCode] = statusCode;
                return err;
            }
        }
        module.exports = Receiver;
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/sender.js" (module, __unused_rspack_exports, __webpack_require__) {
        const { Duplex } = __webpack_require__("stream");
        const { randomFillSync } = __webpack_require__("crypto");
        const { types: { isUint8Array } } = __webpack_require__("util");
        const PerMessageDeflate = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/permessage-deflate.js");
        const { EMPTY_BUFFER, kWebSocket, NOOP } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/constants.js");
        const { isBlob, isValidStatusCode } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/validation.js");
        const { mask: applyMask, toBuffer } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/buffer-util.js");
        const kByteLength = Symbol('kByteLength');
        const maskBuffer = Buffer.alloc(4);
        const RANDOM_POOL_SIZE = 8192;
        let randomPool;
        let randomPoolPointer = RANDOM_POOL_SIZE;
        const DEFAULT = 0;
        const DEFLATING = 1;
        const GET_BLOB_DATA = 2;
        class Sender {
            constructor(socket, extensions, generateMask){
                this._extensions = extensions || {};
                if (generateMask) {
                    this._generateMask = generateMask;
                    this._maskBuffer = Buffer.alloc(4);
                }
                this._socket = socket;
                this._firstFragment = true;
                this._compress = false;
                this._bufferedBytes = 0;
                this._queue = [];
                this._state = DEFAULT;
                this.onerror = NOOP;
                this[kWebSocket] = void 0;
            }
            static frame(data, options) {
                let mask;
                let merge = false;
                let offset = 2;
                let skipMasking = false;
                if (options.mask) {
                    mask = options.maskBuffer || maskBuffer;
                    if (options.generateMask) options.generateMask(mask);
                    else {
                        if (randomPoolPointer === RANDOM_POOL_SIZE) {
                            if (void 0 === randomPool) randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
                            randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
                            randomPoolPointer = 0;
                        }
                        mask[0] = randomPool[randomPoolPointer++];
                        mask[1] = randomPool[randomPoolPointer++];
                        mask[2] = randomPool[randomPoolPointer++];
                        mask[3] = randomPool[randomPoolPointer++];
                    }
                    skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
                    offset = 6;
                }
                let dataLength;
                if ('string' == typeof data) if ((!options.mask || skipMasking) && void 0 !== options[kByteLength]) dataLength = options[kByteLength];
                else {
                    data = Buffer.from(data);
                    dataLength = data.length;
                }
                else {
                    dataLength = data.length;
                    merge = options.mask && options.readOnly && !skipMasking;
                }
                let payloadLength = dataLength;
                if (dataLength >= 65536) {
                    offset += 8;
                    payloadLength = 127;
                } else if (dataLength > 125) {
                    offset += 2;
                    payloadLength = 126;
                }
                const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
                target[0] = options.fin ? 0x80 | options.opcode : options.opcode;
                if (options.rsv1) target[0] |= 0x40;
                target[1] = payloadLength;
                if (126 === payloadLength) target.writeUInt16BE(dataLength, 2);
                else if (127 === payloadLength) {
                    target[2] = target[3] = 0;
                    target.writeUIntBE(dataLength, 4, 6);
                }
                if (!options.mask) return [
                    target,
                    data
                ];
                target[1] |= 0x80;
                target[offset - 4] = mask[0];
                target[offset - 3] = mask[1];
                target[offset - 2] = mask[2];
                target[offset - 1] = mask[3];
                if (skipMasking) return [
                    target,
                    data
                ];
                if (merge) {
                    applyMask(data, mask, target, offset, dataLength);
                    return [
                        target
                    ];
                }
                applyMask(data, mask, data, 0, dataLength);
                return [
                    target,
                    data
                ];
            }
            close(code, data, mask, cb) {
                let buf;
                if (void 0 === code) buf = EMPTY_BUFFER;
                else if ('number' == typeof code && isValidStatusCode(code)) if (void 0 !== data && data.length) {
                    const length = Buffer.byteLength(data);
                    if (length > 123) throw new RangeError('The message must not be greater than 123 bytes');
                    buf = Buffer.allocUnsafe(2 + length);
                    buf.writeUInt16BE(code, 0);
                    if ('string' == typeof data) buf.write(data, 2);
                    else if (isUint8Array(data)) buf.set(data, 2);
                    else throw new TypeError('Second argument must be a string or a Uint8Array');
                } else {
                    buf = Buffer.allocUnsafe(2);
                    buf.writeUInt16BE(code, 0);
                }
                else throw new TypeError('First argument must be a valid error code number');
                const options = {
                    [kByteLength]: buf.length,
                    fin: true,
                    generateMask: this._generateMask,
                    mask,
                    maskBuffer: this._maskBuffer,
                    opcode: 0x08,
                    readOnly: false,
                    rsv1: false
                };
                if (this._state !== DEFAULT) this.enqueue([
                    this.dispatch,
                    buf,
                    false,
                    options,
                    cb
                ]);
                else this.sendFrame(Sender.frame(buf, options), cb);
            }
            ping(data, mask, cb) {
                let byteLength;
                let readOnly;
                if ('string' == typeof data) {
                    byteLength = Buffer.byteLength(data);
                    readOnly = false;
                } else if (isBlob(data)) {
                    byteLength = data.size;
                    readOnly = false;
                } else {
                    data = toBuffer(data);
                    byteLength = data.length;
                    readOnly = toBuffer.readOnly;
                }
                if (byteLength > 125) throw new RangeError('The data size must not be greater than 125 bytes');
                const options = {
                    [kByteLength]: byteLength,
                    fin: true,
                    generateMask: this._generateMask,
                    mask,
                    maskBuffer: this._maskBuffer,
                    opcode: 0x09,
                    readOnly,
                    rsv1: false
                };
                if (isBlob(data)) if (this._state !== DEFAULT) this.enqueue([
                    this.getBlobData,
                    data,
                    false,
                    options,
                    cb
                ]);
                else this.getBlobData(data, false, options, cb);
                else if (this._state !== DEFAULT) this.enqueue([
                    this.dispatch,
                    data,
                    false,
                    options,
                    cb
                ]);
                else this.sendFrame(Sender.frame(data, options), cb);
            }
            pong(data, mask, cb) {
                let byteLength;
                let readOnly;
                if ('string' == typeof data) {
                    byteLength = Buffer.byteLength(data);
                    readOnly = false;
                } else if (isBlob(data)) {
                    byteLength = data.size;
                    readOnly = false;
                } else {
                    data = toBuffer(data);
                    byteLength = data.length;
                    readOnly = toBuffer.readOnly;
                }
                if (byteLength > 125) throw new RangeError('The data size must not be greater than 125 bytes');
                const options = {
                    [kByteLength]: byteLength,
                    fin: true,
                    generateMask: this._generateMask,
                    mask,
                    maskBuffer: this._maskBuffer,
                    opcode: 0x0a,
                    readOnly,
                    rsv1: false
                };
                if (isBlob(data)) if (this._state !== DEFAULT) this.enqueue([
                    this.getBlobData,
                    data,
                    false,
                    options,
                    cb
                ]);
                else this.getBlobData(data, false, options, cb);
                else if (this._state !== DEFAULT) this.enqueue([
                    this.dispatch,
                    data,
                    false,
                    options,
                    cb
                ]);
                else this.sendFrame(Sender.frame(data, options), cb);
            }
            send(data, options, cb) {
                const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
                let opcode = options.binary ? 2 : 1;
                let rsv1 = options.compress;
                let byteLength;
                let readOnly;
                if ('string' == typeof data) {
                    byteLength = Buffer.byteLength(data);
                    readOnly = false;
                } else if (isBlob(data)) {
                    byteLength = data.size;
                    readOnly = false;
                } else {
                    data = toBuffer(data);
                    byteLength = data.length;
                    readOnly = toBuffer.readOnly;
                }
                if (this._firstFragment) {
                    this._firstFragment = false;
                    if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? 'server_no_context_takeover' : 'client_no_context_takeover']) rsv1 = byteLength >= perMessageDeflate._threshold;
                    this._compress = rsv1;
                } else {
                    rsv1 = false;
                    opcode = 0;
                }
                if (options.fin) this._firstFragment = true;
                const opts = {
                    [kByteLength]: byteLength,
                    fin: options.fin,
                    generateMask: this._generateMask,
                    mask: options.mask,
                    maskBuffer: this._maskBuffer,
                    opcode,
                    readOnly,
                    rsv1
                };
                if (isBlob(data)) if (this._state !== DEFAULT) this.enqueue([
                    this.getBlobData,
                    data,
                    this._compress,
                    opts,
                    cb
                ]);
                else this.getBlobData(data, this._compress, opts, cb);
                else if (this._state !== DEFAULT) this.enqueue([
                    this.dispatch,
                    data,
                    this._compress,
                    opts,
                    cb
                ]);
                else this.dispatch(data, this._compress, opts, cb);
            }
            getBlobData(blob, compress, options, cb) {
                this._bufferedBytes += options[kByteLength];
                this._state = GET_BLOB_DATA;
                blob.arrayBuffer().then((arrayBuffer)=>{
                    if (this._socket.destroyed) {
                        const err = new Error('The socket was closed while the blob was being read');
                        process.nextTick(callCallbacks, this, err, cb);
                        return;
                    }
                    this._bufferedBytes -= options[kByteLength];
                    const data = toBuffer(arrayBuffer);
                    if (compress) this.dispatch(data, compress, options, cb);
                    else {
                        this._state = DEFAULT;
                        this.sendFrame(Sender.frame(data, options), cb);
                        this.dequeue();
                    }
                }).catch((err)=>{
                    process.nextTick(onError, this, err, cb);
                });
            }
            dispatch(data, compress, options, cb) {
                if (!compress) return void this.sendFrame(Sender.frame(data, options), cb);
                const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
                this._bufferedBytes += options[kByteLength];
                this._state = DEFLATING;
                perMessageDeflate.compress(data, options.fin, (_, buf)=>{
                    if (this._socket.destroyed) {
                        const err = new Error('The socket was closed while data was being compressed');
                        callCallbacks(this, err, cb);
                        return;
                    }
                    this._bufferedBytes -= options[kByteLength];
                    this._state = DEFAULT;
                    options.readOnly = false;
                    this.sendFrame(Sender.frame(buf, options), cb);
                    this.dequeue();
                });
            }
            dequeue() {
                while(this._state === DEFAULT && this._queue.length){
                    const params = this._queue.shift();
                    this._bufferedBytes -= params[3][kByteLength];
                    Reflect.apply(params[0], this, params.slice(1));
                }
            }
            enqueue(params) {
                this._bufferedBytes += params[3][kByteLength];
                this._queue.push(params);
            }
            sendFrame(list, cb) {
                if (2 === list.length) {
                    this._socket.cork();
                    this._socket.write(list[0]);
                    this._socket.write(list[1], cb);
                    this._socket.uncork();
                } else this._socket.write(list[0], cb);
            }
        }
        module.exports = Sender;
        function callCallbacks(sender, err, cb) {
            if ('function' == typeof cb) cb(err);
            for(let i = 0; i < sender._queue.length; i++){
                const params = sender._queue[i];
                const callback = params[params.length - 1];
                if ('function' == typeof callback) callback(err);
            }
        }
        function onError(sender, err, cb) {
            callCallbacks(sender, err, cb);
            sender.onerror(err);
        }
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/stream.js" (module, __unused_rspack_exports, __webpack_require__) {
        __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/websocket.js");
        const { Duplex } = __webpack_require__("stream");
        function emitClose(stream) {
            stream.emit('close');
        }
        function duplexOnEnd() {
            if (!this.destroyed && this._writableState.finished) this.destroy();
        }
        function duplexOnError(err) {
            this.removeListener('error', duplexOnError);
            this.destroy();
            if (0 === this.listenerCount('error')) this.emit('error', err);
        }
        function createWebSocketStream(ws, options) {
            let terminateOnDestroy = true;
            const duplex = new Duplex({
                ...options,
                autoDestroy: false,
                emitClose: false,
                objectMode: false,
                writableObjectMode: false
            });
            ws.on('message', function(msg, isBinary) {
                const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
                if (!duplex.push(data)) ws.pause();
            });
            ws.once('error', function(err) {
                if (duplex.destroyed) return;
                terminateOnDestroy = false;
                duplex.destroy(err);
            });
            ws.once('close', function() {
                if (duplex.destroyed) return;
                duplex.push(null);
            });
            duplex._destroy = function(err, callback) {
                if (ws.readyState === ws.CLOSED) {
                    callback(err);
                    process.nextTick(emitClose, duplex);
                    return;
                }
                let called = false;
                ws.once('error', function(err) {
                    called = true;
                    callback(err);
                });
                ws.once('close', function() {
                    if (!called) callback(err);
                    process.nextTick(emitClose, duplex);
                });
                if (terminateOnDestroy) ws.terminate();
            };
            duplex._final = function(callback) {
                if (ws.readyState === ws.CONNECTING) return void ws.once('open', function() {
                    duplex._final(callback);
                });
                if (null === ws._socket) return;
                if (ws._socket._writableState.finished) {
                    callback();
                    if (duplex._readableState.endEmitted) duplex.destroy();
                } else {
                    ws._socket.once('finish', function() {
                        callback();
                    });
                    ws.close();
                }
            };
            duplex._read = function() {
                if (ws.isPaused) ws.resume();
            };
            duplex._write = function(chunk, encoding, callback) {
                if (ws.readyState === ws.CONNECTING) return void ws.once('open', function() {
                    duplex._write(chunk, encoding, callback);
                });
                ws.send(chunk, callback);
            };
            duplex.on('end', duplexOnEnd);
            duplex.on('error', duplexOnError);
            return duplex;
        }
        module.exports = createWebSocketStream;
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/subprotocol.js" (module, __unused_rspack_exports, __webpack_require__) {
        const { tokenChars } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/validation.js");
        function parse(header) {
            const protocols = new Set();
            let start = -1;
            let end = -1;
            let i = 0;
            for(i; i < header.length; i++){
                const code = header.charCodeAt(i);
                if (-1 === end && 1 === tokenChars[code]) {
                    if (-1 === start) start = i;
                } else if (0 !== i && (0x20 === code || 0x09 === code)) {
                    if (-1 === end && -1 !== start) end = i;
                } else if (0x2c === code) {
                    if (-1 === start) throw new SyntaxError(`Unexpected character at index ${i}`);
                    if (-1 === end) end = i;
                    const protocol = header.slice(start, end);
                    if (protocols.has(protocol)) throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
                    protocols.add(protocol);
                    start = end = -1;
                } else throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (-1 === start || -1 !== end) throw new SyntaxError('Unexpected end of input');
            const protocol = header.slice(start, i);
            if (protocols.has(protocol)) throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
            protocols.add(protocol);
            return protocols;
        }
        module.exports = {
            parse
        };
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/validation.js" (module, __unused_rspack_exports, __webpack_require__) {
        const { isUtf8 } = __webpack_require__("buffer");
        const { hasBlob } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/constants.js");
        const tokenChars = [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
            1,
            1,
            1,
            1,
            1,
            0,
            0,
            1,
            1,
            0,
            1,
            1,
            0,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            0,
            0,
            0,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            0,
            1,
            0,
            1,
            0
        ];
        function isValidStatusCode(code) {
            return code >= 1000 && code <= 1014 && 1004 !== code && 1005 !== code && 1006 !== code || code >= 3000 && code <= 4999;
        }
        function _isValidUTF8(buf) {
            const len = buf.length;
            let i = 0;
            while(i < len)if ((0x80 & buf[i]) === 0) i++;
            else if ((0xe0 & buf[i]) === 0xc0) {
                if (i + 1 === len || (0xc0 & buf[i + 1]) !== 0x80 || (0xfe & buf[i]) === 0xc0) return false;
                i += 2;
            } else if ((0xf0 & buf[i]) === 0xe0) {
                if (i + 2 >= len || (0xc0 & buf[i + 1]) !== 0x80 || (0xc0 & buf[i + 2]) !== 0x80 || 0xe0 === buf[i] && (0xe0 & buf[i + 1]) === 0x80 || 0xed === buf[i] && (0xe0 & buf[i + 1]) === 0xa0) return false;
                i += 3;
            } else {
                if ((0xf8 & buf[i]) !== 0xf0) return false;
                if (i + 3 >= len || (0xc0 & buf[i + 1]) !== 0x80 || (0xc0 & buf[i + 2]) !== 0x80 || (0xc0 & buf[i + 3]) !== 0x80 || 0xf0 === buf[i] && (0xf0 & buf[i + 1]) === 0x80 || 0xf4 === buf[i] && buf[i + 1] > 0x8f || buf[i] > 0xf4) return false;
                i += 4;
            }
            return true;
        }
        function isBlob(value) {
            return hasBlob && 'object' == typeof value && 'function' == typeof value.arrayBuffer && 'string' == typeof value.type && 'function' == typeof value.stream && ('Blob' === value[Symbol.toStringTag] || 'File' === value[Symbol.toStringTag]);
        }
        module.exports = {
            isBlob,
            isValidStatusCode,
            isValidUTF8: _isValidUTF8,
            tokenChars
        };
        if (isUtf8) module.exports.isValidUTF8 = function(buf) {
            return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
        };
        else if (!process.env.WS_NO_UTF_8_VALIDATE) try {
            const isValidUTF8 = __webpack_require__(Object(function() {
                var e = new Error("Cannot find module 'utf-8-validate'");
                e.code = 'MODULE_NOT_FOUND';
                throw e;
            }()));
            module.exports.isValidUTF8 = function(buf) {
                return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
            };
        } catch (e) {}
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/websocket-server.js" (module, __unused_rspack_exports, __webpack_require__) {
        const EventEmitter = __webpack_require__("events");
        const http = __webpack_require__("http");
        const { Duplex } = __webpack_require__("stream");
        const { createHash } = __webpack_require__("crypto");
        const extension = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/extension.js");
        const PerMessageDeflate = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/permessage-deflate.js");
        const subprotocol = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/subprotocol.js");
        const WebSocket = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/websocket.js");
        const { CLOSE_TIMEOUT, GUID, kWebSocket } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/constants.js");
        const keyRegex = /^[+/0-9A-Za-z]{22}==$/;
        const RUNNING = 0;
        const CLOSING = 1;
        const CLOSED = 2;
        class WebSocketServer extends EventEmitter {
            constructor(options, callback){
                super();
                options = {
                    allowSynchronousEvents: true,
                    autoPong: true,
                    maxBufferedChunks: 1048576,
                    maxFragments: 131072,
                    maxPayload: 104857600,
                    skipUTF8Validation: false,
                    perMessageDeflate: false,
                    handleProtocols: null,
                    clientTracking: true,
                    closeTimeout: CLOSE_TIMEOUT,
                    verifyClient: null,
                    noServer: false,
                    backlog: null,
                    server: null,
                    host: null,
                    path: null,
                    port: null,
                    WebSocket,
                    ...options
                };
                if (null == options.port && !options.server && !options.noServer || null != options.port && (options.server || options.noServer) || options.server && options.noServer) throw new TypeError('One and only one of the "port", "server", or "noServer" options must be specified');
                if (null != options.port) {
                    this._server = http.createServer((req, res)=>{
                        const body = http.STATUS_CODES[426];
                        res.writeHead(426, {
                            'Content-Length': body.length,
                            'Content-Type': 'text/plain'
                        });
                        res.end(body);
                    });
                    this._server.listen(options.port, options.host, options.backlog, callback);
                } else if (options.server) this._server = options.server;
                if (this._server) {
                    const emitConnection = this.emit.bind(this, 'connection');
                    this._removeListeners = addListeners(this._server, {
                        listening: this.emit.bind(this, 'listening'),
                        error: this.emit.bind(this, 'error'),
                        upgrade: (req, socket, head)=>{
                            this.handleUpgrade(req, socket, head, emitConnection);
                        }
                    });
                }
                if (true === options.perMessageDeflate) options.perMessageDeflate = {};
                if (options.clientTracking) {
                    this.clients = new Set();
                    this._shouldEmitClose = false;
                }
                this.options = options;
                this._state = RUNNING;
            }
            address() {
                if (this.options.noServer) throw new Error('The server is operating in "noServer" mode');
                if (!this._server) return null;
                return this._server.address();
            }
            close(cb) {
                if (this._state === CLOSED) {
                    if (cb) this.once('close', ()=>{
                        cb(new Error('The server is not running'));
                    });
                    process.nextTick(emitClose, this);
                    return;
                }
                if (cb) this.once('close', cb);
                if (this._state === CLOSING) return;
                this._state = CLOSING;
                if (this.options.noServer || this.options.server) {
                    if (this._server) {
                        this._removeListeners();
                        this._removeListeners = this._server = null;
                    }
                    if (this.clients) if (this.clients.size) this._shouldEmitClose = true;
                    else process.nextTick(emitClose, this);
                    else process.nextTick(emitClose, this);
                } else {
                    const server = this._server;
                    this._removeListeners();
                    this._removeListeners = this._server = null;
                    server.close(()=>{
                        emitClose(this);
                    });
                }
            }
            shouldHandle(req) {
                if (this.options.path) {
                    const index = req.url.indexOf('?');
                    const pathname = -1 !== index ? req.url.slice(0, index) : req.url;
                    if (pathname !== this.options.path) return false;
                }
                return true;
            }
            handleUpgrade(req, socket, head, cb) {
                socket.on('error', socketOnError);
                const key = req.headers['sec-websocket-key'];
                const upgrade = req.headers.upgrade;
                const version = +req.headers['sec-websocket-version'];
                if ('GET' !== req.method) {
                    const message = 'Invalid HTTP method';
                    abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
                    return;
                }
                if (void 0 === upgrade || 'websocket' !== upgrade.toLowerCase()) {
                    const message = 'Invalid Upgrade header';
                    abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
                    return;
                }
                if (void 0 === key || !keyRegex.test(key)) {
                    const message = 'Missing or invalid Sec-WebSocket-Key header';
                    abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
                    return;
                }
                if (13 !== version && 8 !== version) {
                    const message = 'Missing or invalid Sec-WebSocket-Version header';
                    abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
                        'Sec-WebSocket-Version': '13, 8'
                    });
                    return;
                }
                if (!this.shouldHandle(req)) return void abortHandshake(socket, 400);
                const secWebSocketProtocol = req.headers['sec-websocket-protocol'];
                let protocols = new Set();
                if (void 0 !== secWebSocketProtocol) try {
                    protocols = subprotocol.parse(secWebSocketProtocol);
                } catch (err) {
                    const message = 'Invalid Sec-WebSocket-Protocol header';
                    abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
                    return;
                }
                const secWebSocketExtensions = req.headers['sec-websocket-extensions'];
                const extensions = {};
                if (this.options.perMessageDeflate && void 0 !== secWebSocketExtensions) {
                    const perMessageDeflate = new PerMessageDeflate({
                        ...this.options.perMessageDeflate,
                        isServer: true,
                        maxPayload: this.options.maxPayload
                    });
                    try {
                        const offers = extension.parse(secWebSocketExtensions);
                        if (offers[PerMessageDeflate.extensionName]) {
                            perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
                            extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
                        }
                    } catch (err) {
                        const message = 'Invalid or unacceptable Sec-WebSocket-Extensions header';
                        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
                        return;
                    }
                }
                if (this.options.verifyClient) {
                    const info = {
                        origin: req.headers[`${8 === version ? 'sec-websocket-origin' : 'origin'}`],
                        secure: !!(req.socket.authorized || req.socket.encrypted),
                        req
                    };
                    if (2 === this.options.verifyClient.length) return void this.options.verifyClient(info, (verified, code, message, headers)=>{
                        if (!verified) return abortHandshake(socket, code || 401, message, headers);
                        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
                    });
                    if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
                }
                this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
            }
            completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
                if (!socket.readable || !socket.writable) return socket.destroy();
                if (socket[kWebSocket]) throw new Error("server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration");
                if (this._state > RUNNING) return abortHandshake(socket, 503);
                const digest = createHash('sha1').update(key + GUID).digest('base64');
                const headers = [
                    'HTTP/1.1 101 Switching Protocols',
                    'Upgrade: websocket',
                    'Connection: Upgrade',
                    `Sec-WebSocket-Accept: ${digest}`
                ];
                const ws = new this.options.WebSocket(null, void 0, this.options);
                if (protocols.size) {
                    const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
                    if (protocol) {
                        headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
                        ws._protocol = protocol;
                    }
                }
                if (extensions[PerMessageDeflate.extensionName]) {
                    const params = extensions[PerMessageDeflate.extensionName].params;
                    const value = extension.format({
                        [PerMessageDeflate.extensionName]: [
                            params
                        ]
                    });
                    headers.push(`Sec-WebSocket-Extensions: ${value}`);
                    ws._extensions = extensions;
                }
                this.emit('headers', headers, req);
                socket.write(headers.concat('\r\n').join('\r\n'));
                socket.removeListener('error', socketOnError);
                ws.setSocket(socket, head, {
                    allowSynchronousEvents: this.options.allowSynchronousEvents,
                    maxBufferedChunks: this.options.maxBufferedChunks,
                    maxFragments: this.options.maxFragments,
                    maxPayload: this.options.maxPayload,
                    skipUTF8Validation: this.options.skipUTF8Validation
                });
                if (this.clients) {
                    this.clients.add(ws);
                    ws.on('close', ()=>{
                        this.clients.delete(ws);
                        if (this._shouldEmitClose && !this.clients.size) process.nextTick(emitClose, this);
                    });
                }
                cb(ws, req);
            }
        }
        module.exports = WebSocketServer;
        function addListeners(server, map) {
            for (const event of Object.keys(map))server.on(event, map[event]);
            return function() {
                for (const event of Object.keys(map))server.removeListener(event, map[event]);
            };
        }
        function emitClose(server) {
            server._state = CLOSED;
            server.emit('close');
        }
        function socketOnError() {
            this.destroy();
        }
        function abortHandshake(socket, code, message, headers) {
            message = message || http.STATUS_CODES[code];
            headers = {
                Connection: 'close',
                'Content-Type': 'text/html',
                'Content-Length': Buffer.byteLength(message),
                ...headers
            };
            socket.once('finish', socket.destroy);
            socket.end(`HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` + Object.keys(headers).map((h)=>`${h}: ${headers[h]}`).join('\r\n') + '\r\n\r\n' + message);
        }
        function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
            if (server.listenerCount('wsClientError')) {
                const err = new Error(message);
                Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
                server.emit('wsClientError', err, socket, req);
            } else abortHandshake(socket, code, message, headers);
        }
    },
    "../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/websocket.js" (module, __unused_rspack_exports, __webpack_require__) {
        const EventEmitter = __webpack_require__("events");
        const https = __webpack_require__("https");
        const http = __webpack_require__("http");
        const net = __webpack_require__("net?14db");
        const tls = __webpack_require__("tls");
        const { randomBytes, createHash } = __webpack_require__("crypto");
        const { Duplex, Readable } = __webpack_require__("stream");
        const { URL: URL1 } = __webpack_require__("url");
        const PerMessageDeflate = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/permessage-deflate.js");
        const Receiver = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/receiver.js");
        const Sender = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/sender.js");
        const { isBlob } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/validation.js");
        const { BINARY_TYPES, CLOSE_TIMEOUT, EMPTY_BUFFER, GUID, kForOnEventAttribute, kListener, kStatusCode, kWebSocket, NOOP } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/constants.js");
        const { EventTarget: { addEventListener, removeEventListener } } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/event-target.js");
        const { format, parse } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/extension.js");
        const { toBuffer } = __webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/buffer-util.js");
        const kAborted = Symbol('kAborted');
        const protocolVersions = [
            8,
            13
        ];
        const readyStates = [
            'CONNECTING',
            'OPEN',
            'CLOSING',
            'CLOSED'
        ];
        const subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
        class WebSocket extends EventEmitter {
            constructor(address, protocols, options){
                super();
                this._binaryType = BINARY_TYPES[0];
                this._closeCode = 1006;
                this._closeFrameReceived = false;
                this._closeFrameSent = false;
                this._closeMessage = EMPTY_BUFFER;
                this._closeTimer = null;
                this._errorEmitted = false;
                this._extensions = {};
                this._paused = false;
                this._protocol = '';
                this._readyState = WebSocket.CONNECTING;
                this._receiver = null;
                this._sender = null;
                this._socket = null;
                if (null !== address) {
                    this._bufferedAmount = 0;
                    this._isServer = false;
                    this._redirects = 0;
                    if (void 0 === protocols) protocols = [];
                    else if (!Array.isArray(protocols)) if ('object' == typeof protocols && null !== protocols) {
                        options = protocols;
                        protocols = [];
                    } else protocols = [
                        protocols
                    ];
                    initAsClient(this, address, protocols, options);
                } else {
                    this._autoPong = options.autoPong;
                    this._closeTimeout = options.closeTimeout;
                    this._isServer = true;
                }
            }
            get binaryType() {
                return this._binaryType;
            }
            set binaryType(type) {
                if (!BINARY_TYPES.includes(type)) return;
                this._binaryType = type;
                if (this._receiver) this._receiver._binaryType = type;
            }
            get bufferedAmount() {
                if (!this._socket) return this._bufferedAmount;
                return this._socket._writableState.length + this._sender._bufferedBytes;
            }
            get extensions() {
                return Object.keys(this._extensions).join();
            }
            get isPaused() {
                return this._paused;
            }
            get onclose() {
                return null;
            }
            get onerror() {
                return null;
            }
            get onopen() {
                return null;
            }
            get onmessage() {
                return null;
            }
            get protocol() {
                return this._protocol;
            }
            get readyState() {
                return this._readyState;
            }
            get url() {
                return this._url;
            }
            setSocket(socket, head, options) {
                const receiver = new Receiver({
                    allowSynchronousEvents: options.allowSynchronousEvents,
                    binaryType: this.binaryType,
                    extensions: this._extensions,
                    isServer: this._isServer,
                    maxBufferedChunks: options.maxBufferedChunks,
                    maxFragments: options.maxFragments,
                    maxPayload: options.maxPayload,
                    skipUTF8Validation: options.skipUTF8Validation
                });
                const sender = new Sender(socket, this._extensions, options.generateMask);
                this._receiver = receiver;
                this._sender = sender;
                this._socket = socket;
                receiver[kWebSocket] = this;
                sender[kWebSocket] = this;
                socket[kWebSocket] = this;
                receiver.on('conclude', receiverOnConclude);
                receiver.on('drain', receiverOnDrain);
                receiver.on('error', receiverOnError);
                receiver.on('message', receiverOnMessage);
                receiver.on('ping', receiverOnPing);
                receiver.on('pong', receiverOnPong);
                sender.onerror = senderOnError;
                if (socket.setTimeout) socket.setTimeout(0);
                if (socket.setNoDelay) socket.setNoDelay();
                if (head.length > 0) socket.unshift(head);
                socket.on('close', socketOnClose);
                socket.on('data', socketOnData);
                socket.on('end', socketOnEnd);
                socket.on('error', socketOnError);
                this._readyState = WebSocket.OPEN;
                this.emit('open');
            }
            emitClose() {
                if (!this._socket) {
                    this._readyState = WebSocket.CLOSED;
                    this.emit('close', this._closeCode, this._closeMessage);
                    return;
                }
                if (this._extensions[PerMessageDeflate.extensionName]) this._extensions[PerMessageDeflate.extensionName].cleanup();
                this._receiver.removeAllListeners();
                this._readyState = WebSocket.CLOSED;
                this.emit('close', this._closeCode, this._closeMessage);
            }
            close(code, data) {
                if (this.readyState === WebSocket.CLOSED) return;
                if (this.readyState === WebSocket.CONNECTING) {
                    const msg = 'WebSocket was closed before the connection was established';
                    abortHandshake(this, this._req, msg);
                    return;
                }
                if (this.readyState === WebSocket.CLOSING) {
                    if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) this._socket.end();
                    return;
                }
                this._readyState = WebSocket.CLOSING;
                this._sender.close(code, data, !this._isServer, (err)=>{
                    if (err) return;
                    this._closeFrameSent = true;
                    if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) this._socket.end();
                });
                setCloseTimer(this);
            }
            pause() {
                if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) return;
                this._paused = true;
                this._socket.pause();
            }
            ping(data, mask, cb) {
                if (this.readyState === WebSocket.CONNECTING) throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
                if ('function' == typeof data) {
                    cb = data;
                    data = mask = void 0;
                } else if ('function' == typeof mask) {
                    cb = mask;
                    mask = void 0;
                }
                if ('number' == typeof data) data = data.toString();
                if (this.readyState !== WebSocket.OPEN) return void sendAfterClose(this, data, cb);
                if (void 0 === mask) mask = !this._isServer;
                this._sender.ping(data || EMPTY_BUFFER, mask, cb);
            }
            pong(data, mask, cb) {
                if (this.readyState === WebSocket.CONNECTING) throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
                if ('function' == typeof data) {
                    cb = data;
                    data = mask = void 0;
                } else if ('function' == typeof mask) {
                    cb = mask;
                    mask = void 0;
                }
                if ('number' == typeof data) data = data.toString();
                if (this.readyState !== WebSocket.OPEN) return void sendAfterClose(this, data, cb);
                if (void 0 === mask) mask = !this._isServer;
                this._sender.pong(data || EMPTY_BUFFER, mask, cb);
            }
            resume() {
                if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) return;
                this._paused = false;
                if (!this._receiver._writableState.needDrain) this._socket.resume();
            }
            send(data, options, cb) {
                if (this.readyState === WebSocket.CONNECTING) throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
                if ('function' == typeof options) {
                    cb = options;
                    options = {};
                }
                if ('number' == typeof data) data = data.toString();
                if (this.readyState !== WebSocket.OPEN) return void sendAfterClose(this, data, cb);
                const opts = {
                    binary: 'string' != typeof data,
                    mask: !this._isServer,
                    compress: true,
                    fin: true,
                    ...options
                };
                if (!this._extensions[PerMessageDeflate.extensionName]) opts.compress = false;
                this._sender.send(data || EMPTY_BUFFER, opts, cb);
            }
            terminate() {
                if (this.readyState === WebSocket.CLOSED) return;
                if (this.readyState === WebSocket.CONNECTING) {
                    const msg = 'WebSocket was closed before the connection was established';
                    abortHandshake(this, this._req, msg);
                    return;
                }
                if (this._socket) {
                    this._readyState = WebSocket.CLOSING;
                    this._socket.destroy();
                }
            }
        }
        Object.defineProperty(WebSocket, 'CONNECTING', {
            enumerable: true,
            value: readyStates.indexOf('CONNECTING')
        });
        Object.defineProperty(WebSocket.prototype, 'CONNECTING', {
            enumerable: true,
            value: readyStates.indexOf('CONNECTING')
        });
        Object.defineProperty(WebSocket, 'OPEN', {
            enumerable: true,
            value: readyStates.indexOf('OPEN')
        });
        Object.defineProperty(WebSocket.prototype, 'OPEN', {
            enumerable: true,
            value: readyStates.indexOf('OPEN')
        });
        Object.defineProperty(WebSocket, 'CLOSING', {
            enumerable: true,
            value: readyStates.indexOf('CLOSING')
        });
        Object.defineProperty(WebSocket.prototype, 'CLOSING', {
            enumerable: true,
            value: readyStates.indexOf('CLOSING')
        });
        Object.defineProperty(WebSocket, 'CLOSED', {
            enumerable: true,
            value: readyStates.indexOf('CLOSED')
        });
        Object.defineProperty(WebSocket.prototype, 'CLOSED', {
            enumerable: true,
            value: readyStates.indexOf('CLOSED')
        });
        [
            'binaryType',
            'bufferedAmount',
            'extensions',
            'isPaused',
            'protocol',
            'readyState',
            'url'
        ].forEach((property)=>{
            Object.defineProperty(WebSocket.prototype, property, {
                enumerable: true
            });
        });
        [
            'open',
            'error',
            'close',
            'message'
        ].forEach((method)=>{
            Object.defineProperty(WebSocket.prototype, `on${method}`, {
                enumerable: true,
                get () {
                    for (const listener of this.listeners(method))if (listener[kForOnEventAttribute]) return listener[kListener];
                    return null;
                },
                set (handler) {
                    for (const listener of this.listeners(method))if (listener[kForOnEventAttribute]) {
                        this.removeListener(method, listener);
                        break;
                    }
                    if ('function' != typeof handler) return;
                    this.addEventListener(method, handler, {
                        [kForOnEventAttribute]: true
                    });
                }
            });
        });
        WebSocket.prototype.addEventListener = addEventListener;
        WebSocket.prototype.removeEventListener = removeEventListener;
        module.exports = WebSocket;
        function initAsClient(websocket, address, protocols, options) {
            const opts = {
                allowSynchronousEvents: true,
                autoPong: true,
                closeTimeout: CLOSE_TIMEOUT,
                protocolVersion: protocolVersions[1],
                maxBufferedChunks: 1048576,
                maxFragments: 131072,
                maxPayload: 104857600,
                skipUTF8Validation: false,
                perMessageDeflate: true,
                followRedirects: false,
                maxRedirects: 10,
                ...options,
                socketPath: void 0,
                hostname: void 0,
                protocol: void 0,
                timeout: void 0,
                method: 'GET',
                host: void 0,
                path: void 0,
                port: void 0
            };
            websocket._autoPong = opts.autoPong;
            websocket._closeTimeout = opts.closeTimeout;
            if (!protocolVersions.includes(opts.protocolVersion)) throw new RangeError(`Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(', ')})`);
            let parsedUrl;
            if (address instanceof URL1) parsedUrl = address;
            else try {
                parsedUrl = new URL1(address);
            } catch  {
                throw new SyntaxError(`Invalid URL: ${address}`);
            }
            if ('http:' === parsedUrl.protocol) parsedUrl.protocol = 'ws:';
            else if ('https:' === parsedUrl.protocol) parsedUrl.protocol = 'wss:';
            websocket._url = parsedUrl.href;
            const isSecure = 'wss:' === parsedUrl.protocol;
            const isIpcUrl = 'ws+unix:' === parsedUrl.protocol;
            let invalidUrlMessage;
            if ('ws:' === parsedUrl.protocol || isSecure || isIpcUrl) {
                if (isIpcUrl && !parsedUrl.pathname) invalidUrlMessage = "The URL's pathname is empty";
                else if (parsedUrl.hash) invalidUrlMessage = 'The URL contains a fragment identifier';
            } else invalidUrlMessage = 'The URL\'s protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"';
            if (invalidUrlMessage) {
                const err = new SyntaxError(invalidUrlMessage);
                if (0 !== websocket._redirects) return void emitErrorAndClose(websocket, err);
                throw err;
            }
            const defaultPort = isSecure ? 443 : 80;
            const key = randomBytes(16).toString('base64');
            const request = isSecure ? https.request : http.request;
            const protocolSet = new Set();
            let perMessageDeflate;
            opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
            opts.defaultPort = opts.defaultPort || defaultPort;
            opts.port = parsedUrl.port || defaultPort;
            opts.host = parsedUrl.hostname.startsWith('[') ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
            opts.headers = {
                ...opts.headers,
                'Sec-WebSocket-Version': opts.protocolVersion,
                'Sec-WebSocket-Key': key,
                Connection: 'Upgrade',
                Upgrade: 'websocket'
            };
            opts.path = parsedUrl.pathname + parsedUrl.search;
            opts.timeout = opts.handshakeTimeout;
            if (opts.perMessageDeflate) {
                perMessageDeflate = new PerMessageDeflate({
                    ...opts.perMessageDeflate,
                    isServer: false,
                    maxPayload: opts.maxPayload
                });
                opts.headers['Sec-WebSocket-Extensions'] = format({
                    [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
                });
            }
            if (protocols.length) {
                for (const protocol of protocols){
                    if ('string' != typeof protocol || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) throw new SyntaxError('An invalid or duplicated subprotocol was specified');
                    protocolSet.add(protocol);
                }
                opts.headers['Sec-WebSocket-Protocol'] = protocols.join(',');
            }
            if (opts.origin) if (opts.protocolVersion < 13) opts.headers['Sec-WebSocket-Origin'] = opts.origin;
            else opts.headers.Origin = opts.origin;
            if (parsedUrl.username || parsedUrl.password) opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
            if (isIpcUrl) {
                const parts = opts.path.split(':');
                opts.socketPath = parts[0];
                opts.path = parts[1];
            }
            let req;
            if (opts.followRedirects) {
                if (0 === websocket._redirects) {
                    websocket._originalIpc = isIpcUrl;
                    websocket._originalSecure = isSecure;
                    websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
                    const headers = options && options.headers;
                    options = {
                        ...options,
                        headers: {}
                    };
                    if (headers) for (const [key, value] of Object.entries(headers))options.headers[key.toLowerCase()] = value;
                } else if (0 === websocket.listenerCount('redirect')) {
                    const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
                    if (!isSameHost || websocket._originalSecure && !isSecure) {
                        delete opts.headers.authorization;
                        delete opts.headers.cookie;
                        if (!isSameHost) delete opts.headers.host;
                        opts.auth = void 0;
                    }
                }
                if (opts.auth && !options.headers.authorization) options.headers.authorization = 'Basic ' + Buffer.from(opts.auth).toString('base64');
                req = websocket._req = request(opts);
                if (websocket._redirects) websocket.emit('redirect', websocket.url, req);
            } else req = websocket._req = request(opts);
            if (opts.timeout) req.on('timeout', ()=>{
                abortHandshake(websocket, req, 'Opening handshake has timed out');
            });
            req.on('error', (err)=>{
                if (null === req || req[kAborted]) return;
                req = websocket._req = null;
                emitErrorAndClose(websocket, err);
            });
            req.on('response', (res)=>{
                const location = res.headers.location;
                const statusCode = res.statusCode;
                if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
                    if (++websocket._redirects > opts.maxRedirects) return void abortHandshake(websocket, req, 'Maximum redirects exceeded');
                    req.abort();
                    let addr;
                    try {
                        addr = new URL1(location, address);
                    } catch (e) {
                        const err = new SyntaxError(`Invalid URL: ${location}`);
                        emitErrorAndClose(websocket, err);
                        return;
                    }
                    initAsClient(websocket, addr, protocols, options);
                } else if (!websocket.emit('unexpected-response', req, res)) abortHandshake(websocket, req, `Unexpected server response: ${res.statusCode}`);
            });
            req.on('upgrade', (res, socket, head)=>{
                websocket.emit('upgrade', res);
                if (websocket.readyState !== WebSocket.CONNECTING) return;
                req = websocket._req = null;
                const upgrade = res.headers.upgrade;
                if (void 0 === upgrade || 'websocket' !== upgrade.toLowerCase()) return void abortHandshake(websocket, socket, 'Invalid Upgrade header');
                const digest = createHash('sha1').update(key + GUID).digest('base64');
                if (res.headers['sec-websocket-accept'] !== digest) return void abortHandshake(websocket, socket, 'Invalid Sec-WebSocket-Accept header');
                const serverProt = res.headers['sec-websocket-protocol'];
                let protError;
                if (void 0 !== serverProt) if (protocolSet.size) {
                    if (!protocolSet.has(serverProt)) protError = 'Server sent an invalid subprotocol';
                } else protError = 'Server sent a subprotocol but none was requested';
                else if (protocolSet.size) protError = 'Server sent no subprotocol';
                if (protError) return void abortHandshake(websocket, socket, protError);
                if (serverProt) websocket._protocol = serverProt;
                const secWebSocketExtensions = res.headers['sec-websocket-extensions'];
                if (void 0 !== secWebSocketExtensions) {
                    if (!perMessageDeflate) {
                        const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
                        abortHandshake(websocket, socket, message);
                        return;
                    }
                    let extensions;
                    try {
                        extensions = parse(secWebSocketExtensions);
                    } catch (err) {
                        const message = 'Invalid Sec-WebSocket-Extensions header';
                        abortHandshake(websocket, socket, message);
                        return;
                    }
                    const extensionNames = Object.keys(extensions);
                    if (1 !== extensionNames.length || extensionNames[0] !== PerMessageDeflate.extensionName) {
                        const message = 'Server indicated an extension that was not requested';
                        abortHandshake(websocket, socket, message);
                        return;
                    }
                    try {
                        perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
                    } catch (err) {
                        const message = 'Invalid Sec-WebSocket-Extensions header';
                        abortHandshake(websocket, socket, message);
                        return;
                    }
                    websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
                }
                websocket.setSocket(socket, head, {
                    allowSynchronousEvents: opts.allowSynchronousEvents,
                    generateMask: opts.generateMask,
                    maxBufferedChunks: opts.maxBufferedChunks,
                    maxFragments: opts.maxFragments,
                    maxPayload: opts.maxPayload,
                    skipUTF8Validation: opts.skipUTF8Validation
                });
            });
            if (opts.finishRequest) opts.finishRequest(req, websocket);
            else req.end();
        }
        function emitErrorAndClose(websocket, err) {
            websocket._readyState = WebSocket.CLOSING;
            websocket._errorEmitted = true;
            websocket.emit('error', err);
            websocket.emitClose();
        }
        function netConnect(options) {
            options.path = options.socketPath;
            return net.connect(options);
        }
        function tlsConnect(options) {
            options.path = void 0;
            if (!options.servername && '' !== options.servername) options.servername = net.isIP(options.host) ? '' : options.host;
            return tls.connect(options);
        }
        function abortHandshake(websocket, stream, message) {
            websocket._readyState = WebSocket.CLOSING;
            const err = new Error(message);
            Error.captureStackTrace(err, abortHandshake);
            if (stream.setHeader) {
                stream[kAborted] = true;
                stream.abort();
                if (stream.socket && !stream.socket.destroyed) stream.socket.destroy();
                process.nextTick(emitErrorAndClose, websocket, err);
            } else {
                stream.destroy(err);
                stream.once('error', websocket.emit.bind(websocket, 'error'));
                stream.once('close', websocket.emitClose.bind(websocket));
            }
        }
        function sendAfterClose(websocket, data, cb) {
            if (data) {
                const length = isBlob(data) ? data.size : toBuffer(data).length;
                if (websocket._socket) websocket._sender._bufferedBytes += length;
                else websocket._bufferedAmount += length;
            }
            if (cb) {
                const err = new Error(`WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`);
                process.nextTick(cb, err);
            }
        }
        function receiverOnConclude(code, reason) {
            const websocket = this[kWebSocket];
            websocket._closeFrameReceived = true;
            websocket._closeMessage = reason;
            websocket._closeCode = code;
            if (void 0 === websocket._socket[kWebSocket]) return;
            websocket._socket.removeListener('data', socketOnData);
            process.nextTick(resume, websocket._socket);
            if (1005 === code) websocket.close();
            else websocket.close(code, reason);
        }
        function receiverOnDrain() {
            const websocket = this[kWebSocket];
            if (!websocket.isPaused) websocket._socket.resume();
        }
        function receiverOnError(err) {
            const websocket = this[kWebSocket];
            if (void 0 !== websocket._socket[kWebSocket]) {
                websocket._socket.removeListener('data', socketOnData);
                process.nextTick(resume, websocket._socket);
                websocket.close(err[kStatusCode]);
            }
            if (!websocket._errorEmitted) {
                websocket._errorEmitted = true;
                websocket.emit('error', err);
            }
        }
        function receiverOnFinish() {
            this[kWebSocket].emitClose();
        }
        function receiverOnMessage(data, isBinary) {
            this[kWebSocket].emit('message', data, isBinary);
        }
        function receiverOnPing(data) {
            const websocket = this[kWebSocket];
            if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
            websocket.emit('ping', data);
        }
        function receiverOnPong(data) {
            this[kWebSocket].emit('pong', data);
        }
        function resume(stream) {
            stream.resume();
        }
        function senderOnError(err) {
            const websocket = this[kWebSocket];
            if (websocket.readyState === WebSocket.CLOSED) return;
            if (websocket.readyState === WebSocket.OPEN) {
                websocket._readyState = WebSocket.CLOSING;
                setCloseTimer(websocket);
            }
            this._socket.end();
            if (!websocket._errorEmitted) {
                websocket._errorEmitted = true;
                websocket.emit('error', err);
            }
        }
        function setCloseTimer(websocket) {
            websocket._closeTimer = setTimeout(websocket._socket.destroy.bind(websocket._socket), websocket._closeTimeout);
        }
        function socketOnClose() {
            const websocket = this[kWebSocket];
            this.removeListener('close', socketOnClose);
            this.removeListener('data', socketOnData);
            this.removeListener('end', socketOnEnd);
            websocket._readyState = WebSocket.CLOSING;
            if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && 0 !== this._readableState.length) {
                const chunk = this.read(this._readableState.length);
                websocket._receiver.write(chunk);
            }
            websocket._receiver.end();
            this[kWebSocket] = void 0;
            clearTimeout(websocket._closeTimer);
            if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) websocket.emitClose();
            else {
                websocket._receiver.on('error', receiverOnFinish);
                websocket._receiver.on('finish', receiverOnFinish);
            }
        }
        function socketOnData(chunk) {
            if (!this[kWebSocket]._receiver.write(chunk)) this.pause();
        }
        function socketOnEnd() {
            const websocket = this[kWebSocket];
            websocket._readyState = WebSocket.CLOSING;
            websocket._receiver.end();
            this.end();
        }
        function socketOnError() {
            const websocket = this[kWebSocket];
            this.removeListener('error', socketOnError);
            this.on('error', NOOP);
            if (websocket) {
                websocket._readyState = WebSocket.CLOSING;
                this.destroy();
            }
        }
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/DocumentPosition.js" (module) {
        (function() {
            module.exports = {
                Disconnected: 1,
                Preceding: 2,
                Following: 4,
                Contains: 8,
                ContainedBy: 16,
                ImplementationSpecific: 32
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js" (module) {
        (function() {
            module.exports = {
                Element: 1,
                Attribute: 2,
                Text: 3,
                CData: 4,
                EntityReference: 5,
                EntityDeclaration: 6,
                ProcessingInstruction: 7,
                Comment: 8,
                Document: 9,
                DocType: 10,
                DocumentFragment: 11,
                NotationDeclaration: 12,
                Declaration: 201,
                Raw: 202,
                AttributeDeclaration: 203,
                ElementDeclaration: 204,
                Dummy: 205
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js" (module) {
        (function() {
            var assign, getValue, isArray, isEmpty, isFunction, isObject, isPlainObject, hasProp = {}.hasOwnProperty;
            assign = function(target, ...sources) {
                var i, key, len, source;
                if (isFunction(Object.assign)) Object.assign.apply(null, arguments);
                else for(i = 0, len = sources.length; i < len; i++){
                    source = sources[i];
                    if (null != source) {
                        for(key in source)if (hasProp.call(source, key)) target[key] = source[key];
                    }
                }
                return target;
            };
            isFunction = function(val) {
                return !!val && '[object Function]' === Object.prototype.toString.call(val);
            };
            isObject = function(val) {
                var ref;
                return !!val && ('function' === (ref = typeof val) || 'object' === ref);
            };
            isArray = function(val) {
                if (isFunction(Array.isArray)) return Array.isArray(val);
                return '[object Array]' === Object.prototype.toString.call(val);
            };
            isEmpty = function(val) {
                var key;
                if (isArray(val)) return !val.length;
                for(key in val)if (hasProp.call(val, key)) return false;
                return true;
            };
            isPlainObject = function(val) {
                var ctor, proto;
                return isObject(val) && (proto = Object.getPrototypeOf(val)) && (ctor = proto.constructor) && 'function' == typeof ctor && ctor instanceof ctor && Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object);
            };
            getValue = function(obj) {
                if (isFunction(obj.valueOf)) return obj.valueOf();
                return obj;
            };
            module.exports.assign = assign;
            module.exports.isFunction = isFunction;
            module.exports.isObject = isObject;
            module.exports.isArray = isArray;
            module.exports.isEmpty = isEmpty;
            module.exports.isPlainObject = isPlainObject;
            module.exports.getValue = getValue;
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js" (module) {
        (function() {
            module.exports = {
                None: 0,
                OpenTag: 1,
                InsideTag: 2,
                CloseTag: 3
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLAttribute.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType;
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            module.exports = (function() {
                class XMLAttribute {
                    constructor(parent, name, value){
                        this.parent = parent;
                        if (this.parent) {
                            this.options = this.parent.options;
                            this.stringify = this.parent.stringify;
                        }
                        if (null == name) throw new Error("Missing attribute name. " + this.debugInfo(name));
                        this.name = this.stringify.name(name);
                        this.value = this.stringify.attValue(value);
                        this.type = NodeType.Attribute;
                        this.isId = false;
                        this.schemaTypeInfo = null;
                    }
                    clone() {
                        return Object.create(this);
                    }
                    toString(options) {
                        return this.options.writer.attribute(this, this.options.writer.filterOptions(options));
                    }
                    debugInfo(name) {
                        name = name || this.name;
                        if (null == name) return "parent: <" + this.parent.name + ">";
                        return "attribute: {" + name + "}, parent: <" + this.parent.name + ">";
                    }
                    isEqualNode(node) {
                        if (node.namespaceURI !== this.namespaceURI) return false;
                        if (node.prefix !== this.prefix) return false;
                        if (node.localName !== this.localName) return false;
                        if (node.value !== this.value) return false;
                        return true;
                    }
                }
                Object.defineProperty(XMLAttribute.prototype, 'nodeType', {
                    get: function() {
                        return this.type;
                    }
                });
                Object.defineProperty(XMLAttribute.prototype, 'ownerElement', {
                    get: function() {
                        return this.parent;
                    }
                });
                Object.defineProperty(XMLAttribute.prototype, 'textContent', {
                    get: function() {
                        return this.value;
                    },
                    set: function(value) {
                        return this.value = value || '';
                    }
                });
                Object.defineProperty(XMLAttribute.prototype, 'namespaceURI', {
                    get: function() {
                        return '';
                    }
                });
                Object.defineProperty(XMLAttribute.prototype, 'prefix', {
                    get: function() {
                        return '';
                    }
                });
                Object.defineProperty(XMLAttribute.prototype, 'localName', {
                    get: function() {
                        return this.name;
                    }
                });
                Object.defineProperty(XMLAttribute.prototype, 'specified', {
                    get: function() {
                        return true;
                    }
                });
                return XMLAttribute;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCData.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLCharacterData;
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLCharacterData = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js");
            module.exports = class extends XMLCharacterData {
                constructor(parent, text){
                    super(parent);
                    if (null == text) throw new Error("Missing CDATA text. " + this.debugInfo());
                    this.name = "#cdata-section";
                    this.type = NodeType.CData;
                    this.value = this.stringify.cdata(text);
                }
                clone() {
                    return Object.create(this);
                }
                toString(options) {
                    return this.options.writer.cdata(this, this.options.writer.filterOptions(options));
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var XMLNode;
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            module.exports = (function() {
                class XMLCharacterData extends XMLNode {
                    constructor(parent){
                        super(parent);
                        this.value = '';
                    }
                    clone() {
                        return Object.create(this);
                    }
                    substringData(offset, count) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    appendData(arg) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    insertData(offset, arg) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    deleteData(offset, count) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    replaceData(offset, count, arg) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    isEqualNode(node) {
                        if (!super.isEqualNode(node)) return false;
                        if (node.data !== this.data) return false;
                        return true;
                    }
                }
                Object.defineProperty(XMLCharacterData.prototype, 'data', {
                    get: function() {
                        return this.value;
                    },
                    set: function(value) {
                        return this.value = value || '';
                    }
                });
                Object.defineProperty(XMLCharacterData.prototype, 'length', {
                    get: function() {
                        return this.value.length;
                    }
                });
                Object.defineProperty(XMLCharacterData.prototype, 'textContent', {
                    get: function() {
                        return this.value;
                    },
                    set: function(value) {
                        return this.value = value || '';
                    }
                });
                return XMLCharacterData;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLComment.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLCharacterData;
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLCharacterData = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js");
            module.exports = class extends XMLCharacterData {
                constructor(parent, text){
                    super(parent);
                    if (null == text) throw new Error("Missing comment text. " + this.debugInfo());
                    this.name = "#comment";
                    this.type = NodeType.Comment;
                    this.value = this.stringify.comment(text);
                }
                clone() {
                    return Object.create(this);
                }
                toString(options) {
                    return this.options.writer.comment(this, this.options.writer.filterOptions(options));
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMConfiguration.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var XMLDOMErrorHandler, XMLDOMStringList;
            XMLDOMErrorHandler = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMErrorHandler.js");
            XMLDOMStringList = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMStringList.js");
            module.exports = (function() {
                class XMLDOMConfiguration {
                    constructor(){
                        this.defaultParams = {
                            "canonical-form": false,
                            "cdata-sections": false,
                            comments: false,
                            "datatype-normalization": false,
                            "element-content-whitespace": true,
                            entities: true,
                            "error-handler": new XMLDOMErrorHandler(),
                            infoset: true,
                            "validate-if-schema": false,
                            namespaces: true,
                            "namespace-declarations": true,
                            "normalize-characters": false,
                            "schema-location": '',
                            "schema-type": '',
                            "split-cdata-sections": true,
                            validate: false,
                            "well-formed": true
                        };
                        this.params = Object.create(this.defaultParams);
                    }
                    getParameter(name) {
                        if (this.params.hasOwnProperty(name)) return this.params[name];
                        return null;
                    }
                    canSetParameter(name, value) {
                        return true;
                    }
                    setParameter(name, value) {
                        if (null != value) return this.params[name] = value;
                        return delete this.params[name];
                    }
                }
                Object.defineProperty(XMLDOMConfiguration.prototype, 'parameterNames', {
                    get: function() {
                        return new XMLDOMStringList(Object.keys(this.defaultParams));
                    }
                });
                return XMLDOMConfiguration;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMErrorHandler.js" (module) {
        (function() {
            module.exports = class {
                handleError(error) {
                    throw new Error(error);
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMImplementation.js" (module) {
        (function() {
            module.exports = class {
                hasFeature(feature, version) {
                    return true;
                }
                createDocumentType(qualifiedName, publicId, systemId) {
                    throw new Error("This DOM method is not implemented.");
                }
                createDocument(namespaceURI, qualifiedName, doctype) {
                    throw new Error("This DOM method is not implemented.");
                }
                createHTMLDocument(title) {
                    throw new Error("This DOM method is not implemented.");
                }
                getFeature(feature, version) {
                    throw new Error("This DOM method is not implemented.");
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMStringList.js" (module) {
        (function() {
            module.exports = (function() {
                class XMLDOMStringList {
                    constructor(arr){
                        this.arr = arr || [];
                    }
                    item(index) {
                        return this.arr[index] || null;
                    }
                    contains(str) {
                        return -1 !== this.arr.indexOf(str);
                    }
                }
                Object.defineProperty(XMLDOMStringList.prototype, 'length', {
                    get: function() {
                        return this.arr.length;
                    }
                });
                return XMLDOMStringList;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDAttList.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLNode;
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            module.exports = class extends XMLNode {
                constructor(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue){
                    super(parent);
                    if (null == elementName) throw new Error("Missing DTD element name. " + this.debugInfo());
                    if (null == attributeName) throw new Error("Missing DTD attribute name. " + this.debugInfo(elementName));
                    if (!attributeType) throw new Error("Missing DTD attribute type. " + this.debugInfo(elementName));
                    if (!defaultValueType) throw new Error("Missing DTD attribute default. " + this.debugInfo(elementName));
                    if (0 !== defaultValueType.indexOf('#')) defaultValueType = '#' + defaultValueType;
                    if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(elementName));
                    if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) throw new Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(elementName));
                    this.elementName = this.stringify.name(elementName);
                    this.type = NodeType.AttributeDeclaration;
                    this.attributeName = this.stringify.name(attributeName);
                    this.attributeType = this.stringify.dtdAttType(attributeType);
                    if (defaultValue) this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
                    this.defaultValueType = defaultValueType;
                }
                toString(options) {
                    return this.options.writer.dtdAttList(this, this.options.writer.filterOptions(options));
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDElement.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLNode;
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            module.exports = class extends XMLNode {
                constructor(parent, name, value){
                    super(parent);
                    if (null == name) throw new Error("Missing DTD element name. " + this.debugInfo());
                    if (!value) value = '(#PCDATA)';
                    if (Array.isArray(value)) value = '(' + value.join(',') + ')';
                    this.name = this.stringify.name(name);
                    this.type = NodeType.ElementDeclaration;
                    this.value = this.stringify.dtdElementValue(value);
                }
                toString(options) {
                    return this.options.writer.dtdElement(this, this.options.writer.filterOptions(options));
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDEntity.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLNode, isObject;
            ({ isObject } = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            module.exports = (function() {
                class XMLDTDEntity extends XMLNode {
                    constructor(parent, pe, name, value){
                        super(parent);
                        if (null == name) throw new Error("Missing DTD entity name. " + this.debugInfo(name));
                        if (null == value) throw new Error("Missing DTD entity value. " + this.debugInfo(name));
                        this.pe = !!pe;
                        this.name = this.stringify.name(name);
                        this.type = NodeType.EntityDeclaration;
                        if (isObject(value)) {
                            if (!value.pubID && !value.sysID) throw new Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(name));
                            if (value.pubID && !value.sysID) throw new Error("System identifier is required for a public external entity. " + this.debugInfo(name));
                            this.internal = false;
                            if (null != value.pubID) this.pubID = this.stringify.dtdPubID(value.pubID);
                            if (null != value.sysID) this.sysID = this.stringify.dtdSysID(value.sysID);
                            if (null != value.nData) this.nData = this.stringify.dtdNData(value.nData);
                            if (this.pe && this.nData) throw new Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(name));
                        } else {
                            this.value = this.stringify.dtdEntityValue(value);
                            this.internal = true;
                        }
                    }
                    toString(options) {
                        return this.options.writer.dtdEntity(this, this.options.writer.filterOptions(options));
                    }
                }
                Object.defineProperty(XMLDTDEntity.prototype, 'publicId', {
                    get: function() {
                        return this.pubID;
                    }
                });
                Object.defineProperty(XMLDTDEntity.prototype, 'systemId', {
                    get: function() {
                        return this.sysID;
                    }
                });
                Object.defineProperty(XMLDTDEntity.prototype, 'notationName', {
                    get: function() {
                        return this.nData || null;
                    }
                });
                Object.defineProperty(XMLDTDEntity.prototype, 'inputEncoding', {
                    get: function() {
                        return null;
                    }
                });
                Object.defineProperty(XMLDTDEntity.prototype, 'xmlEncoding', {
                    get: function() {
                        return null;
                    }
                });
                Object.defineProperty(XMLDTDEntity.prototype, 'xmlVersion', {
                    get: function() {
                        return null;
                    }
                });
                return XMLDTDEntity;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDNotation.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLNode;
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            module.exports = (function() {
                class XMLDTDNotation extends XMLNode {
                    constructor(parent, name, value){
                        super(parent);
                        if (null == name) throw new Error("Missing DTD notation name. " + this.debugInfo(name));
                        if (!value.pubID && !value.sysID) throw new Error("Public or system identifiers are required for an external entity. " + this.debugInfo(name));
                        this.name = this.stringify.name(name);
                        this.type = NodeType.NotationDeclaration;
                        if (null != value.pubID) this.pubID = this.stringify.dtdPubID(value.pubID);
                        if (null != value.sysID) this.sysID = this.stringify.dtdSysID(value.sysID);
                    }
                    toString(options) {
                        return this.options.writer.dtdNotation(this, this.options.writer.filterOptions(options));
                    }
                }
                Object.defineProperty(XMLDTDNotation.prototype, 'publicId', {
                    get: function() {
                        return this.pubID;
                    }
                });
                Object.defineProperty(XMLDTDNotation.prototype, 'systemId', {
                    get: function() {
                        return this.sysID;
                    }
                });
                return XMLDTDNotation;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDeclaration.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLNode, isObject;
            ({ isObject } = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            module.exports = class extends XMLNode {
                constructor(parent, version, encoding, standalone){
                    super(parent);
                    if (isObject(version)) ({ version, encoding, standalone } = version);
                    if (!version) version = '1.0';
                    this.type = NodeType.Declaration;
                    this.version = this.stringify.xmlVersion(version);
                    if (null != encoding) this.encoding = this.stringify.xmlEncoding(encoding);
                    if (null != standalone) this.standalone = this.stringify.xmlStandalone(standalone);
                }
                toString(options) {
                    return this.options.writer.declaration(this, this.options.writer.filterOptions(options));
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocType.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLNamedNodeMap, XMLNode, isObject;
            ({ isObject } = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLDTDAttList = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDAttList.js");
            XMLDTDEntity = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDEntity.js");
            XMLDTDElement = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDElement.js");
            XMLDTDNotation = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDNotation.js");
            XMLNamedNodeMap = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNamedNodeMap.js");
            module.exports = (function() {
                class XMLDocType extends XMLNode {
                    constructor(parent, pubID, sysID){
                        var child, i, len, ref;
                        super(parent);
                        this.type = NodeType.DocType;
                        if (parent.children) {
                            ref = parent.children;
                            for(i = 0, len = ref.length; i < len; i++){
                                child = ref[i];
                                if (child.type === NodeType.Element) {
                                    this.name = child.name;
                                    break;
                                }
                            }
                        }
                        this.documentObject = parent;
                        if (isObject(pubID)) ({ pubID, sysID } = pubID);
                        if (null == sysID) [sysID, pubID] = [
                            pubID,
                            sysID
                        ];
                        if (null != pubID) this.pubID = this.stringify.dtdPubID(pubID);
                        if (null != sysID) this.sysID = this.stringify.dtdSysID(sysID);
                    }
                    element(name, value) {
                        var child;
                        child = new XMLDTDElement(this, name, value);
                        this.children.push(child);
                        return this;
                    }
                    attList(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                        var child;
                        child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
                        this.children.push(child);
                        return this;
                    }
                    entity(name, value) {
                        var child;
                        child = new XMLDTDEntity(this, false, name, value);
                        this.children.push(child);
                        return this;
                    }
                    pEntity(name, value) {
                        var child;
                        child = new XMLDTDEntity(this, true, name, value);
                        this.children.push(child);
                        return this;
                    }
                    notation(name, value) {
                        var child;
                        child = new XMLDTDNotation(this, name, value);
                        this.children.push(child);
                        return this;
                    }
                    toString(options) {
                        return this.options.writer.docType(this, this.options.writer.filterOptions(options));
                    }
                    ele(name, value) {
                        return this.element(name, value);
                    }
                    att(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                        return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
                    }
                    ent(name, value) {
                        return this.entity(name, value);
                    }
                    pent(name, value) {
                        return this.pEntity(name, value);
                    }
                    not(name, value) {
                        return this.notation(name, value);
                    }
                    up() {
                        return this.root() || this.documentObject;
                    }
                    isEqualNode(node) {
                        if (!super.isEqualNode(node)) return false;
                        if (node.name !== this.name) return false;
                        if (node.publicId !== this.publicId) return false;
                        if (node.systemId !== this.systemId) return false;
                        return true;
                    }
                }
                Object.defineProperty(XMLDocType.prototype, 'entities', {
                    get: function() {
                        var child, i, len, nodes, ref;
                        nodes = {};
                        ref = this.children;
                        for(i = 0, len = ref.length; i < len; i++){
                            child = ref[i];
                            if (child.type === NodeType.EntityDeclaration && !child.pe) nodes[child.name] = child;
                        }
                        return new XMLNamedNodeMap(nodes);
                    }
                });
                Object.defineProperty(XMLDocType.prototype, 'notations', {
                    get: function() {
                        var child, i, len, nodes, ref;
                        nodes = {};
                        ref = this.children;
                        for(i = 0, len = ref.length; i < len; i++){
                            child = ref[i];
                            if (child.type === NodeType.NotationDeclaration) nodes[child.name] = child;
                        }
                        return new XMLNamedNodeMap(nodes);
                    }
                });
                Object.defineProperty(XMLDocType.prototype, 'publicId', {
                    get: function() {
                        return this.pubID;
                    }
                });
                Object.defineProperty(XMLDocType.prototype, 'systemId', {
                    get: function() {
                        return this.sysID;
                    }
                });
                Object.defineProperty(XMLDocType.prototype, 'internalSubset', {
                    get: function() {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                });
                return XMLDocType;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocument.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLDOMConfiguration, XMLDOMImplementation, XMLNode, XMLStringWriter, XMLStringifier, isPlainObject;
            ({ isPlainObject } = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
            XMLDOMImplementation = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMImplementation.js");
            XMLDOMConfiguration = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMConfiguration.js");
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLStringifier = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringifier.js");
            XMLStringWriter = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringWriter.js");
            module.exports = (function() {
                class XMLDocument extends XMLNode {
                    constructor(options){
                        super(null);
                        this.name = "#document";
                        this.type = NodeType.Document;
                        this.documentURI = null;
                        this.domConfig = new XMLDOMConfiguration();
                        options || (options = {});
                        if (!options.writer) options.writer = new XMLStringWriter();
                        this.options = options;
                        this.stringify = new XMLStringifier(options);
                    }
                    end(writer) {
                        var writerOptions;
                        writerOptions = {};
                        if (writer) {
                            if (isPlainObject(writer)) {
                                writerOptions = writer;
                                writer = this.options.writer;
                            }
                        } else writer = this.options.writer;
                        return writer.document(this, writer.filterOptions(writerOptions));
                    }
                    toString(options) {
                        return this.options.writer.document(this, this.options.writer.filterOptions(options));
                    }
                    createElement(tagName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createDocumentFragment() {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createTextNode(data) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createComment(data) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createCDATASection(data) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createProcessingInstruction(target, data) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createAttribute(name) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createEntityReference(name) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getElementsByTagName(tagname) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    importNode(importedNode, deep) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createElementNS(namespaceURI, qualifiedName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createAttributeNS(namespaceURI, qualifiedName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getElementsByTagNameNS(namespaceURI, localName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getElementById(elementId) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    adoptNode(source) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    normalizeDocument() {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    renameNode(node, namespaceURI, qualifiedName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getElementsByClassName(classNames) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createEvent(eventInterface) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createRange() {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createNodeIterator(root, whatToShow, filter) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    createTreeWalker(root, whatToShow, filter) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                }
                Object.defineProperty(XMLDocument.prototype, 'implementation', {
                    value: new XMLDOMImplementation()
                });
                Object.defineProperty(XMLDocument.prototype, 'doctype', {
                    get: function() {
                        var child, i, len, ref;
                        ref = this.children;
                        for(i = 0, len = ref.length; i < len; i++){
                            child = ref[i];
                            if (child.type === NodeType.DocType) return child;
                        }
                        return null;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'documentElement', {
                    get: function() {
                        return this.rootObject || null;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'inputEncoding', {
                    get: function() {
                        return null;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'strictErrorChecking', {
                    get: function() {
                        return false;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'xmlEncoding', {
                    get: function() {
                        if (0 !== this.children.length && this.children[0].type === NodeType.Declaration) return this.children[0].encoding;
                        return null;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'xmlStandalone', {
                    get: function() {
                        if (0 !== this.children.length && this.children[0].type === NodeType.Declaration) return 'yes' === this.children[0].standalone;
                        return false;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'xmlVersion', {
                    get: function() {
                        if (0 !== this.children.length && this.children[0].type === NodeType.Declaration) return this.children[0].version;
                        return "1.0";
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'URL', {
                    get: function() {
                        return this.documentURI;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'origin', {
                    get: function() {
                        return null;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'compatMode', {
                    get: function() {
                        return null;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'characterSet', {
                    get: function() {
                        return null;
                    }
                });
                Object.defineProperty(XMLDocument.prototype, 'contentType', {
                    get: function() {
                        return null;
                    }
                });
                return XMLDocument;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocumentCB.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, WriterState, XMLAttribute, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDocument, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLStringifier, XMLText, getValue, isFunction, isObject, isPlainObject, hasProp = {}.hasOwnProperty;
            ({ isObject, isFunction, isPlainObject, getValue } = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLDocument = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocument.js");
            XMLElement = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLElement.js");
            XMLCData = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCData.js");
            XMLComment = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLComment.js");
            XMLRaw = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLRaw.js");
            XMLText = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLText.js");
            XMLProcessingInstruction = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLProcessingInstruction.js");
            XMLDeclaration = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDeclaration.js");
            XMLDocType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocType.js");
            XMLDTDAttList = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDAttList.js");
            XMLDTDEntity = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDEntity.js");
            XMLDTDElement = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDElement.js");
            XMLDTDNotation = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDNotation.js");
            XMLAttribute = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLAttribute.js");
            XMLStringifier = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringifier.js");
            XMLStringWriter = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringWriter.js");
            WriterState = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js");
            module.exports = class {
                constructor(options, onData, onEnd){
                    var writerOptions;
                    this.name = "?xml";
                    this.type = NodeType.Document;
                    options || (options = {});
                    writerOptions = {};
                    if (options.writer) {
                        if (isPlainObject(options.writer)) {
                            writerOptions = options.writer;
                            options.writer = new XMLStringWriter();
                        }
                    } else options.writer = new XMLStringWriter();
                    this.options = options;
                    this.writer = options.writer;
                    this.writerOptions = this.writer.filterOptions(writerOptions);
                    this.stringify = new XMLStringifier(options);
                    this.onDataCallback = onData || function() {};
                    this.onEndCallback = onEnd || function() {};
                    this.currentNode = null;
                    this.currentLevel = -1;
                    this.openTags = {};
                    this.documentStarted = false;
                    this.documentCompleted = false;
                    this.root = null;
                }
                createChildNode(node) {
                    var att, attName, attributes, child, i, len, ref, ref1;
                    switch(node.type){
                        case NodeType.CData:
                            this.cdata(node.value);
                            break;
                        case NodeType.Comment:
                            this.comment(node.value);
                            break;
                        case NodeType.Element:
                            attributes = {};
                            ref = node.attribs;
                            for(attName in ref)if (hasProp.call(ref, attName)) {
                                att = ref[attName];
                                attributes[attName] = att.value;
                            }
                            this.node(node.name, attributes);
                            break;
                        case NodeType.Dummy:
                            this.dummy();
                            break;
                        case NodeType.Raw:
                            this.raw(node.value);
                            break;
                        case NodeType.Text:
                            this.text(node.value);
                            break;
                        case NodeType.ProcessingInstruction:
                            this.instruction(node.target, node.value);
                            break;
                        default:
                            throw new Error("This XML node type is not supported in a JS object: " + node.constructor.name);
                    }
                    ref1 = node.children;
                    for(i = 0, len = ref1.length; i < len; i++){
                        child = ref1[i];
                        this.createChildNode(child);
                        if (child.type === NodeType.Element) this.up();
                    }
                    return this;
                }
                dummy() {
                    return this;
                }
                node(name, attributes, text) {
                    if (null == name) throw new Error("Missing node name.");
                    if (this.root && -1 === this.currentLevel) throw new Error("Document can only have one root node. " + this.debugInfo(name));
                    this.openCurrent();
                    name = getValue(name);
                    if (null == attributes) attributes = {};
                    attributes = getValue(attributes);
                    if (!isObject(attributes)) [text, attributes] = [
                        attributes,
                        text
                    ];
                    this.currentNode = new XMLElement(this, name, attributes);
                    this.currentNode.children = false;
                    this.currentLevel++;
                    this.openTags[this.currentLevel] = this.currentNode;
                    if (null != text) this.text(text);
                    return this;
                }
                element(name, attributes, text) {
                    var child, i, len, oldValidationFlag, ref, root;
                    if (this.currentNode && this.currentNode.type === NodeType.DocType) this.dtdElement(...arguments);
                    else if (Array.isArray(name) || isObject(name) || isFunction(name)) {
                        oldValidationFlag = this.options.noValidation;
                        this.options.noValidation = true;
                        root = new XMLDocument(this.options).element('TEMP_ROOT');
                        root.element(name);
                        this.options.noValidation = oldValidationFlag;
                        ref = root.children;
                        for(i = 0, len = ref.length; i < len; i++){
                            child = ref[i];
                            this.createChildNode(child);
                            if (child.type === NodeType.Element) this.up();
                        }
                    } else this.node(name, attributes, text);
                    return this;
                }
                attribute(name, value) {
                    var attName, attValue;
                    if (!this.currentNode || this.currentNode.children) throw new Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(name));
                    if (null != name) name = getValue(name);
                    if (isObject(name)) {
                        for(attName in name)if (hasProp.call(name, attName)) {
                            attValue = name[attName];
                            this.attribute(attName, attValue);
                        }
                    } else {
                        if (isFunction(value)) value = value.apply();
                        if (this.options.keepNullAttributes && null == value) this.currentNode.attribs[name] = new XMLAttribute(this, name, "");
                        else if (null != value) this.currentNode.attribs[name] = new XMLAttribute(this, name, value);
                    }
                    return this;
                }
                text(value) {
                    var node;
                    this.openCurrent();
                    node = new XMLText(this, value);
                    this.onData(this.writer.text(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                cdata(value) {
                    var node;
                    this.openCurrent();
                    node = new XMLCData(this, value);
                    this.onData(this.writer.cdata(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                comment(value) {
                    var node;
                    this.openCurrent();
                    node = new XMLComment(this, value);
                    this.onData(this.writer.comment(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                raw(value) {
                    var node;
                    this.openCurrent();
                    node = new XMLRaw(this, value);
                    this.onData(this.writer.raw(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                instruction(target, value) {
                    var i, insTarget, insValue, len, node;
                    this.openCurrent();
                    if (null != target) target = getValue(target);
                    if (null != value) value = getValue(value);
                    if (Array.isArray(target)) for(i = 0, len = target.length; i < len; i++){
                        insTarget = target[i];
                        this.instruction(insTarget);
                    }
                    else if (isObject(target)) {
                        for(insTarget in target)if (hasProp.call(target, insTarget)) {
                            insValue = target[insTarget];
                            this.instruction(insTarget, insValue);
                        }
                    } else {
                        if (isFunction(value)) value = value.apply();
                        node = new XMLProcessingInstruction(this, target, value);
                        this.onData(this.writer.processingInstruction(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    }
                    return this;
                }
                declaration(version, encoding, standalone) {
                    var node;
                    this.openCurrent();
                    if (this.documentStarted) throw new Error("declaration() must be the first node.");
                    node = new XMLDeclaration(this, version, encoding, standalone);
                    this.onData(this.writer.declaration(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                doctype(root, pubID, sysID) {
                    this.openCurrent();
                    if (null == root) throw new Error("Missing root node name.");
                    if (this.root) throw new Error("dtd() must come before the root node.");
                    this.currentNode = new XMLDocType(this, pubID, sysID);
                    this.currentNode.rootNodeName = root;
                    this.currentNode.children = false;
                    this.currentLevel++;
                    this.openTags[this.currentLevel] = this.currentNode;
                    return this;
                }
                dtdElement(name, value) {
                    var node;
                    this.openCurrent();
                    node = new XMLDTDElement(this, name, value);
                    this.onData(this.writer.dtdElement(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                attList(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                    var node;
                    this.openCurrent();
                    node = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
                    this.onData(this.writer.dtdAttList(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                entity(name, value) {
                    var node;
                    this.openCurrent();
                    node = new XMLDTDEntity(this, false, name, value);
                    this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                pEntity(name, value) {
                    var node;
                    this.openCurrent();
                    node = new XMLDTDEntity(this, true, name, value);
                    this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                notation(name, value) {
                    var node;
                    this.openCurrent();
                    node = new XMLDTDNotation(this, name, value);
                    this.onData(this.writer.dtdNotation(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
                    return this;
                }
                up() {
                    if (this.currentLevel < 0) throw new Error("The document node has no parent.");
                    if (this.currentNode) {
                        if (this.currentNode.children) this.closeNode(this.currentNode);
                        else this.openNode(this.currentNode);
                        this.currentNode = null;
                    } else this.closeNode(this.openTags[this.currentLevel]);
                    delete this.openTags[this.currentLevel];
                    this.currentLevel--;
                    return this;
                }
                end() {
                    while(this.currentLevel >= 0)this.up();
                    return this.onEnd();
                }
                openCurrent() {
                    if (this.currentNode) {
                        this.currentNode.children = true;
                        return this.openNode(this.currentNode);
                    }
                }
                openNode(node) {
                    var att, chunk, name, ref;
                    if (!node.isOpen) {
                        if (!this.root && 0 === this.currentLevel && node.type === NodeType.Element) this.root = node;
                        chunk = '';
                        if (node.type === NodeType.Element) {
                            this.writerOptions.state = WriterState.OpenTag;
                            chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + '<' + node.name;
                            ref = node.attribs;
                            for(name in ref)if (hasProp.call(ref, name)) {
                                att = ref[name];
                                chunk += this.writer.attribute(att, this.writerOptions, this.currentLevel);
                            }
                            chunk += (node.children ? '>' : '/>') + this.writer.endline(node, this.writerOptions, this.currentLevel);
                            this.writerOptions.state = WriterState.InsideTag;
                        } else {
                            this.writerOptions.state = WriterState.OpenTag;
                            chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + '<!DOCTYPE ' + node.rootNodeName;
                            if (node.pubID && node.sysID) chunk += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
                            else if (node.sysID) chunk += ' SYSTEM "' + node.sysID + '"';
                            if (node.children) {
                                chunk += ' [';
                                this.writerOptions.state = WriterState.InsideTag;
                            } else {
                                this.writerOptions.state = WriterState.CloseTag;
                                chunk += '>';
                            }
                            chunk += this.writer.endline(node, this.writerOptions, this.currentLevel);
                        }
                        this.onData(chunk, this.currentLevel);
                        return node.isOpen = true;
                    }
                }
                closeNode(node) {
                    var chunk;
                    if (!node.isClosed) {
                        chunk = '';
                        this.writerOptions.state = WriterState.CloseTag;
                        chunk = node.type === NodeType.Element ? this.writer.indent(node, this.writerOptions, this.currentLevel) + '</' + node.name + '>' + this.writer.endline(node, this.writerOptions, this.currentLevel) : this.writer.indent(node, this.writerOptions, this.currentLevel) + ']>' + this.writer.endline(node, this.writerOptions, this.currentLevel);
                        this.writerOptions.state = WriterState.None;
                        this.onData(chunk, this.currentLevel);
                        return node.isClosed = true;
                    }
                }
                onData(chunk, level) {
                    this.documentStarted = true;
                    return this.onDataCallback(chunk, level + 1);
                }
                onEnd() {
                    this.documentCompleted = true;
                    return this.onEndCallback();
                }
                debugInfo(name) {
                    if (null == name) return "";
                    return "node: <" + name + ">";
                }
                ele() {
                    return this.element(...arguments);
                }
                nod(name, attributes, text) {
                    return this.node(name, attributes, text);
                }
                txt(value) {
                    return this.text(value);
                }
                dat(value) {
                    return this.cdata(value);
                }
                com(value) {
                    return this.comment(value);
                }
                ins(target, value) {
                    return this.instruction(target, value);
                }
                dec(version, encoding, standalone) {
                    return this.declaration(version, encoding, standalone);
                }
                dtd(root, pubID, sysID) {
                    return this.doctype(root, pubID, sysID);
                }
                e(name, attributes, text) {
                    return this.element(name, attributes, text);
                }
                n(name, attributes, text) {
                    return this.node(name, attributes, text);
                }
                t(value) {
                    return this.text(value);
                }
                d(value) {
                    return this.cdata(value);
                }
                c(value) {
                    return this.comment(value);
                }
                r(value) {
                    return this.raw(value);
                }
                i(target, value) {
                    return this.instruction(target, value);
                }
                att() {
                    if (this.currentNode && this.currentNode.type === NodeType.DocType) return this.attList(...arguments);
                    return this.attribute(...arguments);
                }
                a() {
                    if (this.currentNode && this.currentNode.type === NodeType.DocType) return this.attList(...arguments);
                    return this.attribute(...arguments);
                }
                ent(name, value) {
                    return this.entity(name, value);
                }
                pent(name, value) {
                    return this.pEntity(name, value);
                }
                not(name, value) {
                    return this.notation(name, value);
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDummy.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLNode;
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            module.exports = class extends XMLNode {
                constructor(parent){
                    super(parent);
                    this.type = NodeType.Dummy;
                }
                clone() {
                    return Object.create(this);
                }
                toString(options) {
                    return '';
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLElement.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLAttribute, XMLNamedNodeMap, XMLNode, getValue, isFunction, isObject, hasProp = {}.hasOwnProperty;
            ({ isObject, isFunction, getValue } = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLAttribute = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLAttribute.js");
            XMLNamedNodeMap = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNamedNodeMap.js");
            module.exports = (function() {
                class XMLElement extends XMLNode {
                    constructor(parent, name, attributes){
                        var child, j, len, ref;
                        super(parent);
                        if (null == name) throw new Error("Missing element name. " + this.debugInfo());
                        this.name = this.stringify.name(name);
                        this.type = NodeType.Element;
                        this.attribs = {};
                        this.schemaTypeInfo = null;
                        if (null != attributes) this.attribute(attributes);
                        if (parent.type === NodeType.Document) {
                            this.isRoot = true;
                            this.documentObject = parent;
                            parent.rootObject = this;
                            if (parent.children) {
                                ref = parent.children;
                                for(j = 0, len = ref.length; j < len; j++){
                                    child = ref[j];
                                    if (child.type === NodeType.DocType) {
                                        child.name = this.name;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    clone() {
                        var att, attName, clonedSelf, ref;
                        clonedSelf = Object.create(this);
                        if (clonedSelf.isRoot) clonedSelf.documentObject = null;
                        clonedSelf.attribs = {};
                        ref = this.attribs;
                        for(attName in ref)if (hasProp.call(ref, attName)) {
                            att = ref[attName];
                            clonedSelf.attribs[attName] = att.clone();
                        }
                        clonedSelf.children = [];
                        this.children.forEach(function(child) {
                            var clonedChild;
                            clonedChild = child.clone();
                            clonedChild.parent = clonedSelf;
                            return clonedSelf.children.push(clonedChild);
                        });
                        return clonedSelf;
                    }
                    attribute(name, value) {
                        var attName, attValue;
                        if (null != name) name = getValue(name);
                        if (isObject(name)) {
                            for(attName in name)if (hasProp.call(name, attName)) {
                                attValue = name[attName];
                                this.attribute(attName, attValue);
                            }
                        } else {
                            if (isFunction(value)) value = value.apply();
                            if (this.options.keepNullAttributes && null == value) this.attribs[name] = new XMLAttribute(this, name, "");
                            else if (null != value) this.attribs[name] = new XMLAttribute(this, name, value);
                        }
                        return this;
                    }
                    removeAttribute(name) {
                        var attName, j, len;
                        if (null == name) throw new Error("Missing attribute name. " + this.debugInfo());
                        name = getValue(name);
                        if (Array.isArray(name)) for(j = 0, len = name.length; j < len; j++){
                            attName = name[j];
                            delete this.attribs[attName];
                        }
                        else delete this.attribs[name];
                        return this;
                    }
                    toString(options) {
                        return this.options.writer.element(this, this.options.writer.filterOptions(options));
                    }
                    att(name, value) {
                        return this.attribute(name, value);
                    }
                    a(name, value) {
                        return this.attribute(name, value);
                    }
                    getAttribute(name) {
                        if (this.attribs.hasOwnProperty(name)) return this.attribs[name].value;
                        return null;
                    }
                    setAttribute(name, value) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getAttributeNode(name) {
                        if (this.attribs.hasOwnProperty(name)) return this.attribs[name];
                        return null;
                    }
                    setAttributeNode(newAttr) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    removeAttributeNode(oldAttr) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getElementsByTagName(name) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getAttributeNS(namespaceURI, localName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    setAttributeNS(namespaceURI, qualifiedName, value) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    removeAttributeNS(namespaceURI, localName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getAttributeNodeNS(namespaceURI, localName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    setAttributeNodeNS(newAttr) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getElementsByTagNameNS(namespaceURI, localName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    hasAttribute(name) {
                        return this.attribs.hasOwnProperty(name);
                    }
                    hasAttributeNS(namespaceURI, localName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    setIdAttribute(name, isId) {
                        if (this.attribs.hasOwnProperty(name)) return this.attribs[name].isId;
                        return isId;
                    }
                    setIdAttributeNS(namespaceURI, localName, isId) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    setIdAttributeNode(idAttr, isId) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getElementsByTagName(tagname) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getElementsByTagNameNS(namespaceURI, localName) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getElementsByClassName(classNames) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    isEqualNode(node) {
                        var i, j, ref;
                        if (!super.isEqualNode(node)) return false;
                        if (node.namespaceURI !== this.namespaceURI) return false;
                        if (node.prefix !== this.prefix) return false;
                        if (node.localName !== this.localName) return false;
                        if (node.attribs.length !== this.attribs.length) return false;
                        for(i = j = 0, ref = this.attribs.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j)if (!this.attribs[i].isEqualNode(node.attribs[i])) return false;
                        return true;
                    }
                }
                Object.defineProperty(XMLElement.prototype, 'tagName', {
                    get: function() {
                        return this.name;
                    }
                });
                Object.defineProperty(XMLElement.prototype, 'namespaceURI', {
                    get: function() {
                        return '';
                    }
                });
                Object.defineProperty(XMLElement.prototype, 'prefix', {
                    get: function() {
                        return '';
                    }
                });
                Object.defineProperty(XMLElement.prototype, 'localName', {
                    get: function() {
                        return this.name;
                    }
                });
                Object.defineProperty(XMLElement.prototype, 'id', {
                    get: function() {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                });
                Object.defineProperty(XMLElement.prototype, 'className', {
                    get: function() {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                });
                Object.defineProperty(XMLElement.prototype, 'classList', {
                    get: function() {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                });
                Object.defineProperty(XMLElement.prototype, 'attributes', {
                    get: function() {
                        if (!this.attributeMap || !this.attributeMap.nodes) this.attributeMap = new XMLNamedNodeMap(this.attribs);
                        return this.attributeMap;
                    }
                });
                return XMLElement;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNamedNodeMap.js" (module) {
        (function() {
            module.exports = (function() {
                class XMLNamedNodeMap {
                    constructor(nodes){
                        this.nodes = nodes;
                    }
                    clone() {
                        return this.nodes = null;
                    }
                    getNamedItem(name) {
                        return this.nodes[name];
                    }
                    setNamedItem(node) {
                        var oldNode;
                        oldNode = this.nodes[node.nodeName];
                        this.nodes[node.nodeName] = node;
                        return oldNode || null;
                    }
                    removeNamedItem(name) {
                        var oldNode;
                        oldNode = this.nodes[name];
                        delete this.nodes[name];
                        return oldNode || null;
                    }
                    item(index) {
                        return this.nodes[Object.keys(this.nodes)[index]] || null;
                    }
                    getNamedItemNS(namespaceURI, localName) {
                        throw new Error("This DOM method is not implemented.");
                    }
                    setNamedItemNS(node) {
                        throw new Error("This DOM method is not implemented.");
                    }
                    removeNamedItemNS(namespaceURI, localName) {
                        throw new Error("This DOM method is not implemented.");
                    }
                }
                Object.defineProperty(XMLNamedNodeMap.prototype, 'length', {
                    get: function() {
                        return Object.keys(this.nodes).length || 0;
                    }
                });
                return XMLNamedNodeMap;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var DocumentPosition, NodeType, XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLNodeList, XMLProcessingInstruction, XMLRaw, XMLText, getValue, isEmpty, isFunction, isObject, hasProp = {}.hasOwnProperty, splice = [].splice;
            ({ isObject, isFunction, isEmpty, getValue } = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
            XMLElement = null;
            XMLCData = null;
            XMLComment = null;
            XMLDeclaration = null;
            XMLDocType = null;
            XMLRaw = null;
            XMLText = null;
            XMLProcessingInstruction = null;
            XMLDummy = null;
            NodeType = null;
            XMLNodeList = null;
            DocumentPosition = null;
            module.exports = (function() {
                class XMLNode {
                    constructor(parent1){
                        this.parent = parent1;
                        if (this.parent) {
                            this.options = this.parent.options;
                            this.stringify = this.parent.stringify;
                        }
                        this.value = null;
                        this.children = [];
                        this.baseURI = null;
                        if (!XMLElement) {
                            XMLElement = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLElement.js");
                            XMLCData = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCData.js");
                            XMLComment = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLComment.js");
                            XMLDeclaration = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDeclaration.js");
                            XMLDocType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocType.js");
                            XMLRaw = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLRaw.js");
                            XMLText = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLText.js");
                            XMLProcessingInstruction = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLProcessingInstruction.js");
                            XMLDummy = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDummy.js");
                            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
                            XMLNodeList = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNodeList.js");
                            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNamedNodeMap.js");
                            DocumentPosition = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/DocumentPosition.js");
                        }
                    }
                    setParent(parent) {
                        var child, j, len, ref1, results;
                        this.parent = parent;
                        if (parent) {
                            this.options = parent.options;
                            this.stringify = parent.stringify;
                        }
                        ref1 = this.children;
                        results = [];
                        for(j = 0, len = ref1.length; j < len; j++){
                            child = ref1[j];
                            results.push(child.setParent(this));
                        }
                        return results;
                    }
                    element(name, attributes, text) {
                        var childNode, item, j, k, key, lastChild, len, len1, val;
                        lastChild = null;
                        if (null === attributes && null == text) [attributes, text] = [
                            {},
                            null
                        ];
                        if (null == attributes) attributes = {};
                        attributes = getValue(attributes);
                        if (!isObject(attributes)) [text, attributes] = [
                            attributes,
                            text
                        ];
                        if (null != name) name = getValue(name);
                        if (Array.isArray(name)) for(j = 0, len = name.length; j < len; j++){
                            item = name[j];
                            lastChild = this.element(item);
                        }
                        else if (isFunction(name)) lastChild = this.element(name.apply());
                        else if (isObject(name)) {
                            for(key in name)if (hasProp.call(name, key)) {
                                val = name[key];
                                if (isFunction(val)) val = val.apply();
                                if (!this.options.ignoreDecorators && this.stringify.convertAttKey && 0 === key.indexOf(this.stringify.convertAttKey)) lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
                                else if (!this.options.separateArrayItems && Array.isArray(val) && isEmpty(val)) lastChild = this.dummy();
                                else if (isObject(val) && isEmpty(val)) lastChild = this.element(key);
                                else if (this.options.keepNullNodes || null != val) if (!this.options.separateArrayItems && Array.isArray(val)) for(k = 0, len1 = val.length; k < len1; k++){
                                    item = val[k];
                                    childNode = {};
                                    childNode[key] = item;
                                    lastChild = this.element(childNode);
                                }
                                else if (isObject(val)) if (!this.options.ignoreDecorators && this.stringify.convertTextKey && 0 === key.indexOf(this.stringify.convertTextKey)) lastChild = this.element(val);
                                else {
                                    lastChild = this.element(key);
                                    lastChild.element(val);
                                }
                                else lastChild = this.element(key, val);
                                else lastChild = this.dummy();
                            }
                        } else lastChild = this.options.keepNullNodes || null !== text ? !this.options.ignoreDecorators && this.stringify.convertTextKey && 0 === name.indexOf(this.stringify.convertTextKey) ? this.text(text) : !this.options.ignoreDecorators && this.stringify.convertCDataKey && 0 === name.indexOf(this.stringify.convertCDataKey) ? this.cdata(text) : !this.options.ignoreDecorators && this.stringify.convertCommentKey && 0 === name.indexOf(this.stringify.convertCommentKey) ? this.comment(text) : !this.options.ignoreDecorators && this.stringify.convertRawKey && 0 === name.indexOf(this.stringify.convertRawKey) ? this.raw(text) : !this.options.ignoreDecorators && this.stringify.convertPIKey && 0 === name.indexOf(this.stringify.convertPIKey) ? this.instruction(name.substr(this.stringify.convertPIKey.length), text) : this.node(name, attributes, text) : this.dummy();
                        if (null == lastChild) throw new Error("Could not create any elements with: " + name + ". " + this.debugInfo());
                        return lastChild;
                    }
                    insertBefore(name, attributes, text) {
                        var child, i, newChild, refChild, removed;
                        if (null != name ? name.type : void 0) {
                            newChild = name;
                            refChild = attributes;
                            newChild.setParent(this);
                            if (refChild) {
                                i = children.indexOf(refChild);
                                removed = children.splice(i);
                                children.push(newChild);
                                Array.prototype.push.apply(children, removed);
                            } else children.push(newChild);
                            return newChild;
                        }
                        if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
                        i = this.parent.children.indexOf(this);
                        removed = this.parent.children.splice(i);
                        child = this.parent.element(name, attributes, text);
                        Array.prototype.push.apply(this.parent.children, removed);
                        return child;
                    }
                    insertAfter(name, attributes, text) {
                        var child, i, removed;
                        if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
                        i = this.parent.children.indexOf(this);
                        removed = this.parent.children.splice(i + 1);
                        child = this.parent.element(name, attributes, text);
                        Array.prototype.push.apply(this.parent.children, removed);
                        return child;
                    }
                    remove() {
                        var i;
                        if (this.isRoot) throw new Error("Cannot remove the root element. " + this.debugInfo());
                        i = this.parent.children.indexOf(this);
                        splice.apply(this.parent.children, [
                            i,
                            i - i + 1
                        ].concat([]));
                        return this.parent;
                    }
                    node(name, attributes, text) {
                        var child;
                        if (null != name) name = getValue(name);
                        attributes || (attributes = {});
                        attributes = getValue(attributes);
                        if (!isObject(attributes)) [text, attributes] = [
                            attributes,
                            text
                        ];
                        child = new XMLElement(this, name, attributes);
                        if (null != text) child.text(text);
                        this.children.push(child);
                        return child;
                    }
                    text(value) {
                        var child;
                        if (isObject(value)) this.element(value);
                        child = new XMLText(this, value);
                        this.children.push(child);
                        return this;
                    }
                    cdata(value) {
                        var child;
                        child = new XMLCData(this, value);
                        this.children.push(child);
                        return this;
                    }
                    comment(value) {
                        var child;
                        child = new XMLComment(this, value);
                        this.children.push(child);
                        return this;
                    }
                    commentBefore(value) {
                        var i, removed;
                        i = this.parent.children.indexOf(this);
                        removed = this.parent.children.splice(i);
                        this.parent.comment(value);
                        Array.prototype.push.apply(this.parent.children, removed);
                        return this;
                    }
                    commentAfter(value) {
                        var i, removed;
                        i = this.parent.children.indexOf(this);
                        removed = this.parent.children.splice(i + 1);
                        this.parent.comment(value);
                        Array.prototype.push.apply(this.parent.children, removed);
                        return this;
                    }
                    raw(value) {
                        var child;
                        child = new XMLRaw(this, value);
                        this.children.push(child);
                        return this;
                    }
                    dummy() {
                        var child;
                        child = new XMLDummy(this);
                        return child;
                    }
                    instruction(target, value) {
                        var insTarget, insValue, instruction, j, len;
                        if (null != target) target = getValue(target);
                        if (null != value) value = getValue(value);
                        if (Array.isArray(target)) for(j = 0, len = target.length; j < len; j++){
                            insTarget = target[j];
                            this.instruction(insTarget);
                        }
                        else if (isObject(target)) {
                            for(insTarget in target)if (hasProp.call(target, insTarget)) {
                                insValue = target[insTarget];
                                this.instruction(insTarget, insValue);
                            }
                        } else {
                            if (isFunction(value)) value = value.apply();
                            instruction = new XMLProcessingInstruction(this, target, value);
                            this.children.push(instruction);
                        }
                        return this;
                    }
                    instructionBefore(target, value) {
                        var i, removed;
                        i = this.parent.children.indexOf(this);
                        removed = this.parent.children.splice(i);
                        this.parent.instruction(target, value);
                        Array.prototype.push.apply(this.parent.children, removed);
                        return this;
                    }
                    instructionAfter(target, value) {
                        var i, removed;
                        i = this.parent.children.indexOf(this);
                        removed = this.parent.children.splice(i + 1);
                        this.parent.instruction(target, value);
                        Array.prototype.push.apply(this.parent.children, removed);
                        return this;
                    }
                    declaration(version, encoding, standalone) {
                        var doc, xmldec;
                        doc = this.document();
                        xmldec = new XMLDeclaration(doc, version, encoding, standalone);
                        if (0 === doc.children.length) doc.children.unshift(xmldec);
                        else if (doc.children[0].type === NodeType.Declaration) doc.children[0] = xmldec;
                        else doc.children.unshift(xmldec);
                        return doc.root() || doc;
                    }
                    dtd(pubID, sysID) {
                        var child, doc, doctype, i, j, k, len, len1, ref1, ref2;
                        doc = this.document();
                        doctype = new XMLDocType(doc, pubID, sysID);
                        ref1 = doc.children;
                        for(i = j = 0, len = ref1.length; j < len; i = ++j){
                            child = ref1[i];
                            if (child.type === NodeType.DocType) {
                                doc.children[i] = doctype;
                                return doctype;
                            }
                        }
                        ref2 = doc.children;
                        for(i = k = 0, len1 = ref2.length; k < len1; i = ++k){
                            child = ref2[i];
                            if (child.isRoot) {
                                doc.children.splice(i, 0, doctype);
                                return doctype;
                            }
                        }
                        doc.children.push(doctype);
                        return doctype;
                    }
                    up() {
                        if (this.isRoot) throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
                        return this.parent;
                    }
                    root() {
                        var node;
                        node = this;
                        while(node)if (node.type === NodeType.Document) return node.rootObject;
                        else {
                            if (node.isRoot) return node;
                            node = node.parent;
                        }
                    }
                    document() {
                        var node;
                        node = this;
                        while(node)if (node.type === NodeType.Document) return node;
                        else node = node.parent;
                    }
                    end(options) {
                        return this.document().end(options);
                    }
                    prev() {
                        var i;
                        i = this.parent.children.indexOf(this);
                        if (i < 1) throw new Error("Already at the first node. " + this.debugInfo());
                        return this.parent.children[i - 1];
                    }
                    next() {
                        var i;
                        i = this.parent.children.indexOf(this);
                        if (-1 === i || i === this.parent.children.length - 1) throw new Error("Already at the last node. " + this.debugInfo());
                        return this.parent.children[i + 1];
                    }
                    importDocument(doc) {
                        var child, clonedRoot, j, len, ref1;
                        clonedRoot = doc.root().clone();
                        clonedRoot.parent = this;
                        clonedRoot.isRoot = false;
                        this.children.push(clonedRoot);
                        if (this.type === NodeType.Document) {
                            clonedRoot.isRoot = true;
                            clonedRoot.documentObject = this;
                            this.rootObject = clonedRoot;
                            if (this.children) {
                                ref1 = this.children;
                                for(j = 0, len = ref1.length; j < len; j++){
                                    child = ref1[j];
                                    if (child.type === NodeType.DocType) {
                                        child.name = clonedRoot.name;
                                        break;
                                    }
                                }
                            }
                        }
                        return this;
                    }
                    debugInfo(name) {
                        var ref1, ref2;
                        name = name || this.name;
                        if (null == name && !(null != (ref1 = this.parent) ? ref1.name : void 0)) return "";
                        if (null == name) return "parent: <" + this.parent.name + ">";
                        if (!(null != (ref2 = this.parent) ? ref2.name : void 0)) return "node: <" + name + ">";
                        return "node: <" + name + ">, parent: <" + this.parent.name + ">";
                    }
                    ele(name, attributes, text) {
                        return this.element(name, attributes, text);
                    }
                    nod(name, attributes, text) {
                        return this.node(name, attributes, text);
                    }
                    txt(value) {
                        return this.text(value);
                    }
                    dat(value) {
                        return this.cdata(value);
                    }
                    com(value) {
                        return this.comment(value);
                    }
                    ins(target, value) {
                        return this.instruction(target, value);
                    }
                    doc() {
                        return this.document();
                    }
                    dec(version, encoding, standalone) {
                        return this.declaration(version, encoding, standalone);
                    }
                    e(name, attributes, text) {
                        return this.element(name, attributes, text);
                    }
                    n(name, attributes, text) {
                        return this.node(name, attributes, text);
                    }
                    t(value) {
                        return this.text(value);
                    }
                    d(value) {
                        return this.cdata(value);
                    }
                    c(value) {
                        return this.comment(value);
                    }
                    r(value) {
                        return this.raw(value);
                    }
                    i(target, value) {
                        return this.instruction(target, value);
                    }
                    u() {
                        return this.up();
                    }
                    importXMLBuilder(doc) {
                        return this.importDocument(doc);
                    }
                    attribute(name, value) {
                        throw new Error("attribute() applies to element nodes only.");
                    }
                    att(name, value) {
                        return this.attribute(name, value);
                    }
                    a(name, value) {
                        return this.attribute(name, value);
                    }
                    removeAttribute(name) {
                        throw new Error("attribute() applies to element nodes only.");
                    }
                    replaceChild(newChild, oldChild) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    removeChild(oldChild) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    appendChild(newChild) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    hasChildNodes() {
                        return 0 !== this.children.length;
                    }
                    cloneNode(deep) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    normalize() {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    isSupported(feature, version) {
                        return true;
                    }
                    hasAttributes() {
                        return 0 !== this.attribs.length;
                    }
                    compareDocumentPosition(other) {
                        var ref, res;
                        ref = this;
                        if (ref === other) return 0;
                        if (this.document() !== other.document()) {
                            res = DocumentPosition.Disconnected | DocumentPosition.ImplementationSpecific;
                            if (Math.random() < 0.5) res |= DocumentPosition.Preceding;
                            else res |= DocumentPosition.Following;
                            return res;
                        }
                        if (ref.isAncestor(other)) return DocumentPosition.Contains | DocumentPosition.Preceding;
                        if (ref.isDescendant(other)) return DocumentPosition.Contains | DocumentPosition.Following;
                        if (ref.isPreceding(other)) return DocumentPosition.Preceding;
                        else return DocumentPosition.Following;
                    }
                    isSameNode(other) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    lookupPrefix(namespaceURI) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    isDefaultNamespace(namespaceURI) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    lookupNamespaceURI(prefix) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    isEqualNode(node) {
                        var i, j, ref1;
                        if (node.nodeType !== this.nodeType) return false;
                        if (node.children.length !== this.children.length) return false;
                        for(i = j = 0, ref1 = this.children.length - 1; 0 <= ref1 ? j <= ref1 : j >= ref1; i = 0 <= ref1 ? ++j : --j)if (!this.children[i].isEqualNode(node.children[i])) return false;
                        return true;
                    }
                    getFeature(feature, version) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    setUserData(key, data, handler) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    getUserData(key) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    contains(other) {
                        if (!other) return false;
                        return other === this || this.isDescendant(other);
                    }
                    isDescendant(node) {
                        var child, isDescendantChild, j, len, ref1;
                        ref1 = this.children;
                        for(j = 0, len = ref1.length; j < len; j++){
                            child = ref1[j];
                            if (node === child) return true;
                            isDescendantChild = child.isDescendant(node);
                            if (isDescendantChild) return true;
                        }
                        return false;
                    }
                    isAncestor(node) {
                        return node.isDescendant(this);
                    }
                    isPreceding(node) {
                        var nodePos, thisPos;
                        nodePos = this.treePosition(node);
                        thisPos = this.treePosition(this);
                        if (-1 === nodePos || -1 === thisPos) return false;
                        return nodePos < thisPos;
                    }
                    isFollowing(node) {
                        var nodePos, thisPos;
                        nodePos = this.treePosition(node);
                        thisPos = this.treePosition(this);
                        if (-1 === nodePos || -1 === thisPos) return false;
                        return nodePos > thisPos;
                    }
                    treePosition(node) {
                        var found, pos;
                        pos = 0;
                        found = false;
                        this.foreachTreeNode(this.document(), function(childNode) {
                            pos++;
                            if (!found && childNode === node) return found = true;
                        });
                        if (found) return pos;
                        return -1;
                    }
                    foreachTreeNode(node, func) {
                        var child, j, len, ref1, res;
                        node || (node = this.document());
                        ref1 = node.children;
                        for(j = 0, len = ref1.length; j < len; j++){
                            child = ref1[j];
                            if (res = func(child)) return res;
                            res = this.foreachTreeNode(child, func);
                            if (res) return res;
                        }
                    }
                }
                Object.defineProperty(XMLNode.prototype, 'nodeName', {
                    get: function() {
                        return this.name;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'nodeType', {
                    get: function() {
                        return this.type;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'nodeValue', {
                    get: function() {
                        return this.value;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'parentNode', {
                    get: function() {
                        return this.parent;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'childNodes', {
                    get: function() {
                        if (!this.childNodeList || !this.childNodeList.nodes) this.childNodeList = new XMLNodeList(this.children);
                        return this.childNodeList;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'firstChild', {
                    get: function() {
                        return this.children[0] || null;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'lastChild', {
                    get: function() {
                        return this.children[this.children.length - 1] || null;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'previousSibling', {
                    get: function() {
                        var i;
                        i = this.parent.children.indexOf(this);
                        return this.parent.children[i - 1] || null;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'nextSibling', {
                    get: function() {
                        var i;
                        i = this.parent.children.indexOf(this);
                        return this.parent.children[i + 1] || null;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'ownerDocument', {
                    get: function() {
                        return this.document() || null;
                    }
                });
                Object.defineProperty(XMLNode.prototype, 'textContent', {
                    get: function() {
                        var child, j, len, ref1, str;
                        if (this.nodeType !== NodeType.Element && this.nodeType !== NodeType.DocumentFragment) return null;
                        str = '';
                        ref1 = this.children;
                        for(j = 0, len = ref1.length; j < len; j++){
                            child = ref1[j];
                            if (child.textContent) str += child.textContent;
                        }
                        return str;
                    },
                    set: function(value) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                });
                return XMLNode;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNodeList.js" (module) {
        (function() {
            module.exports = (function() {
                class XMLNodeList {
                    constructor(nodes){
                        this.nodes = nodes;
                    }
                    clone() {
                        return this.nodes = null;
                    }
                    item(index) {
                        return this.nodes[index] || null;
                    }
                }
                Object.defineProperty(XMLNodeList.prototype, 'length', {
                    get: function() {
                        return this.nodes.length || 0;
                    }
                });
                return XMLNodeList;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLProcessingInstruction.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLCharacterData;
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLCharacterData = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js");
            module.exports = class extends XMLCharacterData {
                constructor(parent, target, value){
                    super(parent);
                    if (null == target) throw new Error("Missing instruction target. " + this.debugInfo());
                    this.type = NodeType.ProcessingInstruction;
                    this.target = this.stringify.insTarget(target);
                    this.name = this.target;
                    if (value) this.value = this.stringify.insValue(value);
                }
                clone() {
                    return Object.create(this);
                }
                toString(options) {
                    return this.options.writer.processingInstruction(this, this.options.writer.filterOptions(options));
                }
                isEqualNode(node) {
                    if (!super.isEqualNode(node)) return false;
                    if (node.target !== this.target) return false;
                    return true;
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLRaw.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLNode;
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLNode = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLNode.js");
            module.exports = class extends XMLNode {
                constructor(parent, text){
                    super(parent);
                    if (null == text) throw new Error("Missing raw text. " + this.debugInfo());
                    this.type = NodeType.Raw;
                    this.value = this.stringify.raw(text);
                }
                clone() {
                    return Object.create(this);
                }
                toString(options) {
                    return this.options.writer.raw(this, this.options.writer.filterOptions(options));
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStreamWriter.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, WriterState, XMLWriterBase, hasProp = {}.hasOwnProperty;
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLWriterBase = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLWriterBase.js");
            WriterState = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js");
            module.exports = class extends XMLWriterBase {
                constructor(stream, options){
                    super(options);
                    this.stream = stream;
                }
                endline(node, options, level) {
                    if (node.isLastRootNode && options.state === WriterState.CloseTag) return '';
                    return super.endline(node, options, level);
                }
                document(doc, options) {
                    var child, i, j, k, len1, len2, ref, ref1, results;
                    ref = doc.children;
                    for(i = j = 0, len1 = ref.length; j < len1; i = ++j){
                        child = ref[i];
                        child.isLastRootNode = i === doc.children.length - 1;
                    }
                    options = this.filterOptions(options);
                    ref1 = doc.children;
                    results = [];
                    for(k = 0, len2 = ref1.length; k < len2; k++){
                        child = ref1[k];
                        results.push(this.writeChildNode(child, options, 0));
                    }
                    return results;
                }
                cdata(node, options, level) {
                    return this.stream.write(super.cdata(node, options, level));
                }
                comment(node, options, level) {
                    return this.stream.write(super.comment(node, options, level));
                }
                declaration(node, options, level) {
                    return this.stream.write(super.declaration(node, options, level));
                }
                docType(node, options, level) {
                    var child, j, len1, ref;
                    level || (level = 0);
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    this.stream.write(this.indent(node, options, level));
                    this.stream.write('<!DOCTYPE ' + node.root().name);
                    if (node.pubID && node.sysID) this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
                    else if (node.sysID) this.stream.write(' SYSTEM "' + node.sysID + '"');
                    if (node.children.length > 0) {
                        this.stream.write(' [');
                        this.stream.write(this.endline(node, options, level));
                        options.state = WriterState.InsideTag;
                        ref = node.children;
                        for(j = 0, len1 = ref.length; j < len1; j++){
                            child = ref[j];
                            this.writeChildNode(child, options, level + 1);
                        }
                        options.state = WriterState.CloseTag;
                        this.stream.write(']');
                    }
                    options.state = WriterState.CloseTag;
                    this.stream.write(options.spaceBeforeSlash + '>');
                    this.stream.write(this.endline(node, options, level));
                    options.state = WriterState.None;
                    return this.closeNode(node, options, level);
                }
                element(node, options, level) {
                    var att, attLen, child, childNodeCount, firstChildNode, j, len, len1, name, r, ratt, ref, ref1, ref2, rline;
                    level || (level = 0);
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<' + node.name;
                    if (options.pretty && options.width > 0) {
                        len = r.length;
                        ref = node.attribs;
                        for(name in ref)if (hasProp.call(ref, name)) {
                            att = ref[name];
                            ratt = this.attribute(att, options, level);
                            attLen = ratt.length;
                            if (len + attLen > options.width) {
                                rline = this.indent(node, options, level + 1) + ratt;
                                r += this.endline(node, options, level) + rline;
                                len = rline.length;
                            } else {
                                rline = ' ' + ratt;
                                r += rline;
                                len += rline.length;
                            }
                        }
                    } else {
                        ref1 = node.attribs;
                        for(name in ref1)if (hasProp.call(ref1, name)) {
                            att = ref1[name];
                            r += this.attribute(att, options, level);
                        }
                    }
                    this.stream.write(r);
                    childNodeCount = node.children.length;
                    firstChildNode = 0 === childNodeCount ? null : node.children[0];
                    if (0 === childNodeCount || node.children.every(function(e) {
                        return (e.type === NodeType.Text || e.type === NodeType.Raw || e.type === NodeType.CData) && '' === e.value;
                    })) if (options.allowEmpty) {
                        this.stream.write('>');
                        options.state = WriterState.CloseTag;
                        this.stream.write('</' + node.name + '>');
                    } else {
                        options.state = WriterState.CloseTag;
                        this.stream.write(options.spaceBeforeSlash + '/>');
                    }
                    else if (options.pretty && 1 === childNodeCount && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw || firstChildNode.type === NodeType.CData) && null != firstChildNode.value) {
                        this.stream.write('>');
                        options.state = WriterState.InsideTag;
                        options.suppressPrettyCount++;
                        this.writeChildNode(firstChildNode, options, level + 1);
                        options.suppressPrettyCount--;
                        options.state = WriterState.CloseTag;
                        this.stream.write('</' + node.name + '>');
                    } else {
                        this.stream.write('>' + this.endline(node, options, level));
                        options.state = WriterState.InsideTag;
                        ref2 = node.children;
                        for(j = 0, len1 = ref2.length; j < len1; j++){
                            child = ref2[j];
                            this.writeChildNode(child, options, level + 1);
                        }
                        options.state = WriterState.CloseTag;
                        this.stream.write(this.indent(node, options, level) + '</' + node.name + '>');
                    }
                    this.stream.write(this.endline(node, options, level));
                    options.state = WriterState.None;
                    return this.closeNode(node, options, level);
                }
                processingInstruction(node, options, level) {
                    return this.stream.write(super.processingInstruction(node, options, level));
                }
                raw(node, options, level) {
                    return this.stream.write(super.raw(node, options, level));
                }
                text(node, options, level) {
                    return this.stream.write(super.text(node, options, level));
                }
                dtdAttList(node, options, level) {
                    return this.stream.write(super.dtdAttList(node, options, level));
                }
                dtdElement(node, options, level) {
                    return this.stream.write(super.dtdElement(node, options, level));
                }
                dtdEntity(node, options, level) {
                    return this.stream.write(super.dtdEntity(node, options, level));
                }
                dtdNotation(node, options, level) {
                    return this.stream.write(super.dtdNotation(node, options, level));
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringWriter.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var XMLWriterBase;
            XMLWriterBase = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLWriterBase.js");
            module.exports = class extends XMLWriterBase {
                constructor(options){
                    super(options);
                }
                document(doc, options) {
                    var child, i, len, r, ref;
                    options = this.filterOptions(options);
                    r = '';
                    ref = doc.children;
                    for(i = 0, len = ref.length; i < len; i++){
                        child = ref[i];
                        r += this.writeChildNode(child, options, 0);
                    }
                    if (options.pretty && r.slice(-options.newline.length) === options.newline) r = r.slice(0, -options.newline.length);
                    return r;
                }
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringifier.js" (module) {
        (function() {
            var hasProp = {}.hasOwnProperty;
            module.exports = (function() {
                class XMLStringifier {
                    constructor(options){
                        var key, ref, value;
                        this.assertLegalChar = this.assertLegalChar.bind(this);
                        this.assertLegalName = this.assertLegalName.bind(this);
                        options || (options = {});
                        this.options = options;
                        if (!this.options.version) this.options.version = '1.0';
                        ref = options.stringify || {};
                        for(key in ref)if (hasProp.call(ref, key)) {
                            value = ref[key];
                            this[key] = value;
                        }
                    }
                    name(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalName('' + val || '');
                    }
                    text(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar(this.textEscape('' + val || ''));
                    }
                    cdata(val) {
                        if (this.options.noValidation) return val;
                        val = '' + val || '';
                        val = val.replace(']]>', ']]]]><![CDATA[>');
                        return this.assertLegalChar(val);
                    }
                    comment(val) {
                        if (this.options.noValidation) return val;
                        val = '' + val || '';
                        if (val.match(/--/)) throw new Error("Comment text cannot contain double-hypen: " + val);
                        return this.assertLegalChar(val);
                    }
                    raw(val) {
                        if (this.options.noValidation) return val;
                        return '' + val || '';
                    }
                    attValue(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar(this.attEscape(val = '' + val || ''));
                    }
                    insTarget(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar('' + val || '');
                    }
                    insValue(val) {
                        if (this.options.noValidation) return val;
                        val = '' + val || '';
                        if (val.match(/\?>/)) throw new Error("Invalid processing instruction value: " + val);
                        return this.assertLegalChar(val);
                    }
                    xmlVersion(val) {
                        if (this.options.noValidation) return val;
                        val = '' + val || '';
                        if (!val.match(/1\.[0-9]+/)) throw new Error("Invalid version number: " + val);
                        return val;
                    }
                    xmlEncoding(val) {
                        if (this.options.noValidation) return val;
                        val = '' + val || '';
                        if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) throw new Error("Invalid encoding: " + val);
                        return this.assertLegalChar(val);
                    }
                    xmlStandalone(val) {
                        if (this.options.noValidation) return val;
                        if (val) return "yes";
                        return "no";
                    }
                    dtdPubID(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar('' + val || '');
                    }
                    dtdSysID(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar('' + val || '');
                    }
                    dtdElementValue(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar('' + val || '');
                    }
                    dtdAttType(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar('' + val || '');
                    }
                    dtdAttDefault(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar('' + val || '');
                    }
                    dtdEntityValue(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar('' + val || '');
                    }
                    dtdNData(val) {
                        if (this.options.noValidation) return val;
                        return this.assertLegalChar('' + val || '');
                    }
                    assertLegalChar(str) {
                        var regex, res;
                        if (this.options.noValidation) return str;
                        if ('1.0' === this.options.version) {
                            regex = /[\0-\x08\x0B\f\x0E-\x1F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g;
                            if (void 0 !== this.options.invalidCharReplacement) str = str.replace(regex, this.options.invalidCharReplacement);
                            else if (res = str.match(regex)) throw new Error(`Invalid character in string: ${str} at index ${res.index}`);
                        } else if ('1.1' === this.options.version) {
                            regex = /[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g;
                            if (void 0 !== this.options.invalidCharReplacement) str = str.replace(regex, this.options.invalidCharReplacement);
                            else if (res = str.match(regex)) throw new Error(`Invalid character in string: ${str} at index ${res.index}`);
                        }
                        return str;
                    }
                    assertLegalName(str) {
                        var regex;
                        if (this.options.noValidation) return str;
                        str = this.assertLegalChar(str);
                        regex = /^([:A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])([\x2D\.0-:A-Z_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
                        if (!str.match(regex)) throw new Error(`Invalid character in name: ${str}`);
                        return str;
                    }
                    textEscape(str) {
                        var ampregex;
                        if (this.options.noValidation) return str;
                        ampregex = this.options.noDoubleEncoding ? /(?!&(lt|gt|amp|apos|quot);)&/g : /&/g;
                        return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
                    }
                    attEscape(str) {
                        var ampregex;
                        if (this.options.noValidation) return str;
                        ampregex = this.options.noDoubleEncoding ? /(?!&(lt|gt|amp|apos|quot);)&/g : /&/g;
                        return str.replace(ampregex, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;').replace(/\r/g, '&#xD;');
                    }
                }
                XMLStringifier.prototype.convertAttKey = '@';
                XMLStringifier.prototype.convertPIKey = '?';
                XMLStringifier.prototype.convertTextKey = '#text';
                XMLStringifier.prototype.convertCDataKey = '#cdata';
                XMLStringifier.prototype.convertCommentKey = '#comment';
                XMLStringifier.prototype.convertRawKey = '#raw';
                return XMLStringifier;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLText.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, XMLCharacterData;
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            XMLCharacterData = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCharacterData.js");
            module.exports = (function() {
                class XMLText extends XMLCharacterData {
                    constructor(parent, text){
                        super(parent);
                        if (null == text) throw new Error("Missing element text. " + this.debugInfo());
                        this.name = "#text";
                        this.type = NodeType.Text;
                        this.value = this.stringify.text(text);
                    }
                    clone() {
                        return Object.create(this);
                    }
                    toString(options) {
                        return this.options.writer.text(this, this.options.writer.filterOptions(options));
                    }
                    splitText(offset) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                    replaceWholeText(content) {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                }
                Object.defineProperty(XMLText.prototype, 'isElementContentWhitespace', {
                    get: function() {
                        throw new Error("This DOM method is not implemented." + this.debugInfo());
                    }
                });
                Object.defineProperty(XMLText.prototype, 'wholeText', {
                    get: function() {
                        var next, prev, str;
                        str = '';
                        prev = this.previousSibling;
                        while(prev){
                            str = prev.data + str;
                            prev = prev.previousSibling;
                        }
                        str += this.data;
                        next = this.nextSibling;
                        while(next){
                            str += next.data;
                            next = next.nextSibling;
                        }
                        return str;
                    }
                });
                return XMLText;
            }).call(this);
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLWriterBase.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, WriterState, assign, hasProp = {}.hasOwnProperty;
            ({ assign } = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDeclaration.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocType.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLCData.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLComment.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLElement.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLRaw.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLText.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLProcessingInstruction.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDummy.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDAttList.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDElement.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDEntity.js");
            __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDTDNotation.js");
            WriterState = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js");
            module.exports = class {
                constructor(options){
                    var key, ref, value;
                    options || (options = {});
                    this.options = options;
                    ref = options.writer || {};
                    for(key in ref)if (hasProp.call(ref, key)) {
                        value = ref[key];
                        this["_" + key] = this[key];
                        this[key] = value;
                    }
                }
                filterOptions(options) {
                    var filteredOptions, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
                    options || (options = {});
                    options = assign({}, this.options, options);
                    filteredOptions = {
                        writer: this
                    };
                    filteredOptions.pretty = options.pretty || false;
                    filteredOptions.allowEmpty = options.allowEmpty || false;
                    filteredOptions.indent = null != (ref = options.indent) ? ref : '  ';
                    filteredOptions.newline = null != (ref1 = options.newline) ? ref1 : '\n';
                    filteredOptions.offset = null != (ref2 = options.offset) ? ref2 : 0;
                    filteredOptions.width = null != (ref3 = options.width) ? ref3 : 0;
                    filteredOptions.dontPrettyTextNodes = null != (ref4 = null != (ref5 = options.dontPrettyTextNodes) ? ref5 : options.dontprettytextnodes) ? ref4 : 0;
                    filteredOptions.spaceBeforeSlash = null != (ref6 = null != (ref7 = options.spaceBeforeSlash) ? ref7 : options.spacebeforeslash) ? ref6 : '';
                    if (true === filteredOptions.spaceBeforeSlash) filteredOptions.spaceBeforeSlash = ' ';
                    filteredOptions.suppressPrettyCount = 0;
                    filteredOptions.user = {};
                    filteredOptions.state = WriterState.None;
                    return filteredOptions;
                }
                indent(node, options, level) {
                    var indentLevel;
                    if (!options.pretty || options.suppressPrettyCount) ;
                    else if (options.pretty) {
                        indentLevel = (level || 0) + options.offset + 1;
                        if (indentLevel > 0) return new Array(indentLevel).join(options.indent);
                    }
                    return '';
                }
                endline(node, options, level) {
                    if (!options.pretty || options.suppressPrettyCount) return '';
                    return options.newline;
                }
                attribute(att, options, level) {
                    var r;
                    this.openAttribute(att, options, level);
                    r = options.pretty && options.width > 0 ? att.name + '="' + att.value + '"' : ' ' + att.name + '="' + att.value + '"';
                    this.closeAttribute(att, options, level);
                    return r;
                }
                cdata(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<![CDATA[';
                    options.state = WriterState.InsideTag;
                    r += node.value;
                    options.state = WriterState.CloseTag;
                    r += ']]>' + this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                comment(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<!-- ';
                    options.state = WriterState.InsideTag;
                    r += node.value;
                    options.state = WriterState.CloseTag;
                    r += ' -->' + this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                declaration(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<?xml';
                    options.state = WriterState.InsideTag;
                    r += ' version="' + node.version + '"';
                    if (null != node.encoding) r += ' encoding="' + node.encoding + '"';
                    if (null != node.standalone) r += ' standalone="' + node.standalone + '"';
                    options.state = WriterState.CloseTag;
                    r += options.spaceBeforeSlash + '?>';
                    r += this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                docType(node, options, level) {
                    var child, i, len1, r, ref;
                    level || (level = 0);
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level);
                    r += '<!DOCTYPE ' + node.root().name;
                    if (node.pubID && node.sysID) r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
                    else if (node.sysID) r += ' SYSTEM "' + node.sysID + '"';
                    if (node.children.length > 0) {
                        r += ' [';
                        r += this.endline(node, options, level);
                        options.state = WriterState.InsideTag;
                        ref = node.children;
                        for(i = 0, len1 = ref.length; i < len1; i++){
                            child = ref[i];
                            r += this.writeChildNode(child, options, level + 1);
                        }
                        options.state = WriterState.CloseTag;
                        r += ']';
                    }
                    options.state = WriterState.CloseTag;
                    r += options.spaceBeforeSlash + '>';
                    r += this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                element(node, options, level) {
                    var att, attLen, child, childNodeCount, firstChildNode, i, j, len, len1, len2, name, prettySuppressed, r, ratt, ref, ref1, ref2, ref3, rline;
                    level || (level = 0);
                    prettySuppressed = false;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<' + node.name;
                    if (options.pretty && options.width > 0) {
                        len = r.length;
                        ref = node.attribs;
                        for(name in ref)if (hasProp.call(ref, name)) {
                            att = ref[name];
                            ratt = this.attribute(att, options, level);
                            attLen = ratt.length;
                            if (len + attLen > options.width) {
                                rline = this.indent(node, options, level + 1) + ratt;
                                r += this.endline(node, options, level) + rline;
                                len = rline.length;
                            } else {
                                rline = ' ' + ratt;
                                r += rline;
                                len += rline.length;
                            }
                        }
                    } else {
                        ref1 = node.attribs;
                        for(name in ref1)if (hasProp.call(ref1, name)) {
                            att = ref1[name];
                            r += this.attribute(att, options, level);
                        }
                    }
                    childNodeCount = node.children.length;
                    firstChildNode = 0 === childNodeCount ? null : node.children[0];
                    if (0 === childNodeCount || node.children.every(function(e) {
                        return (e.type === NodeType.Text || e.type === NodeType.Raw || e.type === NodeType.CData) && '' === e.value;
                    })) if (options.allowEmpty) {
                        r += '>';
                        options.state = WriterState.CloseTag;
                        r += '</' + node.name + '>' + this.endline(node, options, level);
                    } else {
                        options.state = WriterState.CloseTag;
                        r += options.spaceBeforeSlash + '/>' + this.endline(node, options, level);
                    }
                    else if (options.pretty && 1 === childNodeCount && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw || firstChildNode.type === NodeType.CData) && null != firstChildNode.value) {
                        r += '>';
                        options.state = WriterState.InsideTag;
                        options.suppressPrettyCount++;
                        prettySuppressed = true;
                        r += this.writeChildNode(firstChildNode, options, level + 1);
                        options.suppressPrettyCount--;
                        prettySuppressed = false;
                        options.state = WriterState.CloseTag;
                        r += '</' + node.name + '>' + this.endline(node, options, level);
                    } else {
                        if (options.dontPrettyTextNodes) {
                            ref2 = node.children;
                            for(i = 0, len1 = ref2.length; i < len1; i++){
                                child = ref2[i];
                                if ((child.type === NodeType.Text || child.type === NodeType.Raw || child.type === NodeType.CData) && null != child.value) {
                                    options.suppressPrettyCount++;
                                    prettySuppressed = true;
                                    break;
                                }
                            }
                        }
                        r += '>' + this.endline(node, options, level);
                        options.state = WriterState.InsideTag;
                        ref3 = node.children;
                        for(j = 0, len2 = ref3.length; j < len2; j++){
                            child = ref3[j];
                            r += this.writeChildNode(child, options, level + 1);
                        }
                        options.state = WriterState.CloseTag;
                        r += this.indent(node, options, level) + '</' + node.name + '>';
                        if (prettySuppressed) options.suppressPrettyCount--;
                        r += this.endline(node, options, level);
                        options.state = WriterState.None;
                    }
                    this.closeNode(node, options, level);
                    return r;
                }
                writeChildNode(node, options, level) {
                    switch(node.type){
                        case NodeType.CData:
                            return this.cdata(node, options, level);
                        case NodeType.Comment:
                            return this.comment(node, options, level);
                        case NodeType.Element:
                            return this.element(node, options, level);
                        case NodeType.Raw:
                            return this.raw(node, options, level);
                        case NodeType.Text:
                            return this.text(node, options, level);
                        case NodeType.ProcessingInstruction:
                            return this.processingInstruction(node, options, level);
                        case NodeType.Dummy:
                            return '';
                        case NodeType.Declaration:
                            return this.declaration(node, options, level);
                        case NodeType.DocType:
                            return this.docType(node, options, level);
                        case NodeType.AttributeDeclaration:
                            return this.dtdAttList(node, options, level);
                        case NodeType.ElementDeclaration:
                            return this.dtdElement(node, options, level);
                        case NodeType.EntityDeclaration:
                            return this.dtdEntity(node, options, level);
                        case NodeType.NotationDeclaration:
                            return this.dtdNotation(node, options, level);
                        default:
                            throw new Error("Unknown XML node type: " + node.constructor.name);
                    }
                }
                processingInstruction(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<?';
                    options.state = WriterState.InsideTag;
                    r += node.target;
                    if (node.value) r += ' ' + node.value;
                    options.state = WriterState.CloseTag;
                    r += options.spaceBeforeSlash + '?>';
                    r += this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                raw(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level);
                    options.state = WriterState.InsideTag;
                    r += node.value;
                    options.state = WriterState.CloseTag;
                    r += this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                text(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level);
                    options.state = WriterState.InsideTag;
                    r += node.value;
                    options.state = WriterState.CloseTag;
                    r += this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                dtdAttList(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<!ATTLIST';
                    options.state = WriterState.InsideTag;
                    r += ' ' + node.elementName + ' ' + node.attributeName + ' ' + node.attributeType;
                    if ('#DEFAULT' !== node.defaultValueType) r += ' ' + node.defaultValueType;
                    if (node.defaultValue) r += ' "' + node.defaultValue + '"';
                    options.state = WriterState.CloseTag;
                    r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                dtdElement(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<!ELEMENT';
                    options.state = WriterState.InsideTag;
                    r += ' ' + node.name + ' ' + node.value;
                    options.state = WriterState.CloseTag;
                    r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                dtdEntity(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<!ENTITY';
                    options.state = WriterState.InsideTag;
                    if (node.pe) r += ' %';
                    r += ' ' + node.name;
                    if (node.value) r += ' "' + node.value + '"';
                    else {
                        if (node.pubID && node.sysID) r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
                        else if (node.sysID) r += ' SYSTEM "' + node.sysID + '"';
                        if (node.nData) r += ' NDATA ' + node.nData;
                    }
                    options.state = WriterState.CloseTag;
                    r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                dtdNotation(node, options, level) {
                    var r;
                    this.openNode(node, options, level);
                    options.state = WriterState.OpenTag;
                    r = this.indent(node, options, level) + '<!NOTATION';
                    options.state = WriterState.InsideTag;
                    r += ' ' + node.name;
                    if (node.pubID && node.sysID) r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
                    else if (node.pubID) r += ' PUBLIC "' + node.pubID + '"';
                    else if (node.sysID) r += ' SYSTEM "' + node.sysID + '"';
                    options.state = WriterState.CloseTag;
                    r += options.spaceBeforeSlash + '>' + this.endline(node, options, level);
                    options.state = WriterState.None;
                    this.closeNode(node, options, level);
                    return r;
                }
                openNode(node, options, level) {}
                closeNode(node, options, level) {}
                openAttribute(att, options, level) {}
                closeAttribute(att, options, level) {}
            };
        }).call(this);
    },
    "../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/index.js" (module, __unused_rspack_exports, __webpack_require__) {
        (function() {
            var NodeType, WriterState, XMLDOMImplementation, XMLDocument, XMLDocumentCB, XMLStreamWriter, XMLStringWriter, assign, isFunction;
            ({ assign, isFunction } = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/Utility.js"));
            XMLDOMImplementation = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDOMImplementation.js");
            XMLDocument = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocument.js");
            XMLDocumentCB = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLDocumentCB.js");
            XMLStringWriter = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStringWriter.js");
            XMLStreamWriter = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/XMLStreamWriter.js");
            NodeType = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/NodeType.js");
            WriterState = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/WriterState.js");
            module.exports.create = function(name, xmldec, doctype, options) {
                var doc, root;
                if (null == name) throw new Error("Root element needs a name.");
                options = assign({}, xmldec, doctype, options);
                doc = new XMLDocument(options);
                root = doc.element(name);
                if (!options.headless) {
                    doc.declaration(options);
                    if (null != options.pubID || null != options.sysID) doc.dtd(options);
                }
                return root;
            };
            module.exports.begin = function(options, onData, onEnd) {
                if (isFunction(options)) {
                    [onData, onEnd] = [
                        options,
                        onData
                    ];
                    options = {};
                }
                if (onData) return new XMLDocumentCB(options, onData, onEnd);
                return new XMLDocument(options);
            };
            module.exports.stringWriter = function(options) {
                return new XMLStringWriter(options);
            };
            module.exports.streamWriter = function(stream, options) {
                return new XMLStreamWriter(stream, options);
            };
            module.exports.implementation = new XMLDOMImplementation();
            module.exports.nodeType = NodeType;
            module.exports.writerState = WriterState;
        }).call(this);
    },
    buffer (module) {
        module.exports = __rspack_createRequire_require("buffer");
    },
    crypto (module) {
        module.exports = __rspack_createRequire_require("crypto");
    },
    events (module) {
        module.exports = __rspack_createRequire_require("events");
    },
    http (module) {
        module.exports = __rspack_createRequire_require("http");
    },
    https (module) {
        module.exports = __rspack_createRequire_require("https");
    },
    "net?14db" (module) {
        module.exports = __rspack_createRequire_require("net");
    },
    stream (module) {
        module.exports = __rspack_createRequire_require("stream");
    },
    tls (module) {
        module.exports = __rspack_createRequire_require("tls");
    },
    url (module) {
        module.exports = __rspack_createRequire_require("url");
    },
    util (module) {
        module.exports = __rspack_createRequire_require("util");
    },
    zlib (module) {
        module.exports = __rspack_createRequire_require("zlib");
    }
});
class PromiseResolver {
    #promise;
    get promise() {
        return this.#promise;
    }
    #resolve;
    #reject;
    #state = 'running';
    get state() {
        return this.#state;
    }
    constructor(){
        this.#promise = new Promise((resolve, reject)=>{
            this.#resolve = resolve;
            this.#reject = reject;
        });
    }
    resolve = (value)=>{
        this.#resolve(value);
        this.#state = 'resolved';
    };
    reject = (reason)=>{
        this.#reject(reason);
        this.#state = 'rejected';
    };
}
function getUint64LittleEndian(buffer, offset) {
    return BigInt(buffer[offset]) | BigInt(buffer[offset + 1]) << 8n | BigInt(buffer[offset + 2]) << 16n | BigInt(buffer[offset + 3]) << 24n | BigInt(buffer[offset + 4]) << 32n | BigInt(buffer[offset + 5]) << 40n | BigInt(buffer[offset + 6]) << 48n | BigInt(buffer[offset + 7]) << 56n;
}
function getUint64(buffer, offset, littleEndian) {
    return littleEndian ? BigInt(buffer[offset]) | BigInt(buffer[offset + 1]) << 8n | BigInt(buffer[offset + 2]) << 16n | BigInt(buffer[offset + 3]) << 24n | BigInt(buffer[offset + 4]) << 32n | BigInt(buffer[offset + 5]) << 40n | BigInt(buffer[offset + 6]) << 48n | BigInt(buffer[offset + 7]) << 56n : BigInt(buffer[offset]) << 56n | BigInt(buffer[offset + 1]) << 48n | BigInt(buffer[offset + 2]) << 40n | BigInt(buffer[offset + 3]) << 32n | BigInt(buffer[offset + 4]) << 24n | BigInt(buffer[offset + 5]) << 16n | BigInt(buffer[offset + 6]) << 8n | BigInt(buffer[offset + 7]);
}
function setUint64(buffer, offset, value, littleEndian) {
    if (littleEndian) {
        buffer[offset] = Number(0xffn & value);
        buffer[offset + 1] = Number(value >> 8n & 0xffn);
        buffer[offset + 2] = Number(value >> 16n & 0xffn);
        buffer[offset + 3] = Number(value >> 24n & 0xffn);
        buffer[offset + 4] = Number(value >> 32n & 0xffn);
        buffer[offset + 5] = Number(value >> 40n & 0xffn);
        buffer[offset + 6] = Number(value >> 48n & 0xffn);
        buffer[offset + 7] = Number(value >> 56n & 0xffn);
    } else {
        buffer[offset] = Number(value >> 56n & 0xffn);
        buffer[offset + 1] = Number(value >> 48n & 0xffn);
        buffer[offset + 2] = Number(value >> 40n & 0xffn);
        buffer[offset + 3] = Number(value >> 32n & 0xffn);
        buffer[offset + 4] = Number(value >> 24n & 0xffn);
        buffer[offset + 5] = Number(value >> 16n & 0xffn);
        buffer[offset + 6] = Number(value >> 8n & 0xffn);
        buffer[offset + 7] = Number(0xffn & value);
    }
}
const { AbortController: stream_AbortController } = globalThis;
const stream_ReadableStream = /* #__PURE__ */ (()=>{
    const { ReadableStream } = globalThis;
    if (!ReadableStream.from) ReadableStream.from = function(iterable) {
        const iterator = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
        return new ReadableStream({
            async pull (controller) {
                const result = await iterator.next();
                if (result.done) return void controller.close();
                controller.enqueue(result.value);
            },
            async cancel (reason) {
                await iterator.return?.(reason);
            }
        });
    };
    if (!ReadableStream.prototype[Symbol.asyncIterator] || !ReadableStream.prototype.values) {
        ReadableStream.prototype.values = async function*(options) {
            const reader = this.getReader();
            try {
                while(true){
                    const { done, value } = await reader.read();
                    if (done) return;
                    yield value;
                }
            } finally{
                if (!options?.preventCancel) await reader.cancel();
                reader.releaseLock();
            }
        };
        ReadableStream.prototype[Symbol.asyncIterator] = ReadableStream.prototype.values;
    }
    return ReadableStream;
})();
const { WritableStream: WritableStream, TransformStream: TransformStream } = globalThis;
const Global = globalThis;
const TextDecoderStream = Global.TextDecoderStream;
Global.TextEncoderStream;
function isPromiseLike(value) {
    return "object" == typeof value && null !== value && "then" in value;
}
function advance(iterator, next) {
    while(true){
        const { done, value } = iterator.next(next);
        if (done) return value;
        if (isPromiseLike(value)) return value.then((value)=>advance(iterator, {
                resolved: value
            }), (error)=>advance(iterator, {
                error
            }));
        next = value;
    }
}
function bipedal(fn, bindThis) {
    function result(...args) {
        const iterator = fn.call(this, function*(value) {
            if (isPromiseLike(value)) {
                const result = yield value;
                if ("resolved" in result) return result.resolved;
                throw result.error;
            }
            return value;
        }, ...args);
        return advance(iterator, void 0);
    }
    if (bindThis) return result.bind(bindThis);
    return result;
}
function defaultFieldSerializer(serializer) {
    return (source, context)=>{
        if (!("buffer" in context)) return serializer(source, context);
        {
            const buffer = serializer(source, context);
            context.buffer.set(buffer, context.index);
            return buffer.length;
        }
    };
}
function byobFieldSerializer(size, serializer) {
    return (source, context)=>{
        if ("buffer" in context) {
            context.index ??= 0;
            serializer(source, context);
            return size;
        }
        {
            const buffer = new Uint8Array(size);
            serializer(source, {
                buffer,
                index: 0,
                littleEndian: context.littleEndian
            });
            return buffer;
        }
    };
}
function _field(size, type, serialize, deserialize, options) {
    const field = {
        size,
        type: type,
        serialize: "default" === type ? defaultFieldSerializer(serialize) : byobFieldSerializer(size, serialize),
        deserialize: bipedal(deserialize),
        omitInit: options?.omitInit
    };
    if (options?.init) field.init = options.init;
    return field;
}
const factory_field = _field;
const EmptyUint8Array = new Uint8Array(0);
function copyMaybeDifferentLength(dest, source, index, length) {
    if (source.length < length) {
        dest.set(source, index);
        dest.fill(0, index + source.length, index + length);
    } else if (source.length === length) dest.set(source, index);
    else dest.set(source.subarray(0, length), index);
}
function buffer_buffer(lengthOrField, converter) {
    if ("number" == typeof lengthOrField) {
        let serialize;
        let deserialize;
        let init;
        if (0 === lengthOrField) {
            serialize = ()=>{};
            deserialize = converter ? function*() {
                return converter.convert(EmptyUint8Array);
            } : function*() {
                return EmptyUint8Array;
            };
        } else {
            serialize = (value, { buffer, index })=>copyMaybeDifferentLength(buffer, value, index, lengthOrField);
            if (converter) {
                deserialize = function*(then, reader) {
                    const array = reader.readExactly(lengthOrField);
                    return converter.convert((yield* then(array)));
                };
                init = (value)=>converter.back(value);
            } else deserialize = function*(_then, reader) {
                const array = reader.readExactly(lengthOrField);
                return array;
            };
        }
        return factory_field(lengthOrField, "byob", serialize, deserialize, {
            init
        });
    }
    if (("object" == typeof lengthOrField || "function" == typeof lengthOrField) && "serialize" in lengthOrField) {
        let deserialize;
        let init;
        if (converter) {
            deserialize = function*(then, reader, context) {
                const length = yield* then(lengthOrField.deserialize(reader, context));
                const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
                return converter.convert((yield* then(array)));
            };
            init = (value)=>converter.back(value);
        } else deserialize = function*(then, reader, context) {
            const length = yield* then(lengthOrField.deserialize(reader, context));
            const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
            return array;
        };
        return factory_field(lengthOrField.size, "default", (value, { littleEndian })=>{
            if ("default" === lengthOrField.type) {
                const lengthBuffer = lengthOrField.serialize(value.length, {
                    littleEndian
                });
                if (0 === value.length) return lengthBuffer;
                const result = new Uint8Array(lengthBuffer.length + value.length);
                result.set(lengthBuffer, 0);
                result.set(value, lengthBuffer.length);
                return result;
            }
            {
                const result = new Uint8Array(lengthOrField.size + value.length);
                lengthOrField.serialize(value.length, {
                    buffer: result,
                    index: 0,
                    littleEndian
                });
                result.set(value, lengthOrField.size);
                return result;
            }
        }, deserialize, {
            init
        });
    }
    if ("string" == typeof lengthOrField) {
        let deserialize;
        let init;
        if (converter) {
            deserialize = function*(then, reader, { dependencies }) {
                const length = dependencies[lengthOrField];
                const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
                return converter.convert((yield* then(array)));
            };
            init = (value, dependencies)=>{
                const array = converter.back(value);
                dependencies[lengthOrField] = array.length;
                return array;
            };
        } else {
            deserialize = function*(_then, reader, { dependencies }) {
                const length = dependencies[lengthOrField];
                const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
                return array;
            };
            init = (value, dependencies)=>{
                const array = value;
                dependencies[lengthOrField] = array.length;
                return array;
            };
        }
        return factory_field(0, "default", (source)=>source, deserialize, {
            init
        });
    }
    let deserialize;
    let init;
    if (converter) {
        deserialize = function*(then, reader, { dependencies }) {
            const rawLength = dependencies[lengthOrField.field];
            const length = lengthOrField.convert(rawLength);
            const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
            return converter.convert((yield* then(array)));
        };
        init = (value, dependencies)=>{
            const array = converter.back(value);
            dependencies[lengthOrField.field] = lengthOrField.back(array.length);
            return array;
        };
    } else {
        deserialize = function*(_then, reader, { dependencies }) {
            const rawLength = dependencies[lengthOrField.field];
            const length = lengthOrField.convert(rawLength);
            const array = 0 !== length ? reader.readExactly(length) : EmptyUint8Array;
            return array;
        };
        init = (value, dependencies)=>{
            const array = value;
            dependencies[lengthOrField.field] = lengthOrField.back(array.length);
            return array;
        };
    }
    return factory_field(0, "default", (source)=>source, deserialize, {
        init
    });
}
class ConcatStringStream {
    #result = "";
    #resolver = new PromiseResolver();
    #writable = new WritableStream({
        write: (chunk)=>{
            this.#result += chunk;
        },
        close: ()=>{
            this.#resolver.resolve(this.#result);
            this.#readableController.enqueue(this.#result);
            this.#readableController.close();
        },
        abort: (reason)=>{
            this.#resolver.reject(reason);
            this.#readableController.error(reason);
        }
    });
    get writable() {
        return this.#writable;
    }
    #readableController;
    #readable = new stream_ReadableStream({
        start: (controller)=>{
            this.#readableController = controller;
        }
    });
    get readable() {
        return this.#readable;
    }
    constructor(){
        Object.defineProperties(this.#readable, {
            then: {
                get: ()=>this.#resolver.promise.then.bind(this.#resolver.promise)
            },
            catch: {
                get: ()=>this.#resolver.promise.catch.bind(this.#resolver.promise)
            },
            finally: {
                get: ()=>this.#resolver.promise.finally.bind(this.#resolver.promise)
            }
        });
    }
}
class ConcatBufferStream {
    #segments = [];
    #resolver = new PromiseResolver();
    #writable = new WritableStream({
        write: (chunk)=>{
            this.#segments.push(chunk);
        },
        close: ()=>{
            let result;
            let offset = 0;
            switch(this.#segments.length){
                case 0:
                    result = EmptyUint8Array;
                    break;
                case 1:
                    result = this.#segments[0];
                    break;
                default:
                    result = new Uint8Array(this.#segments.reduce((prev, item)=>prev + item.length, 0));
                    for (const segment of this.#segments){
                        result.set(segment, offset);
                        offset += segment.length;
                    }
                    break;
            }
            this.#resolver.resolve(result);
            this.#readableController.enqueue(result);
            this.#readableController.close();
        },
        abort: (reason)=>{
            this.#resolver.reject(reason);
            this.#readableController.error(reason);
        }
    });
    get writable() {
        return this.#writable;
    }
    #readableController;
    #readable = new stream_ReadableStream({
        start: (controller)=>{
            this.#readableController = controller;
        }
    });
    get readable() {
        return this.#readable;
    }
    constructor(){
        Object.defineProperties(this.#readable, {
            then: {
                get: ()=>this.#resolver.promise.then.bind(this.#resolver.promise)
            },
            catch: {
                get: ()=>this.#resolver.promise.catch.bind(this.#resolver.promise)
            },
            finally: {
                get: ()=>this.#resolver.promise.finally.bind(this.#resolver.promise)
            }
        });
    }
}
const AdbFeature = {
    ShellV2: "shell_v2",
    Cmd: "cmd",
    StatV2: "stat_v2",
    ListV2: "ls_v2",
    FixedPushMkdir: "fixed_push_mkdir",
    Abb: "abb",
    AbbExec: "abb_exec",
    SendReceiveV2: "sendrecv_v2",
    DelayedAck: "delayed_ack"
};
class AdbNoneProtocolProcessImpl {
    #socket;
    get stdin() {
        return this.#socket.writable;
    }
    get output() {
        return this.#socket.readable;
    }
    #exited;
    get exited() {
        return this.#exited;
    }
    constructor(socket, signal){
        this.#socket = socket;
        if (signal) {
            const exited = new PromiseResolver();
            this.#socket.closed.then(()=>exited.resolve(void 0), (e)=>exited.reject(e));
            signal.addEventListener("abort", ()=>{
                exited.reject(signal.reason);
                this.#socket.close();
            });
            this.#exited = exited.promise;
        } else this.#exited = this.#socket.closed;
    }
    kill() {
        return this.#socket.close();
    }
}
class ConsumableWritableStream extends WritableStream {
    static async write(writer, value) {
        const consumable = new consumable_Consumable(value);
        await writer.write(consumable);
        await consumable.consumed;
    }
    constructor(sink, strategy){
        let wrappedStrategy;
        if (strategy) {
            wrappedStrategy = {};
            if ("highWaterMark" in strategy) wrappedStrategy.highWaterMark = strategy.highWaterMark;
            if ("size" in strategy) wrappedStrategy.size = (chunk)=>strategy.size(chunk instanceof consumable_Consumable ? chunk.value : chunk);
        }
        super({
            start (controller) {
                return sink.start?.(controller);
            },
            write (chunk, controller) {
                return chunk.tryConsume((chunk)=>sink.write?.(chunk, controller));
            },
            abort (reason) {
                return sink.abort?.(reason);
            },
            close () {
                return sink.close?.();
            }
        }, wrappedStrategy);
    }
}
class ConsumableWrapWritableStream extends WritableStream {
    constructor(stream){
        const writer = stream.getWriter();
        super({
            write (chunk) {
                return chunk.tryConsume((chunk)=>writer.write(chunk));
            },
            abort (reason) {
                return writer.abort(reason);
            },
            close () {
                return writer.close();
            }
        });
    }
}
class ConsumableReadableStream extends stream_ReadableStream {
    static async enqueue(controller, chunk) {
        const output = new consumable_Consumable(chunk);
        controller.enqueue(output);
        await output.consumed;
    }
    constructor(source, strategy){
        let wrappedController;
        let wrappedStrategy;
        if (strategy) {
            wrappedStrategy = {};
            if ("highWaterMark" in strategy) wrappedStrategy.highWaterMark = strategy.highWaterMark;
            if ("size" in strategy) wrappedStrategy.size = (chunk)=>strategy.size(chunk.value);
        }
        super({
            start (controller) {
                wrappedController = {
                    enqueue (chunk) {
                        return ConsumableReadableStream.enqueue(controller, chunk);
                    },
                    close () {
                        controller.close();
                    },
                    error (reason) {
                        controller.error(reason);
                    }
                };
                return source.start?.(wrappedController);
            },
            pull () {
                return source.pull?.(wrappedController);
            },
            cancel (reason) {
                return source.cancel?.(reason);
            }
        }, wrappedStrategy);
    }
}
class ConsumableWrapByteReadableStream extends stream_ReadableStream {
    constructor(stream, chunkSize, min){
        const reader = stream.getReader({
            mode: "byob"
        });
        let array = new Uint8Array(chunkSize);
        super({
            async pull (controller) {
                const { done, value } = await reader.read(array, {
                    min
                });
                if (done) return void controller.close();
                await ConsumableReadableStream.enqueue(controller, value);
                array = new Uint8Array(value.buffer);
            },
            cancel (reason) {
                return reader.cancel(reason);
            }
        });
    }
}
const { console: console } = globalThis;
const createTask = /* #__PURE__ */ (()=>console?.createTask?.bind(console) ?? (()=>({
            run (callback) {
                return callback();
            }
        })))();
class consumable_Consumable {
    static WritableStream = ConsumableWritableStream;
    static WrapWritableStream = ConsumableWrapWritableStream;
    static ReadableStream = ConsumableReadableStream;
    static WrapByteReadableStream = ConsumableWrapByteReadableStream;
    #task;
    #resolver;
    value;
    consumed;
    constructor(value){
        this.#task = createTask("Consumable");
        this.value = value;
        this.#resolver = new PromiseResolver();
        this.consumed = this.#resolver.promise;
    }
    consume() {
        this.#resolver.resolve();
    }
    error(error) {
        this.#resolver.reject(error);
    }
    tryConsume(callback) {
        try {
            let result = this.#task.run(()=>callback(this.value));
            if (isPromiseLike(result)) result = result.then((value)=>{
                this.#resolver.resolve();
                return value;
            }, (e)=>{
                this.#resolver.reject(e);
                throw e;
            });
            else this.#resolver.resolve();
            return result;
        } catch (e) {
            this.#resolver.reject(e);
            throw e;
        }
    }
}
function tryConsume(value, callback) {
    if (value instanceof consumable_Consumable) return value.tryConsume(callback);
    return callback(value);
}
class MaybeConsumableWritableStream extends WritableStream {
    constructor(sink, strategy){
        let wrappedStrategy;
        if (strategy) {
            wrappedStrategy = {};
            if ("highWaterMark" in strategy) wrappedStrategy.highWaterMark = strategy.highWaterMark;
            if ("size" in strategy) wrappedStrategy.size = (chunk)=>strategy.size(chunk instanceof consumable_Consumable ? chunk.value : chunk);
        }
        super({
            start (controller) {
                return sink.start?.(controller);
            },
            write (chunk, controller) {
                return tryConsume(chunk, (chunk)=>sink.write?.(chunk, controller));
            },
            abort (reason) {
                return sink.abort?.(reason);
            },
            close () {
                return sink.close?.();
            }
        }, wrappedStrategy);
    }
}
class AdbNoneProtocolPtyProcess {
    #socket;
    #writer;
    #input;
    get input() {
        return this.#input;
    }
    get output() {
        return this.#socket.readable;
    }
    get exited() {
        return this.#socket.closed;
    }
    constructor(socket){
        this.#socket = socket;
        this.#writer = this.#socket.writable.getWriter();
        this.#input = new MaybeConsumableWritableStream({
            write: (chunk)=>this.#writer.write(chunk)
        });
    }
    sigint() {
        return this.#writer.write(new Uint8Array([
            0x03
        ]));
    }
    kill() {
        return this.#socket.close();
    }
}
function escapeArg(s) {
    let result = "";
    result += "'";
    let base = 0;
    while(true){
        const found = s.indexOf("'", base);
        if (-1 === found) {
            result += s.substring(base);
            break;
        }
        result += s.substring(base, found);
        result += String.raw`'\''`;
        base = found + 1;
    }
    result += "'";
    return result;
}
function splitCommand(command) {
    const result = [];
    let quote;
    let isEscaped = false;
    let start = 0;
    for(let i = 0, len = command.length; i < len; i += 1){
        if (isEscaped) {
            isEscaped = false;
            continue;
        }
        const char = command.charAt(i);
        switch(char){
            case " ":
                if (!quote && i !== start) {
                    result.push(command.substring(start, i));
                    start = i + 1;
                }
                break;
            case "'":
            case '"':
                if (quote) {
                    if (char === quote) quote = void 0;
                } else quote = char;
                break;
            case "\\":
                isEscaped = true;
                break;
        }
    }
    if (start < command.length) result.push(command.substring(start));
    return result;
}
class AdbNoneProtocolSpawner {
    #spawn;
    constructor(spawn){
        this.#spawn = spawn;
    }
    spawn(command, signal) {
        signal?.throwIfAborted();
        if ("string" == typeof command) command = splitCommand(command);
        return this.#spawn(command, signal);
    }
    async spawnWait(command) {
        const process1 = await this.spawn(command);
        return await process1.output.pipeThrough(new ConcatBufferStream());
    }
    async spawnWaitText(command) {
        const process1 = await this.spawn(command);
        return await process1.output.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream());
    }
}
class AdbNoneProtocolSubprocessService extends AdbNoneProtocolSpawner {
    #adb;
    get adb() {
        return this.#adb;
    }
    constructor(adb){
        super(async (command, signal)=>{
            const socket = await this.#adb.createSocket(`exec:${command.join(" ")}`);
            if (signal?.aborted) {
                await socket.close();
                throw signal.reason;
            }
            return new AdbNoneProtocolProcessImpl(socket, signal);
        });
        this.#adb = adb;
    }
    async pty(command) {
        if (void 0 === command) command = "";
        else if (Array.isArray(command)) command = command.join(" ");
        return new AdbNoneProtocolPtyProcess(await this.#adb.createSocket(`shell:${command}`));
    }
}
class TaskQueue {
    #ready;
    #disposed = false;
    enqueue(task, bail = false) {
        if (this.#disposed) throw new Error("TaskQueue is disposed");
        if (!this.#ready) try {
            const result = task();
            if (isPromiseLike(result)) this.#ready = result.then(()=>{}, (e)=>{
                if (bail) throw e;
            });
            return result;
        } catch (e) {
            if (bail) {
                const promise = Promise.reject(e);
                promise.catch(()=>{});
                this.#ready = promise;
            }
            throw e;
        }
        const result = this.#ready.then(()=>{
            if (this.#disposed) throw new Error("TaskQueue is disposed");
            return task();
        });
        this.#ready = result.then(()=>{}, (e)=>{
            if (bail || this.#disposed) throw e;
        });
        return result;
    }
    dispose() {
        this.#disposed = true;
    }
}
class PushReadableStream extends stream_ReadableStream {
    constructor(source, strategy, logger){
        let controller;
        const tasks = new TaskQueue();
        let zeroHighWaterMarkAllowEnqueue = false;
        let waterMarkLow;
        const abortController = new stream_AbortController();
        let stopped = false;
        const enqueue = (chunk)=>{
            logger?.({
                source: "producer",
                operation: "enqueue",
                value: chunk,
                phase: "start"
            });
            if (abortController.signal.aborted) {
                logger?.({
                    source: "producer",
                    operation: "enqueue",
                    value: chunk,
                    phase: "ignored"
                });
                return false;
            }
            if (null === controller.desiredSize) {
                controller.enqueue(chunk);
                throw new Error("unreachable");
            }
            if (zeroHighWaterMarkAllowEnqueue) {
                zeroHighWaterMarkAllowEnqueue = false;
                controller.enqueue(chunk);
                logger?.({
                    source: "producer",
                    operation: "enqueue",
                    value: chunk,
                    phase: "complete"
                });
                return true;
            }
            if (controller.desiredSize <= 0) {
                logger?.({
                    source: "producer",
                    operation: "enqueue",
                    value: chunk,
                    phase: "waiting"
                });
                waterMarkLow = new PromiseResolver();
                return waterMarkLow.promise.then(()=>{
                    controller.enqueue(chunk);
                    logger?.({
                        source: "producer",
                        operation: "enqueue",
                        value: chunk,
                        phase: "complete"
                    });
                    return true;
                }, ()=>{
                    logger?.({
                        source: "producer",
                        operation: "enqueue",
                        value: chunk,
                        phase: "ignored"
                    });
                    return false;
                });
            }
            controller.enqueue(chunk);
            logger?.({
                source: "producer",
                operation: "enqueue",
                value: chunk,
                phase: "complete"
            });
            return true;
        };
        const close = (explicit)=>{
            logger?.({
                source: "producer",
                operation: "close",
                explicit,
                phase: "start"
            });
            if (abortController.signal.aborted || stopped && !explicit) return void logger?.({
                source: "producer",
                operation: "close",
                explicit,
                phase: "ignored"
            });
            controller.close();
            stopped = true;
            waterMarkLow?.reject();
            logger?.({
                source: "producer",
                operation: "close",
                explicit,
                phase: "complete"
            });
        };
        const error = (error, explicit)=>{
            logger?.({
                source: "producer",
                operation: "error",
                explicit,
                phase: "start"
            });
            stopped = true;
            controller.error(error);
            waterMarkLow?.reject();
            logger?.({
                source: "producer",
                operation: "error",
                explicit,
                phase: "complete"
            });
        };
        super({
            start: (controller_)=>{
                controller = controller_;
                const result = source({
                    abortSignal: abortController.signal,
                    enqueue: async (chunk)=>await tasks.enqueue(()=>enqueue(chunk)),
                    close () {
                        close(true);
                    },
                    error (e) {
                        error(e, true);
                    }
                });
                if (!stopped && isPromiseLike(result)) result.then(()=>close(false), (e)=>error(e, false));
            },
            pull: ()=>{
                logger?.({
                    source: "consumer",
                    operation: "pull",
                    phase: "start"
                });
                if (waterMarkLow) {
                    waterMarkLow.resolve(void 0);
                    waterMarkLow = void 0;
                } else if (strategy?.highWaterMark === 0) zeroHighWaterMarkAllowEnqueue = true;
                logger?.({
                    source: "consumer",
                    operation: "pull",
                    phase: "complete"
                });
            },
            cancel: (reason)=>{
                logger?.({
                    source: "consumer",
                    operation: "cancel",
                    phase: "start"
                });
                stopped = true;
                abortController.abort(reason);
                waterMarkLow?.reject();
                logger?.({
                    source: "consumer",
                    operation: "cancel",
                    phase: "complete"
                });
            }
        }, strategy);
    }
}
class ExactReadableEndedError extends Error {
    constructor(){
        super("ExactReadable ended");
    }
}
class StructDeserializeError extends Error {
    constructor(message){
        super(message);
    }
}
class StructNotEnoughDataError extends StructDeserializeError {
    constructor(){
        super("The underlying readable was ended before the struct was fully deserialized");
    }
}
class StructEmptyError extends StructDeserializeError {
    constructor(){
        super("The underlying readable doesn't contain any more struct");
    }
}
function struct_struct(fields, options) {
    const fieldList = Object.entries(fields);
    let size = 0;
    let byob = true;
    for (const [, field] of fieldList){
        size += field.size;
        if (byob && "byob" !== field.type) byob = false;
    }
    const littleEndian = options.littleEndian;
    const extra = options.extra ? Object.getOwnPropertyDescriptors(options.extra) : void 0;
    return {
        littleEndian,
        fields,
        extra: options.extra,
        type: byob ? "byob" : "default",
        size,
        serialize (source, bufferOrContext) {
            const temp = {
                ...source
            };
            for (const [key, field] of fieldList)if (key in temp && "init" in field) {
                const result = field.init?.(temp[key], temp);
                temp[key] = result;
            }
            const sizes = new Array(fieldList.length);
            const buffers = new Array(fieldList.length);
            {
                const context = {
                    littleEndian
                };
                for (const [index, [key, field]] of fieldList.entries())if ("byob" === field.type) sizes[index] = field.size;
                else {
                    buffers[index] = field.serialize(temp[key], context);
                    sizes[index] = buffers[index].length;
                }
            }
            const size = sizes.reduce((sum, size)=>sum + size, 0);
            let externalBuffer;
            let buffer;
            let index;
            if (bufferOrContext instanceof Uint8Array) {
                if (bufferOrContext.length < size) throw new Error("Buffer too small");
                externalBuffer = true;
                buffer = bufferOrContext;
                index = 0;
            } else if ("object" == typeof bufferOrContext && "buffer" in bufferOrContext) {
                externalBuffer = true;
                buffer = bufferOrContext.buffer;
                index = bufferOrContext.index ?? 0;
                if (buffer.length - index < size) throw new Error("Buffer too small");
            } else {
                externalBuffer = false;
                buffer = new Uint8Array(size);
                index = 0;
            }
            const context = {
                buffer,
                index,
                littleEndian
            };
            for (const [index, [key, field]] of fieldList.entries()){
                if (buffers[index]) buffer.set(buffers[index], context.index);
                else field.serialize(temp[key], context);
                context.index += sizes[index];
            }
            if (externalBuffer) return size;
            return buffer;
        },
        deserialize: bipedal(function*(then, reader) {
            const startPosition = reader.position;
            const result = {};
            const context = {
                dependencies: result,
                littleEndian: littleEndian
            };
            try {
                for (const [key, field] of fieldList)result[key] = yield* then(field.deserialize(reader, context));
            } catch (e) {
                if (!(e instanceof ExactReadableEndedError)) throw e;
                if (reader.position === startPosition) throw new StructEmptyError();
                throw new StructNotEnoughDataError();
            }
            if (extra) Object.defineProperties(result, extra);
            if (options.postDeserialize) return options.postDeserialize.call(result, result);
            return result;
        })
    };
}
function tryClose(value) {
    try {
        const result = value.close();
        if (isPromiseLike(result)) return result.then(()=>true, ()=>false);
        return true;
    } catch  {
        return false;
    }
}
async function tryCancel(stream) {
    try {
        await stream.cancel();
        return true;
    } catch  {
        return false;
    }
}
class BufferedReadableStream {
    #buffered;
    #bufferedOffset = 0;
    #bufferedLength = 0;
    #position = 0;
    get position() {
        return this.#position;
    }
    stream;
    reader;
    constructor(stream){
        this.stream = stream;
        this.reader = stream.getReader();
    }
    #readBuffered(length) {
        if (!this.#buffered) return;
        const value = this.#buffered.subarray(this.#bufferedOffset, this.#bufferedOffset + length);
        if (this.#bufferedLength > length) {
            this.#position += length;
            this.#bufferedOffset += length;
            this.#bufferedLength -= length;
            return value;
        }
        this.#position += this.#bufferedLength;
        this.#buffered = void 0;
        this.#bufferedOffset = 0;
        this.#bufferedLength = 0;
        return value;
    }
    async #readSource(length) {
        const { done, value } = await this.reader.read();
        if (done) throw new ExactReadableEndedError();
        if (value.length > length) {
            this.#buffered = value;
            this.#bufferedOffset = length;
            this.#bufferedLength = value.length - length;
            this.#position += length;
            return value.subarray(0, length);
        }
        this.#position += value.length;
        return value;
    }
    iterateExactly(length) {
        let state = this.#buffered ? 0 : 1;
        return {
            next: ()=>{
                switch(state){
                    case 0:
                        {
                            const value = this.#readBuffered(length);
                            if (value.length === length) state = 2;
                            else {
                                length -= value.length;
                                state = 1;
                            }
                            return {
                                done: false,
                                value
                            };
                        }
                    case 1:
                        state = 3;
                        return {
                            done: false,
                            value: this.#readSource(length).then((value)=>{
                                if (value.length === length) state = 2;
                                else {
                                    length -= value.length;
                                    state = 1;
                                }
                                return value;
                            })
                        };
                    case 2:
                        return {
                            done: true,
                            value: void 0
                        };
                    case 3:
                        throw new Error("Can't call `next` before previous Promise resolves");
                    default:
                        throw new Error("unreachable");
                }
            }
        };
    }
    readExactly = bipedal(function*(then, length) {
        let result;
        let index = 0;
        const initial = this.#readBuffered(length);
        if (initial) {
            if (initial.length === length) return initial;
            result = new Uint8Array(length);
            result.set(initial, index);
            index += initial.length;
            length -= initial.length;
        } else result = new Uint8Array(length);
        while(length > 0){
            const value = yield* then(this.#readSource(length));
            result.set(value, index);
            index += value.length;
            length -= value.length;
        }
        return result;
    });
    release() {
        if (this.#bufferedLength > 0) return new PushReadableStream(async (controller)=>{
            const buffered = this.#buffered.subarray(this.#bufferedOffset);
            await controller.enqueue(buffered);
            controller.abortSignal.addEventListener("abort", ()=>{
                tryCancel(this.reader);
            });
            while(true){
                const { done, value } = await this.reader.read();
                if (done) return;
                await controller.enqueue(value);
            }
        });
        this.reader.releaseLock();
        return this.stream;
    }
    async cancel(reason) {
        await this.reader.cancel(reason);
    }
}
class BufferedTransformStream {
    #readable;
    get readable() {
        return this.#readable;
    }
    #writable;
    get writable() {
        return this.#writable;
    }
    constructor(transform){
        let bufferedStreamController;
        let writableStreamController;
        const buffered = new BufferedReadableStream(new PushReadableStream((controller)=>{
            bufferedStreamController = controller;
        }));
        this.#readable = new stream_ReadableStream({
            async pull (controller) {
                try {
                    const value = await transform(buffered);
                    controller.enqueue(value);
                } catch (e) {
                    if (e instanceof StructEmptyError) return void controller.close();
                    throw e;
                }
            },
            cancel: (reason)=>writableStreamController.error(reason)
        });
        this.#writable = new WritableStream({
            start (controller) {
                writableStreamController = controller;
            },
            async write (chunk) {
                await bufferedStreamController.enqueue(chunk);
            },
            abort () {
                bufferedStreamController.close();
            },
            close () {
                bufferedStreamController.close();
            }
        });
    }
}
class StructDeserializeStream extends BufferedTransformStream {
    constructor(struct){
        super((stream)=>struct.deserialize(stream));
    }
}
function getUint32LittleEndian(buffer, offset) {
    return (buffer[offset] | buffer[offset + 1] << 8 | buffer[offset + 2] << 16 | buffer[offset + 3] << 24) >>> 0;
}
function getUint32(buffer, offset, littleEndian) {
    return littleEndian ? (buffer[offset] | buffer[offset + 1] << 8 | buffer[offset + 2] << 16 | buffer[offset + 3] << 24) >>> 0 : (buffer[offset] << 24 | buffer[offset + 1] << 16 | buffer[offset + 2] << 8 | buffer[offset + 3]) >>> 0;
}
function setUint32(buffer, offset, value, littleEndian) {
    if (littleEndian) {
        buffer[offset] = value;
        buffer[offset + 1] = value >> 8;
        buffer[offset + 2] = value >> 16;
        buffer[offset + 3] = value >> 24;
    } else {
        buffer[offset] = value >> 24;
        buffer[offset + 1] = value >> 16;
        buffer[offset + 2] = value >> 8;
        buffer[offset + 3] = value;
    }
}
function number(size, serialize, deserialize) {
    const fn = ()=>fn;
    Object.assign(fn, factory_field(size, "byob", serialize, deserialize));
    return fn;
}
const u8 = number(1, (value, { buffer, index })=>{
    buffer[index] = value;
}, function*(then, reader) {
    const data = yield* then(reader.readExactly(1));
    return data[0];
});
const u32 = number(4, (value, { buffer, index, littleEndian })=>{
    setUint32(buffer, index, value, littleEndian);
}, function*(then, reader, { littleEndian }) {
    const data = yield* then(reader.readExactly(4));
    return getUint32(data, 0, littleEndian);
});
const u64 = number(8, (value, { buffer, index, littleEndian })=>{
    setUint64(buffer, index, value, littleEndian);
}, function*(then, reader, { littleEndian }) {
    const data = yield* then(reader.readExactly(8));
    return getUint64(data, 0, littleEndian);
});
const AdbShellProtocolId = {
    Stdin: 0,
    Stdout: 1,
    Stderr: 2,
    Exit: 3,
    CloseStdin: 4,
    WindowSizeChange: 5
};
const AdbShellProtocolPacket = struct_struct({
    id: u8(),
    data: buffer_buffer(u32)
}, {
    littleEndian: true
});
class AdbShellProtocolProcessImpl {
    #socket;
    #writer;
    #stdin;
    get stdin() {
        return this.#stdin;
    }
    #stdout;
    get stdout() {
        return this.#stdout;
    }
    #stderr;
    get stderr() {
        return this.#stderr;
    }
    #exited;
    get exited() {
        return this.#exited;
    }
    constructor(socket, signal){
        this.#socket = socket;
        let stdoutController;
        let stderrController;
        this.#stdout = new PushReadableStream((controller)=>{
            stdoutController = controller;
        });
        this.#stderr = new PushReadableStream((controller)=>{
            stderrController = controller;
        });
        const exited = new PromiseResolver();
        this.#exited = exited.promise;
        socket.readable.pipeThrough(new StructDeserializeStream(AdbShellProtocolPacket)).pipeTo(new WritableStream({
            write: async (chunk)=>{
                switch(chunk.id){
                    case AdbShellProtocolId.Exit:
                        exited.resolve(chunk.data[0]);
                        break;
                    case AdbShellProtocolId.Stdout:
                        await stdoutController.enqueue(chunk.data);
                        break;
                    case AdbShellProtocolId.Stderr:
                        await stderrController.enqueue(chunk.data);
                        break;
                    default:
                        break;
                }
            }
        })).then(()=>{
            stdoutController.close();
            stderrController.close();
            exited.reject(new Error("Socket ended without exit message"));
        }, (e)=>{
            stdoutController.error(e);
            stderrController.error(e);
            exited.reject(e);
        });
        if (signal) signal.addEventListener("abort", ()=>{
            exited.reject(signal.reason);
            this.#socket.close();
        });
        this.#writer = this.#socket.writable.getWriter();
        this.#stdin = new MaybeConsumableWritableStream({
            write: async (chunk)=>{
                await this.#writer.write(AdbShellProtocolPacket.serialize({
                    id: AdbShellProtocolId.Stdin,
                    data: chunk
                }));
            },
            close: ()=>this.#writer.write(AdbShellProtocolPacket.serialize({
                    id: AdbShellProtocolId.CloseStdin,
                    data: EmptyUint8Array
                }))
        });
    }
    kill() {
        return this.#socket.close();
    }
}
const { TextEncoder: utils_TextEncoder, TextDecoder: utils_TextDecoder } = globalThis;
const SharedEncoder = /* #__PURE__ */ new utils_TextEncoder();
const SharedDecoder = /* #__PURE__ */ new utils_TextDecoder();
function encodeUtf8(input) {
    return SharedEncoder.encode(input);
}
function decodeUtf8(buffer) {
    return SharedDecoder.decode(buffer);
}
class AdbShellProtocolPtyProcess {
    #socket;
    #writer;
    #input;
    get input() {
        return this.#input;
    }
    #stdout;
    get output() {
        return this.#stdout;
    }
    #exited = new PromiseResolver();
    get exited() {
        return this.#exited.promise;
    }
    constructor(socket){
        this.#socket = socket;
        let stdoutController;
        this.#stdout = new PushReadableStream((controller)=>{
            stdoutController = controller;
        });
        socket.readable.pipeThrough(new StructDeserializeStream(AdbShellProtocolPacket)).pipeTo(new WritableStream({
            write: async (chunk)=>{
                switch(chunk.id){
                    case AdbShellProtocolId.Exit:
                        this.#exited.resolve(chunk.data[0]);
                        break;
                    case AdbShellProtocolId.Stdout:
                        await stdoutController.enqueue(chunk.data);
                        break;
                }
            }
        })).then(()=>{
            stdoutController.close();
            this.#exited.reject(new Error("Socket ended without exit message"));
        }, (e)=>{
            stdoutController.error(e);
            this.#exited.reject(e);
        });
        this.#writer = this.#socket.writable.getWriter();
        this.#input = new MaybeConsumableWritableStream({
            write: (chunk)=>this.#writeStdin(chunk)
        });
    }
    #writeStdin(chunk) {
        return this.#writer.write(AdbShellProtocolPacket.serialize({
            id: AdbShellProtocolId.Stdin,
            data: chunk
        }));
    }
    async resize(rows, cols) {
        await this.#writer.write(AdbShellProtocolPacket.serialize({
            id: AdbShellProtocolId.WindowSizeChange,
            data: encodeUtf8(`${rows}x${cols},0x0\0`)
        }));
    }
    sigint() {
        return this.#writeStdin(new Uint8Array([
            0x03
        ]));
    }
    kill() {
        return this.#socket.close();
    }
}
class AdbShellProtocolSpawner {
    #spawn;
    constructor(spawn){
        this.#spawn = spawn;
    }
    spawn(command, signal) {
        signal?.throwIfAborted();
        if ("string" == typeof command) command = splitCommand(command);
        return this.#spawn(command, signal);
    }
    async spawnWait(command) {
        const process1 = await this.spawn(command);
        const [stdout, stderr, exitCode] = await Promise.all([
            process1.stdout.pipeThrough(new ConcatBufferStream()),
            process1.stderr.pipeThrough(new ConcatBufferStream()),
            process1.exited
        ]);
        return {
            stdout,
            stderr,
            exitCode
        };
    }
    async spawnWaitText(command) {
        const process1 = await this.spawn(command);
        const [stdout, stderr, exitCode] = await Promise.all([
            process1.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream()),
            process1.stderr.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream()),
            process1.exited
        ]);
        return {
            stdout,
            stderr,
            exitCode
        };
    }
}
class AdbShellProtocolSubprocessService extends AdbShellProtocolSpawner {
    #adb;
    get adb() {
        return this.#adb;
    }
    get isSupported() {
        return this.#adb.canUseFeature(AdbFeature.ShellV2);
    }
    constructor(adb){
        super(async (command, signal)=>{
            const socket = await this.#adb.createSocket(`shell,v2,raw:${command.join(" ")}`);
            if (signal?.aborted) {
                await socket.close();
                throw signal.reason;
            }
            return new AdbShellProtocolProcessImpl(socket, signal);
        });
        this.#adb = adb;
    }
    async pty(options) {
        let service = "shell,v2,pty";
        if (options?.terminalType) service += ",TERM=" + options.terminalType;
        service += ":";
        if (options) {
            if ("string" == typeof options.command) service += options.command;
            else if (Array.isArray(options.command)) service += options.command.join(" ");
        }
        return new AdbShellProtocolPtyProcess(await this.#adb.createSocket(service));
    }
}
class AdbSubprocessService {
    #adb;
    get adb() {
        return this.#adb;
    }
    #noneProtocol;
    get noneProtocol() {
        return this.#noneProtocol;
    }
    #shellProtocol;
    get shellProtocol() {
        return this.#shellProtocol;
    }
    constructor(adb){
        this.#adb = adb;
        this.#noneProtocol = new AdbNoneProtocolSubprocessService(adb);
        if (adb.canUseFeature(AdbFeature.ShellV2)) this.#shellProtocol = new AdbShellProtocolSubprocessService(adb);
    }
}
class AutoDisposable {
    #disposables = [];
    constructor(){
        this.dispose = this.dispose.bind(this);
    }
    addDisposable(disposable) {
        this.#disposables.push(disposable);
        return disposable;
    }
    dispose() {
        for (const disposable of this.#disposables)disposable.dispose();
        this.#disposables = [];
    }
}
class AdbServiceBase extends AutoDisposable {
    #adb;
    get adb() {
        return this.#adb;
    }
    constructor(adb){
        super();
        this.#adb = adb;
    }
}
class AdbPower extends AdbServiceBase {
    reboot(mode = "") {
        return this.adb.createSocketAndWait(`reboot:${mode}`);
    }
    bootloader() {
        return this.reboot("bootloader");
    }
    fastboot() {
        return this.reboot("fastboot");
    }
    recovery() {
        return this.reboot("recovery");
    }
    sideload() {
        return this.reboot("sideload");
    }
    qualcommEdlMode() {
        return this.reboot("edl");
    }
    powerOff() {
        return this.adb.subprocess.noneProtocol.spawnWaitText([
            "reboot",
            "-p"
        ]);
    }
    powerButton(longPress = false) {
        const args = [
            "input",
            "keyevent"
        ];
        if (longPress) args.push("--longpress");
        args.push("POWER");
        return this.adb.subprocess.noneProtocol.spawnWaitText(args);
    }
    samsungOdin() {
        return this.reboot("download");
    }
}
const string = (lengthOrField)=>{
    const field = buffer_buffer(lengthOrField, {
        convert: decodeUtf8,
        back: encodeUtf8
    });
    field.as = ()=>field;
    return field;
};
function extend(base, fields, options) {
    return struct_struct(Object.assign({}, base.fields, fields), {
        littleEndian: options?.littleEndian ?? base.littleEndian,
        extra: base.extra,
        postDeserialize: options?.postDeserialize
    });
}
function sequenceEqual(a, b) {
    if (a.length !== b.length) return false;
    for(let i = 0; i < a.length; i += 1)if (a[i] !== b[i]) return false;
    return true;
}
function hexCharToNumber(char) {
    if (char < 48) throw new TypeError(`Invalid hex char ${char}`);
    if (char < 58) return char - 48;
    if (char < 65) throw new TypeError(`Invalid hex char ${char}`);
    if (char < 71) return char - 55;
    if (char < 97) throw new TypeError(`Invalid hex char ${char}`);
    if (char < 103) return char - 87;
    throw new TypeError(`Invalid hex char ${char}`);
}
function hexToNumber(data) {
    let result = 0;
    for(let i = 0; i < data.length; i += 1)result = result << 4 | hexCharToNumber(data[i]);
    return result;
}
function write4HexDigits(buffer, index, value) {
    const start = index;
    index += 3;
    while(index >= start && value > 0){
        const digit = 0xf & value;
        value >>= 4;
        if (digit < 10) buffer[index] = digit + 48;
        else buffer[index] = digit + 87;
        index -= 1;
    }
    while(index >= start){
        buffer[index] = 48;
        index -= 1;
    }
}
const AdbReverseStringResponse = struct_struct({
    length: string(4),
    content: string({
        field: "length",
        convert (value) {
            return Number.parseInt(value, 16);
        },
        back (value) {
            return value.toString(16).padStart(4, "0");
        }
    })
}, {
    littleEndian: true
});
class AdbReverseError extends Error {
    constructor(message){
        super(message);
    }
}
class AdbReverseNotSupportedError extends AdbReverseError {
    constructor(){
        super("ADB reverse tunnel is not supported on this device when connected wirelessly.");
    }
}
const AdbReverseErrorResponse = extend(AdbReverseStringResponse, {}, {
    postDeserialize (value) {
        if ("more than one device/emulator" === value.content) throw new AdbReverseNotSupportedError();
        throw new AdbReverseError(value.content);
    }
});
function decimalToNumber(buffer) {
    let value = 0;
    for (const byte of buffer){
        if (byte < 48 || byte > 57) break;
        value = 10 * value + byte - 48;
    }
    return value;
}
const OKAY = encodeUtf8("OKAY");
class AdbReverseService extends AdbServiceBase {
    #deviceAddressToLocalAddress = new Map();
    async createBufferedStream(service) {
        const socket = await this.adb.createSocket(service);
        return new BufferedReadableStream(socket.readable);
    }
    async sendRequest(service) {
        const stream = await this.createBufferedStream(service);
        const response = await stream.readExactly(4);
        if (!sequenceEqual(response, OKAY)) await AdbReverseErrorResponse.deserialize(stream);
        return stream;
    }
    async list() {
        const stream = await this.createBufferedStream("reverse:list-forward");
        const response = await AdbReverseStringResponse.deserialize(stream);
        return response.content.split("\n").filter((line)=>!!line).map((line)=>{
            const [deviceSerial, localName, remoteName] = line.split(" ");
            return {
                deviceSerial,
                localName,
                remoteName
            };
        });
    }
    async addExternal(deviceAddress, localAddress) {
        const stream = await this.sendRequest(`reverse:forward:${deviceAddress};${localAddress}`);
        if (deviceAddress.startsWith("tcp:")) {
            const position = stream.position;
            try {
                const length = hexToNumber(await stream.readExactly(4));
                const port = decimalToNumber(await stream.readExactly(length));
                deviceAddress = `tcp:${port}`;
            } catch (e) {
                if (e instanceof ExactReadableEndedError && stream.position === position) ;
                else throw e;
            }
        }
        return deviceAddress;
    }
    async add(deviceAddress, handler, localAddress) {
        localAddress = await this.adb.transport.addReverseTunnel(handler, localAddress);
        try {
            deviceAddress = await this.addExternal(deviceAddress, localAddress);
            this.#deviceAddressToLocalAddress.set(deviceAddress, localAddress);
            return deviceAddress;
        } catch (e) {
            await this.adb.transport.removeReverseTunnel(localAddress);
            throw e;
        }
    }
    async remove(deviceAddress) {
        const localAddress = this.#deviceAddressToLocalAddress.get(deviceAddress);
        if (localAddress) await this.adb.transport.removeReverseTunnel(localAddress);
        await this.sendRequest(`reverse:killforward:${deviceAddress}`);
    }
    async removeAll() {
        await this.adb.transport.clearReverseTunnels();
        this.#deviceAddressToLocalAddress.clear();
        await this.sendRequest("reverse:killforward-all");
    }
}
function parsePort(value) {
    if (!value || "0" === value) return;
    return Number.parseInt(value, 10);
}
class AdbTcpIpService extends AdbServiceBase {
    async getListenAddresses() {
        const serviceListenAddresses = await this.adb.getProp("service.adb.listen_addrs");
        const servicePort = await this.adb.getProp("service.adb.tcp.port");
        const persistPort = await this.adb.getProp("persist.adb.tcp.port");
        return {
            serviceListenAddresses: "" != serviceListenAddresses ? serviceListenAddresses.split(",") : [],
            servicePort: parsePort(servicePort),
            persistPort: parsePort(persistPort)
        };
    }
    async setPort(port) {
        if (port <= 0) throw new TypeError(`Invalid port ${port}`);
        const output = await this.adb.createSocketAndWait(`tcpip:${port}`);
        if (output !== `restarting in TCP mode port: ${port}\n`) throw new Error(output);
        return output;
    }
    async disable() {
        const output = await this.adb.createSocketAndWait("usb:");
        if ("restarting in USB mode\n" !== output) throw new Error(output);
        return output;
    }
}
const NOOP = ()=>{};
function unreachable(...args) {
    throw new Error("Unreachable. Arguments:\n" + args.join("\n"));
}
function encodeAsciiUnchecked(value) {
    const result = new Uint8Array(value.length);
    for(let i = 0; i < value.length; i += 1)result[i] = value.charCodeAt(i);
    return result;
}
function adbSyncEncodeId(value) {
    const buffer = encodeAsciiUnchecked(value);
    return getUint32LittleEndian(buffer, 0);
}
const AdbSyncResponseId = {
    Entry: adbSyncEncodeId("DENT"),
    Entry2: adbSyncEncodeId("DNT2"),
    Lstat: adbSyncEncodeId("STAT"),
    Stat: adbSyncEncodeId("STA2"),
    Lstat2: adbSyncEncodeId("LST2"),
    Done: adbSyncEncodeId("DONE"),
    Data: adbSyncEncodeId("DATA"),
    Ok: adbSyncEncodeId("OKAY"),
    Fail: adbSyncEncodeId("FAIL")
};
class AdbSyncError extends Error {
}
const AdbSyncFailResponse = struct_struct({
    message: string(u32)
}, {
    littleEndian: true,
    postDeserialize (value) {
        throw new AdbSyncError(value.message);
    }
});
async function adbSyncReadResponse(stream, id, type) {
    if ("string" == typeof id) id = adbSyncEncodeId(id);
    const buffer = await stream.readExactly(4);
    switch(getUint32LittleEndian(buffer, 0)){
        case AdbSyncResponseId.Fail:
            await AdbSyncFailResponse.deserialize(stream);
            throw new Error("Unreachable");
        case id:
            return await type.deserialize(stream);
        default:
            throw new Error(`Expected '${id}', but got '${decodeUtf8(buffer)}'`);
    }
}
async function* adbSyncReadResponses(stream, id, type) {
    if ("string" == typeof id) id = adbSyncEncodeId(id);
    while(true){
        const buffer = await stream.readExactly(4);
        switch(getUint32LittleEndian(buffer, 0)){
            case AdbSyncResponseId.Fail:
                await AdbSyncFailResponse.deserialize(stream);
                unreachable();
            case AdbSyncResponseId.Done:
                await stream.readExactly(type.size);
                return;
            case id:
                yield await type.deserialize(stream);
                break;
            default:
                throw new Error(`Expected '${id}' or '${AdbSyncResponseId.Done}', but got '${decodeUtf8(buffer)}'`);
        }
    }
}
const AdbSyncRequestId = {
    List: adbSyncEncodeId("LIST"),
    ListV2: adbSyncEncodeId("LIS2"),
    Send: adbSyncEncodeId("SEND"),
    SendV2: adbSyncEncodeId("SND2"),
    Lstat: adbSyncEncodeId("STAT"),
    Stat: adbSyncEncodeId("STA2"),
    LstatV2: adbSyncEncodeId("LST2"),
    Data: adbSyncEncodeId("DATA"),
    Done: adbSyncEncodeId("DONE"),
    Receive: adbSyncEncodeId("RECV")
};
const AdbSyncNumberRequest = struct_struct({
    id: u32,
    arg: u32
}, {
    littleEndian: true
});
async function adbSyncWriteRequest(writable, id, value) {
    if ("string" == typeof id) id = adbSyncEncodeId(id);
    if ("number" == typeof value) return void await writable.write(AdbSyncNumberRequest.serialize({
        id,
        arg: value
    }));
    if ("string" == typeof value) value = encodeUtf8(value);
    await writable.write(AdbSyncNumberRequest.serialize({
        id,
        arg: value.length
    }));
    await writable.write(value);
}
const LinuxFileType = {
    Directory: 4,
    File: 8,
    Link: 10
};
const AdbSyncLstatResponse = struct_struct({
    mode: u32,
    size: u32,
    mtime: u32
}, {
    littleEndian: true,
    extra: {
        get type () {
            return this.mode >> 12;
        },
        get permission () {
            return 4095 & this.mode;
        }
    },
    postDeserialize (value) {
        if (0 === value.mode && 0 === value.size && 0 === value.mtime) throw new Error("lstat error");
        return value;
    }
});
const AdbSyncStatErrorCode = {
    SUCCESS: 0,
    EACCES: 13,
    EEXIST: 17,
    EFAULT: 14,
    EFBIG: 27,
    EINTR: 4,
    EINVAL: 22,
    EIO: 5,
    EISDIR: 21,
    ELOOP: 40,
    EMFILE: 24,
    ENAMETOOLONG: 36,
    ENFILE: 23,
    ENOENT: 2,
    ENOMEM: 12,
    ENOSPC: 28,
    ENOTDIR: 20,
    EOVERFLOW: 75,
    EPERM: 1,
    EROFS: 30,
    ETXTBSY: 26
};
const AdbSyncStatErrorName = /* #__PURE__ */ (()=>Object.fromEntries(Object.entries(AdbSyncStatErrorCode).map(([key, value])=>[
            value,
            key
        ])))();
const AdbSyncStatResponse = struct_struct({
    error: u32(),
    dev: u64,
    ino: u64,
    mode: u32,
    nlink: u32,
    uid: u32,
    gid: u32,
    size: u64,
    atime: u64,
    mtime: u64,
    ctime: u64
}, {
    littleEndian: true,
    extra: {
        get type () {
            return this.mode >> 12;
        },
        get permission () {
            return 4095 & this.mode;
        }
    },
    postDeserialize (value) {
        if (value.error) throw new Error(AdbSyncStatErrorName[value.error]);
        return value;
    }
});
async function adbSyncLstat(socket, path, v2) {
    const locked = await socket.lock();
    try {
        if (v2) {
            await adbSyncWriteRequest(locked, AdbSyncRequestId.LstatV2, path);
            return await adbSyncReadResponse(locked, AdbSyncResponseId.Lstat2, AdbSyncStatResponse);
        }
        {
            await adbSyncWriteRequest(locked, AdbSyncRequestId.Lstat, path);
            const response = await adbSyncReadResponse(locked, AdbSyncResponseId.Lstat, AdbSyncLstatResponse);
            return {
                mode: response.mode,
                size: BigInt(response.size),
                mtime: BigInt(response.mtime),
                get type () {
                    return response.type;
                },
                get permission () {
                    return response.permission;
                }
            };
        }
    } finally{
        locked.release();
    }
}
async function adbSyncStat(socket, path) {
    const locked = await socket.lock();
    try {
        await adbSyncWriteRequest(locked, AdbSyncRequestId.Stat, path);
        return await adbSyncReadResponse(locked, AdbSyncResponseId.Stat, AdbSyncStatResponse);
    } finally{
        locked.release();
    }
}
const AdbSyncEntryResponse = extend(AdbSyncLstatResponse, {
    name: string(u32)
});
const AdbSyncEntry2Response = extend(AdbSyncStatResponse, {
    name: string(u32)
});
async function* adbSyncOpenDirV2(socket, path) {
    const locked = await socket.lock();
    try {
        await adbSyncWriteRequest(locked, AdbSyncRequestId.ListV2, path);
        for await (const item of adbSyncReadResponses(locked, AdbSyncResponseId.Entry2, AdbSyncEntry2Response))if (item.error === AdbSyncStatErrorCode.SUCCESS) yield item;
    } finally{
        locked.release();
    }
}
async function* adbSyncOpenDirV1(socket, path) {
    const locked = await socket.lock();
    try {
        await adbSyncWriteRequest(locked, AdbSyncRequestId.List, path);
        for await (const item of adbSyncReadResponses(locked, AdbSyncResponseId.Entry, AdbSyncEntryResponse))yield item;
    } finally{
        locked.release();
    }
}
async function* adbSyncOpenDir(socket, path, v2) {
    if (v2) yield* adbSyncOpenDirV2(socket, path);
    else for await (const item of adbSyncOpenDirV1(socket, path))yield {
        mode: item.mode,
        size: BigInt(item.size),
        mtime: BigInt(item.mtime),
        get type () {
            return item.type;
        },
        get permission () {
            return item.permission;
        },
        name: item.name
    };
}
const AdbSyncDataResponse = struct_struct({
    data: buffer_buffer(u32)
}, {
    littleEndian: true
});
async function* adbSyncPullGenerator(socket, path) {
    const locked = await socket.lock();
    let done = false;
    try {
        await adbSyncWriteRequest(locked, AdbSyncRequestId.Receive, path);
        for await (const packet of adbSyncReadResponses(locked, AdbSyncResponseId.Data, AdbSyncDataResponse))yield packet.data;
        done = true;
    } catch (e) {
        done = true;
        throw e;
    } finally{
        if (!done) for await (const packet of adbSyncReadResponses(locked, AdbSyncResponseId.Data, AdbSyncDataResponse));
        locked.release();
    }
}
function adbSyncPull(socket, path) {
    return stream_ReadableStream.from(adbSyncPullGenerator(socket, path));
}
class BufferCombiner {
    #capacity;
    #buffer;
    #offset;
    #available;
    constructor(size){
        this.#capacity = size;
        this.#buffer = new Uint8Array(size);
        this.#offset = 0;
        this.#available = size;
    }
    *push(data) {
        let offset = 0;
        let available = data.length;
        if (0 !== this.#offset) if (available >= this.#available) {
            this.#buffer.set(data.subarray(0, this.#available), this.#offset);
            offset += this.#available;
            available -= this.#available;
            yield this.#buffer;
            this.#offset = 0;
            this.#available = this.#capacity;
            if (0 === available) return;
        } else {
            this.#buffer.set(data, this.#offset);
            this.#offset += available;
            this.#available -= available;
            return;
        }
        while(available >= this.#capacity){
            const end = offset + this.#capacity;
            yield data.subarray(offset, end);
            offset = end;
            available -= this.#capacity;
        }
        if (available > 0) {
            this.#buffer.set(data.subarray(offset), this.#offset);
            this.#offset += available;
            this.#available -= available;
        }
    }
    flush() {
        if (0 === this.#offset) return;
        const output = this.#buffer.subarray(0, this.#offset);
        this.#offset = 0;
        this.#available = this.#capacity;
        return output;
    }
}
class DistributionStream extends TransformStream {
    constructor(size, combine = false){
        const combiner = combine ? new BufferCombiner(size) : void 0;
        super({
            async transform (chunk, controller) {
                await tryConsume(chunk, async (chunk)=>{
                    if (combiner) for (const buffer of combiner.push(chunk))await consumable_Consumable.ReadableStream.enqueue(controller, buffer);
                    else {
                        let offset = 0;
                        let available = chunk.length;
                        while(available > 0){
                            const end = offset + size;
                            await consumable_Consumable.ReadableStream.enqueue(controller, chunk.subarray(offset, end));
                            offset = end;
                            available -= size;
                        }
                    }
                });
            },
            flush (controller) {
                if (combiner) {
                    const data = combiner.flush();
                    if (data) controller.enqueue(data);
                }
            }
        });
    }
}
const ADB_SYNC_MAX_PACKET_SIZE = 65536;
const AdbSyncOkResponse = struct_struct({
    unused: u32
}, {
    littleEndian: true
});
async function pipeFileData(locked, file, packetSize, mtime) {
    const abortController = new stream_AbortController();
    file.pipeThrough(new DistributionStream(packetSize, true)).pipeTo(new MaybeConsumableWritableStream({
        write (chunk) {
            return adbSyncWriteRequest(locked, AdbSyncRequestId.Data, chunk);
        }
    }), {
        signal: abortController.signal
    }).then(async ()=>{
        await adbSyncWriteRequest(locked, AdbSyncRequestId.Done, mtime);
        await locked.flush();
    }, NOOP);
    await adbSyncReadResponse(locked, AdbSyncResponseId.Ok, AdbSyncOkResponse).catch((e)=>{
        abortController.abort();
        throw e;
    });
}
async function adbSyncPushV1({ socket, filename, file, type = LinuxFileType.File, permission = 438, mtime = Date.now() / 1000 | 0, packetSize = ADB_SYNC_MAX_PACKET_SIZE }) {
    const locked = await socket.lock();
    try {
        const mode = type << 12 | permission;
        const pathAndMode = `${filename},${mode.toString()}`;
        await adbSyncWriteRequest(locked, AdbSyncRequestId.Send, pathAndMode);
        await pipeFileData(locked, file, packetSize, mtime);
    } finally{
        locked.release();
    }
}
const AdbSyncSendV2Flags = {
    None: 0,
    Brotli: 1,
    Lz4: 2,
    Zstd: 4,
    DryRun: 0x80000000
};
const AdbSyncSendV2Request = struct_struct({
    id: u32,
    mode: u32,
    flags: u32()
}, {
    littleEndian: true
});
async function adbSyncPushV2({ socket, filename, file, type = LinuxFileType.File, permission = 438, mtime = Date.now() / 1000 | 0, packetSize = ADB_SYNC_MAX_PACKET_SIZE, dryRun = false }) {
    const locked = await socket.lock();
    try {
        await adbSyncWriteRequest(locked, AdbSyncRequestId.SendV2, filename);
        const mode = type << 12 | permission;
        let flags = AdbSyncSendV2Flags.None;
        if (dryRun) flags |= AdbSyncSendV2Flags.DryRun;
        await locked.write(AdbSyncSendV2Request.serialize({
            id: AdbSyncRequestId.SendV2,
            mode,
            flags
        }));
        await pipeFileData(locked, file, packetSize, mtime);
    } finally{
        locked.release();
    }
}
function adbSyncPush(options) {
    if (options.v2) return adbSyncPushV2(options);
    if (options.dryRun) throw new Error("dryRun is not supported in v1");
    return adbSyncPushV1(options);
}
class AutoResetEvent {
    #set;
    #queue = [];
    constructor(initialSet = false){
        this.#set = initialSet;
    }
    wait() {
        if (!this.#set) {
            this.#set = true;
            if (0 === this.#queue.length) return Promise.resolve();
        }
        const resolver = new PromiseResolver();
        this.#queue.push(resolver);
        return resolver.promise;
    }
    notifyOne() {
        if (0 !== this.#queue.length) this.#queue.pop().resolve();
        else this.#set = false;
    }
    dispose() {
        for (const item of this.#queue)item.reject(new Error("The AutoResetEvent has been disposed"));
        this.#queue.length = 0;
    }
}
class AdbSyncSocketLocked {
    #writer;
    #readable;
    #socketLock;
    #writeLock = new AutoResetEvent();
    #combiner;
    get position() {
        return this.#readable.position;
    }
    constructor(writer, readable, bufferSize, lock){
        this.#writer = writer;
        this.#readable = readable;
        this.#socketLock = lock;
        this.#combiner = new BufferCombiner(bufferSize);
    }
    #write(buffer) {
        return consumable_Consumable.WritableStream.write(this.#writer, buffer);
    }
    async flush() {
        try {
            await this.#writeLock.wait();
            const buffer = this.#combiner.flush();
            if (buffer) await this.#write(buffer);
        } finally{
            this.#writeLock.notifyOne();
        }
    }
    async write(data) {
        try {
            await this.#writeLock.wait();
            for (const buffer of this.#combiner.push(data))await this.#write(buffer);
        } finally{
            this.#writeLock.notifyOne();
        }
    }
    async readExactly(length) {
        await this.flush();
        return await this.#readable.readExactly(length);
    }
    release() {
        this.#combiner.flush();
        this.#socketLock.notifyOne();
    }
    async close() {
        await this.#readable.cancel();
    }
}
class AdbSyncSocket {
    #lock = new AutoResetEvent();
    #socket;
    #locked;
    constructor(socket, bufferSize){
        this.#socket = socket;
        this.#locked = new AdbSyncSocketLocked(socket.writable.getWriter(), new BufferedReadableStream(socket.readable), bufferSize, this.#lock);
    }
    async lock() {
        await this.#lock.wait();
        return this.#locked;
    }
    async close() {
        await this.#locked.close();
        await this.#socket.close();
    }
}
function dirname(path) {
    const end = path.lastIndexOf("/");
    if (-1 === end) throw new Error("Invalid path");
    if (0 === end) return "/";
    return path.substring(0, end);
}
class AdbSync {
    _adb;
    _socket;
    #supportsStat;
    #supportsListV2;
    #fixedPushMkdir;
    #supportsSendReceiveV2;
    #needPushMkdirWorkaround;
    get supportsStat() {
        return this.#supportsStat;
    }
    get supportsListV2() {
        return this.#supportsListV2;
    }
    get fixedPushMkdir() {
        return this.#fixedPushMkdir;
    }
    get supportsSendReceiveV2() {
        return this.#supportsSendReceiveV2;
    }
    get needPushMkdirWorkaround() {
        return this.#needPushMkdirWorkaround;
    }
    constructor(adb, socket){
        this._adb = adb;
        this._socket = new AdbSyncSocket(socket, adb.maxPayloadSize);
        this.#supportsStat = adb.canUseFeature(AdbFeature.StatV2);
        this.#supportsListV2 = adb.canUseFeature(AdbFeature.ListV2);
        this.#fixedPushMkdir = adb.canUseFeature(AdbFeature.FixedPushMkdir);
        this.#supportsSendReceiveV2 = adb.canUseFeature(AdbFeature.SendReceiveV2);
        this.#needPushMkdirWorkaround = this._adb.canUseFeature(AdbFeature.ShellV2) && !this.fixedPushMkdir;
    }
    async lstat(path) {
        return await adbSyncLstat(this._socket, path, this.#supportsStat);
    }
    async stat(path) {
        if (!this.#supportsStat) throw new Error("Not supported");
        return await adbSyncStat(this._socket, path);
    }
    async isDirectory(path) {
        try {
            await this.lstat(path + "/");
            return true;
        } catch  {
            return false;
        }
    }
    opendir(path) {
        return adbSyncOpenDir(this._socket, path, this.supportsListV2);
    }
    async readdir(path) {
        const results = [];
        for await (const entry of this.opendir(path))results.push(entry);
        return results;
    }
    read(filename) {
        return adbSyncPull(this._socket, filename);
    }
    async write(options) {
        if (this.needPushMkdirWorkaround) await this._adb.subprocess.noneProtocol.spawnWait([
            "mkdir",
            "-p",
            escapeArg(dirname(options.filename))
        ]);
        await adbSyncPush({
            v2: this.supportsSendReceiveV2,
            socket: this._socket,
            ...options
        });
    }
    lockSocket() {
        return this._socket.lock();
    }
    dispose() {
        return this._socket.close();
    }
}
const Version = struct_struct({
    version: u32
}, {
    littleEndian: true
});
const AdbFrameBufferV1 = struct_struct({
    bpp: u32,
    size: u32,
    width: u32,
    height: u32,
    red_offset: u32,
    red_length: u32,
    blue_offset: u32,
    blue_length: u32,
    green_offset: u32,
    green_length: u32,
    alpha_offset: u32,
    alpha_length: u32,
    data: buffer_buffer("size")
}, {
    littleEndian: true
});
const AdbFrameBufferV2 = struct_struct({
    bpp: u32,
    colorSpace: u32,
    size: u32,
    width: u32,
    height: u32,
    red_offset: u32,
    red_length: u32,
    blue_offset: u32,
    blue_length: u32,
    green_offset: u32,
    green_length: u32,
    alpha_offset: u32,
    alpha_length: u32,
    data: buffer_buffer("size")
}, {
    littleEndian: true
});
class AdbFrameBufferError extends Error {
    constructor(message, options){
        super(message, options);
    }
}
class AdbFrameBufferUnsupportedVersionError extends AdbFrameBufferError {
    constructor(version){
        super(`Unsupported FrameBuffer version ${version}`);
    }
}
class AdbFrameBufferForbiddenError extends AdbFrameBufferError {
    constructor(){
        super("FrameBuffer is disabled by current app");
    }
}
async function framebuffer(adb) {
    const socket = await adb.createSocket("framebuffer:");
    const stream = new BufferedReadableStream(socket.readable);
    let version;
    try {
        ({ version } = await Version.deserialize(stream));
    } catch (e) {
        if (e instanceof StructEmptyError) throw new AdbFrameBufferForbiddenError();
        throw e;
    }
    switch(version){
        case 1:
            return await AdbFrameBufferV1.deserialize(stream);
        case 2:
            return await AdbFrameBufferV2.deserialize(stream);
        default:
            throw new AdbFrameBufferUnsupportedVersionError(version);
    }
}
class Adb {
    #transport;
    get transport() {
        return this.#transport;
    }
    get serial() {
        return this.#transport.serial;
    }
    get maxPayloadSize() {
        return this.#transport.maxPayloadSize;
    }
    get banner() {
        return this.#transport.banner;
    }
    get disconnected() {
        return this.#transport.disconnected;
    }
    get clientFeatures() {
        return this.#transport.clientFeatures;
    }
    get deviceFeatures() {
        return this.banner.features;
    }
    subprocess;
    power;
    reverse;
    tcpip;
    constructor(transport){
        this.#transport = transport;
        this.subprocess = new AdbSubprocessService(this);
        this.power = new AdbPower(this);
        this.reverse = new AdbReverseService(this);
        this.tcpip = new AdbTcpIpService(this);
    }
    canUseFeature(feature) {
        return this.clientFeatures.includes(feature) && this.deviceFeatures.includes(feature);
    }
    async createSocket(service) {
        return this.#transport.connect(service);
    }
    async createSocketAndWait(service) {
        const socket = await this.createSocket(service);
        return await socket.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream());
    }
    getProp(key) {
        return this.subprocess.noneProtocol.spawnWaitText([
            "getprop",
            key
        ]).then((output)=>output.trim());
    }
    rm(filenames, options) {
        const args = [
            "rm"
        ];
        if (options?.recursive) args.push("-r");
        if (options?.force) args.push("-f");
        if (Array.isArray(filenames)) for (const filename of filenames)args.push(escapeArg(filename));
        else args.push(escapeArg(filenames));
        args.push("</dev/null");
        return this.subprocess.noneProtocol.spawnWaitText(args);
    }
    async sync() {
        const socket = await this.createSocket("sync:");
        return new AdbSync(this, socket);
    }
    async framebuffer() {
        return framebuffer(this);
    }
    async close() {
        await this.#transport.close();
    }
}
const AdbBannerKey = {
    Product: "ro.product.name",
    Model: "ro.product.model",
    Device: "ro.product.device",
    Features: "features"
};
class AdbBanner {
    static parse(banner) {
        let state;
        let product;
        let model;
        let device;
        let features = [];
        const pieces = banner.split("::");
        if (pieces.length > 1) {
            state = pieces[0].trim() || void 0;
            const props = pieces[1];
            for (const prop of props.split(";")){
                if (!prop) continue;
                const keyValue = prop.split("=");
                if (2 !== keyValue.length) continue;
                const [key, value] = keyValue;
                switch(key){
                    case AdbBannerKey.Product:
                        product = value;
                        break;
                    case AdbBannerKey.Model:
                        model = value;
                        break;
                    case AdbBannerKey.Device:
                        device = value;
                        break;
                    case AdbBannerKey.Features:
                        features = value.split(",");
                        break;
                }
            }
        }
        return new AdbBanner(state, product, model, device, features);
    }
    #state;
    get state() {
        return this.#state;
    }
    #product;
    get product() {
        return this.#product;
    }
    #model;
    get model() {
        return this.#model;
    }
    #device;
    get device() {
        return this.#device;
    }
    #features = [];
    get features() {
        return this.#features;
    }
    constructor(state, product, model, device, features){
        this.#state = state;
        this.#product = product;
        this.#model = model;
        this.#device = device;
        this.#features = features;
    }
}
const stream_OKAY = encodeUtf8("OKAY");
const FAIL = encodeUtf8("FAIL");
class AdbServerStream {
    #connection;
    #buffered;
    #writer;
    constructor(connection){
        this.#connection = connection;
        this.#buffered = new BufferedReadableStream(connection.readable);
        this.#writer = connection.writable.getWriter();
    }
    readExactly(length) {
        return this.#buffered.readExactly(length);
    }
    readString = bipedal(function*(then) {
        const data = yield* then(this.readExactly(4));
        const length = hexToNumber(data);
        if (0 === length) return "";
        {
            const decoder = new utils_TextDecoder();
            let result = "";
            const iterator = this.#buffered.iterateExactly(length);
            while(true){
                const { done, value } = iterator.next();
                if (done) break;
                result += decoder.decode((yield* then(value)), {
                    stream: true
                });
            }
            result += decoder.decode();
            return result;
        }
    });
    async readOkay() {
        const response = await this.readExactly(4);
        if (sequenceEqual(response, stream_OKAY)) return;
        if (sequenceEqual(response, FAIL)) {
            const reason = await this.readString();
            throw new Error(reason);
        }
        throw new Error(`Unexpected response: ${decodeUtf8(response)}`);
    }
    async writeString(value) {
        const encoded = encodeUtf8(value);
        const buffer = new Uint8Array(4 + encoded.length);
        write4HexDigits(buffer, 0, encoded.length);
        buffer.set(encoded, 4);
        await this.#writer.write(buffer);
    }
    release() {
        this.#writer.releaseLock();
        return {
            readable: this.#buffered.release(),
            writable: this.#connection.writable,
            closed: this.#connection.closed,
            close: ()=>this.#connection.close()
        };
    }
    async dispose() {
        tryCancel(this.#buffered);
        tryClose(this.#writer);
        await this.#connection.close();
    }
}
class NetworkError extends Error {
    constructor(message){
        super(message);
        this.name = "NetworkError";
    }
}
class UnauthorizedError extends Error {
    constructor(message){
        super(message);
        this.name = "UnauthorizedError";
    }
}
class AlreadyConnectedError extends Error {
    constructor(message){
        super(message);
        this.name = "AlreadyConnectedError";
    }
}
class WirelessCommands {
    #client;
    constructor(client){
        this.#client = client;
    }
    async pair(address, password) {
        const connection = await this.#client.createConnection(`host:pair:${password}:${address}`);
        try {
            const response = await connection.readExactly(4);
            if (sequenceEqual(response, FAIL)) throw new Error(await connection.readString());
            const length = hexToNumber(response);
            await connection.readExactly(length);
        } finally{
            await connection.dispose();
        }
    }
    async connect(address) {
        const connection = await this.#client.createConnection(`host:connect:${address}`);
        try {
            const response = await connection.readString();
            switch(response){
                case `already connected to ${address}`:
                    throw new AlreadyConnectedError(response);
                case `failed to connect to ${address}`:
                case `failed to authenticate to ${address}`:
                    throw new UnauthorizedError(response);
                case `connected to ${address}`:
                    return;
                default:
                    throw new NetworkError(response);
            }
        } finally{
            await connection.dispose();
        }
    }
    async disconnect(address) {
        const connection = await this.#client.createConnection(`host:disconnect:${address}`);
        try {
            await connection.readString();
        } finally{
            await connection.dispose();
        }
    }
}
class MDnsCommands {
    #client;
    constructor(client){
        this.#client = client;
    }
    async check() {
        const connection = await this.#client.createConnection("host:mdns:check");
        try {
            const response = await connection.readString();
            return !response.startsWith("ERROR:");
        } finally{
            await connection.dispose();
        }
    }
    async getServices() {
        const connection = await this.#client.createConnection("host:mdns:services");
        try {
            const response = await connection.readString();
            return response.split("\n").filter(Boolean).map((line)=>{
                const parts = line.split("\t");
                return {
                    name: parts[0],
                    service: parts[1],
                    address: parts[2]
                };
            });
        } finally{
            await connection.dispose();
        }
    }
}
class EventEmitter {
    listeners = [];
    constructor(){
        this.event = this.event.bind(this);
    }
    addEventListener(info) {
        this.listeners.push(info);
        const remove = ()=>{
            const index = this.listeners.indexOf(info);
            if (-1 !== index) this.listeners.splice(index, 1);
        };
        remove.dispose = remove;
        return remove;
    }
    event = (listener, thisArg, ...args)=>{
        const info = {
            listener: listener,
            thisArg,
            args
        };
        return this.addEventListener(info);
    };
    fire(e) {
        for (const info of this.listeners.slice())info.listener.call(info.thisArg, e, ...info.args);
    }
    dispose() {
        this.listeners.length = 0;
    }
}
const Undefined = Symbol("undefined");
class StickyEventEmitter extends EventEmitter {
    #value = Undefined;
    addEventListener(info) {
        if (this.#value !== Undefined) info.listener.call(info.thisArg, this.#value, ...info.args);
        return super.addEventListener(info);
    }
    fire(e) {
        this.#value = e;
        super.fire(e);
    }
}
const { setInterval: ref_setInterval, clearInterval: ref_clearInterval } = globalThis;
class Ref {
    #intervalId;
    constructor(options){
        if (!options?.unref) this.ref();
    }
    ref() {
        this.#intervalId = ref_setInterval(()=>{}, 60000);
    }
    unref() {
        if (this.#intervalId) {
            ref_clearInterval(this.#intervalId);
            this.#intervalId = void 0;
        }
    }
}
function unorderedRemove(array, index) {
    if (index < 0 || index >= array.length) return;
    array[index] = array[array.length - 1];
    array.length -= 1;
}
function filterDeviceStates(devices, states) {
    return devices.filter((device)=>states.includes(device.state));
}
class AdbServerDeviceObserverOwner {
    current = [];
    #client;
    #stream;
    #observers = [];
    constructor(client){
        this.#client = client;
    }
    async #receive(stream) {
        const response = await stream.readString();
        const next = AdbServerClient.parseDeviceList(response);
        const removed = this.current.slice();
        const added = [];
        for (const nextDevice of next){
            const index = removed.findIndex((device)=>device.transportId === nextDevice.transportId);
            if (-1 === index) {
                added.push(nextDevice);
                continue;
            }
            unorderedRemove(removed, index);
        }
        this.current = next;
        if (added.length) for (const observer of this.#observers){
            const filtered = filterDeviceStates(added, observer.includeStates);
            if (filtered.length) observer.onDeviceAdd.fire(filtered);
        }
        if (removed.length) for (const observer of this.#observers){
            const filtered = filterDeviceStates(removed, observer.includeStates);
            if (filtered.length) observer.onDeviceRemove.fire(removed);
        }
        for (const observer of this.#observers){
            const filtered = filterDeviceStates(this.current, observer.includeStates);
            observer.onListChange.fire(filtered);
        }
    }
    async #receiveLoop(stream) {
        try {
            while(true)await this.#receive(stream);
        } catch (e) {
            this.#stream = void 0;
            for (const observer of this.#observers)observer.onError.fire(e);
        }
    }
    async #connect() {
        const stream = await this.#client.createConnection("host:track-devices-l", {
            unref: true
        });
        await this.#receive(stream);
        this.#receiveLoop(stream);
        return stream;
    }
    async #handleObserverStop(stream) {
        if (0 === this.#observers.length) {
            this.#stream = void 0;
            await stream.dispose();
        }
    }
    async createObserver(options) {
        options?.signal?.throwIfAborted();
        let current = [];
        const onDeviceAdd = new EventEmitter();
        const onDeviceRemove = new EventEmitter();
        const onListChange = new StickyEventEmitter();
        const onError = new StickyEventEmitter();
        const includeStates = options?.includeStates ?? [
            "device",
            "unauthorized"
        ];
        const observer = {
            includeStates,
            onDeviceAdd,
            onDeviceRemove,
            onListChange,
            onError
        };
        this.#observers.push(observer);
        onListChange.event((value)=>current = value);
        let stream;
        if (this.#stream) {
            stream = await this.#stream;
            onListChange.fire(filterDeviceStates(this.current, includeStates));
        } else {
            this.#stream = this.#connect();
            try {
                stream = await this.#stream;
            } catch (e) {
                this.#stream = void 0;
                throw e;
            }
        }
        const ref = new Ref(options);
        const stop = async ()=>{
            unorderedRemove(this.#observers, this.#observers.indexOf(observer));
            await this.#handleObserverStop(stream);
            ref.unref();
        };
        if (options?.signal) {
            if (options.signal.aborted) {
                await stop();
                throw options.signal.reason;
            }
            options.signal.addEventListener("abort", ()=>void stop());
        }
        return {
            onDeviceAdd: onDeviceAdd.event,
            onDeviceRemove: onDeviceRemove.event,
            onListChange: onListChange.event,
            onError: onError.event,
            get current () {
                return current;
            },
            stop
        };
    }
}
const ADB_SERVER_DEFAULT_FEATURES = /* #__PURE__ */ (()=>[
        AdbFeature.ShellV2,
        AdbFeature.Cmd,
        AdbFeature.StatV2,
        AdbFeature.ListV2,
        AdbFeature.FixedPushMkdir,
        "apex",
        AdbFeature.Abb,
        "fixed_push_symlink_timestamp",
        AdbFeature.AbbExec,
        "remount_shell",
        "track_app",
        AdbFeature.SendReceiveV2,
        "sendrecv_v2_brotli",
        "sendrecv_v2_lz4",
        "sendrecv_v2_zstd",
        "sendrecv_v2_dry_run_send"
    ])();
class AdbServerTransport {
    #client;
    serial;
    transportId;
    maxPayloadSize = 1048576;
    banner;
    #sockets = [];
    #closed = new PromiseResolver();
    #disconnected;
    get disconnected() {
        return this.#disconnected;
    }
    get clientFeatures() {
        return ADB_SERVER_DEFAULT_FEATURES;
    }
    constructor(client, serial, banner, transportId, disconnected){
        this.#client = client;
        this.serial = serial;
        this.banner = banner;
        this.transportId = transportId;
        this.#disconnected = Promise.race([
            this.#closed.promise,
            disconnected
        ]);
    }
    async connect(service) {
        const socket = await this.#client.createDeviceConnection({
            transportId: this.transportId
        }, service);
        this.#sockets.push(socket);
        return socket;
    }
    async addReverseTunnel(handler, address) {
        return await this.#client.connector.addReverseTunnel(handler, address);
    }
    async removeReverseTunnel(address) {
        await this.#client.connector.removeReverseTunnel(address);
    }
    async clearReverseTunnels() {
        await this.#client.connector.clearReverseTunnels();
    }
    async close() {
        for (const socket of this.#sockets)await socket.close();
        this.#sockets.length = 0;
        this.#closed.resolve();
    }
}
class AdbServerClient {
    static NetworkError = NetworkError;
    static UnauthorizedError = UnauthorizedError;
    static AlreadyConnectedError = AlreadyConnectedError;
    static parseDeviceList(value, includeStates = [
        "device",
        "unauthorized"
    ]) {
        const devices = [];
        for (const line of value.split("\n")){
            if (!line) continue;
            const parts = line.split(" ").filter(Boolean);
            const serial = parts[0];
            const state = parts[1];
            if (!includeStates.includes(state)) continue;
            let product;
            let model;
            let device;
            let transportId;
            for(let i = 2; i < parts.length; i += 1){
                const [key, value] = parts[i].split(":");
                switch(key){
                    case "product":
                        product = value;
                        break;
                    case "model":
                        model = value;
                        break;
                    case "device":
                        device = value;
                        break;
                    case "transport_id":
                        transportId = BigInt(value);
                        break;
                }
            }
            if (!transportId) throw new Error(`No transport id for device ${serial}`);
            devices.push({
                serial,
                state,
                authenticating: "unauthorized" === state,
                product,
                model,
                device,
                transportId
            });
        }
        return devices;
    }
    static formatDeviceService(device, command) {
        if (!device) return `host:${command}`;
        if ("transportId" in device) return `host-transport-id:${device.transportId}:${command}`;
        if ("serial" in device) return `host-serial:${device.serial}:${command}`;
        if ("usb" in device) return `host-usb:${command}`;
        if ("tcp" in device) return `host-local:${command}`;
        throw new TypeError("Invalid device selector");
    }
    connector;
    wireless = new WirelessCommands(this);
    mDns = new MDnsCommands(this);
    #observerOwner = new AdbServerDeviceObserverOwner(this);
    constructor(connector){
        this.connector = connector;
    }
    async createConnection(request, options) {
        const connection = await this.connector.connect(options);
        const stream = new AdbServerStream(connection);
        try {
            await stream.writeString(request);
        } catch (e) {
            await stream.dispose();
            throw e;
        }
        try {
            await raceSignal(()=>stream.readOkay(), options?.signal);
            return stream;
        } catch (e) {
            await stream.dispose();
            throw e;
        }
    }
    async getVersion() {
        const connection = await this.createConnection("host:version");
        try {
            const length = hexToNumber(await connection.readExactly(4));
            const version = hexToNumber(await connection.readExactly(length));
            return version;
        } finally{
            await connection.dispose();
        }
    }
    async validateVersion(minimalVersion) {
        const version = await this.getVersion();
        if (version < minimalVersion) throw new Error(`adb server version (${version}) doesn't match this client (${minimalVersion})`);
    }
    async killServer() {
        const connection = await this.createConnection("host:kill");
        await connection.dispose();
    }
    async getServerFeatures() {
        const connection = await this.createConnection("host:host-features");
        try {
            const response = await connection.readString();
            return response.split(",");
        } finally{
            await connection.dispose();
        }
    }
    async getDevices(includeStates = [
        "device",
        "unauthorized"
    ]) {
        const connection = await this.createConnection("host:devices-l");
        try {
            const response = await connection.readString();
            return AdbServerClient.parseDeviceList(response, includeStates);
        } finally{
            await connection.dispose();
        }
    }
    async trackDevices(options) {
        return this.#observerOwner.createObserver(options);
    }
    async reconnectDevice(device) {
        const connection = await this.createConnection("offline" === device ? "host:reconnect-offline" : AdbServerClient.formatDeviceService(device, "reconnect"));
        try {
            await connection.readString();
        } finally{
            await connection.dispose();
        }
    }
    async getDeviceFeatures(device) {
        const connection = await this.createDeviceConnection(device, "host:features");
        const stream = new AdbServerStream(connection);
        try {
            const featuresString = await stream.readString();
            const features = featuresString.split(",");
            return {
                transportId: connection.transportId,
                features
            };
        } finally{
            await stream.dispose();
        }
    }
    async createDeviceConnection(device, service) {
        let switchService;
        let transportId;
        if (device) if ("transportId" in device) {
            switchService = `host:transport-id:${device.transportId}`;
            transportId = device.transportId;
        } else if ("serial" in device) {
            await this.validateVersion(41);
            switchService = `host:tport:serial:${device.serial}`;
        } else if ("usb" in device) {
            await this.validateVersion(41);
            switchService = "host:tport:usb";
        } else if ("tcp" in device) {
            await this.validateVersion(41);
            switchService = "host:tport:local";
        } else throw new TypeError("Invalid device selector");
        else {
            await this.validateVersion(41);
            switchService = "host:tport:any";
        }
        const connection = await this.createConnection(switchService);
        try {
            await connection.writeString(service);
        } catch (e) {
            await connection.dispose();
            throw e;
        }
        try {
            if (void 0 === transportId) {
                const array = await connection.readExactly(8);
                transportId = getUint64LittleEndian(array, 0);
            }
            await connection.readOkay();
            const socket = connection.release();
            return {
                transportId,
                service,
                readable: socket.readable,
                writable: socket.writable,
                get closed () {
                    return socket.closed;
                },
                async close () {
                    await socket.close();
                }
            };
        } catch (e) {
            await connection.dispose();
            throw e;
        }
    }
    async #waitForUnchecked(device, state, options) {
        let type;
        if (device) if ("transportId" in device) type = "any";
        else if ("serial" in device) type = "any";
        else if ("usb" in device) type = "usb";
        else if ("tcp" in device) type = "local";
        else throw new TypeError("Invalid device selector");
        else type = "any";
        const service = AdbServerClient.formatDeviceService(device, `wait-for-${type}-${state}`);
        const connection = await this.createConnection(service, options);
        try {
            await connection.readOkay();
        } finally{
            await connection.dispose();
        }
    }
    async waitFor(device, state, options) {
        if ("disconnect" === state) await this.validateVersion(41);
        return this.#waitForUnchecked(device, state, options);
    }
    async waitForDisconnect(transportId, options) {
        const serverVersion = await this.getVersion();
        if (serverVersion >= 41) return this.#waitForUnchecked({
            transportId
        }, "disconnect", options);
        {
            const observer = await this.trackDevices(options);
            return new Promise((resolve, reject)=>{
                observer.onDeviceRemove((devices)=>{
                    if (devices.some((device)=>device.transportId === transportId)) {
                        observer.stop();
                        resolve();
                    }
                });
                observer.onError((e)=>{
                    observer.stop();
                    reject(e);
                });
            });
        }
    }
    async createTransport(device) {
        const { transportId, features } = await this.getDeviceFeatures(device);
        const devices = await this.getDevices();
        const info = devices.find((device)=>device.transportId === transportId);
        const banner = new AdbBanner(info?.state, info?.product, info?.model, info?.device, features);
        const waitAbortController = new stream_AbortController();
        const disconnected = this.waitForDisconnect(transportId, {
            unref: true,
            signal: waitAbortController.signal
        });
        const transport = new AdbServerTransport(this, info?.serial ?? "", banner, transportId, disconnected);
        transport.disconnected.finally(()=>waitAbortController.abort());
        return transport;
    }
    async createAdb(device) {
        const transport = await this.createTransport(device);
        return new Adb(transport);
    }
}
async function raceSignal(callback, ...signals) {
    const abortPromise = new PromiseResolver();
    function abort() {
        abortPromise.reject(this.reason);
    }
    try {
        for (const signal of signals)if (signal) {
            if (signal.aborted) throw signal.reason;
            signal.addEventListener("abort", abort);
        }
        return await Promise.race([
            callback(),
            abortPromise.promise
        ]);
    } finally{
        for (const signal of signals)if (signal) signal.removeEventListener("abort", abort);
    }
}
function nodeSocketToConnection(socket) {
    socket.setNoDelay(true);
    const closed = new Promise((resolve)=>{
        socket.on("close", resolve);
    });
    return {
        readable: new PushReadableStream((controller)=>{
            socket.on("data", async (data)=>{
                if (controller.abortSignal.aborted) return;
                socket.pause();
                await controller.enqueue(data);
                socket.resume();
            });
            socket.on("end", ()=>{
                tryClose(controller);
            });
        }),
        writable: new MaybeConsumableWritableStream({
            write: (chunk)=>new Promise((resolve, reject)=>{
                    socket.write(chunk, (err)=>{
                        if (err) reject(err);
                        else resolve();
                    });
                })
        }),
        get closed () {
            return closed;
        },
        close () {
            socket.end();
        }
    };
}
class AdbServerNodeTcpConnector {
    spec;
    #listeners = new Map();
    constructor(spec){
        this.spec = spec;
    }
    async connect({ unref, signal } = {
        unref: false
    }) {
        const socket = new Socket({
            signal: signal
        });
        if (unref) socket.unref();
        socket.connect(this.spec);
        await new Promise((resolve, reject)=>{
            socket.once("connect", resolve);
            socket.once("error", reject);
        });
        return nodeSocketToConnection(socket);
    }
    async addReverseTunnel(handler, address) {
        const server = new Server(async (socket)=>{
            const connection = nodeSocketToConnection(socket);
            try {
                await handler({
                    service: address,
                    readable: connection.readable,
                    writable: connection.writable,
                    get closed () {
                        return connection.closed;
                    },
                    async close () {
                        await connection.close();
                    }
                });
            } catch  {
                socket.end();
            }
        });
        if (address) {
            const url = new URL(address);
            if ("tcp:" === url.protocol) server.listen(Number.parseInt(url.port, 10), url.hostname);
            else if ("unix:" === url.protocol) server.listen(url.pathname);
            else throw new TypeError(`Unsupported protocol ${url.protocol}`);
        } else server.listen();
        await new Promise((resolve, reject)=>{
            server.on("listening", ()=>resolve());
            server.on("error", (e)=>reject(e));
        });
        if (!address) {
            const info = server.address();
            address = `tcp:${info.port}`;
        }
        this.#listeners.set(address, server);
        return address;
    }
    removeReverseTunnel(address) {
        const server = this.#listeners.get(address);
        if (!server) return;
        server.close();
        this.#listeners.delete(address);
    }
    clearReverseTunnels() {
        for (const server of this.#listeners.values())server.close();
        this.#listeners.clear();
    }
}
function coerce(value) {
    if (value instanceof Error) return value.stack || value.message;
    return value;
}
function selectColor(colors, namespace) {
    let hash = 0;
    for(let i = 0; i < namespace.length; i++){
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
}
function matchesTemplate(search, template) {
    let searchIndex = 0;
    let templateIndex = 0;
    let starIndex = -1;
    let matchIndex = 0;
    while(searchIndex < search.length)if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || "*" === template[templateIndex])) if ("*" === template[templateIndex]) {
        starIndex = templateIndex;
        matchIndex = searchIndex;
        templateIndex++;
    } else {
        searchIndex++;
        templateIndex++;
    }
    else {
        if (-1 === starIndex) return false;
        templateIndex = starIndex + 1;
        matchIndex++;
        searchIndex = matchIndex;
    }
    while(templateIndex < template.length && "*" === template[templateIndex])templateIndex++;
    return templateIndex === template.length;
}
function humanize(value) {
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}s`;
    return `${value}ms`;
}
let globalNamespaces = "";
function createDebug(namespace, options) {
    let prevTime;
    let enableOverride;
    let namespacesCache;
    let enabledCache;
    const debug = (...args)=>{
        if (!debug.enabled) return;
        const curr = Date.now();
        const diff = curr - (prevTime || curr);
        prevTime = curr;
        args[0] = coerce(args[0]);
        if ("string" != typeof args[0]) args.unshift("%O");
        let index = 0;
        args[0] = args[0].replace(/%([a-z%])/gi, (match, format)=>{
            if ("%%" === match) return "%";
            index++;
            const formatter = options.formatters[format];
            if ("function" == typeof formatter) {
                const value = args[index];
                match = formatter.call(debug, value);
                args.splice(index, 1);
                index--;
            }
            return match;
        });
        options.formatArgs.call(debug, diff, args);
        debug.log(...args);
    };
    debug.extend = function(namespace, delimiter = ":") {
        return createDebug(this.namespace + delimiter + namespace, {
            useColors: this.useColors,
            color: this.color,
            formatArgs: this.formatArgs,
            formatters: this.formatters,
            inspectOpts: this.inspectOpts,
            log: this.log,
            humanize: this.humanize
        });
    };
    Object.assign(debug, options);
    debug.namespace = namespace;
    Object.defineProperty(debug, "enabled", {
        enumerable: true,
        configurable: false,
        get: ()=>{
            if (null != enableOverride) return enableOverride;
            if (namespacesCache !== globalNamespaces) {
                namespacesCache = globalNamespaces;
                enabledCache = enabled(namespace);
            }
            return enabledCache;
        },
        set: (v)=>{
            enableOverride = v;
        }
    });
    return debug;
}
let names = [];
let skips = [];
function enable(namespaces) {
    globalNamespaces = namespaces;
    names = [];
    skips = [];
    const split = globalNamespaces.trim().replace(/\s+/g, ",").split(",").filter(Boolean);
    for (const ns of split)if ("-" === ns[0]) skips.push(ns.slice(1));
    else names.push(ns);
}
function enabled(name) {
    for (const skip of skips)if (matchesTemplate(name, skip)) return false;
    for (const ns of names)if (matchesTemplate(name, ns)) return true;
    return false;
}
const node_colors = process.stderr.getColorDepth && process.stderr.getColorDepth() > 2 ? [
    20,
    21,
    26,
    27,
    32,
    33,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    56,
    57,
    62,
    63,
    68,
    69,
    74,
    75,
    76,
    77,
    78,
    79,
    80,
    81,
    92,
    93,
    98,
    99,
    112,
    113,
    128,
    129,
    134,
    135,
    148,
    149,
    160,
    161,
    162,
    163,
    164,
    165,
    166,
    167,
    168,
    169,
    170,
    171,
    172,
    173,
    178,
    179,
    184,
    185,
    196,
    197,
    198,
    199,
    200,
    201,
    202,
    203,
    204,
    205,
    206,
    207,
    208,
    209,
    214,
    215,
    220,
    221
] : [
    6,
    2,
    3,
    4,
    5,
    1
];
const inspectOpts = Object.keys(process.env).filter((key)=>/^debug_/i.test(key)).reduce((obj, key)=>{
    const prop = key.slice(6).toLowerCase().replace(/_([a-z])/g, (_, k)=>k.toUpperCase());
    let value = process.env[key];
    const lowerCase = "string" == typeof value && value.toLowerCase();
    value = "null" === value ? null : "yes" === lowerCase || "on" === lowerCase || "true" === lowerCase || "enabled" === lowerCase ? true : "no" === lowerCase || "off" === lowerCase || "false" === lowerCase || "disabled" === lowerCase ? false : Number(value);
    obj[prop] = value;
    return obj;
}, Object.create(null));
function node_useColors() {
    return "colors" in inspectOpts ? Boolean(inspectOpts.colors) : isatty(process.stderr.fd);
}
function getDate() {
    if (inspectOpts.hideDate) return "";
    return `${/* @__PURE__ */ new Date().toISOString()} `;
}
function formatArgs(diff, args) {
    const { namespace: name, useColors } = this;
    if (useColors) {
        const c = this.color;
        const colorCode = `\u001B[3${c < 8 ? c : `8;5;${c}`}`;
        const prefix = `  ${colorCode};1m${name} \u001B[0m`;
        args[0] = prefix + args[0].split("\n").join(`\n${prefix}`);
        args.push(`${colorCode}m+${this.humanize(diff)}\u001B[0m`);
    } else args[0] = `${getDate()}${name} ${args[0]}`;
}
function log(...args) {
    process.stderr.write(`${formatWithOptions(this.inspectOpts, ...args)}\n`);
}
const defaultOptions = {
    useColors: node_useColors(),
    formatArgs: formatArgs,
    formatters: {
        o (v) {
            this.inspectOpts.colors = this.useColors;
            return inspect(v, this.inspectOpts).split("\n").map((str)=>str.trim()).join(" ");
        },
        O (v) {
            this.inspectOpts.colors = this.useColors;
            return inspect(v, this.inspectOpts);
        }
    },
    inspectOpts: inspectOpts,
    log: log,
    humanize: humanize
};
function node_createDebug(namespace, options) {
    var _ref;
    const color = null != (_ref = options && options.color) ? _ref : selectColor(node_colors, namespace);
    return createDebug(namespace, Object.assign(defaultOptions, {
        color
    }, options));
}
enable(process.env.DEBUG || "");
const takeover_debug = node_createDebug('devtool-mcp-server:takeover');
const DEBUG_ROUTER_DIR = node_path.join(node_os.homedir(), '.DebugRouterConnector');
const DEBUG_ROUTER_LOCK_DIR = node_path.join(DEBUG_ROUTER_DIR, 'lockfile');
const DEBUG_ROUTER_LATEST_FILE = node_path.join(DEBUG_ROUTER_DIR, 'LatestDriverProcess');
async function takeoverDebugRouterLock() {
    try {
        await promises.mkdir(DEBUG_ROUTER_DIR, {
            recursive: true
        });
        await promises.rm(DEBUG_ROUTER_LOCK_DIR, {
            recursive: true,
            force: true
        });
        await promises.mkdir(DEBUG_ROUTER_LOCK_DIR, {
            recursive: true
        });
        await promises.writeFile(DEBUG_ROUTER_LATEST_FILE, `${process.pid}`, 'utf-8');
        takeover_debug(`wrote PID=${process.pid}`);
    } catch (err) {
        takeover_debug('skipped due to filesystem error %O', err);
    } finally{
        try {
            await promises.rm(DEBUG_ROUTER_LOCK_DIR, {
                recursive: true,
                force: true
            });
        } catch (_cleanupError) {
            takeover_debug('failed to remove lock directory %O', _cleanupError);
        }
    }
}
class PeertalkToMessageTransformStream extends web_TransformStream {
    constructor(){
        let buffer = new Uint8Array(0);
        const decoder = new TextDecoder();
        super({
            transform: (chunk, c)=>{
                const n = new Uint8Array(buffer.length + chunk.length);
                n.set(buffer);
                n.set(chunk, buffer.length);
                buffer = n;
                while(buffer.length >= 20){
                    const v = new DataView(buffer.buffer, buffer.byteOffset);
                    const len = v.getUint32(16);
                    if (buffer.length < 20 + len) break;
                    try {
                        c.enqueue(JSON.parse(decoder.decode(buffer.subarray(20, 20 + len))));
                    } catch (e) {
                        c.error(e);
                    }
                    buffer = buffer.subarray(20 + len);
                }
            }
        });
    }
}
class MessageToPeertalkTransformStream extends web_TransformStream {
    constructor(){
        const encoder = new TextEncoder();
        super({
            transform (chunk, controller) {
                const body = encoder.encode(JSON.stringify(chunk));
                const len = body.length;
                const data = new Uint8Array(20 + len);
                const view = new DataView(data.buffer);
                view.setUint32(0, 1);
                view.setUint32(4, 101);
                view.setUint32(8, 0);
                view.setUint32(12, len + 4);
                view.setUint32(16, len);
                data.set(body, 20);
                controller.enqueue(data);
            }
        });
    }
}
const peertalkCodecFactory = {
    createEncodeTransformStream () {
        return new MessageToPeertalkTransformStream();
    },
    createDecodeTransformStream () {
        return new PeertalkToMessageTransformStream();
    }
};
async function createMessageConnection(connectRaw, codecFactory, options) {
    const conn = await connectRaw(options);
    const encoder = codecFactory.createEncodeTransformStream();
    const pipeAbortController = new AbortController();
    encoder.readable.pipeTo(conn.writable, {
        preventClose: true,
        signal: pipeAbortController.signal
    }).catch((err)=>{
        if (err?.name !== 'AbortError') conn[Symbol.asyncDispose]();
    });
    const readable = conn.readable.pipeThrough(codecFactory.createDecodeTransformStream());
    return {
        readable,
        writable: encoder.writable,
        async [Symbol.asyncDispose] () {
            pipeAbortController.abort();
            await conn[Symbol.asyncDispose]();
        }
    };
}
async function connectWithPeertalk(connectRaw, options) {
    await takeoverDebugRouterLock();
    return createMessageConnection(connectRaw, peertalkCodecFactory, options);
}
function _ts_add_disposable_resource(env, value, async) {
    if (null != value) {
        if ("object" != typeof value && "function" != typeof value) throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (void 0 === dispose) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if ("function" != typeof dispose) throw new TypeError("Object not disposable.");
        if (inner) dispose = function() {
            try {
                inner.call(this);
            } catch (e) {
                return Promise.reject(e);
            }
        };
        env.stack.push({
            value: value,
            dispose: dispose,
            async: async
        });
    } else if (async) env.stack.push({
        async: true
    });
    return value;
}
function android_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (android_ts_dispose_resources = function(env) {
        function fail(e) {
            env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while(r = env.stack.pop())try {
                if (!r.async && 1 === s) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                if (r.dispose) {
                    var result = r.dispose.call(r.value);
                    if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
                        fail(e);
                        return next();
                    });
                } else s |= 1;
            } catch (e) {
                fail(e);
            }
            if (1 === s) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    })(env);
}
const android_debug = node_createDebug('devtool-mcp-server:connector:android');
const KNOWNS_APPS = [
    {
        packageName: 'com.lynx.uiapp',
        name: 'Lynx Example'
    },
    {
        packageName: 'com.lynx.explorer',
        name: 'Lynx Explorer'
    }
];
class AndroidTransport {
    client;
    constructor(spec = {
        port: 5037
    }){
        this.client = new AdbServerClient(new AdbServerNodeTcpConnector(spec));
    }
    async connect(options) {
        return connectWithPeertalk((opts)=>this.#connectRaw(opts), options);
    }
    async #createAdb(deviceId) {
        const adb = await this.client.createAdb({
            serial: deviceId
        });
        return Object.assign(adb, {
            async [Symbol.asyncDispose] () {
                await adb.close();
            }
        });
    }
    async close() {
        android_debug('Android transport closed');
    }
    async #connectRaw({ deviceId, port, signal }) {
        const adb = await this.client.createAdb({
            serial: deviceId
        });
        android_debug(`connect: create connection to deviceId: ${deviceId}, port: ${port}`);
        signal?.throwIfAborted();
        const service = `tcp:${port}`;
        let socket;
        try {
            socket = await adb.createSocket(service);
        } catch (err) {
            await adb.close();
            android_debug(`connect: create socket to ${service} failed with err: %o`, err);
            throw err;
        }
        if (signal?.aborted) {
            await socket.close();
            await adb.close();
            signal.throwIfAborted();
        }
        const abortHandler = ()=>{
            Promise.resolve(socket.close()).catch((err)=>{
                android_debug(`connect: socket ${service} close on abort err: %o`, err);
            });
        };
        signal?.addEventListener('abort', abortHandler, {
            once: true
        });
        Promise.resolve(socket.closed).catch((err)=>{
            android_debug(`connect: socket ${service} closed with err: %o`, err);
        });
        return {
            readable: socket.readable,
            writable: socket.writable,
            async [Symbol.asyncDispose] () {
                signal?.removeEventListener('abort', abortHandler);
                android_debug(`connect: close connection to deviceId: ${deviceId}, port: ${port}`);
                try {
                    await socket.close();
                } finally{
                    await adb.close();
                }
            }
        };
    }
    async listDevices() {
        const devices = await this.client.getDevices();
        android_debug('listDevices: devices %o', devices);
        return devices.map(({ serial })=>({
                os: 'Android',
                id: serial
            }));
    }
    async listAvailableApps(deviceId) {
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const adb = _ts_add_disposable_resource(env, await this.#createAdb(deviceId), true);
            const output = await adb.subprocess.noneProtocol.spawnWaitText([
                'pm',
                'list',
                'packages',
                '-3'
            ]);
            const packages = new Set(output.split('\n').map((line)=>line.replace('package:', '').trim()).filter((i)=>'' !== i));
            android_debug("listAvailableApps all packages: %o", packages);
            return KNOWNS_APPS.filter((app)=>packages.has(app.packageName));
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = android_ts_dispose_resources(env);
            if (result) await result;
        }
    }
    async openApp(deviceId, packageName, { withDataCleared } = {}) {
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const apps = await this.listAvailableApps(deviceId);
            const adb = _ts_add_disposable_resource(env, await this.#createAdb(deviceId), true);
            if (!apps.some((app)=>app.packageName === packageName)) throw new Error(`package ${packageName} not found`);
            if (withDataCleared) {
                const output = await adb.subprocess.noneProtocol.spawnWaitText([
                    'pm',
                    'clear',
                    packageName
                ]);
                android_debug(`openApp clear data output ${output}`);
            }
            const output = await adb.subprocess.noneProtocol.spawnWaitText([
                'monkey',
                '-p',
                packageName,
                '-c',
                'android.intent.category.LAUNCHER',
                '1'
            ]);
            android_debug(`openApp LAUNCHER output ${output}`);
            if (output.includes('No activities found')) throw new Error(`No launchable activity found for package ${packageName}.`);
            if (output.includes('monkey aborted')) throw new Error(`Failed to open app ${packageName}.`);
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = android_ts_dispose_resources(env);
            if (result) await result;
        }
    }
}
function isCustomizedMessage(msg) {
    return 'object' == typeof msg && null !== msg && 'Customized' === msg.event;
}
function isControlRequest(msg) {
    return 'object' == typeof msg && null !== msg && 'Control' === msg.event;
}
function isListClientsRequest(msg) {
    return 'object' == typeof msg && null !== msg && 'ListClients' === msg.event;
}
function isPingEvent(msg) {
    return 'object' == typeof msg && null !== msg && 'Ping' === msg.event;
}
function isRegisterEvent(msg) {
    return 'object' == typeof msg && null !== msg && 'Register' === msg.event;
}
const DAEMON_WS_PATH = '/devtool/connector';
const DAEMON_VERSION_PATH = `${DAEMON_WS_PATH}/version`;
const DAEMON_SHUTDOWN_PATH = `${DAEMON_WS_PATH}/shutdown`;
const DAEMON_INSPECTOR_PATH = `${DAEMON_WS_PATH}/inspector`;
const manager_debug = node_createDebug('devtool-mcp-server:daemon:manager');
const manager_DEBUG_ROUTER_DIR = node_path.join(node_os.homedir(), '.DebugRouterConnector');
const PIDFILE = node_path.join(manager_DEBUG_ROUTER_DIR, 'daemon.pid');
const LOG = node_path.join(manager_DEBUG_ROUTER_DIR, 'daemon.log');
const ERR = node_path.join(manager_DEBUG_ROUTER_DIR, 'daemon.err');
function resolveDaemonEntryPath(moduleUrl = import.meta.url) {
    return createRequire(moduleUrl).resolve('#daemon-entry');
}
class DaemonManager {
    static async ensureRunning(port = 21783) {
        const url = `ws://127.0.0.1:${port}${DAEMON_WS_PATH}`;
        if (await DaemonManager.#isAlive(port)) {
            manager_debug('daemon already running on port %d', port);
            return url;
        }
        manager_debug('daemon not running, spawning...');
        await DaemonManager.#spawn(port);
        await DaemonManager.#waitReady(port, 5000);
        manager_debug('daemon is ready on port %d', port);
        return url;
    }
    static async kill() {
        try {
            const pidStr = await promises.readFile(PIDFILE, 'utf-8');
            const pid = Number.parseInt(pidStr.trim(), 10);
            if (!Number.isNaN(pid)) {
                manager_debug('killing daemon pid %d', pid);
                process.kill(pid, 'SIGTERM');
            }
        } catch  {
            manager_debug('no pidfile found or cannot read it');
        }
    }
    static async #isAlive(port) {
        return new Promise((resolve)=>{
            const socket = node_net.createConnection({
                host: '127.0.0.1',
                port
            }, ()=>{
                socket.destroy();
                resolve(true);
            });
            socket.on('error', ()=>{
                socket.destroy();
                resolve(false);
            });
            socket.setTimeout(1000, ()=>{
                socket.destroy();
                resolve(false);
            });
        });
    }
    static async #spawn(port) {
        await promises.mkdir(manager_DEBUG_ROUTER_DIR, {
            recursive: true
        });
        const entryPath = resolveDaemonEntryPath();
        const out = openSync(LOG, 'w');
        const err = openSync(ERR, 'w');
        const child = external_node_child_process_spawn(process.execPath, [
            entryPath,
            '--port',
            String(port)
        ], {
            detached: true,
            stdio: [
                'ignore',
                out,
                err
            ],
            env: {
                ...process.env,
                DEBUG: process.env['DEBUG'] ?? ''
            }
        });
        closeSync(out);
        closeSync(err);
        child.unref();
        if (void 0 !== child.pid) {
            await promises.writeFile(PIDFILE, String(child.pid), 'utf-8');
            manager_debug('spawned daemon with pid %d', child.pid);
        }
    }
    static async #waitReady(port, timeoutMs) {
        const deadline = Date.now() + timeoutMs;
        while(Date.now() < deadline){
            if (await DaemonManager.#isAlive(port)) return;
            await promises_setTimeout(200);
        }
        throw new Error(`Daemon failed to start within ${timeoutMs}ms on port ${port}`);
    }
}
const desktop_debug = node_createDebug('devtool-mcp-server:connector:desktop');
class DesktopTransport {
    async connect(options) {
        return connectWithPeertalk((opts)=>this.#connectRaw(opts), options);
    }
    async close() {
        desktop_debug('Desktop transport closed');
    }
    async listDevices() {
        return [
            {
                id: 'localhost',
                os: 'Desktop'
            }
        ];
    }
    async listAvailableApps(deviceId) {
        return [];
    }
    async openApp(deviceId, packageName) {
        throw new Error('openApp is not supported on DesktopTransport');
    }
    async #connectRaw({ deviceId, port, signal }) {
        if ('localhost' !== deviceId) throw new Error(`DesktopTransport only supports 'localhost' deviceId, got: ${deviceId}`);
        desktop_debug(`connect: connecting to 127.0.0.1:${port}`);
        const socket = node_net.createConnection({
            host: '127.0.0.1',
            port,
            signal
        });
        try {
            if (socket.connecting) await new Promise((resolve, reject)=>{
                socket.once('connect', resolve);
                socket.once('error', reject);
            });
            desktop_debug(`connect: connected to 127.0.0.1:${port}`);
            const { readable, writable } = Duplex.toWeb(socket);
            return {
                readable,
                writable,
                async [Symbol.asyncDispose] () {
                    desktop_debug(`connect: closing connection to 127.0.0.1:${port}`);
                    socket.destroy();
                }
            };
        } catch (err) {
            desktop_debug(`connect: error connecting to 127.0.0.1:${port} %O`, err);
            socket.destroy();
            throw err;
        }
    }
}
const EPOCH_2001 = 978307200000;
function readSizedInt(view, offset, size) {
    switch(size){
        case 1:
            return view.getUint8(offset);
        case 2:
            return view.getUint16(offset);
        case 4:
            return view.getUint32(offset);
        case 8:
            {
                const hi = view.getUint32(offset);
                const lo = view.getUint32(offset + 4);
                return 0x100000000 * hi + lo;
            }
        default:
            throw new Error(`Unsupported int size: ${size}`);
    }
}
function parseBinary(data) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const len = data.byteLength;
    const header = String.fromCharCode(...data.subarray(0, 8));
    if ('bplist00' !== header) throw new Error('Invalid binary plist: bad magic');
    const trailerOffset = len - 32;
    const offsetTableOffsetSize = view.getUint8(trailerOffset + 6);
    const objectRefSize = view.getUint8(trailerOffset + 7);
    const numObjects = readSizedInt(view, trailerOffset + 8, 8);
    const topObject = readSizedInt(view, trailerOffset + 16, 8);
    const offsetTableOffset = readSizedInt(view, trailerOffset + 24, 8);
    const offsets = [];
    for(let i = 0; i < numObjects; i++)offsets.push(readSizedInt(view, offsetTableOffset + i * offsetTableOffsetSize, offsetTableOffsetSize));
    function parseObject(index) {
        let offset = offsets[index];
        const marker = view.getUint8(offset);
        const type = marker >> 4;
        let size = 0x0f & marker;
        offset++;
        if (0 !== type && 8 !== type && 0x0f === size) {
            const extMarker = view.getUint8(offset);
            offset++;
            const extSize = 1 << (0x0f & extMarker);
            size = readSizedInt(view, offset, extSize);
            offset += extSize;
        }
        switch(type){
            case 0x0:
                if (0x00 === marker) return null;
                if (0x08 === marker) return false;
                if (0x09 === marker) return true;
                throw new Error(`Unknown singleton: 0x${marker.toString(16)}`);
            case 0x1:
                {
                    const byteCount = 1 << size;
                    if (byteCount <= 4) return readSizedInt(view, offset, byteCount);
                    const hi = view.getInt32(offset);
                    const lo = view.getUint32(offset + 4);
                    return 0x100000000 * hi + lo;
                }
            case 0x2:
                {
                    const byteCount = 1 << size;
                    if (4 === byteCount) return view.getFloat32(offset);
                    if (8 === byteCount) return view.getFloat64(offset);
                    throw new Error(`Unsupported real size: ${byteCount}`);
                }
            case 0x3:
                {
                    const timestamp = view.getFloat64(offset);
                    return new Date(1000 * timestamp + EPOCH_2001);
                }
            case 0x4:
                return new Uint8Array(data.buffer, data.byteOffset + offset, size);
            case 0x5:
                {
                    let s = '';
                    for(let i = 0; i < size; i++)s += String.fromCharCode(view.getUint8(offset + i));
                    return s;
                }
            case 0x6:
                {
                    let s = '';
                    for(let i = 0; i < size; i++)s += String.fromCharCode(view.getUint16(offset + 2 * i));
                    return s;
                }
            case 0x8:
                {
                    const byteCount = size + 1;
                    return {
                        UID: readSizedInt(view, offset, byteCount)
                    };
                }
            case 0xa:
                {
                    const arr = [];
                    for(let i = 0; i < size; i++){
                        const ref = readSizedInt(view, offset + i * objectRefSize, objectRefSize);
                        arr.push(parseObject(ref));
                    }
                    return arr;
                }
            case 0xd:
                {
                    const dict = {};
                    for(let i = 0; i < size; i++){
                        const keyRef = readSizedInt(view, offset + i * objectRefSize, objectRefSize);
                        const valRef = readSizedInt(view, offset + (size + i) * objectRefSize, objectRefSize);
                        const key = parseObject(keyRef);
                        dict[key] = parseObject(valRef);
                    }
                    return dict;
                }
            default:
                throw new Error(`Unknown object type: 0x${type.toString(16)}`);
        }
    }
    return parseObject(topObject);
}
class OpenStepParser {
    input;
    pos;
    constructor(input){
        this.input = input;
        this.pos = 0;
    }
    skipWhitespaceAndComments() {
        while(this.pos < this.input.length){
            const ch = this.input[this.pos];
            if (/\s/.test(ch)) {
                this.pos++;
                continue;
            }
            if ('/' === ch && this.pos + 1 < this.input.length && '*' === this.input[this.pos + 1]) {
                this.pos += 2;
                const end = this.input.indexOf('*/', this.pos);
                if (-1 === end) throw new Error('Unterminated block comment');
                this.pos = end + 2;
                continue;
            }
            if ('/' === ch && this.pos + 1 < this.input.length && '/' === this.input[this.pos + 1]) {
                this.pos += 2;
                const end = this.input.indexOf('\n', this.pos);
                this.pos = -1 === end ? this.input.length : end + 1;
                continue;
            }
            break;
        }
    }
    parseValue() {
        this.skipWhitespaceAndComments();
        if (this.pos >= this.input.length) throw new Error('Unexpected end of input');
        const ch = this.input[this.pos];
        if ('{' === ch) return this.parseDict();
        if ('(' === ch) return this.parseArray();
        if ('<' === ch) return this.parseData();
        if ('"' === ch) return this.parseQuotedString();
        return this.parseUnquotedString();
    }
    parseDict() {
        this.pos++;
        const obj = {};
        while(true){
            this.skipWhitespaceAndComments();
            if (this.pos >= this.input.length) throw new Error('Unterminated dictionary');
            if ('}' === this.input[this.pos]) {
                this.pos++;
                return obj;
            }
            const key = this.parseValue();
            this.skipWhitespaceAndComments();
            if (this.pos >= this.input.length || '=' !== this.input[this.pos]) throw new Error(`Expected '=' after key "${key}" at position ${this.pos}`);
            this.pos++;
            const value = this.parseValue();
            obj[key] = value;
            this.skipWhitespaceAndComments();
            if (this.pos < this.input.length && ';' === this.input[this.pos]) this.pos++;
        }
    }
    parseArray() {
        this.pos++;
        const arr = [];
        this.skipWhitespaceAndComments();
        if (this.pos < this.input.length && ')' === this.input[this.pos]) {
            this.pos++;
            return arr;
        }
        while(true){
            arr.push(this.parseValue());
            this.skipWhitespaceAndComments();
            if (this.pos >= this.input.length) throw new Error('Unterminated array');
            if (')' === this.input[this.pos]) {
                this.pos++;
                return arr;
            }
            if (',' === this.input[this.pos]) {
                this.pos++;
                this.skipWhitespaceAndComments();
                if (this.pos < this.input.length && ')' === this.input[this.pos]) {
                    this.pos++;
                    return arr;
                }
            } else throw new Error(`Expected ',' or ')' in array at position ${this.pos}`);
        }
    }
    parseData() {
        this.pos++;
        let hex = '';
        while(this.pos < this.input.length){
            const ch = this.input[this.pos];
            if ('>' === ch) {
                this.pos++;
                const clean = hex.replace(/\s+/g, '');
                const bytes = new Uint8Array(clean.length / 2);
                for(let i = 0; i < clean.length; i += 2)bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
                return bytes;
            }
            hex += ch;
            this.pos++;
        }
        throw new Error('Unterminated data');
    }
    parseQuotedString() {
        this.pos++;
        let result = '';
        while(this.pos < this.input.length){
            const ch = this.input[this.pos];
            if ('\\' === ch) {
                this.pos++;
                if (this.pos >= this.input.length) throw new Error('Unterminated string escape');
                const esc = this.input[this.pos];
                switch(esc){
                    case '"':
                        result += '"';
                        break;
                    case '\\':
                        result += '\\';
                        break;
                    case 'n':
                        result += '\n';
                        break;
                    case 't':
                        result += '\t';
                        break;
                    case 'r':
                        result += '\r';
                        break;
                    case '0':
                        result += '\0';
                        break;
                    default:
                        result += esc;
                        break;
                }
                this.pos++;
                continue;
            }
            if ('"' === ch) {
                this.pos++;
                return result;
            }
            result += ch;
            this.pos++;
        }
        throw new Error('Unterminated string');
    }
    parseUnquotedString() {
        const start = this.pos;
        while(this.pos < this.input.length){
            const ch = this.input[this.pos];
            if (/[a-zA-Z0-9._\/$:-]/.test(ch)) this.pos++;
            else break;
        }
        if (this.pos === start) throw new Error(`Unexpected character '${this.input[this.pos]}' at position ${this.pos}`);
        return this.input.substring(start, this.pos);
    }
}
function parseOpenStep(input) {
    const parser = new OpenStepParser(input);
    const value = parser.parseValue();
    return value;
}
const lib = __webpack_require__("../../../node_modules/.pnpm/@xmldom+xmldom@0.9.10/node_modules/@xmldom/xmldom/lib/index.js");
function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for(let i = 0; i < binary.length; i++)bytes[i] = binary.charCodeAt(i);
    return bytes;
}
const TEXT_NODE = 3;
const CDATA_NODE = 4;
const COMMENT_NODE = 8;
function shouldIgnoreNode(node) {
    return node.nodeType === TEXT_NODE || node.nodeType === COMMENT_NODE || node.nodeType === CDATA_NODE;
}
function isEmptyNode(node) {
    if (!node.childNodes || 0 === node.childNodes.length) return true;
    return false;
}
function invariant(test, message) {
    if (!test) throw new Error(message);
}
function parse(xml) {
    if (xml instanceof ArrayBuffer) return parseBinary(new Uint8Array(xml));
    if (xml instanceof Uint8Array) return parseBinary(xml);
    if ('string' == typeof xml && xml.startsWith('bplist')) {
        const encoder = new TextEncoder();
        return parseBinary(encoder.encode(xml));
    }
    if ('string' == typeof xml) {
        const trimmed = xml.trimStart();
        if (('{' === trimmed[0] || '(' === trimmed[0]) && !trimmed.startsWith('<?xml') && !trimmed.startsWith('<!DOCTYPE') && !trimmed.startsWith('<plist')) return parseOpenStep(xml);
    }
    const doc = new lib.S4().parseFromString(xml, "text/xml");
    const root = doc.documentElement;
    invariant(null !== root && "plist" === root.nodeName, "malformed document. First element should be <plist>");
    let plist = parsePlistXML(root);
    if (Array.isArray(plist) && 1 == plist.length) plist = plist[0];
    return plist;
}
function parsePlistXML(node) {
    if (!node) return null;
    if ("plist" === node.nodeName) {
        const new_arr = [];
        if (isEmptyNode(node)) return new_arr;
        for(let i = 0; i < node.childNodes.length; i++)if (!shouldIgnoreNode(node.childNodes[i])) new_arr.push(parsePlistXML(node.childNodes[i]));
        return new_arr;
    }
    if ("dict" === node.nodeName) {
        const new_obj = {};
        let key = null;
        let counter = 0;
        if (isEmptyNode(node)) return new_obj;
        for(let i = 0; i < node.childNodes.length; i++)if (!shouldIgnoreNode(node.childNodes[i])) {
            if (counter % 2 === 0) {
                invariant("key" === node.childNodes[i].nodeName, "Missing key while parsing <dict/>.");
                key = parsePlistXML(node.childNodes[i]);
            } else {
                invariant("key" !== node.childNodes[i].nodeName, "Unexpected <key> while parsing <dict/>. Keys and values must alternate.");
                new_obj[key] = parsePlistXML(node.childNodes[i]);
            }
            counter += 1;
        }
        if (counter % 2 === 1) new_obj[key] = "";
        return new_obj;
    }
    if ("array" === node.nodeName) {
        const new_arr = [];
        if (isEmptyNode(node)) return new_arr;
        for(let i = 0; i < node.childNodes.length; i++)if (!shouldIgnoreNode(node.childNodes[i])) {
            const res = parsePlistXML(node.childNodes[i]);
            if (null != res) new_arr.push(res);
        }
        return new_arr;
    }
    if ("#text" === node.nodeName) ;
    else if ("key" === node.nodeName) {
        if (isEmptyNode(node)) return "";
        invariant("__proto__" !== node.childNodes[0].nodeValue, "__proto__ keys can lead to prototype pollution. More details on CVE-2022-22912");
        return node.childNodes[0].nodeValue;
    } else if ("string" === node.nodeName) {
        let res = "";
        if (isEmptyNode(node)) return res;
        for(let i = 0; i < node.childNodes.length; i++){
            const type = node.childNodes[i].nodeType;
            if (type === TEXT_NODE || type === CDATA_NODE) res += node.childNodes[i].nodeValue;
        }
        return res;
    } else if ("integer" === node.nodeName) {
        invariant(!isEmptyNode(node), 'Cannot parse "" as integer.');
        return parseInt(node.childNodes[0].nodeValue, 10);
    } else if ("real" === node.nodeName) {
        invariant(!isEmptyNode(node), 'Cannot parse "" as real.');
        let res = "";
        for(let i = 0; i < node.childNodes.length; i++)if (node.childNodes[i].nodeType === TEXT_NODE) res += node.childNodes[i].nodeValue;
        return parseFloat(res);
    } else if ("data" === node.nodeName) {
        let res = "";
        if (isEmptyNode(node)) return base64ToUint8Array(res);
        for(let i = 0; i < node.childNodes.length; i++)if (node.childNodes[i].nodeType === TEXT_NODE) res += node.childNodes[i].nodeValue.replace(/\s+/g, "");
        return base64ToUint8Array(res);
    } else if ("date" === node.nodeName) {
        invariant(!isEmptyNode(node), 'Cannot parse "" as Date.');
        return new Date(node.childNodes[0].nodeValue);
    } else if ("null" === node.nodeName) ;
    else if ("true" === node.nodeName) return true;
    else if ("false" === node.nodeName) return false;
    else throw new Error("Invalid PLIST tag " + node.nodeName);
    return null;
}
const xmlbuilder_lib = __webpack_require__("../../../node_modules/.pnpm/xmlbuilder@15.1.1/node_modules/xmlbuilder/lib/index.js");
function uint8ArrayToBase64(bytes) {
    let binary = '';
    for(let i = 0; i < bytes.length; i++)binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}
function build(obj, opts) {
    const XMLHDR = {
        version: '1.0',
        encoding: 'UTF-8'
    };
    const XMLDTD = {
        pubid: '-//Apple//DTD PLIST 1.0//EN',
        sysid: 'http://www.apple.com/DTDs/PropertyList-1.0.dtd'
    };
    const doc = xmlbuilder_lib.create('plist');
    doc.dec(XMLHDR.version, XMLHDR.encoding);
    doc.dtd(XMLDTD.pubid, XMLDTD.sysid);
    doc.att('version', '1.0');
    walk_obj(obj, doc);
    if (!opts) opts = {};
    opts.pretty = false !== opts.pretty;
    return doc.end(opts);
}
function walk_obj(next, next_child) {
    if (void 0 === next) return;
    if (Array.isArray(next)) {
        next_child = next_child.ele('array');
        for(let i = 0; i < next.length; i++)walk_obj(next[i], next_child);
    } else if (next instanceof ArrayBuffer) next_child.ele('data').raw(uint8ArrayToBase64(new Uint8Array(next)));
    else if (ArrayBuffer.isView(next)) {
        const bytes = next instanceof Uint8Array ? next : new Uint8Array(next.buffer, next.byteOffset, next.byteLength);
        next_child.ele('data').raw(uint8ArrayToBase64(bytes));
    } else if ('object' != typeof next || null === next || next instanceof Date) {
        if ('number' == typeof next) {
            const tag_type = next % 1 === 0 ? 'integer' : 'real';
            next_child.ele(tag_type).txt(next.toString());
        } else if ('bigint' == typeof next) next_child.ele('integer').txt(next.toString());
        else if (next instanceof Date) next_child.ele('date').txt(new Date(next).toISOString().replace(/\.\d{3}Z$/, 'Z'));
        else if ('boolean' == typeof next) next_child.ele(next ? 'true' : 'false');
        else if ('string' == typeof next) next_child.ele('string').txt(next);
    } else {
        next_child = next_child.ele('dict');
        for(const prop in next)if (Object.hasOwn(next, prop)) {
            const val = next[prop];
            if (null == val) continue;
            next_child.ele('key').txt(prop);
            walk_obj(val, next_child);
        }
    }
}
const HEADER_SIZE = 16;
const USBMUXD_VERSION = 1;
const USBMUXD_PACKET_TYPE_PLIST = 8;
const TAG = 1;
class Usbmux {
    connectOptions;
    constructor(connectOptions){
        if ('string' == typeof connectOptions) this.connectOptions = {
            path: connectOptions
        };
        else if (connectOptions) this.connectOptions = connectOptions;
        else this.connectOptions = {
            path: '/var/run/usbmuxd'
        };
    }
    async listDevices(signal) {
        const { socket, response } = await this.#sendAndReceive({
            MessageType: 'ListDevices',
            ClientVersionString: 'usbmux-driver',
            ProgName: 'usbmux-driver'
        }, signal);
        socket.destroy();
        return response.DeviceList;
    }
    async connect(deviceId, port, signal) {
        const networkPort = port >> 8 & 0xff | port << 8 & 0xff00;
        const { socket, response, tail } = await this.#sendAndReceive({
            MessageType: 'Connect',
            ClientVersionString: 'usbmux-driver',
            ProgName: 'usbmux-driver',
            DeviceID: Number(deviceId),
            PortNumber: networkPort
        }, signal);
        if ('Result' === response.MessageType && 0 === response.Number) {
            if (tail.length > 0) socket.unshift(tail);
            const { readable, writable } = Duplex.toWeb(socket);
            return {
                readable,
                writable,
                dispose: ()=>socket.destroy()
            };
        }
        socket.destroy();
        throw new Error(`Invalid response for Connect: ${JSON.stringify(response)}`);
    }
    async #sendAndReceive(payload, signal) {
        const socket = __rspack_external_node_net_0373943e.createConnection(this.connectOptions);
        if (signal) {
            const abortHandler = ()=>socket.destroy();
            signal.addEventListener('abort', abortHandler, {
                once: true
            });
            socket.once('close', ()=>signal.removeEventListener('abort', abortHandler));
        }
        try {
            await once(socket, 'connect', {
                signal
            });
            socket.write(encodeRequest());
            let buffer = Buffer.alloc(0);
            for await (const [chunk] of on(socket, 'data', {
                signal
            })){
                buffer = Buffer.concat([
                    buffer,
                    chunk
                ]);
                if (buffer.length < HEADER_SIZE) continue;
                const length = buffer.readUInt32LE(0);
                if (buffer.length < length) continue;
                const responseBuffer = buffer.subarray(HEADER_SIZE, length);
                const tail = buffer.subarray(length);
                const response = parse(responseBuffer.toString('utf8'));
                return {
                    socket,
                    response,
                    tail
                };
            }
            throw new Error('Connection closed before response received');
        } catch (error) {
            socket.destroy();
            throw error;
        }
        function encodeRequest() {
            const xml = build(payload);
            const body = Buffer.from(xml, 'utf8');
            const length = HEADER_SIZE + body.length;
            const header = Buffer.alloc(HEADER_SIZE);
            header.writeUInt32LE(length, 0);
            header.writeUInt32LE(USBMUXD_VERSION, 4);
            header.writeUInt32LE(USBMUXD_PACKET_TYPE_PLIST, 8);
            header.writeUInt32LE(TAG, 12);
            return Buffer.concat([
                header,
                body
            ]);
        }
    }
}
const ios_debug = node_createDebug('devtool-mcp-server:connector:ios');
class iOSTransport {
    #client;
    constructor(options){
        this.#client = new Usbmux(options);
    }
    async connect(options) {
        return connectWithPeertalk((opts)=>this.#connectRaw(opts), options);
    }
    async close() {
        ios_debug('iOS transport closed');
    }
    async #connectRaw({ deviceId, port, signal }) {
        ios_debug(`connect: create connection to deviceId: ${deviceId}, port: ${port}`);
        const id = await this.#resolveUsbmuxDeviceId(deviceId, signal);
        const conn = await this.#client.connect(id, port, signal);
        return {
            readable: conn.readable,
            writable: conn.writable,
            async [Symbol.asyncDispose] () {
                ios_debug(`connect: close connection to deviceId: ${deviceId}, port: ${port}`);
                conn.dispose();
            }
        };
    }
    async #resolveUsbmuxDeviceId(deviceId, signal) {
        const numericDeviceId = Number(deviceId);
        if (Number.isInteger(numericDeviceId)) return numericDeviceId;
        const devices = await this.#client.listDevices(signal);
        const device = devices.find(({ Properties })=>Properties.SerialNumber === deviceId);
        if (!device) throw new Error(`iOS device with id: ${deviceId} not found`);
        return device.DeviceID;
    }
    async listDevices() {
        const devices = await this.#client.listDevices(AbortSignal.timeout(1000));
        ios_debug('listDevices: devices %o', devices);
        return devices.map(({ Properties })=>({
                os: 'iOS',
                id: Properties.SerialNumber
            }));
    }
    async listAvailableApps() {
        throw new Error('Not implemented');
    }
    async openApp(_, __, ___) {
        throw new Error('Not implemented');
    }
}
__webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/stream.js");
__webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/extension.js");
__webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/permessage-deflate.js");
__webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/receiver.js");
__webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/sender.js");
__webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/subprotocol.js");
__webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/websocket.js");
__webpack_require__("../../../node_modules/.pnpm/ws@8.21.0/node_modules/ws/lib/websocket-server.js");
function isInitializeResponse(response) {
    return 'Register' === response.event;
}
function isHeadlessPrepareResponse(response) {
    return 'Customized' === response.event && 'HeadlessPrepare' === response.data.type;
}
function isListSessionResponse(response) {
    return 'Customized' === response.event && 'SessionList' === response.data.type;
}
function isGetGlobalSwitchResponse(response) {
    return 'Customized' === response.event && 'GetGlobalSwitch' === response.data.type;
}
function isSetGlobalSwitchResponse(response) {
    return 'Customized' === response.event && 'SetGlobalSwitch' === response.data.type;
}
function isCustomizedResponseWithType(response, type) {
    return 'Customized' === response.event && response.data.type === type;
}
class ClientId {
    static serialize(deviceId, port) {
        return `${encodeURIComponent(deviceId)}:${port}`;
    }
    static deserialize(clientId) {
        try {
            const lastColonIndex = clientId.lastIndexOf(':');
            if (-1 === lastColonIndex) return null;
            const port = Number.parseInt(clientId.substring(lastColonIndex + 1), 10);
            if (Number.isNaN(port)) return null;
            return {
                deviceId: decodeURIComponent(clientId.substring(0, lastColonIndex)),
                port
            };
        } catch  {
            return null;
        }
    }
}
export { AndroidTransport, ClientId, DAEMON_INSPECTOR_PATH, DAEMON_SHUTDOWN_PATH, DAEMON_VERSION_PATH, DAEMON_WS_PATH, DaemonManager, DesktopTransport, MessageToPeertalkTransformStream, PeertalkToMessageTransformStream, Usbmux, connectWithPeertalk, createMessageConnection, iOSTransport, isControlRequest, isCustomizedMessage, isCustomizedResponseWithType, isGetGlobalSwitchResponse, isHeadlessPrepareResponse, isInitializeResponse, isListClientsRequest, isListSessionResponse, isPingEvent, isRegisterEvent, isSetGlobalSwitchResponse, node_createDebug, peertalkCodecFactory };
