import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5175;
const BASE = '/fp-snake-game/';
const MOVES = 60;
const AI_INTERVAL = 280; // slightly longer than game tick (250ms)

// AI BFS code injected into the browser page
const AI_SCRIPT = `
(() => {
  const ROWS = 15;
  const COLS = 15;
  const KEY_MAP = {
    up:    { key: 'ArrowUp',    keyCode: 38 },
    down:  { key: 'ArrowDown',  keyCode: 40 },
    left:  { key: 'ArrowLeft',  keyCode: 37 },
    right: { key: 'ArrowRight', keyCode: 39 },
  };

  let prevSnakeSet = new Set();

  function getState() {
    const blocks = document.querySelectorAll('.block');
    const snake = [], apple = [];
    blocks.forEach((b, i) => {
      const c = getComputedStyle(b).getPropertyValue('--c').trim();
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      if (c === 'orange') snake.push({ row, col });
      else if (c === 'red')    apple.push({ row, col });
    });
    return { snake, apple };
  }

  function findHead(currSnake, prevSet) {
    if (!currSnake.length) return null;
    if (currSnake.length === 1) return currSnake[0];
    const newCells = currSnake.filter(c => !prevSet.has(c.row + ',' + c.col));
    return newCells.length === 1 ? newCells[0] : currSnake[0];
  }

  function bfs(head, apple, snakeSet) {
    const dirs = [
      { dr: -1, dc: 0, key: 'up'    },
      { dr:  1, dc: 0, key: 'down'  },
      { dr:  0, dc:-1, key: 'left'  },
      { dr:  0, dc: 1, key: 'right' },
    ];
    const q = [{ row: head.row, col: head.col, firstKey: null }];
    const visited = new Set([head.row + ',' + head.col]);
    while (q.length) {
      const cur = q.shift();
      for (const { dr, dc, key } of dirs) {
        const nr = cur.row + dr, nc = cur.col + dc, pk = nr + ',' + nc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (visited.has(pk) || snakeSet.has(pk)) continue;
        const fk = cur.firstKey || key;
        if (nr === apple.row && nc === apple.col) return fk;
        visited.add(pk);
        q.push({ row: nr, col: nc, firstKey: fk });
      }
    }
    // No path to apple — find any safe direction to survive
    for (const { dr, dc, key } of dirs) {
      const nr = head.row + dr, nc = head.col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !snakeSet.has(nr + ',' + nc)) return key;
    }
    return null;
  }

  function pressKey(dir) {
    const k = KEY_MAP[dir];
    if (!k) return;
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: k.key, code: k.key, keyCode: k.keyCode, which: k.keyCode,
      bubbles: true, cancelable: true,
    }));
  }

  let moveCount = 0;
  window._snakeAI = setInterval(() => {
    if (moveCount >= ${MOVES}) { clearInterval(window._snakeAI); return; }
    const { snake, apple } = getState();
    if (!snake.length || !apple.length) return;
    const currSet = new Set(snake.map(c => c.row + ',' + c.col));
    const head = findHead(snake, prevSnakeSet);
    prevSnakeSet = currSet;
    if (!head) return;
    const dir = bfs(head, apple[0], currSet);
    if (dir) pressKey(dir);
    moveCount++;
  }, ${AI_INTERVAL});
})();
`;

async function waitForServer(url, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Server not ready after ${timeout}ms`);
}

async function main() {
  console.log('Building...');
  const build = spawn('npx', ['vite', 'build'], { stdio: 'inherit', shell: true, cwd: ROOT });
  await new Promise((resolve, reject) => {
    build.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`Build failed: ${code}`))
    );
  });

  console.log('Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    stdio: 'pipe',
    shell: true,
    cwd: ROOT,
  });
  const url = `http://localhost:${PORT}${BASE}`;
  await waitForServer(url);
  console.log(`Server ready at ${url}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 480, height: 640 });
  await page.goto(url);
  await page.waitForTimeout(500);

  console.log(`Injecting AI for ${MOVES} moves...`);
  await page.evaluate(AI_SCRIPT);

  // Wait for AI to finish: MOVES × AI_INTERVAL + extra buffer
  await page.waitForTimeout(MOVES * AI_INTERVAL + 800);

  const outPath = path.resolve(ROOT, 'screenshot.png');
  await page.screenshot({ path: outPath });

  await browser.close();
  server.kill();
  console.log(`Saved: ${outPath}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
