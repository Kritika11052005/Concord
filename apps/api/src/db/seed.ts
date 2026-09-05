import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Delegate to the comprehensive demo traffic seeding script in scripts/
// Using variable URL so tsc doesn't pull external files into rootDir
const scriptPath = path.resolve(__dirname, '../../../../scripts/seed-demo-receipts.ts');
const scriptUrl = pathToFileURL(scriptPath).href;

await import(scriptUrl);
