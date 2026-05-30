import { game }            from "./scripts/dice.js";
import { shop }            from "./scripts/shop.js";
import { lockButtons, unlockButtons } from "./scripts/helpers.js";

addEventListener("load", () => {
  game.init();

  const attackBtn = document.getElementById("attackButton");

  attackBtn.addEventListener("click", async () => {
    if (shop.data.general.shopOpen) return;

    lockButtons();
    try {
      const { player, enemy } = game;

      // ── Player's turn ──────────────────────────────────────────────
      await player.roll(); // sets player.stats.damage.toApply internally

      if (player.stats.mode.attack) {
        await enemy.stats.health.sub(player.stats.damage.toApply);
      } else {
        await player.stats.health.add(player.stats.damage.toApply);
      }

      // Did the player just kill the enemy?
      if (enemy.stats.health.current <= 0) {
        await enemy.slay();
        return; // buttons re-enabled by finally
      }

      // ── Enemy's turn ───────────────────────────────────────────────
      await enemy.roll(); // sets enemy.stats.damage.toApply internally
      await player.stats.health.sub(enemy.stats.damage.toApply);

      // Did the enemy just kill the player?
      if (player.stats.health.current <= 0) {
        const deathScreen = document.getElementById("deathScreen");
        deathScreen.classList.remove("hide");
        setTimeout(() => deathScreen.classList.add("hide"), 3000);

        game.fullReset();
      }

    } finally {
      unlockButtons();
    }
  });
});
