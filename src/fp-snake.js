import _ from 'lodash';
import fp from 'lodash/fp';

// configuration

const GLOBAL = {
  color: 'grey',
  appleColor: 'red',
  snakeColor: 'orange'
};

// panel functions

const getAry = (len, fn) => (
  _.range(len).map(() => (
    fn
    ? (
      _.isFunction(fn)
      ? fn()
      : _.cloneDeep(fn) )
    : null)
  ));

const createItem = () => ({ color: GLOBAL.color });
const getEmptyRow = (columns) => (getAry(columns, createItem()));
const createPanel = (() => {
  let savedRows = 0;
  let savedColumns = 0;
  return (rows, columns) => {
    savedRows = rows ? rows : savedRows;
    savedColumns = columns ? columns : savedColumns;
    return getAry(savedRows, getEmptyRow(savedColumns));
  };
})();

const to1DimAry = _.flattenDepth;

// check a panel

const isBlank = item => (item.color === GLOBAL.color);
const isNotBlank = item => (item.color !== GLOBAL.color);
const isOverlapItem = (apple, snake) => ((isNotBlank(apple) && isNotBlank(snake)) ? true : false);
const isOverlap = (applePanel, snakePanel) => {
  return _.some(
    _.zipWith(
      to1DimAry(applePanel),
      to1DimAry(snakePanel),
      isOverlapItem),
    fp.isEqual(true));
};
const matchKey = (akey, bkey) => (akey === bkey ? 1 : 0);

// key definition

const LEFT = 37;
const UP = 38;
const RIGHT = 39;
const DOWN = 40;

// create panel

const getNewRowColumn = (headItem, key) => ({
  row: headItem.row - matchKey(key, UP) + matchKey(key, DOWN),
  column: headItem.column - matchKey(key, LEFT) + matchKey(key, RIGHT)
});

// paint

const paint = (panel, posAry, color) => {
  const newPanel = _.cloneDeep(panel);
  posAry.forEach((pos, index) => {
    const item = _.assign(_.cloneDeep(pos), {
      index,
      color
    });
    newPanel[pos.row][pos.column] = item;
  });
  return newPanel;
};

const paintApple = panel => {
  return paint(panel, [{
      row: _.random(0, panel.length - 1),
      column: _.random(0, panel[0].length - 1)
    }], GLOBAL.appleColor);
};

const paintSnake = panel => {
  return paint(panel, [{
      row: _.random(0, panel.length - 1),
      column: _.random(0, panel[0].length - 1),
      key: 0
    }], GLOBAL.snakeColor);
};

const createApplePanel = (() => {
  let savedRows = 0;
  let savedColumns = 0;
  return (rows, columns) => {
    savedRows = rows ? rows : savedRows;
    savedColumns = columns ? columns : savedColumns;
    return paintApple(createPanel(savedRows, savedColumns));
  };
})();

const createSnakePanel = (() => {
  let savedRows = 0;
  let savedColumns = 0;
  return (rows, columns) => {
    savedRows = rows ? rows : savedRows;
    savedColumns = columns ? columns : savedColumns;
    return paintSnake(createPanel(savedRows, savedColumns));
  };
})();

// for snake

const addHeadItem = ary => {
  const snake = _.cloneDeep(ary);
  const headItem = _.cloneDeep(_.head(snake));
  const newHeadItem = _.assign(headItem, getNewRowColumn(headItem, headItem.key));
  return [newHeadItem, ...snake];
};

const removeTailItem = _.initial;

const reIndexing = ary => {
  return ary.map((item, index) => {
    item.index = index;
    return item;
  });
};

const justPaintSnake = posAry => (paint(createPanel(), posAry, GLOBAL.snakeColor));

const moveSnake = _.flow([
  to1DimAry,
  fp.filter(isNotBlank),
  fp.sortBy('index'),
  addHeadItem,
  reIndexing,
  removeTailItem,
  justPaintSnake
]);

