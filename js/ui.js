// ===== SQUARE WARS — ui.js (fixed) =====
import {
  UI_IDS,
  CSS,
  ROWS,
  COLS,
  CELL,
  GAP,
  GRID_PADDING,
  BORDER_WIDTH,
  PLAYER,
  SCORING_MODES,
} from "./constants.js";

// === Responsive board scaling ===
const CONTAINER_PADDING = 8;
const CONTAINER_BORDER = 4;
const CONTAINER_RADIUS = 12;
const GRID_CORNER_RADIUS = 8;

const BASE_WIDTH =
  COLS * CELL +
  (COLS - 1) * GAP +
  2 * (GRID_PADDING + CONTAINER_PADDING + CONTAINER_BORDER);
const BASE_HEIGHT =
  ROWS * CELL +
  (ROWS - 1) * GAP +
  2 * (GRID_PADDING + CONTAINER_PADDING + CONTAINER_BORDER);

let currentMetrics = {
  cell: CELL,
  gap: GAP,
  gridPadding: GRID_PADDING,
  containerPadding: CONTAINER_PADDING,
  containerBorder: CONTAINER_BORDER,
  containerRadius: CONTAINER_RADIUS,
  gridRadius: GRID_CORNER_RADIUS,
};

function setBoardMetrics(metrics) {
  currentMetrics = metrics;
}

function getBoardMetrics() {
  return currentMetrics;
}

export function applyResponsiveScale() {
  const outer = document.getElementById("gridOuter");
  const inner = document.getElementById("gridContainer");
  if (!outer || !inner) return;

  const viewport = window.visualViewport || null;
  const layoutWidth = window.innerWidth || document.documentElement.clientWidth || 360;
  const layoutHeight = window.innerHeight || document.documentElement.clientHeight || 640;
  const viewportWidth = (viewport && viewport.width) || layoutWidth;
  const viewportHeight = (viewport && viewport.height) || layoutHeight;
  const viewportOffsetLeft = (viewport && viewport.offsetLeft) || 0;
  const viewportOffsetTop = (viewport && viewport.offsetTop) || 0;
  const viewportOffsetRight = viewport
    ? Math.max(0, layoutWidth - (viewport.offsetLeft + viewport.width))
    : 0;
  const viewportOffsetBottom = viewport
    ? Math.max(0, layoutHeight - (viewport.offsetTop + viewport.height))
    : 0;

  const bodyStyles = window.getComputedStyle(document.body);
  const paddingLeft = parseFloat(bodyStyles.paddingLeft) || 0;
  const paddingRight = parseFloat(bodyStyles.paddingRight) || 0;
  const paddingTop = parseFloat(bodyStyles.paddingTop) || 0;
  const paddingBottom = parseFloat(bodyStyles.paddingBottom) || 0;

  const availableWidth = Math.max(
    240,
    viewportWidth - paddingLeft - paddingRight - viewportOffsetLeft - viewportOffsetRight
  );

  const outerRect = outer.getBoundingClientRect();
  const topInViewport = outerRect.top - viewportOffsetTop;
  const safeTop = Math.max(0, topInViewport - paddingTop);
  const verticalPadding = paddingBottom + viewportOffsetBottom + 24;
  const availableHeight = viewportHeight - safeTop - verticalPadding;

  let scaleFromWidth = availableWidth / BASE_WIDTH;
  if (!Number.isFinite(scaleFromWidth) || scaleFromWidth <= 0) {
    scaleFromWidth = 1;
  }

  let scaleFromHeight = Number.POSITIVE_INFINITY;
  if (availableHeight > 0) {
    scaleFromHeight = availableHeight / BASE_HEIGHT;
  }

  let scale = Math.min(1, scaleFromWidth);
  if (Number.isFinite(scaleFromHeight) && scaleFromHeight > 0) {
    scale = Math.min(scale, scaleFromHeight);
  }

  if (!Number.isFinite(scale) || scale <= 0) {
    scale = 1;
  }

  let cell = CELL * scale;
  let gap = GAP * scale;
  let gridPadding = GRID_PADDING * scale;
  let containerPadding = CONTAINER_PADDING * scale;
  let containerBorder = CONTAINER_BORDER * scale;
  let containerRadius = CONTAINER_RADIUS * scale;
  let gridRadius = GRID_CORNER_RADIUS * scale;

  const minCell = 1.5;
  const minGap = 0.35;
  const minPad = 0.75;
  const minBorder = 0.9;
  const minRadius = 4;

  cell = Math.max(minCell, cell);
  gap = Math.max(minGap, gap);
  gridPadding = Math.max(minPad, gridPadding);
  containerPadding = Math.max(minPad, containerPadding);
  containerBorder = Math.max(minBorder, containerBorder);
  containerRadius = Math.max(minRadius, containerRadius);
  gridRadius = Math.max(minRadius - 1, gridRadius);

  let boardWidth =
    COLS * cell +
    (COLS - 1) * gap +
    2 * (gridPadding + containerPadding + containerBorder);
  let boardHeight =
    ROWS * cell +
    (ROWS - 1) * gap +
    2 * (gridPadding + containerPadding + containerBorder);

  const widthCorrection =
    availableWidth > 0 ? Math.min(1, availableWidth / boardWidth) : 1;
  const heightCorrection =
    availableHeight > 0 ? Math.min(1, availableHeight / boardHeight) : 1;
  const correction = Math.min(widthCorrection, heightCorrection);

  if (correction > 0 && correction < 1) {
    cell *= correction;
    gap *= correction;
    gridPadding *= correction;
    containerPadding *= correction;
    containerBorder = Math.max(minBorder, containerBorder * correction);
    containerRadius = Math.max(minRadius, containerRadius * correction);
    gridRadius = Math.max(minRadius - 1, gridRadius * correction);

    boardWidth =
      COLS * cell +
      (COLS - 1) * gap +
      2 * (gridPadding + containerPadding + containerBorder);
    boardHeight =
      ROWS * cell +
      (ROWS - 1) * gap +
      2 * (gridPadding + containerPadding + containerBorder);
  }

  const root = document.documentElement;
  const formatPx = (value) => `${Math.round(value * 1000) / 1000}px`;
  root.style.setProperty("--cell-size", formatPx(cell));
  root.style.setProperty("--cell-gap", formatPx(gap));
  root.style.setProperty("--grid-padding", formatPx(gridPadding));
  root.style.setProperty("--container-padding", formatPx(containerPadding));
  root.style.setProperty("--container-border", formatPx(containerBorder));
  root.style.setProperty("--container-radius", formatPx(containerRadius));
  root.style.setProperty("--grid-radius", formatPx(gridRadius));

  const outlineInset = containerPadding + containerBorder;
  root.style.setProperty("--outline-inset", formatPx(outlineInset));

  const widthPx = formatPx(boardWidth);
  const heightPx = formatPx(boardHeight);
  outer.style.width = widthPx;
  outer.style.maxWidth = widthPx;
  outer.style.minWidth = widthPx;
  outer.style.height = heightPx;
  outer.style.minHeight = heightPx;

  const outlineLayer = document.getElementById(UI_IDS.outlineLayer);
  if (outlineLayer) {
    outlineLayer.style.inset = formatPx(outlineInset);
  }

  setBoardMetrics({
    cell,
    gap,
    gridPadding,
    containerPadding,
    containerBorder,
    containerRadius,
    gridRadius,
  });

  ensureBoxesSvgSizedForLayer();
}

