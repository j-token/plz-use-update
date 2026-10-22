# plz-use-update

Claude Code가 Bash/PowerShell에서 코드를 인라인으로 실행하지 못하게 막는 플러그인입니다.
차단되면 Claude는 스크립트를 파일로 저장한 뒤 실행하도록 안내받습니다.

## 설치

```
/plugin marketplace add j-token/plz-use-update
/plugin install plz-use-update@plz-use-update
```

Node.js가 `PATH`에 있어야 합니다.

## 차단하는 명령

| 형태 | 예시 |
|------|------|
| Python heredoc | `python - <<'EOF'`, `python3 <<EOF`, `py -3 - <<"PY"` |
| stdin 파이프 | `@'...'@ \| python -`, `cat x.py \| python.exe -u -` |
| Python `-c` | `python -c "..."`, `python3 -u -c ...`, `python.exe -Ic ...` |
| Node 인라인 실행 | `node -e ...`, `node --eval ...`, `node -p ...`, `node -pe ...` |

## 허용하는 명령

- `python script.py`, `node script.mjs`
- 스크립트 인자로 쓰인 플래그: `python script.py -c config.yaml`, `python -m pip install -c constraints.txt`, `node script.mjs -e prod`
- `pytest -c pytest.ini`, `node --version`

## 한계

명령 문자열 전체를 정규식으로 검사합니다. 그래서 `grep 'python -c' file`처럼 이 문자열을 텍스트로만 다루는 명령도 차단됩니다.
`node <<'EOF'`, `bun -e`, `deno eval`은 막지 않습니다.

## 라이선스

MIT
