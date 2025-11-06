/**
 * Logger utility for pretty CLI output
 */

export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

export const logger = {
  info: (message: string) => {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
  },

  success: (message: string) => {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  },

  error: (message: string) => {
    console.error(`${colors.red}✗${colors.reset} ${message}`);
  },

  warn: (message: string) => {
    console.warn(`${colors.yellow}⚠${colors.reset} ${message}`);
  },

  step: (message: string) => {
    console.log(`${colors.cyan}▸${colors.reset} ${message}`);
  },

  header: (message: string) => {
    console.log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
  },

  dim: (message: string) => {
    console.log(`${colors.dim}${message}${colors.reset}`);
  },

  newline: () => {
    console.log('');
  },

  spin: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,

    start: (message: string) => {
      let i = 0;
      const handle = setInterval(() => {
        process.stdout.write(`\r${colors.cyan}${logger.spin.frames[i]}${colors.reset} ${message}`);
        i = (i + 1) % logger.spin.frames.length;
      }, logger.spin.interval);

      return {
        stop: (finalMessage?: string) => {
          clearInterval(handle);
          if (finalMessage) {
            process.stdout.write(`\r${colors.green}✓${colors.reset} ${finalMessage}\n`);
          } else {
            process.stdout.write('\r\x1b[K'); // Clear line
          }
        },
        fail: (errorMessage: string) => {
          clearInterval(handle);
          process.stdout.write(`\r${colors.red}✗${colors.reset} ${errorMessage}\n`);
        },
      };
    },
  },
};
