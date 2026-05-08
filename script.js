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
  { dx: -88, dy: -126, r: -13, s: 0.58 },
  { dx: -22, dy: -134, r: 10, s: 0.57 },
  { dx: 46, dy: -120, r: -7, s: 0.56 },
  { dx: 98, dy: -98, r: 12, s: 0.55 },
  { dx: -90, dy: -42, r: -11, s: 0.57 },
  { dx: -24, dy: -30, r: 8, s: 0.56 },
  { dx: 46, dy: -36, r: -9, s: 0.57 },
  { dx: 102, dy: -50, r: 11, s: 0.55 },
];

function placeCovers() {
  const stackWidth = leafStack.clientWidth;
  const stackHeight = leafStack.clientHeight;
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const placement = isMobile ? mobilePlacement : basePlacement;
  const minSize = isMobile ? 190 : 300;
  const maxSize = isMobile ? 340 : 620;
  const centerX = stackWidth * 0.5;
  const centerY = stackHeight * 0.5;

  covers.forEach((cover, i) => {
    const pos = placement[i] || (isMobile
      ? { dx: i * 16 - 56, dy: -80 + i * 6, r: 0, s: 0.56 }
      : { x: 0.24 + i * 0.03, y: 0.18, r: 0, s: 0.48 });
    const z = covers.length - i;
    const size = Math.max(minSize, Math.min(maxSize, stackWidth * pos.s));
    const left = isMobile ? Math.round(centerX + pos.dx - size / 2) : Math.round(stackWidth * pos.x);
    const top = isMobile ? Math.round(centerY + pos.dy - size / 2) : Math.round(stackHeight * pos.y);
    cover.style.width = `${size}px`;
    cover.style.left = `${left}px`;
    cover.style.top = `${top}px`;
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