/** Track which move is the real "last move" to avoid race conditions */
let uiLastMoveToken = 0;

function animateGhostDrop(ghost, row, onFinish) {
  const metrics = getBoardMetrics();
  const step = metrics.cell + metrics.gap;
  const distance = (row + 1) * step;
  const overshoot = Math.min(metrics.cell * 0.6, distance * 0.08);
  const duration = Math.max(280, Math.min(720, distance * 1.6));
  const prefersReduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const resolvedDuration = prefersReduced ? Math.min(280, duration) : duration;
  const resolvedOvershoot = prefersReduced ? 0 : overshoot;

  let fallbackTimer;
  let finished = false;
  const finishOnce = () => {
    if (finished) return;
    finished = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    ghost.classList.remove("drop-in");
    ghost.style.removeProperty("--drop-start");
    ghost.style.removeProperty("--drop-overshoot");
    ghost.style.removeProperty("--drop-duration");
    onFinish();
  };

  if (typeof ghost.animate === "function") {
    const animation = ghost.animate(
      [
        { transform: `translateY(${-distance}px) scale(0.94)`, opacity: 0 },
        {
          transform: `translateY(${resolvedOvershoot}px) scale(1.02)`,
          opacity: 1,
          offset: 0.75,
        },
        { transform: "translateY(0) scale(1)", opacity: 1 },
      ],
      {
        duration: resolvedDuration,
        easing: "cubic-bezier(0.24, 0.92, 0.32, 1)",
        fill: "forwards",
      }
    );
    animation.onfinish = finishOnce;
    animation.oncancel = finishOnce;
    fallbackTimer = window.setTimeout(finishOnce, resolvedDuration + 120);
  } else {
    ghost.classList.add("drop-in");
    ghost.style.setProperty("--drop-start", `${-distance}px`);
    ghost.style.setProperty("--drop-overshoot", `${resolvedOvershoot}px`);
    ghost.style.setProperty("--drop-duration", `${resolvedDuration}ms`);
    fallbackTimer = window.setTimeout(finishOnce, resolvedDuration + 120);
    ghost.addEventListener("animationend", finishOnce, { once: true });
  }
}

