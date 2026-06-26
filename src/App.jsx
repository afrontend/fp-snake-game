import * as keyboard from 'keyboard-handler';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import fpSnake from 'fp-snake';

const KEY_CODES = {
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SAVE: 83,
  LOAD: 76,
  HELP: 72,
};

const TICK_INTERVAL_MS = 250;

const keyList = [
  { keyValue: KEY_CODES.SPACE, keySymbol: 'space' },
  { keyValue: KEY_CODES.LEFT,  keySymbol: 'left'  },
  { keyValue: KEY_CODES.UP,    keySymbol: 'up'    },
  { keyValue: KEY_CODES.RIGHT, keySymbol: 'right' },
  { keyValue: KEY_CODES.DOWN,  keySymbol: 'down'  },
  { keyValue: KEY_CODES.SAVE,  keySymbol: 'save'  },
  { keyValue: KEY_CODES.LOAD,  keySymbol: 'load'  },
  { keyValue: KEY_CODES.HELP,  keySymbol: 'help'  },
];

const HELP_ITEMS = [
  { key: '← ↑ → ↓', action: '이동' },
  { key: 'Space',    action: '일시정지 / 재개' },
  { key: 'S',        action: '상태 저장' },
  { key: 'L',        action: '상태 불러오기' },
  { key: 'H',        action: '도움말 닫기' },
];

export const getKeySymbol = (keyValue) => {
  const found = keyList.find(key => key.keyValue === keyValue);
  return found ? found.keySymbol : null;
};

// URL 쿼리 파라미터를 파싱해 객체로 반환한다.
// 예: '?debug=true&speed=5' → { debug: 'true', speed: '5' }
export const getArgs = (searchString = window.location.search) => {
  try {
    const params = new URLSearchParams(searchString);
    return Object.fromEntries(params);
  } catch (e) {
    return {};
  }
};

const args = getArgs();

const Block = ({ color, children }) => (
  <div className="block" style={{ backgroundColor: color }}>
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

  useEffect(() => {
    const timer = setInterval(() => {
      if (!showHelpRef.current) {
        setGameState(s => fpSnake.tick(s));
      }
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    keyboard.keyPressed(e => {
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
  }, []);

  return args.debug
    ? (
      <div style={{ columns: '400px 3' }}>
        <div className="container">
          <div className="App">
            <Blocks blocks={fpSnake.toArray(gameState)[0].flat()} />
          </div>
        </div>
        <div className="container">
          <div className="App">
            <Blocks blocks={fpSnake.toArray(gameState)[1].flat()} />
          </div>
        </div>
        <div className="container">
          <div className="App">
            <Blocks blocks={fpSnake.join(gameState).flat()} />
          </div>
        </div>
      </div>
    )
    : (
      <div className="container">
        <div className="App">
          {showHelp && (
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
          )}
          <Blocks blocks={fpSnake.join(gameState).flat()} />
        </div>
      </div>
    );
}

export default App;
