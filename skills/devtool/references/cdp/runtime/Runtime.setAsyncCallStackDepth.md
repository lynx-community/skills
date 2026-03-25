# Runtime.setAsyncCallStackDepth

- `Runtime.setAsyncCallStackDepth` - Enables or disables async call stacks tracking.
- Input: 
  - `maxDepth` (integer): Maximum depth of async call stacks. Setting to `0` will effectively disable collecting async call stacks (default).
- Output: None
- Description: Sets the depth limit for capturing asynchronous call stacks. Passing 0 turns off async call stack tracking.
