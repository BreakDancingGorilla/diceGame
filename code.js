import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";
addEventListener("load", (event) => {


///Turn the dice into a big object. 

var dice = {

}




let playerBox = new DiceBox({
  assetPath: "assets/",
  origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
  container: "#player-dice-box",
  theme: "diceOfRolling",
  themeColor: "#feea03",
  externalThemes: {
    diceOfRolling: "https://www.unpkg.com/@3d-dice/theme-dice-of-rolling@0.2.1",
  },
  offscreen: true,
  scale: 6,
  // physics settings that must be set - defaults are buggy
  throwForce: 5,
  gravity: 1,
  mass: 1,
  spinForce: 6,
});


playerBox.init().then(async (world) => {
 
});

let enemyBox = new DiceBox({
  assetPath: "assets/",
  origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
  container: "#enemy-dice-box",
  theme: "diceOfRolling",
  themeColor: "#feea03",
  externalThemes: {
    diceOfRolling: "https://www.unpkg.com/@3d-dice/theme-dice-of-rolling@0.2.1",
  },
  offscreen: true,
  scale: 6,
  // physics settings that must be set - defaults are buggy
  throwForce: 5,
  gravity: 1,
  mass: 1,
  spinForce: 6,
});


enemyBox.init().then(async (world) => {
 
});



document.querySelector("body").style.backgroundColor = "blue";


var actionButtons = {
    attackDown: false,
    healDown: false,
    diceRoll: false,
    attackBtn: document.getElementById('attackButton'),
    healBtn: document.getElementById('healbutton'),
    diceRollBtn: document.getElementById('diceButton'),
}

///Use this to apply to stats. 
const standardDice = ["d4", "d6", "d8", "d10", "d12", "d20"];




var stats = {
    //When targeting the elements make sure to type innerHTML if updating the value.
   
   
   ///These need to be objects
    ///They all need to follow the same struture so we can use the small property names
   slain: {
        num: Number(document.getElementById("slainCount").innerHTML),
        element: document.getElementById("slainCount"),
    },
    gold: {
        num: Number(document.getElementById("goldCount").innerHTML),
        element: document.getElementById("goldCount"),
        update: function(num){
            this.element.innerHTML = num;
            num = num;
        },
    },
    player: {
        healthNum: Number(document.getElementById("playerHealth").innerHTML),
        healthElement: document.getElementById("playerHealth"),
        damageNum: Number(document.getElementById("playerDamage").innerHTML),
        damageElement: document.getElementById("playerDamage"),
        updateHealth: function(num){
            this.healthElement.innerHTML = num;
            num = num;
        },
        updateDamage: function(num){
            this.damageElement.innerHTML = num;
            num = num;
        },
        dieIndex: 0,
        dieValue: 0,
    },
    enemy: {
        healthNum: Number(document.getElementById("enemyHealth").innerHTML),
        healthElement: document.getElementById("enemyHealth"),
        damageNum: Number(document.getElementById("enemyDamage").innerHTML),
        damageElement: document.getElementById("enemyDamage"),
        dieIndex: 0,
        updateHealth: function(num){
            this.healthElement.innerHTML = num;
            num = num;
        },
        updateDamage: function(num){
            this.damageElement.innerHTML = num;
            num = num;
        },
        dieValue: 0,
    },

    
    upgradeDie: function(card){
    },




    applyDamage: function(damageTo, damageFrom){
        damageTo.updateHealth(damageTo.healthNum -= damageFrom.damageNum);
        console.log(damageTo.healthNum);
        if (damageTo.healthNum <= 0) {
            return true;
        }
        else {
            return false;
        }
    },
}

console.log(stats.applyDamage(stats.enemy,stats.player));



///Listens for the action button to be pressed
actionButtons.attackBtn.addEventListener('click', function() {
     enemyBox.roll(["4d20", "4d12", "4d10", "4d8", "4d6", "4d4"]);
    console.log("Button clicked! Attack");

});





///Listens for the heal button to be pressed
actionButtons.healBtn.addEventListener('click', function() {
    playerBox.roll(["1d20", "2d12"]);
    let total = 0;
    
    playerBox.onRollComplete = (rollResult) => { console.log(rollResult) };

/*     playerBox.onRollComplete = (rollResult) => {

        for()

        total+= rollResult.value;
        console.log(rollResult.value);
        console.log('die result', rollResult);
          console.log(total);

    }; */
  
    console.log("Button clicked! Heal");
    console.log("sdfds  " + total);
});

//listens for the dice roll button to be pressed.
actionButtons.diceRollBtn.addEventListener('click', function() {
     playerBox.roll(["4d20", "4d12", "4d10", "4d8", "4d6", "4d4"]);
    console.log("Button clicked! Dice Roll");
});







////add a event listener for when dice button is press and the other two.
//// If dice is pressed make sure one of the other buttons has been pressed. 







//For on load.
});
