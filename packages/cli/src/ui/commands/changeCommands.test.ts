/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, test, vi, beforeEach } from 'vitest';
import { changeCommands } from './changeCommands.js';
import type { CommandContext, MessageActionReturn } from './types.js';

// Mock services and utilities
const mockChangeTrackingService = {
  getChanges: vi.fn(),
  getLastChange: vi.fn(),
  revertAllChanges: vi.fn(),
  revertChange: vi.fn(),
  revertChangesForFile: vi.fn(),
  getChangesForFile: vi.fn(),
  clearChanges: vi.fn(),
};

const createMockCommandContext = (): CommandContext => {
  return {
    invocation: {
      raw: '/changes',
      name: 'changes',
      args: '',
    },
    services: {
      config: {
        getChangeTrackingService: () => mockChangeTrackingService,
      } as any,
      settings: {} as any,
      git: undefined,
      logger: {} as any,
    },
    ui: {
      addItem: vi.fn(),
      clear: vi.fn(),
      setDebugMessage: vi.fn(),
      pendingItem: null,
      setPendingItem: vi.fn(),
      toggleCorgiMode: vi.fn(),
      toggleVimEnabled: vi.fn(),
      loadHistory: vi.fn(),
      setGeminiMdFileCount: vi.fn(),
      reloadCommands: vi.fn(),
      extensionsUpdateState: new Map(),
      dispatchExtensionStateUpdate: vi.fn(),
      addConfirmUpdateExtensionRequest: vi.fn(),
    },
    session: {
      stats: {} as any,
      sessionShellAllowlist: new Set(),
    },
  } as unknown as CommandContext;
};

describe('Change Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/changes command', () => {
    test('should list no changes when there are no changes', async () => {
      mockChangeTrackingService.getChanges.mockReturnValue([]);
      
      const context = createMockCommandContext();
      const result = await changeCommands[0].action!(context, '');
      
      expect(result).toEqual({
        type: 'message',
        messageType: 'info',
        content: 'No changes have been made during this session.',
      });
    });

    test('should list changes when there are changes', async () => {
      mockChangeTrackingService.getChanges.mockReturnValue([
        {
          id: '1',
          filePath: '/path/to/file1.txt',
          operation: 'create',
          originalContent: null,
          newContent: 'content',
          timestamp: new Date('2023-01-01T10:00:00Z'),
          toolName: 'WriteFileTool',
        },
        {
          id: '2',
          filePath: '/path/to/file2.txt',
          operation: 'update',
          originalContent: 'old content',
          newContent: 'new content',
          timestamp: new Date('2023-01-01T10:01:00Z'),
          toolName: 'EditTool',
        },
      ]);
      
      const context = createMockCommandContext();
      const result = await changeCommands[0].action!(context, '');
      
      expect(result).toEqual({
        type: 'message',
        messageType: 'info',
        content: expect.stringContaining('File changes made during this session:'),
      });
      
      expect((result as MessageActionReturn).content).toContain('1. [10:00:00] CREATE: /path/to/file1.txt');
      expect((result as MessageActionReturn).content).toContain('2. [10:01:00] UPDATE: /path/to/file2.txt');
    });
  });

  describe('/revert command', () => {
    test('should revert all changes when "all" argument is provided', async () => {
      mockChangeTrackingService.getChanges.mockReturnValue([
        {
          id: '1',
          filePath: '/path/to/file.txt',
          operation: 'update',
          originalContent: 'old content',
          newContent: 'new content',
          timestamp: new Date(),
          toolName: 'EditTool',
        },
      ]);
      
      mockChangeTrackingService.revertAllChanges.mockResolvedValue(true);
      
      const context = createMockCommandContext();
      const result = await changeCommands[1].action!(context, 'all');
      
      expect(mockChangeTrackingService.revertAllChanges).toHaveBeenCalled();
      expect(result).toEqual({
        type: 'message',
        messageType: 'info',
        content: 'All changes have been reverted.',
      });
    });

    test('should revert last change when "last" argument is provided', async () => {
      const lastChange = {
        id: '123',
        filePath: '/path/to/file.txt',
        operation: 'update',
        originalContent: 'old content',
        newContent: 'new content',
        timestamp: new Date(),
        toolName: 'EditTool',
      };
      
      mockChangeTrackingService.getChanges.mockReturnValue([lastChange]);
      mockChangeTrackingService.getLastChange.mockReturnValue(lastChange);
      mockChangeTrackingService.revertChange.mockResolvedValue(true);
      
      const context = createMockCommandContext();
      const result = await changeCommands[1].action!(context, 'last');
      
      expect(mockChangeTrackingService.revertChange).toHaveBeenCalledWith('123');
      expect(result).toEqual({
        type: 'message',
        messageType: 'info',
        content: 'Last change to /path/to/file.txt has been reverted.',
      });
    });

    test('should revert by change number', async () => {
      const changes = [
        {
          id: '1',
          filePath: '/path/to/file1.txt',
          operation: 'create',
          originalContent: null,
          newContent: 'content',
          timestamp: new Date(),
          toolName: 'WriteFileTool',
        },
        {
          id: '2',
          filePath: '/path/to/file2.txt',
          operation: 'update',
          originalContent: 'old content',
          newContent: 'new content',
          timestamp: new Date(),
          toolName: 'EditTool',
        },
      ];
      
      mockChangeTrackingService.getChanges.mockReturnValue(changes);
      mockChangeTrackingService.revertChange.mockResolvedValue(true);
      
      const context = createMockCommandContext();
      const result = await changeCommands[1].action!(context, '2');
      
      expect(mockChangeTrackingService.revertChange).toHaveBeenCalledWith('2');
      expect(result).toEqual({
        type: 'message',
        messageType: 'info',
        content: 'Change #2 to /path/to/file2.txt has been reverted.',
      });
    });

    test('should revert changes for a specific file', async () => {
      const absolutePath = '/path/to/file.txt';
      mockChangeTrackingService.getChangesForFile.mockReturnValue([
        {
          id: '456',
          filePath: absolutePath,
          operation: 'update',
          originalContent: 'old content',
          newContent: 'new content',
          timestamp: new Date(),
          toolName: 'EditTool',
        },
      ]);
      mockChangeTrackingService.revertChangesForFile.mockResolvedValue(true);
      
      const context = createMockCommandContext();
      const result = await changeCommands[1].action!(context, absolutePath);
      
      expect(mockChangeTrackingService.getChangesForFile).toHaveBeenCalledWith(absolutePath);
      expect(mockChangeTrackingService.revertChangesForFile).toHaveBeenCalledWith(absolutePath);
      expect(result).toEqual({
        type: 'message',
        messageType: 'info',
        content: `All changes to ${absolutePath} have been reverted.`,
      });
    });
  });
});