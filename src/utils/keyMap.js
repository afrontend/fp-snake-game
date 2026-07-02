const KEY_MAP = new Map([
  [32, 'space'],
  [37, 'left'],
  [38, 'up'],
  [39, 'right'],
  [40, 'down'],
  [68, 'debug'],
  [83, 'save'],
  [76, 'load'],
  [72, 'help'],
]);

export const getKeySymbol = keyValue => KEY_MAP.get(keyValue) ?? null;
