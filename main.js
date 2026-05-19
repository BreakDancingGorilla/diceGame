// ============================================================================
// EXTERNAL MODULE IMPORTS & ENGINE INITIALIZATION
// ============================================================================
import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";
import { gameObjects } from './scripts/dice.js';
import {ranNum, addSubToStats, buttonTimeout} from './scripts/helpers.js'; 
import { shop } from "./scripts/shop.js";




const types = ["d4", "d6", "d8", "d10", "d12", "d20"];


// The gameplay loop waits completely for the browser viewport window to finish loading HTML assets
addEventListener("load", () => {

  // Import the 3D dice rolling engine framework via a public delivery CDN network







///From ai


  // Attach game controller directly to window context so it can be debugged easily via browser console
 

  // Run core script bootstrapping routines
  gameObjects.init();

  // Cache static interactive DOM po  inter handles
  const attackBtn = document.getElementById("attackButton");
  const healBtn = document.getElementById("healbutton");
  const diceHolder = document.getElementById("playerDiceHolder");

  // Global concurrency mutex lock tracker preventing actions from colliding mid-animation frame queues
  var rolling = false;

 
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


  shop.data.general.closeButton.addEventListener("click", function () {
    shop.methods.showShop(false);
  });

  shop.data.general.openButton.addEventListener("click", function () {
    if (rolling) {
      return;
    } //Stop shop from opening if mid turn.
    shop.methods.updateAllui();
    shop.methods.showShop(true);
    ///Shop is now visiable

    ///think im going to make a while loop here.
  });


///Just running this shit to try to fix a bug that only happens the first turn.

async function handleTurn(actionType) {

    if (rolling) return; // Mutex Guard Clause: locks interface controls down while animations resolve asynchronously
    if (shop.data.general.shopOpen) {
      return;
    }
   
    rolling = true;

    // ------------------------------------------------------------------------
    // BRANCH A: INTERCEPT SELECTION DRIVEN ATTACK MECHANICS ROUTINES
    // ------------------------------------------------------------------------

    if (actionType === "attack") {
           buttonTimeout(5000);
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
