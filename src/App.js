/*
JavaScript Snake
By Bob Hwang
https://github.com/afrontend/fp-snake-game
*/

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

const createBlocks = ary => (
  ary.map(
    (item, index) => (
      <Block color={item.color} row={item.row} column={item.column} key={index}>
        {item.count}
      </Block>
    )
  )
);

const Block = props => (<div className="block" style={{backgroundColor: props.color}}>{props.children}</div>);
const Blocks = props => (createBlocks(props.window));

const keyList = [
  { keyValue: SPACE, keySymbol: 'space'},
  { keyValue: LEFT, keySymbol: 'left' },
  { keyValue: UP, keySymbol: 'up' },
  { keyValue: RIGHT, keySymbol: 'right' },
  { keyValue: DOWN, keySymbol: 'down' }
];

const getKeySymbol = (keyValue) => {
  const found = _.find(keyList, key => (key.keyValue === keyValue));
  return found ? found.keySymbol : null;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = fpSnake.init();

    this.state.timer = setInterval(() => {
      this.setState(state => fpSnake.tick(state));
    }, 250);

    keyboard.keyPressed(e => {
      setTimeout(() => {
        this.setState(state => {
          const symbol = getKeySymbol(e.which);
          return symbol ? fpSnake.key(symbol, state) : state;
        });
      });
    });
  }

  render() {
    return (
      <div className="container">
        <div className="App">
          <Blocks window={_.flatten(fpSnake.join(this.state))} />
      </div>
    </div>
    );
  }
}

export default App;
