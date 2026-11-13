// GNC Terminal - start helper that needs only node.exe (no unsigned .exe, no VBScript, no PowerShell at start).
//
//   node launcher\gnc.mjs                 start the hidden server if needed, then open the app window
//   node launcher\gnc.mjs --background    start the hidden server if needed, no window (used by "start with Windows")
//   node launcher\gnc.mjs --stop          stop the hidden server cleanly (store is saved first)
//   node launcher\gnc.mjs --setup         make the desktop / Start menu icon ("GNC Terminal", goat icon)
//   node launcher\gnc.mjs --autostart on|off
//   node launcher\gnc.mjs --diagnose      write a report about this PC (Node, ports, Windows security) and open it
//   node launcher\gnc.mjs --keeper        internal: hidden keeper that runs server.mjs and restarts it after a crash
//
// Log:    %LOCALAPPDATA%\GNC Terminal\launcher.log
// Report: %LOCALAPPDATA%\GNC Terminal\GNC-Terminal-report.txt   (opened in Notepad on failure; stays open until closed)
// config.json is only read for "port"; nothing else from it is ever logged.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeLnk } from './lnk.mjs';

const LAUNCHER_VERSION = 'node-launcher 1.4 (2026-11-08)';
const WIN = process.platform === 'win32';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const SELF = fileURLToPath(import.meta.url);
// a second copy on another port (e.g. the Deluxe version next to the old one) keeps its own state folder, so the two never stop each other
const PORT = readPort();
const STATE_BASE = WIN ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'GNC Terminal') : path.join(os.homedir(), '.gnc-terminal');
const STATE = process.env.GNC_STATE_DIR || (PORT === 8765 ? STATE_BASE : path.join(STATE_BASE, 'port-' + PORT));
const LOG = path.join(STATE, 'launcher.log');
const REPORT = path.join(STATE, 'GNC-Terminal-report.txt');
const DIAG = path.join(STATE, 'GNC-Terminal-diagnose.txt');
const STOP_FLAG = path.join(STATE, 'stop.flag');
const KEEPER_PID = path.join(STATE, 'keeper.pid');
const SERVER_PID = path.join(STATE, 'server.pid');
const KEEPER_FATAL = path.join(STATE, 'keeper-fatal.txt');
const CONSOLE_LOG = path.join(APP, 'data', 'console.log');
const SHORTCUT_NAME = PORT === 8765 ? 'GNC Terminal.lnk' : (/Deluxe/.test((() => { try { return fs.readFileSync(path.join(APP, 'public', 'index.html'), 'utf8').match(/id="app-ver"[^>]*>([^<]*)</)[1]; } catch (e) { return ''; } })()) ? 'GNC Terminal Deluxe.lnk' : `GNC Terminal (${PORT}).lnk`);

try { fs.mkdirSync(STATE, { recursive: true }); } catch (e) { }

// ---------- small helpers ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
function log(...a) {
  const line = `${new Date().toISOString()} [${process.pid} ${mode()}] ${a.join(' ')}`;
  try { if (fs.existsSync(LOG) && fs.statSync(LOG).size > 1_000_000) fs.renameSync(LOG, LOG + '.old'); } catch (e) { }
  try { fs.appendFileSync(LOG, line + '\n'); } catch (e) { }
  if (process.stdout.isTTY) console.log(line);
}
function mode() { const a = process.argv.slice(2).find(x => x.startsWith('--')); return a ? a.slice(2) : 'open'; }
function readPort() {
  if (process.env.GNC_PORT && +process.env.GNC_PORT > 0) return +process.env.GNC_PORT;
  try { const p = JSON.parse(fs.readFileSync(path.join(APP, 'config.json'), 'utf8')).port; if (+p > 0) return +p; } catch (e) { }
  return 8765;
}
const URL_APP = `http://localhost:${PORT}/`;
function alive(pid) { if (!pid) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } }
function readPid(f) { try { return +fs.readFileSync(f, 'utf8').trim() || 0; } catch (e) { return 0; } }
function rm(f) { try { fs.unlinkSync(f); } catch (e) { } }
function tail(f, n = 40) { try { const t = fs.readFileSync(f, 'utf8').split(/\r?\n/); return t.slice(-n - 1).join('\n'); } catch (e) { return `(${path.basename(f)} not found)`; } }
function sameDir(a, b) { if (!a || !b) return false; const n = p => path.resolve(p).replace(/[\\/]+$/, ''); return WIN ? n(a).toLowerCase() === n(b).toLowerCase() : n(a) === n(b); }

