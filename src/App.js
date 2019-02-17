/*
JavaScript Snake
By Bob Hwang
https://github.com/afrontend/fp-snake-game
*/

import React, { Component } from 'react';
import * as keyboard from 'keyboard-handler';
import { CONFIG, createApplePanel, createSnakePanel, updatePanel, processKey, getWindow } from './fp-snake';
import './App.css';

// components

const createBlocks = ary => (
  ary.map(
    (item, index) => (
      <Block color={item.color} row={item.row} column={item.column} key={index}>
        {item.count}
      </Block>
    )
  )
);

const Block = props => (
  <div className="block" style={{backgroundColor: props.color}}>{props.children}</div>
);
const Blocks = props => (createBlocks(props.window));

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      applePanel: createApplePanel(),
      snakePanel: createSnakePanel()
    };

    this.state.timer = setInterval(() => {
      this.setState((state) => {
        return updatePanel({
          applePanel: state.applePanel,
          snakePanel: state.snakePanel
        });
      });
    }, CONFIG.tickTime);

    keyboard.keyPressed(e => {
      setTimeout(() => {
        this.setState((state) => {
          return processKey({
            applePanel: state.applePanel,
            snakePanel: state.snakePanel,
            key: e.which
          });
        });
      });
    });
  }

  render() {
    return (
      <div className="container">
        <div className="App">
          <Blocks window={getWindow( {
            applePanel: this.state.applePanel,
            snakePanel: this.state.snakePanel
          })} />
      </div>
    </div>
    );
  }
}

export default App;
