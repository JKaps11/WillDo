import superjson from 'superjson';
import type { Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TRPC_URL = `${BASE_URL}/api/trpc`;

interface SkillResult {
  id: string;
  name: string;
  color: string;
}

interface TaskResult {
  id: string;
  name: string;
}

/**
 * Call a tRPC mutation via the page's request context (carries auth cookies).
 * Uses SuperJSON to serialize input so Date objects are handled correctly.
 */
async function trpcMutate<T>(
  page: Page,
  procedure: string,
  input: unknown,
): Promise<T> {
  const serialized = superjson.serialize(input);
  const res = await page.request.post(`${TRPC_URL}/${procedure}`, {
    data: serialized,
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`tRPC ${procedure} failed (${res.status()}): ${text}`);
  }

  const body = await res.json();
  // SuperJSON wraps result in result.data.json + result.data.meta
  const data = body.result?.data;
  if (data && data.meta) {
    return superjson.deserialize(data) as T;
  }
  return data?.json ?? data ?? body;
}

async function trpcQuery<T>(
  page: Page,
  procedure: string,
  input: unknown,
): Promise<T> {
  const serialized = superjson.serialize(input);
  const encodedInput = encodeURIComponent(JSON.stringify(serialized));
  const res = await page.request.get(
    `${TRPC_URL}/${procedure}?input=${encodedInput}`,
  );

  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`tRPC ${procedure} failed (${res.status()}): ${text}`);
  }

  const body = await res.json();
  const data = body.result?.data;
  if (data && data.meta) {
    return superjson.deserialize(data) as T;
  }
  return data?.json ?? data ?? body;
}

export async function createSkillViaAPI(
  page: Page,
  opts: { name: string; color?: string },
): Promise<SkillResult> {
  return trpcMutate<SkillResult>(page, 'skill.create', {
    name: opts.name,
    color: opts.color ?? '#3b82f6',
  });
}

export async function deleteSkillViaAPI(
  page: Page,
  id: string,
): Promise<void> {
  await trpcMutate(page, 'skill.delete', { id });
}

export async function createTaskViaAPI(
  page: Page,
  opts: { name: string; subSkillId: string; todoListDate?: Date },
): Promise<TaskResult> {
  return trpcMutate<TaskResult>(page, 'task.create', {
    name: opts.name,
    subSkillId: opts.subSkillId,
    todoListDate: opts.todoListDate,
  });
}

export async function createSubSkillViaAPI(
  page: Page,
  opts: { skillId: string; name: string },
): Promise<{ id: string; name: string }> {
  return trpcMutate(page, 'subSkill.create', {
    skillId: opts.skillId,
    name: opts.name,
  });
}

/**
 * Delete all skills whose name starts with "E2E_" prefix.
 */
export async function deleteAllTestSkills(page: Page): Promise<void> {
  const skills = await trpcQuery<Array<{ id: string; name: string }>>(
    page,
    'skill.list',
    { includeArchived: true },
  );

  for (const skill of skills) {
    if (skill.name.startsWith('E2E_')) {
      await trpcMutate(page, 'skill.delete', { id: skill.id });
    }
  }
}
