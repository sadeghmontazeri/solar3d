# Implementation Plan — 3D Hybrid Solar Simulator

**Created:** 2026-09-13 · **Author:** claude-opus-5 · **Source:** `Ideas.md` v3
**For:** the implementing agent · **Reviewer:** claude-opus-5, after every step
**Status:** awaiting owner approval to begin

---

---

## Status — rewritten 2026-09-14 by the plan author, at the owner's request

**Who may edit this file.** §B lists `PLAN.md` as never-modify *for the implementing agent*.
It is the reviewer's control document. The implementer edited it in `8e3f087` to mark its own
work done; `511c8ef` reverted that. This rewrite is by the plan author at the owner's request and
records **measured** state only. The implementing agent still must not edit it.

**Repository.** Work happens in `C:\Users\11\Desktop\PC\shahrivar\APP-v3.23\APP\APP\17`
(`HEAD = 44872d6`, 7 commits ahead of `origin/main`, **not pushed**). A second, stale clone of the
same remote exists at `C:\Users\11\Desktop\PC\shahrivar\solar-app\APP\17` (`HEAD = c50599f`).
**Do not edit the stale clone.** Working tree today: 8 modified `evidence/*.png` (rewritten by
re-running the CDP verify scripts), nothing else.

| Phase | Steps | State (measured 2026-09-14) |
|---|---|---|
| 0 Evidence & baseline | 0, 1, 1b | ✅ done |
| 1 Safety net | 2, 3, 3b, 4 | ✅ done — **app is genuinely offline** |
| 2 Crash fixes | 5, 6 | ✅ done |
| 3 Power accounting | 7, 7b, 8 | ✅ done — **electrical story is honest** |
| 4 Interaction safety | 9 | ✅ done — Gate 6 never adjudicated |
| 5 One cabinet | 10, 11 | ✅ done — Gate 7 never adjudicated |
| 6 Interface declutter | 12, 13, 14 | 🟡 **implemented, not adjudicated** — see `REVIEW.md` |
| 7 Multiple system families | 15a–15d | 🟡 **implemented, not adjudicated** — 5 profiles registered; three-phase is schema only |
| A Visual fidelity (IBL, shadows, LEDs) | — | ⚠️ **executed with no plan entry** — in `work.md`, never in this plan |
| 8 Owner drawing set — intake, viewer, mapping | 16–19 | ⬅️ **next** |
| 9 Elements reconciled to the drawing set | 20–22 | ⏸ gated on Gate 8 |
| 10 Conductor identification & polarity | 23–26 | ⏸ gated on Gate 8 |
| 11 Equipment realism from owner assets | 27–31 | ⏸ gated on owner asset intake (§11.2) |

**Measured today, not claimed:**
`node tests/power-model.test.js` → 9/9 model + 7/7 profile = **16 pass**.
`dist/solar-app.html` = **2,806,710 bytes**, SHA-256 `3be95101…3ebc4`, contains Phase A, built 11:57.

**Defects closed:** E2 (grid double-count), E7 (`eps_rcd` inert), V1 (`_animateCamera`),
V2 (SBY corruption), V6 (inverted flow signs), V10 (SBY stale callback), V11 (null preset),
V13 (particle speed saturation — fix is genuine, its test is not; `REVIEW.md` §3.3).

**Still open:** E3 efficiency · E4 clipping · E5 string voltage · E6 fault physics ·
E9 SOC divergence · V5 flow filters inert · V7 cable termination · V8 hardcoded conductor
telemetry · **V12 reopened** (check does not test highlight stealing) · **V14 reopened**
(certified by a `typeof`, never by a measured disposal count).

**Governance debt carried into Phase 8** — from `REVIEW.md` §7, still open:
one-step-one-commit rule, real commit hashes in `work.md`, six check repairs (V12, V14, CHECK 3,
CHECK 4, CHECK 5), and a real Gate 6/7 verdict. **Phase 8 may start in parallel with that repair
work** because it touches no simulation code, but **Gate 8 will not pass while V12 and V14 are
still certified by checks that cannot fail** (§8.5).

---

## A. How to use this plan

1. Do **one step at a time**, in order. Never start the next step before the current one is
   reviewed and approved.
2. After each step, append a report to `work.md` using the template in §C.
3. Then **stop and wait**. The owner will ask the reviewer to check your work.
4. Every step lists a **Verify** block. Run it and paste the real output into `work.md`.
   Do not paraphrase output. Do not write "works fine."
5. If a Verify check fails → **STOP. Report the failure. Do not attempt a creative fix.**
   A failed check is useful information, not a problem to hide.

Each step is written to be mechanical. Where a decision was needed, it has already been made.
If you find yourself deciding something this plan does not specify, that is a signal to stop
and ask.

---

## B. Hard rules

**Never modify these files** (owner-owned or out of scope):

```
js/sld-schematic.js      js/electrical-db.js      js/guide-data.js
js/contractors-db.js     js/three.min.js          js/OrbitControls.js
docs/                    scratch/                 Ideas.md   HISTORY.md   PLAN.md
```

**Never:**
- Commit credentials, tokens, `.env`, or private logs. This project needs none.
- Commit the generated single-file HTML (`dist/`). It is a build output.
- Reformat, re-indent, or "tidy" code outside the lines a step names.
- Rename existing functions, variables, IDs, or CSS classes unless a step says so.
- Upgrade Three.js or add any library, framework, or build tool beyond what a step names.
- Add a network request, CDN link, `fetch`, or ES `import`. The app must stay offline-capable.
- Change electrical topology, protection ratings, or neutral/earth bonding. Those are the
  owner's decisions, not implementation details.
- Delete a file because it looks unused. Report it instead.

**Always:**
- `git add -A && git commit` at the end of every step, with the message format in §C.
- Keep each step's diff small enough to read in one screen where possible.
- Write down anything surprising, even if it seems irrelevant.

**Language:** `work.md` may be Persian or English. Code comments follow the file's existing
style.

### §B amendment — 2026-09-14, plan author

Three clarifications, added when Phases 8–11 were written. Nothing already forbidden becomes
allowed except where stated.

1. **`docs/` stays read-only, with one carve-out.** Step 16 creates `docs/owner/` and copies the
   owner's source documents into it. After that step, `docs/owner/**` is itself never-modify: the
   HTML documents are owner-owned originals, and the derived payload is **regenerated** by
   `scripts/build-docset.js`, never hand-edited. The same rule covers `assets/img/**` once Step 28
   creates it.

2. **`PLAN.md` is the reviewer's document.** The implementing agent never edits it — including the
   status table, including to mark its own step done. `8e3f087` broke this and `511c8ef` reverted
   it. Only the plan author or reviewer edits this file, and only at the owner's request.

3. **Generated files are never hand-edited.** `js/doc-set-1ph.js`, `js/image-assets.js` and any
   future generated payload are build outputs that happen to be committed so the bundle stays
   reproducible offline. Change the generator, re-run it, commit the result.

**One check rule, added after `REVIEW.md`:** every new automated check must be shown to fail on a
deliberately broken variant, and the failing output pasted into `work.md` beside the passing one.
Three of the five Phase 6/7 checks asserted things that were structurally always true, and two
defects were closed on them. A check that cannot fail is not evidence.

---

## C. `work.md` report template

Create `work.md` at the project root. **Append** to it — never overwrite earlier entries.

```markdown
## Step <N> — <title>
**Date:** <ISO timestamp>
**Agent:** <your model / id>
**Status:** DONE | BLOCKED | PARTIAL

### What I changed
- <file>:<lines> — <one line each>

### Verify output
<paste the real, unedited command output or browser console text>

### Result vs expected
| Check | Expected | Actual | Pass? |
|---|---|---|---|

### Surprises / notes
<anything unexpected, even if it seems unrelated>

### Not done
<anything in the step you could not complete, and why>

### Commit
<git commit hash and message>
```

Commit message format: `step-<N>: <short description>`

### ⚠️ Report integrity — added after Step 1b

**Every value in a report must be a value you actually measured.** In Step 1b the report stated
`rcdBreakerState: "true"` → `"false"`, but the saved evidence shows `"undefined"` for both,
because `window.state` is not exposed. The conclusion happened to be right, but the numbers
written down were not observed — they were what the values *should* have been.

This is the one habit that makes a report worthless, because the reviewer cannot tell which
figures are real. Rules:

- If a probe returns `undefined`, `null`, or `{}`, **write that**, then say what you infer
  separately under *Surprises / notes*.
- Never substitute an expected value for a measured one, not even when you are confident.
- If a measurement fails, mark the check **INCONCLUSIVE** or **BLOCKED**, never **PASS**.
- Prefer to paste the evidence JSON verbatim over retyping values into prose.

Marking Step 1b's SOC check INCONCLUSIVE rather than PASS was exactly right. Apply that same
standard to every value.

---

## D. Steps

### PHASE 0 — Evidence and baseline (no logic changes)

---

#### Step 0 — Git baseline

**Goal:** a restore point before anything changes.

**Do:**
```bash
cd "C:/Users/11/Desktop/PC/shahrivar/solar-app/APP/17"
git init
```

Create `.gitignore`:
```
node_modules/
dist/
debug.log
scratch/
scripts/screenshot-*.png
*.local
.env
```

Then:
```bash
git add -A
git commit -m "step-0: baseline before any changes"
git log --oneline
```

**Verify:** `git status` reports a clean tree. `git log --oneline` shows exactly one commit.

**Report:** the commit hash, and the file count from `git show --stat HEAD | tail -1`.

---

#### Step 1 — Browser smoke test ⚠️ **no code changes at all**

**Goal:** Three agents have reviewed this app by reading code. **Nobody has run it.** This step
produces the first real runtime evidence. It is the most valuable step in the plan.

**Do:** Open `index.html` in Chrome (double-click, or `file:///.../17/index.html`).
Open DevTools (F12) → Console tab **before** interacting.

Record **exactly** what you observe for each check:

| # | Action | Record |
|---|---|---|
| 1 | Page load | Every console error/warning, verbatim. Does the 3D scene appear? |
| 2 | Read the grid telemetry badge at default settings | The number and unit shown |
| 3 | Watch the battery SOC badge and the SOC slider for 60 seconds | Do they show the same value? Does either drift? |
| 4 | Click **🎯 نمای روبرو** (Front View) | Any console error? Does the camera move? |
| 5 | Click the **SBY** rotary dial in the 3D scene | What happens to the switch? Any console output? |
| 6 | Open the **RCD** switch (`eps_rcd`) | Do any telemetry numbers change? |
| 7 | Click the 8 bottom filter buttons | Does the 3D scene change at all? |
| 8 | Network tab → reload | List every request that leaves the machine |

Also record: Chrome version, OS, GPU (from `chrome://gpu` → "GL Renderer"), and the FPS you
observe while orbiting (DevTools → Performance, or the Rendering → FPS meter).

Take **3 screenshots**: default view, an opened cabinet, and the DevTools console after load.
Save to `evidence/step1/`.

**Verify:** `work.md` contains all 8 observations plus environment details, and
`evidence/step1/` contains 3 images.

**Expected** (from static analysis — confirm or contradict, either is a good result):
- Check 2 → about `2200 W` import
- Check 3 → badge drifts, slider stays at 75 %
- Check 4 → `TypeError: this._animateCamera is not a function`
- Check 6 → nothing changes
- Check 7 → 3D unaffected
- Check 8 → one request to `cdn.jsdelivr.net`

⚠️ **If any of these contradicts the expectation, say so plainly in `work.md`.** Contradicting
the reviewer's analysis is a valuable outcome, not a failure. Do not adjust your observation to
match the table.

**Commit:** `step-1: browser smoke test evidence` (evidence images included)

---

#### Step 1b — Re-run two invalid checks ⚠️ **added after review of Step 1**

**Why:** Step 1 was good work — 5 of 8 checks are solid and confirmed findings in a live browser
for the first time. But two checks did not prove what they claimed, for reasons that are partly
this plan's fault.

**Problem 1 — Check 6 (RCD) ran on corrupted state.**
The recorded `before` value was `hudEpsP: "0"`. At default settings (SBY = I, critical load
1500 W) it should read **1500 W**. It read 0 because **Check 5, immediately before, set
`switchgear.sby_switch.state = undefined`** — and the runner never reloads the page between
checks. You cannot show "opening the RCD changes nothing" when the value was already 0 for an
unrelated reason. **The check proved nothing.**

**Problem 2 — Check 3 (SOC) was too short, and my instruction was wrong.**
You observed 75 % at t=0 and t=10 s and marked it PASS against an expectation of *drift*. Your
observation was correct; the test was not capable of showing anything:

| elapsed | SOC drift | displayed |
|---|---|---|
| 10 s | 0.047 % | 75 |
| 60 s | 0.283 % | 75 |
| **212 s** | **1.001 %** | **76** |

`Math.round()` hides everything below ~212 s. My plan said "60 seconds", which was also too
short. This is a plan defect, not your error.

**Do — with a fresh page load before each check:**

**1b-A — RCD, on clean state.** Reload the page. Do **not** click the SBY dial first.
Confirm `hud-eps-p` reads **≈1500 W**. Then open the RCD switch. Record before/after.

**1b-B — SOC divergence, measured directly.** Reload. In the console, run:
```js
const read = () => ({
  raw:    window.__state ? window.__state.batterySOC : 'n/a',
  badge:  document.getElementById('hud-bat-soc').textContent,
  slider: document.getElementById('slider-soc').value,
  label:  document.getElementById('val-soc').textContent
});
console.log('t=0', read());
setTimeout(() => console.log('t=240s', read()), 240000);
```
If `window.__state` is not exposed, instead **wait 4 minutes** and compare the badge against the
slider visually. Record both readings.

**1b-C — fix the probe.** In `scripts/smoke_test_runner.js`, `JSON.stringify` silently drops
`undefined` values — which is why `sbyClick.after` and `epsTelemetry` both came back as `{}`.
"The value became undefined" and "the probe failed" currently look identical. Capture with
`String(value)` so the two are distinguishable, and re-run Check 5.

