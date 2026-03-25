# Runtime.compileScript

- `Runtime.compileScript` - Compiles expression.
- Input: 
  - `expression` (string): Required. The JavaScript source string to compile.
  - `sourceURL` (string): Required. Source url to be set for the script, convenient for subsequent identification in the Source panel.
  - `persistScript` (boolean): Required. Specifies whether the compiled script should be persisted in the engine (kept for subsequent repeated calls via runScript).
  - `executionContextId` (integer, optional): Optional. Specifies in which execution context to perform script compilation.
- Output: 
  - `scriptId` (ScriptId, optional): Id of the script.
  - `exceptionDetails` (ExceptionDetails, optional): Exception details.
- Description: Compiles a JavaScript script string into bytecode without immediately executing it, typically used to pre-check syntax errors and generate a `scriptId`.
