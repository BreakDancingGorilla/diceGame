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
      `);
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
        console.log("UpdateDiceInv running, to change innerHtmls for dice inventory.")
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
          { element: gameObjects.diceObjects.player.healthElement, amt: num + gameObjects.diceObjects.player.damageNum, add: addOrSub },
           
        ]);
         if (addOrSub) {
          this.healthNum += num;
         }
         else {
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
          { element: gameObjects.diceObjects.player.healthElement, amt: enemyRoll + gameObjects.diceObjects.enemy.damageNum, add: false },

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
          { element: this.healthElement, amt: this.baseHealth, add: true },
          { element: this.damageElement, amt: this.baseDamage, add: true },
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
      box: new DiceBox({
        assetPath: "assets/",
        origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
        container: "#enemy-dice-box",
        scale: 10,
      }),

      dice: [3, 1, 0, 0, 0, 0],
      selectedDice: [2, 1, 0, 0, 0, 0], // AI automatically stages maximum pool resources out right away
      baseDice: [2, 1, 0, 0, 0, 0],
      currentDiceValue: 0,
      currentDiceValueUi: document.getElementById("numRolledTextEnemy"),

      baseHealth: 100,
      baseDamage: 7,
      baseStrength: 1.5,
      strength: 1.5, // Multiplier tracking incremental combat difficulties
      strengthGrowthRate: 0.5, // Progression modifier added per kill record achieved
      bounty: 5,
      baseBounty: 5,

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

      async updateHealth(num, addOrSub) {

          await addSubToStats([
          { element: this.healthElement, amt: num, add: addOrSub },
            
        ]);
        if (addOrSub) {
          this.healthNum += num;
        }
        else {
          this.healthNum -= num;
        }
      },
      async updateDamage(num,addOrSub) {
        await addSubToStats([{element:this.damageNum,amt:num,add:addOrSub}])
        if (addOrSub) {
          this.damageNum += num;
        }
        else {
          this.damageNum -= num;
        }
      },

      /**
       * ENEMY DAMAGE INTAKE CALCULATION pipeline
       * FIX: Clamps reduction so health output bottoms out perfectly at 0 instead of hitting negatives
       */
      applyDamage(playerRoll) {
     addSubToStats([
          { element: gameObjects.diceObjects.enemy.healthElement, amt: playerRoll + gameObjects.diceObjects.player.damageNum, add: false },

        ]);  
        this.healthNum -= (playerRoll + gameObjects.diceObjects.player.damageNum);
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

      ///Extra number of dice per enemy
      minDiceBonus: 5,
      ///Multiples the strength
      diceBonusMultipler: 1.5,

      agroWeightBase: 60,
      currentAgroWeight: 60,
      ///Resets to base at the end of the enemy turn.
      agroDecayRate: 5, // Rate at which agro is decreased per ranNum call.

      updateSelectedDice() {
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

          console.log("Enemy dice to choose from:", diceToChoose);
        }
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

      ///!!! We add the give player dice shit here
      giveNewDice() {
        console.log(
          `gameObjects.enemy.giveNewDice running. 
          Values to change: 
          player.dice: ${gameObjects.diceObjects.player.dice};
          enemy.dice ${gameObjects.diceObjects.enemy.dice};
          `,
        );

        ///Player is given dice here if it is not the first reset
        if (!gameObjects.firstReset) {
          var arrayToPass = [];
          for (let i = 0; i < this.dice.length; i++) {
            arrayToPass[i] = {
              element:
                gameObjects.diceObjects.player.diceInvUi.quan.total[types[i]],
              add: true,
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
              let index = Math.floor((ranNumToUse / 100) * this.dice.length);

              // Safeguard: Ensure a random number of exactly 100 doesn't cause an out-of-bounds error
              if (index >= this.dice.length) {
                index = this.dice.length - 1;
              }
              this.dice[index] += 1; // Increment the quantity of the chosen die in the diceChosen array
              console.log(`dice given:  ${types[index]}`);
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
        console.log(
          `gameObjects.enemy.giveNewDice running. 
          New values in order: 
          player.dice: ${gameObjects.diceObjects.player.dice};
          enemy.dice ${gameObjects.diceObjects.enemy.dice};
          `,
        );
        this.updateDiceUi();
      },

      async slay() {
        gameObjects.gold.add(this.bounty);
        gameObjects.slain.add(1);

        this.strength += this.strengthGrowthRate; // Scale combat curves harder for next lifecycle spawn

        // Regenerate fresh pool targets augmented cleanly by scale tracking factor variables
       await  this.updateHealth(Math.round(this.baseHealth * this.strength,true));
      await  this.updateDamage(Math.ceil(this.baseDamage * this.strength,true));
        console.log(
          `enemy.bounty to be ${Math.ceil(this.bounty * this.strength)}`,
        );
        this.bounty = Math.ceil(this.bounty * this.strength);
        this.bountyElement.innerHTML = "$" + this.bounty;
        this.giveNewDice();
        this.updateDiceUi();
      },

      reset() {
        console.log(
          `gameObjects.enemy.reset running. 
          Values to change: 
          enenmy.strength: ${this.strength} to be enemy.baseStrength: ${this.baseStrength}, 
          enemy.dice ${this.dice} to be enemy.baseDice: ${this.baseDice},
          enemy.healthElement & enemy.healthNum to be enemy.baseHealth: ${this.baseHealth},
            using addSubToStats
          enemy.damageElement & enemy.damageNum to be enemy.damageHealth: ${this.baseDamage},
            using addSubToStats
          enemy.bounty ${this.bounty} to be enemy.baseBounty: ${this.baseBounty},
          enemy.bountyElement: ${this.bountyElement.innerHTML} to be enemy.baseBounty ${this.baseBounty},
          new values in order:
          ${this.strength},
          ${this.dice},
          ${this.healthElement.innerHTML},
          ${this.healthNum},
          ${this.damageElement.innerHTML},
          ${this.damageNum},
          ${this.bounty},
          ${this.bountyElement.innerHTML},

        to run:
            enemy.giveNewDice()
            enemy.updateDiceUi()


          `,
        );
        this.strength = this.baseStrength;
        this.dice = [...this.baseDice];

        ///updateHealth and damage
        addSubToStats([
          { element: this.healthElement, amt: this.baseHealth, add: true },
          { element: this.damageElement, amt: this.baseDamage, add: true },
        ]);
        this.healthNum = this.baseHealth;
        this.damageNum = this.baseDamage;

        this.bounty = this.baseBounty;

        this.bountyElement.innerHTML = `$${this.baseBounty}`;

        this.giveNewDice();
        this.updateDiceUi();
      },
    },
  },

  // Add the word 'function' here:
async roll(obj) { 
  let diceToRoll = []; 


  console.log("Rolling with selected dice:", obj.selectedDice); 

  obj.selectedDice.forEach((amt, i) => { 
    if (amt > 0) { 
      diceToRoll.push(amt + types[i]); 
      obj.dice[i] -= amt; 
    } 
  }); 

  obj.selectedDice = [0, 0, 0, 0, 0, 0]; 

  console.log("Dice to roll:", diceToRoll); 

  if (diceToRoll.length === 0) { 
    obj.currentDiceValue = 0; 
    return 0; 
  } 

  return new Promise((resolve) => { 
    obj.box.onRollComplete = (results) => { 
      obj.currentDiceValue = results.reduce((sum, d) => sum + d.value, 0); 
      obj.currentDiceValueUi.innerHTML = obj.currentDiceValue; 
      obj.toggleRollBox(); 
      
      setTimeout(() => { 
        obj.box.clear(); 
        obj.toggleRollBox(); 
      }, 1800); 
      
      obj.box.onRollComplete = null; 
      resolve(obj.currentDiceValue); 
    }; 
    
    obj.box.roll(diceToRoll); 
    
    if (gameObjects && gameObjects.diceObjects && gameObjects.diceObjects.player) {
      gameObjects.diceObjects.player.updateDiceInv(); 
    }
  }); 
}

};