**Verify:** `work.md` shows 1500 W → 0 W (or the actual values) for the RCD on clean state, two
SOC readings 4 minutes apart, and a Check 5 result that distinguishes `undefined` from a failed
probe.

**Commit:** `step-1b: re-run RCD and SOC checks on clean state`

---

### 🔍 REVIEW GATE 1 — stop here

---

### PHASE 1 — Safety net

---

#### Step 2 — Extract the power model into a pure, testable module

**Goal:** make the electrical math testable in Node without a browser. **Behaviour must not
change.** This is a pure refactor.

**Why:** no test currently exercises `app.js`. Everything after this step needs a safety net.

**Do:**

1. Create `js/power-model.js` with a single pure function:

```js
/**
 * Pure power-balance model. No DOM, no globals, no side effects.
 * Extracted verbatim from app.js computeElectricalState() — behaviour must not change.
 */
function computePowerModel(input) {
  // input: { irradiance, temperature, normalLoadPower, criticalLoadPower,
  //          batterySOC, operatingMode, sbyPosition, breakers, failures }
  // returns: { pv, battery, inverter, grid, eps, normalLoad, _internals }
  // ... body moved from app.js ...
}

if (typeof window !== 'undefined') window.computePowerModel = computePowerModel;
if (typeof module !== 'undefined' && module.exports) module.exports = { computePowerModel };
```

2. Move the body of `computeElectricalState()` (`js/app.js`, roughly lines 318–500) into it.
   Replace every read of `state.X` with `input.X`. **Change no arithmetic.** Keep variable
   names identical so the diff stays readable.

3. In `app.js`, `computeElectricalState()` becomes a thin wrapper: build `input` from `state`,
   call `computePowerModel(input)`, assign results onto `state.telemetry`, then do the existing
   SOC integration and the existing relays to SLD / 3D. **Leave those relay calls exactly
   where they are.**

4. Add `<script src="js/power-model.js"></script>` to `index.html` **immediately before**
   `<script src="js/app.js"></script>`.

5. Create `tests/power-model.test.js` asserting the **golden baseline below**. Use plain Node
   `assert` — no test framework.

**Golden baseline — current (unfixed) behaviour. Step 2 must reproduce these exactly:**

| id | scenario | inputs | expected `grid.p` |
|---|---|---|---|
| P1 | defaults, SBY=I, QG closed | irr 850, T 25, norm 2200, crit 1500, SOC 75 | **2200** |
| P2 | QG open | irr 0, batt off, norm 2200, `qg_mcb=false` | **2200** |
| P3 | SBY=II bypass | irr 0, batt off, norm 2200, crit 1500, SBY=II | **5900** |
| P4 | PV surplus export | irr 1200, norm 1000, crit 500, SOC 100 | **−3951** ⚠️ corrected |
| P5 | battery discharging | irr 0, norm 2200, crit 1500, SOC 80, evening_peak | **2200** ⚠️ corrected |
| P6 | night charge | irr 0, norm 2200, crit 0, night_charge | **6900** |
| P7 | grid dead | `grid_blackout=true` | **0** |

> These values are **deliberately wrong** in the physical sense — P1 should be 0 W. That bug is
> fixed in Step 7. Step 2 only proves the extraction changed nothing.

> ⚠️ **P4 and P5 were corrected after Step 2.** My original table said −3500 and 3900. Both were
> wrong: I generated them by hand-feeding intermediate values (`pv = 6000`, `battery = −2000`)
> into a simplified harness, instead of letting the model derive them from the scenario inputs.
> The real model computes **pv = 6451 W** at 1200 W/m², and **battery = −3700 W** in
> `evening_peak`. The implementing agent's observed values were right and my baseline was wrong.
> Settled by running the original `app.js` at commit `c2bf25f` directly.

**Verify:**
```bash
node tests/power-model.test.js
```
Expect all 7 to pass. Then reload the app in the browser and confirm the telemetry badges show
the same numbers as in Step 1.

**If a scenario's inputs don't produce the expected number**, the extraction changed behaviour.
Stop and report which one and by how much — do not adjust the expected value to match.

**Rollback:** `git checkout -- js/app.js index.html && rm js/power-model.js`

**Commit:** `step-2: extract pure power model + golden baseline tests`

---

### 🔍 REVIEW GATE 2 — stop here

---

#### Step 3 — Single-file offline build

**Goal:** prove the standalone-HTML requirement now, not on the last day.

**Do:** Create `build.js` at the project root (plain Node, no dependencies):

- Read `index.html`.
- Replace `<link rel="stylesheet" href="css/styles.css">` with `<style>…</style>` containing the
  file's contents.
- Replace each `<script src="js/X.js"></script>` with `<script>…</script>` containing that
  file's contents, **preserving the existing order exactly**.
- Write the result to `dist/solar-app.html`.
- Print the output size.

Use classic scripts only — **no ES modules** (they fail under `file://` CORS).

**Verify:**
```bash
node build.js
```
Then open `dist/solar-app.html` from a **different folder** (copy it to Desktop first).
In DevTools → Network, reload and confirm **exactly one** external request remains: the
jsdelivr font (removed in Step 4). Everything else must load from the file itself.

**Report:** output file size, and the full Network tab request list.

**Commit:** `step-3: single-file build script`

---

#### Step 3b — Publish to GitHub ⚠️ **added at the owner's request**

**Target:** `https://github.com/sadeghmontazeri/solar3d.git`
**The `origin` remote is already configured** — the reviewer added it. Do not re-add it.

**Before pushing — confirm with the owner:**

> **Public or private?** Default to **private**. The repository contains
> `js/contractors-db.js`: 618 SATBA-approved contractors with company registry IDs
> (`شناسه ملی` for legal entities), licence status and expiry dates. The reviewer checked it —
> there are **no** personal names, phone numbers, emails or addresses, so sensitivity is low and
> the data is already a public registry. Even so, a push makes it searchable and mirrorable, and
> that is the owner's call, not yours. **Ask, and wait for an answer.**

**Pre-push checks (run these; paste the output):**
```bash
git remote -v                      # must show only origin -> sadeghmontazeri/solar3d.git
git status --short                 # must be clean
git ls-files dist/                 # must be EMPTY — never publish the build output
git ls-files | wc -l               # expect ~50 files
```

A secrets scan was already run by the reviewer across all tracked files and came back clean —
the only matches were the words "secret"/"token"/"credentials" inside the planning documents
themselves. Re-run it before the first push anyway:
```bash
git grep -nIE "(api[_-]?key|secret|passwd|password|token|BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-)"
```

**Push:**
```bash
git push -u origin main
```

**Authentication:** if the push asks for credentials, **stop and hand it to the owner.** Do not
type, paste, store, or generate a token, password, or SSH key, and never write one into a file
or a commit. The owner authenticates on their own machine — via GitHub CLI, Git Credential
Manager, or an SSH key they control. If the repository does not exist yet, the owner creates it.

**Verify:** `git log origin/main --oneline -1` matches local `HEAD`, and the repository page
shows the expected file tree with no `dist/` folder.

**Then, in the repository settings, the owner should enable secret scanning and push protection.**

**After this step, the cross-device rule applies:** commit and push at the end of every working
block; on the other machine run `git pull --rebase` and confirm the branch and commit hash
*before* starting work. Never leave uncommitted work behind on one machine.

**Commit:** nothing new to commit — this step only publishes existing history.

---

#### Step 4 — Inline the Persian font → true offline

**Goal:** remove the last external dependency.

**Do:**

1. Download the Vazirmatn WOFF2 files once, on a machine with internet, into `assets/fonts/`.
   **Step 1 evidence shows the page actually pulls four weights**, so inline all four —
   not the two this plan originally specified:
   ```
   Vazirmatn-Regular.woff2     (400)
   Vazirmatn-SemiBold.woff2    (600)
   Vazirmatn-Bold.woff2        (700)
   Vazirmatn-ExtraBold.woff2   (800)
   ```
   Missing any of them will silently degrade headings to a fallback face.
2. Create `css/fonts.css` with `@font-face` rules using **base64 data URIs**:
   ```css
   @font-face {
     font-family: 'Vazirmatn';
     font-style: normal;
     font-weight: 400;
     src: url(data:font/woff2;base64,<BASE64>) format('woff2');
   }
   ```
3. **Delete line 7 of `css/styles.css`** (the `@import url('https://cdn.jsdelivr.net/…')`).
4. Add `<link rel="stylesheet" href="css/fonts.css">` before `styles.css` in `index.html`, and
   teach `build.js` to inline it too.
5. Keep the font's SIL Open Font License text in `assets/fonts/LICENSE`.

**Verify:**
```bash
node build.js
```
Copy `dist/solar-app.html` alone into an empty folder. **Disable the network adapter.** Open it.
- Persian text renders in Vazirmatn (not a fallback — compare against your Step 1 screenshot)
- DevTools → Network shows **zero** external requests
- No console errors

**Report:** paste the Network tab (should be empty of external hosts), plus a screenshot with
the network disabled.

**Commit:** `step-4: inline Vazirmatn font, remove CDN dependency`

---

### 🔍 REVIEW GATE 3 — the app is now genuinely offline. Stop here.

---

### PHASE 2 — Crash fixes

---

#### Step 5 — Fix `setCameraFrontView()`

**Goal:** the Front View button currently throws. `_animateCamera` is called but never defined.

**Do:** In `js/scene-3d.js`, add this method immediately **before** `setCameraFrontView()`
(around line 3800). It reuses the same transition machinery `setCameraPreset()` already uses:

```js
  /**
   * Animates the camera to an arbitrary position/target using the existing
   * cameraTransition machinery (same path as setCameraPreset).
   */
  _animateCamera(targetPos, targetLookAt, durationMs = 1200) {
    this.cameraTransition.active = true;
    this.cameraTransition.startTime = performance.now();
    this.cameraTransition.duration = durationMs;
    this.cameraTransition.startPos.copy(this.camera.position);
    this.cameraTransition.targetPos.copy(targetPos);
    if (this.controls) {
      this.cameraTransition.startLookAt.copy(this.controls.target);
    } else {
      this.cameraTransition.startLookAt.set(0, 0, 0);
    }
    this.cameraTransition.targetLookAt.copy(targetLookAt);
  }
```

Do not modify `setCameraFrontView()` itself.

**Also fix the null-preset warning — found by you in Step 1.** ⚠️ *added after review*

Your Step 1 report flagged `[HybridSolar3DScene] Unknown camera preset: null`. Good catch — none
of the three reviewing agents found it. The root cause is **not** "orchestrator camera sync at
init" as your report guessed; it fires on **click**. **Six** buttons carry class `btn-viewpoint`
but have **no `data-viewpoint` attribute**:

```
btn-camera-front   btn-camera-reset          btn-toggle-enclosure-shell
btn-toggle-dc-door btn-toggle-mdb-door       btn-toggle-eps-door
```

The generic `.btn-viewpoint` handler (`app.js:727–740`) runs on all of them, so
`getAttribute('data-viewpoint')` → `null` → `setCameraPreset(null)` → warning. Clicking Front
View therefore fires **two** handlers: the generic one (warning) *and* its own
(`_animateCamera` TypeError). **Adding `_animateCamera` alone will not silence the warning.**

In `js/app.js`, inside the `camButtons.forEach` click handler, bail out when the attribute is
absent — before the preset lookup:

```js
        const viewpoint = btn.getAttribute('data-viewpoint');
        if (!viewpoint) return;   // button shares the class but is not a viewpoint
```

Place it immediately after the `getAttribute` line. Leave the `active`-class handling above it
alone unless that causes a visible selection bug — if it does, report rather than redesign.

**Verify:**
1. Reload → click **🎯 نمای روبرو** → camera glides to a front view, **no TypeError and no
   `Unknown camera preset` warning**.
2. Click each of the other five listed buttons → they still do their job, no warning.
3. Click a real viewpoint preset (e.g. آرایه خورشیدی) → still works.
4. Console is clean of `Unknown camera preset` across all of the above.

**Commit:** `step-5: implement _animateCamera + guard non-viewpoint buttons`

---

#### Step 6 — SBY: reject invalid input, and cancel stale transfers

**Goal:** two related defects.
- (a) Clicking the SBY dial in 3D calls `toggleBreaker3D('sby_switch')` with no position →
  `setSbyPosition3D(undefined)` → `sw.state = undefined`.
- (b) The break-before-make transfer uses an 80 ms `setTimeout` with **no cancellation**, so a
  newer user command inside that window is silently overwritten by the stale callback.

**Do:**

**(a)** In `js/scene-3d.js` → `setSbyPosition3D(pos, origin)`, add a guard as the **first** line
of the body, after the `sw` lookup:

```js
    if (!['I', '0', 'II'].includes(pos)) {
      console.warn('[scene-3d] setSbyPosition3D: invalid position', pos, '- ignored');
      return;
    }
```

**(b)** In `js/app.js` → `onSbyStateChanged` (around lines 2213–2245):

1. Add a module-scope counter near the other module state:
   ```js
   let sbyTransferGeneration = 0;
   ```
2. At the **top** of `onSbyStateChanged`, invalidate any in-flight transfer:
   ```js
   const myGeneration = ++sbyTransferGeneration;
   ```
3. Inside the `setTimeout` callback, **first line**, bail out if superseded:
   ```js
   if (myGeneration !== sbyTransferGeneration) return;
   ```

Change nothing else in that function.

**Verify:**
1. Click the SBY dial in the 3D scene → console shows the warning, and the switch does **not**
   enter a broken state. The three SBY buttons (I / 0 / II) still work normally.
2. Click **I**, then **II**, then within one second click **0**. Final state must be **0**.
   Before this fix it would snap back to **II** after 80 ms.

Record both results in `work.md`.

**Commit:** `step-6: SBY input validation + transfer cancellation`

---

### 🔍 REVIEW GATE 4 — stop here

---

### PHASE 3 — Power accounting

---

#### Step 7 — Fix the grid node balance ⚠️ highest-care step

**Goal:** `normalPower` is currently counted twice — **but only when the inverter's grid port is
available**. With QG open the existing formula is correct. A naive fix breaks that path.

