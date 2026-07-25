import { readFile } from 'node:fs/promises';

const files = ['index.html', 'src/main.js', 'src/styles.css'];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  if (!content.trim()) throw new Error(`${file} is empty`);
}

const source = await readFile('src/main.js', 'utf8');
const required = ['generateDailyEvent', 'completeEvent', 'maybeDropCollectible', 'shareLatestEvent'];
for (const token of required) {
  if (!source.includes(token)) throw new Error(`Missing ${token}`);
}
console.log('Smoke test passed: core app files and flows exist.');
