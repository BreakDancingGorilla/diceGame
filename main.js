import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";
import { gameObjects } from "./scripts/dice.js";
import { ranNum, addSubToStats, buttonTimeout } from "./scripts/helpers.js";
import { shop } from "./scripts/shop.js";

const types = ["d4", "d6", "d8", "d10", "d12", "d20"];

addEventListener("load", () => {
  gameObjects.init();

  /*  var buttons = {
    attackBtn = document.getElementById("attackButton"),
    healBtn = document.getElementById("healbutton"),
    diceHolder = document.getElementById("playerDiceHolder"),
            
  } */

  // Cache static interactive DOM po  inter handles
  const attackBtn = document.getElementById("attackButton");
  const healBtn = document.getElementById("healbutton");
  const diceHolder = document.getElementById("playerDiceHolder");
  const sliderState = document.getElementById("card-mode-toggle");

  // Global concurrency mutex lock tracker preventing actions from colliding mid-animation frame queues
  var rolling = false;

  ///selected player dice to play is clicked.

  // Intercept clicks passing through parent containers to map target selectors seamlessly without duplications
  diceHolder.addEventListener("click", (event) => {
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
    //Okay all this does is update the ui. this is changing something

    gameObjects.diceObjects.player.updateDiceInv(); // Cascade changes out to visible overlay layout maps
  });

  ///Should the player attack or heal.
  var currentMode = "attack";
  sliderState.addEventListener("click", function () {
    currentMode = document.getElementById("card-mode-toggle").checked
      ? "heal"
      : "attack";
    console.log(`currentMode switched: New mode, ${currentMode}`);
  });

  ////Shop button is clicked

  shop.data.general.closeButton.addEventListener("click", function () {
    shop.methods.showShop(false);
  });

  shop.data.general.openButton.addEventListener("click", function () {
    if (rolling) {
      return;
    }
    if (shop.data.general.shopOpen) {
      return;
    }

    //Stop shop from opening if mid turn.
    shop.methods.updateAllui();
    shop.methods.showShop(true);
    ///Shop is now visiable

    ///think im going to make a while loop here.
  });

  ///Just running this shit to try to fix a bug that only happens the first turn.

  ////Now that we got rid of all the synrounus stuff.
  ///Just add locks everywhere.

///READ ME 
  ///await only works if the function/method its calling is returning a promise

  attackBtn.addEventListener("click", async function(){
    console.log("gameLoop started");
    if (shop.data.general.shopOpen) {
      console.log("gameLoop ended, shop is open.")
      return;
    }

    buttonTimeout(true);


    ///Rolling the player's dice. 
   var diceRollSumPlayer = await gameObjects.roll(gameObjects.diceObjects.player);
   gameObjects.diceObjects.player.updateDiceInv();
   console.log(`dice finished rolling for player, sum: ${diceRollSumPlayer}`);


    ///Apply health to player or damage to enemy

    if (currentMode === "attack") {
      console.log(gameObjects.diceObjects.player.damageNum);
      await gameObjects.diceObjects.enemy.applyDamage(diceRollSumPlayer,false);
      console.log("diceRoll applied to enemy");
    }
    else {
      await gameObjects.diceObjects.player.updateHealth(diceRollSumPlayer,true);
            console.log("diceRoll applied to player");
    }
    

    ////The problem is the gameloop is not stopping and the enemy health is not being updated in time for the check below. 




    ///Reset selecteddice back to zero
    gameObjects.diceObjects.player.selectedDice = [0,0,0,0,0,0];
 console.log(gameObjects.diceObjects.enemy.healthNum);
    ///Check if enemy is dead. 
    if (gameObjects.diceObjects.enemy.healthNum <= 0) {
      gameObjects.diceObjects.enemy.slay();
      console.log("enemy is dead, enemy.slay called.")
      buttonTimeout(false);
      return;
    }
    console.log(gameObjects.diceObjects.enemy.healthNum);
    ///enemy rendomly selected dice to use.
    gameObjects.diceObjects.enemy.updateSelectedDice();
       

  ///Roll dice for enemy  
  var diceRollSumEnemy = await gameObjects.roll(gameObjects.diceObjects.enemy);
   gameObjects.diceObjects.player.updateDiceInv();
   console.log(`dice finished rolling for enemy, sum: ${diceRollSumEnemy}`);

  ///Apply damage to player
  await gameObjects.diceObjects.player.applyDamage(diceRollSumEnemy,false);

  ///Check if player is dead. 
  if (gameObjects.diceObjects.player.healthNum <= 0) {
    gameObjects.reset();
    console.log("player is dead. Calling gameObjects.reset");
    buttonTimeout(false);
    return; 
  }



buttonTimeout(false);
console.log(gameObjects.diceObjects.enemy.healthNum);
console.log("gameLoop ended");


   
});

  ///So I named this async, as it reads the function line by line, it will stop at awaits.
  ///and not contuine until the await is finsihed, but unlike a while loop, the rest of the page can run



});