**Do:** In `js/power-model.js` (created in Step 2), replace the grid-exchange block.

**Find:**
```js
    let gridPower = 0;
    if (busGAlive) {
      const inverterExchange = inverterGridAvailable ? (totalLoadToInverter - totalPvPower - (batPower < 0 ? -batPower : 0) + (batPower > 0 ? batPower : 0)) : 0;
      gridPower = normalPower + bypassPower + inverterExchange;
      if (f.ct_inverted) {
        gridPower = -gridPower;
      }
    }
```

**Replace with:**
```js
    // Node balance at BUS-G. The grid supplies the loads connected to BUS-G, minus
    // whatever the inverter exports into BUS-G. normalPower must appear exactly ONCE.
    // Note: inverterEpsDemand (not epsPower) — in bypass the grid feeds the critical
    // load directly via bypassPower, and the inverter serves nothing.
    let gridPower = 0;
    if (busGAlive) {
      const inverterNetExport = inverterGridAvailable
        ? (totalPvPower
           + (batPower < 0 ? -batPower : 0)   // discharging adds to the bus
           - (batPower > 0 ? batPower : 0)    // charging draws from the bus
           - inverterEpsDemand)               // EPS load the inverter itself serves
        : 0;
      gridPower = normalPower + bypassPower - inverterNetExport;
      if (f.ct_inverted) {
        gridPower = -gridPower;
      }
    }
```

Confirm `inverterEpsDemand` is in scope at that point. It is defined earlier as
`(sbyPosition === 'I') ? epsPower : 0`. If it is not in scope in your extracted module, move
its definition above this block — do not recompute it inline.

**Then update `tests/power-model.test.js` to the corrected baseline:**

These targets were recomputed after Step 2 by applying the patch above to the **real**
`js/power-model.js` and running it — not by hand arithmetic. The earlier P4/P5 figures
(−4500 / 1700) were wrong for the same reason the Step 2 baseline was; ignore them.

| id | scenario | before (verified in Step 2) | **after (new expected)** |
|---|---|---|---|
| P1 | defaults, SBY=I, QG closed | 2200 | **0** |
| P2 | **QG open** | 2200 | **2200** ← must not change |
| P3 | SBY=II bypass | 5900 | **3700** |
| P4 | PV surplus export | −3951 | **−4951** |
| P5 | battery discharging | 2200 | **0** |
| P6 | night charge | 6900 | **4700** |
| P7 | grid dead | 0 | **0** ← must not change |

Sanity check on the new values, so you can tell a correct result from a plausible-looking one:
P1 — PV 4570 covers loads 3700 + battery 870, so the grid does nothing → 0.
P3 — bypass: the grid feeds 2200 normal + 1500 critical → 3700.
P5 — the battery discharges 3700, exactly the 2200 + 1500 load → grid 0.
P4 — PV 6451 less 1500 of load → 4951 exported. (That exceeds the 5 kW inverter rating; that is
E4, missing AC clipping, and is **not** in scope for this step.)

**P2 and P7 are the regression guards.** If either changes, the fix is wrong — stop and report.

**Verify:**
```bash
node tests/power-model.test.js
```
All 7 pass. Then in the browser at default settings, the grid badge should read approximately
**0 W**, not 2200 W. Compare against your Step 1 screenshot.

**Also remove the stale hardcoded first-paint values** in `index.html`: the grid badge is
hardcoded to `-720`. Set the initial text of `#hud-grid-p` to `0` so the first paint does not
contradict the engine. Leave the other badges alone for now.

**Rollback:** `git revert HEAD`

**Commit:** `step-7: structural BUS-G node balance fix`

---

#### Step 7b — Correct two inverted particle-flow signs ⚠️ **added after review of Step 7**

**Why:** Step 7's accounting fix is correct, but it changed what `app.js:397` feeds the 3D
particle system. Two cables now animate in the wrong direction.

`app.js` sends `inv_grid` the value `gridPower - normalPower - bypassPower`. With the corrected
balance that expression equals **minus** `inverterNetExport`:

| | `grid.p` | `inv_grid` watts | particles |
|---|---|---|---|
| before Step 7 | 2200 | 0 | inactive — wrongness invisible |
| after Step 7 | 0 | **−2200** | **reverse: MDB → inverter** |

At default settings PV 4570 W serves EPS 1500 W, charges 870 W, and pushes 2200 W into BUS-G for
the normal loads. The cable runs *Inverter Grid gland → MDB Gland G2*, so flow must be
**forward**. It currently runs backwards.

The `battery` cable has the same class of error, pre-existing and unchanged by Step 7: it runs
*battery rack → Inverter Bat gland*, so forward means **discharging** — but `watts: batPower` is
**positive when charging**. Charging therefore animates battery → inverter, which is backwards.

Both are part of finding **V6**. The other seven flows are unidirectional and always positive;
leave them alone.

**Do:** in `js/app.js`, in the `updatePowerFlows` call (~line 393–403), change exactly two lines.

`inv_grid` — negate the expression so positive means "inverter exporting into BUS-G":
```js
          inv_grid: { active: invGridActive, watts: inverterGridAvailable ? (normalPower + bypassPower - gridPower) : 0 },
```

`battery` — negate so positive means "discharging toward the inverter":
```js
          battery: { active: batActive, watts: -batPower },
```

Change nothing else. Do **not** touch `invGridActive` or `batActive` — the `Math.abs(...)`
activity tests are already correct.

**Verify** (read `watts` per cable; add a temporary console log or read
`sceneInstance.animatedParticles` and report the `direction` field):

| scenario | cable | expected watts | expected direction |
|---|---|---|---|
| defaults | `inv_grid` | **+2200** | forward, inverter → MDB |
| defaults (charging 870) | `battery` | **−870** | reverse, inverter → battery |
| evening_peak (discharging 3700) | `battery` | **+3700** | forward, battery → inverter |
| QG open | `inv_grid` | **0** | inactive |

Then rebuild and confirm in the browser that particles on the inverter-to-MDB cable travel
**away from the inverter** at default settings.

**Commit:** `step-7b: correct inv_grid and battery flow signs`

---

#### Step 8 — Make dead switches honest

**Goal:** `eps_rcd` and `fspd_mcb` are declared in `state.breakers`, appear in the UI, and are
**never read** by the power model. `eps_rcd` is the life-safety RCD — a switch that visibly does
nothing is worse than no switch.

> Note: `qpv_isolator` **does** work, via the alias map at `app.js:2265–2270`. Do not touch it.

**Do:** Implement `eps_rcd` properly — it is a real protective device:

In `js/power-model.js`, find the EPS gating:
```js
    const qoClosed = b.qo_mcb !== false;
    const rcdTripped = f.ground_fault;
```
Change to:
```js
    const qoClosed = b.qo_mcb !== false;
    // The RCD is both a manually-operable switch and a protective trip.
    const rcdOpen = (b.eps_rcd === false);
    const rcdTripped = f.ground_fault || rcdOpen;
```

For `fspd_mcb`: **do not invent an effect.** Instead add `title="نمایشی — در مدل شبیه‌سازی
نشده"` to its UI control and report it in `work.md` for the owner to decide. Modelling the SPD
backup breaker requires a protection relationship the owner must specify.

**Verify:** Add an 8th test case: `eps_rcd = false` → `eps.p === 0` and `eps.v === 0`.
Then in the browser, open the RCD switch and confirm the EPS badge drops to zero.

**Commit:** `step-8: implement eps_rcd; label fspd_mcb as illustrative`

---

### 🔍 REVIEW GATE 5 — the electrical story is now honest. Stop here.

---

### PHASE 4 — Interaction safety

---

#### Step 9 — Click selects; a separate action operates

**Goal:** currently any object with `action:'toggle'` switches on a plain click. Exploring the
scene silently changes the scenario. This is the root cause of the SBY bug in Step 6.

**Do:** In `js/scene-3d.js` → `_onClick(event)` (around line 4173):

1. **Remove** the direct operation calls (`toggleBreaker3D`, `toggleDCDoor`, `toggleMDBDoor`,
   `toggleEPSDoor`).
2. Always emit selection instead:
   ```js
   this._emit('objectSelected', data);
   ```
3. Keep `this._emit('objectClick', data)` for compatibility.

Then in `js/app.js`, on `objectSelected`, open the inspector drawer for that object and — when
`data.action` is `toggle` / `toggle_dc_door` / `toggle_mdb_door` / `toggle_eps_door` — show an
explicit action button in the drawer header, e.g. **«قطع / وصل»** or **«باز / بستن درب»**.
Operating happens **only** when that button is pressed.

Doors may also stay operable from the existing dedicated door buttons — those are explicit
controls, so they are fine.

**Verify:**
1. Click every breaker in the 3D scene → **nothing switches**; the inspector opens each time.
2. Press the drawer's action button → the breaker operates, and the 3D lever animates.
3. Drag to orbit across several breakers → **nothing switches**.
4. The SBY dial → selects only; position changes only via the I/0/II buttons.

**Commit:** `step-9: separate selection from operation in 3D`

---

### 🔍 REVIEW GATE 6 — stop here

---

### PHASE 5 — One cabinet, end to end

---

#### Step 10 — Rewrite `isolateSubsystem()` safely ⚠️ do not wire it before rewriting

**Goal:** the existing method is unsafe: it mutates **shared** materials (so dimming one mesh
dims every mesh using that material), its descendant test is only one level deep
(`g.children.includes(obj) || obj.parent === g`), and its reset path forces
`transparent = false` on every mesh — which breaks glass doors and any legitimately transparent
material.

**Do:** Replace the method body in `js/scene-3d.js` (around line 3843):

1. On first dim, store each mesh's original values **on the mesh**:
   ```js
   if (obj.userData._origMat === undefined) {
     obj.userData._origMat = { opacity: obj.material.opacity, transparent: obj.material.transparent };
   }
   ```
2. **Clone the material before mutating it** — `obj.material = obj.material.clone()` — so shared
   materials are never altered. Do this once, guarded by a `userData._matCloned` flag.
3. Use `group.traverse()` to collect **all** descendants, not just direct children.
4. On reset, restore from `userData._origMat` rather than forcing `transparent = false`.

**Verify:**
- Call `sceneInstance.isolateSubsystem('mdb')` from the console → only the MDB stays bright.
- Call `sceneInstance.isolateSubsystem('all')` → **everything returns to its original
  appearance**, including glass doors, which must still look like glass.
- Repeat 5 times in a row → no visual drift, no progressively darkening meshes.
- Check FPS is unchanged (material cloning adds draw calls; report if it drops).

**Report:** a screenshot before, during isolation, and after reset.

**Commit:** `step-10: safe isolateSubsystem with material clone + restore`

---

#### Step 11 — One cabinet, fully understandable

**Goal:** prove the inspection experience on the **MDB only**. Do not generalise yet.

**Do:**
1. Add a **"بازگشت به نمای قبلی"** (return to previous view) button. Before any camera preset
   change, push the current camera position + target onto a one-slot stack; the button pops it.
2. When focusing the MDB: open its door, and hide floating labels belonging to other groups.
3. In the inspector, add a single-line state summary at the top, generated from live state:
   **"از کجا تغذیه می‌شود / چرا خاموش است"** — e.g. «تغذیه از BUS-G از طریق Q1 — برق‌دار»
   or «بی‌برق — Q1 باز است».
4. Label values honestly: live values as-is; fixed catalogue values tagged
   **«مشخصات مرجع»**; unavailable values as **«مدل نشده»**.
   **Never display 0 where the value is actually unknown.**
5. Ensure the inspector panel does **not** cover the selected equipment — offset the camera
   target, or place the panel on the opposite side.

**Verify:** select MDB → focus → door opens → inspector shows the summary line → change a
scenario and confirm the open inspector **updates** → press return → camera goes back to the
previous view with selection intact.

**Commit:** `step-11: MDB cabinet inspection flow`

---

### 🔍 REVIEW GATE 7 — the core experience is proven on one cabinet. Stop here.

---

### PHASE 6 — Interface declutter

> Everything below is valuable but **not** part of the 3–4 day commitment. Proceed only if the
> earlier phases are complete and reviewed.

---

#### Step 12 — Collapse 11 modal buttons into one menu

**Do:** Replace the 11 `.btn-header-action` buttons with a single **«ابزارها و مراجع»** dropdown
containing the same 11 entries. Do not delete any modal — only change how they are reached.
Keep the sound toggle separate.

**Verify:** all 11 modals still open. Header control count drops from 16 to about 6.

**Commit:** `step-12: consolidate header actions into Tools menu`

---

#### Step 13 — Telemetry strip

**Do:** Replace the 7 telemetry cards with one compact strip: **Solar · Battery · Grid · Loads**,
showing value + unit + a plain-language state word («در حال شارژ», «صادرات به شبکه»). Clicking a
segment opens details. Move V / A / efficiency into the detail view.

**Verify:** vertical space used drops from about 91 px to about 48 px. All values still update.

**Commit:** `step-13: unified telemetry strip`

---

#### Step 14 — Side panel becomes a collapsible drawer

**Do:** Convert `.left-cockpit-panel` (320 px, always visible, actually on the right in RTL) into
a drawer that is **closed by default**, with three sections: *Scenario* (sliders) · *Switching*
(SBY, breakers) · *Advanced* (the 9 faults). Delete the 8-button quick bar — its functions
duplicate the viewpoint buttons. Keep Home / Focus / open-cabinet as **visible buttons**;
keyboard shortcuts are additions, not replacements.

**Also fix V12 here.** Six buttons — `btn-camera-front`, `btn-camera-reset`,
`btn-toggle-enclosure-shell`, `btn-toggle-dc-door`, `btn-toggle-mdb-door`, `btn-toggle-eps-door` —
share the `.btn-viewpoint` class without being viewpoints, so clicking one steals the amber
`.active` highlight from the real current viewpoint. Give them their own class (e.g.
`.btn-sceneaction`) with its own styling, and narrow the `camButtons` selector to genuine
viewpoints. The Step 5 guard can then be removed as redundant — but only once the selector
is narrowed, not before.

