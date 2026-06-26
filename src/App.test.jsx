import React from 'react';
import { render, act } from '@testing-library/react';
import App, { getArgs, getKeySymbol } from './App';
import * as keyboard from 'keyboard-handler';
import fpSnake from 'fp-snake';

vi.mock('keyboard-handler', () => ({
  keyPressed: vi.fn(),
}));

vi.mock('fp-snake', () => ({
  default: {
    init: vi.fn(() => ({})),
    tick: vi.fn(s => s),
    key: vi.fn((_symbol, s) => s),
    toArray: vi.fn(() => [[], []]),
    join: vi.fn(() => []),
  },
}));

// ─── getArgs ────────────────────────────────────────────────────────────────

describe('getArgs', () => {
  it('빈 문자열이면 빈 객체를 반환한다', () => {
    expect(getArgs('')).toEqual({});
  });

  it('? 만 있으면 빈 객체를 반환한다', () => {
    expect(getArgs('?')).toEqual({});
  });

  it('단일 파라미터를 파싱한다', () => {
    expect(getArgs('?debug=true')).toEqual({ debug: 'true' });
  });

  it('복수 파라미터를 파싱한다', () => {
    expect(getArgs('?debug=true&speed=5')).toEqual({ debug: 'true', speed: '5' });
  });
});

// ─── getKeySymbol ────────────────────────────────────────────────────────────

describe('getKeySymbol', () => {
  it.each([
    [32, 'space'],
    [37, 'left'],
    [38, 'up'],
    [39, 'right'],
    [40, 'down'],
    [83, 'save'],
    [76, 'load'],
    [72, 'help'],
  ])('키코드 %i는 %s를 반환한다', (keyCode, symbol) => {
    expect(getKeySymbol(keyCode)).toBe(symbol);
  });

  it('알 수 없는 키코드는 null을 반환한다', () => {
    expect(getKeySymbol(65)).toBeNull();
    expect(getKeySymbol(0)).toBeNull();
  });
});

// ─── App ─────────────────────────────────────────────────────────────────────

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('렌더링이 정상적으로 이루어진다', () => {
    render(<App />);
    expect(document.querySelector('.container')).toBeInTheDocument();
    expect(document.querySelector('.App')).toBeInTheDocument();
  });

  it('언마운트 시 타이머를 정리한다', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const { unmount } = render(<App />);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});

// ─── 키보드 동작 ──────────────────────────────────────────────────────────────

describe('키보드 동작', () => {
  let triggerKey;

  beforeEach(() => {
    vi.useFakeTimers();
    keyboard.keyPressed.mockImplementation(cb => { triggerKey = cb; });
  });

  afterEach(() => {
    vi.useRealTimers();
    keyboard.keyPressed.mockReset();
  });

  it('h 키를 누르면 도움말 오버레이가 표시된다', () => {
    render(<App />);
    expect(document.querySelector('.help-overlay')).not.toBeInTheDocument();
    act(() => triggerKey({ which: 72 }));
    expect(document.querySelector('.help-overlay')).toBeInTheDocument();
  });

  it('h 키를 두 번 누르면 도움말이 닫힌다', () => {
    render(<App />);
    act(() => { triggerKey({ which: 72 }); triggerKey({ which: 72 }); });
    expect(document.querySelector('.help-overlay')).not.toBeInTheDocument();
  });

  it('도움말이 열려 있는 동안 게임 tick이 실행되지 않는다', () => {
    const tickSpy = vi.spyOn(fpSnake, 'tick');
    render(<App />);
    act(() => triggerKey({ which: 72 }));
    tickSpy.mockClear();
    act(() => vi.advanceTimersByTime(1000));
    expect(tickSpy).not.toHaveBeenCalled();
    tickSpy.mockRestore();
  });

  it('저장 없이 l 키를 눌러도 오류가 없다', () => {
    render(<App />);
    expect(() => act(() => { triggerKey({ which: 76 }); vi.advanceTimersByTime(0); })).not.toThrow();
  });

  it('s 키로 저장하고 l 키로 불러올 수 있다', () => {
    render(<App />);
    act(() => { triggerKey({ which: 83 }); vi.advanceTimersByTime(0); });
    act(() => { triggerKey({ which: 76 }); vi.advanceTimersByTime(0); });
    expect(document.querySelector('.App')).toBeInTheDocument();
  });
});
