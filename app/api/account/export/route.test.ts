/** @jest-environment node */
import { GET } from './route';

jest.mock('@/lib/auth/live-session', () => ({ getLiveSession: jest.fn() }));
jest.mock('@/lib/services/account-data.registry', () => ({ readExportUser: jest.fn() }));
jest.mock('@/lib/services/account-data.service', () => ({ exportAccountChunks: jest.fn() }));

import { getLiveSession } from '@/lib/auth/live-session';
import { readExportUser } from '@/lib/services/account-data.registry';
import { exportAccountChunks } from '@/lib/services/account-data.service';

const mockSession = getLiveSession as jest.Mock;
const mockReadUser = readExportUser as jest.Mock;
const mockChunks = exportAccountChunks as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.mockResolvedValue({ userId: 'u1', role: 'MEMBER', isActive: true });
  mockReadUser.mockResolvedValue({ id: 'u1' });
  mockChunks.mockImplementation(async function* () {
    yield '{"a":';
    yield '1}';
  });
});

describe('GET /api/account/export', () => {
  it('returns 401 for a user pending deletion (live session is null)', async () => {
    mockSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 for anonymous callers', async () => {
    mockSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockReadUser).not.toHaveBeenCalled();
  });

  it('returns 500 JSON when the first read fails', async () => {
    mockReadUser.mockRejectedValue(new Error('db down'));
    const res = await GET();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Export failed' });
  });

  it('returns 404 when the user row no longer exists', async () => {
    mockReadUser.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('streams the chunks as a JSON attachment', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toMatch(/^attachment; filename="mywork-export-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    await expect(res.text()).resolves.toBe('{"a":1}');
    expect(mockChunks).toHaveBeenCalledWith('u1', { id: 'u1' }, expect.any(Date));
  });
});

describe('GET /api/account/export (extra)', () => {
  it('reads only the session user', async () => {
    await GET();
    expect(mockReadUser).toHaveBeenCalledWith('u1');
  });

  it('errors the stream (not a silent truncation) when a chunk fails mid-way', async () => {
    mockChunks.mockImplementation(async function* () {
      yield '{"a":';
      throw new Error('db down');
    });
    const res = await GET();
    await expect(res.text()).rejects.toThrow('db down');
  });

  it('stops the generator when the client cancels', async () => {
    const ret = jest.fn().mockResolvedValue({ done: true, value: undefined });
    mockChunks.mockReturnValue({ next: jest.fn().mockResolvedValue({ done: false, value: '{' }), return: ret });
    const res = await GET();
    await res.body!.cancel();
    expect(ret).toHaveBeenCalled();
  });
});
