import { POST } from './route';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('@/lib/ai', () => ({
  askLocalAI: jest.fn().mockResolvedValue('{"name": "José Robson", "title": "Dev", "summary": "Fullstack", "skills": ["React"]}'),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    userProfile: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: '1', ...args.data })),
      update: jest.fn()
    }
  }
}));

describe('/api/upload-cv API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse PDF, invoke AI and save to database', async () => {
    
    // Read the fake.pdf from root
    const rootPath = path.resolve(process.cwd(), 'fake.pdf');
    const pdfBuffer = fs.readFileSync(rootPath);
    
    // Simulate File Buffer & FormData using Node Blob/File
    const mockFile = new Blob([pdfBuffer], { type: 'application/pdf' }) as File;
    const formData = new FormData();
    formData.append('cv', mockFile);
    formData.append('provider', 'gemini');

    // Simulate Request
    const request = new Request('http://localhost:3000/api/upload-cv', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const resultJson = await response.json();

    // Validations
    expect(response.status).toBe(200);
    expect(resultJson.message).toContain('com sucesso');
    
    // Prisma Create was called with structured parsed data
    const { prisma } = require('@/lib/prisma');
    expect(prisma.userProfile.create).toHaveBeenCalledWith({
      data: {
        name: 'José Robson',
        title: 'Dev',
        summary: 'Fullstack',
        skills: ['React']
      }
    });

    const { askLocalAI } = require('@/lib/ai');
    expect(askLocalAI).toHaveBeenCalled();
    const promptArg = askLocalAI.mock.calls[0][0];
    expect(promptArg).toContain('Hello World PDF Parser!');
  });

  it('should return 400 if no file is sent', async () => {
    const formData = new FormData();
    // Intentionally no CV

    const request = new Request('http://localhost:3000/api/upload-cv', {
      method: 'POST',
      body: formData
    });

    const response = await POST(request);
    const resultJson = await response.json();

    expect(response.status).toBe(400);
    expect(resultJson.error).toContain('Nenhum');
  });
});
