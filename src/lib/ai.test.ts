import { askLocalAI, analyzeProjectCommits } from './ai';
import * as child_process from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, options, callback) => callback(null, { stdout: 'Mock AI Response', stderr: '' })),
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('AI Local CLI Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('askLocalAI should create a temp file and call Gemini CLI via shell', async () => {
    const prompt = 'Test Prompt';
    const result = await askLocalAI(prompt, 'gemini');

    // Should write file
    expect(fs.writeFile).toHaveBeenCalled();
    const filePathArg = (fs.writeFile as jest.Mock).mock.calls[0][0];
    const fileContentArg = (fs.writeFile as jest.Mock).mock.calls[0][1];
    
    expect(filePathArg).toContain(path.join('.next', 'prompt_'));
    expect(fileContentArg).toBe(prompt);

    // Should execute child_process with type pipe
    expect(child_process.exec).toHaveBeenCalled();
    const cmdArg = (child_process.exec as jest.Mock).mock.calls[0][0];
    expect(cmdArg).toContain(`cmd /c "type ${filePathArg} | gemini"`);

    // Should clean up file
    expect(fs.unlink).toHaveBeenCalledWith(filePathArg);
    
    // Result matches stdout
    expect(result).toBe('Mock AI Response');
  });

  it('askLocalAI should support Claude CLI', async () => {
    await askLocalAI('test', 'claude');
    const cmdArg = (child_process.exec as jest.Mock).mock.calls[0][0];
    expect(cmdArg).toContain(`| claude"`);
  });

  it('analyzeProjectCommits should format a specific JSON prompt', async () => {
    const diff = 'diff --git a/file b/file';
    await analyzeProjectCommits(diff, 'gemini');
    
    const promptArg = (fs.writeFile as jest.Mock).mock.calls[0][1];
    expect(promptArg).toContain('focado no que o desenvolvedor implementou');
    expect(promptArg).toContain('technologies');
    expect(promptArg).toContain(diff);
  });
});