// GET /api/version -> { page, dir, node, port, uptimeSec } or null
function probe(timeout = 2000) {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port: PORT, path: '/api/version', timeout }, res => {
      let b = ''; res.setEncoding('utf8'); res.on('data', d => b += d);
      res.on('end', () => { try { const j = JSON.parse(b); resolve(j && j.dir ? j : null); } catch (e) { resolve(null); } });
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
  });
}
// true if anything at all accepts connections on the port
function portTaken() {
  return new Promise(resolve => {
    const s = net.connect({ host: '127.0.0.1', port: PORT }); s.setTimeout(1500);
    s.on('connect', () => { s.destroy(); resolve(true); }); s.on('timeout', () => { s.destroy(); resolve(false); }); s.on('error', () => resolve(false));
  });
}
// Windows: PID that listens on the port (netstat), else 0
function listenerPid() {
  if (!WIN) return 0;
  const r = spawnSync('netstat.exe', ['-ano', '-p', 'tcp'], { encoding: 'utf8', windowsHide: true });
  for (const line of (r.stdout || '').split(/\r?\n/)) {
    const c = line.trim().split(/\s+/);
    if (c.length >= 5 && /:(\d+)$/.test(c[1]) && +c[1].match(/:(\d+)$/)[1] === PORT && /^(0\.0\.0\.0|\[::\]):0$/.test(c[2])) return +c[4] || 0;
  }
  return 0;
}
function killTree(pid) {
  if (!pid) return;
  if (WIN) spawnSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
  else { try { process.kill(pid, 'SIGTERM'); } catch (e) { } }
}
function winVersion() {
  if (!WIN) return `${os.type()} ${os.release()}`;
  return `${os.version ? os.version() : 'Windows'} ${os.release()}`;
}

// ---------- failure: report + Notepad (stays open until the user closes it) ----------
function fail(problem, hint = '') {
  log('FAILED:', problem.replace(/\s+/g, ' '));
  const text = [
    `GNC Terminal could not start   ${new Date().toString()}`,
    '',
    'Problem:  ' + problem,
    hint ? '\nWhat to do:\n' + hint : '',
    '',
    `Folder:   ${APP}`,
    `Node:     ${process.execPath} (v${process.versions.node})`,
    `Windows:  ${winVersion()}`,
    `Port:     ${PORT}`,
    `Launcher: ${LAUNCHER_VERSION}`,
    '',
    '---- launcher.log (last lines) ----', tail(LOG, 30),
    '', '---- data\\console.log (last lines) ----', tail(CONSOLE_LOG, 30),
    '', `This report: ${REPORT}`,
    'Troubleshooting: "Troubleshooting - start with messages.bat" starts the server in a visible window.',
  ].join('\r\n');
  try { fs.writeFileSync(REPORT, text); } catch (e) { }
  showFile(REPORT);
  process.exitCode = 1;
}
function showFile(f) {
  if (process.env.GNC_NO_NOTEPAD) return;
  try {
    if (WIN) spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'notepad.exe'), [f], { detached: true, stdio: 'ignore' }).unref();
    else console.log(fs.readFileSync(f, 'utf8'));
  } catch (e) { }
}