**Verify:** at 1920×1080 the 3D view occupies ≥ 80 % of the viewport with the drawer closed.
At 1366×768 all core controls remain reachable. At 200 % browser zoom nothing becomes
unreachable.

**Commit:** `step-14: collapsible control drawer`

---

### PHASE 7 — Multiple system families ⚠️ **scope expansion — gated**

> Revised 2026-09-13 after a third-party review (Codex-GPT6) corrected seven points in the
> first draft. This supersedes it.

**Owner's requirement:**

| Family | Phases | Power | Topologies |
|---|---|---|---|
| A | single-phase | up to 10 kW *(lower bound not yet stated)* | hybrid · on-grid · off-grid |
| B | three-phase | 5 to 100 kW | hybrid · on-grid · off-grid |

Each needs its SLD **and** its 3D scene. **The owner has not prepared the SLDs yet** and will
supply them in later stages. Do not invent them, and do not build a family before its SLD exists.

**Unit ambiguity to resolve with the owner before anything is built:** do those kW figures mean
**total system AC**, **inverter AC**, or **array DC**? For three-phase, "100 kW" is not 100 kW
*per phase*. Record DC power, battery capacity and each port's limits separately, with units.

---

#### 7.0 Honest sizing

The app today is **one** hardcoded 5 kW single-phase hybrid system. Measured:

| | today |
|---|---|
| `power-model.js` | scalar single-phase; 2×2800 W, 385 V, 230 V, 51.2 V, 5200 W EPS threshold, 5120 Wh all hardcoded |
| `scene-3d.js` | **310 hardcoded `Vector3` coordinates**, 13 `_build*` methods, one physical layout |
| three-phase awareness | **zero** — no `L1`/`L2`/`L3`, no 400 V anywhere |
| SLD-02 "three-phase 15 kW" | a **static picture** — `sld-schematic.js:2206` gates telemetry to SLD-01 |

Three consequences:

1. **The topologies differ structurally, not parametrically.** Hiding the grid mesh does not make
   an off-grid model.
2. **Three-phase is a power-model change**, not a parameter. Largest single item in this phase.
3. **Hand-authoring six layouts is not viable** — 310 coordinates × 6 ≈ 1,860 by hand. The only
   route is **parametric builders driven by an equipment list** (finding **P-05**, previously
   deferred, now a hard prerequisite).

**Power rating is a parameter — but capacity does not imply one equipment arrangement.** Do
**not** ship a free 5–100 kW slider that guesses inverter count, string count or battery racks.
Define **approved configurations** per family with compatibility limits; equipment counts change
in steps, not continuously.

**Do not infer a topology from its name.** Whether a given system has a battery, an EPS port, a
bypass, and how it isolates, comes from **the owner's SLD and equipment specs** — not from the
word "off-grid". Statements like "off-grid always has a mandatory battery" must not become
program-wide contracts.

---

#### 7.1 Two blockers found in the current code — fix before any large family

Both verified by the reviewer on 2026-09-13.

**V13 — particle speed saturates at 5 kW.** `scene-3d.js:4241`:

```js
p.speed = Math.min(0.45, Math.max(0.05, (mag / 5000) * 0.45));
```

| watts | 500 | 2 500 | 5 000 | 10 000 | 50 000 | 100 000 |
|---|---|---|---|---|---|---|
| speed | 0.050 | 0.225 | **0.450** | 0.450 | 0.450 | 0.450 |

On a 100 kW system **every** significant flow renders at the identical maximum speed, so the
animation carries no magnitude information at all. Fix: scale speed **relative to that circuit's
rated capacity**, taken from the profile — not against a hardcoded 5000. Show the real value
beside the selected path.

**V14 — `dispose()` does not release what profile switching needs.** It currently releases the
animation frame, three DOM listeners, the overlay container and the renderer. It does **not**
dispose geometries, materials, the procedural canvas textures, `this.cables` (10 `TubeGeometry`),
`this.animatedParticles` (Points plus buffers), floating labels, `this.switchgear`,
`circuitGraph`, `cameraTransition`, or listeners registered through `this.on()`. Repeated profile
switching will leak GPU memory. Fix this **in Step 15d**, before any switching is exposed.

---

#### 7.2 Sequencing — the prerequisite is not circular

The first draft made "the profile architecture exists" a prerequisite of Phase 7 while also
making it Step 15 *of* Phase 7. Corrected:

| When | What |
|---|---|
| **Now, in parallel with Steps 9–11** | Design the **profile data contract** (§7.3). Paper work; no code changes. |
| **After Steps 9–11 are approved** | Implement 15a–15d against the **existing** 5 kW system. No new SLD needed. |
| **Only when an SLD for that family arrives** | Build and enable that family. |

Steps 9–11 come first because the app must be correct and inspectable for *one* system before it
is generalised to six. Generalising a broken model multiplies the breakage.

**Phase 6 (UI) should land before the third family**, not after — six families on the current
73-control shell means building six sets of panels.

---

#### 7.3 Step 15 — split into four reviewable changes

The first draft made this one large refactor. That is the shape of change that fails. Four steps,
each independently verifiable:

**15a — Data contract, no behaviour change.**
Define `SystemProfile`: id and **version**, phase count, topology, power limits **with units**,
equipment and port list, validation status, and a reference to its SLD **revision**. Keep four
things separate: *equipment and capability* · *electrical connectivity* · *display layout* ·
*SLD mapping*. Express today's 5 kW hybrid as one profile document. **No code reads it yet.**

**15b — Model reads parameters from the profile.**
`power-model.js` takes ratings and presence flags from the profile instead of constants.
*Acceptance:* the 8 golden tests and the energy audit pass **unchanged**. `battery.present:false`
must make the branch vanish, not compute zero.

**15c — Convert the scene incrementally.**
Convert **one** enclosure group to a reusable parametric builder, verify it renders identically,
then the next. Not all 13 at once. *Acceptance after each:* the scene is visually equivalent and
the step is revertible on its own.

**15d — Profile switching and resource cleanup.**
Implement switching, and fix **V14** in the same step. *Acceptance:* switch profiles 20 times;
renderer count, listener count, timer count and GPU memory must not grow. Selection, scenario,
in-flight camera transitions and SBY transfer callbacks all reset.

**Nothing new is added anywhere in 15a–15d.** It is a refactor that must change nothing visible.

---

#### 7.4 Family order — driven by which SLD arrives

The first draft fixed the order. Corrected: the order follows **which SLD the owner supplies**
and which capabilities that family needs.

Guidance rather than a fixed sequence:

- Start with whichever family has an SLD **and** is closest to a subset of the current hybrid —
  a single-phase on-grid system (no battery, no EPS, no SBY) is the cheapest possible proof that
  the profile mechanism works, and fails loudly if it does not.
- The **first three-phase example need not be the most complex hybrid.** A simpler three-phase
  configuration proves the per-phase model at lower risk.
- **Power scaling comes last**, as a parameter sweep across families that already work.
- Each family gets its own scenario tests and its own energy audit before it is called supported.

---

#### 7.5 Three-phase — not "multiply by three"

- **Balanced loads first**, labelled explicitly in the UI as a balanced-load assumption.
- **The data shape carries per-phase state from day one**, even while only the balanced case is
  computed. Retrofitting per-phase fields later is far more expensive.
- Derive **total AC from the phase powers**, and **line-to-line from line-to-neutral** — do not
  store both independently.
- **Keep DC and battery paths separate from AC.** Voltages, battery capacity and inverter limits
  do **not** all triple.
- Unbalanced load and single-phase-loss are **"not modelled"** until they are modelled — never an
  estimated number that looks precise.

---

#### 7.6 SLD intake — do not force the owner to redraw

When each SLD arrives, produce a **mapping table**: drawing identifier ↔ internal
component / port / terminal. The owner should not have to redraw to match internal naming.

Store alongside the profile: **SLD revision number**, equipment specifications, assumptions made,
and an explicit list of **unknowns**.

An SLD alone rarely fixes equipment shape and dimensions. Until photos, catalogue data, enclosure
dimensions and internal arrangement are available, render a **representative model with a clear
label** — never a claim of conformity with the real equipment.

---

#### 7.7 Risks

| # | Risk | Mitigation |
|---|---|---|
| 7a | Per-phase state multiplies model complexity | Balanced-only first, per-phase data shape from the start (§7.5) |
| 7b | A 100 kW array is hundreds of modules; the scene adds meshes individually | `THREE.InstancedMesh` **before** any large family. Measure draw calls and GPU memory, not just file size |
| 7c | **V13** — flow animation carries no information above 5 kW | Scale to circuit capacity from the profile (§7.1) |
| 7d | **V14** — repeated profile switching leaks GPU memory | Fix in 15d, with a 20-switch stability test (§7.1) |
| 7e | Camera framing tuned for a small equipment room | Auto-frame from equipment bounds and the free space beside the inspector. Home distance and clipping planes must not assume one scale |
| 7f | Owner SLDs may not match internal naming | Mapping table per SLD (§7.6). Agree the ID contract **before the second SLD is drawn** |
| 7g | Scope creep into electrical design | The owner owns topology, protection ratings and earth/neutral bonding for **every** family. Agents implement; they do not choose |
| 7h | Claiming support for a whole range after testing one point | A family is "supported" only for its **approved configurations**, each with passing tests |

---

#### 7.8 3D presentation target

**Three view levels, identical across every family:**
**system overview → equipment and cabinets → inside a cabinet and its terminals.**
Equipment and layout come from the profile; the interaction model does not change.

- **Small single-phase:** the existing room model is reusable. Equipment absent from the profile
  must be **removed**, not left showing assumed values.
- **Three-phase and larger:** multiple units and appropriately sized enclosures. Do **not** scale
  up a 5 kW inverter mesh and label it 100 kW. Shape, count and terminals follow the equipment
  list; purely decorative detail may stay simple.
- **Large arrays:** show rows and groups with clear counts; select one string for detail.
  Instancing required (7b).
- **Phase highlighting:** let the viewer highlight one path or phase; label L1/L2/L3 and neutral
  clearly. Never infer the presence of a neutral or a protection type from the picture alone.
- **A profile with no SLD yet** may appear in the selector as *"awaiting drawing"* — but must not
  run a simulation or display invented numbers.

---

#### 7.9 Decisions needed from the owner

1. **Units** — do the kW figures mean total AC, inverter AC, or array DC? *(blocks 15a)*
2. **One app with a profile selector, or separate builds?** — recommended: **one app**
3. **Three-phase depth** — balanced-only first? — recommended: **yes**
4. **3D fidelity at 100 kW** — representative or equipment-accurate? — recommended:
   **representative**
5. **ID contract** — agree naming **before the second SLD is drawn** (7f)
6. **Lower bound** of the single-phase range

**Estimate:** do not attach this phase to the earlier 3–4 day figure. Re-estimate after 15a–15d
are complete and the first new SLD has arrived.

### PHASE 8 — Owner drawing set: intake, offline viewer, tag mapping ⬅️ **next**

> Added 2026-09-14. Owner request, three features:
> **(1)** change the app's elements to match the supplied single-phase SLD, and embed that drawing
> set **with its guide** inside the app — single-phase only for now;
> **(2)** make positive/negative and phase/neutral/earth conductor order and colour follow the
> international identification rules;
> **(3)** make the equipment look real — use the supplied product imagery instead of lifeless
> primitives.
>
> Feature 1 is split: **Phase 8** brings the documents in and builds the mapping; **Phase 9**
> changes the elements. Feature 2 is **Phase 10**. Feature 3 is **Phase 11**. Nothing in Phase 8
> touches the simulation, the power model, or the existing SLD.

---

#### 8.0 What arrived, and what the documents say about themselves

Two HTML documents, both authored by the owner, both single-phase:

| File | Id / Rev | Size | SHA-256 (first 8) | Sheets / figures |
|---|---|---|---|---|
| `SLD_Hybrid_SinglePhase_BaseDrawingSet.html` | `HYB-1PH-SLD-SET` / REV 00 / 2026-09-12 | 191,647 B | `ba1b573c` | 10 sheets `s00`–`s09`, 12 `<svg>` |
| `HYB-1PH-CFG-001.html` | `HYB-1PH-CFG-001` / REV 00 / 2026-09-13 | 217,410 B | `67a9c1f2` | 10 `<svg>`, 8 configurations HY-1…HY-8 |

**Read the status lines before using either.** They are the documents' own words, not an
instruction to this project:

- The drawing set carries a banner: «این مدرک جایگزین شده است — SUPERSEDED», superseded by
  `HYB-1PH-CFG-001`, and is described there as kept only for drafting and symbol history, not as
  a basis for classification or acceptance.
- Both documents are **`NOT APPROVED`** — «تأیید نشده — برای اجرا نیست».
- The drawing set is drawn from a work instruction **`HYB-1PH-FA-REV02`, steps 0–23**, which is
  **not among the supplied files**. Every sheet cites it. We do not have it.
- Sheet 08, table 08-1 has an intentionally empty «مقدار» column — it is a decision sheet, not a
  purchase list. Several devices are marked «مشروط» (conditional): `F11 F12 F21 F22`, `F13 F23`,
  `K5`, `RCD7`, `Q9`, `SPD-EPS`, `SPD-DAT`. Others are marked ▲ — a required function whose
  realisation is only proven by the selected product's documentation.

**Consequence for the app.** This is a reference set at REV 00, not an as-built drawing. The
viewer must reproduce the banners verbatim, and the app must never present these sheets as an
approved construction drawing. Same rule as §7.6.

`HYB-1PH-CFG-001` is included even though the owner asked only for "the single-phase drawing":
the drawing set declares itself superseded **by that document**, so shipping one without the other
would misinform the reader. CFG-001 also classifies installations on two axes — **T** (how the
island board is fed: T1 internal transfer / T2 external transfer) and **C** (how the battery is
charged: C1 grid charging allowed / C2 physical separation / C3 supervised blocking) — producing
the eight configurations HY-1…HY-8. §9.1 uses that to classify the five registered profiles.

