// ===== SQUARE WARS — ui.js =====
import { UI_IDS, CSS, PLAYER, SCORING_MODES } from "./constants.js";

/** Track which move is the real "last move" to avoid race conditions */
let uiLastMoveToken = 0;

/* ---------- measurement helpers (responsive-safe) ---------- */
function getGridEl() {
  return document.getElementById(UI_IDS.gameGrid);
}
function getGridGapPx() {
  const grid = getGridEl();
  const g = getComputedStyle(grid).gap || getComputedStyle(grid).rowGap;
  // "2px" or "2px 2px"
  const first = (g || "2px").split(" ")[0];
  return parseFloat(first) || 2;
}
function getCellRect(row, col) {
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  return cell ? cell.getBoundingClientRect() : null;
}
function getCellSizePx() {
  const r = getCellRect(0, 0);
  return r ? r.width : 20;
}
function getLayerRect() {
  const layer = document.getElementById(UI_IDS.outlineLayer);
  return layer.getBoundingClientRect();
}
function centerOfCell(row, col) {
  const a = getCellRect(row, col);
  if (!a) return { x: 0, y: 0 };
  const L = getLayerRect();
  return { x: a.left - L.left + a.width / 2, y: a.top - L.top + a.height / 2 };
}

/** Update header, scores, banner, and balance meter */
export function updateDisplay(
  currentPlayer,
  gameMode,
  aiDifficulty,
  scoringMode,
  redScore,
  blueScore
) {
  document.getElementById(UI_IDS.redGames).textContent = redScore;
  document.getElementById(UI_IDS.blueGames).textContent = blueScore;

  const redScoreEl = document.getElementById(UI_IDS.redScore);
  const blueScoreEl = document.getElementById(UI_IDS.blueScore);
  redScoreEl.classList.remove(CSS.LEADING);
  blueScoreEl.classList.remove(CSS.LEADING);
  if (redScore > blueScore) redScoreEl.classList.add(CSS.LEADING);
  else if (blueScore > redScore) blueScoreEl.classList.add(CSS.LEADING);

  const total = Math.max(1, redScore + blueScore);
  const pctR = (redScore / total) * 100;
  const pctB = 100 - pctR;
  const meterR = document.getElementById("scoreMeterRed");
  const meterB = document.getElementById("scoreMeterBlue");
  if (meterR && meterB) {
    meterR.style.width = pctR + "%";
    meterB.style.width = pctB + "%";
  }

  const currentPlayerSpan = document.getElementById(UI_IDS.currentPlayer);
  const currentPlayerBanner = document.getElementById(
    UI_IDS.currentPlayerBanner
  );
  currentPlayerBanner.classList.remove(CSS.PLAYER1_TURN, CSS.PLAYER2_TURN);

  if (currentPlayer === PLAYER.RED) {
    currentPlayerSpan.textContent =
      gameMode === "single" ? "You (Red)" : "Player 1 (Red)";
    currentPlayerSpan.className = CSS.PLAYER1;
    currentPlayerBanner.classList.add(CSS.PLAYER1_TURN);
  } else {
    if (gameMode === "single") {
      currentPlayerSpan.textContent = "Computer (Blue)";
      currentPlayerSpan.className = `${CSS.PLAYER2} ${CSS.COMPUTER_TURN}`;
    } else {
      currentPlayerSpan.textContent = "Player 2 (Blue)";
      currentPlayerSpan.className = CSS.PLAYER2;
    }
    currentPlayerBanner.classList.add(CSS.PLAYER2_TURN);
  }
}

/** Build grid (delegated click) */
export function buildGrid(rows, cols, onColumnClick) {
  const gameGrid = document.getElementById(UI_IDS.gameGrid);
  gameGrid.innerHTML = "";

  const frag = document.createDocumentFragment();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      frag.appendChild(cell);
    }
  }
  gameGrid.appendChild(frag);

  if (gameGrid._delegatedHandler) {
    gameGrid.removeEventListener("click", gameGrid._delegatedHandler);
  }
  const handler = (e) => {
    const target = e.target.closest(".cell");
    if (!target || !gameGrid.contains(target)) return;
    const col = Number(target.dataset.col);
    if (!Number.isNaN(col)) onColumnClick(col);
  };
  gameGrid.addEventListener("click", handler);
  gameGrid._delegatedHandler = handler;

  ensureBoxesSvg();

  // keep SVG coordinate system valid on resize
  window.addEventListener(
    "resize",
    () => {
      const svg = document.getElementById("boxesSvg");
      if (svg) {
        const layer = document.getElementById(UI_IDS.outlineLayer);
        svg.setAttribute(
          "viewBox",
          `0 0 ${layer.clientWidth} ${layer.clientHeight}`
        );
      }
    },
    { passive: true }
  );
}

