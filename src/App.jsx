import React, { Component } from 'react';
import * as keyboard from 'keyboard-handler';
import _ from 'lodash';
import './App.css';
import fpSnake from 'fp-snake';

const SPACE = 32;
const LEFT = 37;
const UP = 38;
const RIGHT = 39;
const DOWN = 40;
const S_KEY = 83;
const L_KEY = 76;
const H_KEY = 72;

const GAME_TICK_INTERVAL = 250;

const KEY_LIST = [
  { keyValue: SPACE, keySymbol: 'space' },
  { keyValue: LEFT,  keySymbol: 'left'  },
  { keyValue: UP,    keySymbol: 'up'    },
  { keyValue: RIGHT, keySymbol: 'right' },
  { keyValue: DOWN,  keySymbol: 'down'  },
  { keyValue: S_KEY, keySymbol: 'save'  },
  { keyValue: L_KEY, keySymbol: 'load'  },
  { keyValue: H_KEY, keySymbol: 'help'  },
];

const HELP_ITEMS = [
  { key: '← ↑ → ↓', action: '이동' },
  { key: 'Space',    action: '일시정지 / 재개' },
  { key: 'S',        action: '상태 저장' },
  { key: 'L',        action: '상태 불러오기' },
  { key: 'H',        action: '도움말 닫기' },
];

export const getKeySymbol = (keyValue) => {
  const found = _.find(KEY_LIST, key => key.keyValue === keyValue);
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

const Blocks = ({ items }) =>
  items.map((item, index) => (
    <Block color={item.color} key={index}>
      {item.count}
    </Block>
  ));

class App extends Component {
  constructor(props) {
    super(props);
    this.state = fpSnake.init();
    this.savedState = null;
    this.showHelp = false;
    this.timer = setInterval(() => {
      if (!this.showHelp) {
        this.setState(state => fpSnake.tick(state));
      }
    }, GAME_TICK_INTERVAL);

    // setTimeout 없이 setState를 호출하면 keyPressed 이벤트 핸들러와
    // React의 배치 업데이트가 충돌할 수 있어 비동기로 처리한다.
    keyboard.keyPressed(e => {
      const symbol = getKeySymbol(e.which);
      if (symbol === 'help') {
        this.showHelp = !this.showHelp;
        this.forceUpdate();
        return;
      }
      setTimeout(() => {
        if (symbol === 'save') {
          this.savedState = structuredClone(this.state);
        } else if (symbol === 'load') {
          if (this.savedState) {
            this.setState(structuredClone(this.savedState));
          }
        } else {
          this.setState(state => {
            return symbol ? fpSnake.key(symbol, state) : state;
          });
        }
      });
    });
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  renderDebugMode() {
    const [layer0, layer1] = fpSnake.toArray(this.state);
    const joined = fpSnake.join(this.state);
    return (
      <div style={{ columns: '400px 3' }}>
        <div className="container">
          <div className="App">
            <Blocks items={_.flatten(layer0)} />
          </div>
        </div>
        <div className="container">
          <div className="App">
            <Blocks items={_.flatten(layer1)} />
          </div>
        </div>
        <div className="container">
          <div className="App">
            <Blocks items={_.flatten(joined)} />
          </div>
        </div>
      </div>
    );
  }

  renderGame() {
    return (
      <div className="container">
        <div className="App">
          {this.showHelp && (
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
          <Blocks items={_.flatten(fpSnake.join(this.state))} />
        </div>
      </div>
    );
  }

  render() {
    return args.debug ? this.renderDebugMode() : this.renderGame();
  }
}

export default App;