// ---------- app window ----------
function browserCandidates() {
  const e = process.env, pf86 = e['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', pf = e.ProgramW6432 || e.ProgramFiles || 'C:\\Program Files', la = e.LOCALAPPDATA || '';
  return [
    path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    la && path.join(la, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    la && path.join(la, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);
}
function openWindow() {
  // GNC_BROWSER: a program that gets "--app=<url>" (used by the tests; also lets you pick a browser)
  const forced = process.env.GNC_BROWSER;
  const exe = forced || (WIN ? browserCandidates().find(f => fs.existsSync(f)) : null);
  try {
    if (exe) { spawn(exe, [`--app=${URL_APP}`], { detached: true, stdio: 'ignore' }).unref(); log('window opened with', path.basename(exe)); return true; }
    if (WIN) { spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'explorer.exe'), [URL_APP], { detached: true, stdio: 'ignore' }).unref(); log('window opened in the default browser'); return true; }
    log('no browser to open on this system; URL is', URL_APP); return true;
  } catch (e) { log('could not open the window:', e.message); return false; }
}

// The launcher folder must sit next to server.mjs and public\index.html. If it was copied elsewhere, say exactly where the app is.
function findAppNearby() {
  const seen = new Set(), hits = [];
  const look = (d, depth) => {
    if (depth < 0 || seen.has(d)) return; seen.add(d);
    if (!sameDir(d, APP) && fs.existsSync(path.join(d, 'server.mjs')) && fs.existsSync(path.join(d, 'public', 'index.html'))) hits.push(d);
    let ents = []; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { }
    for (const e of ents) if (e.isDirectory() && !/^(node_modules|data|public|launcher|routes|universe|digests|\.)/i.test(e.name)) look(path.join(d, e.name), depth - 1);
  };
  look(APP, 2); look(path.dirname(APP), 1);
  return hits;
}
function appFilesOk() {
  const missing = ['server.mjs', path.join('public', 'index.html')].filter(f => !fs.existsSync(path.join(APP, f)));
  if (!missing.length) return true;
  const hits = findAppNearby();
  if (hits.length) fail(`The launcher files are in "${APP}", but the GNC Terminal program (server.mjs) is in "${hits[0]}".`,
    `Move these into "${hits[0]}" (replace when Windows asks): the "launcher" folder, "GNC Terminal - setup.bat", "Stop GNC Terminal.bat", "Diagnose GNC Terminal.bat", "Troubleshooting - start with messages.bat", "README.txt".\r\nThen double-click "GNC Terminal - setup.bat" in "${hits[0]}". It replaces the desktop, Start menu and autostart icons.`);
  else fail(`${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} missing in "${APP}". The launcher must be inside the GNC Terminal program folder.`,
    'Extract the full GNC-Terminal-App.zip ("Extract All..."), then extract GNC-Terminal-launcher-fix.zip to the SAME place so its files land next to server.mjs. Then double-click "GNC Terminal - setup.bat" there. If server.mjs keeps disappearing, your antivirus removed it: run "Diagnose GNC Terminal.bat".');
  return false;
}

// ---------- start / ensure running ----------
async function ensureRunning() {
  if (+process.versions.node.split('.')[0] < 18) {
    fail(`Node.js ${process.versions.node} is too old; GNC Terminal needs 18 or newer.`, 'Install the LTS version from https://nodejs.org (Windows Installer .msi, default settings), then double-click the GNC Terminal icon again.');
    return false;
  }
  if (!appFilesOk()) return false;
  let v = await probe();
  if (v && sameDir(v.dir, APP)) { log(`server already running (${v.page}, up ${v.uptimeSec}s)`); return true; }
  if (v) {
    // another GNC Terminal copy (e.g. the old v3 folder) holds the port: stop it, it would show the old version
    log(`another GNC Terminal copy is running from ${v.dir}; stopping it`);
    const pid = listenerPid(); killTree(pid);
    for (let i = 0; i < 20 && await portTaken(); i++) await sleep(500);
    if (await portTaken()) { fail(`An older GNC Terminal from "${v.dir}" is running on port ${PORT} and could not be stopped.`, 'Restart Windows, then double-click the GNC Terminal icon again.'); return false; }
  } else if (await portTaken() && !alive(readPid(KEEPER_PID))) {
    const pid = listenerPid(), name = pid ? procName(pid) : 'unknown program';
    fail(`Port ${PORT} is used by another program (${name}${pid ? ', process ' + pid : ''}).`, `Close that program, or change "port" in config.json of GNC Terminal (e.g. 8766), then start again.`);
    return false;
  }
  rm(STOP_FLAG); rm(KEEPER_FATAL);
  if (!alive(readPid(KEEPER_PID))) {
    const k = spawn(process.execPath, [SELF, '--keeper'], { cwd: APP, detached: true, stdio: 'ignore', windowsHide: true, env: process.env });
    k.unref(); log(`hidden keeper started (pid ${k.pid})`);
  } else log('keeper already running; waiting for the server');
  const t0 = Date.now(), limit = +process.env.GNC_START_TIMEOUT || 120000;
  while (Date.now() - t0 < limit) {
    await sleep(500);
    v = await probe();
    if (v && sameDir(v.dir, APP)) { log(`server answers after ${((Date.now() - t0) / 1000).toFixed(1)} s: ${v.page}`); return true; }
    if (fs.existsSync(KEEPER_FATAL)) { const why = fs.readFileSync(KEEPER_FATAL, 'utf8'); fail(why, 'The last lines of data\\console.log below show the server\'s own message. "Troubleshooting - start with messages.bat" shows it live.'); return false; }
    if (Date.now() - t0 > 5000 && !alive(readPid(KEEPER_PID))) { fail('The hidden keeper stopped before the server answered.', 'See the log lines below. If nothing is logged, your security software may be stopping node.exe: run "Diagnose GNC Terminal.bat".'); return false; }
  }
  fail(`The server did not answer at ${URL_APP} within ${limit / 1000} seconds.`, 'It may still be starting on a slow PC: wait a minute and double-click the icon again.');
  return false;
}
function procName(pid) {
  if (!WIN) return 'process';
  const r = spawnSync('tasklist.exe', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true });
  const m = (r.stdout || '').match(/^"([^"]+)"/m); return m ? m[1] : 'unknown program';
}

