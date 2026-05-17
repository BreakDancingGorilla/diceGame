// ============================================================================
// EXTERNAL MODULE IMPORTS & ENGINE INITIALIZATION
// ============================================================================

// Import the 3D dice rolling engine framework via a public delivery CDN network
import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";
const types = ["d4", "d6", "d8", "d10", "d12", "d20"];
/**
 * QUICK REFERENCE: DICE BOX INDEX SYSTEM MAP
 * Index 0 -> d4  (4-sided die)
 * Index 1 -> d6  (6-sided die)
 * Index 2 -> d8  (8-sided die)
 * Index 3 -> d10 (10-sided die)
 * Index 4 -> d12 (12-sided die)
 * Index 5 -> d20 (20-sided die)
 */

function ranNum(min, max) {
  let seed = Math.random();
  seed = Math.floor(seed * (max - (min - 1))) + min;
  return seed;
}

// The gameplay loop waits completely for the browser viewport window to finish loading HTML assets
addEventListener("load", () => {
  // Attach game controller directly to window context so it can be debugged easily via browser console
  window.gameObjects = {
    initialized: false, // Flag tracking if the 3D canvases are ready to intercept user inputs

    /**
     * INITIALIZATION METHOD: Runs once at application startup
     * Boots the 3D engines and loads the inventory array visuals
     */
    async init() {
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

    /**
     * RESET ENGINE METHOD: Cascades reset commands down to every state machine tracking data
     */
    reset() {
      this.slain.reset();
      this.gold.reset();
      this.diceObjects.player.reset();
      this.diceObjects.enemy.reset();
    },

    // ========================================================================
    // STATE ENGINE SUB-OBJECT: SLAIN ENEMY TRACKER
    // ========================================================================

    ///Going to do the give player the extra die thing in this method.
    ///Well shit we have to find where to put it before the dice is reset
    slain: {
      num: 0,
      element: document.getElementById("slainCount"),
      add(num) {
        this.num += num;
        this.element.innerHTML = this.num;
      },
      reset() {
        this.num = 0;
        this.element.innerHTML = 0;
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
        this.num = 0;
        this.element.innerHTML = 0;
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
          const types = ["d4", "d6", "d8", "d10", "d12", "d20"];
          for (let i = 0; i < this.dice.length; i++) {
            this.diceInvUi.quan.select[types[i]].innerHTML =
              this.selectedDice[i];
            this.diceInvUi.quan.total[types[i]].innerHTML = this.dice[i];
          }
        },

        // Core data structures for tracking ammunition pools across turn actions
        dice: [2, 3, 1, 5, 3, 0], // Live mutable stockpile pools
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
        updateHealth(num) {
          var damage = this.healthNum - num;
          this.healthElement.innerHTML = `${this.healthNum} - ${damage}`;
          this.healthNum = num;
          setTimeout(() => {
            this.healthElement.innerHTML = num;
          }, 1500);
        },

        updateDamage(num) {
          this.damageNum = num;
          this.damageElement.innerHTML = num;
        },

        /**
         * PLAYER DAMAGE INTAKE CALCULATION pipeline
         * Deducts raw numbers based on incoming variables passed by enemy actions
         */
        applyDamage(enemyRoll) {
          // Clamp calculation using Math.max to prevent player health from rendering below 0
          const targetHealth = Math.max(
            0,
            this.healthNum -
              (gameObjects.diceObjects.enemy.damageNum + enemyRoll),
          );
          this.updateHealth(targetHealth);
        },

        updateSelectedDice() {
          ///The selection reset was moved to
          ///enemy.applyDamage and this fixes the ordering problem.
        },

        reset() {
          this.dice = [...this.baseDice];
          this.updateHealth(this.baseHealth);
          this.updateDamage(this.baseDamage);
          this.selectedDice = [0, 0, 0, 0, 0, 0];
        },
      },

      // ----------------------------------------------------------------------
      // ENEMY PROPERTIES, PROGRESSION SCALING, AND STAT HOOKS
      // ----------------------------------------------------------------------
      enemy: {
        box: new DiceBox({
          assetPath: "assets/",
          origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
          container: "#enemy-dice-box",
          scale: 10,
        }),

        dice: [2, 1, 0, 0, 0, 0],
        selectedDice: [2, 1, 0, 0, 0, 0], // AI automatically stages maximum pool resources out right away
        baseDice: [2, 1, 0, 0, 0, 0],
        currentDiceValue: 0,
        currentDiceValueUi: document.getElementById("numRolledTextEnemy"),

        baseHealth: 100,
        baseDamage: 7,
        strength: 1.5, // Multiplier tracking incremental combat difficulties
        strengthGrowthRate: 0.5, // Progression modifier added per kill record achieved
        goldWorth: 5,

        healthElement: document.getElementById("enemyHealth"),
        damageElement: document.getElementById("enemyDamage"),
        bountyElement: document.getElementById("enemyBounty"),

        healthNum: 100,
        damageNum: 7,

        toggleRollBox() {
          document.getElementById("rolledBoxEnemy").classList.toggle("hide");
        },

        /**
         * ENEMY VISUAL HEALTH MANAGER
         * Displays the math reduction string, then updates raw values when timer concludes
         */

        updateHealth(num) {
          var damage = this.healthNum - num;
          this.healthElement.innerHTML = `${this.healthNum} - ${damage}`;
          this.healthNum = num;
          setTimeout(() => {
            this.healthElement.innerHTML = num;
          }, 1500);
        },

        updateDamage(num) {
          this.damageNum = num;
          this.damageElement.innerHTML = num;
        },

        /**
         * ENEMY DAMAGE INTAKE CALCULATION pipeline
         * FIX: Clamps reduction so health output bottoms out perfectly at 0 instead of hitting negatives
         */
        applyDamage(playerRoll) {
          // Math.max guarantees that if damage overshoots current HP, it lands squarely on 0
          const targetHealth = Math.max(
            0,
            this.healthNum -
              (gameObjects.diceObjects.player.damageNum + playerRoll),
          );
          this.updateHealth(targetHealth);
          gameObjects.diceObjects.player.selectedDice = [0, 0, 0, 0, 0, 0]; // Reset player selections immediately when enemy applies damage so the UI reflects the change right away without waiting for the next roll cycle to trigger updates
        },

        ///This is where we will stage the enemyDiceOutline. Going to have the same one for player,, just so we can call them for both in the same function.
        diceContainer: document.getElementById("enemyDiceContainer"),

        updateDiceUi() {
          /* let skip = true;
          for (let i = 0; i < this.dice.length; i++) {
            console.log(`Checking die index ${i} with quantity ${this.dice[i]}`);
            if (this.dice[i] > 0) {
              console.log("Enemy has dice, showing container.");
              this.diceContainer.classList.remove("hide");
              skip = false;
            }
          }
          if (skip) {
            console.log("Enemy has no dice, hiding container.");
            this.diceContainer.classList.add("hide");
          } */
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

        agroWeightBase: 60,
        currentAgroWeight: 60,
        ///Resets to base at the end of the enemy turn.
        agroDecayRate: 5, // Rate at which agro is decreased per ranNum call.

        updateSelectedDice: function () {
          this.updateDiceUi();

          // 1. Build the diceToChoose array properly
          let diceToChoose = [];
          for (let i = 0; i < this.dice.length; i++) {
            if (this.dice[i] > 0) {
              diceToChoose.push({ dieIndex: i, quantity: this.dice[i] });
            }
          }

          // Guard clause: Exit if there are no dice available to choose from
          if (diceToChoose.length === 0) {
            console.log("Enemy has no dice left to choose from.");
            return;
          }

          console.log("Enemy dice to choose from:", diceToChoose);

          // Initialize the selection tracker
          var diceChosen = [
            { dieIndex: 0, quantity: 0 },
            { dieIndex: 1, quantity: 0 },
            { dieIndex: 2, quantity: 0 },
            { dieIndex: 3, quantity: 0 },
            { dieIndex: 4, quantity: 0 },
            { dieIndex: 5, quantity: 0 },
          ];

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

              let chosenDie = diceToChoose[index];

              // Move a die to the chosen pool
              diceChosen[chosenDie.dieIndex].quantity += 1;
              chosenDie.quantity -= 1;

              // Reduce agro weight per choice
              this.currentAgroWeight -= this.agroDecayRate;

              // FIXED: Physically remove the die option from pool if empty to prevent undefined crashes
              if (chosenDie.quantity <= 0) {
                diceToChoose.splice(index, 1);
              }
            } else {
              // Enemy rolled above current agro weight, decides to stop choosing
              break;
            }
          }

          // Reset agro weight for the next turn
          this.currentAgroWeight = this.agroWeightBase;
          console.log("Enemy dice chosen:", diceChosen);

          // 3. Update the permanent selectedDice tracking array
          for (let i = 0; i < diceChosen.length; i++) {
            this.selectedDice[diceChosen[i].dieIndex] = diceChosen[i].quantity;
          }

          // 4. Deduct the chosen dice from the enemy's available pool
          for (let i = 0; i < diceChosen.length; i++) {
            this.dice[diceChosen[i].dieIndex] -= diceChosen[i].quantity;
          }

          this.updateDiceUi();
          console.log("Enemy selected dice:", this.selectedDice);
          console.log("Enemy dice inventory after selection:", this.dice);
        },

        //This will use the strength variable to scale
        //and the agro weight base.
        //The strength will decide how many dice to choose.
        //The agro will decide which dice to choose.

        ///!!! We add the give player dice shit here
        giveNewDice() {
          ///give player the fucking scraps.
          for (let i = 0; i < this.dice.length; i++) {
            ///Why are these saying can not set properties of undefined?
            //w
            gameObjects.diceObjects.player.diceInvUi.quan.total[
              types[i]
            ].innerHTML = " + " + this.dice[i];
            gameObjects.diceObjects.player.dice[i] += this.dice[i];
          }
          setTimeout(() => {
            for (let i = 0; i < this.dice.length; i++) {
              gameObjects.diceObjects.player.diceInvUi.quan.total[
                types[i]
              ].innerHTML = gameObjects.diceObjects.player.dice[i];
            }
          }, 1500);

          this.dice = [0, 0, 0, 0, 0, 0];

          let diceToGive = Math.ceil(this.strength); // Number of dice to give based on strength
          for (let i = 0; i < diceToGive; i++) {
            ///Pulling the same while loop from updateSelectedDice
            let cycleLimt = 0; // Safety limit to prevent infinite loops in edge cases where agroWeight doesn't decrease properly
            while (this.currentAgroWeight > 0 || cycleLimt > 100) {
              ///To choose wheather to choose a die.
              if (ranNum(0, 100) < this.currentAgroWeight) {
                let ranNumToUse = ranNum(0, this.currentAgroWeight);

                this.currentAgroWeight -= this.agroDecayRate; // Decrease agro weight to increase chances of breaking out of the loop and adding some variability to the dice selection process.
                // Formula: (num / 100) * arrayLength
                let index = Math.floor((ranNumToUse / 100) * this.dice.length);

                // Safeguard: Ensure a random number of exactly 100 doesn't cause an out-of-bounds error
                if (index >= this.dice.length) {
                  index = this.dice.length - 1;
                }
                this.dice[index] += 1; // Increment the quantity of the chosen die in the diceChosen array
                console.log(cycleLimt);
                cycleLimt++;
              } else {
                break;
              }
            }
          }

          this.updateDiceUi();
        },

        /*How to fix this. Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'dieIndex')
    at Object.updateSelectedDice (code.js:360:58)
    at Object.roll (code.js:474:11)
    at handleTurn (code.js:644:41)*/
        //
        //How do I fix it? The problem is that updateSelectedDice is trying to access dieIndex on an object that doesn't exist. This is because the diceChosen array is initialized with objects that have a dieIndex property, but when we try to access it, it's undefined. To fix this, we need to make sure that the objects in the diceChosen array are properly initialized with a dieIndex property before we try to access it. We can do this by changing the initialization of the diceChosen array to include the dieIndex property for each object. For example:
        // var diceChosen = [
        //   { dieIndex: 0, quantity: 0 },
        slay() {
          gameObjects.gold.add(this.goldWorth);
          gameObjects.slain.add(1);

          this.strength += this.strengthGrowthRate; // Scale combat curves harder for next lifecycle spawn

          // Regenerate fresh pool targets augmented cleanly by scale tracking factor variables
          this.updateHealth(Math.round(this.baseHealth * this.strength));
          this.updateDamage(Math.round(this.baseDamage * this.strength));
          this.bountyElement.innerHTML = "$" + this.goldWorth;
          this.giveNewDice();
          this.updateDiceUi();
        },

        reset() {
          this.strength = 1.5;
          this.dice = [...this.baseDice];
          this.updateHealth(this.baseHealth);
          this.updateDamage(this.baseDamage);
          this.bountyElement.innerHTML = "$" + this.goldWorth;
          this.giveNewDice();
          this.updateDiceUi();
        },
      },
    },

    // ========================================================================
    // CORE ASYNCHRONOUS ENGINE: PHYSICAL 3D DICE DRAWER / RESOLVER
    // ========================================================================
    async roll(obj) {
      let diceToRoll = [];

      ////Do a select dice handler here, right a method for both the player and the enemy to use.
      ////We are going to have to make the enenmy dice system now.
      ////Refer to apple text document for outline.
      obj.updateSelectedDice();

      console.log("Rolling with selected dice:", obj.selectedDice);

      // Map loop targets directly against global dictionary indexes to compile 3D string prompts
      obj.selectedDice.forEach((amt, i) => {
        if (amt > 0) {
          diceToRoll.push(amt + types[i]); // Compiles strings like: "2d6" or "1d20"
          obj.dice[i] -= amt; // Deduct spent ammo quantities permanently out of inventory pool
        }
        obj.selectedDice = [0, 0, 0, 0, 0, 0]; // Reset selections array back to default staging post-roll
      });

      console.log("Dice to roll:", diceToRoll);

      // Guard check: halts engine routines if player pushes action triggers with zero dice selected
      if (diceToRoll.length === 0) {
        obj.currentDiceValue = 0;
        obj.selectedDice = [0, 0, 0, 0, 0, 0];
        return 0;
      }

      // Capture callback completions into async promises so the main game script pauses naturally for 3D simulation loops
      return new Promise((resolve) => {
        // Define interceptor hook triggered natively when external physics tracking modules settle calculation frames
        obj.box.onRollComplete = (results) => {
          // Accumulate raw roll faces down into single arithmetic sum metrics
          obj.currentDiceValue = results.reduce((sum, d) => sum + d.value, 0);
          obj.currentDiceValueUi.innerHTML = obj.currentDiceValue;

          obj.toggleRollBox(); // Display overlay panel readout cards to viewport tracking nodes

          // Clear physical meshes off the canvas container field after rendering display targets
          setTimeout(() => {
            obj.box.clear();
            obj.toggleRollBox();
          }, 1500);

          obj.box.onRollComplete = null; // Clean up runtime hook references to prevent garbage collection memory leaking patterns
          resolve(obj.currentDiceValue); // Feed compiled numeric sums straight back out into active game turn queues
        };

        // Fire physical vectors into rendering engine wrappers to trigger rolling behaviors
        obj.box.roll(diceToRoll);
        ///Player selected dice reset in here because I haent set that up for the enemy yet.
        gameObjects.diceObjects.player.updateDiceInv(); // Force canvas inventories to capture deduction alterations visually
      });
    },
  };

  // Run core script bootstrapping routines
  gameObjects.init();

  // Cache static interactive DOM pointer handles
  const attackBtn = document.getElementById("attackButton");
  const healBtn = document.getElementById("healbutton");
  const diceHolder = document.getElementById("playerDiceHolder");

  // Global concurrency mutex lock tracker preventing actions from colliding mid-animation frame queues
  var rolling = false;

  // ============================================================================
  // INTERACTION FLOW PIPELINE: CENTRALIZED EVENT EVENT LISTENER FOR DICE ALLOCATION
  // ============================================================================
  if (diceHolder) {
    // Intercept clicks passing through parent containers to map target selectors seamlessly without duplications
    diceHolder.addEventListener("click", (event) => {
      // Pull down reference mappings to structural button containers housing active asset pointers
      const button = event.target.closest(".select-button");
      if (!button) return; // Disregard arbitrary ambient clicks targeting empty canvas zones or background graphics

      console.log("button clicked", button.id);
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
        if (player.selectedDice[dieIndex] < player.dice[dieIndex]) {
          console.log(`Incrementing die index ${dieIndex}`);
          player.selectedDice[dieIndex] += 1;
        }
      } else {
        if (player.selectedDice[dieIndex] > 0) {
          player.selectedDice[dieIndex] -= 1;
        }
      }
      console.log("Selected dice:", player.selectedDice);
      gameObjects.diceObjects.player.updateDiceInv(); // Cascade changes out to visible overlay layout maps
    });
  } else {
    console.error("Could not find #playerDiceHolder in the DOM!");
  }

  // ============================================================================
  // CENTRALIZED STATE ENGINE GAMEPLAY TURN MACHINE PIPELINE
  // ============================================================================

  ////Going to do all the shop stuff here.
  ///DataStructureFirst
  var shop = {
    data: {

    general: {
      shopTitle: document.getElementById("shopTitle"),
      brokegif: document.getElementById("brokeGif"),
      shopOpen: false,
      openButton: document.getElementById("shopOpenButton"),
      closeButton: document.getElementById("shopExitButton"),
      diceMenu: document.getElementById("shopBox"),
    },



    buySell: {
      ui: {
      buy: {
        buySelectedButton: document.getElementById("buySelected"),
        selectedTotal: document.getElementById("selectedBuyTotal"),
      },
      sell: {
        sellSelectedButton: document.getElementById("sellDice"),
        selectedTotal: document.getElementById("selectedDiceSellTotal"),
      },
    }
    },

    items: {
      reRoll: {
        ui: {
          h1: {
            cost: document.getElementById("reRollCost"),
            amtSelected: document.getElementById("reRollSelectedAmt"),
          },
          btn: {
            selectUp: document.getElementById("reRollSelectUp"),
            selectDown: document.getElementById("reRollSelectDown"),
          },
        },
        data: {
          cost: 5,
          amtSelected: 0,
        },
      },
      weightedDice: {
        ui: {
          h1: {
            cost: document.getElementById("weightedDiceCost"),
            amtSelected: document.getElementById("weightedDiceSelectedAmt"),
          },
          btn: {
            selectUp: document.getElementById("weightedDiceSelectUp"),
            selectDown: document.getElementById("weightedDiceSelectDown"),
          },
        },
        data: {
          cost: 5,
          amtSelected: 0,
        },
      },
    },
    stats: {
      health: {
        ui: {
          h1: {
            name: document.getElementById("healthName"),
            cost: document.getElementById("healthCost"),
            amtSelected: document.getElementById("healthSelectedAmt"),
          },
          btn: {
            selectUp: document.getElementById("healthSelectUp"),
            selectDown: document.getElementById("healthSelectDown"),
          },
        },
        data: {
          cost: 5,
          amtSelected: 0,
          healthPoints: 0,
        },
      },
      damage: {
        ui: {
          h1: {
            name: document.getElementById("damageName"),
            cost: document.getElementById("damageCost"),
            amtSelected: document.getElementById("damageSelectedAmt"),
          },
          btn: {
            selectUp: document.getElementById("damageSelectUp"),
            selectDown: document.getElementById("damageSelectDown"),
          },
        },
        data: {
          cost: 5,
          amtSelected: 0,
          damagePoints: 0,
        },
      },
    },
      dice: [ //Remember this an array, each index has the data for each die. 
        {
          ui: {
            h1: {
              dieSelectAmt: document.getElementById("dieSelectedAmt1"),
              dieSellPrice: document.getElementById("dieSellPrice1"),
            },
            btn: {
              dieSelectUp: document.getElementById("shopDieSelectUp1"),
              dieSelectDown: document.getElementById("shopDieSelectDown1"),
            }
          },
          data: {
            sellPrice: 100,
            amtSelected: 0,
          },
        },
        {
          ui: {
            h1: {
              dieSelectAmt: document.getElementById("dieSelectedAmt2"),
              dieSellPrice: document.getElementById("dieSellPrice2"),
            },
            btn: {
              dieSelectUp: document.getElementById("shopDieSelectUp2"),
              dieSelectDown: document.getElementById("shopDieSelectDown2"),
            }
          },
          data: {
            sellPrice: 0,
            amtSelected: 0,
          },
        },
        {
          ui: {
            h1: {
              dieSelectAmt: document.getElementById("dieSelectedAmt3"),
              dieSellPrice: document.getElementById("dieSellPrice3"),
            },
            btn: {
              dieSelectUp: document.getElementById("shopDieSelectUp3"),
              dieSelectDown: document.getElementById("shopDieSelectDown3"),
            }
          },
          data: {
            sellPrice: 0,
            amtSelected: 0,
          },
        },
        {
          ui: {
            h1: {
              dieSelectAmt: document.getElementById("dieSelectedAmt4"),
              dieSellPrice: document.getElementById("dieSellPrice4"),
            },
            btn: {
              dieSelectUp: document.getElementById("shopDieSelectUp4"),
              dieSelectDown: document.getElementById("shopDieSelectDown4"),
            }
          },
          data: {
            sellPrice: 0,
            amtSelected: 0,
          },
        },
        {
          ui: {
            h1: {
              dieSelectAmt: document.getElementById("dieSelectedAmt5"),
              dieSellPrice: document.getElementById("dieSellPrice5"),
            },
            btn: {
              dieSelectUp: document.getElementById("shopDieSelectUp5"),
              dieSelectDown: document.getElementById("shopDieSelectDown5"),
            }
          },
          data: {
            sellPrice: 0,
            amtSelected: 0,
          },
        },
       {
          ui: {
            h1: {
              dieSelectAmt: document.getElementById("dieSelectedAmt6"),
              dieSellPrice: document.getElementById("dieSellPrice6"),
            },
            btn: {
              dieSelectUp: document.getElementById("shopDieSelectUp6"),
              dieSelectDown: document.getElementById("shopDieSelectDown6"),
            }
          },
          data: {
            sellPrice: 0,
            amtSelected: 0,
          },
        },
      ],
    },
    methods: {

      showShop(bool) {
        if (bool) {
          shop.data.general.diceMenu.classList.remove("hide");
          shop.data.general.shopOpen = true;
          return;
        }
        else {
           shop.data.general.diceMenu.classList.add("hide");
           shop.data.general.shopOpen = false;
           return;
        }
      },
      ////Updates all the ui elements with the data 
      ///stats/items
      updateAllUiHelper(root){
        root.ui.h1.amtSelected.innerHTML = root.data.amtSelected;
        root.ui.h1.cost.innerHTML = root.data.cost;
      },

      updateAllui() {
        ///Items
        this.updateAllUiHelper(shop.data.items.reRoll);
        this.updateAllUiHelper(shop.data.items.weightedDice);
        ///Stats
        this.updateAllUiHelper(shop.data.stats.health);
        this.updateAllUiHelper(shop.data.stats.damage);

        ///Stat names
        shop.data.stats.health.ui.h1.name.innerHTML = `${shop.data.stats.health.data.healthPoints} Health Points`;
        shop.data.stats.damage.ui.h1.name.innerHTML = `${shop.data.stats.damage.data.damagePoints} Damage Points`;

        //dice
        for (let i = 0; i < shop.data.dice.length; i++) {
            let uiRoot = shop.data.dice[i].ui.h1;
            let dataRoot = shop.data.dice[i].data;
            console.log(uiRoot);
            uiRoot.dieSelectAmt .innerHTML= dataRoot.amtSelected;
            console.log(uiRoot.dieSellPrice.innerHTML)
            uiRoot.dieSellPrice.innerHTML = dataRoot.sellPrice;
        }
        //general 
        shop.data.general.shopTitle.innerHTML = `Cash: ${gameObjects.gold.num}`
      },
      
      
      
    }
  };

  shop.data.general.closeButton.addEventListener("click", function() {
  shop.methods.showShop(false);
  });

  shop.data.general.openButton.addEventListener("click", function() {
    if (rolling) {return}; //Stop shop from opening if mid turn.
    shop.methods.updateAllui();
    shop.methods.showShop(true); 
    ///Shop is now visiable 


    ///think im going to make a while loop here. 




  });




  async function handleTurn(actionType) {
    if (rolling) return; // Mutex Guard Clause: locks interface controls down while animations resolve asynchronously
    if(shop.data.general.shopOpen) {return}; 
    rolling = true;

    // ------------------------------------------------------------------------
    // BRANCH A: INTERCEPT SELECTION DRIVEN ATTACK MECHANICS ROUTINES
    // ------------------------------------------------------------------------

    if (actionType === "attack") {
      // Execute canvas operations and await response payloads explicitly
      const playerRoll = await gameObjects.roll(gameObjects.diceObjects.player);
      gameObjects.diceObjects.enemy.applyDamage(playerRoll);

      // Check for structural enemy lifecycle failure states instantly before allowing execution frames to pass turns
      console.log(
        "Enemy health after attack:",
        gameObjects.diceObjects.enemy.healthNum,
      );
      if (gameObjects.diceObjects.enemy.healthNum <= 0) {
        gameObjects.diceObjects.enemy.slay();
        rolling = false;
        return; // Early return terminates workflow execution lines completely so dead targets cannot counter-attack
      }

      // ------------------------------------------------------------------------
      // BRANCH B: INTERCEPT SELECTION DRIVEN PLAYER HEALING MECHANICS ROUTINES
      // ------------------------------------------------------------------------
    } else if (actionType === "heal") {
      // Collect healing values straight out of active dice boxes
      const healAmount = await gameObjects.roll(gameObjects.diceObjects.player);

      // FIX: Calculate target limits ensuring total HP does not exceed maximum boundaries
      const targetHealth =
        gameObjects.diceObjects.player.healthNum + healAmount;
      // Update data variables and sync visually to the DOM
      gameObjects.diceObjects.player.updateHealth(targetHealth);
    }

    // ------------------------------------------------------------------------
    // ENEMY TURN: COUNTER-ATTACK PROCESSING QUEUE
    // ------------------------------------------------------------------------
    // The active enemy resolves its automatic dice routine now (fires regardless of whether Player chose attack or heal)
    const enemyRoll = await gameObjects.roll(gameObjects.diceObjects.enemy);
    gameObjects.diceObjects.player.applyDamage(enemyRoll);

    // Evaluate global game-over defeat threshold tracking loops
    if (gameObjects.diceObjects.player.healthNum <= 0) {
      gameObjects.reset(); // Full systemic cascade state tracking reset wipe
    }

    rolling = false; // Open interface locks up again allowing follow-up action requests to go through
  }

  // Bind unified processing triggers to main controller buttons
  attackBtn.addEventListener("click", () => handleTurn("attack"));
  ///We got rid of this so the above is complicated for no reason. Might add back. 
  ///Yeah we need to add back the roll of health points!! 
 // healBtn.addEventListener("click", () => handleTurn("heal"));
});
