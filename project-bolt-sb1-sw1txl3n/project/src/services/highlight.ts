/**
 * Minimal, dependency-free syntax highlighter.
 *
 * Produces an array of {text, type} tokens for a small subset of languages
 * (shell/bash, powershell, js/ts). Good enough for demo code blocks; a real
 * integration would swap in Shiki or highlight.js.
 */

export type TokenType = 'plain' | 'comment' | 'keyword' | 'string' | 'number' | 'function';

export interface Token {
  text: string;
  type: TokenType;
}

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'import', 'from', 'export', 'default', 'async', 'await', 'try', 'catch',
  'throw', 'new', 'class', 'extends', 'super', 'this', 'typeof', 'instanceof',
  'Get-ItemProperty', 'Select-Object', 'tail', 'git', 'npm', 'node', 'cd',
]);

export function tokenize(code: string, _language: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = code.length;

  while (i < n) {
    const ch = code[i];
    const rest = code.slice(i);

    // Comment — # or //
    if (ch === '#' || (ch === '/' && code[i + 1] === '/')) {
      const end = code.indexOf('\n', i);
      const stop = end === -1 ? n : end;
      tokens.push({ text: code.slice(i, stop), type: 'comment' });
      i = stop;
      continue;
    }

    // String — " ' `
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let j = i + 1;
      while (j < n && code[j] !== quote) {
        if (code[j] === '\\') j++;
        j++;
      }
      tokens.push({ text: code.slice(i, Math.min(j + 1, n)), type: 'string' });
      i = j + 1;
      continue;
    }

    // Number
    if (/[0-9]/.test(ch)) {
      const match = rest.match(/^[0-9]+(\.[0-9]+)?/);
      if (match) {
        tokens.push({ text: match[0], type: 'number' });
        i += match[0].length;
        continue;
      }
    }

    // Identifier / keyword / function
    if (/[A-Za-z_$]/.test(ch)) {
      const match = rest.match(/^[A-Za-z_$][A-Za-z0-9_$-]*/);
      if (match) {
        const word = match[0];
        const after = code[i + word.length];
        let type: TokenType = 'plain';
        if (KEYWORDS.has(word)) type = 'keyword';
        else if (after === '(') type = 'function';
        tokens.push({ text: word, type });
        i += word.length;
        continue;
      }
    }

    // Default: accumulate a run of "plain" punctuation
    let j = i;
    while (j < n && !/[\sA-Za-z0-9_$"'`#]/.test(code[j]) && !(code[j] === '/' && code[j + 1] === '/')) {
      j++;
    }
    if (j === i) j++;
    tokens.push({ text: code.slice(i, j), type: 'plain' });
    i = j;
  }

  return tokens;
}

const TYPE_CLASS: Record<TokenType, string> = {
  plain: 'text-white/80',
  comment: 'text-white/35 italic',
  keyword: 'text-accent-ice',
  string: 'text-emerald-300/90',
  number: 'text-amber-300/90',
  function: 'text-accent-violet',
};

export function tokenClass(type: TokenType): string {
  return TYPE_CLASS[type];
}