// ---------- keeper: runs server.mjs hidden, restarts after a crash, stops on stop.flag ----------
async function keeper(visible = false) {
  const other = readPid(KEEPER_PID);
  if (other && other !== process.pid && alive(other)) { log(`keeper ${other} already runs; exiting`); return; }
  fs.writeFileSync(KEEPER_PID, String(process.pid));
  log(`keeper running for ${APP}, port ${PORT}`);
  fs.mkdirSync(path.join(APP, 'data'), { recursive: true });
  let child = null, stopping = false, quickCrashes = 0;
  const preload = path.join(HERE, 'ipc-shutdown.cjs');
  const finish = () => {
    if (readPid(KEEPER_PID) === process.pid) rm(KEEPER_PID); rm(SERVER_PID); log('keeper ends');
    if (visible && fs.existsSync(KEEPER_FATAL)) fail(fs.readFileSync(KEEPER_FATAL, 'utf8'), 'The last lines of data\\console.log below show the server\'s own message.');
    process.exit(process.exitCode || 0);
  };
  const stop = why => {
    if (stopping) return; stopping = true; log('stop requested:', why);
    if (!child) return finish();
    try { child.connected ? child.send('gnc-shutdown') : child.kill(); } catch (e) { try { child.kill(); } catch (e2) { } }
    setTimeout(() => { if (child) { log('server did not exit in 15 s; ending it'); killTree(child.pid); } }, 15000).unref();
  };
  setInterval(() => { if (fs.existsSync(STOP_FLAG)) stop('stop.flag'); }, 1000);
  for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, () => stop(s));
  while (!stopping) {
    const out = fs.openSync(CONSOLE_LOG, 'a');
    fs.writeSync(out, `\n==== ${new Date().toISOString()} server start (${LAUNCHER_VERSION}, node ${process.versions.node}) ====\n`);
    const started = Date.now();
    child = spawn(process.execPath, ['-r', preload, 'server.mjs'], { cwd: APP, windowsHide: !visible, stdio: ['ignore', out, out, 'ipc'], env: { ...process.env, GNC_SUPERVISED: '1' } });
    fs.writeFileSync(SERVER_PID, String(child.pid));
    log(`server started (pid ${child.pid})`);
    const code = await new Promise(r => child.once('exit', (c, sig) => r(c ?? sig)));
    try { fs.closeSync(out); } catch (e) { }
    child = null; rm(SERVER_PID);
    const ran = (Date.now() - started) / 1000;
    log(`server exited with ${code} after ${ran.toFixed(0)} s`);
    if (stopping) break;
    if (code === 75) { quickCrashes = 0; log('restart requested by the app (update/restore)'); continue; }
    if (code === 2) {
      const v = await probe();
      if (v && sameDir(v.dir, APP)) { log('a server from this folder already answers; keeper not needed'); break; }
      fs.writeFileSync(KEEPER_FATAL, `Port ${PORT} is already in use by ${v ? 'another GNC Terminal copy (' + v.dir + ')' : 'another program'}.`);
      break;
    }
    quickCrashes = ran < 60 ? quickCrashes + 1 : 0;
    if (quickCrashes >= 5) { fs.writeFileSync(KEEPER_FATAL, `The server stopped ${quickCrashes} times in a row right after starting (last exit code ${code}).`); break; }
    const wait = Math.min(60, 2 ** quickCrashes);
    log(`restarting in ${wait} s`);
    for (let i = 0; i < wait * 4 && !stopping; i++) await sleep(250);
  }
  finish();
}

