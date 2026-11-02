import React from 'react';
import './App.css';
import fpSnake from 'fp-snake';
import getArgs from './utils/getArgs';
import useGame from './useGame';

const HELP_ITEMS = [
  { key: '← ↑ → ↓', action: '이동' },
  { key: 'Space', action: '일시정지 / 재개' },
  { key: 'D', action: '디버그 모드 전환' },
  { key: 'S', action: '빠른 저장' },
  { key: 'L', action: '빠른 불러오기' },
  { key: 'H', action: '도움말 열기 / 닫기' },
  { key: '스와이프', action: '해당 방향으로 이동' },
  { key: '화면 탭', action: '일시정지 / 재개' },
];

const Block = ({ color }) => (
  <div
    className={`block${color !== 'grey' ? ' block--filled' : ''}`}
    style={color !== 'grey' ? { '--c': color } : undefined}
  />
);

const Blocks = ({ blocks }) =>
  blocks.map((item, index) => <Block color={item.color} key={index} />);

function App() {
  const { gameState, showHelp, isDebug, countdown, message, appRef } = useGame(fpSnake, {
    initialDebug: getArgs().debug !== undefined,
  });

  const length = fpSnake.getLength(gameState);

  if (isDebug) {
    const panels = [...fpSnake.toArray(gameState), fpSnake.join(gameState)];
    const labels = ['스네이크 사과 패널', '스네이크 뱀 패널', '스네이크 합성 패널'];
    return (
      <div className="debug-layout">
        {panels.map((panel, index) => (
          <div className="container" key={labels[index]}>
            <div className="App" role="application" aria-label={labels[index]} tabIndex={0}>
              <Blocks blocks={panel.flat()} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="score" aria-live="polite" aria-label={`길이: ${length}`}>
        길이: {length}
      </div>
      <div className="App-wrapper">
        <a href="https://github.com/afrontend/fp-snake-game" title="fp-snake-game" style={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
          <img style={{ width: 20, height: 20 }} src="https://agvim.files.wordpress.com/2015/08/github-mark-32px.png?w=685" alt="GitHub" />
        </a>
        <div ref={appRef} className="App" role="application" aria-label="스네이크 게임" tabIndex={0}>
          {countdown !== null ? <div className="status-overlay">{countdown}</div> : null}
          {gameState.paused && !showHelp ? <div className="pause-overlay">일시정지</div> : null}
          {message ? <div className="message-overlay" role="status">{message}</div> : null}
          {showHelp ? (
            <div className="help-overlay" role="dialog" aria-label="도움말">
              <table><tbody>
                {HELP_ITEMS.map(({ key, action }) => (
                  <tr key={key}><td>{key}</td><td>{action}</td></tr>
                ))}
              </tbody></table>
            </div>
          ) : null}
          <Blocks blocks={fpSnake.join(gameState).flat()} />
        </div>
      </div>
    </div>
  );
}

export default App;
