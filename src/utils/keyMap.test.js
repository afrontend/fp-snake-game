import { getKeySymbol } from './keyMap';

describe('getKeySymbol - 키 매핑', () => {
  it('Space(32)는 space로 매핑된다', () => {
    expect(getKeySymbol(32)).toBe('space');
  });

  it('화살표 키가 올바르게 매핑된다', () => {
    expect(getKeySymbol(37)).toBe('left');
    expect(getKeySymbol(38)).toBe('up');
    expect(getKeySymbol(39)).toBe('right');
    expect(getKeySymbol(40)).toBe('down');
  });

  it('S키(83)는 save로 매핑된다', () => {
    expect(getKeySymbol(83)).toBe('save');
  });

  it('L키(76)는 load로 매핑된다', () => {
    expect(getKeySymbol(76)).toBe('load');
  });

  it('H키(72)는 help로 매핑된다', () => {
    expect(getKeySymbol(72)).toBe('help');
  });

  it('매핑되지 않은 키는 null을 반환한다', () => {
    expect(getKeySymbol(999)).toBeNull();
  });
});
