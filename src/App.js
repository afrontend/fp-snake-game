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

const GAME_TICK_INTERVAL = 250;

const KEY_LIST = [
  { keyValue: SPACE, keySymbol: 'space' },
  { keyValue: LEFT,  keySymbol: 'left'  },
  { keyValue: UP,    keySymbol: 'up'    },
  { keyValue: RIGHT, keySymbol: 'right' },
  { keyValue: DOWN,  keySymbol: 'down'  },
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
    this.timer = setInterval(() => {
      this.setState(state => fpSnake.tick(state));
    }, GAME_TICK_INTERVAL);

    // setTimeout 없이 setState를 호출하면 keyPressed 이벤트 핸들러와
    // React의 배치 업데이트가 충돌할 수 있어 비동기로 처리한다.
    keyboard.keyPressed(e => {
      setTimeout(() => {
        this.setState(state => {
          const symbol = getKeySymbol(e.which);
          return symbol ? fpSnake.key(symbol, state) : state;
        });
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
