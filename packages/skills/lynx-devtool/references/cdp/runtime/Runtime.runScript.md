# Runtime.runScript

- `Runtime.runScript` - Runs script with given id in a given context.
- Input: 
  - `scriptId` (string | integer): Required. Id of the script to run (generated previously by compileScript).
  - `executionContextId` (integer, optional): Optional. Specifies in which execution context to perform script run.
  - `silent` (boolean, optional): Optional. In silent mode exceptions thrown during evaluation are not reported and do not pause execution.
  - `generatePreview` (boolean, optional): Optional. Whether preview should be generated for the result.
- Output: 
  - `result` (RemoteObject): Run result.
  - `exceptionDetails` (ExceptionDetails, optional): Exception details.
- Description: Runs a previously compiled and persisted script using its `scriptId`.
