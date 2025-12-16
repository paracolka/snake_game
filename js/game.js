let pos = 1;
let dice = 0;

const board = document.getElementById("gameBoard");
const diceEl = document.getElementById("dice");
const rollBtn = document.getElementById("rollBtn");
const moveBtn = document.getElementById("moveBtn");
const resetBtn = document.getElementById("resetBtn");
const posEl = document.getElementById("positionValue");

function init() {
  board.innerHTML = "";
  for (let i = 1; i <= 100; i++) {
    const c = document.createElement("div");
    c.className = "cell";
    c.dataset.n = i;
    c.textContent = i;
    board.appendChild(c);
  }
  update();
}

function update() {
  document.querySelectorAll(".player").forEach(e=>e.remove());
  const cell = document.querySelector(`[data-n='${pos}']`);
  const p = document.createElement("div");
  p.className = "player";
  cell.appendChild(p);
  posEl.textContent = pos;
}

rollBtn.onclick = () => {
  dice = Math.floor(Math.random()*6)+1;
  diceEl.textContent = dice;
  moveBtn.disabled = false;
};

moveBtn.onclick = () => {
  pos = Math.min(100, pos + dice);
  dice = 0;
  diceEl.textContent = "?";
  moveBtn.disabled = true;
  update();
};

resetBtn.onclick = () => {
  pos = 1;
  update();
};

window.onload = init;
