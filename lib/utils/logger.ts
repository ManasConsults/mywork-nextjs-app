const logger = {
  warn: (ctx: Record<string, unknown>, msg: string) => {
    if (process.env.NODE_ENV !== 'test') {
      process.stderr.write(JSON.stringify({ level: 'warn', ...ctx, msg }) + '\n');
    }
  },
  info: (ctx: Record<string, unknown>, msg: string) => {
    if (process.env.NODE_ENV !== 'test') {
      process.stderr.write(JSON.stringify({ level: 'info', ...ctx, msg }) + '\n');
    }
  },
};
export default logger;
