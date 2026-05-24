import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";
import { gameObjects } from "./scripts/dice.js";
import { ranNum, addSubToStats, buttonTimeout } from "./scripts/helpers.js";
import { shop } from "./scripts/shop.js";

const types = ["d4", "d6", "d8", "d10", "d12", "d20"];

addEventListener("load", () => {
gameObjects.init();


const attackBtn = document.getElementById("attackButton");



  attackBtn.addEventListener("click", async function(){
    console.log("gameLoop started");
   
    if (shop.data.general.shopOpen) {
      console.log("gameLoop ended, shop is open.")
      return;
    }

    buttonTimeout(true);


    var player = gameObjects.diceObjects.player;
    var enemy = gameObjects.diceObjects.enemy;


    await player.data.dice.roll();

    console.log(player.data.stats.currentMode.attack);
    if (player.data.stats.currentMode.attack) {
      console.log("player t")
      await enemy.data.stats.health.sub(player.data.stats.damage.toApply);
    }
    else {
      await player.data.stats.health.add(player.data.stats.damage.toApply);
    }
    

    ///Check if enemy is dead. 
    if (enemy.data.stats.health.current <= 0) {
      await gameObjects.diceObjects.enemy.slay();
      console.log("enemy is dead, enemy.slay called.")
      buttonTimeout(false);
      return;
    }


    await enemy.data.dice.roll();

 

  ///Apply damage to player
  await player.data.stats.health.sub(enemy.data.stats.damage.toApply);



  ///Check if player is dead. 
  if (player.data.stats.health.current <= 0) {
    let deathScreen = document.getElementById("deathScreen");
    deathScreen.classList.remove("hide");
    
    setInterval(() => {
      deathScreen.classList.add("hide");
    }, 3000);
    gameObjects.firstReset = true;
    gameObjects.reset();
    buttonTimeout(false);
    return; 
  }



buttonTimeout(false);

console.log("gameLoop ended");


   
});


});
