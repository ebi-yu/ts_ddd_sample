/*
 * openapi.jsonを生成するスクリプト
 */
import { writeFileSync } from 'fs';
import app from 'modules/index.ts';
import packageJson from '../package.json' with { type: 'json' };

const spec = app.getOpenAPI31Document(
  {
    openapi: '3.1.0',
    info: {
      title: packageJson.name,
      version: packageJson.version,
    },
  },
  { unionPreferredType: 'oneOf' },
);

const normalizePathTemplate = (path: string): string => path.replace(/:(\w+)/g, '{$1}');

const normalizedPaths = Object.fromEntries(
  Object.entries(spec.paths ?? {}).map(([path, definition]) => [
    normalizePathTemplate(path),
    definition,
  ]),
);

const normalizedSpec = {
  ...spec,
  paths: normalizedPaths,
};

writeFileSync('./openapi.json', JSON.stringify(normalizedSpec, null, 2));
console.log('✅ openapi.json exported!');
