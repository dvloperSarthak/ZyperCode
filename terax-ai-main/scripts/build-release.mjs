#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

console.log('🚀 ZyperCode Production Release Builder');

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = pkg.version;
console.log(`📦 Packaging ZyperCode v${version}...`);

// Step 1: Build CLI binary
console.log('\n[1/3] 🔨 Building CLI release binary...');
const cliBuild = spawnSync('pnpm', ['build:cli'], { stdio: 'inherit', shell: true });
if (cliBuild.status !== 0) {
  console.error('❌ CLI build failed.');
  process.exit(cliBuild.status ?? 1);
}

// Step 2: Build frontend bundle
console.log('\n[2/3] 🌐 Building frontend assets...');
const webBuild = spawnSync('pnpm', ['build'], { stdio: 'inherit', shell: true });
if (webBuild.status !== 0) {
  console.error('❌ Frontend build failed.');
  process.exit(webBuild.status ?? 1);
}

// Step 3: Package with Tauri & generate updater signatures
console.log('\n[3/3] ⚙️ Packaging application with Tauri...');
const hasSignKey = Boolean(process.env.TAURI_SIGNING_PRIVATE_KEY);

if (hasSignKey) {
  console.log('🔐 TAURI_SIGNING_PRIVATE_KEY detected in environment.');
  console.log('   Generating cryptographic signatures and latest.json for GitHub Releases auto-updates.');
} else {
  console.log('ℹ️ TAURI_SIGNING_PRIVATE_KEY not set.');
  console.log('   Building release installer without updater signatures.');
  console.log('   To enable auto-update signing, set TAURI_SIGNING_PRIVATE_KEY or generate one with:');
  console.log('   pnpm tauri signer generate -w ./zypercode.key\n');
}

const tauriArgs = ['tauri', 'build', '--target', 'x86_64-pc-windows-gnu'];
if (hasSignKey) {
  tauriArgs.push('--config', 'bundle.createUpdaterArtifacts=true');
}

const tauriBuild = spawnSync('pnpm', tauriArgs, { stdio: 'inherit', shell: true });
if (tauriBuild.status !== 0) {
  console.error('❌ Tauri packaging failed.');
  process.exit(tauriBuild.status ?? 1);
}

console.log(`\n🎉 ZyperCode v${version} successfully built and packaged!`);
