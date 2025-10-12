// src/doc.ts
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

writeFileSync('./openapi.json', JSON.stringify(spec, null, 2));
console.log('✅ openapi.json exported!');
