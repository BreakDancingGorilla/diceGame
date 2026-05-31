import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";
import { DIE_TYPES, ranNum, animateStat } from "./helpers.js";

// =====================================================================
// STAT
// One numeric game value tied to a DOM element.
// add/sub animate and mutate. reset() snaps back to base silently.
// format() controls how the settled value renders (e.g. "$5").
// =====================================================================
class Stat {
  constructor(base, elementId, format = String) {
    this.base    = base;
    this.current = base;
    this.el      = document.getElementById(elementId);
    this.format  = format;
    this.toApply = base; // used by damage stats for the pending hit value
  }

  async add(amt) {
    const next = this.current + amt;
    await animateStat(this.el, this.current, next, this.format);
    this.current = next;
  }

  async sub(amt) {
    const next = this.current - amt;
    await animateStat(this.el, this.current, next, this.format);
    this.current = next;
  }

  reset() {
    this.current = this.base;
    this.toApply = this.base;
    if (this.el) this.el.innerHTML = this.format(this.base);
  }
}

// =====================================================================
// WEIGHT
// An AI tuning knob. tick() decays it each use; reset() restores base.
// mode "subtract" → current -= rate  |  "multiply" → current *= rate
// =====================================================================
class Weight {
  constructor(base, rate, mode = "multiply") {
    this.base    = base;
    this.current = base;
    this.rate    = rate;
    this.mode    = mode;
  }

  reset() { this.current = this.base; }

  tick() {
    this.current = this.mode === "subtract"
      ? this.current - this.rate
      : this.current * this.rate;
  }
}

// =====================================================================
// DICE POOL
// Owns a dice-box canvas and the current / selected / base count arrays.
// roll(bonus) resolves with the raw sum of the roll result.
// =====================================================================
class DicePool {
  constructor({ boxConfig, base, rollValueEl, rollBoxEl }) {
    this.box          = new DiceBox(boxConfig);
    this.base         = [...base];
    this.current      = [...base];
    this.selected     = new Array(6).fill(0);
    this.rollValueEl  = document.getElementById(rollValueEl);
    this.rollBoxEl    = document.getElementById(rollBoxEl);
    this.currentValue = 0;
  }

  async init() {
    await this.box.init();
  }

  toggleRollBox() {
    this.rollBoxEl?.classList.toggle("hide");
  }

  // Roll whatever is in this.selected.
  // bonus is shown alongside the result but does NOT get added to the returned value —
  // callers compute the final damage themselves.
  async roll(bonus = 0) {
    const toRoll = [];
    this.selected.forEach((amt, i) => {
      if (amt > 0) {
        toRoll.push(amt + DIE_TYPES[i]);
        this.current[i] -= amt;
      }
    });
    this.selected.fill(0);

    if (toRoll.length === 0) return 0;

    return new Promise(resolve => {
      this.box.onRollComplete = (results) => {
        this.currentValue = results.reduce((sum, d) => sum + d.value, 0);

        if (this.rollValueEl) {
          this.rollValueEl.innerHTML = `${this.currentValue} + ${bonus}`;
        }

        this.toggleRollBox();
        setTimeout(() => {
          this.box.clear();
          this.toggleRollBox();
        }, 1800);

        this.box.onRollComplete = null;
        resolve(this.currentValue);
      };

      this.box.roll(toRoll);
    });
  }

  resetToBase() {
    this.current  = [...this.base];
    this.selected.fill(0);
  }
}

// =====================================================================
// PLAYER DICE UI
// Element refs for the inventory panel — kept separate so DicePool stays
// generic and doesn't care about the specific HTML layout.
// =====================================================================
const playerDiceEls = {
  totals:   DIE_TYPES.map(t => document.getElementById(`${t.slice(1)}DieQuan`)),
  selected: DIE_TYPES.map(t => document.getElementById(`selectedDieQuan${t.slice(1)}`)),
};

