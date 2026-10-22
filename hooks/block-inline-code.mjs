// PreToolUse hook (Bash|PowerShell): denies inline code, such as `python -c "..."`,
// `python - <<'EOF'`, `python3 <<EOF`, a PowerShell here-string piped into `python -`,
// or `node -e "..."`.
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

if (heredoc.test(command) || pipedStdin.test(command) || inlineFlag.test(command) || nodeEval.test(command)) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "Inline code (python -c, python - <<'EOF', here-string | python -, node -e/-p) is blocked. " +
        "Write the script to a file (e.g. in the scratchpad directory) with the Write tool, then run `python <file>.py` or `node <file>.mjs`.",
    },
  }));
}
