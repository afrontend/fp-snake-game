import _ from 'lodash';
import fp from 'lodash/fp';

// configuration

export const CONFIG = {
  rows: 15,
  columns: 15,
  color: 'grey',
  appleColor: 'red',
  snakeColor: 'orange'
};

// util

const getAry = (len, fn) => (
  _.range(len).map(() => (
    fn
    ? (
      _.isFunction(fn)
      ? fn()
      : fn )
    : null)
  ));

const convert1DimAry = _.flattenDepth;
const convert2DimAry = fp.chunk(CONFIG.columns);
const matchKey = (akey, bkey) => (akey === bkey ? 1 : 0);
const isBlank = item => {
  return item && item.color === CONFIG.color ? true : false;
};
const isNotBlank = item => (item.color !== CONFIG.color);
const isOverlapItem = (apple, snake) => ((isNotBlank(apple) && isNotBlank(snake)) ? true : false);
const isOverlap = (applePanel, snakePanel) => {
  return _.some(
    _.zipWith(
      convert1DimAry(applePanel),
      convert1DimAry(snakePanel),
      isOverlapItem),
    fp.isEqual(true));
};

// key definition

const LEFT = 37;
const UP = 38;
const RIGHT = 39;
const DOWN = 40;

// create panel

const createItem = () => ({ color: CONFIG.color });
const getEmptyRow = () => (getAry(CONFIG.columns, createItem));
const createPanel = () => (getAry(CONFIG.rows, getEmptyRow));

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
    }], CONFIG.appleColor);
};

const paintSnake = panel => {
  return paint(panel, [{
      row: _.random(0, panel.length - 1),
      column: _.random(0, panel[0].length - 1),
      key: 0
    }], CONFIG.snakeColor);
};

export const createApplePanel = _.flow([createPanel, paintApple]);
export const createSnakePanel = _.flow([createPanel, paintSnake]);

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

const justPaintSnake = posAry => (paint(createPanel(), posAry, CONFIG.snakeColor));

const moveSnake = _.flow([
  convert1DimAry,
  fp.filter(isNotBlank),
  fp.sortBy('index'),
  addHeadItem,
  reIndexing,
  removeTailItem,
  justPaintSnake
]);

const moveSnakeAndAddTail = _.flow([
  convert1DimAry,
  fp.filter(isNotBlank),
  fp.sortBy('index'),
  addHeadItem,
  reIndexing,
  justPaintSnake
]);

const getSnake = _.flow([
  convert1DimAry,
  fp.filter(isNotBlank),
]);

const addCount = ({ applePanel, snakePanel }) => {
  _.last(_.last(applePanel)).count = getSnake(snakePanel).length;
  return {
    applePanel,
    snakePanel
  };
}

export const updatePanel = ({ applePanel, snakePanel }) => {
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
  return convert2DimAry(
    _.zipWith(
      convert1DimAry(applePanel),
      convert1DimAry(snakePanel),
      zipPanelItem)
  );
};

export const getWindow = _.flow([assignPanel, convert1DimAry]);

// check functions

const getHeadItem = _.flow([
  _.cloneDeep,
  convert1DimAry,
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

export default {};