// =====================================================================
// PLAYER
// =====================================================================
const player = {
  stats: {
    health: new Stat(100, "playerHealth"),
    damage: new Stat(100,  "playerDamage"),
    gold:   new Stat(100, "goldCount"),
    slain:  new Stat(0,   "slainCount"),

    mode: { attack: true },

    reset() {
      this.health.reset();
      this.damage.reset();
      this.gold.reset();
      this.slain.reset();
    },
  },

  dice: new DicePool({
    boxConfig: {
      assetPath: "assets/",
      origin:    "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
      container: "#player-dice-box",
      themeColor: "#0000FF",
      scale:     10,
    },
    base:       [2, 1, 0, 0, 0, 0],
    rollValueEl: "numRolledTextPlayer",
    rollBoxEl:   "rolledBoxPlayer",
  }),

  // Sync the inventory panel with the current dice counts
  updateDiceUI() {
    DIE_TYPES.forEach((_, i) => {
      if (playerDiceEls.totals[i])
        playerDiceEls.totals[i].innerHTML   = this.dice.current[i];
      if (playerDiceEls.selected[i])
        playerDiceEls.selected[i].innerHTML = this.dice.selected[i];
    });
  },

  // Roll selected dice and set damage.toApply
  async roll() {
    const rollVal = await this.dice.roll(this.stats.damage.current);
    this.stats.damage.toApply = this.stats.damage.current + rollVal;
    this.updateDiceUI();
    return rollVal;
  },

  // +/- buttons in the dice inventory
  initDiceSelection() {
    const holder = document.getElementById("playerDiceHolder");
    if (!holder) return;

    holder.addEventListener("click", (e) => {
      const btn = e.target.closest(".select-button");
      if (!btn) return;

      // Extract the die face number from the button ID ("4SelectUp" → "4" → idx 0)
      const sides = btn.id.replace(/SelectUp|SelectDown/, "");
      const idx   = DIE_TYPES.indexOf(`d${sides}`);
      if (idx === -1) return;

      if (btn.id.includes("Up")) {
        if (this.dice.selected[idx] < this.dice.current[idx]) {
          this.dice.selected[idx]++;
        }
      } else {
        if (this.dice.selected[idx] > 0) {
          this.dice.selected[idx]--;
        }
      }

      this.updateDiceUI();
    });
  },

  // Attack / Heal toggle
  initModeToggle() {
    const toggle = document.getElementById("card-mode-toggle");
    if (!toggle) return;
    toggle.addEventListener("change", () => {
      this.stats.mode.attack = !toggle.checked;
    });
  },

  reset() {
    this.stats.reset();
    this.dice.resetToBase();
    this.updateDiceUI();
  },
};

