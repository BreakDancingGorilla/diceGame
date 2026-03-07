import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";
addEventListener("load", (event) => {


    ///Turn the dice into a big object. 

    var dice = {


        player: {

            Box: new DiceBox({
                assetPath: "assets/",
                origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
                container: "#player-dice-box",
                theme: "default",
                themeColor: "#e26772",
                externalThemes: {
                    diceOfRolling: "https://www.unpkg.com/@3d-dice/theme-dice-of-rolling@0.2.1",
                },
                offscreen: true,
                scale: 10,
                // physics settings that must be set - defaults are buggy
                throwForce: 5,
                gravity: 1,
                mass: 1,
                spinForce: 6,
            }),

            value: 0,
            dice: [2, 0, 0, 0, 4],

        },


        enemy: {
            Box: new DiceBox({
                assetPath: "assets/",
                origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
                container: "#enemy-dice-box",
                theme: "default",
                themeColor: "#e26772",
                externalThemes: {
                    diceOfRolling: "https://www.unpkg.com/@3d-dice/theme-dice-of-rolling@0.2.1",
                },
                offscreen: true,
                scale: 10,
                // physics settings that must be set - defaults are buggy
                throwForce: 5,
                gravity: 1,
                mass: 1,
                spinForce: 6,
            }),

            value: 0,
            dice: [2, 1, 0, 0, 0],

        },




        roll: async function (playerOrEnemy) {
        var diceCountArray;
            switch (playerOrEnemy) {
                case dice.player:
                    diceCountArray = stats.player.dice;
                    break;
                case dice.enemy: 
                    diceCountArray = stats.enemy.dice;
                    break;
            
                default:
                    console.log("Incorrect object passed.");
                    return;
            }

    var diceToRoll = [];
    var dieAmt = 0;

    // Build the dice array
    for (let i = 0; i < diceCountArray.length; i++) {
        dieAmt = diceCountArray[i];
        if (dieAmt > 0) {
            switch (i) {
                case 0: diceToRoll.push(dieAmt + "d4"); break;
                case 1: diceToRoll.push(dieAmt + "d6"); break;
                case 2: diceToRoll.push(dieAmt + "d8"); break;
                case 3: diceToRoll.push(dieAmt + "d10"); break;
                case 4: diceToRoll.push(dieAmt + "d12"); break;
                case 5: diceToRoll.push(dieAmt + "d20"); break;
            }
        }
    }

    playerOrEnemy.value = 0;
    this.rolling = true;

    // 1. Setup the Promise FIRST
    var rollPromise = new Promise((resolve) => {
        playerOrEnemy.Box.onRollComplete = (rollResult) => {
            // rollResult is an array of die objects [{value: 4}, {value: 2}]
            let total = 0;
            for (let i = 0; i < rollResult.length; i++) {
                total += rollResult[i].value;
            }
            playerOrEnemy.value = total;
            this.rolling = false;
            resolve(); // This signal lets 'await rollPromise' proceed
        };
    });

    // 2. Trigger the roll
    playerOrEnemy.Box.roll(diceToRoll);

    // 3. Pause this method here
    await rollPromise;

    console.log("Roll is finished! Total value:", playerOrEnemy.value);
},







        init: function () {
            this.player.Box.init();
            this.enemy.Box.init();
        },




    }
    dice.init();




    var actionButtons = {
        attackDown: false,
        healDown: false,
        diceRoll: false,
        attackBtn: document.getElementById('attackButton'),
        healBtn: document.getElementById('healbutton'),
        diceRollBtn: document.getElementById('diceButton'),
    }



    var stats = {
        //When targeting the elements make sure to type innerHTML if updating the value.
        init: function(){
            this.reset();
        },

        reset: function(){
            
            this.slain.reset();
            this.gold.reset();
            this.player.reset();
            this.enemy.reset();
        },
        ///These need to be objects
        ///They all need to follow the same struture so we can use the small property names
        slain: {
            num: 0,
            element: document.getElementById("slainCount"),
            add: function(num){
                
                    this.num += num;
                    this.element.innerHTML = this.num;
            },
            reset: function(){
                this.element.innerHTML = 0;
                    this.num = this.num;
            },
        },
        gold: {
            num: 0,
            element: document.getElementById("goldCount"),
            
                remove: function(num){
                    if (this.num - num < 0) {
                        return false;
                    }
                    this.num -= num;
                    this.element = num;
                    num = num;
                },
                add: function(num){
                    
                    this.num += num;
                    stats.gold.element.innerHTML = this.num;
                },
                
          
            reset: function() {
                    
                    this.element.innerHTML = 0;
                    this.num = this.num;
                }
        },
        player: {
            dice: [2, 0, 0, 0, 0],
            baseDice: [2, 0, 0, 0, 0],
            baseHealth: 100,
            baseDamage: 50,
            healthNum: Number(document.getElementById("playerHealth").innerHTML),
            healthElement: document.getElementById("playerHealth"),
            damageNum: Number(document.getElementById("playerDamage").innerHTML),
            damageElement: document.getElementById("playerDamage"),
            updateHealth: function (num) {
                this.healthElement.innerHTML = num;
                this.healthNum = num;
            },
            updateDamage: function (num) {
                this.damageElement.innerHTML = num;
                this.damageNum = num;
            },
            applyDamage: function(){
                this.healthNum -= stats.enemy.damageNum + dice.enemy.value;
                console.log(this.healthNum);
                this.updateHealth(this.healthNum);
            },
            reset: function () {
              this.dice = this.baseDice;
              this.updateHealth(this.baseHealth);
              this.updateDamage(this.baseDamage);
            },
            dieIndex: 0,
            dieValue: 0,
        },
        enemy: {
            dice: [2, 1, 0, 0, 0],
            baseDice: [2, 1, 0, 0, 0],
            strengthGrowthRate: 0.5,
            baseGoldWorth: 5,
            baseHealth: 100,
            baseDamage: 7,
            strength: 1.5,
            healthNum: Number(document.getElementById("enemyHealth").innerHTML),
            healthElement: document.getElementById("enemyHealth"),
            damageNum: Number(document.getElementById("enemyDamage").innerHTML),
            damageElement: document.getElementById("enemyDamage"),
            dieIndex: 0,
            goldWorth: 5,
            updateHealth: function (num) {
                this.healthElement.innerHTML = num;
                this.healthNum = num;
            },
            updateDamage: function (num) {
                this.damageElement.innerHTML = num;
                this.damageNum = num;
            },
            applyDamage: function(){
                this.healthNum -= stats.player.damageNum + dice.player.value;
                console.log(this.healthNum);
                this.updateHealth(this.healthNum);
            },
            slay: function(){
                stats.gold.add(this.goldWorth);
                stats.slain.add(1);
                this.updateHealth(Math.round(this.baseHealth * this.strength));
                this.updateDamage(Math.round(this.baseDamage * this.strength));
                this.strength += this.strengthGrowthRate;
                this.giveDice();
            },
            reset: function(){
                this.updateDamage(this.baseDamage);
                this.updateHealth(this.baseHealth);
                this.strength = this.strengthGrowthRate + 1;
                this.goldWorth = this.baseGoldWorth;
                this.dice = this.baseDice;
            },
            giveDice: function(){
                for (let i = 0; i < this.dice.length; i++) {
                    stats.player.dice[i] += this.dice[i];
                }
            },
            dieValue: 0,
        },

    

    }

    stats.init();




    ///Listens for the action button to be pressed
    actionButtons.attackBtn.addEventListener('click', function () {
        enemyBox.roll(["4d20", "4d12", "4d10", "4d8", "4d6", "4d4"]);
        console.log("Button clicked! Attack");

    });



        var rollBlock = false;
    ///Listens for the heal button to be pressed
    actionButtons.healBtn.addEventListener('click', async function () {

        if (!rollBlock) {
            rollBlock = true;
        
        console.log(stats.player.healthNum);
        console.log(stats.enemy.healthNum);
       
        await dice.roll(dice.player);

        console.log("Damage Done: " + (stats.player.damageNum + dice.player.value));
        stats.enemy.applyDamage();
         console.log("Damage Done: " + (stats.enemy.damageNum + dice.enemy.value));
        
        if (stats.enemy.healthNum <= 0) {
            stats.enemy.slay();
            dice.enemy.Box.clear();
            rollBlock = false;
      
        }
        else {
      
                    await dice.roll(dice.enemy);
                          rollBlock = false;
        stats.player.applyDamage()
        }
          if (stats.player.healthNum <= 0) {
            stats.reset();
            dice.player.Box.clear();
            dice.enemy.Box.clear();
        }
        
    };


       
        console.log('hello');

    });

    //listens for the dice roll button to be pressed.
    actionButtons.diceRollBtn.addEventListener('click', function () {
        playerBox.roll(["4d20", "4d12", "4d10", "4d8", "4d6", "4d4"]);
        console.log("Button clicked! Dice Roll");
    });

});