// ---------- stop ----------
async function stopAll() {
  fs.writeFileSync(STOP_FLAG, `stop requested ${new Date().toISOString()}`);
  const kpid = readPid(KEEPER_PID), wasUp = !!(await probe());
  log(`stop: keeper ${kpid || '-'}, server ${wasUp ? 'answering' : 'not answering'}`);
  for (let i = 0; i < 40; i++) { if (!alive(readPid(KEEPER_PID)) && !(await probe(800))) break; await sleep(500); }
  let v = await probe(800);
  if (v && sameDir(v.dir, APP)) { // not supervised (started by hand or by the old .exe): end it directly
    const pid = readPid(SERVER_PID) || listenerPid(); log(`stop: server still answers, ending process ${pid || '?'}`); killTree(pid);
    for (let i = 0; i < 20 && await probe(800); i++) await sleep(500);
    v = await probe(800);
  }
  if (v && sameDir(v.dir, APP)) { console.log('GNC Terminal could not be stopped. Restart Windows to stop it.'); log('stop: FAILED'); process.exitCode = 1; return; }
  if (v) console.log(`Note: another GNC Terminal copy (${v.dir}) still runs on port ${PORT}; it was not touched.`);
  console.log(wasUp || kpid ? 'GNC Terminal is stopped.' : 'GNC Terminal was not running.');
  log('stop: done');
}

