import DiceBox from "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/dice-box.es.min.js";

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

        dice: [2, 0, 0, 0, 0],
        baseDice: [2, 0, 0, 0, 0],
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

  var rolling = false;

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