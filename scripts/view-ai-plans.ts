import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const RESULTS_ROOT = join(import.meta.dir, 'ai-plan-results');

interface SubSkill {
  name: string;
  description: string;
  parentIndex: number | null;
  metrics: Array<{
    name: string;
    unit: string | null;
    targetValue: number;
  }>;
}

interface TestResult {
  testInput: {
    skillName: string;
    goal: string;
    currentLevel?: string;
    additionalContext?: string;
    effort: string;
  };
  usage: { inputTokens: number; outputTokens: number; cost: string };
  subSkills: SubSkill[];
}

function buildTree(
  subSkills: SubSkill[],
  parentIndex: number | null = null,
  depth: number = 0,
): string {
  const children = subSkills
    .map((ss, i) => ({ ss, i }))
    .filter(({ ss }) => ss.parentIndex === parentIndex);

  if (children.length === 0) return '';

  let html = `<ul class="tree-list depth-${depth}">`;
  for (const { ss, i } of children) {
    const metrics = ss.metrics
      .map(
        (m) =>
          `<span class="metric">${esc(m.name)}: ${m.targetValue}${m.unit ? ' ' + esc(m.unit) : ''}</span>`,
      )
      .join('');

    html += `<li>
      <div class="node">
        <strong class="node-name">${esc(ss.name)}</strong>
        <span class="node-index">#${i}</span>
        <p class="node-desc">${esc(ss.description)}</p>
        <div class="metrics">${metrics}</div>
      </div>
      ${buildTree(subSkills, i, depth + 1)}
    </li>`;
  }
  html += '</ul>';
  return html;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPlan(result: TestResult, filename: string): string {
  const { testInput: input, usage, subSkills } = result;
  const tree = buildTree(subSkills);

  return `
    <div class="plan">
      <div class="plan-header">
        <h2>${esc(input.skillName)}</h2>
        <div class="badges">
          <span class="badge effort-${input.effort}">${input.effort}</span>
          <span class="badge">${subSkills.length} sub-skills</span>
          <span class="badge">$${usage.cost}</span>
          <span class="badge">${usage.inputTokens + usage.outputTokens} tokens</span>
        </div>
      </div>
      <div class="plan-meta">
        <div><strong>Goal:</strong> ${esc(input.goal)}</div>
        ${input.currentLevel ? `<div><strong>Current level:</strong> ${esc(input.currentLevel)}</div>` : ''}
        ${input.additionalContext ? `<div><strong>Context:</strong> ${esc(input.additionalContext)}</div>` : ''}
      </div>
      <details open>
        <summary>Skill Tree</summary>
        ${tree}
      </details>
    </div>`;
}

function htmlPage(title: string, plansHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a; color: #e5e5e5;
    padding: 2rem; max-width: 1200px; margin: 0 auto;
    line-height: 1.5;
  }
  h1 { font-size: 1.5rem; margin-bottom: 1.5rem; color: #fff; }
  .plan {
    background: #141414; border: 1px solid #262626; border-radius: 12px;
    padding: 1.5rem; margin-bottom: 1.5rem;
  }
  .plan-header { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
  .plan-header h2 { font-size: 1.2rem; color: #fff; }
  .badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .badge {
    font-size: 0.7rem; padding: 2px 8px; border-radius: 9999px;
    background: #262626; color: #a3a3a3; font-weight: 500;
  }
  .effort-minimal { background: #1c1917; color: #a8a29e; }
  .effort-moderate { background: #172554; color: #93c5fd; }
  .effort-detailed { background: #14532d; color: #86efac; }
  .plan-meta { font-size: 0.85rem; color: #a3a3a3; margin-bottom: 1rem; }
  .plan-meta div { margin-bottom: 0.25rem; }
  .plan-meta strong { color: #d4d4d4; }
  details summary {
    cursor: pointer; font-weight: 600; font-size: 0.9rem;
    color: #a3a3a3; margin-bottom: 0.75rem;
  }
  .tree-list {
    list-style: none; padding-left: 1.25rem;
    border-left: 2px solid #262626;
  }
  .tree-list.depth-0 { padding-left: 0; border-left: none; }
  .tree-list li { margin-bottom: 0.75rem; }
  .node {
    background: #1a1a1a; border: 1px solid #303030; border-radius: 8px;
    padding: 0.75rem 1rem;
  }
  .node-name { color: #fff; font-size: 0.9rem; }
  .node-index { font-size: 0.7rem; color: #525252; margin-left: 0.5rem; }
  .node-desc { font-size: 0.8rem; color: #a3a3a3; margin-top: 0.25rem; }
  .metrics { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
  .metric {
    font-size: 0.7rem; padding: 2px 8px; border-radius: 6px;
    background: #1e1b4b; color: #a5b4fc;
  }
</style>
</head>
<body>
  <h1>${esc(title)}</h1>
  ${plansHtml}
</body>
</html>`;
}

async function main(): Promise<void> {
  // Determine which test folder to view
  const arg = process.argv[2];
  let targetDir: string;

  if (arg) {
    targetDir = join(RESULTS_ROOT, arg.startsWith('test-') ? arg : `test-${arg}`);
  } else {
    // Latest test folder
    const entries = await readdir(RESULTS_ROOT);
    const testDirs = entries
      .filter((e) => e.startsWith('test-'))
      .sort((a, b) => {
        const na = parseInt(a.replace('test-', ''), 10);
        const nb = parseInt(b.replace('test-', ''), 10);
        return nb - na;
      });
    if (testDirs.length === 0) {
      console.error('No test results found. Run bun run test:ai first.');
      process.exit(1);
    }
    targetDir = join(RESULTS_ROOT, testDirs[0]);
  }

  const folderName = targetDir.split('/').pop()!;
  console.log(`Reading results from ${targetDir}`);

  const files = (await readdir(targetDir))
    .filter((f) => f.endsWith('.json'))
    .sort();

  const plans: string[] = [];
  for (const file of files) {
    const raw = await readFile(join(targetDir, file), 'utf-8');
    const result: TestResult = JSON.parse(raw);
    plans.push(renderPlan(result, file));
  }

  const outPath = join(targetDir, 'index.html');
  await writeFile(outPath, htmlPage(`AI Plan Results — ${folderName}`, plans.join('\n')));

  console.log(`Generated ${outPath}`);

  const { spawn } = await import('node:child_process');
  spawn('xdg-open', [outPath], { detached: true, stdio: 'ignore' }).unref();
}

main();
