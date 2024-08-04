import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function updateBot() {
  const repoUrl = 'https://github.com/Burhanverse/Tunified';
  const localDir = __dirname;

  try {
    if (existsSync(`${localDir}/.git`)) {
      console.log('Pulling latest changes...');
      execSync('git pull', { cwd: localDir });
    } else {
      console.log('Cloning the repository...');
      execSync(`git clone ${repoUrl} ${localDir}`);
    }
    console.log('Update complete!');
  } catch (error) {
    console.error('Error updating bot files:', error.message);
  }
}

function updateModules() {
  try {
    console.log('Updating Node modules...');
    execSync('npm ci', { cwd: __dirname, stdio: 'inherit' });
    console.log('Modules updated!');
  } catch (error) {
    console.error('Error updating Node modules:', error.message);
  }
}

function startBot() {
  try {
    console.log('Starting bot...');
    execSync('node bot.mjs', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error starting the bot:', error.message);
  }
}

function main() {
  updateBot();
  updateModules();
  startBot();
}

main();
