let callbacks = null;
let activeCount = 0;

export function registerLoaderCallbacks(cb) {
  callbacks = cb;
}

export function startLoading() {
  activeCount += 1;
  if (activeCount === 1 && callbacks?.start) {
    callbacks.start();
  }
}

export function stopLoading() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0 && callbacks?.stop) {
    callbacks.stop();
  }
}