// =====================================================================
// ENEMY
// =====================================================================
const enemy = {
  stats: {
    health: new Stat(100, "enemyHealth"),
    damage: new Stat(15,  "enemyDamage"),
    bounty: new Stat(5,   "enemyBounty", v => `$${v}`),
    distributionHealth: 0, //What precent of strength goes to health

    // AI difficulty knobs — reset on player death; scale with each kill
    weights: {
      strength:       new Weight(1.2, 1.1, "multiply"),
      aggressiveness: new Weight(60,  5,   "subtract"),
      minDice:        new Weight(5,   1.2, "multiply"),
    },

    reset() {
      this.health.reset();
      this.damage.reset();
      this.bounty.reset();
      this.weights.strength.reset();
      this.weights.aggressiveness.reset();
      this.weights.minDice.reset();
    },
  },

  dice: new DicePool({
    boxConfig: {
      assetPath: "assets/",
      origin:    "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
      container: "#enemy-dice-box",
      themeColor: "#FF3131",
      scale:     10,
    },
    base:       [3, 1, 0, 0, 0, 0],
    rollValueEl: "numRolledTextEnemy",
    rollBoxEl:   "rolledBoxEnemy",
  }),

  diceContainerEl: document.getElementById("enemyDiceContainer"),

  // Render which dice the enemy has as text chips
  updateDiceUI() {
    const chips = this.dice.current
      .map((count, i) => count > 0 ? `(${DIE_TYPES[i]}  ${count}) |` : null)
      .filter(Boolean)
      .map(text => {
        const el = document.createElement("h2");
        el.textContent = text;
        el.className   = "enemyDieH2";
        return el;
      });
    this.diceContainerEl?.replaceChildren(...chips);
  },

  // AI: use aggressiveness weight to decide how many dice to grab this turn.
  // BUG FIXED: original checked `i <= 0` (always true on first loop iteration)
  //            and had no guard against decrementing an already-empty slot.
  selectDice() {
    const agro = this.stats.weights.aggressiveness;

    // Nothing to pick from
    if (this.dice.current.every(c => c <= 0)) return;

    while (agro.current > 0) {
      if (ranNum(0, 100) < agro.current) {
        const idx = ranNum(0, DIE_TYPES.length - 1);
        // Guard: never go below zero on a slot (original bug — no check existed)
        if (this.dice.current[idx] > 0) {
          this.dice.current[idx]--;
          this.dice.selected[idx]++;
        }
        agro.tick(); // subtract 5 each pick → enemy naturally stops being greedy
      } else {
        break;      // failed the agro roll, stop picking
      }
    }

    agro.reset();
  },

  // Roll the selected dice and compute toApply
  async roll() {
    this.selectDice();
    this.updateDiceUI();
    const rollVal = await this.dice.roll(this.stats.damage.current);
    this.stats.damage.toApply = this.stats.damage.current + rollVal;
  },

  // Called after each kill: give leftovers to player, then build a fresh pool.
  // isFirstInit = true skips the "give leftovers" step (nothing to give on game start).
  // BUG FIXED: original loop used `|| cycleLimit > 200` (should be `&&`),
  //            meaning once the limit was hit the loop ran forever.
  assignNewDice(isFirstInit) {
    const weights = this.stats.weights;

    // Give the enemy's remaining dice to the player (cosmetic animation only,
    // state is updated immediately so the rest of the code sees the new values)
    if (!isFirstInit) {
      DIE_TYPES.forEach((_, i) => {
        const from = player.dice.current[i];
        const to   = from + this.dice.current[i];
        if (to !== from) {
          // fire-and-forget — don't hold up the game loop
          animateStat(playerDiceEls.totals[i], from, to);
          player.dice.current[i] = to;
        }
      });
      player.updateDiceUI();
    }

    // Clear the enemy's pool
    this.dice.current.fill(0);

    // Give the enemy new dice for the next round
    const diceToGive = Math.ceil(weights.strength.current + weights.minDice.current);

    for (let i = 0; i < diceToGive; i++) {
      weights.aggressiveness.reset();
      let safetyLimit = 0;

      // BUG FIXED: was `|| safetyLimit > 200` — would loop forever once limit hit
      while (weights.aggressiveness.current > 0 && safetyLimit < 200) {
        if (ranNum(0, 100) < weights.aggressiveness.current) {
          const idx = ranNum(0, DIE_TYPES.length - 1);
          this.dice.current[idx]++;
          weights.aggressiveness.tick();
          safetyLimit++;
        } else {
          break;
        }
      }
    }

    weights.aggressiveness.reset();
    this.updateDiceUI();
  },

  // Player killed this enemy — give rewards, scale up, spawn next one
  async slay() {
    const weights = this.stats.weights;

    // Restore player's base dice before handing out leftovers
    player.dice.resetToBase();
    player.updateDiceUI();

    await player.stats.gold.add(this.stats.bounty.current);
    await player.stats.slain.add(1);

    // Clamp health (can go below zero from overkill damage)
    this.stats.health.current = 0;

    // Scale the enemy for the next encounter
    weights.strength.tick();
    await this.stats.bounty.add(Math.ceil(this.stats.bounty.base * weights.strength.current));

    // Random health/damage split: e.g. distributionHealth=60 → 60% HP, 40% DMG
    this.stats.distributionHealth = ranNum(0, 100);
    const budget      = Math.ceil(this.stats.health.base * weights.strength.current)
                      + Math.ceil(this.stats.damage.base  * weights.strength.current);
    const round5      = n => Math.round(n / 5) * 5;
    const healthShare = round5(budget * (this.stats.distributionHealth / 100));
    const damageShare = round5(budget - healthShare);

    await this.stats.health.add(healthShare);
    await this.stats.damage.add(damageShare);

    this.assignNewDice(false);
  },

  reset(isFirstInit) {
    this.stats.reset();
    this.assignNewDice(isFirstInit);
  },
};

// =====================================================================
// GAME
// Top-level controller. Exported as `game`.
// =====================================================================
export const game = {
  player,
  enemy,

  async init() {
    this._isFirstInit = true;
    this._doReset();

    await Promise.all([
      player.dice.init(),
      enemy.dice.init(),
    ]);

    player.updateDiceUI();
    player.initDiceSelection();
    player.initModeToggle();
  },

  // Called on player death — reset everything back to the beginning
  fullReset() {
    this._isFirstInit = true;
    this._doReset();
  },

  _doReset() {
    player.reset();
    enemy.reset(this._isFirstInit);
    this._isFirstInit = false;
  },
};
