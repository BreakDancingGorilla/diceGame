export function ranNum(min, max) {
  let seed = Math.random();
  seed = Math.floor(seed * (max - (min - 1))) + min;
  return seed;
}

export function addSubToStats(arrayOfObjects) {
  for (let i = 0; i < arrayOfObjects.length; i++) {
    ////Pull Data
    let element = arrayOfObjects[i].element;
    let oldNum = Number(element.innerHTML.split(" ")[0]) || 0; ///Used from ai for edge case if player clicks during timeout
    let amt = arrayOfObjects[i].amt;
    let add = arrayOfObjects[i].add;

    if (add) {
      let newValue = oldNum + amt;
      element.classList.add("neon-flash-green");
      element.innerHTML = `+ ${amt}`;
      setTimeout(() => {
        element.classList.remove("neon-flash-green");
        element.innerHTML = `${newValue}`;
      }, 1900);
    } else {
      let newValue = oldNum - amt;
      element.classList.add("neon-flash-red");
      element.innerHTML = `- ${amt}`;
      setTimeout(() => {
        element.classList.remove("neon-flash-red");
        element.innerHTML = `${newValue}`;
      }, 1900);
    }
  }
}

export function buttonTimeout(bool) {
const allButtons = document.querySelectorAll("button");

// 2. Loop through them and attach the click listener
allButtons.forEach((button) => {
  button.addEventListener("click", () => {
    
    // 3. Instantly disable ALL buttons on the page
    if (bool) {
       allButtons.forEach(btn => btn.disabled = true);
    }else {
            allButtons.forEach(btn => btn.disabled = false);
    }
   

    // 4. Set a timeout to unlock them after     1 second (1000 milliseconds)

  


  });
});
}