import { extractGitLogs } from './git';
import * as child_process from 'child_process';
import { promisify } from 'util';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, options, callback) => callback(null, { stdout: 'mocked logs', stderr: '' })),
}));

describe('Git Analyzer Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call git log with correct parameters', async () => {
    const repoPath = '/test/repo';
    const author = 'jose.robson';
    
    const logs = await extractGitLogs(repoPath, author, 6);

    expect(child_process.exec).toHaveBeenCalled();
    const cmdArg = (child_process.exec as jest.Mock).mock.calls[0][0];
    const optionsArg = (child_process.exec as jest.Mock).mock.calls[0][1];

    expect(cmdArg).toContain('git log');
    expect(cmdArg).toContain(`--author="jose.robson"`);
    expect(cmdArg).toContain(`--since="6 months ago"`);
    expect(cmdArg).toContain(`--stat -p`);
    
    expect(optionsArg.cwd).toBe(repoPath);
    expect(logs).toBe('mocked logs');
  });

  it('should throw an error if git log fails', async () => {
    (child_process.exec as jest.Mock).mockImplementationOnce((cmd, options, callback) => {
      callback(new Error('Git failed'), { stdout: '', stderr: 'fatal error' });
    });

    await expect(extractGitLogs('/test/repo', 'jose.robson', 6)).rejects.toThrow('Git failed');
  });
});
