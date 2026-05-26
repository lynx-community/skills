// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { extname, relative, resolve, sep } from 'node:path';
import process from 'node:process';

const DEFAULT_JSON_FILE = 'output.json';
const DEFAULT_HOST = '127.0.0.1';
const BOOT_TIMEOUT_MS = 120_000;
const DEVICE_POLL_INTERVAL_MS = 1_000;

type ParsedArgs = {
  filePath: string;
  port: number;
  avdName: string;
  serial: string;
};

type ServeResult = {
  port: number;
  server: ReturnType<typeof createServer>;
};

type SpawnResult = {
  stdout: string;
  stderr: string;
};

const ANDROID_SDK_ROOT_CANDIDATES = [
  process.env.ANDROID_SDK_ROOT,
  process.env.ANDROID_HOME,
  resolve(homedir(), 'Library/Android/sdk'),
];

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    filePath: DEFAULT_JSON_FILE,
    port: 0,
    avdName: '',
    serial: '',
  };

  const positionals: string[] = [];
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value) continue;

    if (value === '--port') {
      index += 1;
      args.port = Number(argv[index]);
      continue;
    }
    if (value === '--avd') {
      index += 1;
      args.avdName = argv[index] ?? '';
      continue;
    }
    if (value === '--serial') {
      index += 1;
      args.serial = argv[index] ?? '';
      continue;
    }
    if (value === '--file') {
      index += 1;
      args.filePath = argv[index] ?? DEFAULT_JSON_FILE;
      continue;
    }
    if (value.startsWith('--')) {
      throw new Error(`Unknown option: ${value}`);
    }
    positionals.push(value);
  }

  if (positionals[0]) args.filePath = positionals[0];
  if (positionals[1]) args.port = Number(positionals[1]);

  if (Number.isNaN(args.port) || args.port < 0) {
    throw new Error('The port must be a non-negative number.');
  }

  return args;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function execCommand(
  command: string,
  args: string[],
  options: Parameters<typeof spawn>[2] = {},
): Promise<SpawnResult> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      rejectPromise(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }

      rejectPromise(
        new Error(
          `${command} ${args.join(' ')} exited with code ${code}${stderr ? `:\n${stderr.trim()}` : ''}`,
        ),
      );
    });
  });
}

async function readAdbDevices(): Promise<string[]> {
  const { stdout } = await execCommand('adb', ['devices']);
  const lines = stdout.split('\n').slice(1);

  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts.length >= 2 && parts[1] === 'device')
    .map(([serial]) => serial as string)
    .filter(Boolean);
}

async function waitForAndroidDevice({
  preferEmulator,
  timeoutMs,
}: {
  preferEmulator: boolean;
  timeoutMs: number;
}): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const devices = await readAdbDevices();
    const preferredDevice = preferEmulator
      ? devices.find((serial) => serial.startsWith('emulator-'))
      : devices[0];

    if (preferredDevice) return preferredDevice;
    await wait(DEVICE_POLL_INTERVAL_MS);
  }

  throw new Error(
    'Timed out waiting for an Android device to become available.',
  );
}

