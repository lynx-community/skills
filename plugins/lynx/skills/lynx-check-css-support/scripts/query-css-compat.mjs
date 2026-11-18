#!/usr/bin/env node
/*! LICENSE: query-css-compat.mjs.LICENSE.txt */
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve as external_node_path_resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire as __rspack_createRequire } from "node:module";
const __rspack_createRequire_require = __rspack_createRequire(import.meta.url);
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
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/index.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { Argument } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/argument.js");
        const { Command } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/command.js");
        const { CommanderError, InvalidArgumentError } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/error.js");
        const { Help } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/help.js");
        const { Option } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/option.js");
        exports.DM = new Command();
        exports.gu = (name)=>new Command(name);
        exports.Ww = (flags, description)=>new Option(flags, description);
        exports.er = (name, description)=>new Argument(name, description);
        exports.uB = Command;
        exports.c$ = Option;
        exports.ef = Argument;
        exports._V = Help;
        exports.b7 = CommanderError;
        exports.Di = InvalidArgumentError;
        exports.a2 = InvalidArgumentError;
    },
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/argument.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { InvalidArgumentError } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/error.js");
        class Argument {
            constructor(name, description){
                this.description = description || '';
                this.variadic = false;
                this.parseArg = void 0;
                this.defaultValue = void 0;
                this.defaultValueDescription = void 0;
                this.argChoices = void 0;
                switch(name[0]){
                    case '<':
                        this.required = true;
                        this._name = name.slice(1, -1);
                        break;
                    case '[':
                        this.required = false;
                        this._name = name.slice(1, -1);
                        break;
                    default:
                        this.required = true;
                        this._name = name;
                        break;
                }
                if (this._name.length > 3 && '...' === this._name.slice(-3)) {
                    this.variadic = true;
                    this._name = this._name.slice(0, -3);
                }
            }
            name() {
                return this._name;
            }
            _concatValue(value, previous) {
                if (previous === this.defaultValue || !Array.isArray(previous)) return [
                    value
                ];
                return previous.concat(value);
            }
            default(value, description) {
                this.defaultValue = value;
                this.defaultValueDescription = description;
                return this;
            }
            argParser(fn) {
                this.parseArg = fn;
                return this;
            }
            choices(values) {
                this.argChoices = values.slice();
                this.parseArg = (arg, previous)=>{
                    if (!this.argChoices.includes(arg)) throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
                    if (this.variadic) return this._concatValue(arg, previous);
                    return arg;
                };
                return this;
            }
            argRequired() {
                this.required = true;
                return this;
            }
            argOptional() {
                this.required = false;
                return this;
            }
        }
        function humanReadableArgName(arg) {
            const nameOutput = arg.name() + (true === arg.variadic ? '...' : '');
            return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
        }
        exports.Argument = Argument;
        exports.humanReadableArgName = humanReadableArgName;
    },
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/command.js" (__unused_rspack_module, exports, __webpack_require__) {
        const EventEmitter = __rspack_createRequire_require("node:events").EventEmitter;
        const childProcess = __rspack_createRequire_require("node:child_process");
        const path = __rspack_createRequire_require("node:path");
        const fs = __rspack_createRequire_require("node:fs");
        const process1 = __rspack_createRequire_require("node:process");
        const { Argument, humanReadableArgName } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/argument.js");
        const { CommanderError } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/error.js");
        const { Help, stripColor } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/help.js");
        const { Option, DualOptions } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/option.js");
        const { suggestSimilar } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/suggestSimilar.js");
        class Command extends EventEmitter {
            constructor(name){
                super();
                this.commands = [];
                this.options = [];
                this.parent = null;
                this._allowUnknownOption = false;
                this._allowExcessArguments = false;
                this.registeredArguments = [];
                this._args = this.registeredArguments;
                this.args = [];
                this.rawArgs = [];
                this.processedArgs = [];
                this._scriptPath = null;
                this._name = name || '';
                this._optionValues = {};
                this._optionValueSources = {};
                this._storeOptionsAsProperties = false;
                this._actionHandler = null;
                this._executableHandler = false;
                this._executableFile = null;
                this._executableDir = null;
                this._defaultCommandName = null;
                this._exitCallback = null;
                this._aliases = [];
                this._combineFlagAndOptionalValue = true;
                this._description = '';
                this._summary = '';
                this._argsDescription = void 0;
                this._enablePositionalOptions = false;
                this._passThroughOptions = false;
                this._lifeCycleHooks = {};
                this._showHelpAfterError = false;
                this._showSuggestionAfterError = true;
                this._savedState = null;
                this._outputConfiguration = {
                    writeOut: (str)=>process1.stdout.write(str),
                    writeErr: (str)=>process1.stderr.write(str),
                    outputError: (str, write)=>write(str),
                    getOutHelpWidth: ()=>process1.stdout.isTTY ? process1.stdout.columns : void 0,
                    getErrHelpWidth: ()=>process1.stderr.isTTY ? process1.stderr.columns : void 0,
                    getOutHasColors: ()=>useColor() ?? (process1.stdout.isTTY && process1.stdout.hasColors?.()),
                    getErrHasColors: ()=>useColor() ?? (process1.stderr.isTTY && process1.stderr.hasColors?.()),
                    stripColor: (str)=>stripColor(str)
                };
                this._hidden = false;
                this._helpOption = void 0;
                this._addImplicitHelpCommand = void 0;
                this._helpCommand = void 0;
                this._helpConfiguration = {};
            }
            copyInheritedSettings(sourceCommand) {
                this._outputConfiguration = sourceCommand._outputConfiguration;
                this._helpOption = sourceCommand._helpOption;
                this._helpCommand = sourceCommand._helpCommand;
                this._helpConfiguration = sourceCommand._helpConfiguration;
                this._exitCallback = sourceCommand._exitCallback;
                this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
                this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
                this._allowExcessArguments = sourceCommand._allowExcessArguments;
                this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
                this._showHelpAfterError = sourceCommand._showHelpAfterError;
                this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
                return this;
            }
            _getCommandAndAncestors() {
                const result = [];
                for(let command = this; command; command = command.parent)result.push(command);
                return result;
            }
            command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
                let desc = actionOptsOrExecDesc;
                let opts = execOpts;
                if ('object' == typeof desc && null !== desc) {
                    opts = desc;
                    desc = null;
                }
                opts = opts || {};
                const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
                const cmd = this.createCommand(name);
                if (desc) {
                    cmd.description(desc);
                    cmd._executableHandler = true;
                }
                if (opts.isDefault) this._defaultCommandName = cmd._name;
                cmd._hidden = !!(opts.noHelp || opts.hidden);
                cmd._executableFile = opts.executableFile || null;
                if (args) cmd.arguments(args);
                this._registerCommand(cmd);
                cmd.parent = this;
                cmd.copyInheritedSettings(this);
                if (desc) return this;
                return cmd;
            }
            createCommand(name) {
                return new Command(name);
            }
            createHelp() {
                return Object.assign(new Help(), this.configureHelp());
            }
            configureHelp(configuration) {
                if (void 0 === configuration) return this._helpConfiguration;
                this._helpConfiguration = configuration;
                return this;
            }
            configureOutput(configuration) {
                if (void 0 === configuration) return this._outputConfiguration;
                Object.assign(this._outputConfiguration, configuration);
                return this;
            }
            showHelpAfterError(displayHelp = true) {
                if ('string' != typeof displayHelp) displayHelp = !!displayHelp;
                this._showHelpAfterError = displayHelp;
                return this;
            }
            showSuggestionAfterError(displaySuggestion = true) {
                this._showSuggestionAfterError = !!displaySuggestion;
                return this;
            }
            addCommand(cmd, opts) {
                if (!cmd._name) throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
                opts = opts || {};
                if (opts.isDefault) this._defaultCommandName = cmd._name;
                if (opts.noHelp || opts.hidden) cmd._hidden = true;
                this._registerCommand(cmd);
                cmd.parent = this;
                cmd._checkForBrokenPassThrough();
                return this;
            }
            createArgument(name, description) {
                return new Argument(name, description);
            }
            argument(name, description, fn, defaultValue) {
                const argument = this.createArgument(name, description);
                if ('function' == typeof fn) argument.default(defaultValue).argParser(fn);
                else argument.default(fn);
                this.addArgument(argument);
                return this;
            }
            arguments(names) {
                names.trim().split(/ +/).forEach((detail)=>{
                    this.argument(detail);
                });
                return this;
            }
            addArgument(argument) {
                const previousArgument = this.registeredArguments.slice(-1)[0];
                if (previousArgument && previousArgument.variadic) throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
                if (argument.required && void 0 !== argument.defaultValue && void 0 === argument.parseArg) throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
                this.registeredArguments.push(argument);
                return this;
            }
            helpCommand(enableOrNameAndArgs, description) {
                if ('boolean' == typeof enableOrNameAndArgs) {
                    this._addImplicitHelpCommand = enableOrNameAndArgs;
                    return this;
                }
                enableOrNameAndArgs = enableOrNameAndArgs ?? 'help [command]';
                const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
                const helpDescription = description ?? 'display help for command';
                const helpCommand = this.createCommand(helpName);
                helpCommand.helpOption(false);
                if (helpArgs) helpCommand.arguments(helpArgs);
                if (helpDescription) helpCommand.description(helpDescription);
                this._addImplicitHelpCommand = true;
                this._helpCommand = helpCommand;
                return this;
            }
            addHelpCommand(helpCommand, deprecatedDescription) {
                if ('object' != typeof helpCommand) {
                    this.helpCommand(helpCommand, deprecatedDescription);
                    return this;
                }
                this._addImplicitHelpCommand = true;
                this._helpCommand = helpCommand;
                return this;
            }
            _getHelpCommand() {
                const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand('help'));
                if (hasImplicitHelpCommand) {
                    if (void 0 === this._helpCommand) this.helpCommand(void 0, void 0);
                    return this._helpCommand;
                }
                return null;
            }
            hook(event, listener) {
                const allowedValues = [
                    'preSubcommand',
                    'preAction',
                    'postAction'
                ];
                if (!allowedValues.includes(event)) throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
                if (this._lifeCycleHooks[event]) this._lifeCycleHooks[event].push(listener);
                else this._lifeCycleHooks[event] = [
                    listener
                ];
                return this;
            }
            exitOverride(fn) {
                if (fn) this._exitCallback = fn;
                else this._exitCallback = (err)=>{
                    if ('commander.executeSubCommandAsync' !== err.code) throw err;
                };
                return this;
            }
            _exit(exitCode, code, message) {
                if (this._exitCallback) this._exitCallback(new CommanderError(exitCode, code, message));
                process1.exit(exitCode);
            }
            action(fn) {
                const listener = (args)=>{
                    const expectedArgsCount = this.registeredArguments.length;
                    const actionArgs = args.slice(0, expectedArgsCount);
                    if (this._storeOptionsAsProperties) actionArgs[expectedArgsCount] = this;
                    else actionArgs[expectedArgsCount] = this.opts();
                    actionArgs.push(this);
                    return fn.apply(this, actionArgs);
                };
                this._actionHandler = listener;
                return this;
            }
            createOption(flags, description) {
                return new Option(flags, description);
            }
            _callParseArg(target, value, previous, invalidArgumentMessage) {
                try {
                    return target.parseArg(value, previous);
                } catch (err) {
                    if ('commander.invalidArgument' === err.code) {
                        const message = `${invalidArgumentMessage} ${err.message}`;
                        this.error(message, {
                            exitCode: err.exitCode,
                            code: err.code
                        });
                    }
                    throw err;
                }
            }
            _registerOption(option) {
                const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
                if (matchingOption) {
                    const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
                    throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
                }
                this.options.push(option);
            }
            _registerCommand(command) {
                const knownBy = (cmd)=>[
                        cmd.name()
                    ].concat(cmd.aliases());
                const alreadyUsed = knownBy(command).find((name)=>this._findCommand(name));
                if (alreadyUsed) {
                    const existingCmd = knownBy(this._findCommand(alreadyUsed)).join('|');
                    const newCmd = knownBy(command).join('|');
                    throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
                }
                this.commands.push(command);
            }
            addOption(option) {
                this._registerOption(option);
                const oname = option.name();
                const name = option.attributeName();
                if (option.negate) {
                    const positiveLongFlag = option.long.replace(/^--no-/, '--');
                    if (!this._findOption(positiveLongFlag)) this.setOptionValueWithSource(name, void 0 === option.defaultValue ? true : option.defaultValue, 'default');
                } else if (void 0 !== option.defaultValue) this.setOptionValueWithSource(name, option.defaultValue, 'default');
                const handleOptionValue = (val, invalidValueMessage, valueSource)=>{
                    if (null == val && void 0 !== option.presetArg) val = option.presetArg;
                    const oldValue = this.getOptionValue(name);
                    if (null !== val && option.parseArg) val = this._callParseArg(option, val, oldValue, invalidValueMessage);
                    else if (null !== val && option.variadic) val = option._concatValue(val, oldValue);
                    if (null == val) val = option.negate ? false : option.isBoolean() || option.optional ? true : '';
                    this.setOptionValueWithSource(name, val, valueSource);
                };
                this.on('option:' + oname, (val)=>{
                    const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
                    handleOptionValue(val, invalidValueMessage, 'cli');
                });
                if (option.envVar) this.on('optionEnv:' + oname, (val)=>{
                    const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
                    handleOptionValue(val, invalidValueMessage, 'env');
                });
                return this;
            }
            _optionEx(config, flags, description, fn, defaultValue) {
                if ('object' == typeof flags && flags instanceof Option) throw new Error('To add an Option object use addOption() instead of option() or requiredOption()');
                const option = this.createOption(flags, description);
                option.makeOptionMandatory(!!config.mandatory);
                if ('function' == typeof fn) option.default(defaultValue).argParser(fn);
                else if (fn instanceof RegExp) {
                    const regex = fn;
                    fn = (val, def)=>{
                        const m = regex.exec(val);
                        return m ? m[0] : def;
                    };
                    option.default(defaultValue).argParser(fn);
                } else option.default(fn);
                return this.addOption(option);
            }
            option(flags, description, parseArg, defaultValue) {
                return this._optionEx({}, flags, description, parseArg, defaultValue);
            }
            requiredOption(flags, description, parseArg, defaultValue) {
                return this._optionEx({
                    mandatory: true
                }, flags, description, parseArg, defaultValue);
            }
            combineFlagAndOptionalValue(combine = true) {
                this._combineFlagAndOptionalValue = !!combine;
                return this;
            }
            allowUnknownOption(allowUnknown = true) {
                this._allowUnknownOption = !!allowUnknown;
                return this;
            }
            allowExcessArguments(allowExcess = true) {
                this._allowExcessArguments = !!allowExcess;
                return this;
            }
            enablePositionalOptions(positional = true) {
                this._enablePositionalOptions = !!positional;
                return this;
            }
            passThroughOptions(passThrough = true) {
                this._passThroughOptions = !!passThrough;
                this._checkForBrokenPassThrough();
                return this;
            }
            _checkForBrokenPassThrough() {
                if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
            }
            storeOptionsAsProperties(storeAsProperties = true) {
                if (this.options.length) throw new Error('call .storeOptionsAsProperties() before adding options');
                if (Object.keys(this._optionValues).length) throw new Error('call .storeOptionsAsProperties() before setting option values');
                this._storeOptionsAsProperties = !!storeAsProperties;
                return this;
            }
            getOptionValue(key) {
                if (this._storeOptionsAsProperties) return this[key];
                return this._optionValues[key];
            }
            setOptionValue(key, value) {
                return this.setOptionValueWithSource(key, value, void 0);
            }
            setOptionValueWithSource(key, value, source) {
                if (this._storeOptionsAsProperties) this[key] = value;
                else this._optionValues[key] = value;
                this._optionValueSources[key] = source;
                return this;
            }
            getOptionValueSource(key) {
                return this._optionValueSources[key];
            }
            getOptionValueSourceWithGlobals(key) {
                let source;
                this._getCommandAndAncestors().forEach((cmd)=>{
                    if (void 0 !== cmd.getOptionValueSource(key)) source = cmd.getOptionValueSource(key);
                });
                return source;
            }
            _prepareUserArgs(argv, parseOptions) {
                if (void 0 !== argv && !Array.isArray(argv)) throw new Error('first parameter to parse must be array or undefined');
                parseOptions = parseOptions || {};
                if (void 0 === argv && void 0 === parseOptions.from) {
                    if (process1.versions?.electron) parseOptions.from = 'electron';
                    const execArgv = process1.execArgv ?? [];
                    if (execArgv.includes('-e') || execArgv.includes('--eval') || execArgv.includes('-p') || execArgv.includes('--print')) parseOptions.from = 'eval';
                }
                if (void 0 === argv) argv = process1.argv;
                this.rawArgs = argv.slice();
                let userArgs;
                switch(parseOptions.from){
                    case void 0:
                    case 'node':
                        this._scriptPath = argv[1];
                        userArgs = argv.slice(2);
                        break;
                    case 'electron':
                        if (process1.defaultApp) {
                            this._scriptPath = argv[1];
                            userArgs = argv.slice(2);
                        } else userArgs = argv.slice(1);
                        break;
                    case 'user':
                        userArgs = argv.slice(0);
                        break;
                    case 'eval':
                        userArgs = argv.slice(1);
                        break;
                    default:
                        throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
                }
                if (!this._name && this._scriptPath) this.nameFromFilename(this._scriptPath);
                this._name = this._name || 'program';
                return userArgs;
            }
            parse(argv, parseOptions) {
                this._prepareForParse();
                const userArgs = this._prepareUserArgs(argv, parseOptions);
                this._parseCommand([], userArgs);
                return this;
            }
            async parseAsync(argv, parseOptions) {
                this._prepareForParse();
                const userArgs = this._prepareUserArgs(argv, parseOptions);
                await this._parseCommand([], userArgs);
                return this;
            }
            _prepareForParse() {
                if (null === this._savedState) this.saveStateBeforeParse();
                else this.restoreStateBeforeParse();
            }
            saveStateBeforeParse() {
                this._savedState = {
                    _name: this._name,
                    _optionValues: {
                        ...this._optionValues
                    },
                    _optionValueSources: {
                        ...this._optionValueSources
                    }
                };
            }
            restoreStateBeforeParse() {
                if (this._storeOptionsAsProperties) throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
                this._name = this._savedState._name;
                this._scriptPath = null;
                this.rawArgs = [];
                this._optionValues = {
                    ...this._savedState._optionValues
                };
                this._optionValueSources = {
                    ...this._savedState._optionValueSources
                };
                this.args = [];
                this.processedArgs = [];
            }
            _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
                if (fs.existsSync(executableFile)) return;
                const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory';
                const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
                throw new Error(executableMissing);
            }
            _executeSubCommand(subcommand, args) {
                args = args.slice();
                let launchWithNode = false;
                const sourceExt = [
                    '.js',
                    '.ts',
                    '.tsx',
                    '.mjs',
                    '.cjs'
                ];
                function findFile(baseDir, baseName) {
                    const localBin = path.resolve(baseDir, baseName);
                    if (fs.existsSync(localBin)) return localBin;
                    if (sourceExt.includes(path.extname(baseName))) return;
                    const foundExt = sourceExt.find((ext)=>fs.existsSync(`${localBin}${ext}`));
                    if (foundExt) return `${localBin}${foundExt}`;
                }
                this._checkForMissingMandatoryOptions();
                this._checkForConflictingOptions();
                let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
                let executableDir = this._executableDir || '';
                if (this._scriptPath) {
                    let resolvedScriptPath;
                    try {
                        resolvedScriptPath = fs.realpathSync(this._scriptPath);
                    } catch  {
                        resolvedScriptPath = this._scriptPath;
                    }
                    executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
                }
                if (executableDir) {
                    let localFile = findFile(executableDir, executableFile);
                    if (!localFile && !subcommand._executableFile && this._scriptPath) {
                        const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
                        if (legacyName !== this._name) localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
                    }
                    executableFile = localFile || executableFile;
                }
                launchWithNode = sourceExt.includes(path.extname(executableFile));
                let proc;
                if ('win32' !== process1.platform) if (launchWithNode) {
                    args.unshift(executableFile);
                    args = incrementNodeInspectorPort(process1.execArgv).concat(args);
                    proc = childProcess.spawn(process1.argv[0], args, {
                        stdio: 'inherit'
                    });
                } else proc = childProcess.spawn(executableFile, args, {
                    stdio: 'inherit'
                });
                else {
                    this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
                    args.unshift(executableFile);
                    args = incrementNodeInspectorPort(process1.execArgv).concat(args);
                    proc = childProcess.spawn(process1.execPath, args, {
                        stdio: 'inherit'
                    });
                }
                if (!proc.killed) {
                    const signals = [
                        'SIGUSR1',
                        'SIGUSR2',
                        'SIGTERM',
                        'SIGINT',
                        'SIGHUP'
                    ];
                    signals.forEach((signal)=>{
                        process1.on(signal, ()=>{
                            if (false === proc.killed && null === proc.exitCode) proc.kill(signal);
                        });
                    });
                }
                const exitCallback = this._exitCallback;
                proc.on('close', (code)=>{
                    code = code ?? 1;
                    if (exitCallback) exitCallback(new CommanderError(code, 'commander.executeSubCommandAsync', '(close)'));
                    else process1.exit(code);
                });
                proc.on('error', (err)=>{
                    if ('ENOENT' === err.code) this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
                    else if ('EACCES' === err.code) throw new Error(`'${executableFile}' not executable`);
                    if (exitCallback) {
                        const wrappedError = new CommanderError(1, 'commander.executeSubCommandAsync', '(error)');
                        wrappedError.nestedError = err;
                        exitCallback(wrappedError);
                    } else process1.exit(1);
                });
                this.runningCommand = proc;
            }
            _dispatchSubcommand(commandName, operands, unknown) {
                const subCommand = this._findCommand(commandName);
                if (!subCommand) this.help({
                    error: true
                });
                subCommand._prepareForParse();
                let promiseChain;
                promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, 'preSubcommand');
                promiseChain = this._chainOrCall(promiseChain, ()=>{
                    if (!subCommand._executableHandler) return subCommand._parseCommand(operands, unknown);
                    else this._executeSubCommand(subCommand, operands.concat(unknown));
                });
                return promiseChain;
            }
            _dispatchHelpCommand(subcommandName) {
                if (!subcommandName) this.help();
                const subCommand = this._findCommand(subcommandName);
                if (subCommand && !subCommand._executableHandler) subCommand.help();
                return this._dispatchSubcommand(subcommandName, [], [
                    this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? '--help'
                ]);
            }
            _checkNumberOfArguments() {
                this.registeredArguments.forEach((arg, i)=>{
                    if (arg.required && null == this.args[i]) this.missingArgument(arg.name());
                });
                if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) return;
                if (this.args.length > this.registeredArguments.length) this._excessArguments(this.args);
            }
            _processArguments() {
                const myParseArg = (argument, value, previous)=>{
                    let parsedValue = value;
                    if (null !== value && argument.parseArg) {
                        const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
                        parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
                    }
                    return parsedValue;
                };
                this._checkNumberOfArguments();
                const processedArgs = [];
                this.registeredArguments.forEach((declaredArg, index)=>{
                    let value = declaredArg.defaultValue;
                    if (declaredArg.variadic) {
                        if (index < this.args.length) {
                            value = this.args.slice(index);
                            if (declaredArg.parseArg) value = value.reduce((processed, v)=>myParseArg(declaredArg, v, processed), declaredArg.defaultValue);
                        } else if (void 0 === value) value = [];
                    } else if (index < this.args.length) {
                        value = this.args[index];
                        if (declaredArg.parseArg) value = myParseArg(declaredArg, value, declaredArg.defaultValue);
                    }
                    processedArgs[index] = value;
                });
                this.processedArgs = processedArgs;
            }
            _chainOrCall(promise, fn) {
                if (promise && promise.then && 'function' == typeof promise.then) return promise.then(()=>fn());
                return fn();
            }
            _chainOrCallHooks(promise, event) {
                let result = promise;
                const hooks = [];
                this._getCommandAndAncestors().reverse().filter((cmd)=>void 0 !== cmd._lifeCycleHooks[event]).forEach((hookedCommand)=>{
                    hookedCommand._lifeCycleHooks[event].forEach((callback)=>{
                        hooks.push({
                            hookedCommand,
                            callback
                        });
                    });
                });
                if ('postAction' === event) hooks.reverse();
                hooks.forEach((hookDetail)=>{
                    result = this._chainOrCall(result, ()=>hookDetail.callback(hookDetail.hookedCommand, this));
                });
                return result;
            }
            _chainOrCallSubCommandHook(promise, subCommand, event) {
                let result = promise;
                if (void 0 !== this._lifeCycleHooks[event]) this._lifeCycleHooks[event].forEach((hook)=>{
                    result = this._chainOrCall(result, ()=>hook(this, subCommand));
                });
                return result;
            }
            _parseCommand(operands, unknown) {
                const parsed = this.parseOptions(unknown);
                this._parseOptionsEnv();
                this._parseOptionsImplied();
                operands = operands.concat(parsed.operands);
                unknown = parsed.unknown;
                this.args = operands.concat(unknown);
                if (operands && this._findCommand(operands[0])) return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
                if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) return this._dispatchHelpCommand(operands[1]);
                if (this._defaultCommandName) {
                    this._outputHelpIfRequested(unknown);
                    return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
                }
                if (this.commands.length && 0 === this.args.length && !this._actionHandler && !this._defaultCommandName) this.help({
                    error: true
                });
                this._outputHelpIfRequested(parsed.unknown);
                this._checkForMissingMandatoryOptions();
                this._checkForConflictingOptions();
                const checkForUnknownOptions = ()=>{
                    if (parsed.unknown.length > 0) this.unknownOption(parsed.unknown[0]);
                };
                const commandEvent = `command:${this.name()}`;
                if (this._actionHandler) {
                    checkForUnknownOptions();
                    this._processArguments();
                    let promiseChain;
                    promiseChain = this._chainOrCallHooks(promiseChain, 'preAction');
                    promiseChain = this._chainOrCall(promiseChain, ()=>this._actionHandler(this.processedArgs));
                    if (this.parent) promiseChain = this._chainOrCall(promiseChain, ()=>{
                        this.parent.emit(commandEvent, operands, unknown);
                    });
                    promiseChain = this._chainOrCallHooks(promiseChain, 'postAction');
                    return promiseChain;
                }
                if (this.parent && this.parent.listenerCount(commandEvent)) {
                    checkForUnknownOptions();
                    this._processArguments();
                    this.parent.emit(commandEvent, operands, unknown);
                } else if (operands.length) {
                    if (this._findCommand('*')) return this._dispatchSubcommand('*', operands, unknown);
                    if (this.listenerCount('command:*')) this.emit('command:*', operands, unknown);
                    else if (this.commands.length) this.unknownCommand();
                    else {
                        checkForUnknownOptions();
                        this._processArguments();
                    }
                } else if (this.commands.length) {
                    checkForUnknownOptions();
                    this.help({
                        error: true
                    });
                } else {
                    checkForUnknownOptions();
                    this._processArguments();
                }
            }
            _findCommand(name) {
                if (!name) return;
                return this.commands.find((cmd)=>cmd._name === name || cmd._aliases.includes(name));
            }
            _findOption(arg) {
                return this.options.find((option)=>option.is(arg));
            }
            _checkForMissingMandatoryOptions() {
                this._getCommandAndAncestors().forEach((cmd)=>{
                    cmd.options.forEach((anOption)=>{
                        if (anOption.mandatory && void 0 === cmd.getOptionValue(anOption.attributeName())) cmd.missingMandatoryOptionValue(anOption);
                    });
                });
            }
            _checkForConflictingLocalOptions() {
                const definedNonDefaultOptions = this.options.filter((option)=>{
                    const optionKey = option.attributeName();
                    if (void 0 === this.getOptionValue(optionKey)) return false;
                    return 'default' !== this.getOptionValueSource(optionKey);
                });
                const optionsWithConflicting = definedNonDefaultOptions.filter((option)=>option.conflictsWith.length > 0);
                optionsWithConflicting.forEach((option)=>{
                    const conflictingAndDefined = definedNonDefaultOptions.find((defined)=>option.conflictsWith.includes(defined.attributeName()));
                    if (conflictingAndDefined) this._conflictingOption(option, conflictingAndDefined);
                });
            }
            _checkForConflictingOptions() {
                this._getCommandAndAncestors().forEach((cmd)=>{
                    cmd._checkForConflictingLocalOptions();
                });
            }
            parseOptions(argv) {
                const operands = [];
                const unknown = [];
                let dest = operands;
                const args = argv.slice();
                function maybeOption(arg) {
                    return arg.length > 1 && '-' === arg[0];
                }
                let activeVariadicOption = null;
                while(args.length){
                    const arg = args.shift();
                    if ('--' === arg) {
                        if (dest === unknown) dest.push(arg);
                        dest.push(...args);
                        break;
                    }
                    if (activeVariadicOption && !maybeOption(arg)) {
                        this.emit(`option:${activeVariadicOption.name()}`, arg);
                        continue;
                    }
                    activeVariadicOption = null;
                    if (maybeOption(arg)) {
                        const option = this._findOption(arg);
                        if (option) {
                            if (option.required) {
                                const value = args.shift();
                                if (void 0 === value) this.optionMissingArgument(option);
                                this.emit(`option:${option.name()}`, value);
                            } else if (option.optional) {
                                let value = null;
                                if (args.length > 0 && !maybeOption(args[0])) value = args.shift();
                                this.emit(`option:${option.name()}`, value);
                            } else this.emit(`option:${option.name()}`);
                            activeVariadicOption = option.variadic ? option : null;
                            continue;
                        }
                    }
                    if (arg.length > 2 && '-' === arg[0] && '-' !== arg[1]) {
                        const option = this._findOption(`-${arg[1]}`);
                        if (option) {
                            if (option.required || option.optional && this._combineFlagAndOptionalValue) this.emit(`option:${option.name()}`, arg.slice(2));
                            else {
                                this.emit(`option:${option.name()}`);
                                args.unshift(`-${arg.slice(2)}`);
                            }
                            continue;
                        }
                    }
                    if (/^--[^=]+=/.test(arg)) {
                        const index = arg.indexOf('=');
                        const option = this._findOption(arg.slice(0, index));
                        if (option && (option.required || option.optional)) {
                            this.emit(`option:${option.name()}`, arg.slice(index + 1));
                            continue;
                        }
                    }
                    if (maybeOption(arg)) dest = unknown;
                    if ((this._enablePositionalOptions || this._passThroughOptions) && 0 === operands.length && 0 === unknown.length) {
                        if (this._findCommand(arg)) {
                            operands.push(arg);
                            if (args.length > 0) unknown.push(...args);
                            break;
                        } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
                            operands.push(arg);
                            if (args.length > 0) operands.push(...args);
                            break;
                        } else if (this._defaultCommandName) {
                            unknown.push(arg);
                            if (args.length > 0) unknown.push(...args);
                            break;
                        }
                    }
                    if (this._passThroughOptions) {
                        dest.push(arg);
                        if (args.length > 0) dest.push(...args);
                        break;
                    }
                    dest.push(arg);
                }
                return {
                    operands,
                    unknown
                };
            }
            opts() {
                if (this._storeOptionsAsProperties) {
                    const result = {};
                    const len = this.options.length;
                    for(let i = 0; i < len; i++){
                        const key = this.options[i].attributeName();
                        result[key] = key === this._versionOptionName ? this._version : this[key];
                    }
                    return result;
                }
                return this._optionValues;
            }
            optsWithGlobals() {
                return this._getCommandAndAncestors().reduce((combinedOptions, cmd)=>Object.assign(combinedOptions, cmd.opts()), {});
            }
            error(message, errorOptions) {
                this._outputConfiguration.outputError(`${message}\n`, this._outputConfiguration.writeErr);
                if ('string' == typeof this._showHelpAfterError) this._outputConfiguration.writeErr(`${this._showHelpAfterError}\n`);
                else if (this._showHelpAfterError) {
                    this._outputConfiguration.writeErr('\n');
                    this.outputHelp({
                        error: true
                    });
                }
                const config = errorOptions || {};
                const exitCode = config.exitCode || 1;
                const code = config.code || 'commander.error';
                this._exit(exitCode, code, message);
            }
            _parseOptionsEnv() {
                this.options.forEach((option)=>{
                    if (option.envVar && option.envVar in process1.env) {
                        const optionKey = option.attributeName();
                        if (void 0 === this.getOptionValue(optionKey) || [
                            'default',
                            'config',
                            'env'
                        ].includes(this.getOptionValueSource(optionKey))) if (option.required || option.optional) this.emit(`optionEnv:${option.name()}`, process1.env[option.envVar]);
                        else this.emit(`optionEnv:${option.name()}`);
                    }
                });
            }
            _parseOptionsImplied() {
                const dualHelper = new DualOptions(this.options);
                const hasCustomOptionValue = (optionKey)=>void 0 !== this.getOptionValue(optionKey) && ![
                        'default',
                        'implied'
                    ].includes(this.getOptionValueSource(optionKey));
                this.options.filter((option)=>void 0 !== option.implied && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option)=>{
                    Object.keys(option.implied).filter((impliedKey)=>!hasCustomOptionValue(impliedKey)).forEach((impliedKey)=>{
                        this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], 'implied');
                    });
                });
            }
            missingArgument(name) {
                const message = `error: missing required argument '${name}'`;
                this.error(message, {
                    code: 'commander.missingArgument'
                });
            }
            optionMissingArgument(option) {
                const message = `error: option '${option.flags}' argument missing`;
                this.error(message, {
                    code: 'commander.optionMissingArgument'
                });
            }
            missingMandatoryOptionValue(option) {
                const message = `error: required option '${option.flags}' not specified`;
                this.error(message, {
                    code: 'commander.missingMandatoryOptionValue'
                });
            }
            _conflictingOption(option, conflictingOption) {
                const findBestOptionFromValue = (option)=>{
                    const optionKey = option.attributeName();
                    const optionValue = this.getOptionValue(optionKey);
                    const negativeOption = this.options.find((target)=>target.negate && optionKey === target.attributeName());
                    const positiveOption = this.options.find((target)=>!target.negate && optionKey === target.attributeName());
                    if (negativeOption && (void 0 === negativeOption.presetArg && false === optionValue || void 0 !== negativeOption.presetArg && optionValue === negativeOption.presetArg)) return negativeOption;
                    return positiveOption || option;
                };
                const getErrorMessage = (option)=>{
                    const bestOption = findBestOptionFromValue(option);
                    const optionKey = bestOption.attributeName();
                    const source = this.getOptionValueSource(optionKey);
                    if ('env' === source) return `environment variable '${bestOption.envVar}'`;
                    return `option '${bestOption.flags}'`;
                };
                const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
                this.error(message, {
                    code: 'commander.conflictingOption'
                });
            }
            unknownOption(flag) {
                if (this._allowUnknownOption) return;
                let suggestion = '';
                if (flag.startsWith('--') && this._showSuggestionAfterError) {
                    let candidateFlags = [];
                    let command = this;
                    do {
                        const moreFlags = command.createHelp().visibleOptions(command).filter((option)=>option.long).map((option)=>option.long);
                        candidateFlags = candidateFlags.concat(moreFlags);
                        command = command.parent;
                    }while (command && !command._enablePositionalOptions);
                    suggestion = suggestSimilar(flag, candidateFlags);
                }
                const message = `error: unknown option '${flag}'${suggestion}`;
                this.error(message, {
                    code: 'commander.unknownOption'
                });
            }
            _excessArguments(receivedArgs) {
                if (this._allowExcessArguments) return;
                const expected = this.registeredArguments.length;
                const s = 1 === expected ? '' : 's';
                const forSubcommand = this.parent ? ` for '${this.name()}'` : '';
                const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
                this.error(message, {
                    code: 'commander.excessArguments'
                });
            }
            unknownCommand() {
                const unknownName = this.args[0];
                let suggestion = '';
                if (this._showSuggestionAfterError) {
                    const candidateNames = [];
                    this.createHelp().visibleCommands(this).forEach((command)=>{
                        candidateNames.push(command.name());
                        if (command.alias()) candidateNames.push(command.alias());
                    });
                    suggestion = suggestSimilar(unknownName, candidateNames);
                }
                const message = `error: unknown command '${unknownName}'${suggestion}`;
                this.error(message, {
                    code: 'commander.unknownCommand'
                });
            }
            version(str, flags, description) {
                if (void 0 === str) return this._version;
                this._version = str;
                flags = flags || '-V, --version';
                description = description || 'output the version number';
                const versionOption = this.createOption(flags, description);
                this._versionOptionName = versionOption.attributeName();
                this._registerOption(versionOption);
                this.on('option:' + versionOption.name(), ()=>{
                    this._outputConfiguration.writeOut(`${str}\n`);
                    this._exit(0, 'commander.version', str);
                });
                return this;
            }
            description(str, argsDescription) {
                if (void 0 === str && void 0 === argsDescription) return this._description;
                this._description = str;
                if (argsDescription) this._argsDescription = argsDescription;
                return this;
            }
            summary(str) {
                if (void 0 === str) return this._summary;
                this._summary = str;
                return this;
            }
            alias(alias) {
                if (void 0 === alias) return this._aliases[0];
                let command = this;
                if (0 !== this.commands.length && this.commands[this.commands.length - 1]._executableHandler) command = this.commands[this.commands.length - 1];
                if (alias === command._name) throw new Error("Command alias can't be the same as its name");
                const matchingCommand = this.parent?._findCommand(alias);
                if (matchingCommand) {
                    const existingCmd = [
                        matchingCommand.name()
                    ].concat(matchingCommand.aliases()).join('|');
                    throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
                }
                command._aliases.push(alias);
                return this;
            }
            aliases(aliases) {
                if (void 0 === aliases) return this._aliases;
                aliases.forEach((alias)=>this.alias(alias));
                return this;
            }
            usage(str) {
                if (void 0 === str) {
                    if (this._usage) return this._usage;
                    const args = this.registeredArguments.map((arg)=>humanReadableArgName(arg));
                    return [].concat(this.options.length || null !== this._helpOption ? '[options]' : [], this.commands.length ? '[command]' : [], this.registeredArguments.length ? args : []).join(' ');
                }
                this._usage = str;
                return this;
            }
            name(str) {
                if (void 0 === str) return this._name;
                this._name = str;
                return this;
            }
            nameFromFilename(filename) {
                this._name = path.basename(filename, path.extname(filename));
                return this;
            }
            executableDir(path) {
                if (void 0 === path) return this._executableDir;
                this._executableDir = path;
                return this;
            }
            helpInformation(contextOptions) {
                const helper = this.createHelp();
                const context = this._getOutputContext(contextOptions);
                helper.prepareContext({
                    error: context.error,
                    helpWidth: context.helpWidth,
                    outputHasColors: context.hasColors
                });
                const text = helper.formatHelp(this, helper);
                if (context.hasColors) return text;
                return this._outputConfiguration.stripColor(text);
            }
            _getOutputContext(contextOptions) {
                contextOptions = contextOptions || {};
                const error = !!contextOptions.error;
                let baseWrite;
                let hasColors;
                let helpWidth;
                if (error) {
                    baseWrite = (str)=>this._outputConfiguration.writeErr(str);
                    hasColors = this._outputConfiguration.getErrHasColors();
                    helpWidth = this._outputConfiguration.getErrHelpWidth();
                } else {
                    baseWrite = (str)=>this._outputConfiguration.writeOut(str);
                    hasColors = this._outputConfiguration.getOutHasColors();
                    helpWidth = this._outputConfiguration.getOutHelpWidth();
                }
                const write = (str)=>{
                    if (!hasColors) str = this._outputConfiguration.stripColor(str);
                    return baseWrite(str);
                };
                return {
                    error,
                    write,
                    hasColors,
                    helpWidth
                };
            }
            outputHelp(contextOptions) {
                let deprecatedCallback;
                if ('function' == typeof contextOptions) {
                    deprecatedCallback = contextOptions;
                    contextOptions = void 0;
                }
                const outputContext = this._getOutputContext(contextOptions);
                const eventContext = {
                    error: outputContext.error,
                    write: outputContext.write,
                    command: this
                };
                this._getCommandAndAncestors().reverse().forEach((command)=>command.emit('beforeAllHelp', eventContext));
                this.emit('beforeHelp', eventContext);
                let helpInformation = this.helpInformation({
                    error: outputContext.error
                });
                if (deprecatedCallback) {
                    helpInformation = deprecatedCallback(helpInformation);
                    if ('string' != typeof helpInformation && !Buffer.isBuffer(helpInformation)) throw new Error('outputHelp callback must return a string or a Buffer');
                }
                outputContext.write(helpInformation);
                if (this._getHelpOption()?.long) this.emit(this._getHelpOption().long);
                this.emit('afterHelp', eventContext);
                this._getCommandAndAncestors().forEach((command)=>command.emit('afterAllHelp', eventContext));
            }
            helpOption(flags, description) {
                if ('boolean' == typeof flags) {
                    if (flags) this._helpOption = this._helpOption ?? void 0;
                    else this._helpOption = null;
                    return this;
                }
                flags = flags ?? '-h, --help';
                description = description ?? 'display help for command';
                this._helpOption = this.createOption(flags, description);
                return this;
            }
            _getHelpOption() {
                if (void 0 === this._helpOption) this.helpOption(void 0, void 0);
                return this._helpOption;
            }
            addHelpOption(option) {
                this._helpOption = option;
                return this;
            }
            help(contextOptions) {
                this.outputHelp(contextOptions);
                let exitCode = Number(process1.exitCode ?? 0);
                if (0 === exitCode && contextOptions && 'function' != typeof contextOptions && contextOptions.error) exitCode = 1;
                this._exit(exitCode, 'commander.help', '(outputHelp)');
            }
            addHelpText(position, text) {
                const allowedValues = [
                    'beforeAll',
                    'before',
                    'after',
                    'afterAll'
                ];
                if (!allowedValues.includes(position)) throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
                const helpEvent = `${position}Help`;
                this.on(helpEvent, (context)=>{
                    let helpStr;
                    helpStr = 'function' == typeof text ? text({
                        error: context.error,
                        command: context.command
                    }) : text;
                    if (helpStr) context.write(`${helpStr}\n`);
                });
                return this;
            }
            _outputHelpIfRequested(args) {
                const helpOption = this._getHelpOption();
                const helpRequested = helpOption && args.find((arg)=>helpOption.is(arg));
                if (helpRequested) {
                    this.outputHelp();
                    this._exit(0, 'commander.helpDisplayed', '(outputHelp)');
                }
            }
        }
        function incrementNodeInspectorPort(args) {
            return args.map((arg)=>{
                if (!arg.startsWith('--inspect')) return arg;
                let debugOption;
                let debugHost = '127.0.0.1';
                let debugPort = '9229';
                let match;
                if (null !== (match = arg.match(/^(--inspect(-brk)?)$/))) debugOption = match[1];
                else if (null !== (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/))) {
                    debugOption = match[1];
                    if (/^\d+$/.test(match[3])) debugPort = match[3];
                    else debugHost = match[3];
                } else if (null !== (match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/))) {
                    debugOption = match[1];
                    debugHost = match[3];
                    debugPort = match[4];
                }
                if (debugOption && '0' !== debugPort) return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
                return arg;
            });
        }
        function useColor() {
            if (process1.env.NO_COLOR || '0' === process1.env.FORCE_COLOR || 'false' === process1.env.FORCE_COLOR) return false;
            if (process1.env.FORCE_COLOR || void 0 !== process1.env.CLICOLOR_FORCE) return true;
        }
        exports.Command = Command;
    },
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/error.js" (__unused_rspack_module, exports) {
        class CommanderError extends Error {
            constructor(exitCode, code, message){
                super(message);
                Error.captureStackTrace(this, this.constructor);
                this.name = this.constructor.name;
                this.code = code;
                this.exitCode = exitCode;
                this.nestedError = void 0;
            }
        }
        class InvalidArgumentError extends CommanderError {
            constructor(message){
                super(1, 'commander.invalidArgument', message);
                Error.captureStackTrace(this, this.constructor);
                this.name = this.constructor.name;
            }
        }
        exports.CommanderError = CommanderError;
        exports.InvalidArgumentError = InvalidArgumentError;
    },
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/help.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { humanReadableArgName } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/argument.js");
        class Help {
            constructor(){
                this.helpWidth = void 0;
                this.minWidthToWrap = 40;
                this.sortSubcommands = false;
                this.sortOptions = false;
                this.showGlobalOptions = false;
            }
            prepareContext(contextOptions) {
                this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
            }
            visibleCommands(cmd) {
                const visibleCommands = cmd.commands.filter((cmd)=>!cmd._hidden);
                const helpCommand = cmd._getHelpCommand();
                if (helpCommand && !helpCommand._hidden) visibleCommands.push(helpCommand);
                if (this.sortSubcommands) visibleCommands.sort((a, b)=>a.name().localeCompare(b.name()));
                return visibleCommands;
            }
            compareOptions(a, b) {
                const getSortKey = (option)=>option.short ? option.short.replace(/^-/, '') : option.long.replace(/^--/, '');
                return getSortKey(a).localeCompare(getSortKey(b));
            }
            visibleOptions(cmd) {
                const visibleOptions = cmd.options.filter((option)=>!option.hidden);
                const helpOption = cmd._getHelpOption();
                if (helpOption && !helpOption.hidden) {
                    const removeShort = helpOption.short && cmd._findOption(helpOption.short);
                    const removeLong = helpOption.long && cmd._findOption(helpOption.long);
                    if (removeShort || removeLong) {
                        if (helpOption.long && !removeLong) visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
                        else if (helpOption.short && !removeShort) visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
                    } else visibleOptions.push(helpOption);
                }
                if (this.sortOptions) visibleOptions.sort(this.compareOptions);
                return visibleOptions;
            }
            visibleGlobalOptions(cmd) {
                if (!this.showGlobalOptions) return [];
                const globalOptions = [];
                for(let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent){
                    const visibleOptions = ancestorCmd.options.filter((option)=>!option.hidden);
                    globalOptions.push(...visibleOptions);
                }
                if (this.sortOptions) globalOptions.sort(this.compareOptions);
                return globalOptions;
            }
            visibleArguments(cmd) {
                if (cmd._argsDescription) cmd.registeredArguments.forEach((argument)=>{
                    argument.description = argument.description || cmd._argsDescription[argument.name()] || '';
                });
                if (cmd.registeredArguments.find((argument)=>argument.description)) return cmd.registeredArguments;
                return [];
            }
            subcommandTerm(cmd) {
                const args = cmd.registeredArguments.map((arg)=>humanReadableArgName(arg)).join(' ');
                return cmd._name + (cmd._aliases[0] ? '|' + cmd._aliases[0] : '') + (cmd.options.length ? ' [options]' : '') + (args ? ' ' + args : '');
            }
            optionTerm(option) {
                return option.flags;
            }
            argumentTerm(argument) {
                return argument.name();
            }
            longestSubcommandTermLength(cmd, helper) {
                return helper.visibleCommands(cmd).reduce((max, command)=>Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command)))), 0);
            }
            longestOptionTermLength(cmd, helper) {
                return helper.visibleOptions(cmd).reduce((max, option)=>Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))), 0);
            }
            longestGlobalOptionTermLength(cmd, helper) {
                return helper.visibleGlobalOptions(cmd).reduce((max, option)=>Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))), 0);
            }
            longestArgumentTermLength(cmd, helper) {
                return helper.visibleArguments(cmd).reduce((max, argument)=>Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument)))), 0);
            }
            commandUsage(cmd) {
                let cmdName = cmd._name;
                if (cmd._aliases[0]) cmdName = cmdName + '|' + cmd._aliases[0];
                let ancestorCmdNames = '';
                for(let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent)ancestorCmdNames = ancestorCmd.name() + ' ' + ancestorCmdNames;
                return ancestorCmdNames + cmdName + ' ' + cmd.usage();
            }
            commandDescription(cmd) {
                return cmd.description();
            }
            subcommandDescription(cmd) {
                return cmd.summary() || cmd.description();
            }
            optionDescription(option) {
                const extraInfo = [];
                if (option.argChoices) extraInfo.push(`choices: ${option.argChoices.map((choice)=>JSON.stringify(choice)).join(', ')}`);
                if (void 0 !== option.defaultValue) {
                    const showDefault = option.required || option.optional || option.isBoolean() && 'boolean' == typeof option.defaultValue;
                    if (showDefault) extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
                }
                if (void 0 !== option.presetArg && option.optional) extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
                if (void 0 !== option.envVar) extraInfo.push(`env: ${option.envVar}`);
                if (extraInfo.length > 0) return `${option.description} (${extraInfo.join(', ')})`;
                return option.description;
            }
            argumentDescription(argument) {
                const extraInfo = [];
                if (argument.argChoices) extraInfo.push(`choices: ${argument.argChoices.map((choice)=>JSON.stringify(choice)).join(', ')}`);
                if (void 0 !== argument.defaultValue) extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
                if (extraInfo.length > 0) {
                    const extraDescription = `(${extraInfo.join(', ')})`;
                    if (argument.description) return `${argument.description} ${extraDescription}`;
                    return extraDescription;
                }
                return argument.description;
            }
            formatHelp(cmd, helper) {
                const termWidth = helper.padWidth(cmd, helper);
                const helpWidth = helper.helpWidth ?? 80;
                function callFormatItem(term, description) {
                    return helper.formatItem(term, termWidth, description, helper);
                }
                let output = [
                    `${helper.styleTitle('Usage:')} ${helper.styleUsage(helper.commandUsage(cmd))}`,
                    ''
                ];
                const commandDescription = helper.commandDescription(cmd);
                if (commandDescription.length > 0) output = output.concat([
                    helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
                    ''
                ]);
                const argumentList = helper.visibleArguments(cmd).map((argument)=>callFormatItem(helper.styleArgumentTerm(helper.argumentTerm(argument)), helper.styleArgumentDescription(helper.argumentDescription(argument))));
                if (argumentList.length > 0) output = output.concat([
                    helper.styleTitle('Arguments:'),
                    ...argumentList,
                    ''
                ]);
                const optionList = helper.visibleOptions(cmd).map((option)=>callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option))));
                if (optionList.length > 0) output = output.concat([
                    helper.styleTitle('Options:'),
                    ...optionList,
                    ''
                ]);
                if (helper.showGlobalOptions) {
                    const globalOptionList = helper.visibleGlobalOptions(cmd).map((option)=>callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option))));
                    if (globalOptionList.length > 0) output = output.concat([
                        helper.styleTitle('Global Options:'),
                        ...globalOptionList,
                        ''
                    ]);
                }
                const commandList = helper.visibleCommands(cmd).map((cmd)=>callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(cmd)), helper.styleSubcommandDescription(helper.subcommandDescription(cmd))));
                if (commandList.length > 0) output = output.concat([
                    helper.styleTitle('Commands:'),
                    ...commandList,
                    ''
                ]);
                return output.join('\n');
            }
            displayWidth(str) {
                return stripColor(str).length;
            }
            styleTitle(str) {
                return str;
            }
            styleUsage(str) {
                return str.split(' ').map((word)=>{
                    if ('[options]' === word) return this.styleOptionText(word);
                    if ('[command]' === word) return this.styleSubcommandText(word);
                    if ('[' === word[0] || '<' === word[0]) return this.styleArgumentText(word);
                    return this.styleCommandText(word);
                }).join(' ');
            }
            styleCommandDescription(str) {
                return this.styleDescriptionText(str);
            }
            styleOptionDescription(str) {
                return this.styleDescriptionText(str);
            }
            styleSubcommandDescription(str) {
                return this.styleDescriptionText(str);
            }
            styleArgumentDescription(str) {
                return this.styleDescriptionText(str);
            }
            styleDescriptionText(str) {
                return str;
            }
            styleOptionTerm(str) {
                return this.styleOptionText(str);
            }
            styleSubcommandTerm(str) {
                return str.split(' ').map((word)=>{
                    if ('[options]' === word) return this.styleOptionText(word);
                    if ('[' === word[0] || '<' === word[0]) return this.styleArgumentText(word);
                    return this.styleSubcommandText(word);
                }).join(' ');
            }
            styleArgumentTerm(str) {
                return this.styleArgumentText(str);
            }
            styleOptionText(str) {
                return str;
            }
            styleArgumentText(str) {
                return str;
            }
            styleSubcommandText(str) {
                return str;
            }
            styleCommandText(str) {
                return str;
            }
            padWidth(cmd, helper) {
                return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
            }
            preformatted(str) {
                return /\n[^\S\r\n]/.test(str);
            }
            formatItem(term, termWidth, description, helper) {
                const itemIndent = 2;
                const itemIndentStr = ' '.repeat(itemIndent);
                if (!description) return itemIndentStr + term;
                const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
                const spacerWidth = 2;
                const helpWidth = this.helpWidth ?? 80;
                const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
                let formattedDescription;
                if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) formattedDescription = description;
                else {
                    const wrappedDescription = helper.boxWrap(description, remainingWidth);
                    formattedDescription = wrappedDescription.replace(/\n/g, '\n' + ' '.repeat(termWidth + spacerWidth));
                }
                return itemIndentStr + paddedTerm + ' '.repeat(spacerWidth) + formattedDescription.replace(/\n/g, `\n${itemIndentStr}`);
            }
            boxWrap(str, width) {
                if (width < this.minWidthToWrap) return str;
                const rawLines = str.split(/\r\n|\n/);
                const chunkPattern = /[\s]*[^\s]+/g;
                const wrappedLines = [];
                rawLines.forEach((line)=>{
                    const chunks = line.match(chunkPattern);
                    if (null === chunks) return void wrappedLines.push('');
                    let sumChunks = [
                        chunks.shift()
                    ];
                    let sumWidth = this.displayWidth(sumChunks[0]);
                    chunks.forEach((chunk)=>{
                        const visibleWidth = this.displayWidth(chunk);
                        if (sumWidth + visibleWidth <= width) {
                            sumChunks.push(chunk);
                            sumWidth += visibleWidth;
                            return;
                        }
                        wrappedLines.push(sumChunks.join(''));
                        const nextChunk = chunk.trimStart();
                        sumChunks = [
                            nextChunk
                        ];
                        sumWidth = this.displayWidth(nextChunk);
                    });
                    wrappedLines.push(sumChunks.join(''));
                });
                return wrappedLines.join('\n');
            }
        }
        function stripColor(str) {
            const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
            return str.replace(sgrPattern, '');
        }
        exports.Help = Help;
        exports.stripColor = stripColor;
    },
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/option.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { InvalidArgumentError } = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/error.js");
        class Option {
            constructor(flags, description){
                this.flags = flags;
                this.description = description || '';
                this.required = flags.includes('<');
                this.optional = flags.includes('[');
                this.variadic = /\w\.\.\.[>\]]$/.test(flags);
                this.mandatory = false;
                const optionFlags = splitOptionFlags(flags);
                this.short = optionFlags.shortFlag;
                this.long = optionFlags.longFlag;
                this.negate = false;
                if (this.long) this.negate = this.long.startsWith('--no-');
                this.defaultValue = void 0;
                this.defaultValueDescription = void 0;
                this.presetArg = void 0;
                this.envVar = void 0;
                this.parseArg = void 0;
                this.hidden = false;
                this.argChoices = void 0;
                this.conflictsWith = [];
                this.implied = void 0;
            }
            default(value, description) {
                this.defaultValue = value;
                this.defaultValueDescription = description;
                return this;
            }
            preset(arg) {
                this.presetArg = arg;
                return this;
            }
            conflicts(names) {
                this.conflictsWith = this.conflictsWith.concat(names);
                return this;
            }
            implies(impliedOptionValues) {
                let newImplied = impliedOptionValues;
                if ('string' == typeof impliedOptionValues) newImplied = {
                    [impliedOptionValues]: true
                };
                this.implied = Object.assign(this.implied || {}, newImplied);
                return this;
            }
            env(name) {
                this.envVar = name;
                return this;
            }
            argParser(fn) {
                this.parseArg = fn;
                return this;
            }
            makeOptionMandatory(mandatory = true) {
                this.mandatory = !!mandatory;
                return this;
            }
            hideHelp(hide = true) {
                this.hidden = !!hide;
                return this;
            }
            _concatValue(value, previous) {
                if (previous === this.defaultValue || !Array.isArray(previous)) return [
                    value
                ];
                return previous.concat(value);
            }
            choices(values) {
                this.argChoices = values.slice();
                this.parseArg = (arg, previous)=>{
                    if (!this.argChoices.includes(arg)) throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
                    if (this.variadic) return this._concatValue(arg, previous);
                    return arg;
                };
                return this;
            }
            name() {
                if (this.long) return this.long.replace(/^--/, '');
                return this.short.replace(/^-/, '');
            }
            attributeName() {
                if (this.negate) return camelcase(this.name().replace(/^no-/, ''));
                return camelcase(this.name());
            }
            is(arg) {
                return this.short === arg || this.long === arg;
            }
            isBoolean() {
                return !this.required && !this.optional && !this.negate;
            }
        }
        class DualOptions {
            constructor(options){
                this.positiveOptions = new Map();
                this.negativeOptions = new Map();
                this.dualOptions = new Set();
                options.forEach((option)=>{
                    if (option.negate) this.negativeOptions.set(option.attributeName(), option);
                    else this.positiveOptions.set(option.attributeName(), option);
                });
                this.negativeOptions.forEach((value, key)=>{
                    if (this.positiveOptions.has(key)) this.dualOptions.add(key);
                });
            }
            valueFromOption(value, option) {
                const optionKey = option.attributeName();
                if (!this.dualOptions.has(optionKey)) return true;
                const preset = this.negativeOptions.get(optionKey).presetArg;
                const negativeValue = void 0 !== preset ? preset : false;
                return option.negate === (negativeValue === value);
            }
        }
        function camelcase(str) {
            return str.split('-').reduce((str, word)=>str + word[0].toUpperCase() + word.slice(1));
        }
        function splitOptionFlags(flags) {
            let shortFlag;
            let longFlag;
            const shortFlagExp = /^-[^-]$/;
            const longFlagExp = /^--[^-]/;
            const flagParts = flags.split(/[ |,]+/).concat('guard');
            if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
            if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
            if (!shortFlag && shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
            if (!shortFlag && longFlagExp.test(flagParts[0])) {
                shortFlag = longFlag;
                longFlag = flagParts.shift();
            }
            if (flagParts[0].startsWith('-')) {
                const unsupportedFlag = flagParts[0];
                const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
                if (/^-[^-][^-]/.test(unsupportedFlag)) throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
                if (shortFlagExp.test(unsupportedFlag)) throw new Error(`${baseError}
- too many short flags`);
                if (longFlagExp.test(unsupportedFlag)) throw new Error(`${baseError}
- too many long flags`);
                throw new Error(`${baseError}
- unrecognised flag format`);
            }
            if (void 0 === shortFlag && void 0 === longFlag) throw new Error(`option creation failed due to no flags found in '${flags}'.`);
            return {
                shortFlag,
                longFlag
            };
        }
        exports.Option = Option;
        exports.DualOptions = DualOptions;
    },
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/suggestSimilar.js" (__unused_rspack_module, exports) {
        const maxDistance = 3;
        function editDistance(a, b) {
            if (Math.abs(a.length - b.length) > maxDistance) return Math.max(a.length, b.length);
            const d = [];
            for(let i = 0; i <= a.length; i++)d[i] = [
                i
            ];
            for(let j = 0; j <= b.length; j++)d[0][j] = j;
            for(let j = 1; j <= b.length; j++)for(let i = 1; i <= a.length; i++){
                let cost = 1;
                cost = a[i - 1] === b[j - 1] ? 0 : 1;
                d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
                if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
            return d[a.length][b.length];
        }
        function suggestSimilar(word, candidates) {
            if (!candidates || 0 === candidates.length) return '';
            candidates = Array.from(new Set(candidates));
            const searchingOptions = word.startsWith('--');
            if (searchingOptions) {
                word = word.slice(2);
                candidates = candidates.map((candidate)=>candidate.slice(2));
            }
            let similar = [];
            let bestDistance = maxDistance;
            const minSimilarity = 0.4;
            candidates.forEach((candidate)=>{
                if (candidate.length <= 1) return;
                const distance = editDistance(word, candidate);
                const length = Math.max(word.length, candidate.length);
                const similarity = (length - distance) / length;
                if (similarity > minSimilarity) {
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        similar = [
                            candidate
                        ];
                    } else if (distance === bestDistance) similar.push(candidate);
                }
            });
            similar.sort((a, b)=>a.localeCompare(b));
            if (searchingOptions) similar = similar.map((candidate)=>`--${candidate}`);
            if (similar.length > 1) return `\n(Did you mean one of ${similar.join(', ')}?)`;
            if (1 === similar.length) return `\n(Did you mean ${similar[0]}?)`;
            return '';
        }
        exports.suggestSimilar = suggestSimilar;
    }
});
const commander = __webpack_require__("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/index.js");
const { DM: esm_program, gu: createCommand, er: createArgument, Ww: createOption, b7: CommanderError, Di: InvalidArgumentError, a2: InvalidOptionArgumentError, uB: Command, ef: Argument, c$: Option, _V: Help } = commander;
function getEnumValues(entries) {
    const numericValues = Object.values(entries).filter((v)=>"number" == typeof v);
    const values = Object.entries(entries).filter(([k, _])=>-1 === numericValues.indexOf(+k)).map(([_, v])=>v);
    return values;
}
function joinValues(array, separator = "|") {
    return array.map((val)=>stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
    if ("bigint" == typeof value) return value.toString();
    return value;
}
class Cached {
    constructor(getter){
        this._getter = getter;
        this._value = void 0;
    }
    get value() {
        const getter = this._getter;
        if (void 0 !== getter) {
            this._value = getter();
            this._getter = void 0;
        }
        return this._value;
    }
}
function util_cached(getter) {
    return new Cached(getter);
}
function nullish(input) {
    return null == input;
}
function cleanRegex(source) {
    const start = source.startsWith("^") ? 1 : 0;
    const end = source.endsWith("$") ? source.length - 1 : source.length;
    return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
    const ratio = val / step;
    const roundedRatio = Math.round(ratio);
    const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
    if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
    return ratio - roundedRatio;
}
const EVALUATING = /* @__PURE__*/ Symbol("evaluating");
function defineLazy(object, key, getter) {
    let value;
    Object.defineProperty(object, key, {
        get () {
            if (value === EVALUATING) return;
            if (void 0 === value) {
                value = EVALUATING;
                value = getter();
            }
            return value;
        },
        set (v) {
            Object.defineProperty(object, key, {
                value: v
            });
        },
        configurable: true
    });
}
function util_assignProp(target, prop, value) {
    Object.defineProperty(target, prop, {
        value,
        writable: true,
        enumerable: true,
        configurable: true
    });
}
function rawShape(def) {
    const desc = Object.getOwnPropertyDescriptor(def, "shape");
    return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
    return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
    Object.defineProperty(target, key, {
        get () {
            const value = getter();
            util_assignProp(this, key, value);
            return value;
        },
        enumerable: true,
        configurable: true
    });
}
function putProp(target, key, value) {
    if (key in target) util_assignProp(target, key, value);
    else target[key] = value;
}
function mirrorShape(target, source, keys, wrap) {
    const raw = sourceShape(source);
    for (const key of keys){
        const desc = Object.getOwnPropertyDescriptor(raw, key);
        if (desc.enumerable) if (desc.get) deferProp(target, key, ()=>{
            const value = source._zod.def.shape[key];
            return wrap ? wrap(value, key) : value;
        });
        else putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
    }
}
function mirrorProps(target, source) {
    for (const key of Reflect.ownKeys(source)){
        const desc = Object.getOwnPropertyDescriptor(source, key);
        if (desc.enumerable) if (desc.get) deferProp(target, key, ()=>source[key]);
        else putProp(target, key, desc.value);
    }
}
function mergeDefs(...defs) {
    const mergedDescriptors = {};
    for (const def of defs){
        const descriptors = Object.getOwnPropertyDescriptors(def);
        Object.assign(mergedDescriptors, descriptors);
    }
    return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
    return JSON.stringify(str);
}
function slugify(input) {
    return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args)=>{};
function util_isObject(data) {
    return "object" == typeof data && null !== data && !Array.isArray(data);
}
const util_allowsEval = /* @__PURE__*/ util_cached(()=>{
    if (globalConfig.jitless) return false;
    if ("u" > typeof navigator && navigator?.userAgent?.includes("Cloudflare")) return false;
    try {
        const F = Function;
        new F("");
        return true;
    } catch (_) {
        return false;
    }
});
function isPlainObject(o) {
    if (false === util_isObject(o)) return false;
    const ctor = o.constructor;
    if (void 0 === ctor) return true;
    if ("function" != typeof ctor) return true;
    const prot = ctor.prototype;
    if (false === util_isObject(prot)) return false;
    if (false === Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf")) return false;
    return true;
}
function shallowClone(o) {
    if (isPlainObject(o)) return {
        ...o
    };
    if (Array.isArray(o)) return [
        ...o
    ];
    if (o instanceof Map) return new Map(o);
    if (o instanceof Set) return new Set(o);
    return o;
}
const propertyKeyTypes = /* @__PURE__*/ new Set([
    "string",
    "number",
    "symbol"
]);
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
    const cl = new inst._zod.constr(def ?? inst._zod.def);
    if (!def || params?.parent) cl._zod.parent = inst;
    return cl;
}
function normalizeParams(_params) {
    const params = _params;
    if (!params) return {};
    if ("string" == typeof params) return {
        error: ()=>params
    };
    if (params?.message !== void 0) {
        if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
        params.error = params.message;
    }
    delete params.message;
    if ("string" == typeof params.error) return {
        ...params,
        error: ()=>params.error
    };
    return params;
}
function stringifyPrimitive(value) {
    if ("bigint" == typeof value) return value.toString() + "n";
    if ("string" == typeof value) return `"${value}"`;
    return `${value}`;
}
function optionalKeys(shape) {
    return Object.keys(shape).filter((k)=>void 0 !== shape[k]._zod.optin && "optional" === shape[k]._zod.optout);
}
// Wrapped in a `@__PURE__` IIFE: esbuild never tree-shakes a top-level initializer that contains a member access on `Number`, so the bare object literal survived into every bundle.
const NUMBER_FORMAT_RANGES = /*@__PURE__*/ (()=>({
        safeint: [
            Number.MIN_SAFE_INTEGER,
            Number.MAX_SAFE_INTEGER
        ],
        int32: [
            -2147483648,
            2147483647
        ],
        uint32: [
            0,
            4294967295
        ],
        float32: [
            -3.4028234663852886e+38,
            3.4028234663852886e38
        ],
        float64: [
            -Number.MAX_VALUE,
            Number.MAX_VALUE
        ]
    }))();
const BIGINT_FORMAT_RANGES = {
    int64: [
        /* @__PURE__*/ BigInt("-9223372036854775808"),
        /* @__PURE__*/ BigInt("9223372036854775807")
    ],
    uint64: [
        /* @__PURE__*/ BigInt(0),
        /* @__PURE__*/ BigInt("18446744073709551615")
    ]
};
function pick(schema, mask) {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) throw new Error(".pick() cannot be used on object schemas containing refinements");
    const newShape = {};
    mirrorShape(newShape, schema, maskedKeys(schema, mask));
    return clone(schema, mergeDefs(currDef, {
        shape: newShape,
        checks: []
    }));
}
function maskedKeys(schema, mask) {
    const raw = sourceShape(schema);
    const keys = [];
    for (const key of Reflect.ownKeys(mask)){
        if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) throw new Error(`Unrecognized key: "${String(key)}"`);
        if (mask[key]) keys.push(key);
    }
    return keys;
}
function omit(schema, mask) {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) throw new Error(".omit() cannot be used on object schemas containing refinements");
    const omitted = new Set(maskedKeys(schema, mask));
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key)=>!omitted.has(key)));
    return clone(schema, mergeDefs(currDef, {
        shape: newShape,
        checks: []
    }));
}
function extend(schema, shape) {
    if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
    const checks = schema._zod.def.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        const existingShape = sourceShape(schema);
        for (const key of Reflect.ownKeys(shape))if (void 0 !== Object.getOwnPropertyDescriptor(existingShape, key)) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
    }
    return clone(schema, mergeDefs(schema._zod.def, {
        shape: extended(schema, shape)
    }));
}
function extended(schema, shape) {
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
    mirrorProps(newShape, shape);
    return newShape;
}
function safeExtend(schema, shape) {
    if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
    return clone(schema, mergeDefs(schema._zod.def, {
        shape: extended(schema, shape)
    }));
}
function util_merge(a, b) {
    if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
    if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
    const newShape = {};
    mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
    mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
    const def = mergeDefs(a._zod.def, {
        shape: newShape,
        get catchall () {
            return b._zod.def.catchall;
        },
        checks: b._zod.def.checks ?? []
    });
    return clone(a, def);
}
function util_partial(Class, schema, mask, name = "partial") {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
    const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key)=>selected && !selected.has(key) ? value : new Class({
            type: "optional",
            innerType: value
        })));
    return clone(schema, mergeDefs(schema._zod.def, {
        shape: newShape,
        checks: []
    }));
}
function util_required(Class, schema, mask) {
    const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
    const newShape = {};
    mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key)=>selected && !selected.has(key) ? value : new Class({
            type: "nonoptional",
            innerType: value
        }));
    return clone(schema, mergeDefs(schema._zod.def, {
        shape: newShape
    }));
}
function aborted(x, startIndex = 0) {
    if (true === x.aborted) return true;
    for(let i = startIndex; i < x.issues.length; i++)if (x.issues[i]?.continue !== true) return true;
    return false;
}
function explicitlyAborted(x, startIndex = 0) {
    if (true === x.aborted) return true;
    for(let i = startIndex; i < x.issues.length; i++)if (x.issues[i]?.continue === false) return true;
    return false;
}
function prefixIssues(path, issues) {
    return issues.map((iss)=>{
        var _a;
        (_a = iss).path ?? (_a.path = []);
        iss.path.unshift(path);
        return iss;
    });
}
function unwrapMessage(message) {
    return "string" == typeof message ? message : message?.message;
}
function sizeCaps(defChecks) {
    const caps = [];
    for (const ch of defChecks ?? []){
        const d = ch._zod.def;
        if (!/_(length|size)$|_equals$/.test(d.check)) break;
        const max = d.maximum ?? d.length ?? d.size;
        if (max >= 0) caps.push([
            max,
            ch
        ]);
    }
    return caps;
}
function attachSchema(issues, start, inst) {
    var _a;
    for(let i = start; i < issues.length; i++)(_a = issues[i]).schema ?? (_a.schema = inst);
}
function finalizeIssue(iss, ctx, config) {
    var _a;
    const traits = iss.inst?._zod?.traits;
    if (traits?.has("$ZodType")) if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
    else iss.schema = iss.inst;
    const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
    const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
    const full = {};
    for (const k of Object.keys(iss))if ("inst" !== k && "schema" !== k && "continue" !== k && "input" !== k && "__proto__" !== k) full[k] = iss[k];
    full.path ?? (full.path = []);
    full.message = message;
    if (ctx?.reportInput) full.input = iss.input;
    return full;
}
const highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
    const units = str.length;
    if (!highSurrogate.test(str)) return units;
    let count = units;
    for(let i = 0; i < units - 1; i++)if ((0xfc00 & str.charCodeAt(i)) === 0xd800 && (0xfc00 & str.charCodeAt(i + 1)) === 0xdc00) {
        count--;
        i++;
    }
    return count;
}
function getLengthableOrigin(input) {
    if (Array.isArray(input)) return "array";
    if ("string" == typeof input) return "string";
    return "unknown";
}
function parsedType(data) {
    const t = typeof data;
    switch(t){
        case "number":
            return Number.isNaN(data) ? "nan" : "number";
        case "object":
            {
                if (null === data) return "null";
                if (Array.isArray(data)) return "array";
                const obj = data;
                if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
            }
    }
    return t;
}
function util_issue(...args) {
    const [iss, input, inst] = args;
    if ("string" == typeof iss) return {
        message: iss,
        code: "custom",
        input,
        inst
    };
    return {
        ...iss
    };
}
function util_members(proto, table) {
    for(const key in table){
        const desc = Object.getOwnPropertyDescriptor(table, key);
        if (desc.get) Object.defineProperty(proto, key, {
            ...desc,
            enumerable: false
        });
        else defineBound(proto, key, desc.value);
    }
}
function util_own(inst, key, value, enumerable = true) {
    Object.defineProperty(inst, key, {
        configurable: true,
        writable: true,
        enumerable,
        value
    });
    return value;
}
function hide(inst, key, value) {
    return util_own(inst, key, value, false);
}
function derived(computes, table) {
    for(const key in computes){
        const compute = computes[key];
        Object.defineProperty(table, key, {
            configurable: true,
            enumerable: true,
            get () {
                return util_own(this, key, compute(this));
            },
            set (value) {
                util_own(this, key, value);
            }
        });
    }
    return table;
}
function defineBound(proto, key, fn) {
    Object.defineProperty(proto, key, {
        configurable: true,
        get () {
            return this == null ? fn : util_own(this, key, fn.bind(this));
        },
        set (value) {
            util_own(this, key, value);
        }
    });
}
function claim(inst, sentinel) {
    const proto = Object.getPrototypeOf(inst);
    return sentinel in proto ? void 0 : proto;
}
let installing;
let broke = false;
const breaker = {
    configurable: true,
    get () {
        broke = true;
    }
};
function defineLazyInternal(inst, key, compute) {
    const proto = Object.getPrototypeOf(inst._zod);
    if (key in proto && installing !== inst._zod) {
        installing = void 0;
        return;
    }
    installing = inst._zod;
    Object.defineProperty(proto, key, {
        configurable: true,
        get () {
            Object.defineProperty(this, key, breaker);
            const outer = broke;
            broke = false;
            try {
                const value = compute(this);
                if (broke) delete this[key];
                else Object.defineProperty(this, key, {
                    configurable: true,
                    writable: true,
                    value
                });
                broke = broke || outer;
                return value;
            } catch (err) {
                delete this[key];
                broke = broke || outer;
                throw err;
            }
        },
        set (value) {
            Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                value
            });
        }
    });
}
function installLazyProp(inst, key, make, enumerable) {
    const proto = claim(inst, key);
    if (!proto) return;
    Object.defineProperty(proto, key, {
        configurable: true,
        get () {
            const desc = {
                configurable: true,
                writable: true,
                enumerable,
                value: void 0
            };
            Object.defineProperty(this, key, desc);
            desc.value = make(this);
            Object.defineProperty(this, key, desc);
            return desc.value;
        },
        set (value) {
            Object.defineProperty(this, key, {
                configurable: true,
                writable: true,
                enumerable,
                value
            });
        }
    });
}
const CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
    const fn = ()=>value;
    fn[CONSTANT_CATCH] = true;
    return fn;
}
var core_a;
const _zodDesc = {
    value: void 0,
    enumerable: false
};
let _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
    const E = _E;
    if (E) {
        const saved = E.stackTraceLimit;
        if ("number" == typeof saved) {
            try {
                E.stackTraceLimit = 0;
            } catch  {
                _E = null;
                return new Definition();
            }
            try {
                return new Definition();
            } finally{
                E.stackTraceLimit = saved;
            }
        }
    }
    return new Definition();
}
function $constructor(name, initializer, proto, params) {
    const zodProto = {};
    function Internals(def) {
        this.def = def;
        this.constr = _;
        this.traits = new Set();
    }
    Internals.prototype = zodProto;
    const protoMembers = proto;
    const initialized = protoMembers && new WeakSet();
    function init(inst, def) {
        if (inst._zod) {
            if (inst._zod.traits.has(name)) return;
        } else {
            _zodDesc.value = new Internals(def);
            try {
                Object.defineProperty(inst, "_zod", _zodDesc);
            } finally{
                _zodDesc.value = void 0;
            }
        }
        inst._zod.traits.add(name);
        initializer(inst, def);
        if (initialized) {
            const own = Object.getPrototypeOf(inst);
            const ctorProto = inst._zod.constr.prototype;
            let up = own;
            while(up && up !== ctorProto)up = Object.getPrototypeOf(up);
            const target = up ?? own;
            if (!initialized.has(target)) {
                initialized.add(target);
                util_members(target, protoMembers);
            }
        }
        const proto = _.prototype;
        for(const k in proto)if (Object.prototype.hasOwnProperty.call(proto, k)) {
            if (!(k in inst)) inst[k] = proto[k].bind(inst);
        }
    }
    const Parent = params?.Parent ?? Object;
    class Definition extends Parent {
    }
    Object.defineProperty(Definition, "name", {
        value: name
    });
    function _(def) {
        const inst = params?.Parent ? newError(Definition) : this;
        init(inst, def);
        const deferred = inst._zod.deferred;
        if (deferred) {
            for (const fn of deferred)fn();
            inst._zod.deferred = void 0;
        }
        const pp = globalThis.__zod_globalConfig?.postProcessor;
        if (pp) pp(inst);
        return inst;
    }
    Object.defineProperty(_, "init", {
        value: init
    });
    Object.defineProperty(_, Symbol.hasInstance, {
        value: (inst)=>{
            if (params?.Parent && inst instanceof params.Parent) return true;
            return inst?._zod?.traits?.has(name);
        }
    });
    Object.defineProperty(_, "name", {
        value: name
    });
    return _;
}
class $ZodAsyncError extends Error {
    constructor(){
        super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
    }
}
class $ZodEncodeError extends Error {
    constructor(name){
        super(`Encountered unidirectional transform during encode: ${name}`);
        this.name = "ZodEncodeError";
    }
}
(core_a = globalThis).__zod_globalConfig ?? (core_a.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function core_config(newConfig) {
    if (newConfig) Object.assign(globalConfig, newConfig);
    return globalConfig;
}
function _getMessage() {
    const internals = this._zod;
    internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
    return internals.message;
}
function _setMessage(value) {
    this._zod.message = value;
}
const _messageDesc = {
    get: _getMessage,
    set: _setMessage,
    enumerable: true,
    configurable: true
};
const _issuesDesc = {
    value: void 0,
    enumerable: false
};
const _installedToString = /* @__PURE__ */ new WeakSet([
    Object.prototype,
    Error.prototype
]);
const errors_initializer = (inst, def)=>{
    inst.name = "$ZodError";
    _issuesDesc.value = def;
    Object.defineProperty(inst, "issues", _issuesDesc);
    _issuesDesc.value = void 0;
    Object.defineProperty(inst, "message", _messageDesc);
    const proto = Object.getPrototypeOf(inst);
    if (!_installedToString.has(proto)) {
        _installedToString.add(proto);
        Object.defineProperty(proto, "toString", {
            configurable: true,
            enumerable: false,
            get () {
                const value = ()=>this.message;
                Object.defineProperty(this, "toString", {
                    value,
                    configurable: true,
                    writable: true
                });
                return value;
            },
            set (value) {
                Object.defineProperty(this, "toString", {
                    value,
                    configurable: true,
                    writable: true
                });
            }
        });
    }
};
const $ZodError = $constructor("$ZodError", errors_initializer);
$constructor("$ZodError", errors_initializer, void 0, {
    Parent: Error
});
function errors_node(obj, key, make) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) if ("__proto__" === key) Object.defineProperty(obj, key, {
        value: make(),
        writable: true,
        enumerable: true,
        configurable: true
    });
    else obj[key] = make();
    return obj[key];
}
function flattenError(error, mapper = (issue)=>issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of error.issues)if (sub.path.length > 0) errors_node(fieldErrors, sub.path[0], ()=>[]).push(mapper(sub));
    else formErrors.push(mapper(sub));
    return {
        formErrors,
        fieldErrors
    };
}
function formatError(error, mapper = (issue)=>issue.message) {
    const fieldErrors = {
        _errors: []
    };
    const processError = (error, path = [])=>{
        for (const issue of error.issues)if ("invalid_union" === issue.code && issue.errors.length) issue.errors.map((issues)=>processError({
                issues
            }, [
                ...path,
                ...issue.path
            ]));
        else if ("invalid_key" === issue.code) processError({
            issues: issue.issues
        }, [
            ...path,
            ...issue.path
        ]);
        else if ("invalid_element" === issue.code) processError({
            issues: issue.issues
        }, [
            ...path,
            ...issue.path
        ]);
        else {
            const fullpath = [
                ...path,
                ...issue.path
            ];
            if (0 === fullpath.length) fieldErrors._errors.push(mapper(issue));
            else {
                let curr = fieldErrors;
                let i = 0;
                while(i < fullpath.length){
                    const el = fullpath[i];
                    const terminal = i === fullpath.length - 1;
                    if ("_errors" === el) {
                        if (terminal) curr._errors.push(mapper(issue));
                        i++;
                        continue;
                    }
                    if (!Object.prototype.hasOwnProperty.call(curr, el)) Object.defineProperty(curr, el, {
                        value: {
                            _errors: []
                        },
                        enumerable: true,
                        writable: true,
                        configurable: true
                    });
                    const node = curr[el];
                    if (terminal) node._errors.push(mapper(issue));
                    curr = node;
                    i++;
                }
            }
        }
    };
    processError(error);
    return fieldErrors;
}
const _installedErrorProtos = /* @__PURE__ */ new WeakSet([
    Object.prototype,
    Error.prototype
]);
function _lazyMethod(proto, key, make) {
    Object.defineProperty(proto, key, {
        configurable: true,
        enumerable: false,
        get () {
            const value = make(this);
            Object.defineProperty(this, key, {
                value,
                configurable: true,
                writable: true
            });
            return value;
        },
        set (value) {
            Object.defineProperty(this, key, {
                value,
                configurable: true,
                writable: true
            });
        }
    });
}
const classic_errors_initializer = (inst, issues)=>{
    $ZodError.init(inst, issues);
    inst.name = "ZodError";
    const proto = Object.getPrototypeOf(inst);
    if (_installedErrorProtos.has(proto)) return;
    _installedErrorProtos.add(proto);
    _lazyMethod(proto, "format", (self)=>(mapper)=>formatError(self, mapper));
    _lazyMethod(proto, "flatten", (self)=>(mapper)=>flattenError(self, mapper));
    _lazyMethod(proto, "addIssue", (self)=>(issue)=>{
            self.issues.push(issue);
            self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
        });
    _lazyMethod(proto, "addIssues", (self)=>(issues)=>{
            self.issues.push(...issues);
            self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
        });
    Object.defineProperty(proto, "isEmpty", {
        configurable: true,
        enumerable: false,
        get () {
            return 0 === this.issues.length;
        }
    });
};
const ZodError = /*@__PURE__*/ $constructor("ZodError", classic_errors_initializer);
const ZodRealError = /*@__PURE__*/ $constructor("ZodError", classic_errors_initializer, void 0, {
    Parent: Error
});
class $ZodCyclicError extends Error {
    constructor(){
        super("Cannot parse a reference cycle that closes through a transform");
        this.name = "ZodCyclicError";
    }
}
const STATE = "~memo";
const NO_ISSUES = [];
function isRef(value) {
    return null !== value && "object" == typeof value;
}
function cloneIssues(issues) {
    return issues.map((iss)=>iss.path ? {
            ...iss,
            path: iss.path.slice()
        } : {
            ...iss
        });
}
const recursive = /*@__PURE__*/ new WeakMap();
const NONE = 0;
const ASSUMED = 1;
const PROVEN = 2;
function isRecursive(inst, stack, resolve) {
    const cached = recursive.get(inst);
    if (void 0 !== cached) return cached ? PROVEN : NONE;
    if (stack.has(inst)) return PROVEN;
    stack.add(inst);
    let result = NONE;
    const check = (child)=>{
        if (result !== PROVEN && child?._zod) {
            const answer = isRecursive(child, stack, resolve);
            if (answer > result) result = answer;
        }
    };
    const shape = (sh, spread)=>{
        let answer = NONE;
        for (const key of Reflect.ownKeys(sh)){
            const desc = Object.getOwnPropertyDescriptor(sh, key);
            if (spread && !desc.enumerable) continue;
            const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
            if (child > answer) answer = child;
        }
        return answer;
    };
    const merge = (answer)=>{
        if (answer > result) result = answer;
    };
    const def = inst._zod.def;
    const kind = def.type;
    switch(kind){
        case "object":
            {
                const raw = rawShape(def);
                merge(raw ? shape(raw, true) : ASSUMED);
                check(def.catchall);
                break;
            }
        case "array":
            check(def.element);
            break;
        case "tuple":
            for (const el of def.items)check(el);
            check(def.rest);
            break;
        case "record":
        case "map":
            check(def.keyType);
            check(def.valueType);
            break;
        case "set":
            check(def.valueType);
            break;
        case "union":
            for (const el of def.options)check(el);
            break;
        case "intersection":
            check(def.left);
            check(def.right);
            break;
        case "optional":
        case "nullable":
        case "default":
        case "prefault":
        case "catch":
        case "readonly":
        case "nonoptional":
        case "promise":
        case "success":
            check(def.innerType);
            break;
        case "pipe":
            check(def.in);
            check(def.out);
            break;
        case "function":
            check(def.input);
            check(def.output);
            break;
        case "lazy":
            {
                const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
                merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
                break;
            }
        case "template_literal":
        case "string":
        case "number":
        case "int":
        case "boolean":
        case "bigint":
        case "symbol":
        case "undefined":
        case "null":
        case "void":
        case "never":
        case "any":
        case "unknown":
        case "date":
        case "nan":
        case "enum":
        case "literal":
        case "file":
        case "transform":
        case "custom":
            break;
        default:
            for(const key in def){
                const desc = Object.getOwnPropertyDescriptor(def, key);
                if (!desc || desc.get) continue;
                const value = desc.value;
                if (value && "object" == typeof value) {
                    if (value._zod) check(value);
                    else if (Array.isArray(value)) for (const el of value)check(el);
                }
            }
    }
    stack.delete(inst);
    return settle(inst, result);
}
function settle(inst, answer) {
    if (answer !== ASSUMED) recursive.set(inst, answer === PROVEN);
    return answer;
}
function bucketFor(state, inst) {
    let bucket = state.buckets.get(inst);
    if (!bucket) {
        bucket = new WeakMap();
        state.buckets.set(inst, bucket);
    }
    return bucket;
}
let handoff;
const memoizer_open = [];
const memoizer_memo = {
    alloc (_inst, payload, empty) {
        const bucket = handoff;
        if (!bucket) return empty;
        handoff = void 0;
        const entry = {
            value: empty,
            issues: null
        };
        bucket.set(payload.value, entry);
        memoizer_open.push(entry);
        return empty;
    },
    guard (inst) {
        var _a;
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred.push(()=>{
            const base = inst._zod.parse;
            const wrapped = (payload, ctx)=>{
                if ("backward" !== ctx.direction && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
                return base(payload, ctx);
            };
            inst._zod.parse = wrapped;
            if (inst._zod.run === base) inst._zod.run = wrapped;
        });
    },
    attach (inst) {
        var _a;
        let isRecursiveInst;
        let rechecked = false;
        let lastCtx;
        let lastBucket;
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred.push(()=>{
            const base = inst._zod.parse;
            const wrapped = (payload, ctx)=>{
                if (void 0 === isRecursiveInst) {
                    const walked = isRecursive(inst, new Set(), false);
                    if (walked === NONE) {
                        inst._zod.parse = base;
                        if (inst._zod.run === wrapped) inst._zod.run = base;
                        return base(payload, ctx);
                    }
                    if (walked === PROVEN || rechecked) isRecursiveInst = true;
                    else rechecked = true;
                }
                const input = payload.value;
                if (!isRef(input)) return base(payload, ctx);
                let state = ctx[STATE];
                if (!state) {
                    state = {
                        buckets: new WeakMap(),
                        backEdges: void 0
                    };
                    ctx[STATE] = state;
                }
                let bucket;
                if (lastCtx === ctx) bucket = lastBucket;
                else {
                    bucket = bucketFor(state, inst);
                    lastCtx = ctx;
                    lastBucket = bucket;
                }
                const hit = bucket.get(input);
                if (hit) {
                    payload.value = hit.value;
                    if (hit.issues) {
                        if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
                    } else {
                        payload.memo = true;
                        state.backEdges ?? (state.backEdges = new WeakSet());
                        state.backEdges.add(hit.value);
                    }
                    return payload;
                }
                handoff = bucket;
                const depth = memoizer_open.length;
                const result = base(payload, ctx);
                handoff = void 0;
                const entry = memoizer_open.length > depth ? memoizer_open.pop() : void 0;
                if (result instanceof Promise) return result.then((r)=>{
                    if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
                    return r;
                });
                if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
                return result;
            };
            inst._zod.parse = wrapped;
            if (inst._zod.run === base) inst._zod.run = wrapped;
        });
    }
};
function memoizer() {
    return memoizer_memo;
}
function isBackEdge(ctx, value) {
    const backEdges = ctx[STATE]?.backEdges;
    return void 0 !== backEdges && isRef(value) && backEdges.has(value);
}
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
    return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
const uuid = (version)=>{
    if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
    return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji = "^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$";
function emoji() {
    return new RegExp(_emoji, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const regexes_base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const regexes_base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
const httpProtocol = /^https?$/;
const e164 = /^\+[1-9]\d{6,14}$/;
const dateSource = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";
/** Anchors a pattern source. The interpolation lives here rather than at the call site because
 * esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
 * will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */ function regexes_anchor(source) {
    return new RegExp(`^${source}$`);
}
const date = /*@__PURE__*/ regexes_anchor(dateSource);
function timeSource(args) {
    const hhmm = "(?:[01]\\d|2[0-3]):[0-5]\\d";
    const regex = "number" == typeof args.precision ? -1 === args.precision ? `${hhmm}` : 0 === args.precision ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
    return regex;
}
function time(args) {
    return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
    const opts = [
        "Z"
    ];
    if (args.offset) opts.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
    const qualified = `${timeSource({
        precision: args.precision,
        seconds: true
    })}(?:${opts.join("|")})`;
    const timeRegex = args.local ? `${qualified}|${timeSource({
        precision: args.precision
    })}` : qualified;
    return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const anyString = /^[\s\S]{0,}$/;
const integer = /^-?\d+$/;
const number = /^-?\d+(?:\.\d+)?$/;
const regexes_boolean = /^(?:true|false)$/i;
const _null = /^null$/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def)=>{
    var _a;
    inst._zod ?? (inst._zod = {});
    inst._zod.def = def;
    (_a = inst._zod).onattach ?? (_a.onattach = []);
});
const _whenHasLength = (payload)=>{
    const val = payload.value;
    return !nullish(val) && void 0 !== val.length;
};
const numericOriginMap = {
    number: "number",
    bigint: "bigint",
    object: "date"
};
const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.check = (payload)=>{
        if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
        payload.issues.push({
            origin: numericOriginMap[typeof payload.value] ?? origin,
            code: "too_big",
            maximum: "object" == typeof def.value ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.check = (payload)=>{
        if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
        payload.issues.push({
            origin: numericOriginMap[typeof payload.value] ?? origin,
            code: "too_small",
            minimum: "object" == typeof def.value ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def)=>{
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload)=>{
        if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
        const isMultiple = "bigint" == typeof payload.value ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : 0 === floatSafeRemainder(payload.value, def.value);
        if (isMultiple) return;
        payload.issues.push({
            origin: typeof payload.value,
            code: "not_multiple_of",
            divisor: def.value,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def)=>{
    $ZodCheck.init(inst, def);
    def.format = def.format || "float64";
    const isInt = def.format?.includes("int");
    const origin = isInt ? "int" : "number";
    const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
    inst._zod.check = (payload)=>{
        const input = payload.value;
        if (isInt) {
            if (!Number.isInteger(input)) return void payload.issues.push({
                expected: origin,
                format: def.format,
                code: "invalid_type",
                continue: false,
                input,
                inst
            });
            if (!Number.isSafeInteger(input)) {
                if (input > 0) payload.issues.push({
                    input,
                    code: "too_big",
                    maximum: Number.MAX_SAFE_INTEGER,
                    note: "Integers must be within the safe integer range.",
                    inst,
                    origin,
                    inclusive: true,
                    continue: !def.abort
                });
                else payload.issues.push({
                    input,
                    code: "too_small",
                    minimum: Number.MIN_SAFE_INTEGER,
                    note: "Integers must be within the safe integer range.",
                    inst,
                    origin,
                    inclusive: true,
                    continue: !def.abort
                });
                return;
            }
        }
        if (input < minimum) payload.issues.push({
            origin: "number",
            input,
            code: "too_small",
            minimum,
            inclusive: true,
            inst,
            continue: !def.abort
        });
        if (input > maximum) payload.issues.push({
            origin: "number",
            input,
            code: "too_big",
            maximum,
            inclusive: true,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def)=>{
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
    inst._zod.check = (payload)=>{
        const input = payload.value;
        const units = input.length;
        const length = "string" == typeof input && units > def.maximum ? codePointLength(input) : units;
        if (length <= def.maximum) return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_big",
            maximum: def.maximum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def)=>{
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
    inst._zod.check = (payload)=>{
        const input = payload.value;
        const units = input.length;
        const length = "string" == typeof input && units >= def.minimum && units < 2 * def.minimum ? codePointLength(input) : units;
        if (length >= def.minimum) return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_small",
            minimum: def.minimum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def)=>{
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
    inst._zod.check = (payload)=>{
        const input = payload.value;
        const units = input.length;
        const length = "string" == typeof input && units >= def.length && units <= 2 * def.length ? codePointLength(input) : units;
        if (length === def.length) return;
        const origin = getLengthableOrigin(input);
        const tooBig = length > def.length;
        payload.issues.push({
            origin,
            ...tooBig ? {
                code: "too_big",
                maximum: def.length
            } : {
                code: "too_small",
                minimum: def.length
            },
            inclusive: true,
            exact: true,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def)=>{
    var _a, _b;
    $ZodCheck.init(inst, def);
    if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload)=>{
        def.pattern.lastIndex = 0;
        if (def.pattern.test(payload.value)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: def.format,
            input: payload.value,
            ...def.pattern ? {
                pattern: def.pattern.toString()
            } : {},
            inst,
            continue: !def.abort
        });
    });
    else (_b = inst._zod).check ?? (_b.check = ()=>{});
});
const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def)=>{
    $ZodCheckStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        def.pattern.lastIndex = 0;
        if (def.pattern.test(payload.value)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "regex",
            input: payload.value,
            pattern: def.pattern.toString(),
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def)=>{
    def.pattern ?? (def.pattern = lowercase);
    $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def)=>{
    def.pattern ?? (def.pattern = uppercase);
    $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const escapedRegex = escapeRegex(def.includes);
    const pattern = new RegExp("number" == typeof def.position ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
    def.pattern = pattern;
    inst._zod.check = (payload)=>{
        if (payload.value.includes(def.includes, def.position)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "includes",
            includes: def.includes,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.check = (payload)=>{
        if (payload.value.startsWith(def.prefix)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "starts_with",
            prefix: def.prefix,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def)=>{
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.check = (payload)=>{
        if (payload.value.endsWith(def.suffix)) return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "ends_with",
            suffix: def.suffix,
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def)=>{
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload)=>{
        payload.value = def.tx(payload.value);
    };
});
class Doc {
    constructor(args = [], closed = {}){
        this.content = [];
        this.indent = 0;
        this.args = args;
        this.closed = closed;
    }
    indented(fn) {
        this.indent += 1;
        try {
            fn(this);
        } finally{
            this.indent -= 1;
        }
    }
    write(arg) {
        if ("function" == typeof arg) {
            arg(this, {
                execution: "sync"
            });
            arg(this, {
                execution: "async"
            });
            return;
        }
        const content = arg;
        const lines = content.split("\n").filter((x)=>x);
        const minIndent = Math.min(...lines.map((x)=>x.length - x.trimStart().length));
        const dedented = lines.map((x)=>x.slice(minIndent)).map((x)=>" ".repeat(2 * this.indent) + x);
        for (const line of dedented)this.content.push(line);
    }
    compile() {
        const F = Function;
        const content = this?.content ?? [
            ""
        ];
        const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`);
        return factory(...Object.values(this.closed));
    }
}
const versions_version = {
    major: 4,
    minor: 6,
    patch: 7
};
const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def)=>{
    var _a;
    inst ?? (inst = {});
    inst._zod.def = def;
    inst._zod.bag = inst._zod.bag || {};
    inst._zod.version = versions_version;
    const defChecks = inst._zod.def.checks;
    const checks = inst._zod.traits.has("$ZodCheck") ? [
        inst,
        ...defChecks ?? []
    ] : defChecks?.length ? [
        ...defChecks
    ] : [];
    for (const ch of checks)for (const fn of ch._zod.onattach)fn(inst);
    if (0 === checks.length) {
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred?.push(()=>{
            inst._zod.run = inst._zod.parse;
        });
    } else {
        const runChecks = (payload, checks, ctx)=>{
            if (payload.memo) return payload;
            let isAborted = aborted(payload);
            let asyncResult;
            for (const ch of checks){
                if (ch._zod.def.when) {
                    if (explicitlyAborted(payload)) continue;
                    const shouldRun = ch._zod.def.when(payload);
                    if (!shouldRun) continue;
                } else if (isAborted) continue;
                const currLen = payload.issues.length;
                const _ = ch._zod.check(payload);
                if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
                if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async ()=>{
                    await _;
                    const nextLen = payload.issues.length;
                    if (nextLen === currLen) return;
                    attachSchema(payload.issues, currLen, inst);
                    if (!isAborted) isAborted = aborted(payload, currLen);
                });
                else {
                    const nextLen = payload.issues.length;
                    if (nextLen === currLen) continue;
                    attachSchema(payload.issues, currLen, inst);
                    if (!isAborted) isAborted = aborted(payload, currLen);
                }
            }
            if (asyncResult) return asyncResult.then(()=>payload);
            return payload;
        };
        const handleCanaryResult = (canary, payload, ctx)=>{
            if (aborted(canary)) {
                canary.aborted = true;
                return canary;
            }
            const checkResult = runChecks(payload, checks, ctx);
            if (checkResult instanceof Promise) {
                if (false === ctx.async) throw new $ZodAsyncError();
                return checkResult.then((checkResult)=>inst._zod.parse(checkResult, ctx));
            }
            return inst._zod.parse(checkResult, ctx);
        };
        inst._zod.run = (payload, ctx)=>{
            if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
            if ("backward" === ctx.direction) {
                const canary = inst._zod.parse({
                    value: payload.value,
                    issues: []
                }, {
                    ...ctx,
                    skipChecks: true
                });
                if (canary instanceof Promise) return canary.then((canary)=>handleCanaryResult(canary, payload, ctx));
                return handleCanaryResult(canary, payload, ctx);
            }
            const result = inst._zod.parse(payload, ctx);
            if (result instanceof Promise) {
                if (false === ctx.async) throw new $ZodAsyncError();
                return result.then((result)=>runChecks(result, checks, ctx));
            }
            return runChecks(result, checks, ctx);
        };
    }
}, {
    get "~standard" () {
        return hide(this, "~standard", standardProps(this));
    },
    set "~standard" (value){
        util_own(this, "~standard", value);
    }
});
const toStandardResult = (r, ctx)=>r.issues.length ? {
        issues: r.issues.map((iss)=>finalizeIssue(iss, ctx, core_config()))
    } : {
        value: r.value
    };
async function validateAsync(inst, value) {
    const ctx = {
        async: true
    };
    return toStandardResult(await inst._zod.run({
        value,
        issues: []
    }, ctx), ctx);
}
function standardProps(inst) {
    return {
        validate: (value)=>{
            const ctx = {
                async: false
            };
            try {
                const r = inst._zod.run({
                    value,
                    issues: []
                }, ctx);
                if (!(r instanceof Promise)) return toStandardResult(r, ctx);
            } catch (_) {}
            return validateAsync(inst, value);
        },
        vendor: "zod",
        version: 1
    };
}
const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.pattern = def.pattern ?? anyString;
    inst._zod.parse = (payload, _)=>{
        if (def.coerce) try {
            payload.value = String(payload.value);
        } catch (_) {}
        if ("string" == typeof payload.value) return payload;
        payload.issues.push({
            expected: "string",
            code: "invalid_type",
            input: payload.value,
            inst
        });
        return payload;
    };
});
const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def)=>{
    $ZodCheckStringFormat.init(inst, def);
    $ZodString.init(inst, def);
});
const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def)=>{
    def.pattern ?? (def.pattern = guid);
    $ZodStringFormat.init(inst, def);
});
const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def)=>{
    if (def.version) {
        const versionMap = {
            v1: 1,
            v2: 2,
            v3: 3,
            v4: 4,
            v5: 5,
            v6: 6,
            v7: 7,
            v8: 8
        };
        const v = versionMap[def.version];
        if (void 0 === v) throw new Error(`Invalid UUID version: "${def.version}"`);
        def.pattern ?? (def.pattern = uuid(v));
    } else def.pattern ?? (def.pattern = uuid());
    $ZodStringFormat.init(inst, def);
});
const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def)=>{
    def.pattern ?? (def.pattern = email);
    $ZodStringFormat.init(inst, def);
});
const URL_BAD_FORMAT = 1;
const URL_UNPARSEABLE = 2;
function canParseURL(input) {
    try {
        if ("u" > typeof URL && "function" == typeof URL.canParse) return URL.canParse(input);
        new URL(input);
        return true;
    } catch  {
        return false;
    }
}
function validateURL(trimmed, def) {
    if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) return canParseURL(trimmed) || URL_UNPARSEABLE;
    return parseURLObject(trimmed, def);
}
function parseURLObject(trimmed, def) {
    if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return URL_BAD_FORMAT;
    try {
        if ("u" > typeof URL) {
            const URLStatic = URL;
            if ("function" == typeof URLStatic.parse) return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
        }
        return new URL(trimmed);
    } catch  {
        return URL_UNPARSEABLE;
    }
}
const asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
    return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
    hostname.lastIndex = 0;
    return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
    protocol.lastIndex = 0;
    return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def)=>{
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        try {
            const trimmed = payload.value.trim();
            const url = validateURL(trimmed, def);
            if (url === URL_BAD_FORMAT) return void payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid URL format",
                input: payload.value,
                inst,
                continue: !def.abort
            });
            if (url === URL_UNPARSEABLE) return void payload.issues.push({
                code: "invalid_format",
                format: "url",
                input: payload.value,
                inst,
                continue: !def.abort
            });
            if (true === url) {
                payload.value = stripTabAndNewline(trimmed);
                return;
            }
            if (def.hostname && !urlHostnameOk(url, def.hostname)) payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid hostname",
                pattern: def.hostname.source,
                input: payload.value,
                inst,
                continue: !def.abort
            });
            if (def.protocol && !urlProtocolOk(url, def.protocol)) payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid protocol",
                pattern: def.protocol.source,
                input: payload.value,
                inst,
                continue: !def.abort
            });
            payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
            return;
        } catch (_) {
            payload.issues.push({
                code: "invalid_format",
                format: "url",
                input: payload.value,
                inst,
                continue: !def.abort
            });
        }
    };
});
const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def)=>{
    def.pattern ?? (def.pattern = emoji());
    $ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def)=>{
    if (void 0 !== def.length && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
    def.pattern ?? (def.pattern = void 0 === def.length ? nanoid : nanoidOfLength(def.length));
    $ZodStringFormat.init(inst, def);
});
const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def)=>{
    def.pattern ?? (def.pattern = cuid);
    $ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def)=>{
    def.pattern ?? (def.pattern = cuid2);
    $ZodStringFormat.init(inst, def);
});
const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def)=>{
    def.pattern ?? (def.pattern = ulid);
    $ZodStringFormat.init(inst, def);
});
const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def)=>{
    def.pattern ?? (def.pattern = xid);
    $ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def)=>{
    def.pattern ?? (def.pattern = ksuid);
    $ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def)=>{
    def.pattern ?? (def.pattern = datetime(def));
    $ZodStringFormat.init(inst, def);
});
const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def)=>{
    def.pattern ?? (def.pattern = date);
    $ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def)=>{
    def.pattern ?? (def.pattern = time(def));
    $ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def)=>{
    def.pattern ?? (def.pattern = duration);
    $ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def)=>{
    def.pattern ?? (def.pattern = ipv4);
    $ZodStringFormat.init(inst, def);
});
const ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
    if (!ipv6Alphabet.test(value)) return false;
    return canParseURL(`http://[${value}]`);
}
const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def)=>{
    def.pattern ?? (def.pattern = ipv6);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (!isValidIPv6(payload.value)) payload.issues.push({
            code: "invalid_format",
            format: "ipv6",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def)=>{
    def.pattern ?? (def.pattern = cidrv4);
    $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
    const parts = value.split("/");
    if (2 !== parts.length) return false;
    const [address, prefix] = parts;
    if (!prefix) return false;
    const prefixNum = Number(prefix);
    if (`${prefixNum}` !== prefix) return false;
    if (prefixNum < 0 || prefixNum > 128) return false;
    return isValidIPv6(address);
}
const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def)=>{
    def.pattern ?? (def.pattern = cidrv6);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (!isValidCIDRv6(payload.value)) payload.issues.push({
            code: "invalid_format",
            format: "cidrv6",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
function isValidBase64(data) {
    if ("" === data) return true;
    if (/\s/.test(data)) return false;
    if (data.length % 4 !== 0) return false;
    try {
        atob(data);
        return true;
    } catch  {
        return false;
    }
}
const base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def)=>{
    def.pattern ?? (def.pattern = base64Charset);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (isValidBase64(payload.value)) return;
        payload.issues.push({
            code: "invalid_format",
            format: "base64",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
    if (!base64urlCharset.test(data)) return false;
    const base64 = data.replace(/[-_]/g, (c)=>"-" === c ? "+" : "/");
    const padded = base64.padEnd(4 * Math.ceil(base64.length / 4), "=");
    return isValidBase64(padded);
}
const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def)=>{
    def.pattern ?? (def.pattern = base64urlCharset);
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (isValidBase64URL(payload.value)) return;
        payload.issues.push({
            code: "invalid_format",
            format: "base64url",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def)=>{
    def.pattern ?? (def.pattern = e164);
    $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
    try {
        const tokensParts = token.split(".");
        if (3 !== tokensParts.length) return false;
        const [header] = tokensParts;
        if (!header) return false;
        const parsedHeader = JSON.parse(atob(header));
        if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
        if (!parsedHeader.alg) return false;
        if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
        return true;
    } catch  {
        return false;
    }
}
const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def)=>{
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload)=>{
        if (isValidJWT(payload.value, def.alg)) return;
        payload.issues.push({
            code: "invalid_format",
            format: "jwt",
            input: payload.value,
            inst,
            continue: !def.abort
        });
    };
});
const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.pattern = number;
    inst._zod.parse = (payload, _ctx)=>{
        if (def.coerce) try {
            payload.value = Number(payload.value);
        } catch (_) {}
        const input = payload.value;
        if ("number" == typeof input && !Number.isNaN(input) && Number.isFinite(input)) return payload;
        const received = "number" == typeof input ? Number.isNaN(input) ? "NaN" : Number.isFinite(input) ? void 0 : String(input) : void 0;
        payload.issues.push({
            expected: "number",
            code: "invalid_type",
            input,
            inst,
            ...received ? {
                received
            } : {}
        });
        return payload;
    };
});
const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def)=>{
    $ZodCheckNumberFormat.init(inst, def);
    $ZodNumber.init(inst, def);
});
const $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.pattern = regexes_boolean;
    inst._zod.parse = (payload, _ctx)=>{
        if (def.coerce) try {
            payload.value = Boolean(payload.value);
        } catch (_) {}
        const input = payload.value;
        if ("boolean" == typeof input) return payload;
        payload.issues.push({
            expected: "boolean",
            code: "invalid_type",
            input,
            inst
        });
        return payload;
    };
});
const $ZodNull = /*@__PURE__*/ $constructor("$ZodNull", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.pattern = _null;
    inst._zod.values = new Set([
        null
    ]);
    inst._zod.parse = (payload, _ctx)=>{
        const input = payload.value;
        if (null === input) return payload;
        payload.issues.push({
            expected: "null",
            code: "invalid_type",
            input,
            inst
        });
        return payload;
    };
});
const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.parse = (payload)=>payload;
});
const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx)=>{
        payload.issues.push({
            expected: "never",
            code: "invalid_type",
            input: payload.value,
            inst
        });
        return payload;
    };
});
function capSize(inst, size) {
    const caps = sizeCaps(inst._zod.def.checks);
    if (!caps.length) return;
    const cap = Math.min(...caps.map((c)=>c[0]));
    const parse = inst._zod.parse;
    inst._zod.parse = (payload, ctx)=>{
        const n = size(payload.value);
        if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
            for (const [max, ch] of sizeCaps(inst._zod.def.checks))if (n > max && ch._zod.def.when(payload)) {
                const start = payload.issues.length;
                ch._zod.check(payload);
                payload.issues[start].continue = false;
                attachSchema(payload.issues, start, inst);
                return payload;
            }
        }
        return parse(payload, ctx);
    };
}
const arraySize = (input)=>Array.isArray(input) ? input.length : -1;
function handleArrayResult(result, final, index) {
    if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
    final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def)=>{
    $ZodType.init(inst, def);
    const memo = globalConfig.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx)=>{
        const input = payload.value;
        if (!Array.isArray(input)) {
            payload.issues.push({
                expected: "array",
                code: "invalid_type",
                input,
                inst
            });
            return payload;
        }
        payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
        const proms = [];
        const abortEarly = ctx?.abortEarly;
        for(let i = 0; i < input.length; i++){
            const item = input[i];
            const result = def.element._zod.run({
                value: item,
                issues: []
            }, ctx);
            if (result instanceof Promise) proms.push(result.then((result)=>handleArrayResult(result, payload, i)));
            else {
                handleArrayResult(result, payload, i);
                if (abortEarly && 0 !== result.issues.length && aborted(result)) break;
            }
        }
        if (proms.length) return Promise.all(proms).then(()=>payload);
        return payload;
    };
    capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
    const isPresent = key in input;
    const isOptionalOut = "optional" === optout;
    if (!isPresent && isOptionalOut && "optional" === optin) return;
    if (result.issues.length) {
        if (void 0 !== optin && isOptionalOut && !isPresent) return;
        final.issues.push(...prefixIssues(key, result.issues));
    }
    if (!isPresent && void 0 === optin) {
        if (!result.issues.length) final.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: void 0,
            path: [
                key
            ]
        });
        return;
    }
    if (void 0 === result.value) {
        if (isPresent || "defaulted" === optin && !isOptionalOut) final.value[key] = void 0;
    } else final.value[key] = result.value;
}
const NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
    const keys = Object.keys(def.shape);
    const ownSymbols = Object.getOwnPropertySymbols(def.shape);
    const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
    const allKeys = symbolKeys.length ? [
        ...keys,
        ...symbolKeys
    ] : keys;
    for (const k of allKeys)if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    const okeys = optionalKeys(def.shape);
    return {
        ...def,
        allKeys,
        symbolKeys,
        keySet: new Set(keys),
        numKeys: keys.length,
        optionalKeys: new Set(okeys)
    };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
    const unrecognized = [];
    const keySet = def.keySet;
    const _catchall = def.catchall._zod;
    const t = _catchall.def.type;
    const optin = _catchall.optin;
    const optout = _catchall.optout;
    let seen = 0;
    for(const key in input){
        if (abortEarly && payload.issues.length !== seen) {
            if (aborted(payload, seen)) break;
            seen = payload.issues.length;
        }
        if (keySet.has(key)) continue;
        if ("__proto__" === key) {
            if ("never" === t) unrecognized.push(key);
            continue;
        }
        if ("never" === t) {
            unrecognized.push(key);
            continue;
        }
        const r = _catchall.run({
            value: input[key],
            issues: []
        }, ctx);
        if (r instanceof Promise) proms.push(r.then((r)=>handlePropertyResult(r, payload, key, input, optin, optout)));
        else handlePropertyResult(r, payload, key, input, optin, optout);
    }
    if (unrecognized.length) payload.issues.push({
        code: "unrecognized_keys",
        keys: unrecognized,
        input,
        inst,
        continue: true
    });
    if (!proms.length) return payload;
    return Promise.all(proms).then(()=>payload);
}
const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def)=>{
    $ZodType.init(inst, def);
    const desc = Object.getOwnPropertyDescriptor(def, "shape");
    const sh = desc?.get ? desc.get.raw : def.shape ?? {};
    if (sh) {
        const get = ()=>{
            const newSh = {
                ...sh
            };
            Object.defineProperty(def, "shape", {
                value: newSh
            });
            get.raw = newSh;
            return newSh;
        };
        get.raw = sh;
        Object.defineProperty(def, "shape", {
            get
        });
    }
    const _normalized = util_cached(()=>normalizeDef(def));
    defineLazyInternal(inst, "propValues", (zod)=>{
        const shape = zod.def.shape;
        const propValues = {};
        for(const key in shape){
            const field = shape[key]._zod;
            if (field.values) {
                if (!Object.prototype.hasOwnProperty.call(propValues, key)) util_assignProp(propValues, key, new Set());
                for (const v of field.values)propValues[key].add(v);
                if (void 0 !== field.optin) propValues[key].add(void 0);
            }
        }
        return propValues;
    });
    const isObject = util_isObject;
    const catchall = def.catchall;
    let value;
    const memo = globalConfig.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx)=>{
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
            payload.issues.push({
                expected: "object",
                code: "invalid_type",
                input,
                inst
            });
            return payload;
        }
        payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
        const proms = [];
        const shape = value.shape;
        const abortEarly = ctx?.abortEarly;
        let seen = payload.issues.length;
        for (const key of value.allKeys){
            if (abortEarly && payload.issues.length !== seen) {
                if (aborted(payload, seen)) break;
                seen = payload.issues.length;
            }
            if ("__proto__" === key) continue;
            const el = shape[key];
            const optin = el._zod.optin;
            const optout = el._zod.optout;
            const r = el._zod.run({
                value: input[key],
                issues: []
            }, ctx);
            if (r instanceof Promise) proms.push(r.then((r)=>handlePropertyResult(r, payload, key, input, optin, optout)));
            else handlePropertyResult(r, payload, key, input, optin, optout);
        }
        if (!catchall) return proms.length ? Promise.all(proms).then(()=>payload) : payload;
        return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, true === abortEarly);
    };
});
const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def)=>{
    $ZodObject.init(inst, def);
    const superParse = inst._zod.parse;
    const _normalized = util_cached(()=>normalizeDef(def));
    const memo = globalConfig.memoizer;
    const generateFastpass = (shape)=>{
        const normalized = _normalized.value;
        const syms = normalized.symbolKeys;
        const doc = new Doc([
            "payload",
            "ctx"
        ], {
            shape,
            inst,
            memo,
            syms
        });
        const parseStr = (k)=>`shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
        const prefixStr = (id, k)=>`
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
        doc.write("const input = payload.value;");
        const ids = Object.create(null);
        let counter = 0;
        for (const key of normalized.allKeys)ids[key] = `key_${counter++}`;
        doc.write(memo ? "const newResult = memo.alloc(inst, payload, {}, ctx);" : "const newResult = {};");
        for (const key of normalized.allKeys){
            if ("__proto__" === key) continue;
            const id = ids[key];
            const k = "symbol" == typeof key ? `syms[${syms.indexOf(key)}]` : esc(key);
            const isPresent = `${k} in input`;
            const schema = shape[key];
            const optin = schema?._zod?.optin;
            const isOptionalIn = void 0 !== optin;
            const isOptionalOut = schema?._zod?.optout === "optional";
            doc.write(`const ${id} = ${parseStr(k)};`);
            if (isOptionalIn && isOptionalOut) {
                const assign = "optional" === optin ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
                doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
            } else if (isOptionalIn) {
                doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
                if ("defaulted" === optin) doc.write(`newResult[${k}] = ${id}.value;`);
                else doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
            } else doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
        }
        doc.write("payload.value = newResult;");
        doc.write("return payload;");
        return doc.compile();
    };
    let fastpass;
    const isObject = util_isObject;
    const jit = !globalConfig.jitless;
    const allowsEval = util_allowsEval;
    const fastEnabled = jit && allowsEval.value;
    const catchall = def.catchall;
    let value;
    inst._zod.parse = (payload, ctx)=>{
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
            payload.issues.push({
                expected: "object",
                code: "invalid_type",
                input,
                inst
            });
            return payload;
        }
        if (jit && fastEnabled && ctx?.async === false && true !== ctx.jitless) {
            if (!fastpass) fastpass = generateFastpass(def.shape);
            payload = fastpass(payload, ctx);
            if (!catchall) return payload;
            return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
        }
        return superParse(payload, ctx);
    };
});
function handleUnionResults(results, final, inst, ctx) {
    for (const result of results)if (0 === result.issues.length) {
        final.value = result.value;
        return final;
    }
    const nonaborted = results.filter((r)=>!aborted(r));
    if (1 === nonaborted.length) {
        final.value = nonaborted[0].value;
        return nonaborted[0];
    }
    final.issues.push({
        code: "invalid_union",
        input: final.value,
        inst,
        errors: results.map((result)=>result.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())))
    });
    return final;
}
const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "optin", (zod)=>zod.def.options.some((o)=>"defaulted" === o._zod.optin) ? "defaulted" : zod.def.options.some((o)=>void 0 !== o._zod.optin) ? "optional" : void 0);
    defineLazyInternal(inst, "optout", (zod)=>zod.def.options.some((o)=>"optional" === o._zod.optout) ? "optional" : void 0);
    defineLazyInternal(inst, "values", (zod)=>{
        if (zod.def.options.every((o)=>o._zod.values)) return new Set(zod.def.options.flatMap((option)=>Array.from(option._zod.values)));
    });
    defineLazyInternal(inst, "pattern", (zod)=>{
        if (zod.def.options.every((o)=>o._zod.pattern)) {
            const patterns = zod.def.options.map((o)=>o._zod.pattern);
            return new RegExp(`^(${patterns.map((p)=>cleanRegex(p.source)).join("|")})$`);
        }
    });
    const first = 1 === def.options.length ? def.options[0]._zod.run : null;
    inst._zod.parse = (payload, ctx)=>{
        if (first) return first(payload, ctx);
        let async = false;
        const results = [];
        for (const option of def.options){
            const result = option._zod.run({
                value: payload.value,
                issues: []
            }, ctx);
            if (result instanceof Promise) {
                results.push(result);
                async = true;
            } else {
                if (0 === result.issues.length) return result;
                results.push(result);
            }
        }
        if (!async) return handleUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results)=>handleUnionResults(results, payload, inst, ctx));
    };
});
const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx)=>{
        const input = payload.value;
        const left = def.left._zod.run({
            value: input,
            issues: []
        }, ctx);
        const right = def.right._zod.run({
            value: input,
            issues: []
        }, ctx);
        const async = left instanceof Promise || right instanceof Promise;
        if (async) return Promise.all([
            left,
            right
        ]).then(([left, right])=>handleIntersectionResults(payload, left, right));
        return handleIntersectionResults(payload, left, right);
    };
});
function mergeValues(a, b) {
    if (a === b) return {
        valid: true,
        data: a
    };
    if (a instanceof Date && b instanceof Date && +a === +b) return {
        valid: true,
        data: a
    };
    if (isPlainObject(a) && isPlainObject(b)) {
        const bKeys = Object.keys(b);
        const sharedKeys = Object.keys(a).filter((key)=>-1 !== bKeys.indexOf(key));
        const newObj = {
            ...a,
            ...b
        };
        if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
        for (const key of sharedKeys){
            if ("__proto__" === key) continue;
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) return {
                valid: false,
                mergeErrorPath: [
                    key,
                    ...sharedValue.mergeErrorPath
                ]
            };
            newObj[key] = sharedValue.data;
        }
        return {
            valid: true,
            data: newObj
        };
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return {
            valid: false,
            mergeErrorPath: []
        };
        const newArray = [];
        for(let index = 0; index < a.length; index++){
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) return {
                valid: false,
                mergeErrorPath: [
                    index,
                    ...sharedValue.mergeErrorPath
                ]
            };
            newArray.push(sharedValue.data);
        }
        return {
            valid: true,
            data: newArray
        };
    }
    return {
        valid: false,
        mergeErrorPath: []
    };
}
function handleIntersectionResults(result, left, right) {
    const unrecKeys = new Map();
    let unrecIssue;
    const keyIssues = new Map();
    const collect = (iss, side)=>{
        let keys;
        if ("unrecognized_keys" !== iss.code || iss.path?.length) if ("invalid_key" !== iss.code || "record" !== iss.origin || iss.path?.length !== 1) return false;
        else {
            const k = String(iss.path[0]);
            if (!keyIssues.has(k)) keyIssues.set(k, iss);
            keys = [
                k
            ];
        }
        else {
            unrecIssue ?? (unrecIssue = iss);
            keys = iss.keys;
        }
        for (const k of keys){
            if (!unrecKeys.has(k)) unrecKeys.set(k, {});
            unrecKeys.get(k)[side] = true;
        }
        return true;
    };
    for (const iss of left.issues)if (!collect(iss, "l")) result.issues.push(iss);
    for (const iss of right.issues)if (!collect(iss, "r")) result.issues.push(iss);
    const bothKeys = [
        ...unrecKeys
    ].filter(([, f])=>f.l && f.r).map(([k])=>k);
    if (bothKeys.length) {
        const aggregated = unrecIssue ? bothKeys.filter((k)=>unrecIssue.keys.includes(k)) : [];
        if (aggregated.length) result.issues.push({
            ...unrecIssue,
            keys: aggregated
        });
        for (const k of bothKeys)if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k));
    }
    const merged = mergeValues(left.value, right.value);
    if (!merged.valid) {
        if (aborted(result)) return result;
        throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
    }
    result.value = merged.data;
    return result;
}
const $ZodRecord = /*@__PURE__*/ $constructor("$ZodRecord", (inst, def)=>{
    $ZodType.init(inst, def);
    const memo = globalConfig.memoizer;
    memo?.attach(inst);
    inst._zod.parse = (payload, ctx)=>{
        const input = payload.value;
        if (!isPlainObject(input)) {
            payload.issues.push({
                expected: "record",
                code: "invalid_type",
                input,
                inst
            });
            return payload;
        }
        const proms = [];
        const values = def.keyType._zod.values;
        if (values && !def.partial) {
            payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
            const recordKeys = new Set();
            for (const key of values)if ("string" == typeof key || "number" == typeof key || "symbol" == typeof key) {
                recordKeys.add("number" == typeof key ? key.toString() : key);
                if ("__proto__" === key) continue;
                const keyResult = def.keyType._zod.run({
                    value: key,
                    issues: []
                }, ctx);
                if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
                if (keyResult.issues.length) {
                    payload.issues.push({
                        code: "invalid_key",
                        origin: "record",
                        issues: keyResult.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())),
                        input: key,
                        path: [
                            key
                        ],
                        inst
                    });
                    continue;
                }
                const outKey = keyResult.value;
                if ("__proto__" === outKey) continue;
                const result = def.valueType._zod.run({
                    value: input[key],
                    issues: []
                }, ctx);
                if (result instanceof Promise) proms.push(result.then((result)=>{
                    if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
                    payload.value[outKey] = result.value;
                }));
                else {
                    if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
                    payload.value[outKey] = result.value;
                }
            }
            let unrecognized;
            for(const key in input)if (!recordKeys.has(key)) if ("loose" === def.mode) {
                if ("__proto__" === key) continue;
                payload.value[key] = input[key];
            } else {
                unrecognized = unrecognized ?? [];
                unrecognized.push(key);
            }
            if (unrecognized && unrecognized.length > 0) payload.issues.push({
                code: "unrecognized_keys",
                input,
                inst,
                keys: unrecognized,
                continue: true
            });
        } else {
            payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
            let unrecognized;
            for (const key of Reflect.ownKeys(input)){
                if ("__proto__" === key) continue;
                if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
                let keyResult = def.keyType._zod.run({
                    value: key,
                    issues: []
                }, ctx);
                if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
                const checkNumericKey = "string" == typeof key && number.test(key) && keyResult.issues.length;
                if (checkNumericKey) {
                    const retryResult = def.keyType._zod.run({
                        value: Number(key),
                        issues: []
                    }, ctx);
                    if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
                    if (0 === retryResult.issues.length) keyResult = retryResult;
                }
                if (keyResult.issues.length) {
                    if ("loose" === def.mode) payload.value[key] = input[key];
                    else if (values) {
                        unrecognized = unrecognized ?? [];
                        unrecognized.push(key);
                    } else payload.issues.push({
                        code: "invalid_key",
                        origin: "record",
                        issues: keyResult.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())),
                        input: key,
                        path: [
                            key
                        ],
                        inst
                    });
                    continue;
                }
                const outKey = keyResult.value;
                if ("__proto__" === outKey) continue;
                const result = def.valueType._zod.run({
                    value: input[key],
                    issues: []
                }, ctx);
                if (result instanceof Promise) proms.push(result.then((result)=>{
                    if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
                    payload.value[outKey] = result.value;
                }));
                else {
                    if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
                    payload.value[outKey] = result.value;
                }
            }
            if (unrecognized && unrecognized.length > 0) payload.issues.push({
                code: "unrecognized_keys",
                input,
                inst,
                keys: unrecognized,
                continue: true
            });
        }
        if (proms.length) return Promise.all(proms).then(()=>payload);
        return payload;
    };
});
const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def)=>{
    $ZodType.init(inst, def);
    const values = getEnumValues(def.entries);
    const valuesSet = new Set(values);
    inst._zod.values = valuesSet;
    defineLazyInternal(inst, "pattern", (zod)=>{
        const patternValues = getEnumValues(zod.def.entries).filter((k)=>propertyKeyTypes.has(typeof k));
        return new RegExp(patternValues.length ? `^(${patternValues.map((o)=>escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
    });
    inst._zod.parse = (payload, _ctx)=>{
        const input = payload.value;
        if (valuesSet.has(input)) return payload;
        payload.issues.push({
            code: "invalid_value",
            values,
            input,
            inst
        });
        return payload;
    };
});
const $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def)=>{
    $ZodType.init(inst, def);
    const values = new Set(def.values);
    inst._zod.values = values;
    defineLazyInternal(inst, "pattern", (zod)=>{
        const vals = zod.def.values;
        return new RegExp(vals.length ? `^(${vals.map((o)=>"string" == typeof o ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
    });
    inst._zod.parse = (payload, _ctx)=>{
        const input = payload.value;
        if (values.has(input)) return payload;
        payload.issues.push({
            code: "invalid_value",
            values: def.values,
            input,
            inst
        });
        return payload;
    };
});
const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    globalConfig.memoizer?.guard(inst);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) throw new $ZodEncodeError(inst.constructor.name);
        const _out = def.transform(payload.value, payload);
        if (ctx.async) {
            const output = _out instanceof Promise ? _out : Promise.resolve(_out);
            return output.then((output)=>{
                payload.value = output;
                return payload;
            });
        }
        if (_out instanceof Promise) throw new $ZodAsyncError();
        payload.value = _out;
        return payload;
    };
});
function handleOptionalResult(payload, result) {
    payload.value = result.issues.length ? void 0 : result.value;
    return payload;
}
const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "optin", (zod)=>"defaulted" === zod.def.innerType._zod.optin ? "defaulted" : "optional");
    inst._zod.optout = "optional";
    defineLazyInternal(inst, "values", (zod)=>{
        const values = zod.def.innerType._zod.values;
        return values ? new Set([
            ...values,
            void 0
        ]) : void 0;
    });
    defineLazyInternal(inst, "pattern", (zod)=>{
        const pattern = zod.def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
    });
    inst._zod.parse = (payload, ctx)=>{
        if (void 0 === payload.value) {
            if ("defaulted" !== def.innerType._zod.optin) return payload;
            const result = def.innerType._zod.run({
                value: payload.value,
                issues: []
            }, ctx);
            if (result instanceof Promise) return result.then((result)=>handleOptionalResult(payload, result));
            return handleOptionalResult(payload, result);
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def)=>{
    $ZodOptional.init(inst, def);
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    defineLazyInternal(inst, "pattern", (zod)=>zod.def.innerType._zod.pattern);
    inst._zod.parse = (payload, ctx)=>def.innerType._zod.run(payload, ctx);
});
const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "optin", (zod)=>zod.def.innerType._zod.optin);
    defineLazyInternal(inst, "optout", (zod)=>zod.def.innerType._zod.optout);
    defineLazyInternal(inst, "pattern", (zod)=>{
        const pattern = zod.def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
    });
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values ? new Set([
            ...zod.def.innerType._zod.values,
            null
        ]) : void 0);
    inst._zod.parse = (payload, ctx)=>{
        if (null === payload.value) return payload;
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.optin = "defaulted";
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) return def.innerType._zod.run(payload, ctx);
        if (void 0 === payload.value) {
            payload.value = def.defaultValue;
            return payload;
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) return result.then((result)=>handleDefaultResult(result, def));
        return handleDefaultResult(result, def);
    };
});
function handleDefaultResult(payload, def) {
    if (void 0 === payload.value) payload.value = def.defaultValue;
    return payload;
}
const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def)=>{
    $ZodType.init(inst, def);
    inst._zod.optin = "defaulted";
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) return def.innerType._zod.run(payload, ctx);
        if (void 0 === payload.value) payload.value = def.defaultValue;
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "values", (zod)=>{
        const v = zod.def.innerType._zod.values;
        return v ? new Set([
            ...v
        ].filter((x)=>void 0 !== x)) : void 0;
    });
    inst._zod.parse = (payload, ctx)=>{
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) return result.then((result)=>handleNonOptionalResult(result, inst));
        return handleNonOptionalResult(result, inst);
    };
});
function handleNonOptionalResult(payload, inst) {
    if (!payload.issues.length && void 0 === payload.value) payload.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: payload.value,
        inst
    });
    return payload;
}
function handleCatchResult(payload, result, def, ctx) {
    if (!result.issues.length) {
        payload.value = result.value;
        if (result.memo) payload.memo = true;
        return payload;
    }
    payload.value = def.catchValue({
        ...result,
        value: payload.value,
        error: {
            issues: result.issues.map((iss)=>finalizeIssue(iss, ctx, core_config()))
        },
        input: payload.value
    });
    return payload;
}
const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "optin", (zod)=>"defaulted" === zod.def.innerType._zod.optin ? "defaulted" : "optional");
    defineLazyInternal(inst, "optout", (zod)=>zod.def.innerType._zod.optout);
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) return def.innerType._zod.run(payload, ctx);
        const result = def.innerType._zod.run({
            value: payload.value,
            issues: []
        }, ctx);
        if (result instanceof Promise) return result.then((result)=>handleCatchResult(payload, result, def, ctx));
        return handleCatchResult(payload, result, def, ctx);
    };
});
const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "values", (zod)=>zod.def.in._zod.values);
    defineLazyInternal(inst, "optin", (zod)=>zod.def.in._zod.optin);
    defineLazyInternal(inst, "optout", (zod)=>zod.def.out._zod.optout);
    defineLazyInternal(inst, "propValues", (zod)=>zod.def.in._zod.propValues);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) {
            const right = def.out._zod.run(payload, ctx);
            if (right instanceof Promise) return right.then((right)=>handlePipeResult(right, def.in, ctx));
            return handlePipeResult(right, def.in, ctx);
        }
        const left = def.in._zod.run(payload, ctx);
        if (left instanceof Promise) return left.then((left)=>handlePipeResult(left, def.out, ctx));
        return handlePipeResult(left, def.out, ctx);
    };
});
function handlePipeResult(left, next, ctx) {
    if (left.issues.some((iss)=>"unrecognized_keys" !== iss.code)) {
        left.aborted = true;
        return left;
    }
    return next._zod.run({
        value: left.value,
        issues: left.issues
    }, ctx);
}
const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazyInternal(inst, "propValues", (zod)=>zod.def.innerType._zod.propValues);
    defineLazyInternal(inst, "values", (zod)=>zod.def.innerType._zod.values);
    defineLazyInternal(inst, "optin", (zod)=>zod.def.innerType?._zod?.optin);
    defineLazyInternal(inst, "optout", (zod)=>zod.def.innerType?._zod?.optout);
    inst._zod.parse = (payload, ctx)=>{
        if ("backward" === ctx.direction) return def.innerType._zod.run(payload, ctx);
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) return result.then(handleReadonlyResult);
        return handleReadonlyResult(result);
    };
});
function handleReadonlyResult(payload) {
    if (!payload.memo) payload.value = Object.freeze(payload.value);
    return payload;
}
const $ZodLazy = /*@__PURE__*/ $constructor("$ZodLazy", (inst, def)=>{
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "innerType", ()=>{
        const d = def;
        if (!d._cachedInner) d._cachedInner = def.getter();
        return d._cachedInner;
    });
    defineLazyInternal(inst, "pattern", (zod)=>zod.innerType?._zod?.pattern);
    defineLazyInternal(inst, "propValues", (zod)=>zod.innerType?._zod?.propValues);
    defineLazyInternal(inst, "optin", (zod)=>zod.innerType?._zod?.optin ?? void 0);
    defineLazyInternal(inst, "optout", (zod)=>zod.innerType?._zod?.optout ?? void 0);
    inst._zod.parse = (payload, ctx)=>{
        const inner = inst._zod.innerType;
        return inner._zod.run(payload, ctx);
    };
});
const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def)=>{
    $ZodCheck.init(inst, def);
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _)=>payload;
    inst._zod.check = (payload)=>{
        const input = payload.value;
        const r = def.fn(input);
        if (r instanceof Promise) return r.then((r)=>handleRefineResult(r, payload, input, inst));
        handleRefineResult(r, payload, input, inst);
    };
});
function handleRefineResult(result, payload, input, inst) {
    if (!result) {
        const _iss = {
            code: "custom",
            input,
            inst,
            path: [
                ...inst._zod.def.path ?? []
            ],
            continue: !inst._zod.def.abort
        };
        if (inst._zod.def.params) _iss.params = inst._zod.def.params;
        payload.issues.push(util_issue(_iss));
    }
}
var registries_a;
class $ZodRegistry {
    constructor(){
        this._map = new WeakMap();
        this._idmap = new Map();
    }
    add(schema, ..._meta) {
        const meta = _meta[0];
        this._map.set(schema, meta);
        if (meta && "object" == typeof meta && "id" in meta) this._idmap.set(meta.id, schema);
        return this;
    }
    clear() {
        this._map = new WeakMap();
        this._idmap = new Map();
        return this;
    }
    remove(schema) {
        const meta = this._map.get(schema);
        if (meta && "object" == typeof meta && "id" in meta) this._idmap.delete(meta.id);
        this._map.delete(schema);
        return this;
    }
    get(schema) {
        const p = schema._zod.parent;
        if (p) {
            const pm = {
                ...this.get(p) ?? {}
            };
            delete pm.id;
            const f = {
                ...pm,
                ...this._map.get(schema)
            };
            return Object.keys(f).length ? f : void 0;
        }
        return this._map.get(schema);
    }
    has(schema) {
        return this._map.has(schema);
    }
}
function registries_registry() {
    return new $ZodRegistry();
}
(registries_a = globalThis).__zod_globalRegistry ?? (registries_a.__zod_globalRegistry = registries_registry());
const globalRegistry = globalThis.__zod_globalRegistry;
function snapshotChecks(def) {
    if (def.checks) def.checks = [
        ...def.checks
    ];
    return def;
}
function _string(Class, params) {
    return new Class(snapshotChecks({
        type: "string",
        ...normalizeParams(params)
    }));
}
function _email(Class, params) {
    return new Class({
        type: "string",
        format: "email",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _guid(Class, params) {
    return new Class({
        type: "string",
        format: "guid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _uuid(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _uuidv4(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v4",
        ...normalizeParams(params)
    });
}
function _uuidv6(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v6",
        ...normalizeParams(params)
    });
}
function _uuidv7(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v7",
        ...normalizeParams(params)
    });
}
function _url(Class, params) {
    return new Class({
        type: "string",
        format: "url",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function api_emoji(Class, params) {
    return new Class({
        type: "string",
        format: "emoji",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _nanoid(Class, params) {
    return new Class({
        type: "string",
        format: "nanoid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _cuid(Class, params) {
    return new Class({
        type: "string",
        format: "cuid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _cuid2(Class, params) {
    return new Class({
        type: "string",
        format: "cuid2",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _ulid(Class, params) {
    return new Class({
        type: "string",
        format: "ulid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _xid(Class, params) {
    return new Class({
        type: "string",
        format: "xid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _ksuid(Class, params) {
    return new Class({
        type: "string",
        format: "ksuid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _ipv4(Class, params) {
    return new Class({
        type: "string",
        format: "ipv4",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _ipv6(Class, params) {
    return new Class({
        type: "string",
        format: "ipv6",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _cidrv4(Class, params) {
    return new Class({
        type: "string",
        format: "cidrv4",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _cidrv6(Class, params) {
    return new Class({
        type: "string",
        format: "cidrv6",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _base64(Class, params) {
    return new Class({
        type: "string",
        format: "base64",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _base64url(Class, params) {
    return new Class({
        type: "string",
        format: "base64url",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _e164(Class, params) {
    return new Class({
        type: "string",
        format: "e164",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _jwt(Class, params) {
    return new Class({
        type: "string",
        format: "jwt",
        check: "string_format",
        abort: false,
        ...normalizeParams(params)
    });
}
function _isoDateTime(Class, params) {
    return new Class({
        type: "string",
        format: "datetime",
        check: "string_format",
        offset: false,
        local: false,
        precision: null,
        ...normalizeParams(params)
    });
}
function _isoDate(Class, params) {
    return new Class({
        type: "string",
        format: "date",
        check: "string_format",
        ...normalizeParams(params)
    });
}
function _isoTime(Class, params) {
    return new Class({
        type: "string",
        format: "time",
        check: "string_format",
        precision: null,
        ...normalizeParams(params)
    });
}
function _isoDuration(Class, params) {
    return new Class({
        type: "string",
        format: "duration",
        check: "string_format",
        ...normalizeParams(params)
    });
}
function _number(Class, params) {
    return new Class(snapshotChecks({
        type: "number",
        checks: [],
        ...normalizeParams(params)
    }));
}
function _int(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "safeint",
        ...normalizeParams(params)
    });
}
function _boolean(Class, params) {
    return new Class({
        type: "boolean",
        ...normalizeParams(params)
    });
}
function api_null(Class, params) {
    return new Class({
        type: "null",
        ...normalizeParams(params)
    });
}
function _unknown(Class) {
    return new Class({
        type: "unknown"
    });
}
function _never(Class, params) {
    return new Class({
        type: "never",
        ...normalizeParams(params)
    });
}
function _lt(value, params) {
    return new $ZodCheckLessThan({
        check: "less_than",
        ...normalizeParams(params),
        value,
        inclusive: false
    });
}
function _lte(value, params) {
    return new $ZodCheckLessThan({
        check: "less_than",
        ...normalizeParams(params),
        value,
        inclusive: true
    });
}
function _gt(value, params) {
    return new $ZodCheckGreaterThan({
        check: "greater_than",
        ...normalizeParams(params),
        value,
        inclusive: false
    });
}
function _gte(value, params) {
    return new $ZodCheckGreaterThan({
        check: "greater_than",
        ...normalizeParams(params),
        value,
        inclusive: true
    });
}
function _multipleOf(value, params) {
    return new $ZodCheckMultipleOf({
        check: "multiple_of",
        ...normalizeParams(params),
        value
    });
}
function _maxLength(maximum, params) {
    const ch = new $ZodCheckMaxLength({
        check: "max_length",
        ...normalizeParams(params),
        maximum
    });
    return ch;
}
function _minLength(minimum, params) {
    return new $ZodCheckMinLength({
        check: "min_length",
        ...normalizeParams(params),
        minimum
    });
}
function _length(length, params) {
    return new $ZodCheckLengthEquals({
        check: "length_equals",
        ...normalizeParams(params),
        length
    });
}
function _regex(pattern, params) {
    return new $ZodCheckRegex({
        check: "string_format",
        format: "regex",
        ...normalizeParams(params),
        pattern
    });
}
function _lowercase(params) {
    return new $ZodCheckLowerCase({
        check: "string_format",
        format: "lowercase",
        ...normalizeParams(params)
    });
}
function _uppercase(params) {
    return new $ZodCheckUpperCase({
        check: "string_format",
        format: "uppercase",
        ...normalizeParams(params)
    });
}
function _includes(includes, params) {
    return new $ZodCheckIncludes({
        check: "string_format",
        format: "includes",
        ...normalizeParams(params),
        includes
    });
}
function _startsWith(prefix, params) {
    return new $ZodCheckStartsWith({
        check: "string_format",
        format: "starts_with",
        ...normalizeParams(params),
        prefix
    });
}
function _endsWith(suffix, params) {
    return new $ZodCheckEndsWith({
        check: "string_format",
        format: "ends_with",
        ...normalizeParams(params),
        suffix
    });
}
function _overwrite(tx) {
    return new $ZodCheckOverwrite({
        check: "overwrite",
        tx
    });
}
function _normalize(form) {
    return _overwrite((input)=>input.normalize(form));
}
function _trim() {
    return _overwrite((input)=>input.trim());
}
function _toLowerCase() {
    return _overwrite((input)=>input.toLowerCase());
}
function _toUpperCase() {
    return _overwrite((input)=>input.toUpperCase());
}
function _slugify() {
    return _overwrite((input)=>slugify(input));
}
function _array(Class, element, params) {
    return new Class({
        type: "array",
        element,
        ...normalizeParams(params)
    });
}
function _refine(Class, fn, _params) {
    const schema = new Class({
        type: "custom",
        check: "custom",
        fn: fn,
        ...normalizeParams(_params)
    });
    return schema;
}
function _superRefine(fn, params) {
    const ch = _check((payload)=>{
        payload.addIssue = (issue)=>{
            if ("string" == typeof issue) payload.issues.push(util_issue(issue, payload.value, ch._zod.def));
            else {
                const _issue = issue;
                if (_issue.fatal) _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                if (!("input" in _issue)) _issue.input = payload.value;
                _issue.inst ?? (_issue.inst = ch);
                _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
                payload.issues.push(util_issue(_issue));
            }
        };
        return fn(payload.value, payload);
    }, params);
    return ch;
}
function _check(fn, params) {
    const ch = new $ZodCheck({
        check: "custom",
        ...normalizeParams(params)
    });
    ch._zod.check = fn;
    return ch;
}
function assignProps(target, ...sources) {
    for (const source of sources)for (const key of Reflect.ownKeys(source))if (Object.prototype.propertyIsEnumerable.call(source, key)) util_assignProp(target, key, source[key]);
    return target;
}
function to_json_schema_initializeContext(params) {
    let target = params?.target ?? "draft-2020-12";
    if ("draft-4" === target) target = "draft-04";
    if ("draft-7" === target) target = "draft-07";
    return {
        processors: params.processors ?? {},
        metadataRegistry: params?.metadata ?? globalRegistry,
        target,
        unrepresentable: params?.unrepresentable ?? "throw",
        override: params?.override ?? (()=>{}),
        io: params?.io ?? "output",
        counter: 0,
        seen: new Map(),
        sharedDefsExtractedFor: void 0,
        sharedEmitDoneFor: void 0,
        cycles: params?.cycles ?? "ref",
        reused: params?.reused ?? "inline",
        intersections: [],
        deferred: [],
        external: params?.external ?? void 0
    };
}
function to_json_schema_handleUnrepresentable(schema, ctx, json, params, message) {
    const result = "function" == typeof ctx.unrepresentable ? ctx.unrepresentable({
        zodSchema: schema,
        path: params.path,
        message
    }) : ctx.unrepresentable;
    if ("any" === result) return false;
    if (void 0 === result || "throw" === result) throw new Error(message);
    Object.assign(json, result);
    return true;
}
function to_json_schema_processSchema(schema, ctx, _params = {
    path: [],
    schemaPath: []
}) {
    var _a;
    const def = schema._zod.def;
    const seen = ctx.seen.get(schema);
    if (seen) {
        seen.count++;
        const isCycle = _params.schemaPath.includes(schema);
        if (isCycle) seen.cycle = _params.path;
        return seen.schema;
    }
    const result = {
        schema: {},
        count: 1,
        cycle: void 0,
        path: _params.path
    };
    ctx.seen.set(schema, result);
    ctx.sharedDefsExtractedFor = void 0;
    ctx.sharedEmitDoneFor = void 0;
    const overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema) result.schema = overrideSchema;
    else {
        const params = {
            ..._params,
            schemaPath: [
                ..._params.schemaPath,
                schema
            ],
            path: _params.path
        };
        if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
        else {
            const _json = result.schema;
            const processor = ctx.processors[def.type];
            if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
            processor(schema, ctx, _json, params);
        }
        const parent = schema._zod.parent;
        if (parent) {
            if (!result.ref) result.ref = parent;
            to_json_schema_processSchema(parent, ctx, params);
            ctx.seen.get(parent).isParent = true;
        }
    }
    const meta = ctx.metadataRegistry.get(schema);
    if (meta) assignProps(result.schema, meta);
    if ("input" === ctx.io && isTransforming(schema)) {
        delete result.schema.examples;
        delete result.schema.default;
    }
    if ("input" === ctx.io && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
    delete result.schema._prefault;
    const _result = ctx.seen.get(schema);
    return _result.schema;
}
function encodeJSONPointerSegment(segment) {
    return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function to_json_schema_extractDefs(ctx, schema) {
    const root = ctx.seen.get(schema);
    if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
    if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
    const idToSchema = new Map();
    for (const entry of ctx.seen.entries()){
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            const existing = idToSchema.get(id);
            if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
            idToSchema.set(id, entry[0]);
        }
    }
    const makeURI = (entry)=>{
        const defsSegment = "draft-2020-12" === ctx.target ? "$defs" : "definitions";
        if (ctx.external) {
            const externalId = ctx.external.registry.get(entry[0])?.id;
            const uriGenerator = ctx.external.uri ?? ((id)=>id);
            if (externalId) return {
                ref: uriGenerator(externalId)
            };
            const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
            entry[1].defId = id;
            return {
                defId: id,
                ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}`
            };
        }
        const uriPrefix = "#";
        const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
        if (entry[1] === root && !entry[1].schema.id) return {
            ref: uriPrefix
        };
        const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
        return {
            defId,
            ref: defUriPrefix + encodeJSONPointerSegment(defId)
        };
    };
    const extractToDef = (entry)=>{
        if (entry[1].schema.$ref) return;
        const seen = entry[1];
        const { ref, defId } = makeURI(entry);
        seen.def = {
            ...seen.schema
        };
        if (defId) seen.defId = defId;
        const schema = seen.schema;
        for(const key in schema)delete schema[key];
        schema.$ref = ref;
    };
    if ("throw" === ctx.cycles) for (const entry of ctx.seen.entries()){
        const seen = entry[1];
        if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>\n\nSet the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
    }
    for (const entry of ctx.seen.entries()){
        const seen = entry[1];
        if (schema === entry[0]) {
            extractToDef(entry);
            continue;
        }
        if (ctx.external) {
            const ext = ctx.external.registry.get(entry[0])?.id;
            if (schema !== entry[0] && ext) {
                extractToDef(entry);
                continue;
            }
        }
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            extractToDef(entry);
            continue;
        }
        if (seen.cycle) {
            extractToDef(entry);
            continue;
        }
        if (seen.count > 1) {
            if ("ref" === ctx.reused) extractToDef(entry);
        }
    }
    if (ctx.external) ctx.sharedDefsExtractedFor = ctx.external;
}
function compactTypeUnion(schema) {
    const options = schema.anyOf;
    if (!Array.isArray(options) || 0 === options.length || void 0 !== schema.type) return;
    const types = [];
    for (const option of options){
        if (!option || "object" != typeof option) return;
        compactTypeUnion(option);
        const keys = Object.keys(option);
        if (1 !== keys.length || "type" !== keys[0]) return;
        const type = option.type;
        for (const member of Array.isArray(type) ? type : [
            type
        ]){
            if ("string" != typeof member) return;
            if (!types.includes(member)) types.push(member);
        }
    }
    delete schema.anyOf;
    schema.type = 1 === types.length ? types[0] : types;
}
const FOLDABLE_KEYS = new Set([
    "type",
    "properties",
    "required",
    "additionalProperties"
]);
const UNION_KEYS = [
    "oneOf",
    "anyOf"
];
function undeclaredConstraint(member) {
    const extra = member.additionalProperties;
    if (void 0 === extra || false === extra || "object" != typeof extra || null === extra) return null;
    return Object.keys(extra).length ? extra : null;
}
function foldObjects(members) {
    const objects = [];
    for (const member of members){
        if ("object" != typeof member || "object" !== member.type) return null;
        for(const key in member)if (!FOLDABLE_KEYS.has(key)) return null;
        objects.push(member);
    }
    const properties = {};
    const required = new Set();
    for (const object of objects){
        for(const key in object.properties){
            if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
            const parts = [];
            for (const other of objects){
                const part = other.properties?.[key] ?? undeclaredConstraint(other);
                if (null != part) {
                    if (!parts.some((seen)=>JSON.stringify(seen) === JSON.stringify(part))) parts.push(part);
                }
            }
            const merged = 1 === parts.length ? parts[0] : foldObjects(parts) ?? {
                allOf: parts
            };
            util_assignProp(properties, key, merged);
        }
        for (const key of object.required ?? [])required.add(key);
    }
    const folded = {
        type: "object",
        properties
    };
    if (required.size) folded.required = [
        ...required
    ];
    if (objects.every((object)=>false === object.additionalProperties)) folded.additionalProperties = false;
    else {
        const constraints = [];
        for (const object of objects){
            const constraint = undeclaredConstraint(object);
            if (constraint && !constraints.some((seen)=>JSON.stringify(seen) === JSON.stringify(constraint))) constraints.push(constraint);
        }
        if (1 === constraints.length) folded.additionalProperties = constraints[0];
        else if (constraints.length > 1) folded.additionalProperties = {
            allOf: constraints
        };
    }
    return folded;
}
function foldIntersection(json) {
    const allOf = json.allOf;
    if (!Array.isArray(allOf) || allOf.length < 2) return;
    for (const key of FOLDABLE_KEYS)if (key in json) return;
    const unions = allOf.filter((m)=>UNION_KEYS.some((k)=>Array.isArray(m[k])));
    let folded = null;
    if (unions.length) {
        const union = unions[0];
        const keyword = UNION_KEYS.find((k)=>Array.isArray(union[k]));
        if (1 !== Object.keys(union).length) return;
        const rest = allOf.filter((m)=>m !== union);
        const branches = union[keyword].map((branch)=>foldObjects([
                ...rest,
                branch
            ]));
        if (branches.some((b)=>!b)) return;
        folded = {
            [keyword]: branches
        };
    } else folded = foldObjects(allOf);
    if (!folded) return;
    delete json.allOf;
    assignProps(json, folded);
}
function to_json_schema_finalize(ctx, schema) {
    const root = ctx.seen.get(schema);
    if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
    const flattenRef = (zodSchema)=>{
        const seen = ctx.seen.get(zodSchema);
        if (null === seen.ref) return;
        const schema = seen.def ?? seen.schema;
        const _cached = {
            ...schema
        };
        const ref = seen.ref;
        seen.ref = null;
        if (ref) {
            flattenRef(ref);
            const refSeen = ctx.seen.get(ref);
            const refSchema = refSeen.schema;
            if (refSchema.$ref && ("draft-07" === ctx.target || "draft-04" === ctx.target || "openapi-3.0" === ctx.target)) {
                schema.allOf = schema.allOf ?? [];
                schema.allOf.push(refSchema);
            } else assignProps(schema, refSchema);
            assignProps(schema, _cached);
            const isParentRef = zodSchema._zod.parent === ref;
            if (isParentRef) {
                for(const key in schema)if ("$ref" !== key && "allOf" !== key) {
                    if (!(key in _cached)) delete schema[key];
                }
            }
            if (refSchema.$ref && refSeen.def) {
                for(const key in schema)if ("$ref" !== key && "allOf" !== key) {
                    if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
                }
            }
        }
        const parent = zodSchema._zod.parent;
        if (parent && parent !== ref) {
            flattenRef(parent);
            const parentSeen = ctx.seen.get(parent);
            if (parentSeen?.schema.$ref) {
                schema.$ref = parentSeen.schema.$ref;
                if (parentSeen.def) {
                    for(const key in schema)if ("$ref" !== key && "allOf" !== key) {
                        if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
                    }
                }
            }
        }
        ctx.override({
            zodSchema: zodSchema,
            jsonSchema: schema,
            path: seen.path ?? []
        });
    };
    if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
        for (const entry of [
            ...ctx.seen.entries()
        ].reverse())flattenRef(entry[0]);
        if ("openapi-3.0" !== ctx.target) for (const entry of ctx.seen.entries())compactTypeUnion(entry[1].def ?? entry[1].schema);
        for (const rewrite of ctx.deferred)rewrite();
        if (ctx.intersections.length) {
            const carriers = new Map();
            for (const seen of ctx.seen.values())for (const json of [
                seen.schema,
                seen.def
            ]){
                const allOf = json?.allOf;
                if (!Array.isArray(allOf)) continue;
                const existing = carriers.get(allOf);
                if (existing) existing.push(json);
                else carriers.set(allOf, [
                    json
                ]);
            }
            for (const allOf of ctx.intersections)for (const json of carriers.get(allOf) ?? [])foldIntersection(json);
        }
    }
    const result = {};
    if ("draft-2020-12" === ctx.target) result.$schema = "https://json-schema.org/draft/2020-12/schema";
    else if ("draft-07" === ctx.target) result.$schema = "http://json-schema.org/draft-07/schema#";
    else if ("draft-04" === ctx.target) result.$schema = "http://json-schema.org/draft-04/schema#";
    else ctx.target;
    if (ctx.external?.uri) {
        const id = ctx.external.registry.get(schema)?.id;
        if (!id) throw new Error("Schema is missing an `id` property");
        result.$id = ctx.external.uri(id);
    }
    assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
    const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
    if (void 0 !== rootMetaId && result.id === rootMetaId) delete result.id;
    const defs = ctx.external?.defs ?? {};
    if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (const entry of ctx.seen.entries()){
        const seen = entry[1];
        if (seen.def && seen.defId) {
            if (seen.def.id === seen.defId) delete seen.def.id;
            util_assignProp(defs, seen.defId, seen.def);
        }
    }
    if (ctx.external) ctx.sharedEmitDoneFor = ctx.external;
    if (ctx.external) ;
    else if (Object.keys(defs).length > 0) if ("draft-2020-12" === ctx.target) result.$defs = defs;
    else result.definitions = defs;
    try {
        const finalized = JSON.parse(JSON.stringify(result));
        Object.defineProperty(finalized, "~standard", {
            value: {
                ...schema["~standard"],
                jsonSchema: {
                    input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
                    output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
                }
            },
            enumerable: false,
            writable: false
        });
        return finalized;
    } catch (_err) {
        throw new Error("Error converting schema to JSON.");
    }
}
function isTransforming(_schema, _ctx) {
    const ctx = _ctx ?? {
        seen: new Set()
    };
    if (ctx.seen.has(_schema)) return false;
    ctx.seen.add(_schema);
    const def = _schema._zod.def;
    if ("transform" === def.type) return true;
    if ("array" === def.type) return isTransforming(def.element, ctx);
    if ("set" === def.type) return isTransforming(def.valueType, ctx);
    if ("lazy" === def.type) return isTransforming(def.getter(), ctx);
    if ("promise" === def.type || "optional" === def.type || "nonoptional" === def.type || "nullable" === def.type || "readonly" === def.type || "default" === def.type || "prefault" === def.type || "catch" === def.type) return isTransforming(def.innerType, ctx);
    if ("intersection" === def.type) return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    if ("record" === def.type || "map" === def.type) return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    if ("pipe" === def.type) {
        if (_schema._zod.traits.has("$ZodCodec")) return true;
        return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    if ("object" === def.type) {
        for(const key in def.shape)if (isTransforming(def.shape[key], ctx)) return true;
        return false;
    }
    if ("union" === def.type) {
        for (const option of def.options)if (isTransforming(option, ctx)) return true;
        return false;
    }
    if ("tuple" === def.type) {
        for (const item of def.items)if (isTransforming(item, ctx)) return true;
        if (def.rest && isTransforming(def.rest, ctx)) return true;
    }
    return false;
}
const createToJSONSchemaMethod = (schema, processors = {})=>(params)=>{
        const ctx = to_json_schema_initializeContext({
            ...params,
            processors
        });
        to_json_schema_processSchema(schema, ctx);
        to_json_schema_extractDefs(ctx, schema);
        return to_json_schema_finalize(ctx, schema);
    };
const createStandardJSONSchemaMethod = (schema, io, processors = {})=>(params)=>{
        const { libraryOptions, target } = params ?? {};
        const ctx = to_json_schema_initializeContext({
            ...libraryOptions ?? {},
            target,
            io,
            processors
        });
        to_json_schema_processSchema(schema, ctx);
        to_json_schema_extractDefs(ctx, schema);
        return to_json_schema_finalize(ctx, schema);
    };
const narrowMin = (agg, key, value)=>{
    if (void 0 === agg[key] || value > agg[key]) agg[key] = value;
};
const narrowMax = (agg, key, value)=>{
    if (void 0 === agg[key] || value < agg[key]) agg[key] = value;
};
const narrowBoth = (agg, value)=>{
    narrowMin(agg, "minimum", value);
    narrowMax(agg, "maximum", value);
};
const addDivisor = (agg, value)=>{
    agg.multipleOf ?? (agg.multipleOf = []);
    if (!agg.multipleOf.includes(value)) agg.multipleOf.push(value);
};
const addPattern = (agg, pattern)=>{
    agg.patterns ?? (agg.patterns = new Set());
    agg.patterns.add(pattern);
};
const intersectMime = (agg, mime)=>{
    agg.mime = agg.mime ? agg.mime.filter((m)=>mime.includes(m)) : [
        ...mime
    ];
};
const setFormat = (agg, format)=>{
    agg.format = format;
    if (format.includes("int")) agg.isInt = true;
};
const minContributor = (agg, def)=>narrowMin(agg, "minimum", def.minimum);
const maxContributor = (agg, def)=>narrowMax(agg, "maximum", def.maximum);
const formatContributor = (ranges)=>(agg, def)=>{
        setFormat(agg, def.format);
        const [minimum, maximum] = ranges[def.format];
        narrowMin(agg, "minimum", minimum);
        narrowMax(agg, "maximum", maximum);
    };
const contributors = {
    greater_than: (agg, def)=>narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
    less_than: (agg, def)=>narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
    multiple_of: (agg, def)=>addDivisor(agg, def.value),
    number_format: formatContributor(NUMBER_FORMAT_RANGES),
    bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
    min_length: minContributor,
    max_length: maxContributor,
    length_equals: (agg, def)=>narrowBoth(agg, def.length),
    min_size: minContributor,
    max_size: maxContributor,
    size_equals: (agg, def)=>narrowBoth(agg, def.size),
    string_format: (agg, def)=>{
        setFormat(agg, def.format);
        if (def.pattern) addPattern(agg, def.pattern);
        if ("base64" === def.format || "base64url" === def.format) agg.contentEncoding = def.format;
        if (def.local || -1 === def.precision) agg.laxFormat = true;
    },
    mime_type: (agg, def)=>intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
    const agg = {};
    const def = schema._zod.def;
    const list = schema._zod.traits.has("$ZodCheck") ? [
        schema,
        ...def.checks ?? []
    ] : def.checks ?? [];
    for (const ch of list)contributors[ch._zod.def.check]?.(agg, ch._zod.def);
    const bag = schema._zod.bag;
    if (void 0 !== bag.minimum) narrowMin(agg, "minimum", bag.minimum);
    if (void 0 !== bag.exclusiveMinimum) narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
    if (void 0 !== bag.maximum) narrowMax(agg, "maximum", bag.maximum);
    if (void 0 !== bag.exclusiveMaximum) narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
    if (void 0 !== bag.multipleOf) addDivisor(agg, bag.multipleOf);
    if (void 0 !== bag.format) {
        agg.format ?? (agg.format = bag.format);
        if (bag.format.includes("int")) agg.isInt = true;
    }
    if (bag.mime) intersectMime(agg, bag.mime);
    for (const pattern of bag.patterns ?? [])addPattern(agg, pattern);
    return agg;
}
const formatMap = {
    guid: "uuid",
    url: "uri",
    datetime: "date-time",
    json_string: "json-string",
    regex: ""
};
const exactPatterns = new Map([
    [
        base64Charset,
        regexes_base64
    ],
    [
        base64urlCharset,
        regexes_base64url
    ]
]);
const exactPattern = (p)=>exactPatterns.get(p) ?? p;
const stringProcessor = (schema, ctx, _json, _params)=>{
    const json = _json;
    json.type = "string";
    const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
    if ("number" == typeof minimum) json.minLength = minimum;
    if ("number" == typeof maximum) json.maxLength = maximum;
    if (format) {
        json.format = formatMap[format] ?? format;
        if ("" === json.format) delete json.format;
        if ("time" === format || laxFormat) delete json.format;
    }
    if (contentEncoding) json.contentEncoding = contentEncoding;
    if (patterns && patterns.size > 0) {
        const patternList = [
            ...patterns
        ].map(exactPattern);
        if (1 === patternList.length) json.pattern = patternList[0].source;
        else if (patternList.length > 1) json.allOf = [
            ...patternList.map((regex)=>({
                    ..."draft-07" === ctx.target || "draft-04" === ctx.target || "openapi-3.0" === ctx.target ? {
                        type: "string"
                    } : {},
                    pattern: regex.source
                }))
        ];
    }
};
const numberProcessor = (schema, ctx, _json, params)=>{
    const json = _json;
    const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
    json.type = isInt ? "integer" : "number";
    const exMin = "number" == typeof exclusiveMinimum && exclusiveMinimum >= (minimum ?? -1 / 0);
    const exMax = "number" == typeof exclusiveMaximum && exclusiveMaximum <= (maximum ?? 1 / 0);
    const legacy = "draft-04" === ctx.target || "openapi-3.0" === ctx.target;
    if (exMin) if (legacy) {
        json.minimum = exclusiveMinimum;
        json.exclusiveMinimum = true;
    } else json.exclusiveMinimum = exclusiveMinimum;
    else if ("number" == typeof minimum) json.minimum = minimum;
    if (exMax) if (legacy) {
        json.maximum = exclusiveMaximum;
        json.exclusiveMaximum = true;
    } else json.exclusiveMaximum = exclusiveMaximum;
    else if ("number" == typeof maximum) json.maximum = maximum;
    if (multipleOf) {
        const divisors = new Set();
        for (const divisor of multipleOf)if (Number.isFinite(divisor) && 0 !== divisor) divisors.add(Math.abs(divisor));
        else to_json_schema_handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
        const [first, ...rest] = divisors;
        if (void 0 !== first) json.multipleOf = first;
        if (rest.length) json.allOf = [
            ...json.allOf ?? [],
            ...rest.map((m)=>({
                    multipleOf: m
                }))
        ];
    }
};
const booleanProcessor = (_schema, _ctx, json, _params)=>{
    json.type = "boolean";
};
const nullProcessor = (_schema, ctx, json, _params)=>{
    if ("openapi-3.0" === ctx.target) {
        json.type = "string";
        json.nullable = true;
        json.enum = [
            null
        ];
    } else json.type = "null";
};
const neverProcessor = (_schema, _ctx, json, _params)=>{
    json.not = {};
};
const unknownProcessor = (_schema, _ctx, _json, _params)=>{};
const enumProcessor = (schema, _ctx, json, _params)=>{
    const def = schema._zod.def;
    const values = getEnumValues(def.entries);
    if (0 === values.length) {
        json.not = {};
        return;
    }
    if (values.every((v)=>"number" == typeof v)) json.type = "number";
    if (values.every((v)=>"string" == typeof v)) json.type = "string";
    json.enum = values;
};
const literalProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    if (0 === def.values.length) {
        json.not = {};
        return;
    }
    const vals = [];
    for (const val of def.values)if (void 0 === val) {
        if (to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema")) return;
    } else if ("bigint" == typeof val) {
        if (to_json_schema_handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema")) return;
        vals.push(Number(val));
    } else vals.push(val);
    if (0 === vals.length) ;
    else if (1 === vals.length) {
        const val = vals[0];
        json.type = null === val ? "null" : typeof val;
        if ("draft-04" === ctx.target || "openapi-3.0" === ctx.target) json.enum = [
            val
        ];
        else json.const = val;
    } else {
        if (vals.every((v)=>"number" == typeof v)) json.type = "number";
        if (vals.every((v)=>"string" == typeof v)) json.type = "string";
        if (vals.every((v)=>"boolean" == typeof v)) json.type = "boolean";
        if (vals.every((v)=>null === v)) json.type = "null";
        json.enum = vals;
    }
};
const customProcessor = (schema, ctx, json, params)=>{
    to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
const transformProcessor = (schema, ctx, json, params)=>{
    to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
const arrayProcessor = (schema, ctx, _json, params)=>{
    const json = _json;
    const def = schema._zod.def;
    const { minimum, maximum } = aggregateChecks(schema);
    if ("number" == typeof minimum) json.minItems = minimum;
    if ("number" == typeof maximum) json.maxItems = maximum;
    json.type = "array";
    json.items = to_json_schema_processSchema(def.element, ctx, {
        ...params,
        path: [
            ...params.path,
            "items"
        ]
    });
};
function inputOptin(schema) {
    const def = schema._zod.def;
    if ("pipe" === def.type && def.in._zod.traits.has("$ZodTransform")) return inputOptin(def.out);
    if ("catch" === def.type) return inputOptin(def.innerType);
    return schema._zod.optin;
}
const objectProcessor = (schema, ctx, _json, params)=>{
    const json = _json;
    const def = schema._zod.def;
    const shape = def.shape;
    const symbolKeys = Object.getOwnPropertySymbols(shape);
    if (symbolKeys.length && to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
    json.type = "object";
    json.properties = {};
    for(const key in shape)util_assignProp(json.properties, key, to_json_schema_processSchema(shape[key], ctx, {
        ...params,
        path: [
            ...params.path,
            "properties",
            key
        ]
    }));
    const requiredKeys = [];
    for (const key of Object.keys(shape)){
        const field = def.shape[key];
        if ("input" === ctx.io ? void 0 === inputOptin(field) : void 0 === field._zod.optout) requiredKeys.push(key);
    }
    if (requiredKeys.length > 0) json.required = requiredKeys;
    if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
    else if (def.catchall) {
        if (def.catchall) json.additionalProperties = to_json_schema_processSchema(def.catchall, ctx, {
            ...params,
            path: [
                ...params.path,
                "additionalProperties"
            ]
        });
    } else if ("output" === ctx.io) json.additionalProperties = false;
};
const unionProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    const isExclusive = false === def.inclusive;
    const options = def.options.map((x, i)=>to_json_schema_processSchema(x, ctx, {
            ...params,
            path: [
                ...params.path,
                isExclusive ? "oneOf" : "anyOf",
                i
            ]
        }));
    if (isExclusive) json.oneOf = options;
    else json.anyOf = options;
};
const intersectionProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    const a = to_json_schema_processSchema(def.left, ctx, {
        ...params,
        path: [
            ...params.path,
            "allOf",
            0
        ]
    });
    const b = to_json_schema_processSchema(def.right, ctx, {
        ...params,
        path: [
            ...params.path,
            "allOf",
            1
        ]
    });
    const isSimpleIntersection = (val)=>"allOf" in val && 1 === Object.keys(val).length;
    const allOf = [
        ...isSimpleIntersection(a) ? a.allOf : [
            a
        ],
        ...isSimpleIntersection(b) ? b.allOf : [
            b
        ]
    ];
    json.allOf = allOf;
    ctx.intersections.push(allOf);
};
function stringifyKeyNames(bySchema, json, visited) {
    if (json.$ref) {
        if (visited.has(json)) return json;
        visited.add(json);
        const def = bySchema.get(json)?.def;
        if (!def) return json;
        const inlined = stringifyKeyNames(bySchema, def, visited);
        return inlined === def ? json : inlined;
    }
    for (const keyword of [
        "anyOf",
        "oneOf"
    ]){
        const branches = json[keyword];
        if (!Array.isArray(branches)) continue;
        const mapped = branches.map((branch)=>stringifyKeyNames(bySchema, branch, visited));
        if (mapped.some((branch, i)=>branch !== branches[i])) json = {
            ...json,
            [keyword]: mapped
        };
    }
    const types = Array.isArray(json.type) ? json.type : [
        json.type
    ];
    const numericType = !types.includes("string") && types.some((t)=>"number" === t || "integer" === t);
    const values = json.enum ?? (void 0 !== json.const ? [
        json.const
    ] : void 0);
    if (!numericType && !values?.some((v)=>"number" == typeof v)) return json;
    const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json;
    if (rest.enum) rest.enum = rest.enum.map((v)=>"number" == typeof v ? String(v) : v);
    else if ("number" == typeof rest.const) rest.const = String(rest.const);
    if (!numericType) return rest;
    rest.type = "string";
    if (!values) rest.pattern = (types.includes("number") ? number : integer).source;
    return rest;
}
const pendingRecords = new WeakMap();
function rewriteKeyNames(ctx) {
    const bySchema = new Map();
    for (const entry of ctx.seen.values())if (entry.def && !bySchema.has(entry.schema)) bySchema.set(entry.schema, entry);
    const rewrites = new Map();
    for (const record of pendingRecords.get(ctx) ?? []){
        const seen = ctx.seen.get(record);
        const names = (seen?.def ?? seen?.schema)?.propertyNames;
        if (!names || true === names || rewrites.has(names)) continue;
        const rewritten = stringifyKeyNames(bySchema, names, new Set());
        if (rewritten !== names) rewrites.set(names, rewritten);
    }
    if (!rewrites.size) return;
    for (const entry of ctx.seen.values())for (const carrier of [
        entry.schema,
        entry.def
    ]){
        const rewritten = carrier && rewrites.get(carrier.propertyNames);
        if (rewritten) carrier.propertyNames = rewritten;
    }
}
const recordProcessor = (schema, ctx, _json, params)=>{
    const json = _json;
    const def = schema._zod.def;
    json.type = "object";
    const keyType = def.keyType;
    const patterns = aggregateChecks(keyType).patterns;
    if ("loose" === def.mode && patterns && patterns.size > 0) {
        const valueSchema = to_json_schema_processSchema(def.valueType, ctx, {
            ...params,
            path: [
                ...params.path,
                "patternProperties",
                "*"
            ]
        });
        json.patternProperties = {};
        for (const pattern of patterns)util_assignProp(json.patternProperties, exactPattern(pattern).source, valueSchema);
    } else {
        if ("draft-07" === ctx.target || "draft-2020-12" === ctx.target) {
            json.propertyNames = to_json_schema_processSchema(def.keyType, ctx, {
                ...params,
                path: [
                    ...params.path,
                    "propertyNames"
                ]
            });
            let pending = pendingRecords.get(ctx);
            if (!pending) {
                pending = [];
                pendingRecords.set(ctx, pending);
                ctx.deferred.push(()=>rewriteKeyNames(ctx));
            }
            pending.push(schema);
        }
        json.additionalProperties = to_json_schema_processSchema(def.valueType, ctx, {
            ...params,
            path: [
                ...params.path,
                "additionalProperties"
            ]
        });
    }
    const keyValues = keyType._zod.values;
    const omittableOnInput = "input" === ctx.io && void 0 !== inputOptin(def.valueType);
    if (keyValues && !def.partial && !omittableOnInput) {
        const validKeyValues = [
            ...keyValues
        ].filter((v)=>"string" == typeof v || "number" == typeof v);
        if (validKeyValues.length > 0) json.required = validKeyValues.map(String);
    }
};
const nullableProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    const inner = to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    if ("openapi-3.0" === ctx.target) {
        seen.ref = def.innerType;
        json.nullable = true;
    } else json.anyOf = [
        inner,
        {
            type: "null"
        }
    ];
};
const nonoptionalProcessor = (schema, ctx, _json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
    let unrepresentable = false;
    const serialized = JSON.stringify(value, (_, val)=>{
        if ("bigint" != typeof val) return val;
        unrepresentable = true;
        return null;
    });
    if (!unrepresentable) return JSON.parse(serialized);
    to_json_schema_handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
    return UNREPRESENTABLE_DEFAULT;
}
const defaultProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
    if (value !== UNREPRESENTABLE_DEFAULT) json.default = value;
};
const prefaultProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    if ("input" !== ctx.io) return;
    const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
    if (value !== UNREPRESENTABLE_DEFAULT) json._prefault = value;
};
const catchProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    let catchValue;
    try {
        catchValue = def.catchValue(void 0);
    } catch  {
        to_json_schema_handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
        return;
    }
    json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params)=>{
    const def = schema._zod.def;
    const inIsTransform = def.in._zod.traits.has("$ZodTransform");
    const innerType = "input" === ctx.io ? inIsTransform ? def.out : def.in : def.out;
    to_json_schema_processSchema(innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    json.readOnly = true;
};
const optionalProcessor = (schema, ctx, _json, params)=>{
    const def = schema._zod.def;
    to_json_schema_processSchema(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const lazyProcessor = (schema, ctx, _json, params)=>{
    const innerType = schema._zod.innerType;
    to_json_schema_processSchema(innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = innerType;
};
const en_error = ()=>{
    const Sizable = {
        string: {
            unit: "characters",
            verb: "to have"
        },
        file: {
            unit: "bytes",
            verb: "to have"
        },
        array: {
            unit: "items",
            verb: "to have"
        },
        set: {
            unit: "items",
            verb: "to have"
        },
        map: {
            unit: "entries",
            verb: "to have"
        }
    };
    function getSizing(origin) {
        return Sizable[origin] ?? null;
    }
    const FormatDictionary = {
        regex: "input",
        email: "email address",
        url: "URL",
        emoji: "emoji",
        uuid: "UUID",
        uuidv4: "UUIDv4",
        uuidv6: "UUIDv6",
        nanoid: "nanoid",
        guid: "GUID",
        cuid: "cuid",
        cuid2: "cuid2",
        ulid: "ULID",
        xid: "XID",
        ksuid: "KSUID",
        datetime: "ISO datetime",
        date: "ISO date",
        time: "ISO time",
        duration: "ISO duration",
        ipv4: "IPv4 address",
        ipv6: "IPv6 address",
        mac: "MAC address",
        cidrv4: "IPv4 range",
        cidrv6: "IPv6 range",
        base64: "base64-encoded string",
        base64url: "base64url-encoded string",
        json_string: "JSON string",
        e164: "E.164 number",
        currency_code: "currency code",
        credit_card: "credit card number",
        iban: "IBAN",
        jwt: "JWT",
        template_literal: "input"
    };
    const TypeDictionary = {
        nan: "NaN"
    };
    function getTypeName(type, input) {
        if ("number" === type && "number" == typeof input && !Number.isFinite(input)) return String(input);
        return TypeDictionary[type] ?? type;
    }
    return (issue)=>{
        switch(issue.code){
            case "invalid_type":
                {
                    const expected = getTypeName(issue.expected);
                    const receivedType = parsedType(issue.input);
                    const received = getTypeName(receivedType, issue.input);
                    return `Invalid input: expected ${expected}, received ${received}`;
                }
            case "invalid_value":
                if (1 === issue.values.length) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
                return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
            case "too_big":
                {
                    const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
                    const sizing = getSizing(issue.origin);
                    if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
                    return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
                }
            case "too_small":
                {
                    const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
                    const sizing = getSizing(issue.origin);
                    if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
                    return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
                }
            case "invalid_format":
                {
                    const _issue = issue;
                    if ("starts_with" === _issue.format) return `Invalid string: must start with "${_issue.prefix}"`;
                    if ("ends_with" === _issue.format) return `Invalid string: must end with "${_issue.suffix}"`;
                    if ("includes" === _issue.format) return `Invalid string: must include "${_issue.includes}"`;
                    if ("regex" === _issue.format) return `Invalid string: must match pattern ${_issue.pattern}`;
                    return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
                }
            case "not_multiple_of":
                return `Invalid number: must be a multiple of ${issue.divisor}`;
            case "unrecognized_keys":
                return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
            case "invalid_key":
                return `Invalid key in ${issue.origin}`;
            case "invalid_union":
                if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) {
                    const opts = issue.options.map((o)=>`'${o}'`).join(" | ");
                    return `Invalid discriminator value. Expected ${opts}`;
                }
                if (false === issue.inclusive) return "Invalid input: more than one option matched";
                return "Invalid input";
            case "invalid_element":
                return `Invalid value in ${issue.origin}`;
            default:
                return "Invalid input";
        }
    };
};
function en() {
    return {
        localeError: en_error()
    };
}
function finalizeParams(callee, params) {
    return {
        callee: params?.callee ?? callee,
        Err: params?.Err
    };
}
const parse_parse = (_Err)=>{
    const fn = (schema, value, _ctx, _params)=>{
        const ctx = _ctx ? {
            ..._ctx,
            async: false
        } : {
            async: false
        };
        const result = schema._zod.run({
            value,
            issues: []
        }, ctx);
        if (result instanceof Promise) throw new $ZodAsyncError();
        if (result.issues.length) {
            const e = new (_params?.Err ?? _Err)(result.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())));
            captureStackTrace(e, _params?.callee ?? fn);
            throw e;
        }
        return result.value;
    };
    return fn;
};
const parse_parseAsync = (_Err)=>{
    const fn = async (schema, value, _ctx, params)=>{
        const ctx = _ctx ? {
            ..._ctx,
            async: true
        } : {
            async: true
        };
        let result = schema._zod.run({
            value,
            issues: []
        }, ctx);
        if (result instanceof Promise) result = await result;
        if (result.issues.length) {
            const e = new (params?.Err ?? _Err)(result.issues.map((iss)=>finalizeIssue(iss, ctx, core_config())));
            captureStackTrace(e, params?.callee ?? fn);
            throw e;
        }
        return result.value;
    };
    return fn;
};
const _safeParse = (_Err)=>(schema, value, _ctx)=>{
        const ctx = _ctx ? {
            ..._ctx,
            async: false
        } : {
            async: false
        };
        const result = schema._zod.run({
            value,
            issues: []
        }, ctx);
        if (result instanceof Promise) throw new $ZodAsyncError();
        return result.issues.length ? failure(_Err, result.issues, ctx) : {
            success: true,
            data: result.value
        };
    };
function failure(Err, issues, ctx) {
    let error;
    return {
        success: false,
        get error () {
            if (!error) {
                error = new Err(issues.map((iss)=>finalizeIssue(iss, ctx, core_config())));
                issues = void 0;
                ctx = void 0;
            }
            return error;
        },
        set error (e){
            error = e;
            issues = void 0;
            ctx = void 0;
        }
    };
}
const _safeParseAsync = (_Err)=>async (schema, value, _ctx)=>{
        const ctx = _ctx ? {
            ..._ctx,
            async: true
        } : {
            async: true
        };
        let result = schema._zod.run({
            value,
            issues: []
        }, ctx);
        if (result instanceof Promise) result = await result;
        return result.issues.length ? failure(_Err, result.issues, ctx) : {
            success: true,
            data: result.value
        };
    };
const COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
const COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
const validate = (schema, value, _ctx)=>{
    const validator = schema._zod.bag.validator;
    if (void 0 !== validator) {
        if (validator(value) !== COMPILE_INVALID) return true;
        if (true === validator.definite && void 0 === _ctx) return false;
    }
    return validateFallback(schema, value, _ctx);
};
function validateFallback(schema, value, _ctx) {
    const ctx = _ctx ? {
        ..._ctx,
        async: false,
        abortEarly: true
    } : {
        async: false,
        abortEarly: true
    };
    const fallbackRun = schema._zod.bag.fallbackRun;
    let result;
    if (fallbackRun) {
        ctx[COMPILE_FALLBACK] = true;
        result = fallbackRun({
            value,
            issues: []
        }, ctx);
    } else result = schema._zod.run({
        value,
        issues: []
    }, ctx);
    if (result instanceof Promise) throw new $ZodAsyncError();
    return 0 === result.issues.length;
}
const parse_validateAsync = async (schema, value, _ctx)=>{
    const ctx = _ctx ? {
        ..._ctx,
        async: true,
        abortEarly: true
    } : {
        async: true,
        abortEarly: true
    };
    let result = schema._zod.run({
        value,
        issues: []
    }, ctx);
    if (result instanceof Promise) result = await result;
    return 0 === result.issues.length;
};
const parse_encode = (_Err)=>{
    const parse = parse_parse(_Err);
    const fn = (schema, value, _ctx, _params)=>{
        const ctx = _ctx ? {
            ..._ctx,
            direction: "backward"
        } : {
            direction: "backward"
        };
        return parse(schema, value, ctx, finalizeParams(fn, _params));
    };
    return fn;
};
const parse_decode = (_Err)=>{
    const parse = parse_parse(_Err);
    const fn = (schema, value, _ctx, _params)=>parse(schema, value, _ctx, finalizeParams(fn, _params));
    return fn;
};
const parse_encodeAsync = (_Err)=>{
    const parseAsync = parse_parseAsync(_Err);
    const fn = async (schema, value, _ctx, _params)=>{
        const ctx = _ctx ? {
            ..._ctx,
            direction: "backward"
        } : {
            direction: "backward"
        };
        return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
    };
    return fn;
};
const parse_decodeAsync = (_Err)=>{
    const parseAsync = parse_parseAsync(_Err);
    const fn = async (schema, value, _ctx, _params)=>await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
    return fn;
};
const _safeEncode = (_Err)=>(schema, value, _ctx)=>{
        const ctx = _ctx ? {
            ..._ctx,
            direction: "backward"
        } : {
            direction: "backward"
        };
        return _safeParse(_Err)(schema, value, ctx);
    };
const _safeDecode = (_Err)=>(schema, value, _ctx)=>_safeParse(_Err)(schema, value, _ctx);
const _safeEncodeAsync = (_Err)=>async (schema, value, _ctx)=>{
        const ctx = _ctx ? {
            ..._ctx,
            direction: "backward"
        } : {
            direction: "backward"
        };
        return _safeParseAsync(_Err)(schema, value, ctx);
    };
const _safeDecodeAsync = (_Err)=>async (schema, value, _ctx)=>_safeParseAsync(_Err)(schema, value, _ctx);
const classic_parse_parse = /* @__PURE__ */ parse_parse(ZodRealError);
const classic_parse_parseAsync = /* @__PURE__ */ parse_parseAsync(ZodRealError);
const parse_safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const parse_safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const classic_parse_encode = /* @__PURE__ */ parse_encode(ZodRealError);
const classic_parse_decode = /* @__PURE__ */ parse_decode(ZodRealError);
const classic_parse_encodeAsync = /* @__PURE__ */ parse_encodeAsync(ZodRealError);
const classic_parse_decodeAsync = /* @__PURE__ */ parse_decodeAsync(ZodRealError);
const parse_safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const parse_safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const parse_safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const parse_safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
function _ensureDefaultLocale() {
    if (!globalConfig.localeError) core_config(en());
}
function _ensureDefaultMemoizer() {
    if (!globalConfig.memoizer) core_config({
        memoizer: memoizer()
    });
}
const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def)=>{
    _ensureDefaultLocale();
    $ZodType.init(inst, def);
    inst.def = def;
    inst.type = def.type;
    return inst;
}, {
    check (...chks) {
        const def = this.def;
        return this.clone(mergeDefs(def, {
            checks: [
                ...def.checks ?? [],
                ...chks.map((ch)=>"function" == typeof ch ? {
                        _zod: {
                            check: ch,
                            def: {
                                check: "custom"
                            },
                            onattach: []
                        }
                    } : ch)
            ]
        }), {
            parent: true
        });
    },
    with (...chks) {
        return this.check(...chks);
    },
    clone (def, params) {
        return clone(this, def, params);
    },
    brand () {
        return this;
    },
    register (reg, meta) {
        reg.add(this, meta);
        return this;
    },
    refine (check, params) {
        return this.check(refine(check, params));
    },
    superRefine (refinement, params) {
        return this.check(superRefine(refinement, params));
    },
    overwrite (fn) {
        return this.check(_overwrite(fn));
    },
    optional () {
        return schemas_optional(this);
    },
    exactOptional () {
        return exactOptional(this);
    },
    nullable () {
        return nullable(this);
    },
    nullish () {
        return schemas_optional(nullable(this));
    },
    nonoptional (params) {
        return nonoptional(this, params);
    },
    array () {
        return schemas_array(this);
    },
    or (arg) {
        return schemas_union([
            this,
            arg
        ]);
    },
    and (arg) {
        return intersection(this, arg);
    },
    transform (tx) {
        return pipe(this, transform(tx));
    },
    default (d) {
        return schemas_default(this, d);
    },
    prefault (d) {
        return prefault(this, d);
    },
    catch (params) {
        return schemas_catch(this, params);
    },
    pipe (target) {
        return pipe(this, target);
    },
    readonly () {
        return readonly(this);
    },
    describe (description) {
        const cl = this.clone();
        globalRegistry.add(cl, {
            description
        });
        return cl;
    },
    meta (...args) {
        if (0 === args.length) return globalRegistry.get(this);
        const cl = this.clone();
        globalRegistry.add(cl, args[0]);
        return cl;
    },
    isOptional () {
        return this.safeParse(void 0).success;
    },
    isNullable () {
        return this.safeParse(null).success;
    },
    apply (fn, ...args) {
        return 0 === args.length ? fn(this) : fn(this, ...args);
    },
    get "~standard" () {
        return hide(this, "~standard", {
            ...standardProps(this),
            jsonSchema: {
                input: createStandardJSONSchemaMethod(this, "input"),
                output: createStandardJSONSchemaMethod(this, "output")
            }
        });
    },
    set "~standard" (value){
        util_own(this, "~standard", value);
    },
    parse: function _parse(data, params) {
        return classic_parse_parse(this, data, params, {
            callee: _parse
        });
    },
    parseAsync: async function _parseAsync(data, params) {
        return await classic_parse_parseAsync(this, data, params, {
            callee: _parseAsync
        });
    },
    safeParse (data, params) {
        return parse_safeParse(this, data, params);
    },
    async safeParseAsync (data, params) {
        return parse_safeParseAsync(this, data, params);
    },
    get spa () {
        return this?.safeParseAsync;
    },
    set spa (value){
        util_own(this, "spa", value);
    },
    validate (data, params) {
        return validate(this, data, params);
    },
    validateAsync (data, params) {
        return parse_validateAsync(this, data, params);
    },
    encode: function _encode(data, params) {
        return classic_parse_encode(this, data, params, {
            callee: _encode
        });
    },
    decode: function _decode(data, params) {
        return classic_parse_decode(this, data, params, {
            callee: _decode
        });
    },
    encodeAsync: async function _encodeAsync(data, params) {
        return await classic_parse_encodeAsync(this, data, params, {
            callee: _encodeAsync
        });
    },
    decodeAsync: async function _decodeAsync(data, params) {
        return await classic_parse_decodeAsync(this, data, params, {
            callee: _decodeAsync
        });
    },
    safeEncode (data, params) {
        return parse_safeEncode(this, data, params);
    },
    safeDecode (data, params) {
        return parse_safeDecode(this, data, params);
    },
    async safeEncodeAsync (data, params) {
        return parse_safeEncodeAsync(this, data, params);
    },
    async safeDecodeAsync (data, params) {
        return parse_safeDecodeAsync(this, data, params);
    },
    toJSONSchema (params) {
        return createToJSONSchemaMethod(this, {})(params);
    },
    get description () {
        return globalRegistry.get(this)?.description;
    },
    get _def () {
        return this._zod.def;
    }
});
const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def)=>{
    $ZodString.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>stringProcessor(inst, ctx, json, params);
}, /*@__PURE__*/ derived({
    format: (inst)=>aggregateChecks(inst).format ?? null,
    minLength: (inst)=>aggregateChecks(inst).minimum ?? null,
    maxLength: (inst)=>aggregateChecks(inst).maximum ?? null
}, {
    regex (...args) {
        return this.check(_regex(...args));
    },
    includes (...args) {
        return this.check(_includes(...args));
    },
    startsWith (...args) {
        return this.check(_startsWith(...args));
    },
    endsWith (...args) {
        return this.check(_endsWith(...args));
    },
    min (...args) {
        return this.check(_minLength(...args));
    },
    max (...args) {
        return this.check(_maxLength(...args));
    },
    length (...args) {
        return this.check(_length(...args));
    },
    nonempty (...args) {
        return this.check(_minLength(1, ...args));
    },
    lowercase (params) {
        return this.check(_lowercase(params));
    },
    uppercase (params) {
        return this.check(_uppercase(params));
    },
    trim () {
        return this.check(_trim());
    },
    normalize (...args) {
        return this.check(_normalize(...args));
    },
    toLowerCase () {
        return this.check(_toLowerCase());
    },
    toUpperCase () {
        return this.check(_toUpperCase());
    },
    slugify () {
        return this.check(_slugify());
    }
}));
const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def)=>{
    $ZodString.init(inst, def);
    _ZodString.init(inst, def);
}, {
    email (params) {
        return this.check(_email(ZodEmail, params));
    },
    url (params) {
        return this.check(_url(ZodURL, params));
    },
    jwt (params) {
        return this.check(_jwt(ZodJWT, params));
    },
    emoji (params) {
        return this.check(api_emoji(ZodEmoji, params));
    },
    guid (params) {
        return this.check(_guid(ZodGUID, params));
    },
    uuid (params) {
        return this.check(_uuid(ZodUUID, params));
    },
    uuidv4 (params) {
        return this.check(_uuidv4(ZodUUID, params));
    },
    uuidv6 (params) {
        return this.check(_uuidv6(ZodUUID, params));
    },
    uuidv7 (params) {
        return this.check(_uuidv7(ZodUUID, params));
    },
    nanoid (params) {
        return this.check(_nanoid(ZodNanoID, params));
    },
    cuid (params) {
        return this.check(_cuid(ZodCUID, params));
    },
    cuid2 (params) {
        return this.check(_cuid2(ZodCUID2, params));
    },
    ulid (params) {
        return this.check(_ulid(ZodULID, params));
    },
    base64 (params) {
        return this.check(_base64(ZodBase64, params));
    },
    base64url (params) {
        return this.check(_base64url(ZodBase64URL, params));
    },
    xid (params) {
        return this.check(_xid(ZodXID, params));
    },
    ksuid (params) {
        return this.check(_ksuid(ZodKSUID, params));
    },
    ipv4 (params) {
        return this.check(_ipv4(ZodIPv4, params));
    },
    ipv6 (params) {
        return this.check(_ipv6(ZodIPv6, params));
    },
    cidrv4 (params) {
        return this.check(_cidrv4(ZodCIDRv4, params));
    },
    cidrv6 (params) {
        return this.check(_cidrv6(ZodCIDRv6, params));
    },
    e164 (params) {
        return this.check(_e164(ZodE164, params));
    },
    datetime (params) {
        return this.check(_isoDateTime(ZodISODateTime, params));
    },
    date (params) {
        return this.check(_isoDate(ZodISODate, params));
    },
    time (params) {
        return this.check(_isoTime(ZodISOTime, params));
    },
    duration (params) {
        return this.check(_isoDuration(ZodISODuration, params));
    }
});
function schemas_string(params) {
    return _string(ZodString, params);
}
const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def)=>{
    $ZodStringFormat.init(inst, def);
    _ZodString.init(inst, def);
});
const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def)=>{
    $ZodISODateTime.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def)=>{
    $ZodISODate.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def)=>{
    $ZodISOTime.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def)=>{
    $ZodISODuration.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def)=>{
    $ZodEmail.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def)=>{
    $ZodGUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def)=>{
    $ZodUUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def)=>{
    $ZodURL.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def)=>{
    $ZodEmoji.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def)=>{
    $ZodNanoID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def)=>{
    $ZodCUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def)=>{
    $ZodCUID2.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def)=>{
    $ZodULID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def)=>{
    $ZodXID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def)=>{
    $ZodKSUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def)=>{
    $ZodIPv4.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def)=>{
    $ZodIPv6.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def)=>{
    $ZodCIDRv4.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def)=>{
    $ZodCIDRv6.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def)=>{
    $ZodBase64.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def)=>{
    $ZodBase64URL.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def)=>{
    $ZodE164.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def)=>{
    $ZodJWT.init(inst, def);
    ZodStringFormat.init(inst, def);
});
const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def)=>{
    $ZodNumber.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>numberProcessor(inst, ctx, json, params);
    inst.isFinite = true;
}, /*@__PURE__*/ derived({
    minValue: (inst)=>{
        const { minimum, exclusiveMinimum } = aggregateChecks(inst);
        return Math.max(minimum ?? -1 / 0, exclusiveMinimum ?? -1 / 0);
    },
    maxValue: (inst)=>{
        const { maximum, exclusiveMaximum } = aggregateChecks(inst);
        return Math.min(maximum ?? 1 / 0, exclusiveMaximum ?? 1 / 0);
    },
    isInt: (inst)=>{
        const { isInt, multipleOf } = aggregateChecks(inst);
        return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
    },
    format: (inst)=>aggregateChecks(inst).format ?? null
}, {
    gt (value, params) {
        return this.check(_gt(value, params));
    },
    gte (value, params) {
        return this.check(_gte(value, params));
    },
    min (value, params) {
        return this.check(_gte(value, params));
    },
    lt (value, params) {
        return this.check(_lt(value, params));
    },
    lte (value, params) {
        return this.check(_lte(value, params));
    },
    max (value, params) {
        return this.check(_lte(value, params));
    },
    int (params) {
        return this.check(schemas_int(params));
    },
    safe (params) {
        return this.check(schemas_int(params));
    },
    positive (params) {
        return this.check(_gt(0, params));
    },
    nonnegative (params) {
        return this.check(_gte(0, params));
    },
    negative (params) {
        return this.check(_lt(0, params));
    },
    nonpositive (params) {
        return this.check(_lte(0, params));
    },
    multipleOf (value, params) {
        return this.check(_multipleOf(value, params));
    },
    step (value, params) {
        return this.check(_multipleOf(value, params));
    },
    finite () {
        return this;
    }
}));
function schemas_number(params) {
    return _number(ZodNumber, params);
}
const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def)=>{
    $ZodNumberFormat.init(inst, def);
    ZodNumber.init(inst, def);
});
function schemas_int(params) {
    return _int(ZodNumberFormat, params);
}
const ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def)=>{
    $ZodBoolean.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>booleanProcessor(inst, ctx, json, params);
});
function schemas_boolean(params) {
    return _boolean(ZodBoolean, params);
}
const ZodNull = /*@__PURE__*/ $constructor("ZodNull", (inst, def)=>{
    $ZodNull.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>nullProcessor(inst, ctx, json, params);
});
function schemas_null(params) {
    return api_null(ZodNull, params);
}
const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def)=>{
    $ZodUnknown.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>unknownProcessor(inst, ctx, json, params);
});
function unknown() {
    return _unknown(ZodUnknown);
}
const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def)=>{
    $ZodNever.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>neverProcessor(inst, ctx, json, params);
});
function never(params) {
    return _never(ZodNever, params);
}
const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def)=>{
    _ensureDefaultMemoizer();
    $ZodArray.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>arrayProcessor(inst, ctx, json, params);
    inst.element = def.element;
}, {
    min (n, params) {
        return this.check(_minLength(n, params));
    },
    nonempty (params) {
        return this.check(_minLength(1, params));
    },
    max (n, params) {
        return this.check(_maxLength(n, params));
    },
    length (n, params) {
        return this.check(_length(n, params));
    },
    unwrap () {
        return this.element;
    }
});
function schemas_array(element, params) {
    return _array(ZodArray, element, params);
}
const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def)=>{
    _ensureDefaultMemoizer();
    $ZodObjectJIT.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>objectProcessor(inst, ctx, json, params);
    installLazyProp(inst, "shape", (self)=>self._zod.def.shape, false);
}, {
    keyof () {
        return schemas_enum(Object.keys(this._zod.def.shape));
    },
    catchall (catchall) {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: catchall
        }));
    },
    passthrough () {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: unknown()
        }));
    },
    loose () {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: unknown()
        }));
    },
    strict () {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: never()
        }));
    },
    strip () {
        return this.clone(mergeDefs(this._zod.def, {
            catchall: void 0
        }));
    },
    extend (incoming) {
        return extend(this, incoming);
    },
    safeExtend (incoming) {
        return safeExtend(this, incoming);
    },
    merge (other) {
        return util_merge(this, other);
    },
    pick (mask) {
        return pick(this, mask);
    },
    omit (mask) {
        return omit(this, mask);
    },
    partial (...args) {
        return util_partial(ZodOptional, this, args[0]);
    },
    exactPartial (...args) {
        return util_partial(ZodExactOptional, this, args[0], "exactPartial");
    },
    required (...args) {
        return util_required(ZodNonOptional, this, args[0]);
    }
});
function schemas_object(shape, params) {
    const def = {
        type: "object",
        shape: shape ?? {},
        ...normalizeParams(params)
    };
    return new ZodObject(def);
}
const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def)=>{
    $ZodUnion.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>unionProcessor(inst, ctx, json, params);
    inst.options = def.options;
});
function schemas_union(options, params) {
    return new ZodUnion({
        type: "union",
        options: options,
        ...normalizeParams(params)
    });
}
const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def)=>{
    $ZodIntersection.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
    return new ZodIntersection({
        type: "intersection",
        left: left,
        right: right
    });
}
const ZodRecord = /*@__PURE__*/ $constructor("ZodRecord", (inst, def)=>{
    _ensureDefaultMemoizer();
    $ZodRecord.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>recordProcessor(inst, ctx, json, params);
    inst.keyType = def.keyType;
    inst.valueType = def.valueType;
});
function schemas_record(keyType, valueType, params) {
    if (!valueType || !valueType._zod) return new ZodRecord({
        type: "record",
        keyType: schemas_string(),
        valueType: keyType,
        ...normalizeParams(valueType)
    });
    return new ZodRecord({
        type: "record",
        keyType,
        valueType: valueType,
        ...normalizeParams(params)
    });
}
const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def)=>{
    $ZodEnum.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>enumProcessor(inst, ctx, json, params);
    inst.enum = def.entries;
    inst.options = [
        ...inst._zod.values
    ];
    const keys = new Set(Object.keys(def.entries));
    inst.extract = (values, params)=>{
        const newEntries = {};
        for (const value of values)if (keys.has(value)) newEntries[value] = def.entries[value];
        else throw new Error(`Key ${value} not found in enum`);
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries
        });
    };
    inst.exclude = (values, params)=>{
        const newEntries = {
            ...def.entries
        };
        for (const value of values)if (keys.has(value)) delete newEntries[value];
        else throw new Error(`Key ${value} not found in enum`);
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries
        });
    };
});
function schemas_enum(values, params) {
    const entries = Array.isArray(values) ? Object.fromEntries(values.map((v)=>[
            v,
            v
        ])) : values;
    return new ZodEnum({
        type: "enum",
        entries,
        ...normalizeParams(params)
    });
}
const ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def)=>{
    $ZodLiteral.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>literalProcessor(inst, ctx, json, params);
    inst.values = new Set(def.values);
    Object.defineProperty(inst, "value", {
        get () {
            if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
            return def.values[0];
        }
    });
});
function literal(value, params) {
    return new ZodLiteral({
        type: "literal",
        values: Array.isArray(value) ? value : [
            value
        ],
        ...normalizeParams(params)
    });
}
const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def)=>{
    _ensureDefaultMemoizer();
    $ZodTransform.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>transformProcessor(inst, ctx, json, params);
    inst._zod.parse = (payload, _ctx)=>{
        if ("backward" === _ctx.direction) throw new $ZodEncodeError(inst.constructor.name);
        payload.addIssue = (issue)=>{
            if ("string" == typeof issue) payload.issues.push(util_issue(issue, payload.value, def));
            else {
                const _issue = issue;
                if (_issue.fatal) _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                if (!("input" in _issue)) _issue.input = payload.value;
                _issue.inst ?? (_issue.inst = inst);
                payload.issues.push(util_issue(_issue));
            }
        };
        const output = def.transform(payload.value, payload);
        if (output instanceof Promise) return output.then((output)=>{
            payload.value = output;
            return payload;
        });
        payload.value = output;
        return payload;
    };
});
function transform(fn) {
    return new ZodTransform({
        type: "transform",
        transform: fn
    });
}
const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def)=>{
    $ZodOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>optionalProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function schemas_optional(innerType) {
    return new ZodOptional({
        type: "optional",
        innerType: innerType
    });
}
const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def)=>{
    $ZodExactOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>optionalProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function exactOptional(innerType) {
    return new ZodExactOptional({
        type: "optional",
        innerType: innerType
    });
}
const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def)=>{
    $ZodNullable.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>nullableProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function nullable(innerType) {
    return new ZodNullable({
        type: "nullable",
        innerType: innerType
    });
}
const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def)=>{
    $ZodDefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>defaultProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
    inst.removeDefault = inst.unwrap;
});
function schemas_default(innerType, defaultValue) {
    return new ZodDefault({
        type: "default",
        innerType: innerType,
        get defaultValue () {
            return "function" == typeof defaultValue ? defaultValue() : shallowClone(defaultValue);
        }
    });
}
const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def)=>{
    $ZodPrefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>prefaultProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
    return new ZodPrefault({
        type: "prefault",
        innerType: innerType,
        get defaultValue () {
            return "function" == typeof defaultValue ? defaultValue() : shallowClone(defaultValue);
        }
    });
}
const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def)=>{
    $ZodNonOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>nonoptionalProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
    return new ZodNonOptional({
        type: "nonoptional",
        innerType: innerType,
        ...normalizeParams(params)
    });
}
const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def)=>{
    $ZodCatch.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>catchProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
    inst.removeCatch = inst.unwrap;
});
function schemas_catch(innerType, catchValue) {
    return new ZodCatch({
        type: "catch",
        innerType: innerType,
        catchValue: "function" == typeof catchValue ? catchValue : constantCatch(catchValue)
    });
}
const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def)=>{
    $ZodPipe.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>pipeProcessor(inst, ctx, json, params);
    inst.in = def.in;
    inst.out = def.out;
});
function pipe(in_, out) {
    return new ZodPipe({
        type: "pipe",
        in: in_,
        out: out
    });
}
const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def)=>{
    $ZodReadonly.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>readonlyProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.innerType;
});
function readonly(innerType) {
    return new ZodReadonly({
        type: "readonly",
        innerType: innerType
    });
}
const ZodLazy = /*@__PURE__*/ $constructor("ZodLazy", (inst, def)=>{
    $ZodLazy.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>lazyProcessor(inst, ctx, json, params);
    inst.unwrap = ()=>inst._zod.def.getter();
});
function lazy(getter) {
    return new ZodLazy({
        type: "lazy",
        getter: getter
    });
}
const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def)=>{
    $ZodCustom.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params)=>customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
    return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
    return _superRefine(fn, params);
}
const NumericVersionSchema = schemas_string().regex(/^\d+(?:\.\d+){0,2}$/, 'expected a numeric version such as 3.4');
const CssPropertyNameSchema = schemas_string().regex(/^-?[a-z][a-z0-9-]*$/, 'expected a CSS property name');
const FeatureNameSchema = schemas_string().min(1, 'expected a compatibility feature name').max(128, 'compatibility feature name is too long');
const BackendNameSchema = schemas_string().regex(/^[a-z][a-z0-9_]*$/, 'expected a backend name');
const SupportStatementSchema = schemas_object({
    version_added: schemas_union([
        schemas_string().min(1),
        schemas_boolean(),
        schemas_null()
    ]),
    notes: schemas_union([
        schemas_string(),
        schemas_array(schemas_string()).readonly()
    ]).optional(),
    partial_implementation: schemas_boolean().optional()
}).strict().readonly();
const CompatStatementSchema = schemas_object({
    description: schemas_string().optional(),
    lynx_path: schemas_string().optional(),
    mdn_url: schemas_string().url().optional(),
    spec_url: schemas_union([
        schemas_string().url(),
        schemas_array(schemas_string().url()).readonly()
    ]).optional(),
    status: schemas_object({
        deprecated: schemas_boolean(),
        experimental: schemas_boolean()
    }).strict().readonly().optional(),
    support: schemas_record(BackendNameSchema, SupportStatementSchema).readonly()
}).strict().readonly();
const FeatureCompatSchema = lazy(()=>schemas_object({
        __compat: CompatStatementSchema
    }).catchall(FeatureCompatSchema).readonly());
const CompatDataSchema = schemas_record(CssPropertyNameSchema, FeatureCompatSchema).readonly();
const PropertyValueSchema = schemas_object({
    value: schemas_string(),
    version: NumericVersionSchema,
    desc: schemas_string(),
    'align-type': schemas_string().optional()
}).strict().readonly();
const PropertyNoteSchema = schemas_object({
    literal: schemas_string(),
    level: schemas_string()
}).strict().readonly();
const DefinitionSchema = schemas_object({
    name: CssPropertyNameSchema,
    id: schemas_number().int().positive(),
    type: schemas_string().min(1),
    default_value: schemas_string(),
    version: NumericVersionSchema,
    author: schemas_string(),
    consumption_status: schemas_string().min(1),
    desc: schemas_string(),
    compat_data: CompatDataSchema.nullish(),
    formal_syntax: schemas_string().optional(),
    is_shorthand: schemas_boolean(),
    keywords: schemas_array(schemas_string()).readonly().optional(),
    note: schemas_array(PropertyNoteSchema).readonly().optional(),
    values: schemas_array(PropertyValueSchema).readonly().optional()
}).strict().readonly();
const CssDefinesPackageSchema = schemas_object({
    name: literal('@lynx-js/css-defines'),
    version: NumericVersionSchema
}).readonly();
function compareNumericVersions(left, right) {
    const leftParts = NumericVersionSchema.parse(left).split('.').map(Number);
    const rightParts = NumericVersionSchema.parse(right).split('.').map(Number);
    for(let index = 0; index < 3; index += 1){
        const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
        if (0 !== difference) return difference;
    }
    return 0;
}
const AVAILABILITY = {
    available: 'available',
    unavailable: 'unavailable',
    unknown: 'unknown',
    conditional: 'conditional',
    requiresNewerVersion: 'requires-newer-version'
};
function assessAvailability(versionAdded, targetVersion) {
    if (false === versionAdded) return AVAILABILITY.unavailable;
    if (null === versionAdded) return AVAILABILITY.unknown;
    if (true === versionAdded) return AVAILABILITY.available;
    const parsedVersion = NumericVersionSchema.safeParse(versionAdded);
    if (!parsedVersion.success) return AVAILABILITY.conditional;
    if (void 0 === targetVersion) return AVAILABILITY.available;
    return compareNumericVersions(targetVersion, parsedVersion.data) >= 0 ? AVAILABILITY.available : AVAILABILITY.requiresNewerVersion;
}
function createCompatibilityRows(statement, targetVersion, backend) {
    return Object.entries(statement.support).filter(([name])=>void 0 === backend || name === backend).map(([name, support])=>({
            backend: name,
            version_added: support.version_added,
            availability: assessAvailability(support.version_added, targetVersion),
            ...void 0 === support.notes || '' === support.notes ? {} : {
                notes: support.notes
            },
            ...void 0 === support.partial_implementation ? {} : {
                partial_implementation: support.partial_implementation
            }
        }));
}
class QueryError extends Error {
    name = 'QueryError';
    exitCode = 2;
}
async function readPackageSource(root) {
    const raw = await readFile(external_node_path_resolve(root, 'package.json'), 'utf8');
    const metadata = CssDefinesPackageSchema.parse(JSON.parse(raw));
    return {
        root,
        version: metadata.version
    };
}
function getBundledPackageRoot() {
    return external_node_path_resolve(dirname(fileURLToPath(import.meta.url)), 'css-defines');
}
async function getBundledPackageVersion() {
    return (await readPackageSource(getBundledPackageRoot())).version;
}
async function readDefinition(source, propertyInput) {
    const property = CssPropertyNameSchema.parse(propertyInput);
    const filenames = await readdir(external_node_path_resolve(source.root, 'css_defines'));
    const filename = filenames.find((candidate)=>{
        const separator = candidate.indexOf('-');
        if (separator < 0) return false;
        const definitionName = candidate.slice(separator + 1, -5);
        return definitionName === property || property.startsWith('-') && definitionName === property.slice(1);
    });
    if (void 0 === filename) throw new QueryError(`Unknown CSS property: ${property}`);
    const raw = await readFile(external_node_path_resolve(source.root, 'css_defines', filename), 'utf8');
    const definition = DefinitionSchema.parse(JSON.parse(raw));
    if (definition.name !== property) throw new QueryError(`Unknown CSS property: ${property}`);
    return definition;
}
async function readBundledDefinition(propertyInput) {
    const source = await readPackageSource(getBundledPackageRoot());
    return {
        definition: await readDefinition(source, propertyInput),
        source
    };
}
function selectCompatStatement(definition, featureInput) {
    if (null === definition.compat_data || void 0 === definition.compat_data) {
        if (void 0 !== featureInput) {
            const feature = FeatureNameSchema.parse(featureInput);
            throw new QueryError(`Unknown feature ${definition.name}.${feature}. Available features: none`);
        }
        return null;
    }
    const propertyCompat = definition.compat_data[definition.name];
    if (void 0 === propertyCompat) throw new QueryError(`Missing compatibility entry for ${definition.name}`);
    if (void 0 === featureInput) {
        const base = propertyCompat['__compat'];
        if (void 0 === base || !('support' in base)) throw new QueryError(`Missing base compatibility data for ${definition.name}`);
        return {
            feature: definition.name,
            statement: base
        };
    }
    const feature = FeatureNameSchema.parse(featureInput);
    const selected = propertyCompat[feature];
    if (void 0 === selected || !('__compat' in selected)) {
        const available = Object.keys(propertyCompat).filter((name)=>'__compat' !== name).join(', ');
        throw new QueryError(`Unknown feature ${definition.name}.${feature}. Available features: ${available || 'none'}`);
    }
    return {
        feature,
        statement: selected.__compat
    };
}
async function queryCompatibility(propertyInput, options) {
    const { definition, source } = await readBundledDefinition(propertyInput);
    const selected = selectCompatStatement(definition, options.feature);
    const targetVersion = void 0 === options.lynxVersion ? void 0 : NumericVersionSchema.parse(options.lynxVersion);
    const backend = void 0 === options.backend ? void 0 : BackendNameSchema.parse(options.backend);
    if (null !== selected && void 0 !== backend && !Object.hasOwn(selected.statement.support, backend)) throw new QueryError(`Unknown backend: ${backend}. Available backends: ${Object.keys(selected.statement.support).join(', ')}`);
    const compatibility = null === selected ? null : createCompatibilityRows(selected.statement, targetVersion, backend);
    return {
        package: {
            name: '@lynx-js/css-defines',
            version: source.version,
            source: 'bundled'
        },
        property: definition,
        feature: selected?.feature ?? definition.name,
        ...selected?.statement.status === void 0 ? {} : {
            status: selected.statement.status
        },
        ...void 0 === targetVersion ? {} : {
            lynx_version: targetVersion
        },
        compatibility
    };
}
class HTTPError extends Error {
    response;
    request;
    options;
    constructor(response, request, options){
        const code = response.status || 0 === response.status ? response.status : '';
        const title = response.statusText ?? '';
        const status = `${code} ${title}`.trim();
        const reason = status ? `status code ${status}` : 'an unknown error';
        super(`Request failed with ${reason}: ${request.method} ${request.url}`);
        this.name = 'HTTPError';
        this.response = response;
        this.request = request;
        this.options = options;
    }
}
class NonError extends Error {
    name = 'NonError';
    value;
    constructor(value){
        let message = 'Non-error value was thrown';
        try {
            if ('string' == typeof value) message = value;
            else if (value && 'object' == typeof value && 'message' in value && 'string' == typeof value.message) message = value.message;
        } catch  {}
        super(message);
        this.value = value;
    }
}
class ForceRetryError_ForceRetryError extends Error {
    name = 'ForceRetryError';
    customDelay;
    code;
    customRequest;
    constructor(options){
        const cause = options?.cause ? options.cause instanceof Error ? options.cause : new NonError(options.cause) : void 0;
        super(options?.code ? `Forced retry: ${options.code}` : 'Forced retry', cause ? {
            cause
        } : void 0);
        this.customDelay = options?.delay;
        this.code = options?.code;
        this.customRequest = options?.request;
    }
}
const supportsRequestStreams = (()=>{
    let duplexAccessed = false;
    let hasContentType = false;
    const supportsReadableStream = 'function' == typeof globalThis.ReadableStream;
    const supportsRequest = 'function' == typeof globalThis.Request;
    if (supportsReadableStream && supportsRequest) try {
        hasContentType = new globalThis.Request('https://empty.invalid', {
            body: new globalThis.ReadableStream(),
            method: 'POST',
            get duplex () {
                duplexAccessed = true;
                return 'half';
            }
        }).headers.has('Content-Type');
    } catch (error) {
        if (error instanceof Error && 'unsupported BodyInit type' === error.message) return false;
        throw error;
    }
    return duplexAccessed && !hasContentType;
})();
const supportsAbortController = 'function' == typeof globalThis.AbortController;
const supportsAbortSignal = 'function' == typeof globalThis.AbortSignal && 'function' == typeof globalThis.AbortSignal.any;
const supportsResponseStreams = 'function' == typeof globalThis.ReadableStream;
const supportsFormData = 'function' == typeof globalThis.FormData;
const requestMethods = [
    'get',
    'post',
    'put',
    'patch',
    'head',
    'delete'
];
const constants_validate = ()=>void 0;
constants_validate();
const responseTypes = {
    json: 'application/json',
    text: 'text/*',
    formData: 'multipart/form-data',
    arrayBuffer: '*/*',
    blob: '*/*',
    bytes: '*/*'
};
const maxSafeTimeout = 2147483647;
const usualFormBoundarySize = new TextEncoder().encode('------WebKitFormBoundaryaxpyiPgbbPti10Rw').length;
const stop = Symbol('stop');
class RetryMarker {
    options;
    constructor(options){
        this.options = options;
    }
}
const constants_retry = (options)=>new RetryMarker(options);
const kyOptionKeys = {
    json: true,
    parseJson: true,
    stringifyJson: true,
    searchParams: true,
    prefixUrl: true,
    retry: true,
    timeout: true,
    hooks: true,
    throwHttpErrors: true,
    onDownloadProgress: true,
    onUploadProgress: true,
    fetch: true,
    context: true
};
const vendorSpecificOptions = {
    next: true
};
const requestOptionsRegistry = {
    method: true,
    headers: true,
    body: true,
    mode: true,
    credentials: true,
    cache: true,
    redirect: true,
    referrer: true,
    referrerPolicy: true,
    integrity: true,
    keepalive: true,
    signal: true,
    window: true,
    duplex: true
};
const getBodySize = (body)=>{
    if (!body) return 0;
    if (body instanceof FormData) {
        let size = 0;
        for (const [key, value] of body){
            size += usualFormBoundarySize;
            size += new TextEncoder().encode(`Content-Disposition: form-data; name="${key}"`).length;
            size += 'string' == typeof value ? new TextEncoder().encode(value).length : value.size;
        }
        return size;
    }
    if (body instanceof Blob) return body.size;
    if (body instanceof ArrayBuffer) return body.byteLength;
    if ('string' == typeof body) return new TextEncoder().encode(body).length;
    if (body instanceof URLSearchParams) return new TextEncoder().encode(body.toString()).length;
    if ('byteLength' in body) return body.byteLength;
    if ('object' == typeof body && null !== body) try {
        const jsonString = JSON.stringify(body);
        return new TextEncoder().encode(jsonString).length;
    } catch  {}
    return 0;
};
const withProgress = (stream, totalBytes, onProgress)=>{
    let previousChunk;
    let transferredBytes = 0;
    return stream.pipeThrough(new TransformStream({
        transform (currentChunk, controller) {
            controller.enqueue(currentChunk);
            if (previousChunk) {
                transferredBytes += previousChunk.byteLength;
                let percent = 0 === totalBytes ? 0 : transferredBytes / totalBytes;
                if (percent >= 1) percent = 1 - Number.EPSILON;
                onProgress?.({
                    percent,
                    totalBytes: Math.max(totalBytes, transferredBytes),
                    transferredBytes
                }, previousChunk);
            }
            previousChunk = currentChunk;
        },
        flush () {
            if (previousChunk) {
                transferredBytes += previousChunk.byteLength;
                onProgress?.({
                    percent: 1,
                    totalBytes: Math.max(totalBytes, transferredBytes),
                    transferredBytes
                }, previousChunk);
            }
        }
    }));
};
const streamResponse = (response, onDownloadProgress)=>{
    if (!response.body) return response;
    if (204 === response.status) return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });
    const totalBytes = Math.max(0, Number(response.headers.get('content-length')) || 0);
    return new Response(withProgress(response.body, totalBytes, onDownloadProgress), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });
};
const streamRequest = (request, onUploadProgress, originalBody)=>{
    if (!request.body) return request;
    const totalBytes = getBodySize(originalBody ?? request.body);
    return new Request(request, {
        duplex: 'half',
        body: withProgress(request.body, totalBytes, onUploadProgress)
    });
};
const is_isObject = (value)=>null !== value && 'object' == typeof value;
const validateAndMerge = (...sources)=>{
    for (const source of sources)if ((!is_isObject(source) || Array.isArray(source)) && void 0 !== source) throw new TypeError('The `options` argument must be an object');
    return deepMerge({}, ...sources);
};
const mergeHeaders = (source1 = {}, source2 = {})=>{
    const result = new globalThis.Headers(source1);
    const isHeadersInstance = source2 instanceof globalThis.Headers;
    const source = new globalThis.Headers(source2);
    for (const [key, value] of source.entries())if (isHeadersInstance && 'undefined' === value || void 0 === value) result.delete(key);
    else result.set(key, value);
    return result;
};
function newHookValue(original, incoming, property) {
    return Object.hasOwn(incoming, property) && void 0 === incoming[property] ? [] : deepMerge(original[property] ?? [], incoming[property] ?? []);
}
const mergeHooks = (original = {}, incoming = {})=>({
        beforeRequest: newHookValue(original, incoming, 'beforeRequest'),
        beforeRetry: newHookValue(original, incoming, 'beforeRetry'),
        afterResponse: newHookValue(original, incoming, 'afterResponse'),
        beforeError: newHookValue(original, incoming, 'beforeError')
    });
const appendSearchParameters = (target, source)=>{
    const result = new URLSearchParams();
    for (const input of [
        target,
        source
    ])if (void 0 !== input) if (input instanceof URLSearchParams) for (const [key, value] of input.entries())result.append(key, value);
    else if (Array.isArray(input)) for (const pair of input){
        if (!Array.isArray(pair) || 2 !== pair.length) throw new TypeError('Array search parameters must be provided in [[key, value], ...] format');
        result.append(String(pair[0]), String(pair[1]));
    }
    else if (is_isObject(input)) {
        for (const [key, value] of Object.entries(input))if (void 0 !== value) result.append(key, String(value));
    } else {
        const parameters = new URLSearchParams(input);
        for (const [key, value] of parameters.entries())result.append(key, value);
    }
    return result;
};
const deepMerge = (...sources)=>{
    let returnValue = {};
    let headers = {};
    let hooks = {};
    let searchParameters;
    const signals = [];
    for (const source of sources)if (Array.isArray(source)) {
        if (!Array.isArray(returnValue)) returnValue = [];
        returnValue = [
            ...returnValue,
            ...source
        ];
    } else if (is_isObject(source)) {
        for (let [key, value] of Object.entries(source)){
            if ('signal' === key && value instanceof globalThis.AbortSignal) {
                signals.push(value);
                continue;
            }
            if ('context' === key) {
                if (null != value && (!is_isObject(value) || Array.isArray(value))) throw new TypeError('The `context` option must be an object');
                returnValue = {
                    ...returnValue,
                    context: null == value ? {} : {
                        ...returnValue.context,
                        ...value
                    }
                };
                continue;
            }
            if ('searchParams' === key) {
                searchParameters = null == value ? void 0 : void 0 === searchParameters ? value : appendSearchParameters(searchParameters, value);
                continue;
            }
            if (is_isObject(value) && key in returnValue) value = deepMerge(returnValue[key], value);
            returnValue = {
                ...returnValue,
                [key]: value
            };
        }
        if (is_isObject(source.hooks)) {
            hooks = mergeHooks(hooks, source.hooks);
            returnValue.hooks = hooks;
        }
        if (is_isObject(source.headers)) {
            headers = mergeHeaders(headers, source.headers);
            returnValue.headers = headers;
        }
    }
    if (void 0 !== searchParameters) returnValue.searchParams = searchParameters;
    if (signals.length > 0) if (1 === signals.length) returnValue.signal = signals[0];
    else if (supportsAbortSignal) returnValue.signal = AbortSignal.any(signals);
    else returnValue.signal = signals.at(-1);
    return returnValue;
};
const normalizeRequestMethod = (input)=>requestMethods.includes(input) ? input.toUpperCase() : input;
const retryMethods = [
    'get',
    'put',
    'head',
    'delete',
    'options',
    'trace'
];
const retryStatusCodes = [
    408,
    413,
    429,
    500,
    502,
    503,
    504
];
const retryAfterStatusCodes = [
    413,
    429,
    503
];
const defaultRetryOptions = {
    limit: 2,
    methods: retryMethods,
    statusCodes: retryStatusCodes,
    afterStatusCodes: retryAfterStatusCodes,
    maxRetryAfter: 1 / 0,
    backoffLimit: 1 / 0,
    delay: (attemptCount)=>0.3 * 2 ** (attemptCount - 1) * 1000,
    jitter: void 0,
    retryOnTimeout: false
};
const normalizeRetryOptions = (retry = {})=>{
    if ('number' == typeof retry) return {
        ...defaultRetryOptions,
        limit: retry
    };
    if (retry.methods && !Array.isArray(retry.methods)) throw new Error('retry.methods must be an array');
    retry.methods &&= retry.methods.map((method)=>method.toLowerCase());
    if (retry.statusCodes && !Array.isArray(retry.statusCodes)) throw new Error('retry.statusCodes must be an array');
    const normalizedRetry = Object.fromEntries(Object.entries(retry).filter(([, value])=>void 0 !== value));
    return {
        ...defaultRetryOptions,
        ...normalizedRetry
    };
};
class TimeoutError extends Error {
    request;
    constructor(request){
        super(`Request timed out: ${request.method} ${request.url}`);
        this.name = 'TimeoutError';
        this.request = request;
    }
}
async function timeout(request, init, abortController, options) {
    return new Promise((resolve, reject)=>{
        const timeoutId = setTimeout(()=>{
            if (abortController) abortController.abort();
            reject(new TimeoutError(request));
        }, options.timeout);
        options.fetch(request, init).then(resolve).catch(reject).then(()=>{
            clearTimeout(timeoutId);
        });
    });
}
async function delay(ms, { signal }) {
    return new Promise((resolve, reject)=>{
        if (signal) {
            signal.throwIfAborted();
            signal.addEventListener('abort', abortHandler, {
                once: true
            });
        }
        function abortHandler() {
            clearTimeout(timeoutId);
            reject(signal.reason);
        }
        const timeoutId = setTimeout(()=>{
            signal?.removeEventListener('abort', abortHandler);
            resolve();
        }, ms);
    });
}
const findUnknownOptions = (request, options)=>{
    const unknownOptions = {};
    for(const key in options)if (Object.hasOwn(options, key)) {
        if (!(key in requestOptionsRegistry) && !(key in kyOptionKeys) && (!(key in request) || key in vendorSpecificOptions)) unknownOptions[key] = options[key];
    }
    return unknownOptions;
};
const hasSearchParameters = (search)=>{
    if (void 0 === search) return false;
    if (Array.isArray(search)) return search.length > 0;
    if (search instanceof URLSearchParams) return search.size > 0;
    if ('object' == typeof search) return Object.keys(search).length > 0;
    if ('string' == typeof search) return search.trim().length > 0;
    return Boolean(search);
};
function isHTTPError(error) {
    return error instanceof HTTPError || error?.name === HTTPError.name;
}
function isTimeoutError(error) {
    return error instanceof TimeoutError || error?.name === TimeoutError.name;
}
class Ky {
    static create(input, options) {
        const ky = new Ky(input, options);
        const function_ = async ()=>{
            if ('number' == typeof ky.#options.timeout && ky.#options.timeout > maxSafeTimeout) throw new RangeError(`The \`timeout\` option cannot be greater than ${maxSafeTimeout}`);
            await Promise.resolve();
            let response = await ky.#fetch();
            for (const hook of ky.#options.hooks.afterResponse){
                const clonedResponse = ky.#decorateResponse(response.clone());
                let modifiedResponse;
                try {
                    modifiedResponse = await hook(ky.request, ky.#getNormalizedOptions(), clonedResponse, {
                        retryCount: ky.#retryCount
                    });
                } catch (error) {
                    ky.#cancelResponseBody(clonedResponse);
                    ky.#cancelResponseBody(response);
                    throw error;
                }
                if (modifiedResponse instanceof RetryMarker) {
                    ky.#cancelResponseBody(clonedResponse);
                    ky.#cancelResponseBody(response);
                    throw new ForceRetryError_ForceRetryError(modifiedResponse.options);
                }
                const nextResponse = modifiedResponse instanceof globalThis.Response ? modifiedResponse : response;
                if (clonedResponse !== nextResponse) ky.#cancelResponseBody(clonedResponse);
                if (response !== nextResponse) ky.#cancelResponseBody(response);
                response = nextResponse;
            }
            ky.#decorateResponse(response);
            if (!response.ok && ('function' == typeof ky.#options.throwHttpErrors ? ky.#options.throwHttpErrors(response.status) : ky.#options.throwHttpErrors)) {
                let error = new HTTPError(response, ky.request, ky.#getNormalizedOptions());
                for (const hook of ky.#options.hooks.beforeError)error = await hook(error, {
                    retryCount: ky.#retryCount
                });
                throw error;
            }
            if (ky.#options.onDownloadProgress) {
                if ('function' != typeof ky.#options.onDownloadProgress) throw new TypeError('The `onDownloadProgress` option must be a function');
                if (!supportsResponseStreams) throw new Error('Streams are not supported in your environment. `ReadableStream` is missing.');
                const progressResponse = response.clone();
                ky.#cancelResponseBody(response);
                return streamResponse(progressResponse, ky.#options.onDownloadProgress);
            }
            return response;
        };
        const result = ky.#retry(function_).finally(()=>{
            const originalRequest = ky.#originalRequest;
            ky.#cancelBody(originalRequest?.body ?? void 0);
            ky.#cancelBody(ky.request.body ?? void 0);
        });
        for (const [type, mimeType] of Object.entries(responseTypes))if ('bytes' !== type || 'function' == typeof globalThis.Response?.prototype?.bytes) result[type] = async ()=>{
            ky.request.headers.set('accept', ky.request.headers.get('accept') || mimeType);
            const response = await result;
            if ('json' === type) {
                if (204 === response.status) return '';
                const text = await response.text();
                if ('' === text) return '';
                if (options.parseJson) return options.parseJson(text);
                return JSON.parse(text);
            }
            return response[type]();
        };
        return result;
    }
    static #normalizeSearchParams(searchParams) {
        if (searchParams && 'object' == typeof searchParams && !Array.isArray(searchParams) && !(searchParams instanceof URLSearchParams)) return Object.fromEntries(Object.entries(searchParams).filter(([, value])=>void 0 !== value));
        return searchParams;
    }
    request;
    #abortController;
    #retryCount = 0;
    #input;
    #options;
    #originalRequest;
    #userProvidedAbortSignal;
    #cachedNormalizedOptions;
    constructor(input, options = {}){
        this.#input = input;
        this.#options = {
            ...options,
            headers: mergeHeaders(this.#input.headers, options.headers),
            hooks: mergeHooks({
                beforeRequest: [],
                beforeRetry: [],
                beforeError: [],
                afterResponse: []
            }, options.hooks),
            method: normalizeRequestMethod(options.method ?? this.#input.method ?? 'GET'),
            prefixUrl: String(options.prefixUrl || ''),
            retry: normalizeRetryOptions(options.retry),
            throwHttpErrors: options.throwHttpErrors ?? true,
            timeout: options.timeout ?? 10000,
            fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
            context: options.context ?? {}
        };
        if ('string' != typeof this.#input && !(this.#input instanceof URL || this.#input instanceof globalThis.Request)) throw new TypeError('`input` must be a string, URL, or Request');
        if (this.#options.prefixUrl && 'string' == typeof this.#input) {
            if (this.#input.startsWith('/')) throw new Error('`input` must not begin with a slash when using `prefixUrl`');
            if (!this.#options.prefixUrl.endsWith('/')) this.#options.prefixUrl += '/';
            this.#input = this.#options.prefixUrl + this.#input;
        }
        if (supportsAbortController && supportsAbortSignal) {
            this.#userProvidedAbortSignal = this.#options.signal ?? this.#input.signal;
            this.#abortController = new globalThis.AbortController();
            this.#options.signal = this.#userProvidedAbortSignal ? AbortSignal.any([
                this.#userProvidedAbortSignal,
                this.#abortController.signal
            ]) : this.#abortController.signal;
        }
        if (supportsRequestStreams) this.#options.duplex = 'half';
        if (void 0 !== this.#options.json) {
            this.#options.body = this.#options.stringifyJson?.(this.#options.json) ?? JSON.stringify(this.#options.json);
            this.#options.headers.set('content-type', this.#options.headers.get('content-type') ?? 'application/json');
        }
        const userProvidedContentType = options.headers && new globalThis.Headers(options.headers).has('content-type');
        if (this.#input instanceof globalThis.Request && (supportsFormData && this.#options.body instanceof globalThis.FormData || this.#options.body instanceof URLSearchParams) && !userProvidedContentType) this.#options.headers.delete('content-type');
        this.request = new globalThis.Request(this.#input, this.#options);
        if (hasSearchParameters(this.#options.searchParams)) {
            const textSearchParams = 'string' == typeof this.#options.searchParams ? this.#options.searchParams.replace(/^\?/, '') : new URLSearchParams(Ky.#normalizeSearchParams(this.#options.searchParams)).toString();
            const searchParams = '?' + textSearchParams;
            const url = this.request.url.replace(/(?:\?.*?)?(?=#|$)/, searchParams);
            this.request = new globalThis.Request(url, this.#options);
        }
        if (this.#options.onUploadProgress) {
            if ('function' != typeof this.#options.onUploadProgress) throw new TypeError('The `onUploadProgress` option must be a function');
            if (!supportsRequestStreams) throw new Error('Request streams are not supported in your environment. The `duplex` option for `Request` is not available.');
            this.request = this.#wrapRequestWithUploadProgress(this.request, this.#options.body ?? void 0);
        }
    }
    #calculateDelay() {
        const retryDelay = this.#options.retry.delay(this.#retryCount);
        let jitteredDelay = retryDelay;
        if (true === this.#options.retry.jitter) jitteredDelay = Math.random() * retryDelay;
        else if ('function' == typeof this.#options.retry.jitter) {
            jitteredDelay = this.#options.retry.jitter(retryDelay);
            if (!Number.isFinite(jitteredDelay) || jitteredDelay < 0) jitteredDelay = retryDelay;
        }
        const backoffLimit = this.#options.retry.backoffLimit ?? 1 / 0;
        return Math.min(backoffLimit, jitteredDelay);
    }
    async #calculateRetryDelay(error) {
        this.#retryCount++;
        if (this.#retryCount > this.#options.retry.limit) throw error;
        const errorObject = error instanceof Error ? error : new NonError(error);
        if (errorObject instanceof ForceRetryError_ForceRetryError) return errorObject.customDelay ?? this.#calculateDelay();
        if (!this.#options.retry.methods.includes(this.request.method.toLowerCase())) throw error;
        if (void 0 !== this.#options.retry.shouldRetry) {
            const result = await this.#options.retry.shouldRetry({
                error: errorObject,
                retryCount: this.#retryCount
            });
            if (false === result) throw error;
            if (true === result) return this.#calculateDelay();
        }
        if (isTimeoutError(error) && !this.#options.retry.retryOnTimeout) throw error;
        if (isHTTPError(error)) {
            if (!this.#options.retry.statusCodes.includes(error.response.status)) throw error;
            const retryAfter = error.response.headers.get('Retry-After') ?? error.response.headers.get('RateLimit-Reset') ?? error.response.headers.get('X-RateLimit-Retry-After') ?? error.response.headers.get('X-RateLimit-Reset') ?? error.response.headers.get('X-Rate-Limit-Reset');
            if (retryAfter && this.#options.retry.afterStatusCodes.includes(error.response.status)) {
                let after = 1000 * Number(retryAfter);
                if (Number.isNaN(after)) after = Date.parse(retryAfter) - Date.now();
                else if (after >= Date.parse('2024-01-01')) after -= Date.now();
                const max = this.#options.retry.maxRetryAfter ?? after;
                return after < max ? after : max;
            }
            if (413 === error.response.status) throw error;
        }
        return this.#calculateDelay();
    }
    #decorateResponse(response) {
        if (this.#options.parseJson) response.json = async ()=>this.#options.parseJson(await response.text());
        return response;
    }
    #cancelBody(body) {
        if (!body) return;
        body.cancel().catch(()=>void 0);
    }
    #cancelResponseBody(response) {
        this.#cancelBody(response.body ?? void 0);
    }
    async #retry(function_) {
        try {
            return await function_();
        } catch (error) {
            const ms = Math.min(await this.#calculateRetryDelay(error), maxSafeTimeout);
            if (this.#retryCount < 1) throw error;
            await delay(ms, this.#userProvidedAbortSignal ? {
                signal: this.#userProvidedAbortSignal
            } : {});
            if (error instanceof ForceRetryError_ForceRetryError && error.customRequest) {
                const managedRequest = this.#options.signal ? new globalThis.Request(error.customRequest, {
                    signal: this.#options.signal
                }) : new globalThis.Request(error.customRequest);
                this.#assignRequest(managedRequest);
            }
            for (const hook of this.#options.hooks.beforeRetry){
                const hookResult = await hook({
                    request: this.request,
                    options: this.#getNormalizedOptions(),
                    error: error,
                    retryCount: this.#retryCount
                });
                if (hookResult instanceof globalThis.Request) {
                    this.#assignRequest(hookResult);
                    break;
                }
                if (hookResult instanceof globalThis.Response) return hookResult;
                if (hookResult === stop) return;
            }
            return this.#retry(function_);
        }
    }
    async #fetch() {
        if (this.#abortController?.signal.aborted) {
            this.#abortController = new globalThis.AbortController();
            this.#options.signal = this.#userProvidedAbortSignal ? AbortSignal.any([
                this.#userProvidedAbortSignal,
                this.#abortController.signal
            ]) : this.#abortController.signal;
            this.request = new globalThis.Request(this.request, {
                signal: this.#options.signal
            });
        }
        for (const hook of this.#options.hooks.beforeRequest){
            const result = await hook(this.request, this.#getNormalizedOptions(), {
                retryCount: this.#retryCount
            });
            if (result instanceof Response) return result;
            if (result instanceof globalThis.Request) {
                this.#assignRequest(result);
                break;
            }
        }
        const nonRequestOptions = findUnknownOptions(this.request, this.#options);
        this.#originalRequest = this.request;
        this.request = this.#originalRequest.clone();
        if (false === this.#options.timeout) return this.#options.fetch(this.#originalRequest, nonRequestOptions);
        return timeout(this.#originalRequest, nonRequestOptions, this.#abortController, this.#options);
    }
    #getNormalizedOptions() {
        if (!this.#cachedNormalizedOptions) {
            const { hooks, ...normalizedOptions } = this.#options;
            this.#cachedNormalizedOptions = Object.freeze(normalizedOptions);
        }
        return this.#cachedNormalizedOptions;
    }
    #assignRequest(request) {
        this.#cachedNormalizedOptions = void 0;
        this.request = this.#wrapRequestWithUploadProgress(request);
    }
    #wrapRequestWithUploadProgress(request, originalBody) {
        if (!this.#options.onUploadProgress || !request.body) return request;
        return streamRequest(request, this.#options.onUploadProgress, originalBody ?? this.#options.body ?? void 0);
    }
}
/*! MIT License © Sindre Sorhus */ const createInstance = (defaults)=>{
    const ky = (input, options)=>Ky.create(input, validateAndMerge(defaults, options));
    for (const method of requestMethods)ky[method] = (input, options)=>Ky.create(input, validateAndMerge(defaults, options, {
            method
        }));
    ky.create = (newDefaults)=>createInstance(validateAndMerge(newDefaults));
    ky.extend = (newDefaults)=>{
        if ('function' == typeof newDefaults) newDefaults = newDefaults(defaults ?? {});
        return createInstance(validateAndMerge(defaults, newDefaults));
    };
    ky.stop = stop;
    ky.retry = constants_retry;
    return ky;
};
const distribution_ky = createInstance();
const distribution = distribution_ky;
const LATEST_PACKAGE_URL = 'https://registry.npmjs.org/@lynx-js%2Fcss-defines/latest';
const MAX_RESPONSE_BYTES = 65536;
const LatestPackageMetadataSchema = schemas_object({
    version: NumericVersionSchema
}).readonly();
class RegistryResponseTooLargeError extends Error {
    name = 'RegistryResponseTooLargeError';
}
class UpdateCheckError extends Error {
    name = 'UpdateCheckError';
    exitCode = 1;
    constructor(cause){
        super('Unable to check for css-defines updates.', {
            cause
        });
    }
}
async function checkForUpdates(bundledVersion) {
    try {
        const metadata = LatestPackageMetadataSchema.parse(await distribution.get(LATEST_PACKAGE_URL, {
            cache: 'no-store',
            credentials: 'omit',
            headers: {
                accept: 'application/json'
            },
            redirect: 'error',
            referrerPolicy: 'no-referrer',
            retry: 0,
            timeout: 5000,
            onDownloadProgress (progress) {
                if (progress.transferredBytes > MAX_RESPONSE_BYTES) throw new RegistryResponseTooLargeError();
            }
        }).json());
        return {
            package: '@lynx-js/css-defines',
            bundled_version: bundledVersion,
            latest_version: metadata.version,
            update_available: compareNumericVersions(metadata.version, bundledVersion) > 0
        };
    } catch (error) {
        if (error instanceof Error) throw new UpdateCheckError(error);
        throw error;
    }
}
function formatVersionAdded(value) {
    if (null === value) return 'unknown';
    return 'boolean' == typeof value ? String(value) : value;
}
function printHumanResult(result) {
    const property = result.property;
    console.log(`Package: ${result.package.name}@${result.package.version} (${result.package.source})`);
    console.log(`Property: ${property.name} (#${property.id})`);
    console.log(`Type: ${property.type}`);
    console.log(`Default: ${property.default_value}`);
    console.log(`Definition version: ${property.version}`);
    console.log(`Description: ${property.desc}`);
    if (void 0 !== property.formal_syntax) console.log(`Syntax: ${property.formal_syntax}`);
    if (void 0 !== property.values) console.log(`Values: ${property.values.map((item)=>item.value).join(', ')}`);
    console.log(`Feature: ${result.feature}`);
    const statusLabels = [
        ...result.status?.deprecated === true ? [
            'deprecated'
        ] : [],
        ...result.status?.experimental === true ? [
            'experimental'
        ] : []
    ];
    if (statusLabels.length > 0) console.log(`Status: ${statusLabels.join(', ')}`);
    if (null === result.compatibility) return void console.log('Compatibility: no compat_data is defined for this property.');
    console.log('Compatibility:');
    for (const row of result.compatibility){
        const noteText = Array.isArray(row.notes) ? row.notes.join(' | ') : row.notes;
        const notes = void 0 === noteText ? '' : `; notes=${noteText}`;
        const partial = true === row.partial_implementation ? '; partial' : '';
        console.log(`- ${row.backend}: added=${formatVersionAdded(row.version_added)}; ${row.availability}${partial}${notes}`);
    }
}
function printUpdateCheck(result) {
    if (result.update_available) return void console.log(`Update available: ${result.package} ${result.bundled_version} -> ${result.latest_version}`);
    if (result.bundled_version === result.latest_version) return void console.log(`Up to date: ${result.package}@${result.bundled_version}`);
    console.log(`No update available: bundled=${result.bundled_version}; registry=${result.latest_version}`);
}
function normalizeArguments(argv) {
    const valueOptions = new Set([
        '--backend',
        '--feature',
        '--lynx-version'
    ]);
    let propertyIndex = -1;
    for(let index = 2; index < argv.length; index += 1){
        const argument = argv[index];
        if (void 0 !== argument) {
            if (valueOptions.has(argument)) {
                index += 1;
                continue;
            }
            if (argument.startsWith('-') && !argument.startsWith('--') && '-h' !== argument && CssPropertyNameSchema.safeParse(argument).success) {
                propertyIndex = index;
                break;
            }
        }
    }
    if (propertyIndex < 0) return {
        argv: [
            ...argv
        ]
    };
    const normalized = [
        ...argv
    ];
    const property = normalized[propertyIndex];
    if (void 0 === property) return {
        argv: normalized
    };
    normalized[propertyIndex] = 'leading-hyphen-property';
    return {
        argv: normalized,
        leadingHyphenProperty: property
    };
}
async function runQuery(property, options) {
    const result = await queryCompatibility(property, {
        ...void 0 === options.backend ? {} : {
            backend: options.backend
        },
        ...void 0 === options.feature ? {} : {
            feature: options.feature
        },
        ...void 0 === options.lynxVersion ? {} : {
            lynxVersion: options.lynxVersion
        }
    });
    if (true === options.json) console.log(JSON.stringify(result, null, 2));
    else printHumanResult(result);
}
async function runUpdateCheck(json) {
    const result = await checkForUpdates(await getBundledPackageVersion());
    if (json) return void console.log(JSON.stringify(result, null, 2));
    printUpdateCheck(result);
}
async function main() {
    const normalized = normalizeArguments(process.argv);
    const program = new Command().name('query-css-compat').description('Query @lynx-js/css-defines compatibility or check for a newer dataset version.').argument('[property]', 'CSS property name, for example display').option('--feature <feature>', 'nested compat_data feature, for example grid').option('--backend <backend>', 'backend such as android, ios, harmony, or web_lynx').option('--lynx-version <version>', 'target Lynx version, for example 3.4').option('--check-updates', 'check the latest dataset version without downloading it').option('--json', 'print the command result as JSON').showHelpAfterError();
    program.action(async (property)=>{
        const options = program.opts();
        if (true === options.checkUpdates) {
            if (void 0 !== property || void 0 !== options.backend || void 0 !== options.feature || void 0 !== options.lynxVersion) program.error('--check-updates cannot be combined with a property or query filters');
            await runUpdateCheck(true === options.json);
            return;
        }
        if (void 0 === property) return void program.error("error: missing required argument 'property'");
        await runQuery(normalized.leadingHyphenProperty ?? property, options);
    });
    await program.parseAsync(normalized.argv);
}
main().catch((error)=>{
    if (error instanceof UpdateCheckError) {
        console.error(error.message);
        process.exitCode = error.exitCode;
        return;
    }
    if (error instanceof QueryError) {
        console.error(error.message);
        process.exitCode = error.exitCode;
        return;
    }
    if (error instanceof ZodError) {
        console.error(error.issues.map((issue)=>{
            const path = issue.path.join('.');
            if ('unrecognized_keys' === issue.code) {
                const prefix = '' === path ? '' : `${path}: `;
                return `${prefix}unrecognized keys: ${issue.keys.join(', ')}`;
            }
            return '' === path ? issue.message : `${path}: ${issue.message}`;
        }).join('\n'));
        process.exitCode = 2;
        return;
    }
    throw error;
});
