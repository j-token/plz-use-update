// PreToolUse hook (Bash|PowerShell): denies inline code that writes, moves or deletes files,
// such as `python - <<'EOF'` with Path.write_text or `node -e` with fs.writeFileSync.
// Inline code that only reads or prints is allowed.
import { readFileSync } from "node:fs";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf-8"));
} catch {}

const command = input.tool_input?.command ?? "";
const PY = String.raw`(?:^|[\s"'/\\&(])(?:python[\d.]*|py)(?:\.exe)?["']?`;
const heredoc = new RegExp(PY + String.raw`[^\n|;]*<<-?\s*['"]?\w+`, "i");
const pipedStdin = new RegExp(
  String.raw`\|\s*(?:&\s*)?["']?(?:[^\s|"']*[/\\])?(?:python[\d.]*|py)(?:\.exe)?["']?(?:\s+-\w+)*\s+-(?:\s|$)`,
  "im",
);
const inlineFlag = new RegExp(PY + String.raw`(?:\s+-\w+)*\s+-\w*c\b`, "i");
// node's -p/--print evaluates its argument like -e/--eval, so both are covered.
const nodeEval = new RegExp(
  String.raw`(?:^|[\s"'/\\&(])node(?:\.exe)?["']?(?:\s+-[-\w=]+)*\s+(?:-[a-z]*[ep]\b|--eval\b|--print\b)`,
  "i",
);
const runsInlineCode = [heredoc, pipedStdin, inlineFlag, nodeEval].some((pattern) => pattern.test(command));

// str.replace and stdout.write are excluded because read-only scripts use them constantly.
const pythonFileWrite = new RegExp(
  [
    String.raw`\.write_(?:text|bytes)\s*\(`,
    String.raw`\bopen\s*\([^)]*['"][rbt]*[wax+][rwabxt+]*['"]`,
    String.raw`\bmode\s*=\s*['"][rbt]*[wax+]`,
    String.raw`(?<!std(?:out|err))\.write(?:lines)?\s*\(`,
    String.raw`\bos\.(?:remove|unlink|rename|replace|rmdir|removedirs|truncate)\s*\(`,
    String.raw`\bshutil\.(?:copy\w*|move|rmtree)\s*\(`,
    String.raw`\.(?:unlink|rename|touch|rmdir)\s*\(`,
  ].join("|"),
);
const nodeFileWrite = new RegExp(
  String.raw`\b(?:writeFile|appendFile|copyFile|rename|unlink|rm|rmdir|truncate|cp)(?:Sync)?\s*\(|\bcreateWriteStream\s*\(`,
);
const writesFiles = pythonFileWrite.test(command) || nodeFileWrite.test(command);

if (runsInlineCode && writesFiles) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "Modifying files with inline code (python -c, python - <<'EOF', node -e, ...) is blocked. " +
        "Use the Edit or Write tool to change files. Inline code that only reads or prints is allowed.",
    },
  }));
}
