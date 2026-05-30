// Die types in index order — index 0 = d4, 1 = d6 ... 5 = d20
export const DIE_TYPES = ["d4", "d6", "d8", "d10", "d12", "d20"];

// Inclusive random integer in [min, max]
export function ranNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Animate a single stat element: briefly shows the delta, then settles on the new value.
// format(newValue) controls how the settled value is rendered (default: plain number).
export async function animateStat(element, oldVal, newVal, format = String) {
  if (!element) return;
  const gaining = newVal >= oldVal;
  const diff    = Math.abs(newVal - oldVal);

  return new Promise(resolve => {
    element.className = gaining ? "neon-flash-green" : "neon-flash-red";
    element.innerHTML = gaining
      ? `${oldVal} + ${diff}`
      : `${oldVal} - ${diff}`;

    setTimeout(() => {
      element.className = "";
      element.innerHTML = format(newVal);
      resolve();
    }, 1000);
  });
}

export function lockButtons() {
  document.querySelectorAll("button").forEach(btn => (btn.disabled = true));
}

export function unlockButtons() {
  document.querySelectorAll("button").forEach(btn => (btn.disabled = false));
}