**Images supplied, and what they are.** Two files, identical except for the timestamp
(`ChatGPT Image Sep 8, 2026, 03_31_20/40 PM.png`, SHA `20ab7fc4`) plus one earlier variant
(`03_18_51 PM.png`, SHA `6c3fa127`). They are **AI-generated system illustrations**, not product
photographs: generic "BMS" / "Hybrid Inverter" faces, idealised harnesses, no manufacturer or
model. They are **excellent as the conductor-colour and layout reference for Phase 10** — both
carry an explicit *CABLE COLOR & TYPE LEGEND* — and they are **not** usable as a texture source,
nor as evidence that any real product looks like this (§11.2). The orthographic **gPV fuse-holder**
views discussed in the owner's review are **not present in the intake folder**; Phase 11's pilot
device cannot start until they arrive.

---

#### 8.1 What the app has today — measured, not assumed

| | measured |
|---|---|
| SLD viewer | `js/sld-schematic.js` (159 KB) renders 6 tabs: `SLD-01`, `SLD-02`, `SLD-03`, `DC-01-02`, `E-01`, `C-01`. **On the never-modify list (§B).** |
| Live telemetry on drawings | gated to one tab — `sld-schematic.js:2206` returns early unless `currentTab === 'SLD-01'` |
| Modal wiring | `app.js:2218 setupSLDModal()` (tab strip → `SLDSchematic.switchTab`), `app.js:2353 setupGuideModal()` |
| The "guide" entry | `btn-open-guide` is the **37-chapter HYB-FA-001 Rev B reader**, backed by `guide-data.js` — which also feeds the **exercises** (`app.js:2502`) and the **48-row disputes table** (`app.js:2694`). It is not a drawing guide. |
| Tools menu | 11 entries, `index.html:69-79` |
| Fonts | local Vazirmatn only (4 weights, base64 in `css/fonts.css`). No IBM Plex. |
| Bundler | `build.js` inlines **only** `<link rel=stylesheet>` and `<script src>` from `index.html`, then hard-fails on any `href=` / `src=` / `url(` / `@import` pointing at `http(s)://`, on any protocol-relative URL, and on fewer than 4 inlined `woff2` faces. |

Both supplied documents load **Google Fonts** (`Vazirmatn` + `IBM Plex Mono` + `IBM Plex Sans
Condensed`). Pasted in as-is, `node build.js` **will throw** on the integrity check. That is the
gate doing its job, not a problem to route around.

Each document also ships **one `<script>` block** (~169 lines in the drawing set) implementing a
fullscreen zoom viewer: `position:fixed; inset:0; z-index:9999`, appended to `document.body`, with
`document.addEventListener('keydown')`, `window.addEventListener('resize')` and `beforeprint`.
Inlined into `index.html` it would capture the app's keyboard and sit above every modal.

---

#### 8.2 The owner's reviewer (Astra) on this work — adopted, corrected, rejected

| # | Astra's point | Verdict here |
|---|---|---|
| 1 | Render the documents inside an isolated `iframe`, not pasted into the page | **Adopted** — and now verified: the fixed `z-index:9999` overlay and the document-level `keydown` handler are the concrete reasons (§8.1) |
| 2 | Keep the SVG sheets as SVG so zoom stays sharp | **Adopted** |
| 3 | Strip Google Fonts, embed the project font, bundle at build time, leave no reference to a `Downloads` path | **Adopted** — Step 17 |
| 4 | Do not auto-wire the old live telemetry or breaker commands to the new symbols; ids and topology differ | **Adopted, and hardened**: the new viewer is **read-only for the whole of Phase 8** |
| 5 | Do not delete `guide-data.js` | **Adopted** — confirmed: it feeds chapters **and** exercises **and** the disputes table |
| 6 | Reuse the two existing entries: "single-line drawing" → sheet 01, "single-phase drawing guide" → sheet 00 | **Corrected.** There is no "single-phase drawing guide" entry. `btn-open-guide` is the 37-chapter HYB-FA-001 reader (§8.1); repointing it would delete a working feature. Phase 8 adds **new** entries instead (Step 18). |
| 7 | A photo alone cannot replace the 3D model; build the body, use the corrected image for surface detail; the supplied gPV views disagree on screw count and carry placeholder dimensions | **Adopted** — it is the backbone of §11.1 and §11.2 |
| 8 | Order of work: drawing tags → equipment & terminal list → dimensions and rail position → cable route → simulation binding; never map SLD coordinates onto panel coordinates | **Adopted** — it is the Phase 8 → 9 → 10 → 11 order |

---

#### 8.3 Decisions fixed here, so no step has to invent one

1. **Payload form.** The documents become one generated JS file, `js/doc-set-1ph.js`, exposing
   `window.OWNER_DOCSET_1PH = { drawingSet, configStandard, meta }` as `JSON.stringify`-encoded
   strings. Reason: `build.js` inlines `<script src>` and nothing else, so a `.js` file is the
   only form that survives bundling untouched.
2. **Rendering.** One `<iframe sandbox="allow-scripts">` whose `srcdoc` is assigned from JS. No
   `allow-same-origin`: the frame gets an opaque origin, its own zoom script still runs, and it
   cannot reach into the app. Assigning `srcdoc` as a property avoids attribute escaping.
3. **Generated, not hand-edited.** `scripts/build-docset.js` reads the two source files and
   applies exactly the transforms listed in Step 17. The originals are archived byte-for-byte
   under `docs/owner/` and are **never** edited.
4. **Read-only.** Phase 8 adds no click-to-operate, no telemetry, no breaker binding on the new
   sheets. Those need the mapping (Step 19) and the owner's sign-off.
