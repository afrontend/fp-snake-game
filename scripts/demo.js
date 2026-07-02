import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5179;
const BASE = '/fp-snake-game/';
const MOVES = 60;
const AI_INTERVAL = 280;
const WIDTH = 480;
const HEIGHT = 640;

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

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-snake-demo-'));
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: tmpDir, size: { width: WIDTH, height: HEIGHT } },
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  await page.goto(url);
  await page.waitForTimeout(500);

  console.log(`Injecting AI for ${MOVES} moves (~${(MOVES * AI_INTERVAL / 1000).toFixed(1)}s)...`);
  await page.evaluate(AI_SCRIPT);

  await page.waitForTimeout(MOVES * AI_INTERVAL + 800);

  const previewPath = path.resolve(ROOT, 'preview.png');
  await page.screenshot({ path: previewPath });
  console.log(`Preview screenshot saved: ${previewPath}`);

  const video = page.video();
  await context.close();
  await browser.close();
  server.kill();

  const videoPath = await video.path();
  console.log(`Video saved: ${videoPath}`);

  const outPath = path.resolve(ROOT, 'demo.gif');
  console.log('Converting to GIF...');
  execSync(
    `ffmpeg -y -i "${videoPath}" ` +
    `-vf "fps=10,scale=${WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" ` +
    `-loop 0 "${outPath}"`,
    { stdio: 'inherit' },
  );

  console.log(`Saved: ${outPath}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