/** Is any modal open? */
export function anyModalOpen() {
  const ids = [
    UI_IDS.modeSelectModal,
    UI_IDS.scoringSelectModal,
    UI_IDS.quickfireSelectModal,
    UI_IDS.instructionsModal,
    UI_IDS.difficultySelectModal,
    UI_IDS.endGameModal,
  ];
  return ids.some((id) => {
    const el = document.getElementById(id);
    return el && !el.classList.contains(CSS.HIDDEN);
  });
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
  ghost.className = `chip-ghost ${player === PLAYER.RED ? "red" : "blue"}`;
  ghost.style.left = `${left}px`;
  ghost.style.top = `${top}px`;
  outlineLayer.appendChild(ghost);

  const finish = () => {
    ghost.remove();
    delete cell.dataset.ghost;

    if (grid[row][col] === PLAYER.RED) cell.className = "cell red";
    else if (grid[row][col] === PLAYER.BLUE) cell.className = "cell blue";
    const key = `${row}-${col}`;
    const isBlocked = blockedCells.has(key);
    if (isBlocked) {
      cell.classList.add("blocked");
      // fixed: valid alpha value
      cell.style.border = "1px solid rgba(255,255,255,0.4)";
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

  animateGhostDrop(ghost, row, finish);
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

export function ensureBoxesSvgSizedForLayer() {
  const layer = document.getElementById(UI_IDS.outlineLayer);
  if (!layer) return;
  const svg = layer.querySelector("#boxesSvg");
  if (!svg) return;
  svg.setAttribute("viewBox", `0 0 ${layer.clientWidth} ${layer.clientHeight}`);
}

export function drawOutlineRect(minRow, maxRow, minCol, maxCol, player) {
  const layer = document.getElementById(UI_IDS.outlineLayer);
  if (!layer) return;
  const svg = ensureBoxesSvg();

  const metrics = getBoardMetrics();
  const step = metrics.cell + metrics.gap;
  const scaleRatio = metrics.cell / CELL;
  const border = Math.max(1, BORDER_WIDTH * scaleRatio);
  const halo = 3 * scaleRatio;

  const x = metrics.gridPadding + minCol * step - border - halo;
  const y = metrics.gridPadding + minRow * step - border - halo;
  const w = (maxCol - minCol + 1) * step - metrics.gap + border + halo * 2;
  const h = (maxRow - minRow + 1) * step - metrics.gap + border + halo * 2;

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
  const corner = Math.max(3, 8 * scaleRatio);
  rect.setAttribute("rx", corner);
  rect.setAttribute("ry", corner);

  const group = svg.querySelector("#boxesGroup");
  group.appendChild(rect);
}

export function drawWinStrike(winningLine, player) {
  const outlineLayer = document.getElementById(UI_IDS.outlineLayer);
  if (!outlineLayer) return;

  const first = winningLine[0];
  const last = winningLine[winningLine.length - 1];

  const metrics = getBoardMetrics();
  const step = metrics.cell + metrics.gap;
  const centerOf = (r, c) => ({
    x: metrics.gridPadding + c * step + metrics.cell / 2,
    y: metrics.gridPadding + r * step + metrics.cell / 2,
  });

  const p1 = centerOf(first.row, first.col);
  const p2 = centerOf(last.row, last.col);

  const dx = p2.x - p1.x,
    dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy) + 2;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const strokeThickness = Math.max(3, metrics.cell * 0.18);

  const line = document.createElement("div");
  line.className = `win-strike ${player === PLAYER.RED ? "red" : "blue"}`;
  line.style.left = `${p1.x}px`;
  line.style.top = `${p1.y - strokeThickness / 2}px`;
  line.style.width = `${len}px`;
  line.style.height = `${strokeThickness}px`;
  line.style.transformOrigin = "left center";
  line.style.transform = `rotate(${angle}deg)`;
  outlineLayer.appendChild(line);
}

/* ------- Modals & labels ------- */
export function showEndGameModal(winnerLabel, redScore, blueScore) {
  const modal = document.getElementById(UI_IDS.endGameModal);
  const title = document.getElementById(UI_IDS.endGameTitle);
  const subtitle = document.getElementById(UI_IDS.endGameSubtitle);

  title.textContent = "Game Over";

  if (redScore === blueScore) {
    subtitle.innerHTML = `<strong style="color: white;">Draw</strong><br>Final Score: ${redScore} - ${blueScore}`;
  } else if (winnerLabel.includes("Red")) {
    subtitle.innerHTML = `<strong style="color: #ff4444;">${winnerLabel} Wins!</strong><br>Final Score: ${redScore} - ${blueScore}`;
  } else {
    subtitle.innerHTML = `<strong style="color: #4444ff;">${winnerLabel} Wins!</strong><br>Final Score: ${redScore} - ${blueScore}`;
  }

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

/** Update title/labels; include Quick Fire target when relevant */
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





