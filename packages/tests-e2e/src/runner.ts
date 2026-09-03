/**
 * DevFlow E2E Integration Test Runner & Assertion Library
 * High-speed, zero-dependency async test harness with colorized reporting.
 */

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface SuiteStats {
  name: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
}

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  bgGreen: "\x1b[42m\x1b[30m",
  bgRed: "\x1b[41m\x1b[37m",
};

let currentSuite = "Global";
const testQueue: Array<{ suite: string; name: string; fn: () => Promise<void> | void }> = [];
const allResults: TestResult[] = [];

export function describe(title: string, fn: () => void) {
  const previousSuite = currentSuite;
  currentSuite = title;
  try {
    fn();
  } finally {
    currentSuite = previousSuite;
  }
}

export function it(title: string, fn: () => Promise<void> | void) {
  testQueue.push({ suite: currentSuite, name: title, fn });
}

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: any) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new Error(`Expected deep equal: ${b}\nReceived: ${a}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== "number" || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== "number" || actual < expected) {
        throw new Error(`Expected ${actual} to be >= ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== "number" || actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, got undefined`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected: any) {
      if (typeof actual === "string") {
        if (!actual.includes(expected)) {
          throw new Error(`Expected string "${actual}" to contain "${expected}"`);
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(expected) && !actual.some((x) => JSON.stringify(x) === JSON.stringify(expected))) {
          throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
        }
      } else {
        throw new Error(`toContain called on non-collection type: ${typeof actual}`);
      }
    },
    toHaveProperty(prop: string) {
      if (!actual || typeof actual !== "object" || !(prop in actual)) {
        throw new Error(`Expected object to have property "${prop}"`);
      }
    },
  };
}

export const API_BASE = process.env.API_URL || "http://localhost:4000";
export const WEB_BASE = process.env.WEB_URL || "http://localhost:3000";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; ok: boolean; headers: any; data: any; durationMs: number }> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const start = Date.now();
  const res = await fetch(url, { ...options, headers });
  const durationMs = Date.now() - start;

  let data: any = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return {
    status: res.status,
    ok: res.ok,
    headers: res.headers,
    data,
    durationMs,
  };
}

export async function webRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; ok: boolean; headers: any; html: string; durationMs: number }> {
  const url = endpoint.startsWith("http") ? endpoint : `${WEB_BASE}${endpoint}`;
  const start = Date.now();
  const res = await fetch(url, options);
  const durationMs = Date.now() - start;
  const text = await res.text();

  return {
    status: res.status,
    ok: res.ok,
    headers: res.headers,
    html: text,
    durationMs,
  };
}

export async function runAllTests(): Promise<{ passed: boolean; total: number; failed: number }> {
  console.log(`\n${colors.bold}${colors.cyan}═════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  🚀 DevFlow End-to-End Integration & Browser Test Suite${colors.reset}`);
  console.log(`${colors.dim}  Target API: ${API_BASE}  |  Target Web: ${WEB_BASE}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const startTime = Date.now();
  let currentSuitePrinted = "";

  for (const test of testQueue) {
    if (test.suite !== currentSuitePrinted) {
      console.log(`\n${colors.bold}${colors.blue}📦 ${test.suite}${colors.reset}`);
      currentSuitePrinted = test.suite;
    }

    const testStart = Date.now();
    try {
      await test.fn();
      const durationMs = Date.now() - testStart;
      allResults.push({
        suite: test.suite,
        name: test.name,
        passed: true,
        durationMs,
      });
      console.log(`  ${colors.green}✔${colors.reset} ${test.name} ${colors.dim}(${durationMs}ms)${colors.reset}`);
    } catch (err: any) {
      const durationMs = Date.now() - testStart;
      allResults.push({
        suite: test.suite,
        name: test.name,
        passed: false,
        durationMs,
        error: err,
      });
      console.log(`  ${colors.red}✖${colors.reset} ${colors.bold}${test.name}${colors.reset} ${colors.dim}(${durationMs}ms)${colors.reset}`);
      console.log(`    ${colors.red}Error: ${err.message}${colors.reset}`);
    }
  }

  const totalDuration = Date.now() - startTime;
  const total = allResults.length;
  const passed = allResults.filter((r) => r.passed).length;
  const failed = total - passed;

  // Print Summary Table
  console.log(`\n${colors.bold}─────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.bold}📊 TEST SUITE EXECUTION SUMMARY${colors.reset}`);
  console.log(`─────────────────────────────────────────────────────────────────`);

  // Aggregate by suite
  const suiteMap = new Map<string, SuiteStats>();
  allResults.forEach((r) => {
    if (!suiteMap.has(r.suite)) {
      suiteMap.set(r.suite, { name: r.suite, total: 0, passed: 0, failed: 0, durationMs: 0 });
    }
    const s = suiteMap.get(r.suite)!;
    s.total += 1;
    s.durationMs += r.durationMs;
    if (r.passed) s.passed += 1;
    else s.failed += 1;
  });

  Array.from(suiteMap.values()).forEach((s) => {
    const icon = s.failed === 0 ? `${colors.green}✔${colors.reset}` : `${colors.red}✖${colors.reset}`;
    const statusText = s.failed === 0 ? `${colors.green}${s.passed}/${s.total} Passed${colors.reset}` : `${colors.red}${s.failed} Failed${colors.reset}`;
    console.log(`  ${icon} ${s.name.padEnd(45)} ${statusText.padEnd(20)} ${colors.dim}${s.durationMs}ms${colors.reset}`);
  });

  console.log(`─────────────────────────────────────────────────────────────────`);
  if (failed === 0) {
    console.log(`\n  ${colors.bgGreen} ALL TESTS PASSED ${colors.reset}  ${colors.green}${colors.bold}${passed}/${total} assertions verified in ${totalDuration}ms${colors.reset}\n`);
  } else {
    console.log(`\n  ${colors.bgRed} TESTS FAILED ${colors.reset}  ${colors.red}${colors.bold}${failed} of ${total} tests failed (${passed} passed) in ${totalDuration}ms${colors.reset}\n`);
  }

  return {
    passed: failed === 0,
    total,
    failed,
  };
}
