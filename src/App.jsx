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
          <a href="https://github.com/afrontend/fp-snake-game" title="fp-snake-game" style={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
            <img style={{ width: 20, height: 20 }} src="https://agvim.files.wordpress.com/2015/08/github-mark-32px.png?w=685" alt="GitHub" />
          </a>
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
    );
}

export default App;
