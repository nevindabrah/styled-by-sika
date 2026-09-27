// Lets `node --experimental-strip-types` import the app's lib files, which use extensionless relative imports.
import { register } from 'node:module';
register(new URL('data:text/javascript,' + encodeURIComponent(`
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\\.[a-z]+$/i.test(specifier) && context.parentURL) {
    const base = new URL(specifier, context.parentURL);
    for (const ext of ['.ts', '.tsx', '.mjs', '.js']) if (existsSync(fileURLToPath(base.href + ext))) return next(base.href + ext, context);
  }
  return next(specifier, context);
}`)));
