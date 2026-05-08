const covers = Array.from(document.querySelectorAll('.draggable-cover'));
const leafStack = document.getElementById('leafStack');
const goalZone = document.getElementById('goalZone');

const state = covers.map(() => ({ cleared: false }));

const dragInfo = {
  index: null,
  pointerId: null,
  startX: 0,
  startY: 0,
  x: 0,
  y: 0,
};

const basePlacement = [
  { x: 0.07, y: -0.03, r: -15, s: 0.52 },
  { x: 0.2, y: -0.06, r: 11, s: 0.5 },
  { x: 0.33, y: -0.02, r: -8, s: 0.49 },
  { x: 0.44, y: 0.01, r: 13, s: 0.48 },
  { x: 0.11, y: 0.2, r: -12, s: 0.51 },
  { x: 0.23, y: 0.23, r: 9, s: 0.49 },
  { x: 0.35, y: 0.22, r: -10, s: 0.5 },
  { x: 0.47, y: 0.2, r: 12, s: 0.48 },
];

const mobilePlacement = [
  { x: 0.14, y: 0.08, r: -13, s: 0.44 },
  { x: 0.26, y: 0.05, r: 10, s: 0.43 },
  { x: 0.38, y: 0.08, r: -7, s: 0.42 },
  { x: 0.5, y: 0.11, r: 12, s: 0.41 },
  { x: 0.16, y: 0.28, r: -11, s: 0.43 },
  { x: 0.28, y: 0.31, r: 8, s: 0.42 },
  { x: 0.4, y: 0.3, r: -9, s: 0.43 },
  { x: 0.52, y: 0.28, r: 11, s: 0.41 },
];

function placeCovers() {
  const stackWidth = leafStack.clientWidth;
  const stackHeight = leafStack.clientHeight;
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const placement = isMobile ? mobilePlacement : basePlacement;
  const minSize = isMobile ? 140 : 300;
  const maxSize = isMobile ? 260 : 620;

  covers.forEach((cover, i) => {
    const pos = placement[i] || { x: 0.24 + i * 0.03, y: isMobile ? 0.24 : 0.18, r: 0, s: isMobile ? 0.42 : 0.48 };
    const z = covers.length - i;
    const size = Math.max(minSize, Math.min(maxSize, stackWidth * pos.s));
    cover.style.width = `${size}px`;
    cover.style.left = `${Math.round(stackWidth * pos.x)}px`;
    cover.style.top = `${Math.round(stackHeight * pos.y)}px`;
    cover.style.zIndex = String(z + 10);
    cover.dataset.baseRotate = String(pos.r);
    cover.style.transform = `translate(0px, 0px) rotate(${pos.r}deg)`;
  });
}

function clearedCount() {
  return state.filter((item) => item.cleared).length;
}

let heartRainInterval = null;

function spawnHeart() {
  const rain = document.getElementById('heartRain');
  if (!rain) return;
  const heart = document.createElement('div');
  heart.classList.add('rain-drop');
  heart.style.left = Math.random() * 100 + 'vw';
  heart.style.animationDuration = (Math.random() * 2 + 3) + 's';
  heart.innerText = '💗';
  rain.appendChild(heart);
  setTimeout(() => heart.remove(), 5000);
}

function startHeartRain() {
  if (heartRainInterval) return;
  heartRainInterval = setInterval(spawnHeart, 300);
}

function stopHeartRain() {
  clearInterval(heartRainInterval);
  heartRainInterval = null;
  const rain = document.getElementById('heartRain');
  if (rain) rain.innerHTML = '';
}

function updateHud() {
  const done = clearedCount();

  if (done === covers.length) {
    goalZone.classList.add('revealed');
    startHeartRain();
    return;
  }

  goalZone.classList.remove('revealed');
  stopHeartRain();
}

function removeCover(index, directionX, directionY) {
  const cover = covers[index];
  const baseRotate = Number(cover.dataset.baseRotate || 0);

  state[index].cleared = true;
  cover.classList.add('cleared');
  cover.style.transition = 'transform 280ms ease, opacity 280ms ease';
  cover.style.transform = `translate(${directionX * 230}px, ${directionY * 80}px) rotate(${baseRotate + directionX * 11}deg)`;
  updateHud();
}

function resetDragInfo() {
  dragInfo.index = null;
  dragInfo.pointerId = null;
  dragInfo.startX = 0;
  dragInfo.startY = 0;
  dragInfo.x = 0;
  dragInfo.y = 0;
}

function onPointerDown(event) {
  const cover = event.currentTarget;
  const index = Number(cover.dataset.index);

  if (Number.isNaN(index) || state[index].cleared) {
    return;
  }

  dragInfo.index = index;
  dragInfo.pointerId = event.pointerId;
  dragInfo.startX = event.clientX;
  dragInfo.startY = event.clientY;
  dragInfo.x = 0;
  dragInfo.y = 0;

  cover.classList.add('dragging');
  cover.style.zIndex = String(covers.length + 30);
  cover.style.transition = 'none';
  cover.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (dragInfo.pointerId !== event.pointerId || dragInfo.index === null) {
    return;
  }

  const cover = covers[dragInfo.index];
  const baseRotate = Number(cover.dataset.baseRotate || 0);
  const deltaX = event.clientX - dragInfo.startX;
  const deltaY = event.clientY - dragInfo.startY;
  const clampedX = Math.max(-150, Math.min(150, deltaX));
  const clampedY = Math.max(-90, Math.min(90, deltaY));

  dragInfo.x = clampedX;
  dragInfo.y = clampedY;
  cover.style.transform = `translate(${clampedX}px, ${clampedY}px) rotate(${baseRotate + clampedX * 0.06}deg)`;
}

function onPointerUp(event) {
  if (dragInfo.pointerId !== event.pointerId || dragInfo.index === null) {
    return;
  }

  const index = dragInfo.index;
  const cover = covers[index];
  const baseRotate = Number(cover.dataset.baseRotate || 0);
  const threshold = 115;

  cover.classList.remove('dragging');
  cover.releasePointerCapture(event.pointerId);

  if (Math.abs(dragInfo.x) >= threshold) {
    const directionX = Math.sign(dragInfo.x) || 1;
    const directionY = Math.sign(dragInfo.y) || 1;
    removeCover(index, directionX, directionY);
  } else {
    cover.style.transition = 'transform 160ms ease';
    cover.style.transform = `translate(0px, 0px) rotate(${baseRotate}deg)`;
  }

  resetDragInfo();
}

function resetScene() {
  state.forEach((item) => {
    item.cleared = false;
  });

  covers.forEach((cover, i) => {
    cover.classList.remove('cleared', 'dragging');
    cover.style.opacity = '1';
    cover.style.transition = 'transform 220ms ease, opacity 220ms ease';
    const z = covers.length - i;
    const baseRotate = Number(cover.dataset.baseRotate || 0);
    cover.style.zIndex = String(z + 10);
    cover.style.transform = `translate(0px, 0px) rotate(${baseRotate}deg)`;
  });

  updateHud();
}

function setupEvents() {
  covers.forEach((cover) => {
    cover.addEventListener('pointerdown', onPointerDown);
    cover.addEventListener('pointermove', onPointerMove);
    cover.addEventListener('pointerup', onPointerUp);
    cover.addEventListener('pointercancel', onPointerUp);
    cover.addEventListener('lostpointercapture', onPointerUp);
  });
}

placeCovers();
setupEvents();
updateHud();
window.addEventListener('resize', placeCovers);
