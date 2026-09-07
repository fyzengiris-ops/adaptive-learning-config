import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { LogicSection, RequirementItem } from '@/data/requirements/schema';

const REGISTRY_FILES: Record<string, string> = {
  'knowledge-tree-related-exam': 'src/data/requirements/knowledge-tree-related-exam.registry.ts',
  'knowledge-tree-info-academic-requirement':
    'src/data/requirements/knowledge-tree-info-academic-requirement.registry.ts',
  'knowledge-tree-learning-resource-knowledge-card':
    'src/data/requirements/knowledge-tree-learning-resource-knowledge-card.registry.ts',
};

function overlayPath(registryId: string): string {
  return path.join(
    process.cwd(),
    'src/data/requirements/overlays',
    `${registryId}.json`
  );
}

function tsString(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n')}'`;
}

function formatLogicSections(sections: LogicSection[], indent: string): string {
  const i1 = indent;
  const i2 = `${indent}  `;
  const i3 = `${indent}    `;
  const i4 = `${indent}      `;
  const blocks = sections.map((section) => {
    const items =
      section.items.length === 0
        ? `${i3}items: [],`
        : `${i3}items: [\n${section.items.map((item) => `${i4}${tsString(item)},`).join('\n')}\n${i3}],`;
    return `${i2}{\n${i3}title: ${tsString(section.title)},\n${items}\n${i2}},`;
  });
  return `[\n${blocks.join('\n')}\n${i1}]`;
}

function findMatchingClose(source: string, openIndex: number): number {
  const pairs: Record<string, string> = { '[': ']', '{': '}', '(': ')' };
  const stack: string[] = [];
  let inStr: "'" | '"' | '`' | null = null;
  let escape = false;

  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i = source.indexOf('*/', i + 2);
      if (i < 0) return -1;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '[' || ch === '{' || ch === '(') {
      stack.push(ch);
      continue;
    }
    if (ch === ']' || ch === '}' || ch === ')') {
      const open = stack.pop();
      if (!open || pairs[open] !== ch) return -1;
      if (stack.length === 0) return i;
    }
  }
  return -1;
}

function patchRequirementInSource(
  source: string,
  requirementId: string,
  title: string,
  logicSections: LogicSection[]
): string | null {
  const idToken = `id: '${requirementId}'`;
  const idPos = source.indexOf(idToken);
  if (idPos < 0) return null;

  const afterId = source.slice(idPos);
  const titleMatch = afterId.match(/title:\s*'((?:\\'|[^'])*)'/);
  if (!titleMatch || titleMatch.index === undefined) return null;
  const titleStart = idPos + titleMatch.index;
  const titleEnd = titleStart + titleMatch[0].length;
  let next = `${source.slice(0, titleStart)}title: ${tsString(title)}${source.slice(titleEnd)}`;

  const sectionsToken = 'logicSections:';
  const sectionsPos = next.indexOf(sectionsToken, idPos);
  const nextIdPos = next.indexOf("id: '", idPos + idToken.length);
  if (sectionsPos < 0 || (nextIdPos >= 0 && sectionsPos > nextIdPos)) return null;

  const arrayStart = next.indexOf('[', sectionsPos);
  if (arrayStart < 0) return null;
  const arrayEnd = findMatchingClose(next, arrayStart);
  if (arrayEnd < 0) return null;

  const lineStart = next.lastIndexOf('\n', sectionsPos) + 1;
  const indent = next.slice(lineStart, sectionsPos);
  const formatted = formatLogicSections(logicSections, indent);
  next = `${next.slice(0, arrayStart)}${formatted}${next.slice(arrayEnd + 1)}`;
  return next;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      registryId?: string;
      requirementId?: string;
      title?: string;
      logicSections?: LogicSection[];
    };
    const registryId = body.registryId?.trim();
    const requirementId = body.requirementId?.trim();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const logicSections = Array.isArray(body.logicSections) ? body.logicSections : null;

    if (!registryId || !requirementId || !title || !logicSections) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    const overlayFile = overlayPath(registryId);
    fs.mkdirSync(path.dirname(overlayFile), { recursive: true });
    let overlay: Record<string, { title?: string; logicSections?: LogicSection[] }> = {};
    if (fs.existsSync(overlayFile)) {
      try {
        overlay = JSON.parse(fs.readFileSync(overlayFile, 'utf-8') || '{}');
      } catch {
        overlay = {};
      }
    }
    overlay[requirementId] = { title, logicSections };
    fs.writeFileSync(overlayFile, `${JSON.stringify(overlay, null, 2)}\n`, 'utf-8');

    const relative = REGISTRY_FILES[registryId];
    if (!relative) {
      return NextResponse.json({ ok: true, persisted: 'overlay' });
    }

    const registryFile = path.join(process.cwd(), relative);
    if (!fs.existsSync(registryFile)) {
      return NextResponse.json({ ok: true, persisted: 'overlay' });
    }

    const source = fs.readFileSync(registryFile, 'utf-8');
    const patched = patchRequirementInSource(source, requirementId, title, logicSections);
    if (!patched) {
      return NextResponse.json({ ok: true, persisted: 'overlay' });
    }
    fs.writeFileSync(registryFile, patched, 'utf-8');
    return NextResponse.json({ ok: true, persisted: 'registry' });
  } catch (error) {
    return NextResponse.json(
      { error: `保存失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
