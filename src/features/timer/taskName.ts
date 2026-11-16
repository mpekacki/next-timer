// Invisible characters that often ride along when copying text from web pages,
// chat apps or word processors. String.prototype.trim() does not remove them.
//   U+200B zero width space, U+2060 word joiner, U+FEFF zero width no-break space (BOM)
const INVISIBLE_ANYWHERE = /[​⁠﻿]/g

// U+200C (ZWNJ) and U+200D (ZWJ) carry meaning inside text (e.g. Persian script,
// emoji sequences like 👨‍👩‍👧), so they are only stripped from the edges.
const EDGE_JUNK = /^[\s‌‍]+|[\s‌‍]+$/g

export function normalizeTaskName(name: string): string {
  return name
    .replace(INVISIBLE_ANYWHERE, '')
    .replace(/\s+/g, ' ')
    .replace(EDGE_JUNK, '')
}