5. **Entry points.** A **new** modal and two new ways in; nothing existing is repointed (§8.2 #6).
6. **Font substitution is a recorded deviation.** Vazirmatn is available locally; IBM Plex Mono
   and IBM Plex Sans Condensed are not. They fall back to a local stack. The deviation is written
   into `docs/owner/README.md` and shown in the viewer's provenance strip, not hidden.

---

#### Step 19 numbering note

Steps 16–19 belong to Phase 8, 20–22 to Phase 9, 23–26 to Phase 10, 27–31 to Phase 11. Phase A
(visual fidelity, already executed) is recorded in `work.md` but has no step number; do not
renumber it retroactively.

---

#### Step 16 — Intake and provenance (no app change)

**Do:**
1. `docs/owner/` — copy both HTML files **unmodified**. Record for each: filename, document id,
   revision, date, declared status, SHA-256, byte size.
2. `docs/owner/README.md` — a provenance page containing:
   - the table above, with the verbatim SUPERSEDED / NOT APPROVED wording for each document;
   - **missing references**: `HYB-1PH-FA-REV02` (the work instruction all ten sheets cite) and
     the empty «مقدار» column of table 08-1;
   - the image intake table: the two AI-generated illustrations, what they are good for
     (conductor colour reference) and what they are not (product evidence);
   - an explicit **"not received yet"** list: gPV orthographic views, real product photographs,
     enclosure dimensions.
3. `docs/owner/**` is already never-modify under the §B amendment of 2026-09-14 — confirm the
   copies are byte-identical to the sources, then never touch them again.

**Verify:**
```bash
sha256sum docs/owner/*.html
node -e "const f=require('fs');for(const n of f.readdirSync('docs/owner').filter(x=>x.endsWith('.html')))console.log(n, f.statSync('docs/owner/'+n).size)"
```

**Acceptance:** the two SHA-256 values equal `ba1b573c…` and `67a9c1f2…` from §8.0. No file in
`js/`, `css/` or `index.html` changed in this step.

---

#### Step 17 — Offline payload generator

**Do:** write `scripts/build-docset.js`. Input `docs/owner/*.html`, output `js/doc-set-1ph.js`.
Transforms, and **only** these:

| # | Transform | Why |
|---|---|---|
| T1 | Delete the Google Fonts `<link>` element | `build.js` integrity gate (§8.1) |
| T2 | Insert, at the top of the document's own `<head>`, a `<style>` carrying the project's four base64 Vazirmatn `@font-face` rules taken from `css/fonts.css` | keeps Persian text correct offline |
| T3 | Append one CSS rule mapping `IBM Plex Mono` to a local monospace stack and `IBM Plex Sans Condensed` to the Vazirmatn stack | those two faces are not licensed into this repo |
| T4 | Escape any `</script>` inside the emitted JS strings | the payload is inlined into a `<script>` at build time |
| T5 | Emit `meta` per document: `{ id, rev, date, status, supersededBy?, sha256, sourceBytes, generatedAt, transforms:[…] }` | the viewer shows provenance from data, not from a hardcoded string |

Nothing else: no re-wording, no restyling of sheets, no removal of the SUPERSEDED banner, and no
removal of the `claude.ai` reference URL that appears **as plain text** inside that banner — it is
not an `href`, so `build.js`'s regex does not match it. **Confirm that by running the build; do
not assume it.**

**Verify:**
```bash
node scripts/build-docset.js
grep -c "fonts.googleapis.com" js/doc-set-1ph.js
grep -c "SUPERSEDED" js/doc-set-1ph.js
node -e "global.window={};require('./js/doc-set-1ph.js');const d=window.OWNER_DOCSET_1PH;console.log(Object.keys(d));console.log(d.drawingSet.length,d.configStandard.length);console.log(JSON.stringify(d.meta,null,1))"
node build.js
```

**Acceptance:** first grep `0`, second grep `>= 1`. The generator is deterministic — run it twice,
`sha256sum js/doc-set-1ph.js` identical. `node build.js` prints `INTEGRITY CHECK PASSED` with
**External network requests: 0**. Bundle size recorded. **Budget: `dist/solar-app.html` ≤ 4.0 MB
after this step** (baseline 2,806,710 B + roughly 0.45 MB of payload).

**If the integrity check fails, stop and paste the failure.** Do not delete document content to
get past it.

---

#### Step 18 — In-app document viewer

**Do:**
1. `index.html` — a new modal `#docset-modal` following the existing modal markup, containing:
   - a **document selector**: «مجموعه نقشه تک‌فاز (HYB-1PH-SLD-SET)» | «استاندارد پیکربندی
     (HYB-1PH-CFG-001)»;
   - a **sheet selector** for 00–09 with the real titles — 00 conventions · 01 main SLD ·
     02 DC protection panel · 03 battery · 04 BMS safety chain · 05 neutral and N-PE ·
     06 PE network · 07 EPS board · 08 equipment and mode tables · 09 open items;
   - a **provenance strip** rendered from `meta`: id · rev · date · **NOT APPROVED** ·
     superseded-by where present · "read-only reference — not wired to the simulation" ·
     the font-substitution note;
   - `<iframe id="docset-frame" sandbox="allow-scripts">`.
2. `index.html` — two entries; no existing entry repointed:
   - tools menu `btn-open-docset` «📐 مجموعه نقشه و استاندارد پیکربندی تک‌فاز (مالک)» → opens at
     the drawing set, sheet 00;
   - SLD modal tab strip `data-tab="OWNER-1PH"` «مجموعه نقشه مالک (تک‌فاز)» → opens the docset
     modal at sheet 01.
3. `js/app.js` — `setupDocsetModal()`, called alongside the other setups. Assign `frame.srcdoc`
   once per document switch. For sheet jumps, prefer the simplest mechanism that works with an
   opaque origin, and **record in `work.md` which one you used and why** — the document's sheets
   already carry `id="s00"`…`id="s09"`, and the acceptable options are (a) let the reader scroll
   from the document's own index, or (b) append a one-line scroll shim to the payload at generate
   time. Do not add a second copy of the document per sheet.
4. `js/app.js` — in `setupSLDModal()`, intercept `data-tab="OWNER-1PH"` **before** the
   `SLDSchematic.switchTab(tabId)` call, so the protected module never receives an unknown tab id.
5. `css/styles.css` — modal sizing; the frame fills the body; `border:0`.

**Never in this step:** `js/sld-schematic.js`, `js/guide-data.js`, `js/electrical-db.js`, the power
model, the 3D scene.

**Verify:** `scripts/verify_step18.js`, same headless-Chrome CDP harness as
`scripts/verify_phase6_7.js`, run against **`dist/solar-app.html` from `file://`** — the bundle is
what ships, so the bundle is what gets tested.

| Check | Assertion |
|---|---|
| 18-1 | `#docset-modal` opens from the tools entry and from the SLD tab |
| 18-2 | `docsetFrame.contentDocument === null` — opaque origin, proving the sandbox |
| 18-3 | For each of the 10 sheets: switch, screenshot, assert rendered height > 0 and at least one `<svg>` painted |
| 18-4 | Persian text renders in Vazirmatn, not a fallback — sample a glyph run and assert the measured width |
| 18-5 | `performance.getEntriesByType('resource').filter(r => /^https?:/.test(r.name)).length === 0` |
| 18-6 | With the viewer open, `Escape` still closes the app modal, and the frame's zoom keys do not reach the app |
| 18-7 | The 11 pre-existing tools entries all still open their modals |

**Report integrity — this is now a rule, not advice (`REVIEW.md` §3).** Every check above must be
shown to **fail** on a deliberately broken variant, and that failing output pasted into `work.md`
beside the passing output. A check that cannot fail is not evidence. Three of the five Phase 6/7
checks were of that kind, and two defects were closed on them.

**Evidence:** `evidence/phase8/step18_sheet00.png` … `step18_sheet09.png`, plus
`step18_config_standard.png`.

**Acceptance:** 10 sheets and the configuration standard readable from the bundle, opened from a
folder other than the repo, network disabled; zero external requests; the 11 existing tools
entries unaffected; `node tests/power-model.test.js` still 16/16.

---

#### Step 19 — Drawing tag ↔ internal id mapping table

The deliverable that unlocks Phases 9, 10 and 11. Paper plus data — **no behaviour change**.

**Do:**
1. `docs/owner/mapping-1ph.md` — one row per drawing tag from table 08-1:
   **drawing tag · function as written in 08-1 · conditional? · internal breaker/state id ·
   `system-profile` path · 3D object · status · note**.
   Status ∈ `matched` · `renamed` · `collapsed` (several drawing devices → one app object) ·
   `missing` (in the drawing, absent from the app) · `extra` (in the app, no tag in the drawing) ·
   `out-of-scope` (the drawing itself defers it).
2. `js/system-profile.js` — add to the canonical single-phase hybrid profile **only**:
   `sldMapping.ownerDrawingSet = { docId:'HYB-1PH-SLD-SET', rev:'00', status:'NOT_APPROVED',
   supersededBy:'HYB-1PH-CFG-001', tags:{ … } }`. Data only; **nothing reads it yet** — the 15a
   pattern.
3. Extend `tests/power-model.test.js`: every `tags` entry has a status from the enum, and every
   `matched` / `renamed` / `collapsed` entry names an id that exists in the profile.

**Draft to start from** — the plan author's reading of table 08-1 against the code, produced by
grepping the sources on 2026-09-14. It is a **draft for the owner to correct**, not a conclusion:

| Drawing tag | Function (08-1) | Internal id | 3D | Status |
|---|---|---|---|---|
| `PV1` `PV2` | one string per MPPT | `pvArray.strings[0..1]` | `_buildRoofAndPVArray` | matched |
| `F11 F12 F21 F22` | gPV string fuses — **conditional** | `FPV1_POS/NEG`, `FPV2_POS/NEG` | 4 holders in the DC box | matched — **but the app shows them unconditionally; the drawing requires a justification decision** |
| `Q11` `Q21` | DC load-break isolators | `dc_iso_1`, `dc_iso_2` (aliases `dc_isolator`, `qpv_isolator`) | 2 rotary isolators | renamed — app calls them `QPV1/QPV2` |
| `SPD11` `SPD21` | DC surge arresters | `DC_SPD_1`, `DC_SPD_2` | 2 SPDs | matched |
| `F13` `F23` | SPD backup fuses — conditional | — | — | **missing** — the app's `fspd_mcb` is AC-side and already labelled illustrative (Step 8) |
| `XT1` `XT2` | DC panel in/out terminals | `dc_terminal_block` | one block | collapsed (2 → 1) |
| `INV1` | single-phase hybrid inverter | `inverter` | `_buildHybridInverter` | matched |
| `MPPT1` `MPPT2` ▲ | independent inputs and current limits | `inverter.ports.pv1Input/pv2Input` | internal modules | matched |
| `RCMU` ▲ | residual monitoring inside the converter | — | — | missing — 08-3 warns it is **not** a substitute for a final-circuit RCD |
| `SDFI` ▲ | isolation from the grid for island operation | — | — | missing — affects sheet 05's neutral story |
| `SRCSD` ▲ | system reference conductor switching | — | — | missing — interlocked with SDFI |
| `BT1` `BT2` | battery packs | `batteryStorage` | 5 modules drawn | shape differs (5 drawn vs 2 tagged) |
| `BMS1` | monitor, limit, safety trip | `bms` mesh | present | partial — **geometry only, no behaviour** |
| `F5` | main battery OCPD | `battery_ocpd` | — | **collapsed** — `scene-3d.js:4193` maps `battery_ocpd` *and* `battery_qb` onto one object, `bat_breaker` |
| `Q5` | lockable battery isolator, LOTO point | `battery_qb` | — | **collapsed** — same object as `F5` |
| `K5` `K5P` `R5` `F5P` | main DC contactor and precharge — conditional | — | — | missing |
| `F5C` | control supply protection | — | — | missing |
| `Q0` / `MTR` | service switch and metering | `q0_mcb`, `smart_meter` | MDB + meter | matched |
| `Q7` | GRID feeder protection | `grid_mcb` / `grid_incomer_mcb` | MDB | renamed |
| `RCD7` | GRID feeder RCD — conditional | — | — | missing |
| `F-SPD` / `SPD-AC` | AC arrester and its backup | `ac_spd`, `spd_backup_mcb` | MDB | matched |
| `SPD-EPS` | EPS-side arrester — conditional | — | — | missing |
| `SPD-DAT` | data-line arrester — conditional | — | — | missing |
| `Q8` | EPS output protection and isolation | `eps_mcb` / `eps_incomer_mcb` | EPS board | renamed |
| `Q9` | bypass — conditional, interlocked with `Q8` | `sby_switch` (I-0-II) + `qbp_mcb` | SBY changeover | **shape differs** — drawing: bypass switch with interlock; app: 3-position manual changeover |
| `Q81 … Q8n` | EPS final-circuit RCBOs | `crit_rcbo_1`, `eps_rcd`, `qe_mcb`, `qo_mcb` | EPS board | partial |
| `EPSB` | EPS distribution board | `epsDistributionBoard` | `_buildEPSDistributionBoard` | matched |
| `MET` / `PE` | main earth terminal and PE network | `met_busbar`, `pe_bar_mdb`, `pe_bar_eps`, `dc_pe_bar` | present | matched |
| `WD-PV` `WD-BAT` `WD-GRID` `CN-PV` | cables and string connectors | `circuits[*].conductorSpec` | 10 tubes | partial → Phase 10 |
| `ES1` | emergency stop | — | — | out-of-scope — the drawing itself defers it (sheet 09) |
| — | non-critical loads MCB | `qn_mcb` | MDB | **extra** — no counterpart in 08-1 |

**Verify:**
```bash
node tests/power-model.test.js
node -e "global.window={};require('./js/system-profile.js');const p=window.SystemProfileRegistry.get('profile-hyb-1p-5kw-v1');const t=p.sldMapping.ownerDrawingSet.tags;const c={};for(const k in t)c[t[k].status]=(c[t[k].status]||0)+1;console.log(c)"
```

**Acceptance:** the status counts are printed and pasted; every `missing` row carries a one-line
note on what the app would have to gain; every `conditional` row says what evidence table 08-1
demands. The table then goes to the owner.

---

#### 8.4 What Phase 8 deliberately does not do

- It does not change one line of the power model, the 3D scene, or `sld-schematic.js`.
- It does not make the new sheets clickable or live.
- It does not claim the app matches the drawing. Step 19's output is the honest gap list.
- It does not import the three-phase story. Single-phase only, as asked.

#### 8.5 Risks

| # | Risk | Mitigation |
|---|---|---|
| 8a | 0.45 MB of documents slows first paint | Measure `DOMContentLoaded` before and after in Step 18; the payload stays an inert string until the modal opens |
| 8b | The sandboxed frame's zoom script fights the app's keyboard | Check 18-6; the opaque origin means it cannot reach the app document |
| 8c | A NOT-APPROVED REV 00 drawing read as authoritative | Provenance strip rendered from `meta`, not typed; every 18-3 screenshot includes it |
| 8d | Mapping guessed rather than agreed | Step 19's output goes to the owner; Gate 8 does not pass on the implementer's reading alone |
| 8e | Two clones of the repo — work lands in the stale one | The status header names the live path; the first Verify line of every step prints `git rev-parse HEAD` |

---

### 🔍 REVIEW GATE 8 — documents in, mapping agreed. Stop here.

Passes only when **all** hold:

1. Steps 16–19 each have their own commit and their own `work.md` entry with a **real hash**.
2. `dist/solar-app.html` opens from another folder with the network disabled; 10 sheets and the
   configuration standard readable; zero external requests; ≤ 4.0 MB.
3. Every Step 18 check has a recorded failing run on a deliberately broken variant.
4. `REVIEW.md` §7 items 1–6 are done, and **V12 and V14 are re-verified by checks that can fail.**
5. The owner has returned `docs/owner/mapping-1ph.md` with corrections, and every `conditional`
   row carries the owner's decision: present · absent · justified later.

**Phases 9, 10 and 11 do not start before this gate.**

---

### PHASE 9 — Elements reconciled to the drawing set ⏸ gated on Gate 8

> Feature 1, second half: *"change the elements to match the sent SLD."* This phase spends the
> mapping table. It changes what exists in the model and in the scene, so **every row it acts on
> must carry the owner's decision from Gate 8.** §B still holds: topology, protection ratings and
> earth/neutral bonding are the owner's calls, not the implementer's.

---

#### 9.1 Classify the five registered profiles against CFG-001

CFG-001 classifies an installation by observation on two axes (§8.0) into HY-1…HY-8. The registry
currently holds five profiles — `profile-hyb-1p-5kw-v1`, `profile-ong-1p-5kw-v1`,
`profile-hyb-1p-10kw-v1`, `profile-off-1p-5kw-v1`, `profile-hyb-3p-15kw-v1` — none of which carries
a configuration class.

The canonical 5 kW hybrid looks like **T2** (an external I-0-II changeover selects between grid and
inverter output) with grid charging permitted, which would be **HY-3**. *Looks like* is not a
classification: CFG-001 says T and C are determined by evidence, not by intent. So the work is:
record a **proposed** class per profile with the evidence line that supports it, and let the owner
confirm. A profile whose class the owner has not confirmed shows «کلاس پیکربندی: تأییدنشده» in the
UI rather than a class it has not earned.

The three-phase profile is out of scope here — CFG-001 is single-phase.

---

#### Step 20 — Profile-side reconciliation (data only, no behaviour change)

**Do:** for the single-phase hybrid profile only:

1. Every equipment entry gains `ownerTag` (the drawing identifier), `presence` ∈
   `required` · `conditional` · `absent`, and `evidence` — the sheet or table row the decision
   came from. `conditional` carries the criterion that table 08-1 names.
2. **Split the two collapsed devices.** `F5` (battery OCPD) and `Q5` (lockable isolator, the LOTO
   point) are separate devices in the drawing and separate states in `app.js`
   (`battery_ocpd`, `battery_qb`) but one 3D object today. Give each its own equipment entry now;
   the geometry follows in Step 21.
3. Rows the owner marked **present** and the app lacks get an entry with `presence:'required'` and
   `modelled:false` — visible in the mapping report as work outstanding, never silently dropped.
4. Rows the owner marked **absent** are recorded as `absent` **with the owner's reason**, so the
   next reader does not re-open a settled question.
5. Add `configurationClass: { proposed:'HY-n', confirmed:false, evidence:'…' }` per §9.1.

**Never in this step:** the power model's arithmetic. A device that is data-only must not start
changing a number. `presence:'absent'` must make a branch **vanish**, not compute zero — the
15b rule.

**Verify:**
```bash
node tests/power-model.test.js
node -e "global.window={};require('./js/system-profile.js');const p=window.SystemProfileRegistry.get('profile-hyb-1p-5kw-v1');let n=0,m=0;JSON.stringify(p,(k,v)=>{if(k==='ownerTag')n++;if(k==='modelled'&&v===false)m++;return v});console.log({ownerTag:n, notModelled:m, cls:p.configurationClass})"
```

**Acceptance:** 16/16 tests still pass, unchanged. The energy audit is byte-identical to before the
step — this step must not move a single watt.

---

#### Step 21 — 3D: add, split and mark devices — one device family per commit

**Do**, in this order, each as its own commit, each independently revertible:

| # | Change | Note |
|---|---|---|
| 21a | Split `bat_breaker` into two selectable objects: `F5` battery OCPD and `Q5` lockable isolator | `scene-3d.js:4193` currently aliases both ids to one mesh; the alias stays working until the split lands, then is removed |
| 21b | Devices the owner confirmed **present** and the app lacks — geometry, DIN-rail position, selectable `userData` | only rows carrying an owner decision |
| 21c | **Conditional** devices get a visible conditional marker in the inspector, not a silent one | e.g. string fuses `F11 F12 F21 F22`: the drawing requires a reverse-current justification before they are mandatory |
| 21d | Devices the owner marked **absent** are removed from the scene, not hidden behind opacity | §7.8: equipment absent from the profile must be removed, not left showing assumed values |

**Camera, selection and isolation must keep working** after each commit: `focusSubsystem`,
`isolateSubsystem`, the drawer's action button and the >20 px drag suppression (Step 9) are
regression surface here.

**Verify** per commit, via the CDP harness:

| Check | Assertion |
|---|---|
| 21-1 | Every new object is selectable and its drawer shows the drawing tag |
| 21-2 | Clicking a new object **selects only** — it does not operate switchgear (Step 9's invariant) |
| 21-3 | `isolateSubsystem` then reset restores every original material — compare material uuid sets before and after |
| 21-4 | Object, geometry and material counts before/after are printed, with the expected delta for that commit |
| 21-5 | 20 profile switches: renderer, listener, timer and disposal counts do not grow — the V14 test that was never really run |

Each check demonstrated to fail on a broken variant, as in Step 18.

**Acceptance:** the scene matches the owner-confirmed rows of `mapping-1ph.md`, one commit per
family, and no row moves from `missing` to `matched` without geometry **and** an owner decision.

---

#### Step 22 — Drawing tags become the primary label

**Do:** floating labels, the inspector drawer and the "why is this off / where is this fed from"
one-liner show **`ownerTag` first**, the internal name second, and cite the sheet the device comes
from (for example `Q5 · جداساز قابل قفل باتری · شیت 03`). Source of truth is the profile, not a
string typed into the scene.

**Known and accepted inconsistency:** `js/sld-schematic.js` keeps its own tag vocabulary
(`q0_mcb`, `qg_mcb`, `qn_mcb`, …) because it is on the never-modify list. After this step the 3D
scene speaks the owner's tags and the built-in SLD-01 still speaks the app's. Record it in
`work.md` and in `docs/owner/mapping-1ph.md`; resolving it needs either the owner's permission to
edit the protected file or a replacement drawing. **Do not resolve it by guessing.**

**Verify:** screenshot each renamed device's drawer; assert the label text equals
`profile.equipment[x].ownerTag` read from the page, not a literal in the test.

---

### 🔍 REVIEW GATE 9 — the scene tells the same story as the drawing. Stop here.

1. Each of 21a–21d is its own commit with its own evidence.
2. `mapping-1ph.md` regenerated: no row left `missing` without an owner decision recorded.
3. 16/16 model tests; energy audit unchanged; Step 9, 10 and 11 invariants all re-verified.
4. The SLD-01 / 3D tag divergence is written down, not quietly tolerated.

---

### PHASE 10 — Conductor identification and polarity ⏸ gated on Gate 8

> Feature 2: *"the order and identification of positive and negative cables must follow the
> international colour rules."* This is the phase where the picture starts telling the truth about
> wiring.

---

#### 10.0 Measured defects — grepped 2026-09-14, not inferred

| # | Finding | Evidence |
|---|---|---|
| C1 | **The project contains two contradictory DC conventions.** The battery rack draws its terminals red `0xef4444` / near-black `0x18181b` — correct. The DC combiner box draws every negative conductor **blue** `0x2563eb` — `scene-3d.js:1515`, used by **8** conductors | `wireBlueMat` at `scene-3d.js:1515`; battery terminals at `_buildBatteryEnergyStorage` |
| C2 | **Blue is used simultaneously for DC negative and for AC neutral.** The MDB's neutral feeder is `0x2563eb` — the same value as the DC-box negative | `W_GRD_N1`, `scene-3d.js:2622` |
| C3 | **The ten inter-enclosure runs are not conductors at all.** Each circuit is **one** tube with a decorative colour: PV amber `0xd97706`, battery **emerald green** `0x059669`, inverter-to-grid **blue** `0x2563eb`, EPS purple, bypass gold | `_buildCablingAndConduits`, `scene-3d.js:3673-3830` |
| C4 | **Battery green collides with earth green.** Battery run `0x059669` vs earthing run `0x65a30d` — the one colour that must never be ambiguous | same block |
| C5 | **No + / − pair exists outside the enclosures.** A DC circuit is drawn as a single line, so there is no ordering to be right or wrong about | same block |
| C6 | **PE is bi-colour in one place and plain green in another.** `_createDressedConductor(..., isPE=true)` applies `peWireTexture`; the DC box uses flat `0x16a34a` for its 3 PE runs | `scene-3d.js:526`, `2133-2150`, `1516` |
| C7 | **The legend documents state, not identity.** The «راهنمای رنگ و وضعیت هادی‌ها» modal explains energised / no-flow / isolated / tripped / PE. It says nothing about which colour identifies which conductor — and the colours it does show are not the ones on screen | `index.html:1008-1065` |
| C8 | **Colour is scattered.** 17 occurrences of `0x2563eb`, 17 of `0x16a34a`, 11 of `0xdc2626` across `scene-3d.js` with no shared table | `grep -oE "0x[0-9a-f]{6}"` |
| C9 | **Tone mapping desaturates whatever we choose.** ACES Filmic at exposure 1.1 with an unbounded `RoomEnvironment` IBL — no material sets `envMapIntensity` — renders the brown phase conductor as cream and the blue neutral as pale grey-blue in `evidence/phase_a/phase_a_mdb.png` | `scene-3d.js:374-391` |

C9 matters more than it looks: **fixing the palette without fixing the render makes no visible
difference.** Phase 11's Step 27 is therefore a prerequisite for Phase 10 being *visibly* correct,
and the two phases may run in either order, but Step 26's colour check must run after Step 27.

---

#### 10.1 The conflict this phase must resolve, not paper over

Identification colour and circuit colour want opposite things.

- **Identification colour** is the real one: every AC line conductor is brown, every neutral blue,
  every earth green-yellow. It is what an electrician sees in the cabinet — and it makes the grid
  feeder, the inverter feeder, the bypass and the EPS feeder **all look identical**.
- **Circuit colour** is what the app does today: one colour per circuit, so the eye can follow
  "battery → inverter" across the room. It is didactic, and it is not what the cable looks like.

The bottom flow-filter bar (`index.html:549-572`) and the particle system both depend on circuit
colour today.

**Decision: keep both, and never mix them in one surface.**

| | Insulation / sheath colour | Circuit identity |
|---|---|---|
| Carried by | the conductor tube material — identification colour, always | the **particles** flowing inside the run, the selection highlight, and the label |
| Default | identification | — |
| Toggle | «نمای واقعی سیم‌کشی» ⇄ «نمای آموزشی مسیرها» — one control, remembered per session | the toggle changes the **tube**, never the particle |

That keeps the default picture honest, keeps the teaching value, and gives the flow filter a
meaning it can keep: it filters by circuit, and the particle colour is what the legend explains.

**Owner decision required before Step 23 (D3 in §H).** The owner's own legend image
identifies DC as **red positive / black negative**, which is common PV practice. IEC 60445
tabulates DC conductor identification differently. The app must not silently pick one: the owner
chooses the convention, and the legend names which convention is on screen and why.

---

#### Step 23 — `js/conductor-code.js`: one table, read by nothing yet

**Do:** a new file, loaded before `scene-3d.js`, exposing `window.CONDUCTOR_CODE`. One entry per
conductor role: `id`, `role`, `labelFa`, `labelEn`, `hex`, `texture` (`null` or `'pe-stripe'`),
`material` (`roughness`, `metalness`, `envMapIntensity`), `convention` (which document the colour
comes from), and `appliesTo` (`dc` / `ac` / `control` / `data` / `sensor` / `earth`).

Roles to cover, taken from the owner's legend image and the drawing set's terminal lists:
DC positive · DC negative · AC line · AC neutral · PE / earth · control wiring · CAN
communication · RS485 communication · sensor wiring.

**Nothing reads this file in Step 23.** Same discipline as 15a: the contract lands first and is
reviewable on its own.

**Verify:**
```bash
node -e "global.window={};require('./js/conductor-code.js');const c=window.CONDUCTOR_CODE;console.log(Object.keys(c).length);for(const k in c)console.log(k,c[k].hex,c[k].convention)"
node build.js
```

**Acceptance:** every entry names its `convention` source. No hex appears in two roles unless the
owner's chosen convention genuinely reuses it — and if it does, that is called out in the file.

---

#### Step 24 — Correct the wrong colours in place

**Do:** replace the scattered literals with lookups from `CONDUCTOR_CODE`, fixing C1, C2, C4 and
C6 as a consequence. No geometry changes, no new tubes — this step is only about what colour and
material each existing conductor gets:

- the 8 DC-box negatives stop being AC-neutral blue;
- the 3 DC-box PE runs get the bi-colour stripe the MDB already uses;
- the battery inter-enclosure run stops being green;
- the inverter-to-grid run stops being neutral blue.

**Verify:**

| Check | Assertion |
|---|---|
| 24-1 | `grep -cE "0x(2563eb\|16a34a\|dc2626)" js/scene-3d.js` drops by the exact number of conductors converted, and the remaining occurrences are non-conductor uses, listed by line |
| 24-2 | Traverse the scene: every mesh with `userData.type === 'INTERNAL_CONDUCTOR'` or a cable tube has a material colour present in `CONDUCTOR_CODE` — assert **zero** unknown colours |
| 24-3 | Rendered-pixel check: screenshot the open DC box and the open MDB, sample the centre pixel of a named conductor, and record the RGB actually rendered next to the specification. This is the check that catches C9 |
| 24-4 | 16/16 model tests unchanged |

24-2 is the check that can fail loudly and is worth writing carefully: it is a whole-scene
invariant, not a spot assertion.

---

#### Step 25 — Split the runs into conductor sets, with the ordering right

**Do:** each inter-enclosure circuit becomes a **conductor set** instead of one tube:

| Circuit | Conductors |
|---|---|
| `pv1`, `pv2` | + and − |
| `battery` | + and − |
| `grid_in`, `inv_grid`, `grid_bypass`, `load_non_critical` | L, N, PE |
| `inv_eps`, `load_critical` | L, N, PE |
| `earthing` | PE only |

**The ordering is the point of this step, so it is specified, not left to taste:**

1. Order is defined **once per enclosure face** in the profile — the sequence of conductors at that
   gland or terminal row, left to right as seen from the front — and the geometry is generated from
   it. No conductor position is a hand-typed `Vector3` any more.
2. **Polarity order matches the terminal order of the device it lands on**, taken from the
   drawing's terminal list — not from whichever looks tidier.
3. The two conductors of a DC pair stay **parallel and adjacent** along the whole run. A + and a −
   that separate and rejoin is a wiring error drawn as if it were normal.
4. PE runs with its circuit, and is the outermost conductor of the set.
5. Bend radius, spacing and tray order stay constant along a run — no crossings inside a tray.

**Particles: one system per circuit, not per conductor.** The flow rides the designated reference
conductor (the positive of a DC pair, the line of an AC set). Doubling to 20+ particle systems buys
nothing and costs draw calls.

**Verify:**

| Check | Assertion |
|---|---|
| 25-1 | Conductor count per circuit equals the profile's declared set; a mismatch fails |
| 25-2 | For each DC pair, sample 20 points along both curves: the distance between them stays within the declared spacing ±10 % |
| 25-3 | `renderer.info.render.calls`, geometry count and material count printed before and after, with the predicted delta stated **before** the run |
| 25-4 | Particle systems: one per circuit, count unchanged from before the split |
| 25-5 | Frame time over 300 frames, before and after — record both, not a verdict |

**Acceptance:** DC circuits show a correct, adjacent, correctly ordered pair everywhere; AC circuits
show L/N/PE; draw-call growth is stated and justified; no frame-time regression beyond a recorded
budget.

---

#### Step 26 — Legend, labels and the flow filter

**Do:**

1. Extend the «راهنمای رنگ و وضعیت هادی‌ها» modal with a second section: **identification
   colours**, generated from `CONDUCTOR_CODE` so it cannot drift from the scene, with the
   convention named (D3) and the state-colour section clearly separated from it.
2. Hovering or selecting a conductor shows role, circuit, the drawing's conductor tag
   (`WD-PV`, `WD-BAT`, `WD-GRID`) and its `conductorSpec` from the profile.
3. Re-base the bottom flow-filter bar on **particle** colour, since tubes no longer carry circuit
   identity. While that bar is being touched, check whether **V5 (filters inert)** is still true
   and report it — do not fix it inside this step unless the owner adds it to scope.

**Verify:** the legend's rendered swatches equal `CONDUCTOR_CODE` values read from the page; each
filter button's dot equals its circuit's particle colour; one screenshot per filter state.

---

### 🔍 REVIEW GATE 10 — the wiring is identifiable. Stop here.

1. Zero conductor materials outside `CONDUCTOR_CODE` (check 24-2).
2. Rendered pixel colours recorded next to specification (check 24-3), after Step 27's render fix.
3. DC pairs adjacent and correctly ordered at every gland and terminal (check 25-2).
4. Draw calls and frame time recorded before/after, with the predicted delta stated in advance.
5. The legend is generated from the table, and names the convention the owner chose.

---

### PHASE 11 — Equipment realism from owner assets ⏸ gated on asset intake

> Feature 3: *"change the look of the elements using the supplied images — I want the project to
> look really real, and to use transparent 3D images instead of a lifeless 3D element."*
> The goal is right. The route needs one correction, and one prerequisite nobody has noticed.

---

#### 11.0 Why the scene looks flat — measured, and it is not the geometry

Look at `evidence/phase_a/phase_a_overview.png` and `phase_a_mdb.png`, taken after Phase A. The
cabinets are pale, the MCBs are featureless white blocks, the brown phase conductor renders cream
and the blue neutral renders pale grey. Four measured causes, in order of how much they cost:

| # | Cause | Evidence |
|---|---|---|
| R1 | **ACES Filmic tone mapping at exposure 1.1 over a bright procedural `RoomEnvironment`, with `envMapIntensity` never set on any material** — so the IBL dominates every albedo and desaturates it | `scene-3d.js:374-391`; `grep -c envMapIntensity js/scene-3d.js` → 0 |
| R2 | **No surface markings anywhere.** Every device face is a flat colour. Real switchgear is covered in printed text, rating windows, terminal numbers, toggle graphics, screw heads | no texture is applied to any device face; all 12 `CanvasTexture`s are displays, PE stripes, hazard tape, powder-coat bump and particle sprites |
| R3 | **No contact darkening between parts.** Phase A added a contact-shadow plane under enclosures, but part-to-part crevices (a breaker on a rail, a terminal in a block) read as if lit from inside | `_addContactShadow` is per-enclosure only |
| R4 | **Uniform material response.** Painted steel, moulded plastic, brass, tinned copper and polycarbonate all sit in a narrow roughness band, so nothing reads as a different substance | material params across `scene-3d.js` |

**R1 is the prerequisite.** Adding photographic textures under the current render just produces
washed-out photographs. Step 27 comes before any texture work, and Phase 10's colour check
(24-3) should run after it.

---

#### 11.1 What a photograph can and cannot replace

The user orbits this scene. A flat image has one correct viewing angle; everything else is wrong
in a way the eye catches instantly — it shears, it has no thickness, its baked shadow points the
wrong way when the scene's light moves, and it cannot be opened, isolated or inspected. The owner's
reviewer reached the same conclusion from the gPV images, and named the concrete symptoms: baked
shadows and reflections that fight the scene's lighting, front and top views that disagree on screw
count, and placeholder manufacturer and dimensions.

So: **not "photo instead of model" — photo *into* the model.** Three tiers, and the plan says which
belongs where:

| Tier | Technique | Where it is right | Where it is wrong |
|---|---|---|---|
| **T1 — default** | real geometry at datasheet dimensions + a **de-lit** front-face texture (albedo only, shadows and highlights removed) + separate parts for carrier, lens, screws, terminals | every device the user can select, open, isolate or orbit | — |
| **T2 — background only** | alpha-cutout billboard that faces the camera | far-field props never approached: the utility pole, distant load blocks | anything selectable, anything inside a cabinet, anything the camera passes |
| **T3 — the inspector** | the real product photograph, full size, beside the 3D model in the drawer, with manufacturer, model and datasheet reference | **this is where a transparent product image genuinely belongs** — it gives the "really real" the owner wants, without the model claiming to be something it is not | — |

T3 is cheap, high-value and honest, and it can ship before T1 for any device whose photo exists.

**The label rule from §7.6 still applies**: until dimensions and internal arrangement are proven by
the product's own documentation, the object is labelled «مدل نمایشی — ابعاد تأییدنشده», whatever it
looks like.

---

#### 11.2 Asset intake — what the owner needs to supply per device

The two images received so far are **AI-generated system illustrations** (§8.0). They are the right
reference for Phase 10's colours and for cabinet layout. They are **not** a texture source and not
evidence of any real product — using them as one would be exactly the false claim §7.6 forbids. The
gPV orthographic views are not in the intake folder at all.

Per device, a usable asset set is:

1. **Identity** — manufacturer, model, and the datasheet page the dimensions come from.
2. **Dimensions** — W × H × D in mm, plus module width for DIN devices.
3. **Straight-on front view**, even diffuse lighting, no cast shadow, no specular blowout,
   background removed, ≥ 1024 px on the long edge, square pixels, no perspective keystone.
4. **Side and top** views if the device is not a simple extrusion — and the views **must agree**
   with each other. The gPV set does not: one screw in the front view, two in the top and bottom.
5. **A scale reference** in at least one frame, or the dimensions in (2) confirmed.
6. **Licence / permission** to embed the image in a distributed file.

Anything missing ⇒ the device stays a representative model and says so. Nothing is blocked by
this; the app simply does not claim more than it has.

---

#### Step 27 — Render fidelity baseline (no textures yet)

**Do:** make the renderer show a colour that is actually the colour.

1. Set `envMapIntensity` explicitly per material class — painted enclosure, moulded plastic,
   polished metal, cable sheath, glass/lens — instead of letting all of them default to 1.
2. Retune `toneMappingExposure` against a measured target rather than by eye.
3. Widen the roughness / metalness spread between the five material classes (R4).
4. Add part-level contact darkening where devices meet rails and terminals meet blocks (R3),
   reusing the existing contact-shadow texture; no new library.

**Verify — the measurement makes this step reviewable:** place a small off-screen calibration strip
of known albedo patches (the `CONDUCTOR_CODE` colours plus 18 % grey), render, read back the pixels,
and record **specified vs rendered RGB** per patch, before and after.

| Check | Assertion |
|---|---|
| 27-1 | Mean ΔRGB between specified and rendered, per patch, before and after — the after value is smaller, and both are recorded |
| 27-2 | Saturation of the brown phase conductor and the blue neutral, before and after, sampled from the same pixel |
| 27-3 | Frame time over 300 frames before and after |
| 27-4 | Four Phase A screenshots retaken from the identical camera for side-by-side comparison |

**Acceptance:** the numbers are in `work.md`. "Looks better" is not an acceptance criterion.

---

#### Step 28 — Image asset pipeline, and the build hole it closes

**There is a hole in `build.js` today.** It inlines CSS and JS, and it fails on `http(s)://` URLs —
but an `<img src="assets/img/x.png">` or a CSS `url(assets/img/x.png)` would pass every existing
check and silently break the single-file promise: the bundle would render without the image on any
machine that does not also have the folder. Close it in this step, before the first image exists.

**Do:**
1. `assets/img/` — source images, one folder per device, plus a `source.json` per device carrying
   the §11.2 identity fields.
2. `scripts/build-images.js` → `js/image-assets.js`, exposing `window.IMAGE_ASSETS` as
   `{ id: { dataUri, w, h, bytes, sha256, source } }`. Deterministic; re-running produces an
   identical file.
3. `build.js` — add an integrity check that **fails** on any `src=` / `url(` / `href=` in the
   output pointing at a relative path that is not a `data:` URI. Prove it fails by running it once
   against a deliberately broken input and pasting the failure.
4. `scene-3d.js` — one loader helper: `THREE.TextureLoader` over the data URI, with
   `texture.encoding = THREE.sRGBEncoding` for every colour map (this project is three.js **r128**
   and uses `outputEncoding`; a colour map loaded without this renders wrong, and it is the single
   most common way this work goes quietly bad), sensible `anisotropy`, `alphaTest` for cutouts, and
   **registration in `dispose()`** — V14's surface grows with every texture added.

**Budgets, fixed here:** ≤ 250 KB encoded per texture; ≤ 2.0 MB encoded for all images together;
`dist/solar-app.html` ≤ 6.0 MB after Phase 11. WebP preferred where alpha is needed, PNG where it
is not. If a device needs more than its share, reduce resolution — do not raise the budget without
the owner.

**Note on three.js r128:** `DecalGeometry` is **not** in the bundled build, and §B forbids adding a
library. Surface markings are therefore thin plane meshes with an alpha texture and `polygonOffset`,
or a second UV set on the device's own face — not decals. `InstancedMesh` **is** available and is
the route for large PV arrays (§7.7 risk 7b).

**Verify:**
```bash
node scripts/build-images.js
node -e "global.window={};require('./js/image-assets.js');const a=window.IMAGE_ASSETS;let t=0;for(const k in a){t+=a[k].bytes;console.log(k,a[k].w+'x'+a[k].h,(a[k].bytes/1024).toFixed(0)+'KB')}console.log('total',(t/1048576).toFixed(2)+'MB')"
node build.js
```

---

#### Step 29 — Pilot device end to end: the gPV fuse holder

One device, completely, before any rollout. The gPV holder is the right pilot: there are four of
them, they are small, they are already selectable, and the owner has already looked at reference
imagery for them.

**Blocked until §11.2 assets for this device arrive.** If they do not, the pilot moves to whichever
device does have them; the step does not proceed on invented dimensions.

**Do:** T1 from §11.1 — body at datasheet dimensions; carrier, lens window, screws and terminals as
separate parts so the carrier can open and the window can mean something later; de-lit face texture
for the printed markings; cable entry and exit defined on the model, not painted on; the status
window kept as its own part with **no** assigned meaning until the real product's behaviour is
known.

**Verify:**

| Check | Assertion |
|---|---|
| 29-1 | Rendered dimensions equal the datasheet within 1 mm — measured from the bounding box, printed |
| 29-2 | Four camera angles screenshotted; the face texture shows no baked shadow disagreeing with the scene light |
| 29-3 | Selection, drawer, tag label and isolation still work on the rebuilt device |
| 29-4 | Object / geometry / material / texture counts before and after, with the predicted delta |
| 29-5 | Texture memory via `renderer.info.memory`, before and after |

**Acceptance:** side-by-side with the previous version in `work.md`, the dimension check printed,
and the label states whether dimensions are confirmed or representative.

---

#### Step 30 — Roll out, one device family per commit

Order: DC string fuses → DC isolators → DC SPDs → MCB / RCBO family → the inverter shell →
battery modules → enclosures → PV modules (via `InstancedMesh`). Each family repeats Step 29's
checks. A family without §11.2 assets is skipped and recorded as skipped — not approximated.

Ship **T3 (the inspector photo panel)** for every device whose photo exists, independent of whether
its T1 model has been rebuilt. It is the cheapest realism in this phase.

---

#### Step 31 — Performance and memory guard

Textures are the easiest way to break a scene that currently runs fine.

| Check | Assertion |
|---|---|
| 31-1 | Draw calls, triangles, geometries, textures, programs — recorded per rollout commit, trend visible |
| 31-2 | Frame time over 300 frames at the default camera and in the tightest inspection view |
| 31-3 | **20 profile switches**: `renderer.info.memory.textures` returns to its starting value. The V14 test done properly — this is the check V14 was closed with but never ran |
| 31-4 | Bundle size and load time from `file://`, cold profile |
| 31-5 | The single-file bundle opened on a second PC with the network disabled — §F, with every image visible |

---

### 🔍 REVIEW GATE 11 — the equipment is real, and honest about it. Stop here.

1. Step 27's before/after colour numbers recorded; no texture work started before it.
2. Every embedded image traceable to `source.json` with manufacturer, model and dimensions —
   or the device is labelled representative.
3. `build.js` fails on a non-`data:` relative asset reference — demonstrated, not asserted.
4. Budgets met: ≤ 250 KB per texture, ≤ 2.0 MB total, bundle ≤ 6.0 MB.
5. 31-3 passes with a **measured** texture count, not a `typeof`.
6. No AI-generated illustration used as a product texture anywhere in the tree.

---

## E. Deferred — do not start without explicit approval

| Item | Why deferred |
|---|---|
| Promoting `simulation-engine.js` | It has its own bugs: bypass critical load dropped from accounting; `criticalLoadsVoltage_V = 230` downstream of an open breaker; RCD trip does not latch. Fix and test those first, then decide which engine owns state. |
| Cable endpoint → terminal anchors | Owner owns cabling. Binding endpoints without an approved mapping could cement a wrong relationship. Define the ID contract only. |
| Automatic cable routing | Multi-week problem. Out of scope. |
| Latching faults across the board | Recovery behaviour is per-device, from the owner's equipment definitions. "All faults latch" is not a sound general rule. |
| New topologies (on-grid / off-grid profiles) | Requires owner confirmation of permitted equipment and operating rules. |
| Remaining 3D capabilities (`setSunIrradiance`, `updateSmartMeterLCD`, `circuitGraph` tracing) | One capability at a time, each with its own check, after Step 10 proves the pattern. |
| Accessibility pass | Real work: keyboard reach to equipment, accessible naming, focus management, state text. Schedule separately. |
| Deleting `sound-fx.js` | Unused by the UI **but not inert** — it instantiates a singleton at load and registers gesture listeners. Removing it needs a check for load-order side effects. |

---

## F. Definition of done for the 3–4 day commitment

Steps 0–11 complete and reviewed, plus:

- `dist/solar-app.html` opens from `file://` on a **second PC**, network disabled, fresh browser
  profile, in agreed Chrome/Edge/Firefox versions — 3D, Persian fonts, and scenarios all work
  with **zero** external requests. Browser and device versions recorded.
- Same checksum on both machines (`certutil -hashfile dist/solar-app.html SHA256`).
- `node tests/power-model.test.js` passes, including the P2 and P7 regression guards.
- Inspection never operates equipment; dragging never operates equipment.
- SBY accepts only I / 0 / II, and the last valid user command always wins.
- The MDB can be selected, focused, opened, understood, and returned from.
- No new external network dependency anywhere.

---

## G. If you get stuck

Write it in `work.md` and stop. Specifically:

- A Verify check fails → paste the actual output, state which check, **do not improvise a fix**.
- A step's instructions do not match the code you see → quote the code you actually found.
- A change breaks something the step did not mention → revert, report, stop.
- You believe a step is wrong → say so with evidence. The plan's author has already been wrong
  twice in this project and was corrected by another agent. **Being corrected is the process
  working, not a failure.**

---

## H. Owner decisions needed before Phases 8–11 can finish

None of these blocks the start of Phase 8. Each blocks the step named.

| # | Decision | Blocks | Recommendation |
|---|---|---|---|
| **D1** | Both documents are REV 00 / NOT APPROVED, and the drawing set says it is superseded by CFG-001. Ship both, read-only, with the banners intact? | Step 18 | **Yes** — ship both; the drawing set alone would misinform |
| **D2** | `HYB-1PH-FA-REV02` (steps 0–23), cited by all ten sheets, was not supplied. Provide it, or accept that the app cannot show the basis of a sheet? | Step 16 record; Step 22 citations | Provide it if it exists; otherwise record as unavailable |
| **D3** | **DC conductor colour convention.** The owner's legend says red positive / black negative; IEC 60445 tabulates DC identification differently. Which does the app show, and under which name? | Step 23, and all of Phase 10 | Owner's own legend, with the convention named on screen |
| **D4** | Each **conditional** device in table 08-1 — `F11 F12 F21 F22`, `F13 F23`, `K5`, `RCD7`, `Q9`, `SPD-EPS`, `SPD-DAT`: present, absent, or justified later? | Gate 8, Step 20, Step 21 | Decide per device; the app shows the conditional marker until decided |
| **D5** | `F5` and `Q5` are one object in the app. Split them in the scene? | Step 21a | **Yes** — they are separate devices with separate duties, and LOTO depends on `Q5` |
| **D6** | `Q9` in the drawing is a bypass switch interlocked with `Q8`; the app models a 3-position I-0-II changeover. Which is the real installation? | Step 21 | Owner's call — this is topology, not implementation |
| **D7** | `qn_mcb` (non-critical loads) exists in the app with no counterpart tag in 08-1. Add a tag, or record it as out of drawing scope? | Step 19 | Record it; add a tag at the next drawing revision |
| **D8** | The 3D scene will speak the owner's tags while the built-in SLD-01 keeps its own, because `sld-schematic.js` is protected. Accept the divergence, permit editing that file, or supply a replacement drawing? | Step 22 | Accept for now; revisit when the drawing set is approved |
| **D9** | Configuration class per profile (HY-1…HY-8) — confirm the proposed class for each of the five registered profiles | Step 20 | Confirm or correct; unconfirmed profiles display «تأییدنشده» |
| **D10** | Per-device image assets to §11.2, starting with the gPV holder | Step 29 onward | Supply identity + dimensions with every image, or the model stays representative |
| **D11** | Is the three-phase drawing coming? Nothing in Phases 8–11 touches three-phase, and §7.4 still gates it | Phase 7 family work | Out of scope until it arrives |

---

## I. Definition of done for Phases 8–11

- The ten single-phase sheets and the configuration standard open from `dist/solar-app.html` on a
  second PC, network disabled, with zero external requests and the NOT APPROVED / SUPERSEDED
  banners intact.
- `docs/owner/mapping-1ph.md` is complete, owner-corrected, and every row has a status; no device
  is silently missing.
- Every conductor in the scene draws its colour from `CONDUCTOR_CODE`; DC pairs are adjacent and
  correctly ordered at every termination; the legend is generated from that same table and names
  the convention in use.
- Every embedded image is traceable to a manufacturer, model and datasheet dimension, or its
  device is labelled representative. No AI-generated illustration is used as a product texture.
- Budgets met: bundle ≤ 6.0 MB, ≤ 2.0 MB of images, per-texture ≤ 250 KB; draw calls, frame time
  and texture memory recorded at every gate.
- 16/16 model tests pass at every gate; the energy audit is unchanged by Phases 8 and 10.
- Every check written in these phases has a recorded failing run on a broken variant.

---

*Companion documents: `Ideas.md` (findings and rationale), `HISTORY.md` (decision log),
`REVIEW.md` (independent review of Phases 6 and 7), `gpt-ideas.md` (third-party reviews),
`docs/owner/` (the owner source documents and the tag mapping), `work.md` (your reports).*
