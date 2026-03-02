import DiceBox from "https://unpkg.comdice-box.js";
addEventListener("load", (event) => {

// 1. Initialize the box - FIXED PATHS
const Box = new DiceBox("#dicebox", {
  assetPath: "https://unpkg.com",
  origin: "https://unpkg.com"
});


// 2. The code to make them roll
async function rollDice() {
  await Box.init(); // Wait for 3D models to load
  const results = await Box.roll("1d6"); // Roll 1 six-sided die
  console.log("You rolled a:", results.value); // FIXED result reference
}

// 3. Trigger it (example: when your button is clicked)
document.getElementById('diceButton').addEventListener('click', rollDice);

    
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
var dice = {
standardDice: [4, 6, 8, 10, 12, 20],

}


//function getDiceCombo(min, max) {
//     const gap = max - min;
    
//     // Standard Industry Dice
//     const 
    
//     // 1. Find the best die type to cover the gap
//     let dieType = standardDice.find(d => d <= gap) || 4;
    
//     // 2. How many dice do we need? 
//     // We divide by (dieType - 1) because the range of a die roll is (Max - 1)
//     let numDice = Math.floor(gap / (dieType - 1));
    
//     // 3. What is the static modifier?
//     // Since the lowest roll is (numDice * 1), we subtract that from our target Min
//     let modifier = min - numDice;
    
//     return {
//         numDice: numDice,
//         dieType: dieType,
//         modifier: modifier
//     };
// }
//let finalDamage = Math.min(rolledTotal + modifier, max);

//console.log(getDiceCombo(10,23));


// Example: 10 to 30
// Result: { numDice: 2, dieType: 10, modifier: 8 } -> 8 + 2d1




var stats = {
    slainCount: 0,
    playerHealth: 0,
    enemyHealth: 0,
    playerBaseDamage: 0,
    playerdie: 4,
    enemyDamage: 0,
    
    upgradeDie: function(){

    },

    applyDamage: function(damageTo, damageFrom){
        this.damageTo -= this.damageFrom;
    },
}





///Listens for the action button to be pressed
actionButtons.attackBtn.addEventListener('click', function() {

    console.log("Button clicked! Attack");

});

///Listens for the heal button to be pressed
actionButtons.healBtn.addEventListener('click', function() {
    console.log("Button clicked! Heal");

});

//listens for the dice roll button to be pressed.
actionButtons.diceRollBtn.addEventListener('click', function() {
    console.log("Button clicked! Dice Roll");
});







////add a event listener for when dice button is press and the other two.
//// If dice is pressed make sure one of the other buttons has been pressed. 







//For on load.
});
