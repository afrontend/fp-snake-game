import React from 'react';
import { render, act } from '@testing-library/react';
import App from './App';
import * as keyboard from 'keyboard-handler';
import fpSnake from 'fp-snake';

function fireTouch(el, type, x, y) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  event.touches = [{ clientX: x, clientY: y }];
  event.changedTouches = [{ clientX: x, clientY: y }];
  el.dispatchEvent(event);
}

function swipe(el, x1, y1, x2, y2) {
  fireTouch(el, 'touchstart', x1, y1);
  fireTouch(el, 'touchend', x2, y2);
}

vi.mock('keyboard-handler', () => ({
  keyPressed: vi.fn(() => vi.fn()),
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
    keyboard.keyPressed.mockImplementation(cb => { triggerKey = cb; return vi.fn(); });
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

// ─── 터치/스와이프 동작 ──────────────────────────────────────────────────────

describe('터치/스와이프 동작', () => {
  function mountApp() {
    const { unmount } = render(<App />);
    const el = document.querySelector('.App');
    return { el, unmount };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    window.ontouchstart = null;
    fpSnake.key.mockClear();
  });

  afterEach(() => {
    delete window.ontouchstart;
    vi.useRealTimers();
  });

  it('오른쪽으로 스와이프하면 right 이동이 호출된다', () => {
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 50, 0); vi.advanceTimersByTime(0); });
    expect(fpSnake.key).toHaveBeenCalledWith('right', expect.anything());
  });

  it('왼쪽으로 스와이프하면 left 이동이 호출된다', () => {
    const { el } = mountApp();
    act(() => { swipe(el, 50, 0, 0, 0); vi.advanceTimersByTime(0); });
    expect(fpSnake.key).toHaveBeenCalledWith('left', expect.anything());
  });

  it('위로 스와이프하면 up 이동이 호출된다', () => {
    const { el } = mountApp();
    act(() => { swipe(el, 0, 50, 0, 0); vi.advanceTimersByTime(0); });
    expect(fpSnake.key).toHaveBeenCalledWith('up', expect.anything());
  });

  it('아래로 스와이프하면 down 이동이 호출된다', () => {
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 0, 50); vi.advanceTimersByTime(0); });
    expect(fpSnake.key).toHaveBeenCalledWith('down', expect.anything());
  });

  it('제자리 탭(움직임 10px 미만)은 space(일시정지)로 처리된다', () => {
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 2, 2); vi.advanceTimersByTime(0); });
    expect(fpSnake.key).toHaveBeenCalledWith('space', expect.anything());
  });

  it('10~30px 사이의 애매한 움직임은 무시된다', () => {
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 20, 0); vi.advanceTimersByTime(0); });
    expect(fpSnake.key).not.toHaveBeenCalled();
  });

  it('터치를 지원하지 않는 환경에서는 스와이프가 동작하지 않는다', () => {
    delete window.ontouchstart;
    const { el } = mountApp();
    act(() => { swipe(el, 0, 0, 100, 0); vi.advanceTimersByTime(0); });
    expect(fpSnake.key).not.toHaveBeenCalled();
  });

  it('언마운트 시 터치 리스너가 정리된다', () => {
    const { el, unmount } = mountApp();
    const removeSpy = vi.spyOn(el, 'removeEventListener');
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    removeSpy.mockRestore();
  });
});
