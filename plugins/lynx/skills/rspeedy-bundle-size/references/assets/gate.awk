# Selective main-thread gate for jsb wrapper functions.
# Gates ONLY top-level functions whose body delegates to the bridge singleton
# (references `core.` ) or calls jsb directly (.bridge / NativeModules /
# getJSModule / GlobalEventEmitter). Pure helpers (env/version/babel-runtime)
# are left untouched so main-thread render that calls them still works.
# PREREQUISITE: prettier-expand the input first. NOTE: run prettier OUTSIDE the project dir —
# the project's own prettier config (`.prettierrc` / `.prettierignore`) can silently skip or
# reflow the file when run in-tree. Copy it out to `/tmp` and pass `--no-config`:
#   `cp lib.lynx.js /tmp/lib.js && prettier --no-config --write /tmp/lib.js` (or `--parser babel`).
# It gates per-function by LINE; a compact `function f(){...}` body (brace not at end of
# line) is left as-is with a WARN. Real-tested on one jsb lib: raw all-WARN (compact), prettier 77/77.
# SCOPE LIMIT: only matches TOP-LEVEL `function foo(){}` declarations. jsb that lives in
# class methods (`foo(){ ... }`) or arrow exports (`const f = () => ...`) is INVISIBLE here.
# Such a lib will report GATED=0 even though it calls the bridge — so this END warns when the
# file references jsb APIs anywhere but gated nothing (real-tested miss: a class-method jsb lib
# gated 0/4 while calling .bridge/getJSModule/NativeModules from class methods). For class/arrow libs,
# gate via a babel/SWC visitor instead. A bare GATED=0 is NOT proof the lib is jsb-free.
BEGIN { inf=0; n=0; gated=0; pure=0; filejsb=0 }
/core\.|\.bridge|NativeModules|getJSModule|GlobalEventEmitter/ { filejsb=1 }
/^function [A-Za-z_$][A-Za-z0-9_$]*\(/ {
  if (inf) { flush() }            # defensive: flush a prior unclosed fn
  inf=1; idx=0; buf[idx++]=$0; sig=$0; jsb=0; next
}
inf==1 {
  buf[idx++]=$0
  if ($0 ~ /core\.|\.bridge|NativeModules|getJSModule|GlobalEventEmitter/) jsb=1
  if ($0 ~ /^}/) { flush() }
  next
}
{ print }
function flush(   i,s,done) {
  n++
  if (jsb) {
    gated++
    # Insert the guard right after the FIRST line ending in a lone `{` — handles
    # both K&R (`function f(){`) and Allman (`{` on its own line). If no such line
    # exists (multi-line signature), emit the function UNCHANGED rather than
    # corrupt it (the old fallback produced `function f(if(__MAIN_THREAD__)return;`).
    done=0
    for (i=0;i<idx;i++) {
      s=buf[i]
      if (!done && s ~ /\{[ \t]*$/) { sub(/\{[ \t]*$/, "{if(__MAIN_THREAD__)return;", s); done=1 }
      print s
    }
    if (!done) print "WARN: no `{`-terminated line to gate (multi-line sig?) — left as-is" > "/dev/stderr"
  } else {
    pure++
    for (i=0;i<idx;i++) print buf[i]
  }
  inf=0; jsb=0; idx=0
}
END {
  if (inf) flush()
  print "GATED="gated" PURE_KEPT="pure" TOTAL="n > "/dev/stderr"
  if (gated==0 && filejsb) print "WARN: file references jsb APIs but GATED=0 — jsb is likely in class methods / arrow functions, which this top-level-`function`-only gate cannot see. Gate via a babel/SWC visitor; do NOT treat GATED=0 as jsb-free." > "/dev/stderr"
}
