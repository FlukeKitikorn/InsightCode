/** In-memory buffer of last N log lines for admin "System Logs" view. */
const MAX_LINES = 200;
const lines: string[] = [];

export function pushLogLine(line: string): void {
  lines.push(line);
  if (lines.length > MAX_LINES) lines.shift();
}

export function getLogLines(): string[] {
  return [...lines];
}
