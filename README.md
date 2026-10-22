# plz-use-update

Claude Code가 인라인 코드로 파일을 고치지 못하게 막는 플러그인입니다.
`python - <<'EOF'`나 `node -e`로 파일을 쓰거나 옮기거나 지우려 하면 차단하고, Edit/Write 도구를 쓰도록 안내합니다.
값을 출력하거나 파일을 읽기만 하는 간단한 인라인 실행은 그대로 허용합니다.

## 설치

```
/plugin marketplace add j-token/plz-use-update
/plugin install plz-use-update@plz-use-update
```

Node.js가 `PATH`에 있어야 합니다.

## 동작 방식

다음 두 조건을 모두 만족하는 명령만 차단합니다.

1. 인라인 코드를 실행합니다.

   | 형태 | 예시 |
   |------|------|
   | Python heredoc | `python - <<'EOF'`, `python3 <<EOF`, `py -3 - <<"PY"` |
   | stdin 파이프 | `@'...'@ \| python -`, `cat x.py \| python.exe -u -` |
   | Python `-c` | `python -c "..."`, `python3 -u -c ...` |
   | Node 인라인 실행 | `node -e ...`, `node --eval ...`, `node -p ...` |

2. 코드에 파일을 바꾸는 호출이 있습니다.

   | 언어 | 감지하는 호출 |
   |------|------|
   | Python | `write_text`, `write_bytes`, 쓰기 모드 `open(..., 'w'/'a'/'x'/'+')`, `.write()`, `os.remove/rename/replace/...`, `shutil.copy/move/rmtree`, `Path.unlink/rename/touch/rmdir` |
   | Node | `writeFile`, `appendFile`, `copyFile`, `rename`, `unlink`, `rm`, `rmdir`, `truncate`, `cp`(각각 `Sync` 포함), `createWriteStream` |

## 허용 예시

- `python -c "print(1)"`, `node -p "process.version"`
- 읽기 전용: `python -c "print(open('a.txt').read())"`, `node -e "console.log(fs.readFileSync('a', 'utf8'))"`
- `sys.stdout.write(...)`, `process.stdout.write(...)`, `'a'.replace(...)`
- `python script.py`, `node script.mjs`

## 한계

정규식으로 명령 문자열을 검사하므로 완벽하지 않습니다.

- 셸 리다이렉션(`python -c "print(x)" > a.txt`)이나 `sed -i`처럼 코드 밖에서 파일을 바꾸는 경우는 막지 않습니다.
- `node <<'EOF'`, `bun -e`, `deno eval`은 검사하지 않습니다.
- 감지 목록에 없는 쓰기 API(예: `pandas.to_csv`)는 통과합니다.

## 라이선스

MIT
