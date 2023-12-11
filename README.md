# REPL Notebook

Fancy name to come...

## Executions

Idea is we write out files in the execution folder to document the execution.
Each file is written once and by reading everything sorted by timestamp we can
construct the full execution sequence

1. Enqueue task
   <execution id>/

   - content.ts
   - meta.json - cellId/timestamp

2. Logs
   <execution id>/<timestamp>.log
   log entries at timestamp - might be batched so each line has authoritative
   timestemp

3. Results
   <execution id>/<timestamp>.json

- data (exports)
  synchronous exports available after execution
- error
  error thrown during execution
- resolved
  default promise export resolved
- rejected
  default promise export rejected
- observable?
  stream of updates
