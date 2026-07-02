import * as keyboard from 'keyboard-handler';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import fpSnake from 'fp-snake';
import { getKeySymbol } from './utils/keyMap';
import getArgs from './utils/getArgs';

const TICK_INTERVAL_MS = 250;

const HELP_ITEMS = [
  { key: '← ↑ → ↓', action: '이동' },
  { key: 'Space',    action: '일시정지 / 재개' },
  { key: 'S',        action: '상태 저장' },
  { key: 'L',        action: '상태 불러오기' },
  { key: 'H',        action: '도움말 닫기' },
];

const args = getArgs();

const Block = ({ color, children }) => (
  <div
    className={`block${color !== 'grey' ? ' block--filled' : ''}`}
    style={color !== 'grey' ? { '--c': color } : undefined}
  >
    {children}
  </div>
);

const Blocks = ({ blocks }) =>
  blocks.map((item, index) => (
    <Block color={item.color} key={index}>
      {item.count}
    </Block>
  ));

function App() {
  const [gameState, setGameState] = useState(() => fpSnake.init());
  const [showHelp, setShowHelp] = useState(false);
  const savedState = useRef(null);
  const showHelpRef = useRef(false);
  const appRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(s => showHelpRef.current ? s : fpSnake.tick(s));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const removeKeyListener = keyboard.keyPressed(e => {
      const symbol = getKeySymbol(e.which);
      if (symbol === 'help') {
        showHelpRef.current = !showHelpRef.current;
        setShowHelp(h => !h);
        return;
      }
      // setTimeout으로 다음 이벤트 루프에서 처리해
      // 방향키 입력이 setInterval 틱과 겹치지 않도록 함
      setTimeout(() => {
        if (symbol === 'save') {
          setGameState(s => {
            savedState.current = structuredClone(s);
            return s;
          });
        } else if (symbol === 'load') {
          if (savedState.current) {
            setGameState(structuredClone(savedState.current));
          }
        } else {
          setGameState(s => symbol ? fpSnake.key(symbol, s) : s);
        }
      });
    });
    return () => removeKeyListener();
  }, []);

  useEffect(() => {
    const el = appRef.current;
    if (!el || !('ontouchstart' in window)) return;
    let startX = 0, startY = 0;
    const onTouchStart = e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      e.preventDefault();
    };
    const onTouchEnd = e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx), absDy = Math.abs(dy);
      let symbol = null;
      if (absDx < 10 && absDy < 10) {
        symbol = 'space';
      } else if (Math.max(absDx, absDy) > 30) {
        symbol = absDx > absDy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      }
      if (symbol) {
        setTimeout(() => {
          if (symbol === 'save') {
            setGameState(s => { savedState.current = structuredClone(s); return s; });
          } else if (symbol === 'load') {
            if (savedState.current) setGameState(structuredClone(savedState.current));
          } else {
            setGameState(s => fpSnake.key(symbol, s));
          }
        });
      }
      e.preventDefault();
    };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return args.debug
    ? (
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '12px' }}>
        <div className="container" style={{ width: 'calc(3vh * 15 + 2px)' }}>
          <div className="App">
            <Blocks blocks={fpSnake.toArray(gameState)[0].flat()} />
          </div>
        </div>
        <div className="container" style={{ width: 'calc(3vh * 15 + 2px)' }}>
          <div className="App">
            <Blocks blocks={fpSnake.toArray(gameState)[1].flat()} />
          </div>
        </div>
        <div className="container" style={{ width: 'calc(3vh * 15 + 2px)' }}>
          <div className="App">
            <Blocks blocks={fpSnake.join(gameState).flat()} />
          </div>
        </div>
      </div>
    )
    : (
      <div className="container">
        <div className="App-wrapper">
          <a href="https://github.com/afrontend/fp-snake-game" title="fp-snake-game" style={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
            <img style={{ width: 20, height: 20 }} src="https://agvim.files.wordpress.com/2015/08/github-mark-32px.png?w=685" alt="GitHub" />
          </a>
          <div ref={appRef} className="App">
          {showHelp ? (
            <div className="help-overlay" role="dialog" aria-label="도움말">
              <table>
                <tbody>
                  {HELP_ITEMS.map(({ key, action }) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <Blocks blocks={fpSnake.join(gameState).flat()} />
          </div>
        </div>
      </div>
    );
}

export default App;
