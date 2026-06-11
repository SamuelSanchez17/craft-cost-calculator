/**
 * Retorna una versión debounced de la función.
 * @param {Function} fn — función a debouncear
 * @param {number} delay — ms de espera (default 300)
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Versión cancelable de debounce.
 * Retorna { execute, cancel }
 */
export function debounceCancelable(fn, delay = 300) {
  let timer = null;
  return {
    execute(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delay);
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}