// ---------- shortcuts (desktop, Start menu, autostart) ----------
// No PowerShell, no COM, no conhost tricks, no registry writes: plain .lnk files that start node.exe (signed by the
// Node.js project) with launcher\gnc.mjs. Antivirus programs often flag launchers that use those other techniques.
function expandEnv(s) { return s.replace(/%([^%]+)%/g, (m, k) => process.env[k] ?? m); }
function folders() {
  const appdata = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const home = process.env.USERPROFILE || os.homedir();
  const cands = [];
  if (WIN) {
    // where Explorer keeps the Desktop (read only); usually "%USERPROFILE%\Desktop", or a OneDrive folder
    const r = spawnSync('reg.exe', ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders', '/v', 'Desktop'], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
    const m = (r.stdout || '').match(/Desktop\s+REG_(?:EXPAND_)?SZ\s+(.+)/);
    if (m) cands.push(expandEnv(m[1].trim()));
  }
  const od = process.env.OneDrive;
  if (od) cands.push(path.join(od, 'Desktop'), path.join(od, 'Masaüstü'));
  cands.push(path.join(home, 'Desktop'), path.join(home, 'Masaüstü'));
  const desktop = cands.find(d => d && !d.includes('?') && fs.existsSync(d)) || '';
  return {
    desktop,
    programs: path.join(appdata, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    startup: path.join(appdata, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup'),
  };
}
// VISIBLE mode (--visible): no hidden processes at all; the server runs in the icon's own window, which stays minimized
// on the taskbar (as v3.1 did). Use it when security software stops the hidden mode.
const VISIBLE = process.argv.includes('--visible');
function launchSpec(extraArgs = []) {
  const q = s => `"${s}"`;
  const a = VISIBLE ? ['--run', ...extraArgs] : extraArgs;
  return { target: process.execPath, args: [q(SELF), ...a].join(' '), show: 7, how: VISIBLE ? 'node.exe, minimized window that keeps running (visible mode)' : 'node.exe, minimized (hidden mode)' };
}
function makeShortcut(file, spec, description) {
  const icon = path.join(APP, 'public', 'icon.ico');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, writeLnk({ target: spec.target, args: spec.args, workingDir: APP, icon, iconIndex: 0, showCmd: spec.show, description }));
  return '.lnk';
}
async function setup() {
  if (!appFilesOk()) { console.log('Setup stopped: see the report that opened in Notepad.'); process.exitCode = 1; return; }
  const f = folders(), spec = launchSpec();
  console.log(`Start method: ${spec.how}`); log('setup: start method', spec.how);
  const made = [];
  for (const dir of [f.desktop, f.programs, APP].filter(Boolean)) {
    const file = path.join(dir, SHORTCUT_NAME);
    try { const how = makeShortcut(file, spec, 'GNC Terminal - start and open the app'); made.push(file); log(`setup: ${file} (${how})`); console.log(`  icon: ${file}`); }
    catch (e) { log(`setup: could not write ${file}: ${e.message}`); console.log(`  !! could not write ${file}: ${e.message}`); }
  }
  if (process.argv.includes('--autostart-on')) await autostart(true);
  if (process.argv.includes('--autostart-off')) await autostart(false);
  if (!made.length) { fail('No icon could be created.', 'See launcher.log below.'); return; }
  console.log('\nDone. Pin to taskbar: right-click the GNC Terminal icon on the desktop > (Windows 11: "Show more options") > "Pin to taskbar".');
}
async function autostart(on) {
  const file = path.join(folders().startup, SHORTCUT_NAME);
  if (on) { const how = makeShortcut(file, launchSpec(['--background']), 'GNC Terminal - start at sign-in'); log(`autostart on: ${file} (${how})`); console.log(`Start with Windows: ON (${file})`); }
  else { rm(file); log('autostart off'); console.log('Start with Windows: OFF'); }
}

// ---------- diagnose ----------
function run(cmd, args, timeout = 60000) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, timeout });
  if (r.error) return `(could not run ${cmd}: ${r.error.message})`;
  return ((r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')).trim() || '(no output)';
}
function ps(cmd) { return run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], 90000); }
async function diagnose() {
  const out = [], sec = (t, body) => out.push(`\r\n==== ${t} ====\r\n${String(body).replace(/\r?\n/g, '\r\n')}`);
  out.push(`GNC Terminal diagnose  ${new Date().toString()}  (${LAUNCHER_VERSION})`);
  sec('Folder and files', [`App folder: ${APP}`, ...['server.mjs', 'public\\index.html', 'public\\icon.ico', 'GNC Terminal.exe', 'config.json', 'data\\store.json', 'data\\userdocs.json'].map(f => `${fs.existsSync(path.join(APP, f)) ? 'present' : 'MISSING'}  ${f}`), `Started from inside a zip/temp folder: ${/\\(temp|tmp)\\/i.test(APP) ? 'YES - extract the zip first' : 'no'}`].join('\n'));
  sec('Node.js', `${process.execPath}\nversion ${process.versions.node} (${+process.versions.node.split('.')[0] >= 18 ? 'OK, 18 or newer' : 'TOO OLD'})\n` + (WIN ? run('where.exe', ['node']) : ''));
  sec('Windows', winVersion());
  const v = await probe();
  sec(`Port ${PORT}`, v ? `answering: ${v.page} from ${v.dir}${sameDir(v.dir, APP) ? ' (this folder)' : ' (ANOTHER folder)'}` : (await portTaken()) ? `taken by ${procName(listenerPid())} (pid ${listenerPid()})` : 'free');
  if (WIN) {
    const zone = (() => { try { return fs.readFileSync(path.join(APP, 'GNC Terminal.exe') + ':Zone.Identifier', 'utf8').trim(); } catch (e) { return 'none'; } })();
    sec('GNC Terminal.exe: download mark (Zone.Identifier)', zone);
    sec('GNC Terminal.exe: signature', ps(`$s=Get-AuthenticodeSignature -LiteralPath '${path.join(APP, 'GNC Terminal.exe').replace(/'/g, "''")}'; \"$($s.Status) $($s.StatusMessage)\"`));
    sec('Smart App Control (0 = off, 1 = on, 2 = evaluation)', run('reg.exe', ['query', 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\CI\\Policy', '/v', 'VerifiedAndReputablePolicyState']));
    sec('PowerShell language mode (ConstrainedLanguage = scripts restricted)', ps('$ExecutionContext.SessionState.LanguageMode'));
    sec('cmd.exe AutoRun (an "exit" here closes every .bat at once)', run('reg.exe', ['query', 'HKCU\\Software\\Microsoft\\Command Processor', '/v', 'AutoRun']) + '\n' + run('reg.exe', ['query', 'HKLM\\Software\\Microsoft\\Command Processor', '/v', 'AutoRun']));
    sec('cmd.exe policy (DisableCMD)', run('reg.exe', ['query', 'HKCU\\Software\\Policies\\Microsoft\\Windows\\System', '/v', 'DisableCMD']));
    sec('ComSpec', process.env.ComSpec || '(not set)');
    sec('Microsoft Defender: status', ps('Get-MpComputerStatus | Format-List AMRunningMode,RealTimeProtectionEnabled,IsTamperProtected,AntivirusSignatureLastUpdated | Out-String -Width 200'));
    sec('Microsoft Defender: detections (Get-MpThreatDetection)', ps("$d=Get-MpThreatDetection; if(!$d){'none'}else{$d | Sort-Object InitialDetectionTime -Descending | Select-Object -First 15 InitialDetectionTime,ThreatID,ActionSuccess,@{n='Resources';e={$_.Resources -join '; '}} | Format-List | Out-String -Width 300}"));
    sec('Microsoft Defender: threat names', ps("$t=Get-MpThreat; if(!$t){'none'}else{$t | Select-Object ThreatName,SeverityID,IsActive,DidThreatExecute | Format-Table -AutoSize | Out-String -Width 200}"));
    sec('Microsoft Defender: Controlled folder access / ASR (0 = off, 1 = on, 2 = audit)', ps("$p=Get-MpPreference; \"EnableControlledFolderAccess: $($p.EnableControlledFolderAccess)\"; \"Allowed apps: $($p.ControlledFolderAccessAllowedApplications -join '; ')\"; \"Protected folders: $($p.ControlledFolderAccessProtectedFolders -join '; ')\"; \"ASR rules: $(@($p.AttackSurfaceReductionRules_Ids).Count)\"; \"Exclusions (paths): $(if($p.ExclusionPath){'set'}else{'none'})\""));
    sec('Code Integrity / Smart App Control blocks (newest 15)', run('wevtutil.exe', ['qe', 'Microsoft-Windows-CodeIntegrity/Operational', '/q:*[System[(EventID=3033 or EventID=3034 or EventID=3076 or EventID=3077 or EventID=3089)]]', '/c:15', '/rd:true', '/f:text']).split(/\r?\n/).filter(l => /Date:|Event ID:|Description|File Name|attempted|\.exe|\.dll|\.ps1|\.bat|\.vbs/i.test(l)).join('\n') || 'none');
    sec('Defender events 1116/1117 (newest 10)', run('wevtutil.exe', ['qe', 'Microsoft-Windows-Windows Defender/Operational', '/q:*[System[(EventID=1116 or EventID=1117)]]', '/c:10', '/rd:true', '/f:text']).split(/\r?\n/).filter(l => /Date:|Event ID:|Name:|Path:|Action:|Process Name:/i.test(l)).join('\n') || 'none');
    sec('Application errors for GNC Terminal.exe / node.exe (newest 10)', run('wevtutil.exe', ['qe', 'Application', '/q:*[System[(EventID=1000 or EventID=1001 or EventID=1026)]]', '/c:30', '/rd:true', '/f:text']).split(/\r?\n\r?\n/).filter(b => /GNC Terminal|node\.exe/i.test(b)).slice(0, 10).join('\n\n') || 'none');
    sec('Autostart entries (Run key)', run('reg.exe', ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run']));
    sec('Startup folder', (() => { try { return fs.readdirSync(folders().startup).join('\n') || '(empty)'; } catch (e) { return e.message; } })());
    sec('Edge / Chrome', browserCandidates().map(f => `${fs.existsSync(f) ? 'found  ' : 'missing'} ${f}`).join('\n'));
  }
  sec('launcher.log (last lines)', tail(LOG, 40));
  sec('GNC-Terminal-report.txt', tail(REPORT, 40));
  sec('data\\console.log (last lines)', tail(CONSOLE_LOG, 25));
  fs.writeFileSync(DIAG, out.join('\r\n'));
  console.log(`Report written: ${DIAG}`);
  showFile(DIAG);
}

// ---------- main ----------
const args = process.argv.slice(2);
try {
  if (args.includes('--port')) process.stdout.write(String(PORT) + '\n');
  else if (args.includes('--keeper')) await keeper();
  else if (args.includes('--stop')) await stopAll();
  else if (args.includes('--setup')) await setup();
  else if (args.includes('--autostart')) await autostart(args[args.indexOf('--autostart') + 1] !== 'off');
  else if (args.includes('--diagnose')) await diagnose();
  else if (args.includes('--run')) {
    // visible mode: this (minimized) window is the keeper; closing it stops GNC Terminal after saving
    const bg = args.includes('--background');
    const v = await probe(1500);
    if (v && sameDir(v.dir, APP)) { log(`run: server already running (${v.page})`); if (!bg) openWindow(); }
    else if (appFilesOk()) {
      if (process.stdout.isTTY) process.stdout.write('\x1b]0;GNC Terminal - running (closing this window stops it)\x07');
      console.log('GNC Terminal is running at ' + URL_APP + '\nKeep this window open (minimized). Closing it stops GNC Terminal; your data is saved first.\n');
      log('run: visible keeper starts'); rm(STOP_FLAG); rm(KEEPER_FATAL);
      if (!bg) (async () => { const t0 = Date.now(); while (Date.now() - t0 < 120000) { await sleep(500); const w = await probe(); if (w && sameDir(w.dir, APP)) { openWindow(); return; } } })();
      await keeper(true);
    }
  }
  else if (args.includes('--wait-open')) { if (await ensureRunning()) openWindow(); }   // internal, hidden
  else if (args.includes('--wait')) { await ensureRunning(); }                         // internal, hidden
  else {
    // the icon's own (minimized) node window must vanish at once: if the server already answers, open the window now;
    // otherwise hand the start + wait to a hidden helper and exit
    const bg = args.includes('--background');
    log(`start (${bg ? 'background' : 'open'}) from ${APP}`);
    const v = await probe(1500);
    if (v && sameDir(v.dir, APP)) { log(`server already running (${v.page})`); if (!bg) openWindow(); }
    else if (appFilesOk()) {
      const h = spawn(process.execPath, [SELF, bg ? '--wait' : '--wait-open'], { cwd: APP, detached: true, stdio: 'ignore', windowsHide: true, env: process.env });
      h.unref(); log(`hidden starter ${h.pid} takes over`);
    }
  }
} catch (e) {
  log('crash:', e.stack || e.message);
  if (!args.includes('--keeper')) fail('The launcher itself failed: ' + (e.message || e));
}
