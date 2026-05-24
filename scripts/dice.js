const types = ["d4", "d6", "d8", "d10", "d12", "d20"];

import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";
import { ranNum, addSubToStats, buttonTimeout } from "./helpers.js";
export const gameObjects = {
  initialized: false, // Flag tracking if the 3D canvases are ready to intercept user inputs

  /**
   * QUICK REFERENCE: DICE BOX INDEX SYSTEM MAP
   * Index 0 -> d4  (4-sided die)
   * Index 1 -> d6  (6-sided die)
   * Index 2 -> d8  (8-sided die)
   * Index 3 -> d10 (10-sided die)
   * Index 4 -> d12 (12-sided die)
   * Index 5 -> d20 (20-sided die)
   */

  /**
   * INITIALIZATION METHOD: Runs once at application startup
   * Boots the 3D engines and loads the inventory array visuals
   */
  async init() {
    console.log("gameObjects.async called, calling gameObjects.reset");
    this.reset(); // Establish baseline player stats and wipe records clean

    try {
      // Concurrently load canvas components for both dice trays so they initialize in parallel
      await Promise.all([
        this.diceObjects.player.box.init(),
        this.diceObjects.enemy.box.init(),
      ]);
      this.initialized = true;
      console.log("Dice boxes ready");
      this.diceObjects.player.updateDiceInv(); // Update DOM text to show beginning inventory values
    } catch (e) {
      console.error("Dice-Box failed to load:", e);
    }
  },

  firstReset: true,

  /**
   * RESET ENGINE METHOD: Cascades reset commands down to every state machine tracking data
   */
  reset() {
    console.log(
      `gameObjects.reset running:
        to run:
    this.slain.reset();
    this.gold.reset();
    this.diceObjects.player.reset();
    this.diceObjects.enemy.reset();
    this.diceObjects.player.updateDiceInv();
      `,
    );
    this.slain.reset();
    this.gold.reset();
    this.diceObjects.player.reset();
    this.diceObjects.enemy.reset();
    this.diceObjects.player.updateDiceInv();
    console.log("firstReset set to false");
    this.firstReset = false;
  },

  // ========================================================================
  // STATE ENGINE SUB-OBJECT: SLAIN ENEMY TRACKER
  // ========================================================================

  ///Going to do the give player the extra die thing in this method.
  ///Well shit we have to find where to put it before the dice is reset
  ///Where the fuck did I put it?!?!?!!?
  slain: {
    num: 0,
    element: document.getElementById("slainCount"),
    add(num) {
      this.num += num;
      this.element.innerHTML = this.num;
    },
    reset() {
      console.log(
        `gameObjects.slain.reset running. Values to change: slain.num: ${this.num} , slain.element.innerHTML ${this.element.innerHTML}`,
      );
      this.num = 0;
      this.element.innerHTML = 0;
      console.log(`new values: ${this.num}, ${this.element.innerHTML}`);
    },
  },

  // ========================================================================
  // STATE ENGINE SUB-OBJECT: ECONOMY / GOLD TRACKER
  // ========================================================================
  gold: {
    num: 0,
    element: document.getElementById("goldCount"),

    add(num) {
      this.num += num;
      this.element.innerHTML = this.num;
    },

    remove(num) {
      if (this.num - num < 0) return false; // Guard clause: prevents spending below zero balance
      this.num -= num;
      this.element.innerHTML = this.num;
      return true;
    },

    reset() {
      console.log(
        `gameObjects.gold.reset running. Values to change: gold.num: ${this.num} , gold.element.innerHTML ${this.element.innerHTML}`,
      );
      this.num = 0;
      this.element.innerHTML = 0;
      console.log(`new values: ${this.num}, ${this.element.innerHTML}`);
    },
  },

  // ========================================================================
  // COMBATANTS DATA WRAPPERS & DICE BOX CONFIGURATIONS
  // ========================================================================
  diceObjects: {
    // ----------------------------------------------------------------------
    // PLAYER PROPERTIES, INVENTORY, AND STAT HOOKS
    // ----------------------------------------------------------------------
    player: {
      box: new DiceBox({
        assetPath: "assets/",
        origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
        container: "#player-dice-box",
        scale: 10,
      }),

      // UI DOM caching mapping to render live values when allocation indicators change
      ///The hell is this comment.
      diceInvUi: {
        ///Wish I would have made these mother fuckers arrays,
        ///But i dont want to go back and redo all the syntaxx.
        quan: {
          select: {
            d4: document.getElementById("selectedDieQuan4"),
            d6: document.getElementById("selectedDieQuan6"),
            d8: document.getElementById("selectedDieQuan8"),
            d10: document.getElementById("selectedDieQuan10"),
            d12: document.getElementById("selectedDieQuan12"),
            d20: document.getElementById("selectedDieQuan20"),
          },
          total: {
            d4: document.getElementById("4DieQuan"),
            d6: document.getElementById("6DieQuan"),
            d8: document.getElementById("8DieQuan"),
            d10: document.getElementById("10DieQuan"),
            d12: document.getElementById("12DieQuan"),
            d20: document.getElementById("20DieQuan"),
          },
        },
      },

      /**
       * PLAYER DICE TRACER: Syncs raw JavaScript arrays out to HTML layouts
       */
      updateDiceInv() {
        console.log(
          "UpdateDiceInv running, to change innerHtmls for dice inventory.",
        );
        const types = ["d4", "d6", "d8", "d10", "d12", "d20"];
        for (let i = 0; i < this.dice.length; i++) {
          this.diceInvUi.quan.select[types[i]].innerHTML = this.selectedDice[i];
          this.diceInvUi.quan.total[types[i]].innerHTML = this.dice[i];
        }
      },

      // Core data structures for tracking ammunition pools across turn actions
      dice: [2, 3, 5, 5, 3, 0], // Live mutable stockpile pools
      baseDice: [2, 3, 5, 3, 0, 0], // Fallback template defaults mapped during resets
      selectedDice: [0, 0, 0, 0, 0, 0], // Staged choices awaiting submission to the 3D box
      currentDiceValue: 0,
      currentDiceValueUi: document.getElementById("numRolledTextPlayer"),

      baseHealth: 100,
      baseDamage: 50,

      healthElement: document.getElementById("playerHealth"),
      damageElement: document.getElementById("playerDamage"),

      healthNum: 100,
      damageNum: 50,

      toggleRollBox() {
        document.getElementById("rolledBoxPlayer").classList.toggle("hide");
      },

      /**
       * PLAYER VISUAL HEALTH MANAGER
       * Generates the math reduction string, then saves state when timer completes
       */
      async updateHealth(num, addOrSub) {
        await addSubToStats([
          {
            element: gameObjects.diceObjects.player.healthElement,
            amt: num + gameObjects.diceObjects.player.damageNum,
            oldAmt: gameObjects.diceObjects.player.healthNum,
            add: addOrSub,
          },
        ]);
        if (addOrSub) {
          this.healthNum += num;
        } else {
          this.healthNum -= num;
        }
      },

      updateDamage(num) {
        this.damageNum = num;
        this.damageElement.innerHTML = num;
      },

      /**
       * PLAYER DAMAGE INTAKE CALCULATION pipeline
       * Deducts raw numbers based on incoming variables passed by enemy actions
       */
      async applyDamage(enemyRoll) {
        await addSubToStats([
          {
            element: gameObjects.diceObjects.player.healthElement,
            amt: enemyRoll + gameObjects.diceObjects.enemy.damageNum,
            oldAmt: gameObjects.diceObjects.player.healthNum,
            add: false,
          },
        ]);
        this.healthNum -= enemyRoll + gameObjects.diceObjects.enemy.damageNum;
      },

      async reset() {
        console.log(
          `gameObjects.player.reset running. 
          Values to change: 
          player.dice: ${this.dice} to be player.baseDice: ${this.baseDice}, 
          player.selectedDice ${this.selectedDice},
          player.healthElement & player.healthNum to be player.baseHealth: ${this.baseHealth},
            using addSubToStats
          player.damageElement & player.damageNum to be player.damageHealth: ${this.baseDamage},
            using addSubToStats
          `,
        );

        this.dice = [...this.baseDice];

        ///updateHealth and damage
        addSubToStats([
          {
            element: this.healthElement,
            amt: this.baseHealth,
            oldAmt: this.healthNum,
            add: true,
          },
          {
            element: this.damageElement,
            amt: this.baseDamage,
            oldAmt: this.damageNum,
            add: true,
          },
        ]);
        this.healthNum = this.baseHealth;
        this.damageNum = this.baseDamage;

        this.selectedDice = [0, 0, 0, 0, 0, 0];
        console.log(
          `new values in order: 
          ${this.dice}
          ${this.selectedDice},
          ${this.healthElement.innerHTML},
          ${this.healthNum},
          ${this.damageElement.innerHTML},
          ${this.damageNum},       
          `,
        );
      },
    },

    // ----------------------------------------------------------------------
    // ENEMY PROPERTIES, PROGRESSION SCALING, AND STAT HOOKS
    // ----------------------------------------------------------------------
    enemy: {
      data: {
        dice: {
          box: new DiceBox({
            assetPath: "assets/",
            origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
            container: "#enemy-dice-box",
            scale: 10,
          }),

          current: [3, 1, 0, 0, 0, 0],
          selected: [2, 1, 0, 0, 0, 0],
          base: [2, 1, 0, 0, 0, 0],
          element: document.getElementById("enemyDiceContainer"),
          currentValue: 0,
          currentValueUi: document.getElementById("numRolledTextEnemy"),

          async roll() {
            let diceToRoll = [];
            var root = gameObjects.diceObjects.enemy;

            console.log("Rolling with selected dice:", obj.selectedDice);

            this.selectedDice.forEach((amt, i) => {
              if (amt > 0) {
                diceToRoll.push(amt + types[i]);
                this.current[i] -= amt;
              }
            });

            this.selected = [0, 0, 0, 0, 0, 0];

            console.log("Dice to roll:", diceToRoll);

            if (diceToRoll.length === 0) {
              this.current = 0;
              return 0;
            }

            return new Promise((resolve) => {
              this.box.onRollComplete = (results) => {
                this.currentValue = results.reduce(
                  (sum, d) => sum + d.value,
                  0,
                );
                this.currentValueUi.innerHTML = this.currentValue;
                root.toggleRollBox();

                setTimeout(() => {
                  this.box.clear();
                  root.toggleRollBox();
                }, 1800);

                this.box.onRollComplete = null;
                resolve(obj.currentDiceValue);
              };

              this.box.roll(diceToRoll);

              this.updateDiceUi();
            });
          },

          async updateDiceUi() {
            let elementTexts = [];
            for (let i = 0; i < this.dice.length; i++) {
              if (this.dice[i] > 0) {
                elementTexts.push(`${types[i]}  ${this.dice[i]}`);
              }
            }

            // 1. Map the text array into an array of <h1> elements
            const headingElements = elementTexts.map((text) => {
              const h1 = document.createElement("h1");
              h1.textContent = text;
              h1.classList.add("enemyDieH2"); // Add the CSS class for styling
              return h1;
            });

            // 2. Clear the div and add all the new <h1> elements at once
            this.diceContainer.replaceChildren(...headingElements);
          },
          updateSelectedDice() {
            // Guard clause: Exit if there are no dice available to choose from
            for (let i = 0; i < dice.length; i++) {
              if (i <= 0) {
                console.log("Enemy has no dice left to choose from.");
                break;
              }
            }

            let cycleLimit = 0;

            // 2. Loop continues ONLY if we have agro left AND dice are available AND we haven't hit the safety limit
            while (
              this.currentAgroWeight > 0 &&
              diceToChoose.length > 0 &&
              cycleLimit < 100
            ) {
              cycleLimit++;

              // Roll to see if enemy wants to take a die
              if (ranNum(0, 100) < this.currentAgroWeight) {
                // Select a random index based on what is physically left in the pool
                let index = Math.floor(ranNum(0, diceToChoose.length));

                // Safeguard against out-of-bounds math
                if (index >= diceToChoose.length) {
                  index = diceToChoose.length - 1;
                }

                // Move a die to the chosen pool
                this.dice[index]--;
                this.selected[index]++;
                stats.aggressiveness.applyRate();

                // Reduce agro weight per choice
              } else {
                // Enemy rolled above current agro weight, decides to stop choosing
                break;
              }
            }
            stats.aggressiveness.setBase();
            console.log("Enemy dice chosen:", diceChosen);
            this.updateDiceUi();
          },
          NewDice() {
            ///Player is given leftover dice.
            if (!gameObjects.firstReset) {
              var arrayToPass = [];
              for (let i = 0; i < this.dice.length; i++) {
                arrayToPass[i] = {
                  element:
                    gameObjects.diceObjects.player.diceInvUi.quan.total[
                      types[i]
                    ],
                  add: true,
                  oldAmt: gameObjects.diceObjects.player.dice[i],
                  amt: gameObjects.diceObjects.enemy.dice[i],
                };
                gameObjects.diceObjects.player.dice[i] +=
                  gameObjects.diceObjects.enemy.dice[i];
              }
              addSubToStats(arrayToPass);
            } else {
              console.log(
                "gameObjects.firstReset is true, not giving enemy dice to player.",
              );
            }

            this.dice = [0, 0, 0, 0, 0, 0];

            // Number of dice to give based on strength
            let diceToGive = Math.ceil(
              this.strength * this.diceBonusMultipler + this.minDiceBonus,
            );
            console.log(`Number of dice to give: ${diceToGive}`);

            ///Enemy is given dice
            for (let i = 0; i < diceToGive; i++) {
              console.log("giving enemy another die...");
              ///Pulling the same while loop from updateSelectedDice
              let cycleLimt = 0; // Safety limit to prevent infinite loops in edge cases where agroWeight doesn't decrease properly
              while (this.currentAgroWeight > 0 || cycleLimt > 200) {
                ///To choose wheather to choose a die.
                if (ranNum(0, 100) < this.currentAgroWeight) {
                  let ranNumToUse = ranNum(0, 100);

                  this.currentAgroWeight -= this.agroDecayRate; // Decrease agro weight to increase chances of breaking out of the loop and adding some variability to the dice selection process.
                  // Formula: (num / 100) * arrayLength
                  let index = Math.floor(
                    (ranNumToUse / 100) * this.current.length,
                  );

                  // Safeguard: Ensure a random number of exactly 100 doesn't cause an out-of-bounds error
                  if (index >= this.current.length) {
                    index = this.current.length - 1;
                  }
                  this.current[index] += 1; // Increment the quantity of the chosen die in the diceChosen array
                  console.log(`Dice given:  ${types[index]}`);
                  cycleLimt++;
                } else {
                  if (cycleLimt > 200) {
                    console.log(
                      `cycleLimit hit, current agroWeight: ${this.currentAgroWeight}`,
                    );
                  }
                  break;
                }
              }
            }

            this.updateDiceUi();
          },

          setBase() {
            this.current = this.base;
            this.updateUi();
          },
          reset() {
            this.current = this.base;
            this.updateDiceUi();
          },
          roll() {},
        },
        stats: {
          dice: {
            current: [3, 1, 0, 0, 0, 0],
            selected: [2, 1, 0, 0, 0, 0],
            base: [2, 1, 0, 0, 0, 0],
          },
          weights: {
            strength: {
              current: 1.5,
              base: 1.5,
              rate: 1.5,
              setBase() {
                this.current = this.base;
                this.element.innerHTML = this.base;
              },
              applyRate() {
                this.current *= this.rate;
              },
            },
            aggressiveness: {
              current: 60,
              base: 60,
              rate: 5,
              setBase() {
                this.current = this.base;
                this.element.innerHTML = this.base;
              },
              applyRate() {
                this.current -= this.rate;
              },
            },
            minDice: {
              current: 5,
              base: 5,
              rate: 1.2,
              setBase() {
                this.current = this.base;
                this.element.innerHTML = this.base;
              },
              applyRate() {
                this.current *= this.rate;
              },
            },
          },

          health: {
            base: 100,
            current: 0,
            element: document.getElementById("enemyDamage"),
            async add(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: true,
                },
              ]);
            },
            async sub(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: false,
                },
              ]);
            },
            setBase() {
              this.current = this.base;
              this.element.innerHTML = this.base;
            },
          },
          damage: {
            base: 100,
            current: 0,
            element: document.getElementByI,
            async add(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: true,
                },
              ]);
            },
            async sub(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: false,
                },
              ]);
            },
            setBase() {
              this.current = this.base;
              this.element.innerHTML = this.base;
            },
          },
          bounty: {
            base: 5,
            current: 5,
            element: document.getElementById("enemyBounty"),
            async add(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: true,
                },
              ]);
            },
            async sub(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: false,
                },
              ]);
            },
            setBase() {
              this.current = this.base;
              this.element.innerHTML = `$${this.base}`;
            },
          },
          reset() {
            this.strength.setBase();
            this.health.setBase();
            this.damage.setBase();
            this.bounty.setBase();
            this.giveNewDice();
            this.updateDiceUi();
          },
        },
      },

      async slay() {
        gameObjects.gold.add(this.bounty);
        gameObjects.slain.add(1);

        this.strength += this.strengthGrowthRate; // Scale combat curves harder for next lifecycle spawn

        // Regenerate fresh pool targets augmented cleanly by scale tracking factor variables
        await this.updateHealth(
          Math.ceil(this.baseHealth * this.strength),
          true,
        );
        await this.updateDamage(
          Math.ceil(this.baseDamage * this.strength),
          true,
        );
        console.log(
          `enemy.bounty to be ${Math.ceil(this.bounty * this.strength)}`,
        );
        this.bounty = Math.ceil(this.bounty * this.strength);
        this.bountyElement.innerHTML = "$" + this.bounty;
        this.giveNewDice();
        this.updateDiceUi();
      },

      reset() {
        this.data.dice.reset();
        this.data.stats.reset();
      },
      toggleRollBox() {
    document.getElementById("rolledBoxEnemy").classList.toggle("hide");
  },
    },
  },

  
};
