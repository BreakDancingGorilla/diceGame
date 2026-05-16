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
          this.diceObjects.enemy.box.init(),
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
      },
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
      },
    },

    diceObjects: {
      player: {
        box: new DiceBox({
          assetPath: "assets/",
          origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
          container: "#player-dice-box",
          scale: 10,
        }),

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
          btn: {
            up: {
              d4: document.getElementById("4SelectUp"),
              d6: document.getElementById("6SelectUp"),
              d8: document.getElementById("8SelectUp"),
              d10: document.getElementById("10SelectUp"),
              d12: document.getElementById("12SelectUp"),
              d20: document.getElementById("20SelectUp"),
            },
            down: {
              d4: document.getElementById("4SelectDown"),
              d6: document.getElementById("6SelectDown"),
              d8: document.getElementById("8SelectDown"),
              d10: document.getElementById("10SelectDown"),
              d12: document.getElementById("12SelectDown"),
              d20: document.getElementById("20SelectDown"),
            },
          },
        },

        updateDiceInv() {
          const types = ["d4", "d6", "d8", "d10", "d12", "d20"];
          for (let i = 0; i < this.dice.length; i++) {
            this.diceInvUi.quan.select[types[i]].innerHTML =
              this.selectedDice[i];
            this.diceInvUi.quan.total[types[i]].innerHTML = this.dice[i];
          }
        },

        // FIXED: Expanded from 5 entries to 6 entries to cover d20
        dice: [2, 3, 1, 5, 3, 0],
        baseDice: [2, 3, 5, 3, 0, 0],
        selectedDice: [0, 0, 0, 0, 0, 0],
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
          this.updateHealth(
            this.healthNum -
              (gameObjects.diceObjects.enemy.damageNum + enemyRoll),
          );
        },

        reset() {
          this.dice = [...this.baseDice];
          this.updateHealth(this.baseHealth);
          this.updateDamage(this.baseDamage);
          this.selectedDice = [0, 0, 0, 0, 0, 0];
        },
      },

      enemy: {
        box: new DiceBox({
          assetPath: "assets/",
          origin: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/",
          container: "#enemy-dice-box",
          scale: 10,
        }),

        // FIXED: Expanded from 5 entries to 6 entries to cover d20
        dice: [2, 1, 0, 0, 0, 0],
        selectedDice: [2, 1, 0, 0, 0, 0], // To update for the new rolling system where you can select dice.
        baseDice: [2, 1, 0, 0, 0, 0],
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
          this.updateHealth(
            this.healthNum -
              (gameObjects.diceObjects.player.damageNum + playerRoll),
          );
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
        },
      },
    },

async roll(obj) {
  let diceToRoll = [];
  console.log("Rolling with selected dice:", obj.selectedDice);
  
  const types = ["d4", "d6", "d8", "d10", "d12", "d20"];
  obj.selectedDice.forEach((amt, i) => {
    if (amt > 0) {
      diceToRoll.push(amt + types[i]);
      obj.dice[i] -= amt;
    }
  });

  console.log("Dice to roll:", diceToRoll);

  if (diceToRoll.length === 0) {
    obj.currentDiceValue = 0;
    obj.selectedDice = [0, 0, 0, 0, 0, 0]; // Reset on empty attempt
    return 0;
  }

  return new Promise((resolve) => {
    obj.box.onRollComplete = (results) => {
      obj.currentDiceValue = results.reduce((sum, d) => sum + d.value, 0);
      
      // RESET SELECTION HERE AFTER SUCCESSFUL ROLL
      obj.selectedDice = [0, 0, 0, 0, 0, 0]; 
      
      setTimeout(() => {
        obj.box.clear();
      }, 1500);

      obj.box.onRollComplete = null;
      resolve(obj.currentDiceValue);
    };

    obj.box.roll(diceToRoll);
    gameObjects.diceObjects.player.updateDiceInv();
  });
}

  };


  gameObjects.init();

  const attackBtn = document.getElementById("attackButton");
  const healBtn = document.getElementById("healbutton");

  var rolling = false;

  // Attach the listener to the parent container that ALWAYS exists
  const diceHolder = document.getElementById("playerDiceHolder");

  if (diceHolder) {
    diceHolder.addEventListener("click", (event) => {
      // Find the closest button element, handling the nested <img> tag perfectly
      const button = event.target.closest(".select-button");

      // If the click wasn't on or inside a select-button, ignore it
      if (!button) return;

      console.log("button clicked", button.id);
      const clickedId = button.id;

      var dieIndex;
      var increment = clickedId.includes("Up") ? 1 : -1;

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

      if (increment === 1) {
        if (player.selectedDice[dieIndex] < player.dice[dieIndex]) {
          player.selectedDice[dieIndex] += 1;
        }
      } else {
        if (player.selectedDice[dieIndex] > 0) {
          player.selectedDice[dieIndex] -= 1;
        }
      }
      console.log("Selected dice:", player.selectedDice);
      gameObjects.diceObjects.player.updateDiceInv();
    });
  } else {
    console.error("Could not find #playerDiceHolder in the DOM!");
  }

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