async function waitForBootComplete(serial: string): Promise<void> {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { stdout } = await execCommand('adb', [
      '-s',
      serial,
      'shell',
      'getprop',
      'sys.boot_completed',
    ]);

    if (stdout.trim() === '1') return;
    await wait(DEVICE_POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for ${serial} to finish booting.`);
}

async function resolveExistingExecutable(
  candidates: string[],
): Promise<string> {
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {}
  }

  throw new Error(
    `Unable to locate an executable from: ${candidates.join(', ')}`,
  );
}

async function resolveAndroidEmulatorBinary(): Promise<string> {
  const candidates = ANDROID_SDK_ROOT_CANDIDATES.flatMap((sdkRoot) => {
    if (!sdkRoot) return [];
    return [
      resolve(sdkRoot, 'emulator', 'emulator'),
      resolve(sdkRoot, 'tools', 'emulator'),
    ];
  });

  return resolveExistingExecutable(candidates);
}

async function ensureAndroidDevice({
  avdName,
  serial,
}: {
  avdName: string;
  serial: string;
}): Promise<string> {
  if (serial) {
    await execCommand('adb', ['start-server']);
    await execCommand('adb', ['-s', serial, 'wait-for-device']);
    await waitForBootComplete(serial);
    return serial;
  }

  await execCommand('adb', ['start-server']);
  const devices = await readAdbDevices();
  const runningEmulator = devices.find((value) =>
    value.startsWith('emulator-'),
  );
  if (runningEmulator) {
    await execCommand('adb', ['-s', runningEmulator, 'wait-for-device']);
    await waitForBootComplete(runningEmulator);
    return runningEmulator;
  }

  if (!avdName) {
    throw new Error(
      'No Android emulator is running. Pass --avd <name> or --serial <serial>.',
    );
  }

  const emulatorBinary = await resolveAndroidEmulatorBinary();
  const child = spawn(emulatorBinary, ['-avd', avdName, '-no-window'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  const startedSerial = await waitForAndroidDevice({
    preferEmulator: true,
    timeoutMs: BOOT_TIMEOUT_MS,
  });
  await execCommand('adb', ['-s', startedSerial, 'wait-for-device']);
  await waitForBootComplete(startedSerial);
  return startedSerial;
}

async function serveDirectory(
  rootDir: string,
  filePath: string,
  requestedPort: number,
): Promise<ServeResult> {
  const rootPrefix = rootDir.endsWith(sep) ? rootDir : `${rootDir}${sep}`;
  const server = createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? '/', `http://${DEFAULT_HOST}`);
      const pathname =
        requestUrl.pathname === '/'
          ? `/${relative(rootDir, filePath).split(sep).join('/')}`
          : requestUrl.pathname;
      const normalizedPath = pathname.replace(/^\/+/, '');
      const fullPath = resolve(rootDir, normalizedPath);

      if (fullPath !== rootDir && !fullPath.startsWith(rootPrefix)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      const content = await readFile(fullPath);
      res.statusCode = 200;
      res.setHeader(
        'Content-Type',
        extname(fullPath) === '.json'
          ? 'application/json; charset=utf-8'
          : 'application/octet-stream',
      );
      res.end(content);
    } catch (error) {
      res.statusCode = 404;
      res.end(error instanceof Error ? error.message : 'Not found');
    }
  });

  const port = await new Promise<number>((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(requestedPort, DEFAULT_HOST, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        resolvePromise(address.port);
        return;
      }
      rejectPromise(new Error('Failed to determine the server port.'));
    });
  });

  return { port, server };
}

async function openJsonOnAndroid(serial: string, url: string): Promise<void> {
  await execCommand('adb', ['start-server']);
  await execCommand('adb', [
    '-s',
    serial,
    'shell',
    'am',
    'start',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    `lynx://open?url=${encodeURIComponent(
      serial.startsWith('emulator-')
        ? url.replace(DEFAULT_HOST, '10.0.2.2')
        : url,
    )}`,
  ]);
}

async function shutdownServer(server: ServeResult['server']): Promise<void> {
  await new Promise<void>((resolvePromise) => {
    server.close(() => resolvePromise());
  });
}

async function main(): Promise<void> {
  const { filePath, port, avdName, serial } = parseArgs(process.argv);
  const rootDir = process.cwd();
  const absoluteFilePath = resolve(rootDir, filePath);

  await access(absoluteFilePath);

  const { server, port: actualPort } = await serveDirectory(
    rootDir,
    absoluteFilePath,
    port,
  );
  const normalizedPath = relative(rootDir, absoluteFilePath)
    .split(sep)
    .join('/');
  const jsonUrl = `http://${DEFAULT_HOST}:${actualPort}/${encodeURI(normalizedPath)}`;

  console.log(`Serving ${absoluteFilePath}`);
  console.log(`JSON URL: ${jsonUrl}`);

  const deviceSerial = await ensureAndroidDevice({ avdName, serial });
  console.log(`Using Android device: ${deviceSerial}`);

  await openJsonOnAndroid(deviceSerial, jsonUrl);
  console.log('Opened the JSON URL on Android.');

  const handleShutdown = async (): Promise<void> => {
    await shutdownServer(server);
  };

  process.once('SIGINT', () => {
    void handleShutdown().finally(() => {
      process.exit(130);
    });
  });
  process.once('SIGTERM', () => {
    void handleShutdown().finally(() => {
      process.exit(143);
    });
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
