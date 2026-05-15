import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";

/* 
Die index value corresponds to the number of sides on the die 
- 4, 6, 8, 10, 12, 20
*/

//The gameplay starts if either heal or attack roll are pressed then it starts the main loop. 


addEventListener("load", () => {
  window.gameObjects = {
    initialized: false,

    async init() {
      this.reset();

      try {
        await Promise.all([
          this.diceObjects.player.box.init(),
          this.diceObjects.enemy.box.init()
        ]);
        this.initialized = true;
        console.log("Dice boxes ready");
        this.diceObjects.player.updateDiceInv();
      } catch (e) {
        console.error("Dice-Box failed to load:", e);
      }
    },

    reset() {
      this.slain.reset();
      this.gold.reset();
      this.diceObjects.player.reset();
      this.diceObjects.enemy.reset();
    },

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
      }
    },

    gold: {
      num: 0,
      element: document.getElementById("goldCount"),

      add(num) {
        this.num += num;
        this.element.innerHTML = this.num;
      },

      remove(num) {
        if (this.num - num < 0) return false;
        this.num -= num;
        this.element.innerHTML = this.num;
      },

      reset() {
        this.num = 0;
        this.element.innerHTML = 0;
      }
    },

    diceObjects: {
      player: {
        box: new DiceBox({
          assetPath: "assets/",
          origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
          container: "#player-dice-box",
          scale: 10
        }),

        diceInvUi: {
            d4: document.getElementById("4DieQuan"),
            d6: document.getElementById("6DieQuan"),
            d8: document.getElementById("8DieQuan"),
            d10: document.getElementById("10DieQuan"),
            d12: document.getElementById("12DieQuan"),
            d20: document.getElementById("20DieQuan")
        },

        updateDiceInv() {
            const types = ["d4", "d6", "d8", "d10", "d12", "d20"];
            this.dice.forEach((amt, i) => {
                this.diceInvUi[types[i]].innerHTML = amt;
            });
        }, 

        dice: [2, 0, 0, 0, 0],
        baseDice: [2, 0, 0, 0, 0],
        selectedDice: [0, 0, 0, 0, 0],
        currentDiceValue: 0,

        baseHealth: 100,
        baseDamage: 50,

        healthElement: document.getElementById("playerHealth"),
        damageElement: document.getElementById("playerDamage"),

        healthNum: 100,
        damageNum: 50,

        updateHealth(num) {
          this.healthNum = num;
          this.healthElement.innerHTML = num;
        },

        updateDamage(num) {
          this.damageNum = num;
          this.damageElement.innerHTML = num;
        },

        applyDamage(enemyRoll) {
          this.updateHealth(this.healthNum - (gameObjects.diceObjects.enemy.damageNum + enemyRoll));
        },

        reset() {
          this.dice = [...this.baseDice];
          this.updateHealth(this.baseHealth);
          this.updateDamage(this.baseDamage);
        }
      },

      enemy: {
        box: new DiceBox({
          assetPath: "assets/",
          origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
          container: "#enemy-dice-box",
          scale: 10
        }),

        dice: [2, 1, 0, 0, 0],
        baseDice: [2, 1, 0, 0, 0],
        currentDiceValue: 0,

        baseHealth: 100,
        baseDamage: 7,
        strength: 1.5,
        strengthGrowthRate: 0.5,
        goldWorth: 5,

        healthElement: document.getElementById("enemyHealth"),
        damageElement: document.getElementById("enemyDamage"),

        healthNum: 100,
        damageNum: 7,

        updateHealth(num) {
          this.healthNum = num;
          this.healthElement.innerHTML = num;
        },

        updateDamage(num) {
          this.damageNum = num;
          this.damageElement.innerHTML = num;
        },

        applyDamage(playerRoll) {
          this.updateHealth(this.healthNum - (gameObjects.diceObjects.player.damageNum + playerRoll));
        },

        slay() {
          gameObjects.gold.add(this.goldWorth);
          gameObjects.slain.add(1);

          this.strength += this.strengthGrowthRate;

          this.updateHealth(Math.round(this.baseHealth * this.strength));
          this.updateDamage(Math.round(this.baseDamage * this.strength));
        },

        reset() {
          this.strength = 1.5;
          this.dice = [...this.baseDice];
          this.updateHealth(this.baseHealth);
          this.updateDamage(this.baseDamage);
        }
      }
    },
//  const playerRoll = await gameObjects.roll(gameObjects.diceObjects.player);
    async roll(obj) {
      let diceToRoll = [];

      obj.dice.forEach((amt, i) => {
        if (amt > 0) {
          const types = ["d4", "d6", "d8", "d10", "d12", "d20"];
          diceToRoll.push(amt + types[i]);
        }
      });

      return new Promise((resolve) => {
        obj.box.onRollComplete = (results) => {
          obj.currentDiceValue = results.reduce((sum, d) => sum + d.value, 0);
          resolve(obj.currentDiceValue);
        };

        obj.box.roll(diceToRoll);
      });
    }
  };

  gameObjects.init();

  const attackBtn = document.getElementById("attackButton");
  const healBtn = document.getElementById("attackButton");
  var dieSelects = {
    btn: {
    d4: document.getElementById("dieSelect4"),
    d6: document.getElementById("dieSelect6"),
    d8: document.getElementById("dieSelect8"),
    d10: document.getElementById("dieSelect10"),
    d12: document.getElementById("dieSelect12"),
    d20: document.getElementById("dieSelect20")
    },
    quanUI: {
    d4: document.getElementById("selectedDieQuan4"),
    d6: document.getElementById("selectedDieQuan6"),
    d8: document.getElementById("selectedDieQuan8"),
    d10: document.getElementById("selectedDieQuan10"),
    d12: document.getElementById("selectedDieQuan12"),
    d20: document.getElementById("selectedDieQuan20")
    },
    
  }

  var rolling = false;



  healBtn.addEventListener("click", async () => {
    if (rolling) return;
    rolling = true;
    console.log("hello");
    const playerRoll = await gameObjects.roll(gameObjects.diceObjects.player);
    gameObjects.diceObjects.enemy.applyDamage(playerRoll);

    if (gameObjects.diceObjects.enemy.healthNum <= 0) {
      gameObjects.diceObjects.enemy.slay();
      rolling = false;
      return;
    }

    const enemyRoll = await gameObjects.roll(gameObjects.diceObjects.enemy);
    gameObjects.diceObjects.player.applyDamage(enemyRoll);

    if (gameObjects.diceObjects.player.healthNum <= 0) {
      gameObjects.reset();
    }

    rolling = false;
  });

  attackBtn.addEventListener("click", async () => {
    if (rolling) return;
    rolling = true;

    const playerRoll = await gameObjects.roll(gameObjects.diceObjects.player);
    gameObjects.diceObjects.enemy.applyDamage(playerRoll);

    if (gameObjects.diceObjects.enemy.healthNum <= 0) {
      gameObjects.diceObjects.enemy.slay();
      rolling = false;
      return;
    }

    const enemyRoll = await gameObjects.roll(gameObjects.diceObjects.enemy);
    gameObjects.diceObjects.player.applyDamage(enemyRoll);

    if (gameObjects.diceObjects.player.healthNum <= 0) {
      gameObjects.reset();
    }

    rolling = false;
  });
});