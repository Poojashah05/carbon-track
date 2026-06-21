const isDev = import.meta.env.MODE === 'development';

export const logger = {
  info: (...args) => {
    if (isDev) console.log(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
};
