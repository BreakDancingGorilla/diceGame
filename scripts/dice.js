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

  async init() {
    console.log("gameObjects.async called, calling gameObjects.reset");
    this.reset(); // Establish baseline player stats and wipe records clean

    try {
      // Concurrently load canvas components for both dice trays so they initialize in parallel
      await Promise.all([
        this.diceObjects.player.data.dice.box.init(),
        this.diceObjects.enemy.data.dice.box.init(),
      ]);
      this.initialized = true;
      console.log("Dice boxes ready");
      this.diceObjects.player.data.dice.updateDiceUi();
      this.diceObjects.player.data.dice.diceSelection.init();
      this.diceObjects.player.data.stats.currentMode.init();
    } catch (e) {
      console.error("Dice-Box failed to load:", e);
    }
  },

  firstReset: true,

  /**
   * RESET ENGINE METHOD: Cascades reset commands down to every state machine tracking data
   */
  reset() {
    this.diceObjects.player.data.stats.reset();
    this.diceObjects.player.data.dice.reset();
    this.diceObjects.enemy.data.stats.reset();
    this.diceObjects.enemy.data.dice.reset();
    this.diceObjects.player.data.dice.updateDiceUi();
    this.firstReset = false;
  },

  // ========================================================================
  // STATE ENGINE SUB-OBJECT: SLAIN ENEMY TRACKER
  // ========================================================================

  ///Going to do the give player the extra die thing in this method.
  ///Well shit we have to find where to put it before the dice is reset
  ///Where the fuck did I put it?!?!?!!?

  // ========================================================================
  // STATE ENGINE SUB-OBJECT: ECONOMY / GOLD TRACKER
  // ========================================================================

  diceObjects: {
    player: {
      data: {
        dice: {
          box: new DiceBox({
            assetPath: "assets/",
            origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
            container: "#player-dice-box",
            scale: 10,
          }),

          diceSelection: {
          init() {
            const parentElement = document.getElementById("playerDiceHolder");

            // Safety check to ensure the element exists before adding the listener
            if (!parentElement) return;

            parentElement.addEventListener("click", (event) => {
              // Pull down reference mappings to structural button containers housing active asset pointers
              const button = event.target.closest(".select-button");
              if (!button) return; // Disregard arbitrary ambient clicks targeting empty canvas zones or background graphics

              const clickedId = button.id;
              var dieIndex;
              var increment = clickedId.includes("Up") ? 1 : -1; // Inspect element ID strings to isolate vector directions

              // Route string definitions straight down into indexed structural numeric arrays mapping target parameters
              switch (clickedId) {
                case "4SelectDown":
                case "4SelectUp":
                  dieIndex = 0;
                  break;
                case "6SelectDown":
                case "6SelectUp":
                  dieIndex = 1;
                  break;
                case "8SelectDown":
                case "8SelectUp":
                  dieIndex = 2;
                  break;
                case "10SelectDown":
                case "10SelectUp":
                  dieIndex = 3;
                  break;
                case "12SelectDown":
                case "12SelectUp":
                  dieIndex = 4;
                  break;
                case "20SelectDown":
                case "20SelectUp":
                  dieIndex = 5;
                  break;
              }

              const player = gameObjects.diceObjects.player;

              // Restrict selections inside boundary thresholds checking live stockpile quantities
              if (increment === 1) {
                if (
                  player.data.dice.selected[dieIndex] <
                  player.data.dice.current[dieIndex]
                ) {
                  console.log(`Incrementing die index ${dieIndex}`);
                  player.data.dice.selected[dieIndex] += 1;
                }
              } else {
                if (player.data.dice.selected[dieIndex] > 0) {
                  player.data.dice.selected[dieIndex] -= 1;
                }
              }

              console.log("Selected dice:", player.data.dice.selected);
              // Okay all this does is update the ui. this is changing something
              gameObjects.diceObjects.player.data.dice.updateDiceUi(); // Cascade changes out to visible overlay layout maps
            });
          },
        },

          diceInvUi: {
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

          updateDiceUi() {
            for (let i = 0; i < this.current.length; i++) {
              this.diceInvUi.quan.select[types[i]].innerHTML = this.selected[i];
              this.diceInvUi.quan.total[types[i]].innerHTML = this.current[i];
            }
          },

          current: [3, 1, 0, 0, 0, 0],
          selected: [2, 1, 0, 0, 0, 0],
          base: [2, 1, 0, 0, 0, 0],
          element: document.getElementById("playerDiceContainer"),
          currentValue: 0,
          currentValueUi: document.getElementById("numRolledTextPlayer"),

          async roll() {
            let diceToRoll = [];
            var root = gameObjects.diceObjects.player;

            console.log("Rolling with selected dice:", this.selected);

            this.selected.forEach((amt, i) => {
              if (amt > 0) {
                diceToRoll.push(amt + types[i]);
                this.current[i] -= amt;
              }
            });

            this.selected = [0, 0, 0, 0, 0, 0];

            console.log("Dice to roll:", diceToRoll);

            if (diceToRoll.length === 0)  {
              return 0;
            }

            return new Promise((resolve) => {
              this.box.onRollComplete = (results) => {
                this.currentValue = results.reduce(
                  (sum, d) => sum + d.value,
                  0,
                );
                this.currentValueUi.innerHTML = `${this.currentValue} + ${gameObjects.diceObjects.player.data.stats.damage.current}`;
                root.toggleRollBox();

                setTimeout(() => {
                  this.box.clear();
                  root.toggleRollBox();
                }, 1800);

                this.box.onRollComplete = null;
                resolve(this.currentValue);
                var damage = gameObjects.diceObjects.player.data.stats.damage;

                damage.toApply = damage.current + this.currentValue;
                this.updateDiceUi();
              };

              this.box.roll(diceToRoll);
            });
          },

          setBase() {
            this.current = this.base;
            this.updateUi();
          },
          reset() {
            this.current = this.base;
            ///Adding ?. fixes it from using the function
            ///Before the object is created.
            this.selected = [0, 0, 0, 0, 0, 0];
            this.updateDiceUi?.();
          },
        },
        stats: {


          currentMode: {
            attack: true,
            heal: false,
            element: document.getElementById("card-mode-toggle"),
            init() {
            
              this.element.addEventListener("click", function () {
                  let element = gameObjects.diceObjects.player.data.stats.currentMode.element;
              let attack =  gameObjects.diceObjects.player.data.stats.currentMode.attack;
               let heal =  gameObjects.diceObjects.player.data.stats.currentMode.heal;
                console.log(element.checked);
                if (element.checked) {
                  gameObjects.diceObjects.player.data.stats.currentMode.heal = true;
                  gameObjects.diceObjects.player.data.stats.currentMode.attack = false;
                }
                else {
                  gameObjects.diceObjects.player.data.stats.currentMode.attack = true;
                  gameObjects.diceObjects.player.data.stats.currentMode.heal = false;
                }
              
                   console.log(gameObjects.diceObjects.player.data.stats.currentMode.heal);
              });
           
            },
          },

          slain: {
            base: 0,
            current: 0,
            element: document.getElementById("slainCount"),
            async add(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: true,
                },
              ]);
              this.current += amt;
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
              this.current -= amt;
            },
            setBase() {
              this.current = this.base;
              this.element.innerHTML = this.base;
            },
          },

          gold: {
            base: 100,
            current: 0,
            element: document.getElementById("goldCount"),
            async add(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: true,
                },
              ]);
              this.current += amt;
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
              this.current -= amt;
            },
            setBase() {
              this.current = this.base;
              this.element.innerHTML = this.base;
            },
          },

          health: {
            base: 100,
            current: 0,
            element: document.getElementById("playerHealth"),
            async add(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: true,
                },
              ]);
              this.current += amt;
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
              this.current -= amt;
            },
            setBase() {
              this.current = this.base;
              this.element.innerHTML = this.base;
            },
          },
          damage: {
            base: 25,
            current: 25,
            element: document.getElementById("playerDamage"),
            toApply: 25,
            async add(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: true,
                },
              ]);
              this.current += amt;
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
              this.current -= amt;
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
              this.current += amt;
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
              this.current -= amt;
            },
            setBase() {
              this.current = this.base;
              this.element.innerHTML = `$${this.base}`;
            },
          },
          reset() {
            ///Targets every child of stats that isnt a function
            ///And runs setBase();
            for (const [key, value] of Object.entries(this)) {
              if (
                value &&
                typeof value === "object" &&
                typeof value.setBase === "function"
              ) {
                value.setBase();
              }
            }
            ///Adding ?. fixes it from using the function
            ///Before the object is created.
            this.updateDiceUi?.();
          },
        },
      },

      // UI DOM caching mapping to render live values when allocation indicators change
      ///The hell is this comment.

      /**
       * PLAYER DICE TRACER: Syncs raw JavaScript arrays out to HTML layouts
       */

      // Core data structures for tracking ammunition pools across turn actions

      toggleRollBox() {
        document.getElementById("rolledBoxPlayer").classList.toggle("hide");
      },

      async reset() {
        this.data.dice.reset();
        this.data.stats.reset();
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
          base: [3, 1, 0, 0, 0, 0],
          element: document.getElementById("enemyDiceContainer"),
          currentValue: 0,
          currentValueUi: document.getElementById("numRolledTextEnemy"),

          async roll() {
            let diceToRoll = [];
            var root = gameObjects.diceObjects.enemy;

            this.updateSelectedDice();
            this.updateDiceUi();
            console.log("Rolling with selected dice:", this.selected);

            this.selected.forEach((amt, i) => {
              if (amt > 0) {
                diceToRoll.push(amt + types[i]);
                this.current[i] -= amt;
              }
            });
                this.updateDiceUi();
            this.selected = [0, 0, 0, 0, 0, 0];

            console.log("Dice to roll:", diceToRoll);

            if (diceToRoll.length === 0) {
              return 0;
            }

            return new Promise((resolve) => {
              this.box.onRollComplete = (results) => {
                this.currentValue = results.reduce(
                  (sum, d) => sum + d.value,
                  0,
                );
                this.currentValueUi.innerHTML = `${this.currentValue} + ${gameObjects.diceObjects.enemy.data.stats.damage.current}`;
                root.toggleRollBox();

                setTimeout(() => {
                  this.box.clear();
                  root.toggleRollBox();
                }, 1800);

                this.box.onRollComplete = null;
                resolve(this.currentValue);
                var damage = gameObjects.diceObjects.enemy.data.stats.damage;
                damage.toApply = damage.current + this.currentValue;
            
              };

              this.box.roll(diceToRoll);
            });
          },

          async updateDiceUi() {
            let elementTexts = [];
            for (let i = 0; i < this.current.length; i++) {
              if (this.current[i] > 0) {
                elementTexts.push(`(${types[i]}  ${this.current[i]}) |`);
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
            this.element.replaceChildren(...headingElements);
          },
          updateSelectedDice() {
            // Guard clause: Exit if there are no dice available to choose from
            for (let i = 0; i < this.current.length; i++) {
              if (i <= 0) {
                console.log("Enemy has no dice left to choose from.");
                break;
              }
            }

            let agro = gameObjects.diceObjects.enemy.data.stats.weights.aggressiveness.current;
            let stats = gameObjects.diceObjects.enemy.data.stats;
          
            // 2. Loop continues ONLY if we have agro left AND dice are available AND we haven't hit the safety limit
            while (
               agro > 0
            ) {


              // Roll to see if enemy wants to take a die
              if (ranNum(0, 100) < agro) {
                // Select a random index based on what is physically left in the pool
                let index = Math.floor(ranNum(0, this.current.length));

                // Safeguard against out-of-bounds math
                if (index >= this.current.length) {
                  index = this.current.length - 1;
                }

                // Move a die to the chosen pool
                this.current[index]--;
                this.selected[index]++;
                stats.weights.aggressiveness.applyRate();

                // Reduce agro weight per choice
              } else {
                // Enemy rolled above current agro weight, decides to stop choosing
                break;
              }
            }
            gameObjects.diceObjects.enemy.data.stats.weights.aggressiveness.setBase();
            console.log("Enemy dice chosen:", this.selected);
            this.updateDiceUi();
          },
          NewDice() {
            ///Player is given leftover dice.
            var player = gameObjects.diceObjects.player;
            var enemy = gameObjects.diceObjects.enemy;
            if (!gameObjects.firstReset) {
              var arrayToPass = [];
              for (let i = 0; i < this.current.length; i++) {
                let die = types[i];
                arrayToPass[i] = {
                  element: player.data.dice.diceInvUi.quan.total[die],
                  add: true,
                  oldAmt: player.data.dice.current[i],
                  amt: enemy.data.dice.current[i],
                };
                player.data.dice.current[i] += enemy.data.dice.current[i];
              }
              addSubToStats(arrayToPass);
            } else {
              console.log(
                "gameObjects.firstReset is true, not giving enemy dice to player.",
              );
            }

            this.current = [0, 0, 0, 0, 0, 0];

            // Number of dice to give based on strength
            let weights = enemy.data.stats.weights;
            let diceToGive = Math.ceil(
              weights.strength.current + weights.minDice.current,
            );
            console.log(`Number of dice to give: ${diceToGive}`);

            ///Enemy is given dice
            for (let i = 0; i < diceToGive; i++) {
              console.log("giving enemy another die...");
              ///Pulling the same while loop from updateSelectedDice
              let cycleLimt = 0; // Safety limit to prevent infinite loops in edge cases where agroWeight doesn't decrease properly
              while (weights.aggressiveness.current > 0 || cycleLimt > 200) {
                ///To choose wheather to choose a die.
                if (ranNum(0, 100) < weights.aggressiveness.current) {
                  let ranNumToUse = ranNum(0, 100);

                  weights.aggressiveness.applyRate();
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
                      `cycleLimit hit, current agroWeight: ${enemy.data.stats.weights.aggressiveness.current}`,
                    );
                  }
                  break;
                }
              }
            }
            weights.aggressiveness.setBase();

            console.log(this.current);
            this.updateDiceUi();
          },

          setBase() {
            this.current = this.base;
            this.updateDiceUi();
          },
          reset() {
            this.NewDice();
            this.updateDiceUi();
          },
        },
        stats: {
          weights: {
            strength: {
              current: 1.5,
              base: 1.5,
              rate: 1.5,
              setBase() {
                this.current = this.base;
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
              },
              applyRate() {
                this.current *= this.rate;
              },
            },
          },

          health: {
            base: 100,
            current: 0,
            element: document.getElementById("enemyHealth"),
            async add(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: true,
                },
              ]);
              this.current += amt;
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
              this.current -= amt;
            },
            setBase() {
              this.current = this.base;
              this.element.innerHTML = this.base;
            },
          },
          damage: {
            base: 50,
            current: 50,
            element: document.getElementById("enemyDamage"),
            toApply: 50,
            async add(amt) {
              await addSubToStats([
                {
                  element: this.element,
                  amt: amt,
                  oldAmt: this.current,
                  add: true,
                },
              ]);
              this.current += amt;
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
              this.current -= amt;
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
              this.current += amt;
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
              this.current -= amt;
            },
            setBase() {
              this.current = this.base;
              this.element.innerHTML = `$${this.base}`;
            },
          },
          reset() {
            ///Targets every child of stats that isnt a function
            ///And runs setBase();
            for (const [key, value] of Object.entries(this)) {
              if (
                value &&
                typeof value === "object" &&
                typeof value.setBase === "function"
              ) {
                value.setBase();
              }
            }
            ///Adding ?. fixes it from using the function
            ///Before the object is created.
            this.updateDiceUi?.();

            this.giveNewDice?.();
            this.updateDiceUi?.();
          },
        },
      },

      async slay() {
        var player = gameObjects.diceObjects.player;
        var enemy = gameObjects.diceObjects.enemy;

        player.data.dice.setBase();

        await player.data.stats.gold.add(this.data.stats.bounty.current);
        await player.data.stats.slain.add(1);

        var stats = gameObjects.diceObjects.enemy.data.stats;

        ///enemy health can be negative after player attack
        stats.health.current = 0;

        await stats.bounty.add(
          Math.ceil(stats.bounty.base * stats.weights.strength.current),
        );
        stats.weights.strength.applyRate();

        await stats.health.add(
          Math.ceil(stats.health.base * stats.weights.strength.current),
        );

        await stats.damage.add(
          Math.ceil(stats.damage.base * stats.weights.strength.current),
        );

        // Regenerate fresh pool targets augmented cleanly by scale tracking factor variables

        enemy.data.dice.NewDice();
        enemy.data.dice.updateDiceUi();
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
