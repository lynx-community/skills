import * as __rspack_external_node_process_786449bf from "node:process";
import { __webpack_require__ } from "./rslib-runtime.mjs";
import node_zlib from "node:zlib";
import { web_ReadableStream, promises_setTimeout, isListSessionResponse, DaemonTransport, CDPResponseTransformStream, DesktopTransport, promises, randomInt, AndroidTransport, node_os, FilterTransformStream, Connector, iOSTransport, node_createDebug, tmpdir } from "./854.mjs";
__webpack_require__.add({
    "node:process" (module) {
        module.exports = __rspack_external_node_process_786449bf;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/index.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { Argument } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/argument.js");
        const { Command } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js");
        const { CommanderError, InvalidArgumentError } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js");
        const { Help } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/help.js");
        const { Option } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/option.js");
        exports.program = new Command();
        exports.createCommand = (name)=>new Command(name);
        exports.createOption = (flags, description)=>new Option(flags, description);
        exports.createArgument = (name, description)=>new Argument(name, description);
        exports.Command = Command;
        exports.Option = Option;
        exports.Argument = Argument;
        exports.Help = Help;
        exports.CommanderError = CommanderError;
        exports.InvalidArgumentError = InvalidArgumentError;
        exports.InvalidOptionArgumentError = InvalidArgumentError;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/argument.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { InvalidArgumentError } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js");
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
                if (this._name.endsWith('...')) {
                    this.variadic = true;
                    this._name = this._name.slice(0, -3);
                }
            }
            name() {
                return this._name;
            }
            _collectValue(value, previous) {
                if (previous === this.defaultValue || !Array.isArray(previous)) return [
                    value
                ];
                previous.push(value);
                return previous;
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
                    if (this.variadic) return this._collectValue(arg, previous);
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
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js" (__unused_rspack_module, exports, __webpack_require__) {
        const EventEmitter = __webpack_require__("node:events").EventEmitter;
        const childProcess = __webpack_require__("node:child_process");
        const path = __webpack_require__("node:path");
        const fs = __webpack_require__("node:fs");
        const process1 = __webpack_require__("node:process");
        const { Argument, humanReadableArgName } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/argument.js");
        const { CommanderError } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js");
        const { Help, stripColor } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/help.js");
        const { Option, DualOptions } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/option.js");
        const { suggestSimilar } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/suggestSimilar.js");
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
                this._helpGroupHeading = void 0;
                this._defaultCommandGroup = void 0;
                this._defaultOptionGroup = void 0;
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
                this._outputConfiguration = {
                    ...this._outputConfiguration,
                    ...configuration
                };
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
            argument(name, description, parseArg, defaultValue) {
                const argument = this.createArgument(name, description);
                if ('function' == typeof parseArg) argument.default(defaultValue).argParser(parseArg);
                else argument.default(parseArg);
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
                if (previousArgument?.variadic) throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
                if (argument.required && void 0 !== argument.defaultValue && void 0 === argument.parseArg) throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
                this.registeredArguments.push(argument);
                return this;
            }
            helpCommand(enableOrNameAndArgs, description) {
                if ('boolean' == typeof enableOrNameAndArgs) {
                    this._addImplicitHelpCommand = enableOrNameAndArgs;
                    if (enableOrNameAndArgs && this._defaultCommandGroup) this._initCommandGroup(this._getHelpCommand());
                    return this;
                }
                const nameAndArgs = enableOrNameAndArgs ?? 'help [command]';
                const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
                const helpDescription = description ?? 'display help for command';
                const helpCommand = this.createCommand(helpName);
                helpCommand.helpOption(false);
                if (helpArgs) helpCommand.arguments(helpArgs);
                if (helpDescription) helpCommand.description(helpDescription);
                this._addImplicitHelpCommand = true;
                this._helpCommand = helpCommand;
                if (enableOrNameAndArgs || description) this._initCommandGroup(helpCommand);
                return this;
            }
            addHelpCommand(helpCommand, deprecatedDescription) {
                if ('object' != typeof helpCommand) {
                    this.helpCommand(helpCommand, deprecatedDescription);
                    return this;
                }
                this._addImplicitHelpCommand = true;
                this._helpCommand = helpCommand;
                this._initCommandGroup(helpCommand);
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
                this._initOptionGroup(option);
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
                this._initCommandGroup(command);
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
                    else if (null !== val && option.variadic) val = option._collectValue(val, oldValue);
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
                    this._executeSubCommand(subCommand, operands.concat(unknown));
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
                if (promise?.then && 'function' == typeof promise.then) return promise.then(()=>fn());
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
                if (this.parent?.listenerCount(commandEvent)) {
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
            parseOptions(args) {
                const operands = [];
                const unknown = [];
                let dest = operands;
                function maybeOption(arg) {
                    return arg.length > 1 && '-' === arg[0];
                }
                const negativeNumberArg = (arg)=>{
                    if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
                    return !this._getCommandAndAncestors().some((cmd)=>cmd.options.map((opt)=>opt.short).some((short)=>/^-\d$/.test(short)));
                };
                let activeVariadicOption = null;
                let activeGroup = null;
                let i = 0;
                while(i < args.length || activeGroup){
                    const arg = activeGroup ?? args[i++];
                    activeGroup = null;
                    if ('--' === arg) {
                        if (dest === unknown) dest.push(arg);
                        dest.push(...args.slice(i));
                        break;
                    }
                    if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
                        this.emit(`option:${activeVariadicOption.name()}`, arg);
                        continue;
                    }
                    activeVariadicOption = null;
                    if (maybeOption(arg)) {
                        const option = this._findOption(arg);
                        if (option) {
                            if (option.required) {
                                const value = args[i++];
                                if (void 0 === value) this.optionMissingArgument(option);
                                this.emit(`option:${option.name()}`, value);
                            } else if (option.optional) {
                                let value = null;
                                if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) value = args[i++];
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
                                activeGroup = `-${arg.slice(2)}`;
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
                    if (dest === operands && maybeOption(arg) && !(0 === this.commands.length && negativeNumberArg(arg))) dest = unknown;
                    if ((this._enablePositionalOptions || this._passThroughOptions) && 0 === operands.length && 0 === unknown.length) {
                        if (this._findCommand(arg)) {
                            operands.push(arg);
                            unknown.push(...args.slice(i));
                            break;
                        } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
                            operands.push(arg, ...args.slice(i));
                            break;
                        } else if (this._defaultCommandName) {
                            unknown.push(arg, ...args.slice(i));
                            break;
                        }
                    }
                    if (this._passThroughOptions) {
                        dest.push(arg, ...args.slice(i));
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
            helpGroup(heading) {
                if (void 0 === heading) return this._helpGroupHeading ?? '';
                this._helpGroupHeading = heading;
                return this;
            }
            commandsGroup(heading) {
                if (void 0 === heading) return this._defaultCommandGroup ?? '';
                this._defaultCommandGroup = heading;
                return this;
            }
            optionsGroup(heading) {
                if (void 0 === heading) return this._defaultOptionGroup ?? '';
                this._defaultOptionGroup = heading;
                return this;
            }
            _initOptionGroup(option) {
                if (this._defaultOptionGroup && !option.helpGroupHeading) option.helpGroup(this._defaultOptionGroup);
            }
            _initCommandGroup(cmd) {
                if (this._defaultCommandGroup && !cmd.helpGroup()) cmd.helpGroup(this._defaultCommandGroup);
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
                    if (flags) {
                        if (null === this._helpOption) this._helpOption = void 0;
                        if (this._defaultOptionGroup) this._initOptionGroup(this._getHelpOption());
                    } else this._helpOption = null;
                    return this;
                }
                this._helpOption = this.createOption(flags ?? '-h, --help', description ?? 'display help for command');
                if (flags || description) this._initOptionGroup(this._helpOption);
                return this;
            }
            _getHelpOption() {
                if (void 0 === this._helpOption) this.helpOption(void 0, void 0);
                return this._helpOption;
            }
            addHelpOption(option) {
                this._helpOption = option;
                this._initOptionGroup(option);
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
        exports.useColor = useColor;
    },
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js" (__unused_rspack_module, exports) {
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
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/help.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { humanReadableArgName } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/argument.js");
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
                if (extraInfo.length > 0) {
                    const extraDescription = `(${extraInfo.join(', ')})`;
                    if (option.description) return `${option.description} ${extraDescription}`;
                    return extraDescription;
                }
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
            formatItemList(heading, items, helper) {
                if (0 === items.length) return [];
                return [
                    helper.styleTitle(heading),
                    ...items,
                    ''
                ];
            }
            groupItems(unsortedItems, visibleItems, getGroup) {
                const result = new Map();
                unsortedItems.forEach((item)=>{
                    const group = getGroup(item);
                    if (!result.has(group)) result.set(group, []);
                });
                visibleItems.forEach((item)=>{
                    const group = getGroup(item);
                    if (!result.has(group)) result.set(group, []);
                    result.get(group).push(item);
                });
                return result;
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
                output = output.concat(this.formatItemList('Arguments:', argumentList, helper));
                const optionGroups = this.groupItems(cmd.options, helper.visibleOptions(cmd), (option)=>option.helpGroupHeading ?? 'Options:');
                optionGroups.forEach((options, group)=>{
                    const optionList = options.map((option)=>callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option))));
                    output = output.concat(this.formatItemList(group, optionList, helper));
                });
                if (helper.showGlobalOptions) {
                    const globalOptionList = helper.visibleGlobalOptions(cmd).map((option)=>callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option))));
                    output = output.concat(this.formatItemList('Global Options:', globalOptionList, helper));
                }
                const commandGroups = this.groupItems(cmd.commands, helper.visibleCommands(cmd), (sub)=>sub.helpGroup() || 'Commands:');
                commandGroups.forEach((commands, group)=>{
                    const commandList = commands.map((sub)=>callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(sub)), helper.styleSubcommandDescription(helper.subcommandDescription(sub))));
                    output = output.concat(this.formatItemList(group, commandList, helper));
                });
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
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/option.js" (__unused_rspack_module, exports, __webpack_require__) {
        const { InvalidArgumentError } = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/error.js");
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
                this.helpGroupHeading = void 0;
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
            _collectValue(value, previous) {
                if (previous === this.defaultValue || !Array.isArray(previous)) return [
                    value
                ];
                previous.push(value);
                return previous;
            }
            choices(values) {
                this.argChoices = values.slice();
                this.parseArg = (arg, previous)=>{
                    if (!this.argChoices.includes(arg)) throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
                    if (this.variadic) return this._collectValue(arg, previous);
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
            helpGroup(heading) {
                this.helpGroupHeading = heading;
                return this;
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
    "../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/suggestSimilar.js" (__unused_rspack_module, exports) {
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
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/a-callable.js" (module, __unused_rspack_exports, __webpack_require__) {
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        var tryToString = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/try-to-string.js");
        var $TypeError = TypeError;
        module.exports = function(argument) {
            if (isCallable(argument)) return argument;
            throw new $TypeError(tryToString(argument) + ' is not a function');
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/an-object.js" (module, __unused_rspack_exports, __webpack_require__) {
        var isObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-object.js");
        var $String = String;
        var $TypeError = TypeError;
        module.exports = function(argument) {
            if (isObject(argument)) return argument;
            throw new $TypeError($String(argument) + ' is not an object');
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/array-includes.js" (module, __unused_rspack_exports, __webpack_require__) {
        var toIndexedObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-indexed-object.js");
        var toAbsoluteIndex = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-absolute-index.js");
        var lengthOfArrayLike = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/length-of-array-like.js");
        var createMethod = function(IS_INCLUDES) {
            return function($this, el, fromIndex) {
                var O = toIndexedObject($this);
                var length = lengthOfArrayLike(O);
                if (0 === length) return !IS_INCLUDES && -1;
                var index = toAbsoluteIndex(fromIndex, length);
                var value;
                if (IS_INCLUDES && el !== el) while(length > index){
                    value = O[index++];
                    if (value !== value) return true;
                }
                else for(; length > index; index++)if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
                return !IS_INCLUDES && -1;
            };
        };
        module.exports = {
            includes: createMethod(true),
            indexOf: createMethod(false)
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/classof-raw.js" (module, __unused_rspack_exports, __webpack_require__) {
        var uncurryThis = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js");
        var toString = uncurryThis({}.toString);
        var stringSlice = uncurryThis(''.slice);
        module.exports = function(it) {
            return stringSlice(toString(it), 8, -1);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/copy-constructor-properties.js" (module, __unused_rspack_exports, __webpack_require__) {
        var hasOwn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/has-own-property.js");
        var ownKeys = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/own-keys.js");
        var getOwnPropertyDescriptorModule = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-get-own-property-descriptor.js");
        var definePropertyModule = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-define-property.js");
        module.exports = function(target, source, exceptions) {
            var keys = ownKeys(source);
            var defineProperty = definePropertyModule.f;
            var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
            for(var i = 0; i < keys.length; i++){
                var key = keys[i];
                if (!hasOwn(target, key) && !(exceptions && hasOwn(exceptions, key))) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
            }
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/create-non-enumerable-property.js" (module, __unused_rspack_exports, __webpack_require__) {
        var DESCRIPTORS = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/descriptors.js");
        var definePropertyModule = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-define-property.js");
        var createPropertyDescriptor = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/create-property-descriptor.js");
        module.exports = DESCRIPTORS ? function(object, key, value) {
            return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
        } : function(object, key, value) {
            object[key] = value;
            return object;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/create-property-descriptor.js" (module) {
        module.exports = function(bitmap, value) {
            return {
                enumerable: !(1 & bitmap),
                configurable: !(2 & bitmap),
                writable: !(4 & bitmap),
                value: value
            };
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/define-built-in.js" (module, __unused_rspack_exports, __webpack_require__) {
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        var definePropertyModule = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-define-property.js");
        var makeBuiltIn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/make-built-in.js");
        var defineGlobalProperty = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/define-global-property.js");
        module.exports = function(O, key, value, options) {
            if (!options) options = {};
            var simple = options.enumerable;
            var name = void 0 !== options.name ? options.name : key;
            if (isCallable(value)) makeBuiltIn(value, name, options);
            if (options.global) if (simple) O[key] = value;
            else defineGlobalProperty(key, value);
            else {
                try {
                    if (options.unsafe) {
                        if (O[key]) simple = true;
                    } else delete O[key];
                } catch (error) {}
                if (simple) O[key] = value;
                else definePropertyModule.f(O, key, {
                    value: value,
                    enumerable: false,
                    configurable: !options.nonConfigurable,
                    writable: !options.nonWritable
                });
            }
            return O;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/define-global-property.js" (module, __unused_rspack_exports, __webpack_require__) {
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var defineProperty = Object.defineProperty;
        module.exports = function(key, value) {
            try {
                defineProperty(globalThis1, key, {
                    value: value,
                    configurable: true,
                    writable: true
                });
            } catch (error) {
                globalThis1[key] = value;
            }
            return value;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/descriptors.js" (module, __unused_rspack_exports, __webpack_require__) {
        var fails = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/fails.js");
        module.exports = !fails(function() {
            return 7 !== Object.defineProperty({}, 1, {
                get: function() {
                    return 7;
                }
            })[1];
        });
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/document-create-element.js" (module, __unused_rspack_exports, __webpack_require__) {
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var isObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-object.js");
        var document1 = globalThis1.document;
        var EXISTS = isObject(document1) && isObject(document1.createElement);
        module.exports = function(it) {
            return EXISTS ? document1.createElement(it) : {};
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/enum-bug-keys.js" (module) {
        module.exports = [
            'constructor',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'toLocaleString',
            'toString',
            'valueOf'
        ];
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/environment-user-agent.js" (module, __unused_rspack_exports, __webpack_require__) {
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var navigator = globalThis1.navigator;
        var userAgent = navigator && navigator.userAgent;
        module.exports = userAgent ? String(userAgent) : '';
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/environment-v8-version.js" (module, __unused_rspack_exports, __webpack_require__) {
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var userAgent = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/environment-user-agent.js");
        var process1 = globalThis1.process;
        var Deno = globalThis1.Deno;
        var versions = process1 && process1.versions || Deno && Deno.version;
        var v8 = versions && versions.v8;
        var match, version;
        if (v8) {
            match = v8.split('.');
            version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
        }
        if (!version && userAgent) {
            match = userAgent.match(/Edge\/(\d+)/);
            if (!match || match[1] >= 74) {
                match = userAgent.match(/Chrome\/(\d+)/);
                if (match) version = +match[1];
            }
        }
        module.exports = version;
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/export.js" (module, __unused_rspack_exports, __webpack_require__) {
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var getOwnPropertyDescriptor = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-get-own-property-descriptor.js").f;
        var createNonEnumerableProperty = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/create-non-enumerable-property.js");
        var defineBuiltIn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/define-built-in.js");
        var defineGlobalProperty = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/define-global-property.js");
        var copyConstructorProperties = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/copy-constructor-properties.js");
        var isForced = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-forced.js");
        module.exports = function(options, source) {
            var TARGET = options.target;
            var GLOBAL = options.global;
            var STATIC = options.stat;
            var FORCED, target, key, targetProperty, sourceProperty, descriptor;
            target = GLOBAL ? globalThis1 : STATIC ? globalThis1[TARGET] || defineGlobalProperty(TARGET, {}) : globalThis1[TARGET] && globalThis1[TARGET].prototype;
            if (target) for(key in source){
                sourceProperty = source[key];
                if (options.dontCallGetSet) {
                    descriptor = getOwnPropertyDescriptor(target, key);
                    targetProperty = descriptor && descriptor.value;
                } else targetProperty = target[key];
                FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
                if (!FORCED && void 0 !== targetProperty) {
                    if (typeof sourceProperty == typeof targetProperty) continue;
                    copyConstructorProperties(sourceProperty, targetProperty);
                }
                if (options.sham || targetProperty && targetProperty.sham) createNonEnumerableProperty(sourceProperty, 'sham', true);
                defineBuiltIn(target, key, sourceProperty, options);
            }
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/fails.js" (module) {
        module.exports = function(exec) {
            try {
                return !!exec();
            } catch (error) {
                return true;
            }
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-bind-native.js" (module, __unused_rspack_exports, __webpack_require__) {
        var fails = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/fails.js");
        module.exports = !fails(function() {
            var test = (function() {}).bind();
            return 'function' != typeof test || test.hasOwnProperty('prototype');
        });
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-call.js" (module, __unused_rspack_exports, __webpack_require__) {
        var NATIVE_BIND = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-bind-native.js");
        var call = Function.prototype.call;
        module.exports = NATIVE_BIND ? call.bind(call) : function() {
            return call.apply(call, arguments);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-name.js" (module, __unused_rspack_exports, __webpack_require__) {
        var DESCRIPTORS = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/descriptors.js");
        var hasOwn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/has-own-property.js");
        var FunctionPrototype = Function.prototype;
        var getDescriptor = DESCRIPTORS && Object.getOwnPropertyDescriptor;
        var EXISTS = hasOwn(FunctionPrototype, 'name');
        var PROPER = EXISTS && 'something' === (function() {}).name;
        var CONFIGURABLE = EXISTS && (!DESCRIPTORS || DESCRIPTORS && getDescriptor(FunctionPrototype, 'name').configurable);
        module.exports = {
            EXISTS: EXISTS,
            PROPER: PROPER,
            CONFIGURABLE: CONFIGURABLE
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js" (module, __unused_rspack_exports, __webpack_require__) {
        var NATIVE_BIND = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-bind-native.js");
        var FunctionPrototype = Function.prototype;
        var call = FunctionPrototype.call;
        var uncurryThisWithBind = NATIVE_BIND && FunctionPrototype.bind.bind(call, call);
        module.exports = NATIVE_BIND ? uncurryThisWithBind : function(fn) {
            return function() {
                return call.apply(fn, arguments);
            };
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/get-built-in.js" (module, __unused_rspack_exports, __webpack_require__) {
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        var aFunction = function(argument) {
            return isCallable(argument) ? argument : void 0;
        };
        module.exports = function(namespace, method) {
            return arguments.length < 2 ? aFunction(globalThis1[namespace]) : globalThis1[namespace] && globalThis1[namespace][method];
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/get-method.js" (module, __unused_rspack_exports, __webpack_require__) {
        var aCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/a-callable.js");
        var isNullOrUndefined = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-null-or-undefined.js");
        module.exports = function(V, P) {
            var func = V[P];
            return isNullOrUndefined(func) ? void 0 : aCallable(func);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js" (module) {
        var check = function(it) {
            return it && it.Math === Math && it;
        };
        module.exports = check('object' == typeof globalThis && globalThis) || check('object' == typeof window && window) || check('object' == typeof self && self) || check('object' == typeof global && global) || check('object' == typeof this && this) || function() {
            return this;
        }() || Function('return this')();
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/has-own-property.js" (module, __unused_rspack_exports, __webpack_require__) {
        var uncurryThis = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js");
        var toObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-object.js");
        var hasOwnProperty = uncurryThis({}.hasOwnProperty);
        module.exports = Object.hasOwn || function(it, key) {
            return hasOwnProperty(toObject(it), key);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/hidden-keys.js" (module) {
        module.exports = {};
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/ie8-dom-define.js" (module, __unused_rspack_exports, __webpack_require__) {
        var DESCRIPTORS = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/descriptors.js");
        var fails = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/fails.js");
        var createElement = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/document-create-element.js");
        module.exports = !DESCRIPTORS && !fails(function() {
            return 7 !== Object.defineProperty(createElement('div'), 'a', {
                get: function() {
                    return 7;
                }
            }).a;
        });
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/indexed-object.js" (module, __unused_rspack_exports, __webpack_require__) {
        var uncurryThis = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js");
        var fails = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/fails.js");
        var classof = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/classof-raw.js");
        var $Object = Object;
        var split = uncurryThis(''.split);
        module.exports = fails(function() {
            return !$Object('z').propertyIsEnumerable(0);
        }) ? function(it) {
            return 'String' === classof(it) ? split(it, '') : $Object(it);
        } : $Object;
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/inspect-source.js" (module, __unused_rspack_exports, __webpack_require__) {
        var uncurryThis = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js");
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        var store = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/shared-store.js");
        var functionToString = uncurryThis(Function.toString);
        if (!isCallable(store.inspectSource)) store.inspectSource = function(it) {
            return functionToString(it);
        };
        module.exports = store.inspectSource;
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/internal-state.js" (module, __unused_rspack_exports, __webpack_require__) {
        var NATIVE_WEAK_MAP = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/weak-map-basic-detection.js");
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var isObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-object.js");
        var createNonEnumerableProperty = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/create-non-enumerable-property.js");
        var hasOwn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/has-own-property.js");
        var shared = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/shared-store.js");
        var sharedKey = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/shared-key.js");
        var hiddenKeys = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/hidden-keys.js");
        var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
        var TypeError1 = globalThis1.TypeError;
        var WeakMap = globalThis1.WeakMap;
        var set, get, has;
        var enforce = function(it) {
            return has(it) ? get(it) : set(it, {});
        };
        var getterFor = function(TYPE) {
            return function(it) {
                var state;
                if (!isObject(it) || (state = get(it)).type !== TYPE) throw new TypeError1('Incompatible receiver, ' + TYPE + ' required');
                return state;
            };
        };
        if (NATIVE_WEAK_MAP || shared.state) {
            var store = shared.state || (shared.state = new WeakMap());
            store.get = store.get;
            store.has = store.has;
            store.set = store.set;
            set = function(it, metadata) {
                if (store.has(it)) throw new TypeError1(OBJECT_ALREADY_INITIALIZED);
                metadata.facade = it;
                store.set(it, metadata);
                return metadata;
            };
            get = function(it) {
                return store.get(it) || {};
            };
            has = function(it) {
                return store.has(it);
            };
        } else {
            var STATE = sharedKey('state');
            hiddenKeys[STATE] = true;
            set = function(it, metadata) {
                if (hasOwn(it, STATE)) throw new TypeError1(OBJECT_ALREADY_INITIALIZED);
                metadata.facade = it;
                createNonEnumerableProperty(it, STATE, metadata);
                return metadata;
            };
            get = function(it) {
                return hasOwn(it, STATE) ? it[STATE] : {};
            };
            has = function(it) {
                return hasOwn(it, STATE);
            };
        }
        module.exports = {
            set: set,
            get: get,
            has: has,
            enforce: enforce,
            getterFor: getterFor
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js" (module) {
        var documentAll = 'object' == typeof document && document.all;
        module.exports = void 0 === documentAll && void 0 !== documentAll ? function(argument) {
            return 'function' == typeof argument || argument === documentAll;
        } : function(argument) {
            return 'function' == typeof argument;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-forced.js" (module, __unused_rspack_exports, __webpack_require__) {
        var fails = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/fails.js");
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        var replacement = /#|\.prototype\./;
        var isForced = function(feature, detection) {
            var value = data[normalize(feature)];
            return value === POLYFILL ? true : value === NATIVE ? false : isCallable(detection) ? fails(detection) : !!detection;
        };
        var normalize = isForced.normalize = function(string) {
            return String(string).replace(replacement, '.').toLowerCase();
        };
        var data = isForced.data = {};
        var NATIVE = isForced.NATIVE = 'N';
        var POLYFILL = isForced.POLYFILL = 'P';
        module.exports = isForced;
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-null-or-undefined.js" (module) {
        module.exports = function(it) {
            return null == it;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-object.js" (module, __unused_rspack_exports, __webpack_require__) {
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        module.exports = function(it) {
            return 'object' == typeof it ? null !== it : isCallable(it);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-pure.js" (module) {
        module.exports = false;
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-symbol.js" (module, __unused_rspack_exports, __webpack_require__) {
        var getBuiltIn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/get-built-in.js");
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        var isPrototypeOf = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-is-prototype-of.js");
        var USE_SYMBOL_AS_UID = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/use-symbol-as-uid.js");
        var $Object = Object;
        module.exports = USE_SYMBOL_AS_UID ? function(it) {
            return 'symbol' == typeof it;
        } : function(it) {
            var $Symbol = getBuiltIn('Symbol');
            return isCallable($Symbol) && isPrototypeOf($Symbol.prototype, $Object(it));
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/length-of-array-like.js" (module, __unused_rspack_exports, __webpack_require__) {
        var toLength = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-length.js");
        module.exports = function(obj) {
            return toLength(obj.length);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/make-built-in.js" (module, __unused_rspack_exports, __webpack_require__) {
        var uncurryThis = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js");
        var fails = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/fails.js");
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        var hasOwn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/has-own-property.js");
        var DESCRIPTORS = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/descriptors.js");
        var CONFIGURABLE_FUNCTION_NAME = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-name.js").CONFIGURABLE;
        var inspectSource = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/inspect-source.js");
        var InternalStateModule = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/internal-state.js");
        var enforceInternalState = InternalStateModule.enforce;
        var getInternalState = InternalStateModule.get;
        var $String = String;
        var defineProperty = Object.defineProperty;
        var stringSlice = uncurryThis(''.slice);
        var replace = uncurryThis(''.replace);
        var join = uncurryThis([].join);
        var CONFIGURABLE_LENGTH = DESCRIPTORS && !fails(function() {
            return 8 !== defineProperty(function() {}, 'length', {
                value: 8
            }).length;
        });
        var TEMPLATE = String(String).split('String');
        var makeBuiltIn = module.exports = function(value, name, options) {
            if ('Symbol(' === stringSlice($String(name), 0, 7)) name = '[' + replace($String(name), /^Symbol\(([^)]*)\).*$/, '$1') + ']';
            if (options && options.getter) name = 'get ' + name;
            if (options && options.setter) name = 'set ' + name;
            if (!hasOwn(value, 'name') || CONFIGURABLE_FUNCTION_NAME && value.name !== name) if (DESCRIPTORS) defineProperty(value, 'name', {
                value: name,
                configurable: true
            });
            else value.name = name;
            if (CONFIGURABLE_LENGTH && options && hasOwn(options, 'arity') && value.length !== options.arity) defineProperty(value, 'length', {
                value: options.arity
            });
            try {
                if (options && hasOwn(options, 'constructor') && options.constructor) {
                    if (DESCRIPTORS) defineProperty(value, 'prototype', {
                        writable: false
                    });
                } else if (value.prototype) value.prototype = void 0;
            } catch (error) {}
            var state = enforceInternalState(value);
            if (!hasOwn(state, 'source')) state.source = join(TEMPLATE, 'string' == typeof name ? name : '');
            return value;
        };
        Function.prototype.toString = makeBuiltIn(function() {
            return isCallable(this) && getInternalState(this).source || inspectSource(this);
        }, 'toString');
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/math-trunc.js" (module) {
        var ceil = Math.ceil;
        var floor = Math.floor;
        module.exports = Math.trunc || function(x) {
            var n = +x;
            return (n > 0 ? floor : ceil)(n);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/new-promise-capability.js" (module, __unused_rspack_exports, __webpack_require__) {
        var aCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/a-callable.js");
        var $TypeError = TypeError;
        var PromiseCapability = function(C) {
            var resolve, reject;
            this.promise = new C(function($$resolve, $$reject) {
                if (void 0 !== resolve || void 0 !== reject) throw new $TypeError('Bad Promise constructor');
                resolve = $$resolve;
                reject = $$reject;
            });
            this.resolve = aCallable(resolve);
            this.reject = aCallable(reject);
        };
        module.exports.f = function(C) {
            return new PromiseCapability(C);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-define-property.js" (__unused_rspack_module, exports, __webpack_require__) {
        var DESCRIPTORS = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/descriptors.js");
        var IE8_DOM_DEFINE = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/ie8-dom-define.js");
        var V8_PROTOTYPE_DEFINE_BUG = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/v8-prototype-define-bug.js");
        var anObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/an-object.js");
        var toPropertyKey = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-property-key.js");
        var $TypeError = TypeError;
        var $defineProperty = Object.defineProperty;
        var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
        var ENUMERABLE = 'enumerable';
        var CONFIGURABLE = 'configurable';
        var WRITABLE = 'writable';
        exports.f = DESCRIPTORS ? V8_PROTOTYPE_DEFINE_BUG ? function(O, P, Attributes) {
            anObject(O);
            P = toPropertyKey(P);
            anObject(Attributes);
            if ('function' == typeof O && 'prototype' === P && 'value' in Attributes && WRITABLE in Attributes && !Attributes[WRITABLE]) {
                var current = $getOwnPropertyDescriptor(O, P);
                if (current && current[WRITABLE]) {
                    O[P] = Attributes.value;
                    Attributes = {
                        configurable: CONFIGURABLE in Attributes ? Attributes[CONFIGURABLE] : current[CONFIGURABLE],
                        enumerable: ENUMERABLE in Attributes ? Attributes[ENUMERABLE] : current[ENUMERABLE],
                        writable: false
                    };
                }
            }
            return $defineProperty(O, P, Attributes);
        } : $defineProperty : function(O, P, Attributes) {
            anObject(O);
            P = toPropertyKey(P);
            anObject(Attributes);
            if (IE8_DOM_DEFINE) try {
                return $defineProperty(O, P, Attributes);
            } catch (error) {}
            if ('get' in Attributes || 'set' in Attributes) throw new $TypeError('Accessors not supported');
            if ('value' in Attributes) O[P] = Attributes.value;
            return O;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-get-own-property-descriptor.js" (__unused_rspack_module, exports, __webpack_require__) {
        var DESCRIPTORS = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/descriptors.js");
        var call = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-call.js");
        var propertyIsEnumerableModule = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-property-is-enumerable.js");
        var createPropertyDescriptor = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/create-property-descriptor.js");
        var toIndexedObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-indexed-object.js");
        var toPropertyKey = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-property-key.js");
        var hasOwn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/has-own-property.js");
        var IE8_DOM_DEFINE = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/ie8-dom-define.js");
        var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
        exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function(O, P) {
            O = toIndexedObject(O);
            P = toPropertyKey(P);
            if (IE8_DOM_DEFINE) try {
                return $getOwnPropertyDescriptor(O, P);
            } catch (error) {}
            if (hasOwn(O, P)) return createPropertyDescriptor(!call(propertyIsEnumerableModule.f, O, P), O[P]);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-get-own-property-names.js" (__unused_rspack_module, exports, __webpack_require__) {
        var internalObjectKeys = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-keys-internal.js");
        var enumBugKeys = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/enum-bug-keys.js");
        var hiddenKeys = enumBugKeys.concat('length', 'prototype');
        exports.f = Object.getOwnPropertyNames || function(O) {
            return internalObjectKeys(O, hiddenKeys);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-get-own-property-symbols.js" (__unused_rspack_module, exports) {
        exports.f = Object.getOwnPropertySymbols;
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-is-prototype-of.js" (module, __unused_rspack_exports, __webpack_require__) {
        var uncurryThis = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js");
        module.exports = uncurryThis({}.isPrototypeOf);
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-keys-internal.js" (module, __unused_rspack_exports, __webpack_require__) {
        var uncurryThis = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js");
        var hasOwn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/has-own-property.js");
        var toIndexedObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-indexed-object.js");
        var indexOf = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/array-includes.js").indexOf;
        var hiddenKeys = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/hidden-keys.js");
        var push = uncurryThis([].push);
        module.exports = function(object, names) {
            var O = toIndexedObject(object);
            var i = 0;
            var result = [];
            var key;
            for(key in O)!hasOwn(hiddenKeys, key) && hasOwn(O, key) && push(result, key);
            while(names.length > i)if (hasOwn(O, key = names[i++])) ~indexOf(result, key) || push(result, key);
            return result;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-property-is-enumerable.js" (__unused_rspack_module, exports) {
        var $propertyIsEnumerable = {}.propertyIsEnumerable;
        var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
        var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({
            1: 2
        }, 1);
        exports.f = NASHORN_BUG ? function(V) {
            var descriptor = getOwnPropertyDescriptor(this, V);
            return !!descriptor && descriptor.enumerable;
        } : $propertyIsEnumerable;
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/ordinary-to-primitive.js" (module, __unused_rspack_exports, __webpack_require__) {
        var call = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-call.js");
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        var isObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-object.js");
        var $TypeError = TypeError;
        module.exports = function(input, pref) {
            var fn, val;
            if ('string' === pref && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
            if (isCallable(fn = input.valueOf) && !isObject(val = call(fn, input))) return val;
            if ('string' !== pref && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
            throw new $TypeError("Can't convert object to primitive value");
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/own-keys.js" (module, __unused_rspack_exports, __webpack_require__) {
        var getBuiltIn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/get-built-in.js");
        var uncurryThis = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js");
        var getOwnPropertyNamesModule = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-get-own-property-names.js");
        var getOwnPropertySymbolsModule = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/object-get-own-property-symbols.js");
        var anObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/an-object.js");
        var concat = uncurryThis([].concat);
        module.exports = getBuiltIn('Reflect', 'ownKeys') || function(it) {
            var keys = getOwnPropertyNamesModule.f(anObject(it));
            var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
            return getOwnPropertySymbols ? concat(keys, getOwnPropertySymbols(it)) : keys;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/require-object-coercible.js" (module, __unused_rspack_exports, __webpack_require__) {
        var isNullOrUndefined = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-null-or-undefined.js");
        var $TypeError = TypeError;
        module.exports = function(it) {
            if (isNullOrUndefined(it)) throw new $TypeError("Can't call method on " + it);
            return it;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/shared-key.js" (module, __unused_rspack_exports, __webpack_require__) {
        var shared = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/shared.js");
        var uid = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/uid.js");
        var keys = shared('keys');
        module.exports = function(key) {
            return keys[key] || (keys[key] = uid(key));
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/shared-store.js" (module, __unused_rspack_exports, __webpack_require__) {
        var IS_PURE = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-pure.js");
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var defineGlobalProperty = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/define-global-property.js");
        var SHARED = '__core-js_shared__';
        var store = module.exports = globalThis1[SHARED] || defineGlobalProperty(SHARED, {});
        (store.versions || (store.versions = [])).push({
            version: '3.49.0',
            mode: IS_PURE ? 'pure' : 'global',
            copyright: '© 2013–2025 Denis Pushkarev (zloirock.ru), 2025–2026 CoreJS Company (core-js.io). All rights reserved.',
            license: 'https://github.com/zloirock/core-js/blob/v3.49.0/LICENSE',
            source: 'https://github.com/zloirock/core-js'
        });
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/shared.js" (module, __unused_rspack_exports, __webpack_require__) {
        var store = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/shared-store.js");
        module.exports = function(key, value) {
            return store[key] || (store[key] = value || {});
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/symbol-constructor-detection.js" (module, __unused_rspack_exports, __webpack_require__) {
        var V8_VERSION = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/environment-v8-version.js");
        var fails = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/fails.js");
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var $String = globalThis1.String;
        module.exports = !!Object.getOwnPropertySymbols && !fails(function() {
            var symbol = Symbol('symbol detection');
            return !$String(symbol) || !(Object(symbol) instanceof Symbol) || !Symbol.sham && V8_VERSION && V8_VERSION < 41;
        });
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-absolute-index.js" (module, __unused_rspack_exports, __webpack_require__) {
        var toIntegerOrInfinity = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-integer-or-infinity.js");
        var max = Math.max;
        var min = Math.min;
        module.exports = function(index, length) {
            var integer = toIntegerOrInfinity(index);
            return integer < 0 ? max(integer + length, 0) : min(integer, length);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-indexed-object.js" (module, __unused_rspack_exports, __webpack_require__) {
        var IndexedObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/indexed-object.js");
        var requireObjectCoercible = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/require-object-coercible.js");
        module.exports = function(it) {
            return IndexedObject(requireObjectCoercible(it));
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-integer-or-infinity.js" (module, __unused_rspack_exports, __webpack_require__) {
        var trunc = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/math-trunc.js");
        module.exports = function(argument) {
            var number = +argument;
            return number !== number || 0 === number ? 0 : trunc(number);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-length.js" (module, __unused_rspack_exports, __webpack_require__) {
        var toIntegerOrInfinity = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-integer-or-infinity.js");
        var min = Math.min;
        module.exports = function(argument) {
            var len = toIntegerOrInfinity(argument);
            return len > 0 ? min(len, 0x1FFFFFFFFFFFFF) : 0;
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-object.js" (module, __unused_rspack_exports, __webpack_require__) {
        var requireObjectCoercible = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/require-object-coercible.js");
        var $Object = Object;
        module.exports = function(argument) {
            return $Object(requireObjectCoercible(argument));
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-primitive.js" (module, __unused_rspack_exports, __webpack_require__) {
        var call = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-call.js");
        var isObject = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-object.js");
        var isSymbol = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-symbol.js");
        var getMethod = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/get-method.js");
        var ordinaryToPrimitive = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/ordinary-to-primitive.js");
        var wellKnownSymbol = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/well-known-symbol.js");
        var $TypeError = TypeError;
        var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');
        module.exports = function(input, pref) {
            if (!isObject(input) || isSymbol(input)) return input;
            var exoticToPrim = getMethod(input, TO_PRIMITIVE);
            var result;
            if (exoticToPrim) {
                if (void 0 === pref) pref = 'default';
                result = call(exoticToPrim, input, pref);
                if (!isObject(result) || isSymbol(result)) return result;
                throw new $TypeError("Can't convert object to primitive value");
            }
            if (void 0 === pref) pref = 'number';
            return ordinaryToPrimitive(input, pref);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-property-key.js" (module, __unused_rspack_exports, __webpack_require__) {
        var toPrimitive = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/to-primitive.js");
        var isSymbol = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-symbol.js");
        module.exports = function(argument) {
            var key = toPrimitive(argument, 'string');
            return isSymbol(key) ? key : key + '';
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/try-to-string.js" (module) {
        var $String = String;
        module.exports = function(argument) {
            try {
                return $String(argument);
            } catch (error) {
                return 'Object';
            }
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/uid.js" (module, __unused_rspack_exports, __webpack_require__) {
        var uncurryThis = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/function-uncurry-this.js");
        var id = 0;
        var postfix = Math.random();
        var toString = uncurryThis(1.1.toString);
        module.exports = function(key) {
            return 'Symbol(' + (void 0 === key ? '' : key) + ')_' + toString(++id + postfix, 36);
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/use-symbol-as-uid.js" (module, __unused_rspack_exports, __webpack_require__) {
        var NATIVE_SYMBOL = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/symbol-constructor-detection.js");
        module.exports = NATIVE_SYMBOL && !Symbol.sham && 'symbol' == typeof Symbol.iterator;
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/v8-prototype-define-bug.js" (module, __unused_rspack_exports, __webpack_require__) {
        var DESCRIPTORS = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/descriptors.js");
        var fails = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/fails.js");
        module.exports = DESCRIPTORS && fails(function() {
            return 42 !== Object.defineProperty(function() {}, 'prototype', {
                value: 42,
                writable: false
            }).prototype;
        });
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/weak-map-basic-detection.js" (module, __unused_rspack_exports, __webpack_require__) {
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var isCallable = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/is-callable.js");
        var WeakMap = globalThis1.WeakMap;
        module.exports = isCallable(WeakMap) && /native code/.test(String(WeakMap));
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/well-known-symbol.js" (module, __unused_rspack_exports, __webpack_require__) {
        var globalThis1 = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/global-this.js");
        var shared = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/shared.js");
        var hasOwn = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/has-own-property.js");
        var uid = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/uid.js");
        var NATIVE_SYMBOL = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/symbol-constructor-detection.js");
        var USE_SYMBOL_AS_UID = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/use-symbol-as-uid.js");
        var Symbol1 = globalThis1.Symbol;
        var WellKnownSymbolsStore = shared('wks');
        var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol1['for'] || Symbol1 : Symbol1 && Symbol1.withoutSetter || uid;
        module.exports = function(name) {
            if (!hasOwn(WellKnownSymbolsStore, name)) WellKnownSymbolsStore[name] = NATIVE_SYMBOL && hasOwn(Symbol1, name) ? Symbol1[name] : createWellKnownSymbol('Symbol.' + name);
            return WellKnownSymbolsStore[name];
        };
    },
    "../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/modules/es.promise.with-resolvers.js" (__unused_rspack_module, __unused_rspack_exports, __webpack_require__) {
        var $ = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/export.js");
        var newPromiseCapabilityModule = __webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/internals/new-promise-capability.js");
        $({
            target: 'Promise',
            stat: true
        }, {
            withResolvers: function() {
                var promiseCapability = newPromiseCapabilityModule.f(this);
                return {
                    promise: promiseCapability.promise,
                    resolve: promiseCapability.resolve,
                    reject: promiseCapability.reject
                };
            }
        });
    }
});
const commander = __webpack_require__("../../../node_modules/.pnpm/commander@14.0.3/node_modules/commander/index.js");
const { program: esm_program, createCommand: createCommand, createArgument: createArgument, createOption: createOption, CommanderError: CommanderError, InvalidArgumentError: InvalidArgumentError, InvalidOptionArgumentError: InvalidOptionArgumentError, Command: Command, Argument: Argument, Option: Option, Help: Help } = commander;
var package_namespaceObject = {
    rE: "0.13.3"
};
const CLIENT_OPTION = [
    '-c, --client <clientId>',
    'Client ID (optional, auto-discovered if omitted).'
];
const CLIENT_NAME_OPTION = [
    '--client-name <name>',
    'Client package/app name (optional, resolved from list-clients; e.g. com.example.app)'
];
const SESSION_OPTION = [
    '-s, --session <sessionId>',
    'Session ID (optional, will auto-discover if not provided)'
];
async function getFirstClient(connector) {
    const clients = await connector.listClients();
    const firstClient = clients[0];
    if (!firstClient) throw new Error('No available clients found.');
    return firstClient.id;
}
function uniqueNonEmptyStrings(values) {
    return Array.from(new Set(values.filter((value)=>'string' == typeof value).map((value)=>value.trim()).filter(Boolean)));
}
function getClientNames(client) {
    return uniqueNonEmptyStrings([
        client.info.AppProcessName,
        client.info.bundleId,
        client.info.bundleName,
        client.info.App
    ]);
}
function formatClientForError(client) {
    const names = getClientNames(client);
    const suffix = names.length > 0 ? ` (${names.join(', ')})` : '';
    return `  ${client.id}${suffix}`;
}
async function getClientByName(connector, clientName) {
    const clients = await connector.listClients();
    const matches = clients.filter((client)=>getClientNames(client).includes(clientName));
    if (1 === matches.length) {
        const matchedClient = matches[0];
        return matchedClient.id;
    }
    if (matches.length > 1) throw new Error(`Multiple clients found matching --client-name "${clientName}". Use --client with one of:\n` + matches.map(formatClientForError).join('\n'));
    const availableClients = clients.map(formatClientForError).join('\n');
    throw new Error(`No client found matching --client-name "${clientName}".` + (availableClients ? `\nAvailable clients:\n${availableClients}` : '\nNo real-device clients are available.'));
}
async function getLatestSession(connector, clientId) {
    const sessions = await connector.sendListSessionMessage(clientId);
    if (!sessions || 0 === sessions.length) throw new Error(`No available sessions found for client: ${clientId}`);
    const latestSession = sessions.reduce((max, session)=>Number(session.session_id) > Number(max.session_id) ? session : max);
    return String(latestSession.session_id);
}
async function resolveClient({ transports }, options) {
    const connector = new Connector(transports);
    if (options.client && options.clientName) throw new Error('Use either --client or --client-name, not both.');
    const clientId = options.client ?? (options.clientName ? await getClientByName(connector, options.clientName) : await getFirstClient(connector));
    return {
        connector,
        clientId
    };
}
async function resolveClientAndSession(context, options) {
    const { connector, clientId } = await resolveClient(context, options);
    const sessionId = options.session ?? await getLatestSession(connector, clientId);
    return {
        connector,
        clientId,
        sessionId
    };
}
function isAbortError(err) {
    return err instanceof Error && 'AbortError' === err.name;
}
function parseOnOff(input, optionName = '--status') {
    const normalized = input.trim().toLowerCase();
    if ('on' === normalized || 'true' === normalized || '1' === normalized) return true;
    if ('off' === normalized || 'false' === normalized || '0' === normalized) return false;
    throw new Error(`Invalid ${optionName} value: ${input}. Use on/off.`);
}
async function readOrTimeout(reader, idleMs) {
    const idleAbortController = new AbortController();
    const idle = promises_setTimeout(idleMs, 'timeout', {
        signal: idleAbortController.signal
    });
    try {
        return await Promise.race([
            reader.read(),
            idle
        ]);
    } finally{
        idleAbortController.abort();
        await idle.catch(()=>{});
    }
}
async function* readUntilIdle(stream, opts) {
    const reader = stream.getReader();
    const startTime = Date.now();
    let terminated = false;
    try {
        while(Date.now() - startTime < opts.maxMs){
            const result = await readOrTimeout(reader, opts.idleMs);
            if ('timeout' === result) {
                await reader.cancel();
                terminated = true;
                return;
            }
            const { done, value } = result;
            if (done) {
                terminated = true;
                return;
            }
            yield value;
        }
        await reader.cancel();
        terminated = true;
    } finally{
        if (!terminated) await reader.cancel().catch(()=>{});
        reader.releaseLock();
    }
}
function registerAppCommand(program, context) {
    program.command('app').description('Send an App request').requiredOption('-m, --method <method>', 'App method (e.g., App.openPage)').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).argument('[params]', 'JSON string of parameters').action(async (paramsStr, options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const { method } = options;
        const params = paramsStr ? JSON.parse(paramsStr) : {};
        const result = await connector.sendAppMessage(clientId, method, params);
        console.log(JSON.stringify(result, null, 2));
    });
}
function registerCdpCommand(program, context) {
    program.command('cdp').description('Send a CDP request').requiredOption('-m, --method <method>', 'CDP method (e.g., DOM.getDocument)').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--thread <thread>', "Thread to target (e.g., 'main' or 'background'). Defaults to 'background'").argument('[params]', 'JSON string of parameters').action(async (paramsStr, options)=>{
        const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
        const { method } = options;
        const thread = options.thread ?? 'background';
        const params = paramsStr ? JSON.parse(paramsStr) : {};
        const result = await connector.sendCDPMessage(clientId, Number(sessionId), method, params, 'main' === thread);
        console.log(JSON.stringify(result, null, 2));
    });
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
function get_console_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (get_console_ts_dispose_resources = function(env) {
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
function formatConsoleMessage({ type, args, stackTrace, consoleTag }) {
    return `- [${type}/${'Lepus' === consoleTag ? 'main-thread' : 'background'}]: ${args.map((arg)=>{
        if (arg.objectId) return `<${arg.description || arg.className || 'Object'} (objectId:${arg.objectId})>`;
        return arg.value;
    }).join(' ')}${stackTrace ? '\n' + stackTrace.callFrames.map(({ url, lineNumber, columnNumber })=>`    at ${url}:${lineNumber}:${columnNumber}`).join('\n') : ''}`;
}
function registerGetConsoleCommand(program, context) {
    program.command('get-console').description('Capture console logs from the device').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--offset <number>', 'The number of console messages to skip before returning results.', parseInt).option('--limit <number>', 'The maximum number of console messages to return.', parseInt).option('--include-stack-traces', 'By default, only error messages would contain stack traces. Set this to true to include stack traces for all messages in the output.').option('--level <levels>', "The log level to filter messages. Defaults to ['info', 'log', 'warning', 'error']", (value)=>value.split(',').map((s)=>s.trim())).option('--thread <thread...>', 'VM thread to target: background or main', [
        'background',
        'main'
    ]).option('-w, --watch', 'Stream console logs as they arrive, printing each message immediately, until interrupted (Ctrl+C) or --limit is reached', false).action(async (options)=>{
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const { offset = 0, includeStackTraces, level, watch } = options;
            let { limit, thread } = options;
            if (!Array.isArray(thread)) thread = [
                thread
            ];
            if (!thread.every((t)=>'background' === t || 'main' === t)) throw new Error(`Invalid thread: ${thread}. Expected 'background' or 'main'.`);
            if (limit) limit = Math.max(1, Math.min(100, limit));
            const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
            const stream = _ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, Number(sessionId), web_ReadableStream.from([
                {
                    method: 'Page.enable'
                },
                {
                    method: 'Page.getResourceTree'
                },
                ...thread.map((t)=>({
                        method: 'Debugger.enable',
                        sessionId: 'main' === t ? 'Main' : void 0
                    })),
                ...thread.map((t)=>({
                        method: 'Runtime.enable',
                        sessionId: 'main' === t ? 'Main' : void 0
                    }))
            ])), true);
            const defaultLevels = [
                'info',
                'log',
                'warning',
                'error'
            ];
            const allowedLevels = level || defaultLevels;
            let skipped = 0;
            let produced = 0;
            if (watch) {
                const reader = stream.getReader();
                let aborted = false;
                const onSigint = ()=>{
                    aborted = true;
                    reader.cancel().catch(()=>{});
                };
                process.once('SIGINT', onSigint);
                try {
                    while(!aborted){
                        const { done, value } = await reader.read();
                        if (done) break;
                        if ('Runtime.consoleAPICalled' !== value.method) continue;
                        const params = value.params;
                        if (!allowedLevels.includes(params.type)) continue;
                        if (skipped < offset) {
                            skipped++;
                            continue;
                        }
                        if (!includeStackTraces && 'error' !== params.type) delete params.stackTrace;
                        console.log(formatConsoleMessage(params));
                        produced++;
                        if (limit && produced >= limit) {
                            await reader.cancel();
                            break;
                        }
                    }
                } finally{
                    process.off('SIGINT', onSigint);
                    reader.releaseLock();
                }
                return;
            }
            const messages = [];
            for await (const value of readUntilIdle(stream, {
                idleMs: 500,
                maxMs: 5000
            })){
                if ('Runtime.consoleAPICalled' !== value.method) continue;
                const params = value.params;
                if (allowedLevels.includes(params.type)) {
                    if (skipped < offset) {
                        skipped++;
                        continue;
                    }
                    if (!includeStackTraces && 'error' !== params.type) delete params.stackTrace;
                    messages.push(params);
                    if (limit && messages.length >= limit) break;
                }
            }
            console.log(messages.map(formatConsoleMessage).join('\n'));
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = get_console_ts_dispose_resources(env);
            if (result) await result;
        }
    });
}
function get_sources_ts_add_disposable_resource(env, value, async) {
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
function get_sources_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (get_sources_ts_dispose_resources = function(env) {
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
function registerGetSourcesCommand(program, context) {
    program.command('get-sources').description("List all parsed scripts.").option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).action(async (options)=>{
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
            const numericSessionId = Number(sessionId);
            const messages = [
                {
                    method: 'Debugger.disable'
                },
                {
                    method: 'Debugger.enable'
                }
            ];
            const stream = get_sources_ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, numericSessionId, web_ReadableStream.from(messages)), true);
            const scripts = [];
            for await (const value of readUntilIdle(stream, {
                idleMs: 2000,
                maxMs: 5000
            }))if ("Debugger.scriptParsed" === value.method) scripts.push(value.params);
            console.log(JSON.stringify(scripts.map(({ scriptId, url })=>({
                    scriptId,
                    url
                })), null, 2));
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = get_sources_ts_dispose_resources(env);
            if (result) await result;
        }
    });
}
const GLOBAL_SWITCH_KEYS = [
    'enable_devtool',
    'enable_logbox',
    'enable_debug_mode',
    'enable_dom_tree',
    'enable_quickjs_debug',
    'enable_quickjs_cache',
    'enable_v8',
    'enable_cdp_domain_dom',
    'enable_cdp_domain_css',
    'enable_cdp_domain_page',
    'enable_long_press_menu',
    'enable_highlight_touch',
    'enable_preview_screen_shot',
    'enable_pixel_copy',
    'enable_fsp_screenshot'
];
const GLOBAL_SWITCH_KEYS_HELP = GLOBAL_SWITCH_KEYS.join(' | ');
function parseKey(input) {
    if (GLOBAL_SWITCH_KEYS.includes(input)) return input;
    throw new Error(`Invalid --key value: ${input}. Use global-switch list to inspect supported keys.`);
}
function registerGlobalSwitchCommand(program, context) {
    const globalSwitch = program.command('global-switch').description('Manage DevTool global switches');
    globalSwitch.command('list').description('List all global switch states').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option('--fail-fast', 'Abort on first key-read failure').action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const switches = [];
        for (const key of GLOBAL_SWITCH_KEYS)try {
            const value = await connector.getGlobalSwitch(clientId, key);
            switches.push({
                key,
                value
            });
        } catch (error) {
            if (options.failFast) throw error;
            switches.push({
                key,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        console.log(JSON.stringify({
            switches
        }, null, 2));
    });
    globalSwitch.command('get').description('Get one global switch state').requiredOption('--key <key>', `Global switch key. Supported: ${GLOBAL_SWITCH_KEYS_HELP}`).option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const key = parseKey(options.key);
        const value = await connector.getGlobalSwitch(clientId, key);
        console.log(JSON.stringify({
            key,
            value
        }, null, 2));
    });
    globalSwitch.command('set').description('Set one global switch state').requiredOption('--key <key>', `Global switch key. Supported: ${GLOBAL_SWITCH_KEYS_HELP}`).requiredOption('--status <status>', 'Switch status: on/off').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const key = parseKey(options.key);
        const value = parseOnOff(options.status);
        await connector.setGlobalSwitch(clientId, key, value);
        console.log(JSON.stringify({
            key,
            value
        }, null, 2));
    });
}
const DEFAULT_DAEMON_PORT = 21783;
function registerInspectCommand(program, context) {
    program.command('inspect').description('Output the inspector URL for a client/session').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--port <port>', 'Daemon port', String(DEFAULT_DAEMON_PORT)).action(async (options)=>{
        const { clientId, sessionId } = await resolveClientAndSession(context, options);
        const port = parseInt(options.port, 10) || DEFAULT_DAEMON_PORT;
        const inspectorUrl = `http://127.0.0.1:${port}/devtool/connector/inspector?clientId=${encodeURIComponent(clientId)}&sessionId=${encodeURIComponent(sessionId)}`;
        console.log(inspectorUrl);
    });
}
const NO_CLIENTS_FOUND_MESSAGE = "No Lynx DevTool clients were found.\n\nTry these steps:\n1. Make sure the target device/simulator and app are running.\n2. If the app just launched, wait a moment and rerun `list-clients`.\n3. If this is unexpected, rerun with `DEBUG='devtool-mcp-server:connector*'` or try `--no-daemon`.\n\nSee `skills/lynx-devtool/references/troubleshooting/symptoms.md#list-clients-returns-` for more details.";
async function runListClientsCommand(connector, { print = console.log } = {}) {
    const clients = await connector.listClients();
    if (0 === clients.length) throw new Error(NO_CLIENTS_FOUND_MESSAGE);
    print(JSON.stringify(clients, null, 2));
}
function registerListClientsCommand(program, { transports }) {
    program.command('list-clients').description('List all available clients').action(async ()=>{
        const connector = new Connector(transports);
        await runListClientsCommand(connector);
    });
}
function registerListSessionsCommand(program, context) {
    program.command('list-sessions').description('List all available sessions').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const sessions = await connector.sendListSessionMessage(clientId);
        console.log(JSON.stringify(sessions, null, 2));
    });
}
function registerOpenCommand(program, context) {
    program.command('open').description('Open page').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).argument('<url>', 'The url of the page').action(async (url, options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const result = await connector.sendMessage(clientId, {
            event: 'Customized',
            data: {
                type: 'OpenCard',
                data: {
                    type: 'url',
                    url
                },
                sender: -1
            },
            from: -1
        }, {
            input: [],
            output: [
                new FilterTransformStream(isListSessionResponse)
            ]
        });
        console.log(JSON.stringify(result, null, 2));
    });
}
const DevNodeType = {
    Group: 0,
    Element: 1,
    ClassComponent: 2,
    FunctionComponent: 3,
    ForwardRef: 4,
    Memo: 5,
    Suspense: 6,
    Context: 7,
    Consumer: 8,
    Portal: 9
};
const MsgType = {
    ADD_ROOT: 1,
    ADD_VNODE: 2,
    REMOVE_VNODE: 3,
    UPDATE_VNODE_TIMINGS: 4,
    REORDER_CHILDREN: 5,
    RENDER_REASON: 6,
    COMMIT_STATS: 7,
    HOC_NODES: 8
};
function createRendererState() {
    return {
        tree: new Map(),
        roots: []
    };
}
function parseStringTable(slice) {
    const len = slice[0];
    const strings = [];
    if (len > 0) for(let i = 1; i < len; i++){
        const strLen = slice[i];
        let start = i + 1;
        const end = i + strLen + 1;
        let str = '';
        for(; start < end; start++){
            const code = slice[start];
            if ('number' == typeof code && code >= 0 && code <= 0x10ffff) str += String.fromCodePoint(code);
            else str += '?';
        }
        strings.push(str);
        i += strLen;
    }
    return strings;
}
function applyOperationV2(state, ops) {
    const { tree, roots } = state;
    let i = ops[1] + 1;
    const strings = parseStringTable(ops.slice(1, i + 1));
    for(i += 1; i < ops.length; i++)switch(ops[i]){
        case MsgType.ADD_ROOT:
            {
                const rootId = ops[i + 1];
                if (!roots.includes(rootId)) roots.push(rootId);
                i += 1;
                break;
            }
        case MsgType.ADD_VNODE:
            {
                const id = ops[i + 1];
                const type = ops[i + 2];
                const parentId = ops[i + 3];
                const owner = ops[i + 4];
                const nameId = ops[i + 5];
                const keyId = ops[i + 6];
                const startTime = ops[i + 7] / 1000;
                const endTime = ops[i + 8] / 1000;
                const parent = tree.get(parentId);
                if (parent) parent.children.push(id);
                tree.set(id, {
                    id,
                    type,
                    name: strings[nameId - 1] ?? '',
                    key: keyId > 0 ? strings[keyId - 1] ?? '' : '',
                    parent: parentId,
                    owner,
                    children: [],
                    startTime,
                    endTime
                });
                i += 8;
                break;
            }
        case MsgType.UPDATE_VNODE_TIMINGS:
            {
                const id = ops[i + 1];
                const node = tree.get(id);
                if (node) {
                    node.startTime = ops[i + 2] / 1000;
                    node.endTime = ops[i + 3] / 1000;
                }
                i += 3;
                break;
            }
        case MsgType.REMOVE_VNODE:
            {
                const unmounts = ops[i + 1];
                i += 2;
                const len = i + unmounts;
                for(; i < len; i++){
                    const nodeId = ops[i];
                    const node = tree.get(nodeId);
                    if (!node) continue;
                    const parent = tree.get(node.parent);
                    if (parent) {
                        const idx = parent.children.indexOf(nodeId);
                        if (idx > -1) parent.children.splice(idx, 1);
                    }
                    const stack = [
                        nodeId
                    ];
                    while(stack.length){
                        const cur = stack.pop();
                        const cnode = tree.get(cur);
                        if (!cnode) continue;
                        tree.delete(cur);
                        stack.push(...cnode.children);
                    }
                    const rIdx = roots.indexOf(nodeId);
                    if (rIdx > -1) roots.splice(rIdx, 1);
                }
                if (len > 0) i--;
                break;
            }
        case MsgType.REORDER_CHILDREN:
            {
                const parentId = ops[i + 1];
                const count = ops[i + 2];
                const node = tree.get(parentId);
                if (node) node.children = ops.slice(i + 3, i + 3 + count);
                i = i + 2 + count;
                break;
            }
        case MsgType.RENDER_REASON:
            {
                const count = ops[i + 3];
                i = i + 3 + count;
                break;
            }
        case MsgType.COMMIT_STATS:
            throw new Error('operation_v2 commit-stats not implemented; enable stats parsing if needed');
        case MsgType.HOC_NODES:
            {
                const count = ops[i + 2];
                i = i + 2 + count;
                break;
            }
        default:
            throw new Error(`Unknown operation_v2 op ${ops[i]} at index ${i}`);
    }
}
function applyRootOrder(state, rootOrder) {
    state.roots = [
        ...rootOrder
    ];
}
function typeTag(type) {
    switch(type){
        case DevNodeType.FunctionComponent:
            return 'fn';
        case DevNodeType.ClassComponent:
            return 'cls';
        case DevNodeType.ForwardRef:
            return 'fRef';
        case DevNodeType.Memo:
            return 'memo';
        case DevNodeType.Suspense:
            return 'susp';
        case DevNodeType.Context:
            return 'ctx';
        case DevNodeType.Consumer:
            return 'cons';
        case DevNodeType.Portal:
            return 'portal';
        case DevNodeType.Element:
            return 'host';
        case DevNodeType.Group:
            return 'group';
        default:
            return '?';
    }
}
const PIPE = '│  ';
const TEE = '├─ ';
const ELBOW = '└─ ';
const SPACE = '   ';
const SHELL_NAMES = new Set([
    'Fragment',
    'Root',
    'Anonymous'
]);
function isShell(node) {
    return SHELL_NAMES.has(node.name);
}
function visibleChildren(ctx, node) {
    const out = [];
    for (const cid of node.children){
        const child = ctx.state.tree.get(cid);
        if (child) if (ctx.hideShells && isShell(child)) out.push(...visibleChildren(ctx, child));
        else out.push(child);
    }
    return out;
}
function formatRef(ctx, node) {
    const label = ctx.labelOf.get(node.id) ?? '@c?';
    let out = `${label} [${typeTag(node.type)}] ${node.name}`;
    if (node.key) out += ` key=${node.key}`;
    return out;
}
function walk(ctx, node, prefix, isLast, isRoot, depth) {
    const connector = isRoot ? '' : isLast ? ELBOW : TEE;
    ctx.lines.push(`${prefix}${connector}${formatRef(ctx, node)}`);
    if (depth >= ctx.maxDepth) return;
    const children = visibleChildren(ctx, node);
    const childPrefix = isRoot ? '' : prefix + (isLast ? SPACE : PIPE);
    children.forEach((child, idx)=>{
        walk(ctx, child, childPrefix, idx === children.length - 1, false, depth + 1);
    });
}
function formatTree(state, options = {}) {
    const ctx = {
        state,
        labels: [],
        labelOf: new Map(),
        maxDepth: options.maxDepth ?? 1 / 0,
        lines: [],
        hideShells: options.hideShells ?? true
    };
    const visibleRoots = [];
    for (const rootId of state.roots){
        const root = state.tree.get(rootId);
        if (root) if (ctx.hideShells && isShell(root)) visibleRoots.push(...visibleChildren(ctx, root));
        else visibleRoots.push(root);
    }
    function assign(node, depth) {
        ctx.labels.push(node.id);
        ctx.labelOf.set(node.id, `@c${ctx.labels.length}`);
        if (depth >= ctx.maxDepth) return;
        for (const c of visibleChildren(ctx, node))assign(c, depth + 1);
    }
    for (const r of visibleRoots)assign(r, 1);
    visibleRoots.forEach((root, idx)=>{
        walk(ctx, root, '', idx === visibleRoots.length - 1, true, 1);
    });
    return {
        text: ctx.lines.join('\n'),
        labels: ctx.labels
    };
}
function transport_ts_add_disposable_resource(env, value, async) {
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
function transport_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (transport_ts_dispose_resources = function(env) {
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
const debug = node_createDebug('devtool-mcp-server:reactlynx');
const PREACT_EVENT = 'PreactDevtools';
const SOURCE_PAGE_HOOK = 'preact-page-hook';
const SOURCE_DEVTOOLS_TO_CLIENT = 'preact-devtools-to-client';
const DEFAULT_IDLE_MS = 700;
const DEFAULT_MAX_MS = 5000;
function buildOutboundFrame(type, data) {
    return {
        method: 'Lynx.sendVMEvent',
        params: {
            vmType: 'JSContext',
            event: PREACT_EVENT,
            data: JSON.stringify({
                source: SOURCE_DEVTOOLS_TO_CLIENT,
                type,
                data: data ?? null
            })
        }
    };
}
async function runReactLynxSession(options) {
    const env = {
        stack: [],
        error: void 0,
        hasError: false
    };
    try {
        const { connector, clientId, sessionId, outbound, sendInit = true, onEnvelope = ()=>'continue', idleMs = DEFAULT_IDLE_MS, maxMs = DEFAULT_MAX_MS, signal } = options;
        let stopRequested = false;
        let cancelInput = ()=>{};
        const input = new web_ReadableStream({
            start (controller) {
                if (sendInit) controller.enqueue(buildOutboundFrame('init'));
                for (const frame of outbound)controller.enqueue(frame);
                cancelInput = ()=>{
                    try {
                        controller.close();
                    } catch  {}
                };
            }
        });
        const stream = transport_ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, sessionId, input, signal ? {
            signal
        } : void 0), true);
        const state = createRendererState();
        let framesSeen = 0;
        let operationFrames = 0;
        let rootOrderFrames = 0;
        const envelopeTypes = new Set();
        try {
            for await (const value of readUntilIdle(stream, {
                idleMs,
                maxMs
            })){
                if ('object' != typeof value || null === value) continue;
                const method = value.method;
                if ('Lynx.onVMEvent' !== method) continue;
                const params = value.params ?? {};
                if (params.event !== PREACT_EVENT) continue;
                let envelope;
                try {
                    envelope = JSON.parse(params.data ?? 'null');
                } catch  {
                    continue;
                }
                if (envelope.source === SOURCE_PAGE_HOOK) {
                    framesSeen += 1;
                    envelopeTypes.add(envelope.type);
                    debug('frame %d: type=%s dataSize=%s', framesSeen, envelope.type, Array.isArray(envelope.data) ? envelope.data.length : typeof envelope.data);
                    switch(envelope.type){
                        case 'operation_v2':
                            if (Array.isArray(envelope.data)) {
                                operationFrames += 1;
                                applyOperationV2(state, envelope.data);
                            }
                            break;
                        case 'root-order':
                            if (Array.isArray(envelope.data)) {
                                rootOrderFrames += 1;
                                applyRootOrder(state, envelope.data);
                            }
                            break;
                    }
                    if ('stop' === onEnvelope(envelope)) {
                        stopRequested = true;
                        break;
                    }
                }
            }
        } finally{
            cancelInput();
        }
        debug('session done: stop=%s frames=%d op=%d root=%d types=%o', stopRequested, framesSeen, operationFrames, rootOrderFrames, [
            ...envelopeTypes
        ]);
        return {
            state,
            framesSeen,
            operationFrames,
            rootOrderFrames,
            envelopeTypes
        };
    } catch (e) {
        env.error = e;
        env.hasError = true;
    } finally{
        const result = transport_ts_dispose_resources(env);
        if (result) await result;
    }
}
function emptyTreeDiagnostic(result) {
    if (0 === result.framesSeen) return "saw 0 frames -- the App is silent on the PreactDevtools channel. Most likely `@lynx-js/preact-devtools` is not installed, the bundle is a production build (`setupReactLynx()` is stripped from `react-lynx/index.ts:3`), or `setupReactLynx()` has not run yet. Look for `[PREACT DEVTOOLS] Devtools initialized successfully` in the device console.";
    if (0 === result.operationFrames) return `saw ${result.framesSeen} frame(s) but no \`operation_v2\` -- \`@lynx-js/preact-devtools\` is loaded but does not honor \`refresh\`. Upgrade to a build that includes the PR #2 (\`document.body\`) and PR #5 (\`preactDevtoolsCtx.Node\`) fixes from \`lynx-family/preact-devtools\`.`;
    return `saw ${result.framesSeen} frame(s) including ${result.operationFrames} \`operation_v2\` but the resulting tree is empty (every node was unmounted). This is unusual -- rerun with \`DEBUG=devtool-mcp-server:reactlynx\` to inspect each frame's payload.`;
}
function findComponents(state, matcher, options) {
    const formatted = formatTree(state, {
        hideShells: options.hideShells
    });
    const idToLabel = new Map();
    formatted.labels.forEach((id, idx)=>{
        idToLabel.set(id, `@c${idx + 1}`);
    });
    const matches = [];
    for (const id of formatted.labels){
        const node = state.tree.get(id);
        if (!node) continue;
        if (!matcher(node.name)) continue;
        const ancestors = [];
        let cursorId = node.parent;
        while(void 0 !== cursorId && -1 !== cursorId){
            const cursor = state.tree.get(cursorId);
            if (!cursor) break;
            const label = idToLabel.get(cursorId);
            if (label) ancestors.unshift({
                label,
                name: cursor.name
            });
            cursorId = cursor.parent;
        }
        matches.push({
            label: idToLabel.get(id) ?? '@c?',
            id: node.id,
            name: node.name,
            type: node.type,
            key: node.key,
            ancestors
        });
        if (matches.length >= options.limit) break;
    }
    return matches;
}
function buildSubstringMatcher(pattern) {
    const needle = pattern.toLowerCase();
    return (name)=>name.toLowerCase().includes(needle);
}
function buildRegexMatcher(pattern) {
    let re;
    try {
        re = new RegExp(pattern);
    } catch (err) {
        throw new Error(`--regex pattern is invalid: ${err instanceof Error ? err.message : String(err)}`, {
            cause: err
        });
    }
    return (name)=>re.test(name);
}
function registerFindCommand(reactlynx, context) {
    reactlynx.command('find <pattern>').description("Find components by display name. Default match is case-insensitive substring; use --regex for a JavaScript regular expression.").option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--regex', 'Treat <pattern> as a JavaScript regular expression', false).option('--show-shells', 'Include the synthetic Fragment/Root/Anonymous wrappers ReactLynx inserts', false).option('--limit <n>', 'Maximum number of matches to print (default: 50)', (v)=>{
        const n = Number.parseInt(v, 10);
        if (!Number.isFinite(n) || n < 1) throw new Error(`--limit must be a positive integer (got ${v})`);
        return n;
    }, 50).option('--json', 'Emit a JSON array `[{ label, id, name, type, key, ancestors: [{label, name}] }]`', false).action(async (pattern, options)=>{
        const matcher = options.regex ? buildRegexMatcher(pattern) : buildSubstringMatcher(pattern);
        const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
        const result = await runReactLynxSession({
            connector,
            clientId,
            sessionId: Number(sessionId),
            outbound: [
                buildOutboundFrame('refresh')
            ]
        });
        if (0 === result.state.tree.size) {
            process.stderr.write(`[reactlynx find] ${emptyTreeDiagnostic(result)}\n`);
            process.exitCode = 1;
            return;
        }
        const matches = findComponents(result.state, matcher, {
            hideShells: !options.showShells,
            limit: options.limit ?? 50
        });
        if (0 === matches.length) {
            process.stderr.write(`[reactlynx find] no components match ${options.regex ? 'regex' : 'substring'} ${JSON.stringify(pattern)} (searched ${result.state.tree.size} components${options.showShells ? '' : ', shells hidden'})\n`);
            process.exitCode = 1;
            return;
        }
        if (options.json) return void process.stdout.write(JSON.stringify(matches, null, 2) + '\n');
        process.stdout.write(formatMatches(matches) + '\n');
    });
}
function formatMatches(matches) {
    const lines = [];
    for (const match of matches){
        let header = `${match.label} [${typeTag(match.type)}] ${match.name}`;
        if (match.key) header += ` key=${match.key}`;
        lines.push(header);
        if (match.ancestors.length > 0) lines.push('  in ' + match.ancestors.map((a)=>`${a.label} ${a.name}`).join(' > '));
    }
    return lines.join('\n');
}
function parseComponentRef(ref) {
    const labelMatch = /^@c(\d+)$/.exec(ref);
    if (labelMatch) {
        const index = Number.parseInt(labelMatch[1], 10);
        if (!Number.isFinite(index) || index < 1) throw new Error(`Invalid label ${ref}; expected @c1, @c2, ...`);
        return {
            kind: 'label',
            index
        };
    }
    const numeric = Number.parseInt(ref, 10);
    if (!Number.isFinite(numeric) || String(numeric) !== ref.trim()) throw new Error(`Invalid <ref> ${JSON.stringify(ref)}; expected @cN or a numeric id.`);
    return {
        kind: 'id',
        id: numeric
    };
}
function formatInspectResult(data, ref) {
    const lines = [];
    const headerKey = data.key ? ` key=${data.key}` : '';
    lines.push(`${ref} (id=${data.id}) [${typeTag(data.type)}] ${data.name}${headerKey}`);
    if (data.__source) lines.push(`  source: ${data.__source.fileName}:${data.__source.lineNumber}:${data.__source.columnNumber}`);
    if (void 0 !== data.suspended && data.suspended) lines.push('  suspended: true');
    appendSection(lines, 'props', data.props);
    appendSection(lines, 'state', data.state);
    appendSection(lines, 'hooks', data.hooks);
    appendSection(lines, 'context', data.context);
    appendSection(lines, 'signals', data.signals);
    return lines.join('\n');
}
function appendSection(lines, label, value) {
    if (null == value) return;
    if (Array.isArray(value) && 0 === value.length) return;
    if ('object' == typeof value && !Array.isArray(value) && 0 === Object.keys(value).length) return;
    lines.push(`  ${label}:`);
    const rendered = JSON.stringify(value, null, 2).split('\n').map((l)=>`    ${l}`).join('\n');
    lines.push(rendered);
}
function registerComponentCommand(reactlynx, context) {
    reactlynx.command('component <ref>').description("Inspect a single component (props/state/hooks/context). <ref> is either `@cN` (resolved against `reactlynx tree`) or a numeric id.").option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--show-shells', "When resolving `@cN`, count synthetic Fragment/Root/Anonymous wrappers the same way `reactlynx tree --show-shells` does. Has no effect on numeric ids.", false).option('--json', 'Print the raw `InspectData` payload as JSON', false).action(async (ref, options)=>{
        const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
        let targetId;
        const parsed = parseComponentRef(ref);
        if ('label' === parsed.kind) {
            const snapshot = await runReactLynxSession({
                connector,
                clientId,
                sessionId: Number(sessionId),
                outbound: [
                    buildOutboundFrame('refresh')
                ]
            });
            if (0 === snapshot.state.tree.size) {
                process.stderr.write(`[reactlynx component] ${emptyTreeDiagnostic(snapshot)}\n`);
                process.exitCode = 1;
                return;
            }
            const labels = formatTree(snapshot.state, {
                hideShells: !options.showShells
            }).labels;
            const resolved = labels[parsed.index - 1];
            if (void 0 === resolved) {
                process.stderr.write(`[reactlynx component] label ${ref} does not exist; tree has ${labels.length} labelled component(s).\n`);
                process.exitCode = 1;
                return;
            }
            targetId = resolved;
        } else targetId = parsed.id;
        let inspectResult;
        const inspectSession = await runReactLynxSession({
            connector,
            clientId,
            sessionId: Number(sessionId),
            outbound: [
                buildOutboundFrame('inspect', targetId)
            ],
            idleMs: 1000,
            maxMs: 5000,
            onEnvelope: (env)=>{
                if ('inspect-result' === env.type && env.data && 'object' == typeof env.data) {
                    inspectResult = env.data;
                    return 'stop';
                }
                return 'continue';
            }
        });
        if (!inspectResult) {
            const types = [
                ...inspectSession.envelopeTypes
            ].sort().join(',') || '(none)';
            process.stderr.write(`[reactlynx component] no \`inspect-result\` for id ${targetId} after ${inspectSession.framesSeen} frame(s) (types=${types}). Common causes:\n  - the id is stale (the App has unmounted that component since the snapshot was taken)\n  - the App is running an old @lynx-js/preact-devtools that doesn't honor \`inspect\`\n  - the targeted thread does not have a Preact renderer (e.g. you picked a non-ReactLynx session).\nRerun with DEBUG=devtool-mcp-server:reactlynx to see every frame.\n`);
            process.exitCode = 1;
            return;
        }
        if (options.json) return void process.stdout.write(JSON.stringify(inspectResult, null, 2) + '\n');
        process.stdout.write(formatInspectResult(inspectResult, ref) + '\n');
    });
}
function registerTreeCommand(reactlynx, context) {
    reactlynx.command('tree').description('Print the ReactLynx component tree as an ASCII diagram with @cN labels.').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--depth <n>', 'Maximum tree depth to print (default: unbounded)', (v)=>{
        const n = Number.parseInt(v, 10);
        if (!Number.isFinite(n) || n < 1) throw new Error(`--depth must be a positive integer (got ${v})`);
        return n;
    }).option('--show-shells', 'Include the synthetic Fragment/Root/Anonymous wrappers ReactLynx inserts', false).option('--json', 'Emit a JSON object { labels, roots, nodes } instead of ASCII', false).action(async (options)=>{
        const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
        const result = await runReactLynxSession({
            connector,
            clientId,
            sessionId: Number(sessionId),
            outbound: [
                buildOutboundFrame('refresh')
            ]
        });
        if (0 === result.state.tree.size) {
            process.stderr.write(`[reactlynx tree] ${emptyTreeDiagnostic(result)}\n`);
            process.exitCode = 1;
            return;
        }
        const formatted = formatTree(result.state, {
            maxDepth: options.depth,
            hideShells: !options.showShells
        });
        if (options.json) {
            const nodes = Array.from(result.state.tree.values()).map((n)=>({
                    id: n.id,
                    type: n.type,
                    name: n.name,
                    key: n.key,
                    parent: n.parent,
                    children: n.children
                }));
            process.stdout.write(JSON.stringify({
                labels: formatted.labels,
                roots: result.state.roots,
                nodes
            }, null, 2) + '\n');
        } else process.stdout.write(formatted.text + '\n');
    });
}
function parseUpdateValue(input, options) {
    if (options.raw) return input;
    try {
        return JSON.parse(input);
    } catch (err) {
        throw new Error(`<value> must be valid JSON (e.g. \`"hello"\`, \`42\`, \`true\`, \`null\`, \`{"a":1}\`); pass --raw to send the input verbatim as a string. Underlying error: ${err instanceof Error ? err.message : String(err)}`, {
            cause: err
        });
    }
}
function buildUpdatePath(userPath) {
    if (0 === userPath.length) throw new Error('<path> must not be empty. Use dot notation, e.g. `count`, `user.name`, `items.0.title`.');
    for (const prefix of [
        'root.',
        'props.',
        'state.',
        'context.'
    ])if (userPath.startsWith(prefix)) throw new Error(`<path> ${JSON.stringify(userPath)} must not start with \`${prefix}\`. The CLI prepends \`root.\` automatically; pass paths starting at the field name, e.g. \`count\`.`);
    for (const segment of userPath.split('.'))if (0 === segment.length) throw new Error(`<path> ${JSON.stringify(userPath)} contains an empty segment. Dot notation must look like \`a.b.c\`, not \`a..b\` or \`.a\`.`);
    return `root.${userPath}`;
}
function registerUpdateCommands(reactlynx, context) {
    registerOneUpdate(reactlynx, context, {
        name: 'update-prop',
        description: 'Set a prop on a single ReactLynx component (forceUpdate is called for you)',
        kind: 'update-prop'
    });
    registerOneUpdate(reactlynx, context, {
        name: 'update-state',
        description: 'Set a state field on a single class component (forceUpdate is called for you)',
        kind: 'update-state'
    });
    registerOneUpdate(reactlynx, context, {
        name: 'update-context',
        description: 'Set a context value on a single component. Best-effort; upstream may make this read-only in the future.',
        kind: 'update-context'
    });
}
function registerOneUpdate(reactlynx, context, spec) {
    reactlynx.command(`${spec.name} <ref> <path> <value>`).description(spec.description).option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--show-shells', "When resolving `@cN`, count synthetic Fragment/Root/Anonymous wrappers the same way `reactlynx tree --show-shells` does. No effect for numeric ids.", false).option('--raw', 'Send <value> verbatim as a string instead of parsing it as JSON', false).option('--json', 'Print the post-update `InspectData` as JSON instead of an ASCII summary', false).action(async (ref, userPath, rawValue, options)=>{
        const path = buildUpdatePath(userPath);
        const value = parseUpdateValue(rawValue, {
            raw: options.raw ?? false
        });
        const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
        let targetId;
        const parsed = parseComponentRef(ref);
        if ('label' === parsed.kind) {
            const snapshot = await runReactLynxSession({
                connector,
                clientId,
                sessionId: Number(sessionId),
                outbound: [
                    buildOutboundFrame('refresh')
                ]
            });
            if (0 === snapshot.state.tree.size) {
                process.stderr.write(`[reactlynx ${spec.name}] ${emptyTreeDiagnostic(snapshot)}\n`);
                process.exitCode = 1;
                return;
            }
            const labels = formatTree(snapshot.state, {
                hideShells: !options.showShells
            }).labels;
            const resolved = labels[parsed.index - 1];
            if (void 0 === resolved) {
                process.stderr.write(`[reactlynx ${spec.name}] label ${ref} does not exist; tree has ${labels.length} labelled component(s).\n`);
                process.exitCode = 1;
                return;
            }
            targetId = resolved;
        } else targetId = parsed.id;
        let confirmation;
        const session = await runReactLynxSession({
            connector,
            clientId,
            sessionId: Number(sessionId),
            outbound: [
                buildOutboundFrame(spec.kind, {
                    id: targetId,
                    path,
                    value
                })
            ],
            idleMs: 1000,
            maxMs: 5000,
            onEnvelope: (env)=>{
                if ('inspect-result' === env.type && env.data && 'object' == typeof env.data && env.data.id === targetId) {
                    confirmation = env.data;
                    return 'stop';
                }
                return 'continue';
            }
        });
        if (!confirmation) {
            const types = [
                ...session.envelopeTypes
            ].sort().join(',') || '(none)';
            process.stderr.write(`[reactlynx ${spec.name}] no confirmation \`inspect-result\` for id ${targetId} after ${session.framesSeen} frame(s) (types=${types}). Common causes:\n  - the path is wrong (the App's setInCopy walks objects/arrays; non-existent intermediate keys are created, but typos still produce a no-op forceUpdate)\n  - the id is stale (component unmounted between snapshot and update)\n  - the App is running an old @lynx-js/preact-devtools that doesn't honor \`${spec.kind}\`\n  - for update-state/update-context: the target is a function component (those have neither)\nRerun with DEBUG=devtool-mcp-server:reactlynx to see every frame.\n`);
            process.exitCode = 1;
            return;
        }
        if (options.json) return void process.stdout.write(JSON.stringify(confirmation, null, 2) + '\n');
        process.stdout.write(formatInspectResult(confirmation, ref) + '\n');
    });
}
function registerReactLynxCommand(program, context) {
    const reactlynx = program.command('reactlynx').description('Inspect a running ReactLynx app via @lynx-js/preact-devtools');
    registerTreeCommand(reactlynx, context);
    registerComponentCommand(reactlynx, context);
    registerFindCommand(reactlynx, context);
    registerUpdateCommands(reactlynx, context);
}
const external_node_path_ = __webpack_require__("node:path");
function analyzeRecordingBuffer(filePath, buffer) {
    const fileSizeBytes = buffer.byteLength;
    let recording;
    let parseFailed = false;
    try {
        const raw = buffer.toString('utf-8').trim();
        if (raw.startsWith('{') || raw.startsWith('[')) recording = JSON.parse(raw);
        else {
            const decoded = Buffer.from(raw, 'base64');
            const inflated = node_zlib.inflateSync(decoded);
            recording = JSON.parse(inflated.toString('utf-8'));
        }
    } catch  {
        parseFailed = true;
        recording = {};
    }
    if (parseFailed) return {
        file: filePath,
        fileSizeBytes,
        healthy: false,
        actions: 0,
        hasTemplate: false,
        functionDistribution: {},
        verdict: 'Cannot parse — file is not a valid TestBench recording'
    };
    const actions = Array.isArray(recording) ? recording : recording['Action List'] ?? [];
    const functionDistribution = {};
    for (const action of actions){
        const fn = action['Function Name'];
        functionDistribution[fn] = (functionDistribution[fn] ?? 0) + 1;
    }
    const hasTemplate = actions.some((a)=>'loadTemplate' === a['Function Name']);
    const hasTouchEvents = actions.some((a)=>'SendTouchEvent' === a['Function Name'] || 'sendEventDarwin' === a['Function Name']);
    let healthy;
    let verdict;
    if (0 === actions.length) {
        healthy = false;
        verdict = 'Empty recording — no actions captured';
    } else if (hasTemplate) {
        healthy = true;
        verdict = 'Valid recording — includes template load and interaction data';
    } else if (hasTouchEvents) {
        healthy = true;
        verdict = 'Recording captures touch events but no template load — still useful for analyzing interactions, but cannot be replayed in Lynx Explorer';
    } else {
        healthy = true;
        verdict = 'Recording has actions but no template load — useful for inspecting JSB calls or data updates, but cannot be replayed';
    }
    return {
        file: filePath,
        fileSizeBytes,
        healthy,
        actions: actions.length,
        hasTemplate,
        functionDistribution,
        verdict
    };
}
function recordingOutputPath(basePath, sessionId, index) {
    const suffix = sessionId > 0 ? `-session${sessionId}` : index > 0 ? `-${index}` : '';
    if (!suffix) return basePath;
    const parsed = external_node_path_["default"].parse(basePath);
    return external_node_path_["default"].join(parsed.dir, `${parsed.name}${suffix}${parsed.ext || '.json'}`);
}
function recorder_end_ts_add_disposable_resource(env, value, async) {
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
function recorder_end_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (recorder_end_ts_dispose_resources = function(env) {
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
const IO_READ_CHUNK_SIZE = 1048576;
const RECORDING_END_TIMEOUT_MS = 60000;
function registerEndCommand(parent, context) {
    parent.command('end').description('Stop TestBench recording and save the replay file').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option('-o, --output <path>', 'Output file or directory path (defaults to ~/.lynx-devtool/files/lynxrecorder/recording-<clientId>-<timestamp>.json)').action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const { output } = options;
        const result = await runRecordingEnd(connector, clientId, output);
        console.log(JSON.stringify({
            success: true,
            message: 'Recording ended successfully.',
            ...result
        }));
    });
}
async function runRecordingEnd(connector, clientId, output) {
    const recordingComplete = await readRecordingCompleteEvent(connector, clientId);
    const savedFiles = [];
    const diagnostics = [];
    const baseOutputPath = await resolveRecordingBaseOutputPath(output, clientId);
    const streams = recordingComplete['stream'];
    const sessionIDs = recordingComplete['sessionIDs'];
    if (!Array.isArray(streams) || 0 === streams.length) throw new Error("Recording.recordingComplete did not include any streams. If recording was never started, run `recorder start` first.");
    for (const [index, streamHandle] of streams.entries()){
        const sessionId = sessionIDs?.[index];
        if (void 0 === sessionId) throw new Error("Recording.recordingComplete returned mismatched `stream` and `sessionIDs` lengths. Reconnect and retry `recorder end`.");
        if (-1 === sessionId) continue;
        const signal = AbortSignal.timeout(RECORDING_END_TIMEOUT_MS);
        const data = await readStreamFully(connector, clientId, streamHandle, signal);
        const filePath = recordingOutputPath(baseOutputPath, sessionId, savedFiles.length);
        await promises.mkdir(external_node_path_["default"].dirname(filePath), {
            recursive: true
        });
        await promises.writeFile(filePath, data);
        savedFiles.push(filePath);
        diagnostics.push(analyzeRecordingBuffer(filePath, data));
    }
    if (0 === savedFiles.length) throw new Error(buildNoPageRecordingMessage(clientId, recordingComplete, streams, sessionIDs));
    const unhealthy = diagnostics.filter((d)=>!d.healthy);
    if (unhealthy.length > 0) console.warn('Recording saved, but the following file(s) may be unusable:\n' + unhealthy.map((d)=>`  - ${d.file}: ${d.verdict}`).join('\n'));
    const noTemplate = diagnostics.filter((d)=>d.healthy && !d.hasTemplate);
    if (noTemplate.length > 0) console.warn("Note: the following file(s) have no `loadTemplate` action and cannot be replayed,\nbut may still be useful for inspecting recorded behavior:\n" + noTemplate.map((d)=>`  - ${d.file}: ${d.verdict}`).join('\n'));
    return {
        savedFiles,
        recordingComplete,
        diagnostics
    };
}
function buildNoPageRecordingMessage(clientId, recordingComplete, streams, sessionIDs) {
    const filenames = recordingComplete['filenames'];
    const nativeFiles = Array.isArray(filenames) && filenames.length > 0 ? ` Native filenames: ${JSON.stringify(filenames)}.` : '';
    return [
        'Recording ended, but no page recording was produced.',
        `Native returned sessionIDs=${JSON.stringify(sessionIDs ?? [])}, streams=${streams.length}.${nativeFiles}`,
        'This usually means no Lynx page session was opened or reloaded after `recorder start`.',
        'To produce a replayable file:',
        `1. Run \`list-sessions --client ${clientId}\` and confirm there is a Lynx session.`,
        '2. After `recorder start`, open or reload the target page.',
        `   Example: \`cdp --client ${clientId} --session <sessionId> -m Page.reload '{"ignoreCache":true}'\``,
        '3. Interact with the page, then run `recorder end` again.'
    ].join('\n');
}
async function readRecordingCompleteEvent(connector, clientId) {
    const timeoutSignal = AbortSignal.timeout(RECORDING_END_TIMEOUT_MS);
    const isTimeoutError = (err)=>isAbortError(err) || err instanceof Error && 'TimeoutError' === err.name;
    try {
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const stream = recorder_end_ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, -1, web_ReadableStream.from([
                {
                    method: 'Recording.end',
                    params: {}
                }
            ]), {
                signal: timeoutSignal
            }), true);
            for await (const value of stream){
                if ('Recording.recordingComplete' === value.method) return value.params ?? {};
                if (value.error) throw new Error(`Recording.end failed: ${value.error.message}. If recording was never started, run \`recorder start\` first.`);
            }
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = recorder_end_ts_dispose_resources(env);
            if (result) await result;
        }
    } catch (err) {
        if (!isTimeoutError(err)) throw err;
        throw new Error("Recording.end timed out before receiving Recording.recordingComplete. Make sure recording was started with `recorder start` and the device is still connected.", {
            cause: err
        });
    }
    throw new Error("Recording.end stream closed before Recording.recordingComplete was received. Make sure recording was started with `recorder start` and the device is still connected.");
}
async function readStreamFully(connector, clientId, handle, signal) {
    const chunks = [];
    try {
        while(true){
            const chunk = await abortable(connector.sendCDPMessage(clientId, -1, 'IO.read', {
                handle,
                size: IO_READ_CHUNK_SIZE
            }), signal, `IO.read timed out reading recording stream handle ${handle}. The device may have stalled; reconnect and retry \`recorder end\`.`);
            if (chunk.data) chunks.push(Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf-8'));
            if (chunk.eof) break;
        }
        return Buffer.concat(chunks);
    } finally{
        await abortable(connector.sendCDPMessage(clientId, -1, 'IO.close', {
            handle
        }), AbortSignal.timeout(5000), `IO.close timed out closing recording stream handle ${handle}. Proceeding with local cleanup.`).catch(()=>{});
    }
}
function abortable(promise, signal, message) {
    if (signal.aborted) return Promise.reject(new Error(message));
    return new Promise((resolve, reject)=>{
        const onAbort = ()=>reject(new Error(message));
        signal.addEventListener('abort', onAbort, {
            once: true
        });
        promise.then((v)=>{
            signal.removeEventListener('abort', onAbort);
            resolve(v);
        }, (e)=>{
            signal.removeEventListener('abort', onAbort);
            reject(e);
        });
    });
}
async function resolveRecordingBaseOutputPath(output, clientId) {
    const defaultFileName = `recording-${clientId.replace(/[<>:"/\\|?*()]/g, '_')}-${Date.now()}.json`;
    if (!output) return external_node_path_["default"].resolve(node_os.homedir(), '.lynx-devtool', 'files', 'lynxrecorder', defaultFileName);
    const resolvedOutput = external_node_path_["default"].resolve(output);
    const outputLooksLikeDirectory = output.endsWith(external_node_path_["default"].sep) || output.endsWith('/') || output.endsWith('\\');
    const outputIsDirectory = outputLooksLikeDirectory || await promises.stat(resolvedOutput).then((stats)=>stats.isDirectory()).catch(()=>false);
    if (outputIsDirectory) {
        await promises.mkdir(resolvedOutput, {
            recursive: true
        });
        return external_node_path_["default"].join(resolvedOutput, defaultFileName);
    }
    return resolvedOutput;
}
const DEBUG_MODE_KEY = 'enable_debug_mode';
const DEBUG_MODE_RESTART_MESSAGE = '`enable_debug_mode` has been enabled. Restart the app and run `recorder start` again.';
function registerStartCommand(parent, context) {
    parent.command('start').description('Start TestBench recording').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).action(async (options)=>{
        const { connector, clientId } = await resolveClient(context, options);
        const result = await runRecordingStart(connector, clientId);
        console.log(JSON.stringify({
            success: result.started,
            ...result
        }));
    });
}
async function runRecordingStart(connector, clientId) {
    const debugModeEnabled = await connector.getGlobalSwitch(clientId, DEBUG_MODE_KEY);
    if (!debugModeEnabled) {
        await connector.setGlobalSwitch(clientId, DEBUG_MODE_KEY, true);
        return {
            started: false,
            restartRequired: true,
            message: DEBUG_MODE_RESTART_MESSAGE
        };
    }
    try {
        await connector.sendCDPMessage(clientId, -1, 'Recording.start', {});
    } catch (err) {
        if (!isRecordingStartNotImplementedError(err)) throw err;
        throw new Error("Recording.start is not implemented even after `enable_debug_mode` is enabled. The app or engine may not include `ENABLE_TESTBENCH_RECORDER`, or it may not be a dev/recorder build.", {
            cause: err
        });
    }
    return {
        started: true,
        restartRequired: false,
        message: 'Recording started successfully. Open or reload a Lynx page before `recorder end`.'
    };
}
function isRecordingStartNotImplementedError(err) {
    return err instanceof Error && err.message.includes('Not implemented') && err.message.includes('Recording.start');
}
function take_heap_snapshot_ts_add_disposable_resource(env, value, async) {
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
function take_heap_snapshot_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (take_heap_snapshot_ts_dispose_resources = function(env) {
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
function registerTakeHeapSnapshotCommand(program, context) {
    program.command('take-heap-snapshot').description('Take a heap snapshot and save it to a .heapsnapshot file').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--thread <thread>', 'VM thread to target: background or main', 'background').option('-o, --output <path>', 'Output file path (default: <tmpdir>/heap-<thread>-<timestamp>.heapsnapshot)').action(async (options)=>{
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const { output, thread = 'background' } = options;
            if ('background' !== thread && 'main' !== thread) throw new Error(`Invalid thread: ${thread}. Expected 'background' or 'main'.`);
            const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
            const expectedSessionId = 'main' === thread ? 'Main' : void 0;
            const extraParams = expectedSessionId ? {
                sessionId: expectedSessionId
            } : {};
            const timeoutSignal = AbortSignal.timeout(60000);
            const requestId = randomInt(10000, 50000);
            const stream = take_heap_snapshot_ts_add_disposable_resource(env, await connector.sendStream(clientId, web_ReadableStream.from([
                {
                    event: 'Customized',
                    data: {
                        type: 'CDP',
                        data: {
                            session_id: Number(sessionId),
                            message: {
                                id: requestId - 1,
                                method: 'HeapProfiler.enable',
                                params: {},
                                ...extraParams
                            }
                        }
                    }
                },
                {
                    event: 'Customized',
                    data: {
                        type: 'CDP',
                        data: {
                            session_id: Number(sessionId),
                            message: {
                                id: requestId,
                                method: 'HeapProfiler.takeHeapSnapshot',
                                params: {
                                    reportProgress: true,
                                    treatGlobalObjectsAsRoots: true,
                                    captureNumericValue: false
                                },
                                ...extraParams
                            }
                        }
                    }
                }
            ]), {
                signal: timeoutSignal,
                pipeline: {
                    input: [],
                    output: [
                        new CDPResponseTransformStream()
                    ]
                }
            }), true);
            const chunks = [];
            let didReceiveSnapshotResponse = false;
            const fileName = output ?? external_node_path_["default"].join(tmpdir(), `heap-${thread}-${Date.now()}.heapsnapshot`);
            for await (const value of readUntilIdle(stream, {
                idleMs: 15000,
                maxMs: 60000
            })){
                const { method, params: eventParams, id, sessionId: responseSessionId } = value;
                if ('HeapProfiler.addHeapSnapshotChunk' === method) {
                    if (responseSessionId !== expectedSessionId) continue;
                    const chunk = eventParams?.chunk;
                    if (!chunk) continue;
                    chunks.push(chunk);
                    if (didReceiveSnapshotResponse) break;
                } else if ('HeapProfiler.reportHeapSnapshotProgress' === method) ;
                else if (id === requestId) {
                    didReceiveSnapshotResponse = true;
                    if (chunks.length > 0) break;
                }
            }
            if (0 === chunks.length) throw new Error('Failed to capture heap snapshot, no chunks received or timed out.');
            await promises.writeFile(fileName, chunks.join(''));
            console.log(`Heap snapshot saved to ${fileName}`);
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = take_heap_snapshot_ts_dispose_resources(env);
            if (result) await result;
        }
    });
}
function take_screenshot_ts_add_disposable_resource(env, value, async) {
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
function take_screenshot_ts_dispose_resources(env) {
    var _SuppressedError = "function" == typeof SuppressedError ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    return (take_screenshot_ts_dispose_resources = function(env) {
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
function registerTakeScreenshotCommand(program, context) {
    program.command('take-screenshot').description('Take a screenshot of the current page').option(...CLIENT_OPTION).option(...CLIENT_NAME_OPTION).option(...SESSION_OPTION).option('--fullscreen', 'Capture the fullscreen screenshot instead of the lynxview').option('-o, --output <path>', 'Output file path (default: screenshot-<timestamp>.jpeg)').action(async (options)=>{
        const env = {
            stack: [],
            error: void 0,
            hasError: false
        };
        try {
            const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
            const { output, fullscreen } = options;
            const numericSessionId = Number(sessionId);
            const signal = AbortSignal.timeout(10000);
            const { promise: framePromise, resolve: resolveFrame } = Promise.withResolvers();
            const { promise: ackPromise, resolve: resolveAck } = Promise.withResolvers();
            const stream = take_screenshot_ts_add_disposable_resource(env, await connector.sendCDPStream(clientId, numericSessionId, new web_ReadableStream({
                async start (controller) {
                    controller.enqueue({
                        method: 'Page.startScreencast',
                        params: {
                            format: 'jpeg',
                            quality: 80,
                            mode: fullscreen ? 'fullscreen' : 'lynxview'
                        }
                    });
                    const hasFrame = await Promise.race([
                        framePromise.then(()=>true),
                        promises_setTimeout(10000, false, {
                            ref: false
                        })
                    ]);
                    if (hasFrame) controller.enqueue({
                        method: 'Page.screencastFrameAck'
                    });
                    controller.close();
                    resolveAck();
                }
            }), {
                signal
            }), true);
            for await (const { method, params: eventParams } of stream)if ('Page.screencastFrame' === method) {
                const { data } = eventParams;
                if (data) {
                    resolveFrame();
                    await ackPromise;
                    const fileName = output ?? `screenshot-${Date.now()}.jpeg`;
                    await promises.writeFile(fileName, Buffer.from(data, 'base64'));
                    console.log(`Screenshot saved to ${fileName}`);
                    return;
                }
            }
            throw new Error('Failed to capture screenshot, no Page.screencastFrame event received within 10 seconds.');
        } catch (e) {
            env.error = e;
            env.hasError = true;
        } finally{
            const result = take_screenshot_ts_dispose_resources(env);
            if (result) await result;
        }
    });
}
function getAndroidTransportSpec(env) {
    const port = Number.parseInt(env['ADB_SERVER_PORT'] ?? '5037', 10);
    return {
        host: env['ADB_SERVER_HOST'] ?? '127.0.0.1',
        port: Number.isInteger(port) && port > 0 ? port : 5037
    };
}
function createProgram(options = {}) {
    const env = options.env ?? process.env;
    const program = new Command();
    const context = {
        transports: [
            new AndroidTransport(getAndroidTransportSpec(env)),
            new DesktopTransport(),
            new iOSTransport()
        ]
    };
    program.name('lynx-devtool').description('CLI to interact with Lynx DevTool Connector').version(package_namespaceObject.rE).option('--no-daemon', 'Run in non-daemon mode, which will not start the background service').hook('preAction', async (thisCommand)=>{
        const rootOptions = thisCommand.opts();
        if (rootOptions.daemon) context.transports.push(new DaemonTransport());
    }).hook('postAction', async ()=>{
        await Promise.allSettled(context.transports.map((t)=>t.close()));
    });
    registerListClientsCommand(program, context);
    registerListSessionsCommand(program, context);
    registerCdpCommand(program, context);
    registerAppCommand(program, context);
    registerOpenCommand(program, context);
    registerInspectCommand(program, context);
    registerGetConsoleCommand(program, context);
    registerGetSourcesCommand(program, context);
    registerTakeScreenshotCommand(program, context);
    registerTakeHeapSnapshotCommand(program, context);
    registerGlobalSwitchCommand(program, context);
    const record = program.command('recorder');
    registerStartCommand(record, context);
    registerEndCommand(record, context);
    registerReactLynxCommand(program, context);
    return program;
}
__webpack_require__("../../../node_modules/.pnpm/core-js@3.49.0/node_modules/core-js/modules/es.promise.with-resolvers.js");
createProgram({
    env: process.env
}).parseAsync(process.argv).catch((error)=>{
    throw error;
});
