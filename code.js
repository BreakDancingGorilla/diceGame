import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";
addEventListener("load", (event) => {
  ///Turn the dice into a big object.

  window.gameObjects = {
    //When targeting the elements make sure to type innerHTML if updating the value.
    init: async function () {
      this.reset();
    
      try {
        await Promise.all([...Object.values(this.diceObjects).map(dice => dice.box.init()),]);
        this.initialized = true; // Set a flag
        console.log("Dice boxes ready");
      } catch (e) {
        console.error("Dice-Box failed to load:", e);
      }
    ;
  
    },

    reset: function () {
      this.slain.reset();
      this.gold.reset();
      this.diceObjects.player.reset();
      this.diceObjects.enemy.reset();
    },
    ///These need to be objects
    ///They all need to follow the same struture so we can use the small property names
    slain: {
      num: 0,
      element: document.getElementById("slainCount"),
      add: function (num) {
        this.num += num;
        this.element.innerHTML = this.num;
      },
      reset: function () {
        this.element.innerHTML = 0;
        this.num = this.num;
      },
    },
    gold: {
      num: 0,
      element: document.getElementById("goldCount"),

      remove: function (num) {
        if (this.num - num < 0) {
          return false;
        }
        this.num -= num;
        this.element = num;
        num = num;
      },
      add: function (num) {
        this.num += num;
        gameObjects.gold.element.innerHTML = this.num;
      },

      reset: function () {
        this.element.innerHTML = 0;
        this.num = this.num;
      },
    },

    diceObjects: {
player: {
      box: new DiceBox({
        assetPath: "assets/",
        origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
        container: "#player-dice-box",
        theme: "default",
        themeColor: "#e26772",
        externalThemes: {
          diceOfRolling:
            "https://www.unpkg.com/@3d-dice/theme-dice-of-rolling@0.2.1",
        },
        offscreen: true,
        scale: 10,
        // physics settings that must be set - defaults are buggy
        throwForce: 5,
        gravity: 1,
        mass: 1,
        spinForce: 6,
      }),
      currentDiceValue: 0,
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
      applyDamage: function () {
        this.healthNum -= gameObjects.enemy.damageNum + dice.enemy.value;
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
      box: new DiceBox({
        assetPath: "assets/",
        origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
        container: "#enemy-dice-box",
        theme: "default",
        themeColor: "#e26772",
        externalThemes: {
          diceOfRolling:
            "https://www.unpkg.com/@3d-dice/theme-dice-of-rolling@0.2.1",
        },
        offscreen: true,
        scale: 10,
        // physics settings that must be set - defaults are buggy
        throwForce: 5,
        gravity: 1,
        mass: 1,
        spinForce: 6,
      }),
      currentDiceValue: 0,
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
      applyDamage: function () {
        this.healthNum -= gameObjects.player.damageNum + dice.player.value;
        console.log(this.healthNum);
        this.updateHealth(this.healthNum);
      },
      slay: function () {
        gameObjects.gold.add(this.goldWorth);
        gameObjects.slain.add(1);
        this.updateHealth(Math.round(this.baseHealth * this.strength));
        this.updateDamage(Math.round(this.baseDamage * this.strength));
        this.strength += this.strengthGrowthRate;
        this.giveDice();
      },
      reset: function () {
        this.updateDamage(this.baseDamage);
        this.updateHealth(this.baseHealth);
        this.strength = this.strengthGrowthRate + 1;
        this.goldWorth = this.baseGoldWorth;
        this.dice = this.baseDice;
      },
      giveDice: function () {
        for (let i = 0; i < this.dice.length; i++) {
          gameObjects.player.dice[i] += this.dice[i];
        }
      },
      dieValue: 0,
    },
    },

    
    roll: async function (gameObject) {
      var diceCountArray = gameObject.dice;

      var diceToRoll = [];
      var dieAmt = 0;

      // Build the dice array
      for (let i = 0; i < diceCountArray.length; i++) {
        dieAmt = diceCountArray[i];
        if (dieAmt > 0) {
          switch (i) {
            case 0:
              diceToRoll.push(dieAmt + "d4");
              break;
            case 1:
              diceToRoll.push(dieAmt + "d6");
              break;
            case 2:
              diceToRoll.push(dieAmt + "d8");
              break;
            case 3:
              diceToRoll.push(dieAmt + "d10");
              break;
            case 4:
              diceToRoll.push(dieAmt + "d12");
              break;
            case 5:
              diceToRoll.push(dieAmt + "d20");
              break;
          }
        }
      }

      gameObject.currentDiceValue = 0;

      // 1. Setup the Promise FIRST
      var rollPromise = new Promise((resolve) => {
        gameObject.box.onRollComplete = (rollResult) => {
          // rollResult is an array of die objects [{value: 4}, {value: 2}]
          let total = 0;
          for (let i = 0; i < rollResult.length; i++) {
            total += rollResult[i].value;
          }
          gameObject.currentDiceValue = total;
          resolve(); // This signal lets 'await rollPromise' proceed
        };
      });

      // 2. Trigger the roll
      gameObject.box.roll(diceToRoll);

      // 3. Pause this method here
      await rollPromise;

     // console.log("Roll is finished! Total value:", gameObjects.diceObjects.gameObject.currentDiceValue);
    },
  };
 gameObjects.init();
 
 

  var dice = {
    test: {},

    player: {
      Box: new DiceBox({
        assetPath: "assets/",
        origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
        container: "#player-dice-box",
        theme: "default",
        themeColor: "#e26772",
        externalThemes: {
          diceOfRolling:
            "https://www.unpkg.com/@3d-dice/theme-dice-of-rolling@0.2.1",
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
          diceOfRolling:
            "https://www.unpkg.com/@3d-dice/theme-dice-of-rolling@0.2.1",
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
   
    init: async function () {
      try {
        await Promise.all([this.player.Box.init(), this.enemy.Box.init()]);
        this.initialized = true; // Set a flag
        console.log("Dice boxes ready");
      } catch (e) {
        console.error("Dice-Box failed to load:", e);
      }
    },
  };

  (async () => {
    try {
      // 1. Wait for all 3 dice boxes to finish loading assets
      await dice.init();

      var actionButtons = {
        attackDown: false,
        healDown: false,
        diceRoll: false,
        attackBtn: document.getElementById("attackButton"),
        healBtn: document.getElementById("healbutton"),
        diceRollBtn: document.getElementById("diceButton"),
      };

      ///Listens for the action button to be pressed
      actionButtons.attackBtn.addEventListener("click", function () {
        enemyBox.roll(["4d20", "4d12", "4d10", "4d8", "4d6", "4d4"]);
        console.log("Button clicked! Attack");
      });

      var rollBlock = false;
      ///Listens for the heal button to be pressed
      actionButtons.healBtn.addEventListener("click", async function () {
        if (!rollBlock) {
          rollBlock = true;

          console.log(gameObjects.diceObjects.player.dice);
          console.log(gameObjects.diceObjects.enemy.healthNum);

          await gameObjects.roll(gameObjects.diceObjects.player);

          console.log(
            "Damage Done: " +
              (gameObjects.player.damageNum + dice.player.value),
          );
          gameObjects.enemy.applyDamage();
          console.log(
            "Damage Done: " + (gameObjects.enemy.damageNum + dice.enemy.value),
          );

          if (gameObjects.enemy.healthNum <= 0) {
            gameObjects.enemy.slay();
            dice.enemy.Box.clear();
            rollBlock = false;
          } else {
            await dice.roll(gameObjects.enemy);
            rollBlock = false;
            gameObjects.player.applyDamage();
          }
          if (gameObjects.player.healthNum <= 0) {
            gameObjects.reset();
            dice.player.Box.clear();
            dice.enemy.Box.clear();
          }
        }

        console.log("hello");
      });

      //listens for the dice roll button to be pressed.
      actionButtons.diceRollBtn.addEventListener("click", function () {
        playerBox.roll(["4d20", "4d12", "4d10", "4d8", "4d6", "4d4"]);
        console.log("Button clicked! Dice Roll");
      });
    } catch (err) {
      console.error("Initialization failed:", err);
    }
  })();
});
