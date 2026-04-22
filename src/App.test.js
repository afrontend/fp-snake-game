import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App, { getArgs, getKeySymbol } from './App';

jest.mock('keyboard-handler', () => ({
  keyPressed: jest.fn(),
}));

jest.mock('fp-snake', () => ({
  __esModule: true,
  default: {
    init: () => ({}),
    tick: state => state,
    key: (_symbol, state) => state,
    toArray: _state => [[], []],
    join: _state => [],
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('렌더링이 정상적으로 이루어진다', () => {
    render(<App />);
    expect(document.querySelector('.container')).toBeInTheDocument();
    expect(document.querySelector('.App')).toBeInTheDocument();
  });

  it('언마운트 시 타이머를 정리한다', () => {
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    const { unmount } = render(<App />);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
