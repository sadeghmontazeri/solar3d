# Implementation Plan — 3D Hybrid Solar Simulator

**Created:** 2026-09-13 · **Author:** claude-opus-5 · **Source:** `Ideas.md` v3
**For:** the implementing agent · **Reviewer:** claude-opus-5, after every step
**Status:** awaiting owner approval to begin

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

*Companion documents: `Ideas.md` (findings and rationale), `HISTORY.md` (decision log),
`work.md` (your reports).*