const moveSnakeAndAddTail = _.flow([
  to1DimAry,
  fp.filter(isNotBlank),
  fp.sortBy('index'),
  addHeadItem,
  reIndexing,
  justPaintSnake
]);

const getSnake = _.flow([
  to1DimAry,
  fp.filter(isNotBlank),
]);

const addCount = ({ applePanel, snakePanel }) => {
  _.last(_.last(applePanel)).count = getSnake(snakePanel).length;
  return {
    applePanel,
    snakePanel
  };
}

const updatePanel = ({ applePanel, snakePanel }) => {
  const outOfRange = nextItemIsOutOfRange(snakePanel, getHeadItem(snakePanel).key)
  const tempSnakePanel = outOfRange ? snakePanel : moveSnake(snakePanel);
  const overlap = isOverlap(applePanel, tempSnakePanel);
  const newApplePanel = overlap ? createApplePanel() : applePanel;
  const newSnakePanel = overlap ? moveSnakeAndAddTail(snakePanel) : tempSnakePanel;
  return addCount({
    applePanel: newApplePanel,
    snakePanel: newSnakePanel
  });
};

const zipPanelItem = (apple, snake) => (isBlank(snake) ? apple : snake);
const assignPanel = ({ applePanel, snakePanel }) => {
  const columns = applePanel[0].length;
  return _.chunk(
    _.zipWith(
      to1DimAry(applePanel),
      to1DimAry(snakePanel),
      zipPanelItem)
    , columns);
};

export const getWindow = _.flow([assignPanel, to1DimAry]);

// check functions

const getHeadItem = _.flow([
  _.cloneDeep,
  to1DimAry,
  fp.filter(isNotBlank),
  fp.sortBy('index'),
  _.head
]);

const getNextItem = (snakePanel, key) => {
  const headItem = getHeadItem(snakePanel);
  const { row, column } = getNewRowColumn(headItem, key);
  return snakePanel && snakePanel[row] && snakePanel[row][column] ? snakePanel[row][column] : undefined;
};
const nextItemIsBlank = _.flow([getNextItem, isBlank]);
const nextItemIsOutOfRange = _.flow([getNextItem, _.isUndefined]);

const arrowKey = ({ applePanel, snakePanel, key }) => {
  const headItem = getHeadItem(snakePanel);
  const origKey = snakePanel[headItem.row][headItem.column].key;
  snakePanel[headItem.row][headItem.column].key = nextItemIsBlank(snakePanel, key) ? key : origKey;
  return {
    applePanel,
    snakePanel
  };
};

// key definition

const nop = (nop) => (nop);

const keyFnList = [
  { key: LEFT , fn: arrowKey },
  { key: UP   , fn: arrowKey },
  { key: RIGHT, fn: arrowKey },
  { key: DOWN , fn: arrowKey },
  { key: 0    , fn: nop }
];

const isValidKey = key => (_.some(keyFnList, (item) => (item.key === key)));
const validKey = ({ applePanel, snakePanel, key }) => (
  {
    applePanel,
    snakePanel,
    key: isValidKey(key) ? key : 0
  }
);

const storeKey = ({ applePanel, snakePanel, key }) => (
  _.find(keyFnList, (item) => (
    item.key === key
  )).fn({ applePanel, snakePanel, key })
);

export const processKey = _.flow([validKey, storeKey]);

export const initSnakeTable = (rows = 15, columns = 15) => ({
  applePanel: createApplePanel(rows, columns),
  snakePanel: createSnakePanel(rows, columns)
});

export const moveSnakeTable = (state) => (updatePanel({ applePanel: state.applePanel, snakePanel: state.snakePanel }));

export const keySnakeTable = (key, state) => (processKey({
  applePanel: state.applePanel,
  snakePanel: state.snakePanel,
  key
}));

export const joinSnakeTable = (state) => (getWindow({ applePanel: state.applePanel, snakePanel: state.snakePanel }));

export default {};
