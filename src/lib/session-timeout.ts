// session-timeout.ts — idle auto-logout for the TRA officer dashboard (30 min
// default), reset on user activity.

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

let _timer: ReturnType<typeof setTimeout> | null = null;
let _onTimeout: (() => void) | null = null;
let _timeoutMs = DEFAULT_TIMEOUT_MS;

function resetTimer() {
  if (_timer) clearTimeout(_timer);
  if (!_onTimeout) return;
  _timer = setTimeout(() => {
    _onTimeout?.();
  }, _timeoutMs);
}

export function startSessionTimeout(onTimeout: () => void, timeoutMs: number = DEFAULT_TIMEOUT_MS): void {
  stopSessionTimeout();
  _onTimeout = onTimeout;
  _timeoutMs = timeoutMs;

  for (const event of EVENTS) {
    document.addEventListener(event, resetTimer, { passive: true });
  }
  resetTimer();
}

export function stopSessionTimeout(): void {
  if (_timer) {
    clearTimeout(_timer);
    _timer = null;
  }
  _onTimeout = null;
  for (const event of EVENTS) {
    document.removeEventListener(event, resetTimer);
  }
}

export function getTimeoutMs(): number {
  return _timeoutMs;
}
