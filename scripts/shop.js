import { game } from "./dice.js";
export const shop = {
  data: {
    eventListeners: {
      init() {
        shop.data.general.closeButton.addEventListener("click", function () {
          shop.methods.showShop(false);
        });

        shop.data.general.openButton.addEventListener("click", function () {

          if (shop.data.general.shopOpen) {
            return;
          }

          //Stop shop from opening if mid turn.
          shop.methods.updateAllui();
          shop.methods.showShop(true);
          ///Shop is now visiable

          ///think im going to make a while loop here.
        });
      },
    },

    general: {
      shopTitle: document.getElementById("shopTitle"),
      brokegif: document.getElementById("brokeGif"),
      shopOpen: false,
      openButton: document.getElementById("shopOpenButton"),
      closeButton: document.getElementById("shopExitButton"),
      diceMenu: document.getElementById("shopBox"),
    },

    buySell: {
      ui: {
        buy: {
          buySelectedButton: document.getElementById("buySelected"),
          selectedTotal: document.getElementById("selectedBuyTotal"),
        },
        sell: {
          sellSelectedButton: document.getElementById("sellDiceBtn"),
          selectedTotal: document.getElementById("selectedDiceSellTotal"),
        },
      },
    },

    items: {
      reRoll: {
        ui: {
          h1: {
            cost: document.getElementById("reRollCost"),
            amtSelected: document.getElementById("reRollSelectedAmt"),
          },
          btn: {
            selectUp: document.getElementById("reRollSelectUp"),
            selectDown: document.getElementById("reRollSelectDown"),
          },
        },
        data: {
          cost: 5,
          amtSelected: 0,
        },
      },
      weightedDice: {
        ui: {
          h1: {
            cost: document.getElementById("weightedDiceCost"),
            amtSelected: document.getElementById("weightedDiceSelectedAmt"),
          },
          btn: {
            selectUp: document.getElementById("weightedDiceSelectUp"),
            selectDown: document.getElementById("weightedDiceSelectDown"),
          },
        },
        data: {
          cost: 5,
          amtSelected: 0,
        },
      },
    },
    stats: {
      health: {
        ui: {
          h1: {
            name: document.getElementById("healthName"),
            cost: document.getElementById("healthCost"),
            amtSelected: document.getElementById("healthSelectedAmt"),
          },
          btn: {
            selectUp: document.getElementById("healthSelectUp"),
            selectDown: document.getElementById("healthSelectDown"),
          },
        },
        data: {
          cost: 5,
          amtSelected: 0,
          healthPoints: 0,
        },
      },
      damage: {
        ui: {
          h1: {
            name: document.getElementById("damageName"),
            cost: document.getElementById("damageCost"),
            amtSelected: document.getElementById("damageSelectedAmt"),
          },
          btn: {
            selectUp: document.getElementById("damageSelectUp"),
            selectDown: document.getElementById("damageSelectDown"),
          },
        },
        data: {
          cost: 5,
          amtSelected: 0,
          damagePoints: 0,
        },
      },
    },
    dice: [
      //Remember this an array, each index has the data for each die.
      {
        ui: {
          h1: {
            dieSelectAmt: document.getElementById("dieSelectedAmt1"),
            dieSellPrice: document.getElementById("dieSellPrice1"),
          },
          btn: {
            dieSelectUp: document.getElementById("shopDieSelectUp1"),
            dieSelectDown: document.getElementById("shopDieSelectDown1"),
          },
        },
        data: {
          sellPrice: 100,
          amtSelected: 0,
        },
      },
      {
        ui: {
          h1: {
            dieSelectAmt: document.getElementById("dieSelectedAmt2"),
            dieSellPrice: document.getElementById("dieSellPrice2"),
          },
          btn: {
            dieSelectUp: document.getElementById("shopDieSelectUp2"),
            dieSelectDown: document.getElementById("shopDieSelectDown2"),
          },
        },
        data: {
          sellPrice: 0,
          amtSelected: 0,
        },
      },
      {
        ui: {
          h1: {
            dieSelectAmt: document.getElementById("dieSelectedAmt3"),
            dieSellPrice: document.getElementById("dieSellPrice3"),
          },
          btn: {
            dieSelectUp: document.getElementById("shopDieSelectUp3"),
            dieSelectDown: document.getElementById("shopDieSelectDown3"),
          },
        },
        data: {
          sellPrice: 0,
          amtSelected: 0,
        },
      },
      {
        ui: {
          h1: {
            dieSelectAmt: document.getElementById("dieSelectedAmt4"),
            dieSellPrice: document.getElementById("dieSellPrice4"),
          },
          btn: {
            dieSelectUp: document.getElementById("shopDieSelectUp4"),
            dieSelectDown: document.getElementById("shopDieSelectDown4"),
          },
        },
        data: {
          sellPrice: 0,
          amtSelected: 0,
        },
      },
      {
        ui: {
          h1: {
            dieSelectAmt: document.getElementById("dieSelectedAmt5"),
            dieSellPrice: document.getElementById("dieSellPrice5"),
          },
          btn: {
            dieSelectUp: document.getElementById("shopDieSelectUp5"),
            dieSelectDown: document.getElementById("shopDieSelectDown5"),
          },
        },
        data: {
          sellPrice: 0,
          amtSelected: 0,
        },
      },
      {
        ui: {
          h1: {
            dieSelectAmt: document.getElementById("dieSelectedAmt6"),
            dieSellPrice: document.getElementById("dieSellPrice6"),
          },
          btn: {
            dieSelectUp: document.getElementById("shopDieSelectUp6"),
            dieSelectDown: document.getElementById("shopDieSelectDown6"),
          },
        },
        data: {
          sellPrice: 0,
          amtSelected: 0,
        },
      },
    ],
  },
  methods: {
    showShop(bool) {
      if (bool) {
        shop.data.general.diceMenu.classList.remove("hide");
        shop.data.general.shopOpen = true;
        return;
      } else {
        shop.data.general.diceMenu.classList.add("hide");
        shop.data.general.shopOpen = false;
        return;
      }
    },
    ////Updates all the ui elements with the data
    ///stats/items
    updateAllUiHelper(root) {
      root.ui.h1.amtSelected.innerHTML = root.data.amtSelected;
      root.ui.h1.cost.innerHTML = root.data.cost;
    },

    updateAllui() {
      ///Items
      this.updateAllUiHelper(shop.data.items.reRoll);
      this.updateAllUiHelper(shop.data.items.weightedDice);
      ///Stats
      this.updateAllUiHelper(shop.data.stats.health);
      this.updateAllUiHelper(shop.data.stats.damage);

      ///Stat names
      shop.data.stats.health.ui.h1.name.innerHTML = `${shop.data.stats.health.data.healthPoints} Health Points`;
      shop.data.stats.damage.ui.h1.name.innerHTML = `${shop.data.stats.damage.data.damagePoints} Damage Points`;

      //dice
      for (let i = 0; i < shop.data.dice.length; i++) {
        let uiRoot = shop.data.dice[i].ui.h1;
        let dataRoot = shop.data.dice[i].data;
        console.log(uiRoot);
        uiRoot.dieSelectAmt.innerHTML = dataRoot.amtSelected;
        console.log(uiRoot.dieSellPrice.innerHTML);
        uiRoot.dieSellPrice.innerHTML = dataRoot.sellPrice;
      }
      //general
      shop.data.general.shopTitle.innerHTML = `Cash: ${game.player.stats.gold.current}`;
    },
  },
};
shop.data.eventListeners.init();
///Intergrate this into the object
