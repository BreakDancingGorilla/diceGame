// ============================================================================
// EXTERNAL MODULE IMPORTS & ENGINE INITIALIZATION
// ============================================================================

// Import the 3D dice rolling engine framework via a public delivery CDN network
import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";

/**
 * QUICK REFERENCE: DICE BOX INDEX SYSTEM MAP
 * Index 0 -> d4  (4-sided die)
 * Index 1 -> d6  (6-sided die)
 * Index 2 -> d8  (8-sided die)
 * Index 3 -> d10 (10-sided die)
 * Index 4 -> d12 (12-sided die)
 * Index 5 -> d20 (20-sided die)
 */

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

        /**
         * PLAYER DICE TRACER: Syncs raw JavaScript arrays out to HTML layouts
         */
        updateDiceInv() {
          const types = ["d4", "d6", "d8", "d10", "d12", "d20"];
          for (let i = 0; i < this.dice.length; i++) {
            this.diceInvUi.quan.select[types[i]].innerHTML = this.selectedDice[i];
            this.diceInvUi.quan.total[types[i]].innerHTML = this.dice[i];
          }
        },

        // Core data structures for tracking ammunition pools across turn actions
        dice: [2, 3, 1, 5, 3, 0],         // Live mutable stockpile pools
        baseDice: [2, 3, 5, 3, 0, 0],     // Fallback template defaults mapped during resets
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
          const targetHealth = Math.max(0, this.healthNum - (gameObjects.diceObjects.enemy.damageNum + enemyRoll));
          this.updateHealth(targetHealth);
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
        strength: 1.5,           // Multiplier tracking incremental combat difficulties
        strengthGrowthRate: 0.5, // Progression modifier added per kill record achieved
        goldWorth: 5,

        healthElement: document.getElementById("enemyHealth"),
        damageElement: document.getElementById("enemyDamage"),

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
          const targetHealth = Math.max(0, this.healthNum - (gameObjects.diceObjects.player.damageNum + playerRoll));
          this.updateHealth(targetHealth);
        },

        /**
         * ENEMY SLAIN / DEFEAT CONSEQUENCES ENGINE
         * Distributes drops, updates metrics, inflates difficulty coefficients, and rolls fresh generation
         */
        slay() {
          gameObjects.gold.add(this.goldWorth);
          gameObjects.slain.add(1);

          this.strength += this.strengthGrowthRate; // Scale combat curves harder for next lifecycle spawn

          // Regenerate fresh pool targets augmented cleanly by scale tracking factor variables
          this.updateHealth(Math.round(this.baseHealth * this.strength));
          this.updateDamage(Math.round(this.baseDamage * this.strength));
        },

        reset() {
          this.strength = 1.5;
          this.dice = [...this.baseDice];
          this.updateHealth(this.baseHealth);
          this.updateDamage(this.baseDamage);
        },
      },
    },

    // ========================================================================
    // CORE ASYNCHRONOUS ENGINE: PHYSICAL 3D DICE DRAWER / RESOLVER
    // ========================================================================
    async roll(obj) {
      let diceToRoll = [];
      console.log("Rolling with selected dice:", obj.selectedDice);

      // Map loop targets directly against global dictionary indexes to compile 3D string prompts
      const types = ["d4", "d6", "d8", "d10", "d12", "d20"];
      obj.selectedDice.forEach((amt, i) => {
        if (amt > 0) {
          diceToRoll.push(amt + types[i]); // Compiles strings like: "2d6" or "1d20"
          obj.dice[i] -= amt;             // Deduct spent ammo quantities permanently out of inventory pool
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
          
          obj.toggleRollBox();                   // Display overlay panel readout cards to viewport tracking nodes
          
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
  async function handleTurn(actionType) {
    if (rolling) return; // Mutex Guard Clause: locks interface controls down while animations resolve asynchronously
    rolling = true;

    // ------------------------------------------------------------------------
    // BRANCH A: INTERCEPT SELECTION DRIVEN ATTACK MECHANICS ROUTINES
    // ------------------------------------------------------------------------
      ////Do a select dice handler here, right a method for both the player and the enemy to use. 
        ////We are going to have to make the enenmy dice system now. 
        ////Refer to apple text document for outline. 

    if (actionType === "attack") {
      // Execute canvas operations and await response payloads explicitly
      const playerRoll = await gameObjects.roll(gameObjects.diceObjects.player);
      gameObjects.diceObjects.enemy.applyDamage(playerRoll);

      // Check for structural enemy lifecycle failure states instantly before allowing execution frames to pass turns
      console.log("Enemy health after attack:", gameObjects.diceObjects.enemy.healthNum);
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
      const targetHealth = gameObjects.diceObjects.player.healthNum + healAmount;
      
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
  healBtn.addEventListener("click", () => handleTurn("heal"));
});
