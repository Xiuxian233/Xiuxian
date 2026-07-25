import { readFile } from 'node:fs/promises';

const files = ['index.html', 'src/main.js', 'src/styles.css'];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  if (!content.trim()) throw new Error(`${file} is empty`);
}

const html = await readFile('index.html', 'utf8');
if (!html.includes('<link rel="stylesheet" href="/src/styles.css" />')) {
  throw new Error('index.html must link styles.css directly for static serving');
}

const source = await readFile('src/main.js', 'utf8');
if (source.includes("import './styles.css'")) {
  throw new Error('src/main.js must not import CSS when served without a bundler');
}
const required = ['generateDailyEvent', 'completeEvent', 'maybeDropCollectible', 'shareLatestEvent'];
for (const token of required) {
  if (!source.includes(token)) throw new Error(`Missing ${token}`);
}
console.log('Smoke test passed: core app files and flows exist.');
