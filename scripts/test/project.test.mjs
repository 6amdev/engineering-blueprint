// เทสของ new-project + upgrade-project: คัดลอก blueprint ไป folder ชั่วคราว สร้างโปรเจกต์ แล้วขึ้นเวอร์ชัน
//   npm run project:test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'proj-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const [bp, pj] = [path.join(root, 'bp'), path.join(root, 'demo')];
  const git = (cwd, ...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...a], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  for (const f of git(SRC, 'ls-files', '-co', '--exclude-standard').split('\n')) if (fs.existsSync(path.join(SRC, f))) { fs.mkdirSync(path.dirname(path.join(bp, f)), { recursive: true }); fs.copyFileSync(path.join(SRC, f), path.join(bp, f)); }
  git(bp, 'init', '-q', '-b', 'main'); git(bp, 'add', '-A'); git(bp, 'update-index', '--chmod=+x', '.githooks/commit-msg', '.githooks/pre-commit');
  git(bp, 'commit', '-q', '-m', 'chore: base');
  // new-project commit ด้วย identity ของเครื่อง · ในเทสส่งผ่าน env
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com' };
  const run = (script, ...a) => spawnSync(process.execPath, [path.join(bp, 'scripts', script), ...a], { cwd: bp, encoding: 'utf8', env });
  const made = run('new-project.mjs', pj);
  assert.equal(made.status, 0, made.stderr);
  const at = (dir) => ({
    dir, read: (f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n'), has: (f) => fs.existsSync(path.join(dir, f)),
    edit: (f, fn) => { const p = path.join(dir, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, fn(fs.existsSync(p) ? fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : '')); },
    commit: () => { git(dir, 'add', '-A'); git(dir, '-c', 'core.hooksPath=', 'commit', '-q', '-m', 'chore: x'); return git(dir, 'rev-parse', 'HEAD'); },
    git: (...a) => git(dir, ...a),
  });
  return { run, bp: at(bp), pj: at(pj), up: (...a) => run('upgrade-project.mjs', pj, ...a) };
}

test('โปรเจกต์ใหม่: ไม่มีไฟล์ของตัวหลัก · hook มีสิทธิ์รัน · จดเวอร์ชัน · ลิงก์ไฟล์ใน AGENTS ไม่หัก', (t) => {
  const { pj, bp } = setup(t);
  for (const f of ['scripts/new-project.mjs', 'scripts/upgrade-project.mjs', 'scripts/lib/project-files.mjs', 'scripts/test/project.test.mjs', 'CHANGELOG.md', 'README.en.md', 'docs/blueprint.md', 'LICENSE']) assert.ok(!pj.has(f), f);
  for (const f of ['LICENSE-blueprint', 'docs/stack-decisions.md', 'memory/MEMORY.md', 'scripts/gate.mjs']) assert.ok(pj.has(f), f);
  assert.match(pj.git('ls-files', '-s', '.githooks'), /^100755.*\n100755/);
  const meta = JSON.parse(pj.read('.blueprint.json'));
  assert.equal(meta.blueprint_commit, bp.git('rev-parse', 'HEAD'));
  const pkg = JSON.parse(pj.read('package.json'));
  assert.equal(pkg.name, 'demo'); assert.equal(pkg.license, undefined); assert.equal(pkg.scripts['project:test'], undefined);
  assert.doesNotMatch(pj.read('AGENTS.md'), /blueprint-only/);
  assert.equal(pj.git('status', '--porcelain'), '');
});