/**
 * Update a single cell with a ghost chip animation.
 */
export function updateCellDisplay(
  grid,
  blockedCells,
  _prevLastMove,
  row,
  col,
  token
) {
  uiLastMoveToken = token;

  document.querySelectorAll(".cell.last-move").forEach((el) => {
    el.classList.remove(CSS.LAST_MOVE);
    el.style.border = "";
  });

  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;

  const player = grid[row][col];
  cell.className = "cell";
  cell.dataset.ghost = "1";

  const outlineLayer = document.getElementById(UI_IDS.outlineLayer);
  const cellRect = cell.getBoundingClientRect();
  const layerRect = outlineLayer.getBoundingClientRect();
  const left = cellRect.left - layerRect.left;
  const top = cellRect.top - layerRect.top;

  const ghost = document.createElement("div");
  ghost.className = `chip-ghost ${
    player === PLAYER.RED ? "red" : "blue"
  } drop-in`;
  ghost.style.left = `${left}px`;
  ghost.style.top = `${top}px`;
  ghost.style.width = `${cellRect.width}px`;
  ghost.style.height = `${cellRect.height}px`;

  const dropY = (row + 1) * (getCellSizePx() + getGridGapPx());
  ghost.style.setProperty("--drop-y", `${dropY}px`);

  outlineLayer.appendChild(ghost);

  const finish = () => {
    ghost.remove();
    delete cell.dataset.ghost;

    if (grid[row][col] === PLAYER.RED) cell.className = "cell red";
    else if (grid[row][col] === PLAYER.BLUE) cell.className = "cell blue";
    else cell.className = "cell";

    const key = `${row}-${col}`;
    const isBlocked = blockedCells.has(key);
    if (isBlocked) {
      cell.classList.add("blocked");
      cell.style.border = "1px solid rgba(255,255,255,.4)";
    } else {
      cell.classList.remove("blocked");
      if (token === uiLastMoveToken) {
        document
          .querySelectorAll(".cell.last-move")
          .forEach((el) => el.classList.remove(CSS.LAST_MOVE));
        cell.classList.add(CSS.LAST_MOVE);
      }
    }
  };

  ghost.addEventListener("animationend", finish, { once: true });
}

/** Update every cell */
export function updateAllCellDisplays(
  grid,
  blockedCells,
  lastMovePosition,
  rows,
  cols
) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (!cell) continue;

      if (cell.dataset.ghost === "1") {
        cell.className = "cell";
        continue;
      }
      cell.classList.remove(CSS.LAST_MOVE);

      if (grid[r][c] === PLAYER.RED) cell.className = "cell red";
      else if (grid[r][c] === PLAYER.BLUE) cell.className = "cell blue";
      else cell.className = "cell";

      const key = `${r}-${c}`;
      if (blockedCells.has(key)) cell.classList.add("blocked");
      else cell.classList.remove("blocked");
    }
  }

  if (
    lastMovePosition &&
    !blockedCells.has(`${lastMovePosition.row}-${lastMovePosition.col}`)
  ) {
    const last = document.querySelector(
      `[data-row="${lastMovePosition.row}"][data-col="${lastMovePosition.col}"]`
    );
    if (last && last.dataset.ghost !== "1") last.classList.add(CSS.LAST_MOVE);
  }
}

