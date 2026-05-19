
export function ranNum(min, max) {
  let seed = Math.random();
  seed = Math.floor(seed * (max - (min - 1))) + min;
  return seed;
}

/*
  [
  element: 
  amt: 
  add: bool
  ]
*/
// Add the 'async' keyword to your function
export async function addSubToStats(arrayOfObjects) {
  console.log("--- STATS UPDATE START ---");

  // Create an array to track all the animation promises
  const animationPromises = [];

  for (let i = 0; i < arrayOfObjects.length; i++) {
    let element = arrayOfObjects[i].element;
    let amt = arrayOfObjects[i].amt;
    let add = arrayOfObjects[i].add === true || arrayOfObjects[i].add === "true";

    if (!element) continue;

    let cleanText = element.innerHTML.replace(/[^0-9-]/g, '');
    let oldNum = parseInt(cleanText) || 0;
    let newValue = add ? (oldNum + amt) : (oldNum - amt);

    // Create a promise for this specific element's timeout
    const elementPromise = new Promise((resolve) => {
      if (add) {
        element.className = "neon-flash-green";
        element.innerHTML = `+ ${amt}`;
        setTimeout(() => {
          element.className = "";
          element.innerHTML = newValue;
          resolve(); // 1. Tells the promise this specific animation is done
        }, 1900);
      } else {
        element.className = "neon-flash-red";
        element.innerHTML = `- ${amt}`;
        setTimeout(() => {
          element.className = "";
          element.innerHTML = newValue;
          resolve(); // 1. Tells the promise this specific animation is done
        }, 1900);
      }
    });

    animationPromises.push(elementPromise);
  }

  // 2. This forces the function to wait until EVERY setTimeout in the loop has fully finished
  await Promise.all(animationPromises);
  console.log("--- STATS UPDATE END (ANIMATIONS FINISHED) ---");
}




export function buttonTimeout(bool) {
  const allButtons = document.querySelectorAll("button");
  
  // Directly change the disabled state of all buttons immediately
  allButtons.forEach((btn) => {
    if (bool) {
      btn.disabled = true;
    } else {
      btn.disabled = false;
    }
  });
}
