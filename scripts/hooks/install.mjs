#!/usr/bin/env node
// install.mjs — ชี้ git ไปที่ .githooks/ (รันเองตอน npm install ผ่าน "prepare") · ไม่ใช่ git repo = ข้ามเงียบ ๆ
import { execFileSync } from 'node:child_process';
import { ROOT } from '../lib/config.mjs';

try {
  execFileSync('git', ['rev-parse', '--git-dir'], { cwd: ROOT, stdio: 'ignore' });
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: ROOT });
  console.log('OK git hooks → .githooks/ (commit-msg · pre-commit)');
} catch { /* ไม่ใช่ git repo */ }
