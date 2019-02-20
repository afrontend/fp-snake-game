/*
JavaScript Snake
By Bob Hwang
https://github.com/afrontend/fp-snake-game
*/

import React, { Component } from 'react';
import * as keyboard from 'keyboard-handler';
import {
  initSnakeTable,
  moveSnakeTable,
  keySnakeTable,
  joinSnakeTable
} from './fp-snake';
import './App.css';

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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = initSnakeTable();

    this.state.timer = setInterval(() => {
      this.setState((state) => (moveSnakeTable(state)));
    }, 250);

    keyboard.keyPressed(e => {
      setTimeout(() => {
        this.setState((state) => (keySnakeTable(e.which, state)));
      });
    });
  }

  render() {
    return (
      <div className="container">
        <div className="App">
          <Blocks window={joinSnakeTable(this.state)} />
      </div>
    </div>
    );
  }
}

export default App;