test('upgrade: ไม่แก้ = แทนที่ · แก้คนละจุด = รวม · ลบไว้ = คงลบ · เพิ่ม/เลิกใช้ · ไฟล์ของโปรเจกต์ไม่ถูกแตะ', (t) => {
  const { bp, pj, up } = setup(t);
  pj.edit('docs/gates.md', (s) => `${s}\nโน้ตของโปรเจกต์\n`);
  pj.edit('package.json', (s) => { const p = JSON.parse(s); p.scripts.dev = 'node server.mjs'; p.dependencies = { fastify: '5.0.0' }; return JSON.stringify(p, null, 2); });
  pj.edit('docs/HANDOFF.md', () => 'ของโปรเจกต์\n'); pj.edit('src/a.mjs', () => 'export {};\n');
  fs.rmSync(path.join(pj.dir, 'templates/retro.md')); pj.commit();

  bp.edit('docs/gates.md', (s) => s.replace('\n', '\nบรรทัดใหม่จาก blueprint\n')); bp.edit('docs/uat.md', (s) => `${s}\nใหม่\n`); bp.edit('docs/HANDOFF.md', (s) => `${s}\nของตัวหลัก\n`);
  bp.edit('package.json', (s) => { const p = JSON.parse(s); p.scripts.newtool = 'node x'; return JSON.stringify(p, null, 2); });
  bp.edit('templates/retro.md', (s) => `${s}\nx\n`); bp.edit('docs/new.md', () => 'ใหม่\n'); fs.rmSync(path.join(bp.dir, 'templates/postmortem.md')); bp.edit('VERSION', () => '9.9.9\n');
  const head = bp.commit();

  const dry = up();
  assert.equal(dry.status, 0, dry.stdout + dry.stderr); assert.equal(pj.git('status', '--porcelain'), '');
  const r = up('--apply');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(pj.read('docs/gates.md'), /บรรทัดใหม่จาก blueprint/); assert.match(pj.read('docs/gates.md'), /โน้ตของโปรเจกต์/);
  assert.match(pj.read('docs/uat.md'), /\nใหม่\n$/); assert.equal(pj.read('docs/new.md'), 'ใหม่\n'); assert.equal(pj.read('docs/HANDOFF.md'), 'ของโปรเจกต์\n');
  assert.ok(!pj.has('templates/retro.md')); assert.ok(!pj.has('templates/postmortem.md')); assert.ok(pj.has('src/a.mjs'));
  const pkg = JSON.parse(pj.read('package.json'));
  assert.deepEqual([pkg.name, pkg.scripts.dev, pkg.scripts.newtool, pkg.dependencies.fastify], ['demo', 'node server.mjs', 'node x', '5.0.0']);
  const meta = JSON.parse(pj.read('.blueprint.json'));
  assert.deepEqual([meta.blueprint_version, meta.blueprint_commit, meta.conflicts], ['9.9.9', head, undefined]);
  pj.commit();
  const again = up('--apply');
  assert.equal(again.status, 0); assert.match(again.stdout, /ไม่มีไฟล์ต้องเปลี่ยน/);
});

