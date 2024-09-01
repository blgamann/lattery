// read contract data

const canvas = document.getElementById("ladderCanvas");
const ctx = canvas.getContext("2d");

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("game");

const participants = [
  "0xafc...3a1",
  "0xfbb...faa",
  "0xcfb...fba",
  "0xaa3...cfa",
  "0x7ab...fba",
];
const results = new Array(participants.length).fill("loser");
const winnerIndex = Math.floor(Math.random() * participants.length);
results[winnerIndex] = "winner";

const ladderWidth = canvas.width;
const ladderHeight = canvas.height;
const lineGap = ladderWidth / (participants.length + 1);
const slots = 10;
const topMargin = 40;
const bottomMargin = 40;

ctx.font = "16px Arial";
ctx.textAlign = "center";

const textPositions = [];

// 개선된 가로선 생성 로직
function generateConnections() {
  const connections = [];
  const grid = Array(participants.length - 1)
    .fill()
    .map(() => Array(slots).fill(false));

  for (let j = 0; j < slots; j++) {
    for (let i = 0; i < participants.length - 1; i++) {
      if (
        !grid[i][j] && // 현재 위치에 연결이 없고
        (i === 0 || !grid[i - 1][j]) && // 왼쪽 열에 연결이 없고
        (j === 0 || !grid[i][j - 1]) && // 위쪽 슬롯에 연결이 없을 때
        Math.random() < 0.5 // 50% 확률로 연결
      ) {
        grid[i][j] = true;
        connections.push({ column: i, slot: j });
      }
    }
  }

  // 마지막 슬롯에서 연결이 하나도 없는 열에 대해 강제 연결
  for (let i = 0; i < participants.length - 1; i++) {
    if (!grid[i].some((connected) => connected)) {
      const lastSlot = slots - 1;
      grid[i][lastSlot] = true;
      connections.push({ column: i, slot: lastSlot });
    }
  }

  return connections;
}

const connections = generateConnections();

// 나머지 함수들은 그대로 유지...

function drawVerticalLines(color = "black") {
  const adjustedLadderHeight = ladderHeight - bottomMargin;
  for (let i = 1; i <= participants.length; i++) {
    const x = i * lineGap;
    ctx.beginPath();
    ctx.moveTo(x, topMargin);
    ctx.lineTo(x, adjustedLadderHeight);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawSlotCircles(color = "gray") {
  const slotPositions = calculateSlotYPositions();
  for (let i = 1; i <= participants.length; i++) {
    const x = i * lineGap;
    slotPositions.forEach((y) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
}

function drawText(startIndex = -1, endIndex = -1) {
  textPositions.length = 0;
  participants.forEach((name, i) => {
    const x = (i + 1) * lineGap;
    ctx.fillStyle = i === startIndex ? "red" : "black";
    ctx.fillText(name, x, topMargin - 15);
    textPositions.push({ name, x, y: topMargin - 15, index: i });
  });

  results.forEach((result, i) => {
    const x = (i + 1) * lineGap;
    ctx.fillStyle = i === endIndex ? "red" : "black";
    ctx.fillText(result, x, ladderHeight - bottomMargin + 30);
  });
}

function calculateSlotYPositions() {
  const slotHeight = (ladderHeight - topMargin - bottomMargin) / (slots + 1);
  return Array.from(
    { length: slots },
    (_, i) => topMargin + (i + 1) * slotHeight
  );
}

function drawHorizontalLinesBasedOnConnections(color = "black") {
  const slotPositions = calculateSlotYPositions();
  connections.forEach(({ column, slot }) => {
    const xStart = (column + 1) * lineGap;
    const xEnd = (column + 2) * lineGap;
    const y = slotPositions[slot];
    ctx.beginPath();
    ctx.moveTo(xStart, y);
    ctx.lineTo(xEnd, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function startGame(columnIndex) {
  clearLadder();
  let currentColumn = columnIndex;
  let currentSlot = -1;
  const slotPositions = calculateSlotYPositions();

  function animate() {
    if (currentSlot >= slots) {
      drawText(columnIndex, currentColumn);
      return;
    }

    clearLadder("lightgray");
    drawHorizontalLinesBasedOnConnections("lightgray");
    drawSlotCircles("lightgray");

    const xStart = (currentColumn + 1) * lineGap;
    const yStart = currentSlot === -1 ? topMargin : slotPositions[currentSlot];
    const yEnd =
      currentSlot === -1 ? slotPositions[0] : slotPositions[currentSlot + 1];

    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xStart, yEnd);
    ctx.stroke();

    // 현재 위치의 동그라미를 빨간색으로 표시
    ctx.beginPath();
    ctx.arc(xStart, yEnd, 5, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();

    currentSlot++;

    const rightConnection = connections.find(
      (c) => c.column === currentColumn && c.slot === currentSlot
    );
    const leftConnection = connections.find(
      (c) => c.column === currentColumn - 1 && c.slot === currentSlot
    );

    if (rightConnection) {
      const xEnd = (currentColumn + 2) * lineGap;
      ctx.beginPath();
      ctx.moveTo(xStart, slotPositions[currentSlot]);
      ctx.lineTo(xEnd, slotPositions[currentSlot]);
      ctx.stroke();
      currentColumn++;
    } else if (leftConnection) {
      const xEnd = currentColumn * lineGap;
      ctx.beginPath();
      ctx.moveTo(xStart, slotPositions[currentSlot]);
      ctx.lineTo(xEnd, slotPositions[currentSlot]);
      ctx.stroke();
      currentColumn--;
    }

    setTimeout(() => requestAnimationFrame(animate), 200);
  }

  animate();
}

function clearLadder(color = "black") {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawVerticalLines(color);
  drawText();
  drawHorizontalLinesBasedOnConnections(color);
  drawSlotCircles();
}

function drawLadder() {
  drawVerticalLines();
  drawText();
  drawHorizontalLinesBasedOnConnections();
  drawSlotCircles();
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  textPositions.forEach((pos) => {
    if (Math.abs(x - pos.x) < 20 && Math.abs(y - pos.y) < 20) {
      startGame(pos.index);
    }
  });
});

drawLadder();