/* ---------- Single SVG overlay for boxes ---------- */
function ensureBoxesSvg() {
  const layer = document.getElementById(UI_IDS.outlineLayer);
  if (!layer) return;

  let svg = layer.querySelector("#boxesSvg");
  if (svg) return svg;

  svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", "boxesSvg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${layer.clientWidth} ${layer.clientHeight}`);
  svg.style.position = "absolute";
  svg.style.inset = "0";
  svg.style.pointerEvents = "none";
  svg.setAttribute("preserveAspectRatio", "none");

  const defs = document.createElementNS(svg.namespaceURI, "defs");

  const mkPattern = (id, base, stripe, alpha) => {
    const p = document.createElementNS(svg.namespaceURI, "pattern");
    p.setAttribute("id", id);
    p.setAttribute("patternUnits", "userSpaceOnUse");
    p.setAttribute("width", "20");
    p.setAttribute("height", "20");
    p.setAttribute("patternTransform", "rotate(45)");

    const bg = document.createElementNS(svg.namespaceURI, "rect");
    bg.setAttribute("width", "20");
    bg.setAttribute("height", "20");
    bg.setAttribute("fill", `rgba(${base},${alpha})`);
    p.appendChild(bg);

    const line = document.createElementNS(svg.namespaceURI, "rect");
    line.setAttribute("x", "0");
    line.setAttribute("y", "0");
    line.setAttribute("width", "8");
    line.setAttribute("height", "20");
    line.setAttribute("fill", `rgba(${stripe},0.16)`);
    p.appendChild(line);
    defs.appendChild(p);
  };

  mkPattern("hatch-red", "255,107,107", "255,255,255", 0.18);
  mkPattern("hatch-blue", "77,171,247", "255,255,255", 0.18);

  const mkGlow = (id, color) => {
    const f = document.createElementNS(svg.namespaceURI, "filter");
    f.setAttribute("id", id);
    f.setAttribute("x", "-20%");
    f.setAttribute("y", "-20%");
    f.setAttribute("width", "140%");
    f.setAttribute("height", "140%");
    const fe = document.createElementNS(svg.namespaceURI, "feDropShadow");
    fe.setAttribute("dx", "0");
    fe.setAttribute("dy", "0");
    fe.setAttribute("stdDeviation", "4");
    fe.setAttribute("flood-color", color);
    fe.setAttribute("flood-opacity", "0.55");
    f.appendChild(fe);
    defs.appendChild(f);
  };
  mkGlow("glow-red", "#ff6b6b");
  mkGlow("glow-blue", "#4dabf7");

  svg.appendChild(defs);

  const g = document.createElementNS(svg.namespaceURI, "g");
  g.setAttribute("id", "boxesGroup");
  svg.appendChild(g);

  layer.appendChild(svg);
  return svg;
}

export function drawOutlineRect(minRow, maxRow, minCol, maxCol, player) {
  const layer = document.getElementById(UI_IDS.outlineLayer);
  if (!layer) return;
  const svg = ensureBoxesSvg();

  // measure by DOM so it works at any size
  const topLeft = getCellRect(minRow, minCol);
  const botRight = getCellRect(maxRow, maxCol);
  if (!topLeft || !botRight) return;

  const L = layer.getBoundingClientRect();
  const x = topLeft.left - L.left - 3;
  const y = topLeft.top - L.top - 3;
  const w = botRight.right - topLeft.left + 6;
  const h = botRight.bottom - topLeft.top + 6;

  const rect = document.createElementNS(svg.namespaceURI, "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", w);
  rect.setAttribute("height", h);
  rect.setAttribute(
    "fill",
    player === PLAYER.RED ? "url(#hatch-red)" : "url(#hatch-blue)"
  );
  rect.setAttribute(
    "filter",
    player === PLAYER.RED ? "url(#glow-red)" : "url(#glow-blue)"
  );
  rect.setAttribute(
    "stroke",
    player === PLAYER.RED ? "rgba(255,107,107,.9)" : "rgba(77,171,247,.9)"
  );
  rect.setAttribute("stroke-width", "3");
  rect.setAttribute("rx", "8");
  rect.setAttribute("ry", "8");

  const group = svg.querySelector("#boxesGroup");
  group.appendChild(rect);
}

export function drawWinStrike(winningLine, player) {
  const outlineLayer = document.getElementById(UI_IDS.outlineLayer);
  if (!outlineLayer) return;

  const first = winningLine[0];
  const last = winningLine[winningLine.length - 1];
  const p1 = centerOfCell(first.row, first.col);
  const p2 = centerOfCell(last.row, last.col);

  const dx = p2.x - p1.x,
    dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy) + 2;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const line = document.createElement("div");
  line.className = `win-strike ${player === PLAYER.RED ? "red" : "blue"}`;
  line.style.width = `${len}px`;
  line.style.transformOrigin = "0 50%";
  line.style.transform = `translate(${p1.x}px, ${p1.y}px) rotate(${angle}deg)`;
  outlineLayer.appendChild(line);
}

/** End game modal helpers */
export function showEndGameModal(winnerLabel, r, b) {
  const modal = document.getElementById(UI_IDS.endGameModal);
  document.getElementById(UI_IDS.endGameTitle).textContent = "Game Over";
  document.getElementById(
    UI_IDS.endGameSubtitle
  ).innerHTML = `Winner: <strong>${winnerLabel}</strong> — Final Score ${r} : ${b}`;
  modal.classList.remove(CSS.HIDDEN);
  modal.setAttribute("aria-hidden", "false");
}
export function hideEndGameModal() {
  const modal = document.getElementById(UI_IDS.endGameModal);
  modal.classList.add(CSS.HIDDEN);
  modal.setAttribute("aria-hidden", "true");
}

/** Show instructions text; if Quick Fire, include the chosen target */
export function showInstructions(scoringMode, quickFireTarget) {
  const instructionsModal = document.getElementById(UI_IDS.instructionsModal);
  const body = document.getElementById("instructionsBody");

  const general =
    "Drop your discs into the grid and try to connect four in a row — horizontally, vertically, or diagonally. When a player connects four, that area of the board becomes blocked off with a glowing outline. The game continues until the board is full.";

  const classic =
    "<strong>Classic:</strong> each captured box scores <em>1 point</em>.";
  const area =
    "<strong>Territory Takedown:</strong> score the <em>number of squares</em> inside the captured zone. Overlaps can <em>steal</em> territory.";
  const quick = `<strong>Quick Fire:</strong> Classic scoring, but the first player to <em>${quickFireTarget} box${
    quickFireTarget === 1 ? "" : "es"
  }</em> wins immediately.`;

  let modeText = classic;
  if (scoringMode === SCORING_MODES.AREA) modeText = area;
  else if (scoringMode === SCORING_MODES.QUICKFIRE) modeText = quick;

  body.innerHTML = `${general}<br><br>${modeText}`;

  instructionsModal.classList.remove(CSS.HIDDEN);
  instructionsModal.setAttribute("aria-hidden", "false");
}
export function closeInstructionsUI(afterCloseCallback) {
  const modal = document.getElementById(UI_IDS.instructionsModal);
  if (!modal) return;
  modal.classList.add(CSS.HIDDEN);
  modal.setAttribute("aria-hidden", "true");
  if (typeof afterCloseCallback === "function") afterCloseCallback();
}

/** Title/labels */
export function updateLabelsForModeUI(
  gameMode,
  aiDifficulty,
  scoringMode,
  quickFireTarget
) {
  const gameTitle = document.getElementById(UI_IDS.gameTitle);
  const redLabel = document.getElementById(UI_IDS.redLabel);
  const blueLabel = document.getElementById(UI_IDS.blueLabel);

  let suffix = " — Classic";
  if (scoringMode === SCORING_MODES.AREA) suffix = " — Territory Takedown";
  if (scoringMode === SCORING_MODES.QUICKFIRE) {
    const n = quickFireTarget ?? 5;
    suffix = ` — Quick Fire (First to ${n})`;
  }

  if (gameMode === "single") {
    gameTitle.textContent = "SQUARE WARS SINGLEPLAYER" + suffix;
    redLabel.textContent = "You (Red)";
    if (aiDifficulty) {
      const difficultyName =
        aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1);
      blueLabel.textContent = `Computer (Blue) - ${difficultyName}`;
    } else {
      blueLabel.textContent = "Computer (Blue)";
    }
  } else if (gameMode === "multi") {
    gameTitle.textContent = "SQUARE WARS MULTIPLAYER" + suffix;
    redLabel.textContent = "Player 1 (Red)";
    blueLabel.textContent = "Player 2 (Blue)";
  } else {
    gameTitle.textContent = "SQUARE WARS";
  }
}