test('upgrade: แก้จุดเดียวกัน = ไม่แตะไฟล์โปรเจกต์ วางของใหม่ไว้ให้รวม และไม่ให้อัปซ้ำจนรวมเสร็จ', (t) => {
  const { bp, pj, up } = setup(t);
  pj.edit('docs/uat.md', (s) => s.replace(/^.*\n/, '# ของโปรเจกต์\n')); pj.commit();
  bp.edit('docs/uat.md', (s) => s.replace(/^.*\n/, '# ของตัวหลัก\n')); bp.commit();
  const r = up('--apply');
  assert.equal(r.status, 1, r.stdout); assert.match(r.stdout, /ต้องรวมเอง: docs\/uat\.md/);
  assert.match(pj.read('docs/uat.md'), /^# ของโปรเจกต์/); assert.match(pj.read('.blueprint-upgrade/docs/uat.md'), /^# ของตัวหลัก/);
  assert.doesNotMatch(pj.git('status', '--porcelain', '-uall'), /blueprint-upgrade/);
  pj.commit();
  assert.equal(up('--apply').status, 2);
});

test('upgrade: ปฏิเสธเมื่อยังไม่พร้อม · คืนสิทธิ์รันให้ hook ของโปรเจกต์เก่า', (t) => {
  const { bp, pj, up, run } = setup(t);
  assert.equal(run('upgrade-project.mjs').status, 2); assert.equal(up('--nope').status, 2); assert.equal(up('--base', 'deadbeef').status, 2);
  pj.git('update-index', '--chmod=-x', '.githooks/pre-commit'); pj.git('-c', 'core.hooksPath=', 'commit', '-q', '-m', 'chore: old');
  pj.edit('x.txt', () => 'x'); assert.equal(up('--apply').status, 2); pj.commit();
  bp.edit('docs/uat.md', (s) => `${s}\nใหม่\n`); assert.equal(up().status, 2); bp.commit();
  assert.equal(up('--apply').status, 0);
  assert.match(pj.git('ls-files', '-s', '.githooks'), /^100755.*\n100755/);
});

test('โปรเจกต์ใหม่ได้ CI/CD พร้อมใช้: workflow ทั้งสอง · deploy.sh รันได้ · AGENTS บอกวิธีใช้', (t) => {
  const { pj } = setup(t);
  for (const f of ['.github/workflows/ci.yml', '.github/workflows/deploy.yml', 'scripts/deploy.sh']) assert.ok(pj.has(f), f);
  assert.match(pj.git('ls-files', '-s', 'scripts/deploy.sh'), /^100755/);
  assert.match(pj.read('.github/workflows/ci.yml'), /npm run build --if-present/);
  assert.match(pj.read('AGENTS.md'), /Actions → deploy/);
});

// ขึ้น/ถอยจริงด้วย ssh rsync curl ปลอมที่ทำในเครื่อง · ต้องมี symlink และ mv -T จึงรันบน Linux/macOS (CI) เท่านั้น
test('deploy.sh: ขึ้น · เก็บชุดก่อนหน้า · เช็คไม่ผ่านถอยเอง · rollback', { skip: process.platform === 'win32' && !process.env.MSYS?.includes('winsymlinks:native') && 'ต้องใช้ symlink จริง (CI · หรือ Windows ตั้ง MSYS=winsymlinks:nativestrict)' }, (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bin = path.join(dir, 'bin'); const srv = path.join(dir, 'srv'); fs.mkdirSync(bin); fs.mkdirSync(srv);
  const fake = (n, body) => fs.writeFileSync(path.join(bin, n), `#!/usr/bin/env bash\n${body}\n`, { mode: 0o755 });
  fake('ssh', 'while [ $# -gt 0 ]; do case $1 in -i|-o) shift 2;; *) shift; break;; esac; done; exec bash -c "$*"');
  fake('rsync', 'src=${@: -2:1}; dst=${@: -1}; dst=${dst#*:}; mkdir -p "$dst" && cp -a "$src/." "$dst"');
  fake('curl', 'exit ${FAKE_HEALTH:-0}'); fake('sleep', ':');
  const run = (args, health = 0, build = 'v1') => {
    fs.rmSync(path.join(dir, 'dist'), { recursive: true, force: true }); fs.mkdirSync(path.join(dir, 'dist')); fs.writeFileSync(path.join(dir, 'dist/index.html'), build);
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.toUpperCase() !== 'PATH')); // Windows ใช้ชื่อ Path
    const posix = (p) => p.replace(/^([A-Za-z]):/, (m, l) => `/${l.toLowerCase()}`).replaceAll('\\', '/');
    return spawnSync('bash', [path.join(SRC, 'templates/deploy.sh'), ...args], { cwd: dir, encoding: 'utf8', env: { ...env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, FAKE_HEALTH: String(health), DEPLOY_HOST: 'h', DEPLOY_USER: 'u', DEPLOY_SSH_KEY: 'k', DEPLOY_KNOWN_HOSTS: 'k', DEPLOY_PATH: posix(srv), HEALTH_URL: 'http://x' } });
  };
  const live = () => fs.readFileSync(path.join(srv, 'current/index.html'), 'utf8');
  const ok = (r) => assert.equal(r.status, 0, r.stdout + r.stderr);
  ok(run(['deploy', 'uat', 'aaaaaaa'], 0, 'v1')); assert.equal(live(), 'v1');
  ok(run(['deploy', 'uat', 'bbbbbbb'], 0, 'v2')); assert.equal(live(), 'v2');
  assert.equal(fs.readFileSync(path.join(srv, 'previous'), 'utf8').trim(), 'aaaaaaa');
  const bad = run(['deploy', 'uat', 'ccccccc'], 7, 'v3'); assert.equal(bad.status, 1); assert.match(bad.stdout, /ถอยกลับ bbbbbbb/); assert.equal(live(), 'v2');
  ok(run(['rollback', 'uat'])); assert.equal(live(), 'v1');
  ok(run(['rollback', 'uat'])); assert.equal(live(), 'v2'); // ถอยซ้ำ = กลับไปชุดที่เพิ่งถอยออกมา
  assert.equal(run(['deploy', 'uat', 'not-a-sha']).status, 2);
});
