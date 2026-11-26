import { rspackRequire, moduleFactories } from "./rslib-runtime.mjs";
import { DEFAULT_LYNX_LLMS_URL, createLynxStartupReminder } from "./startup-reminder.mjs";
import { createRequire as __rspack_createRequire } from "node:module";
const __rspack_createRequire_require = __rspack_createRequire(import.meta.url);
moduleFactories.add({
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/index.js" (__unused_rspack_module, exports) {
        const { Argument } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/argument.js");
        const { Command } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/command.js");
        const { CommanderError, InvalidArgumentError } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/error.js");
        const { Help } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/help.js");
        const { Option } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/option.js");
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
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/argument.js" (__unused_rspack_module, exports) {
        const { InvalidArgumentError } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/error.js");
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
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/command.js" (__unused_rspack_module, exports) {
        const EventEmitter = __rspack_createRequire_require("node:events").EventEmitter;
        const childProcess = __rspack_createRequire_require("node:child_process");
        const path = __rspack_createRequire_require("node:path");
        const fs = __rspack_createRequire_require("node:fs");
        const process1 = __rspack_createRequire_require("node:process");
        const { Argument, humanReadableArgName } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/argument.js");
        const { CommanderError } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/error.js");
        const { Help, stripColor } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/help.js");
        const { Option, DualOptions } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/option.js");
        const { suggestSimilar } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/suggestSimilar.js");
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
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/help.js" (__unused_rspack_module, exports) {
        const { humanReadableArgName } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/argument.js");
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
    "../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/option.js" (__unused_rspack_module, exports) {
        const { InvalidArgumentError } = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/lib/error.js");
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
const commander = rspackRequire("../../../node_modules/.pnpm/commander@13.1.0/node_modules/commander/index.js");
const { DM: program, gu: createCommand, er: createArgument, Ww: createOption, b7: CommanderError, Di: InvalidArgumentError, a2: InvalidOptionArgumentError, uB: Command, ef: Argument, c$: Option, _V: Help } = commander;
const hooks_program = new Command();
hooks_program.allowUnknownOption().option('--hook <type>', 'The hook event type').action(async (options)=>{
    const hookEvent = options.hook;
    if ('SessionStart' === hookEvent) {
        const llmsUrl = process.env['LYNX_LLMS_URL'] ?? DEFAULT_LYNX_LLMS_URL;
        const output = {
            hookSpecificOutput: {
                hookEventName: 'SessionStart',
                additionalContext: createLynxStartupReminder({
                    llmsUrl
                })
            }
        };
        console.log(JSON.stringify(output, null, 2));
    }
});
await hooks_program.parseAsync(process.argv);
