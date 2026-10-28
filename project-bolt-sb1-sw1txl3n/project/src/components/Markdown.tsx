import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { tokenize, tokenClass } from '@/services/highlight';

interface MarkdownProps {
  content: string;
}

/**
 * Lightweight markdown renderer — handles the subset AI models commonly emit:
 * headings, bold, italic, inline code, fenced code blocks, ordered/unordered
 * lists, blockquotes, and paragraphs. No external dependency.
 */
export function Markdown({ content }: MarkdownProps) {
  const blocks = parseBlocks(content);
  return (
    <div className="prose-ns text-[12.5px]">
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  );
}

type Block =
  | { type: 'code'; lang: string; code: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'paragraph'; text: string };

function parseBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // Empty line
    if (trimmed === '') {
      i++;
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.slice(2) });
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Paragraph — accumulate consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('> ') &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'code':
      return <CodeBlock code={block.code} lang={block.lang} />;
    case 'heading': {
      const Tag = (`h${block.level}` as 'h1' | 'h2' | 'h3');
      return <Tag>{renderInline(block.text)}</Tag>;
    }
    case 'quote':
      return <blockquote>{renderInline(block.text)}</blockquote>;
    case 'ul':
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    case 'paragraph':
      return <p>{renderInline(block.text)}</p>;
  }
}

/** Render inline markdown: **bold**, *italic*, `code`, [links](url) */
function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const patterns: { regex: RegExp; render: (m: RegExpMatchArray) => React.ReactNode }[] = [
    {
      regex: /\*\*(.+?)\*\*/,
      render: (m) => <strong key={key++}>{m[1]}</strong>,
    },
    {
      regex: /\*(.+?)\*/,
      render: (m) => <em key={key++}>{m[1]}</em>,
    },
    {
      regex: /`([^`]+)`/,
      render: (m) => <code key={key++}>{m[1]}</code>,
    },
    {
      regex: /\[([^\]]+)\]\(([^)]+)\)/,
      render: (m) => (
        <a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      ),
    },
  ];

  while (remaining.length > 0) {
    let earliestIndex = -1;
    let earliestMatch: RegExpMatchArray | null = null;
    let earliestRender: ((m: RegExpMatchArray) => React.ReactNode) | null = null;

    for (const p of patterns) {
      const m = remaining.match(p.regex);
      if (m && m.index !== undefined && (earliestIndex === -1 || m.index < earliestIndex)) {
        earliestIndex = m.index;
        earliestMatch = m;
        earliestRender = p.render;
      }
    }

    if (earliestMatch && earliestRender && earliestIndex > 0) {
      tokens.push(<span key={key++}>{remaining.slice(0, earliestIndex)}</span>);
      tokens.push(earliestRender(earliestMatch));
      remaining = remaining.slice(earliestIndex + earliestMatch[0].length);
    } else if (earliestMatch && earliestRender) {
      tokens.push(earliestRender(earliestMatch));
      remaining = remaining.slice(earliestMatch[0].length);
    } else {
      tokens.push(<span key={key++}>{remaining}</span>);
      remaining = '';
    }
  }

  return tokens;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="group relative my-2.5 overflow-hidden rounded-xl border border-white/8 bg-ink-950/60 dark:border-white/8 dark:bg-ink-950/60">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5 dark:border-white/[0.06]">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/35 dark:text-white/35">
          {lang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70 dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={11} strokeWidth={2} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={11} strokeWidth={1.75} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 text-[11.5px] leading-relaxed">
        <code className="font-mono">
          {lines.map((line, li) => (
            <div key={li} className="flex">
              <span className="mr-3 w-4 shrink-0 select-none text-right text-white/20 dark:text-white/20">
                {li + 1}
              </span>
              <span className="whitespace-pre text-white/80 dark:text-white/80">
                {line.length === 0 ? ' ' : tokenize(line, lang).map((tok, ti) => (
                  <span key={ti} className={tokenClass(tok.type)}>
                    {tok.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
