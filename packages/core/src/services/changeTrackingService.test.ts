/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ChangeTrackingService } from '../../src/services/changeTrackingService.js';
import type { Config } from '../../src/config/config.js';

// Mock Config for testing
const createMockConfig = (): Config => {
  return {
    getChangeTrackingService: () => new ChangeTrackingService({} as Config),
  } as unknown as Config;
};

vi.mock('../../src/config/config.js', () => ({
  Config: vi.fn(),
}));

describe('ChangeTrackingService', () => {
  let config: Config;
  let changeTrackingService: ChangeTrackingService;

  beforeEach(() => {
    config = createMockConfig();
    changeTrackingService = new ChangeTrackingService(config);
  });

  test('should register a file creation change', async () => {
    const filePath = '/path/to/new-file.txt';
    const content = 'New file content';
    
    const changeId = await changeTrackingService.registerCreate(filePath, content, 'WriteFileTool');
    
    const changes = changeTrackingService.getChanges();
    expect(changes).toHaveLength(1);
    
    const change = changes[0];
    expect(change.id).toBe(changeId);
    expect(change.filePath).toBe(filePath);
    expect(change.operation).toBe('create');
    expect(change.originalContent).toBeNull();
    expect(change.newContent).toBe(content);
    expect(change.toolName).toBe('WriteFileTool');
  });

  test('should register a file update change', async () => {
    const filePath = '/path/to/existing-file.txt';
    const originalContent = 'Original content';
    const newContent = 'Updated content';
    
    const changeId = await changeTrackingService.registerUpdate(
      filePath, 
      originalContent, 
      newContent, 
      'EditTool'
    );
    
    const changes = changeTrackingService.getChanges();
    expect(changes).toHaveLength(1);
    
    const change = changes[0];
    expect(change.id).toBe(changeId);
    expect(change.filePath).toBe(filePath);
    expect(change.operation).toBe('update');
    expect(change.originalContent).toBe(originalContent);
    expect(change.newContent).toBe(newContent);
    expect(change.toolName).toBe('EditTool');
  });

  test('should register multiple changes', async () => {
    const filePath1 = '/path/to/file1.txt';
    const filePath2 = '/path/to/file2.txt';
    
    await changeTrackingService.registerCreate(filePath1, 'content1');
    await changeTrackingService.registerUpdate(filePath2, 'old', 'new');
    
    const changes = changeTrackingService.getChanges();
    expect(changes).toHaveLength(2);
  });

  test('should get changes for specific file', async () => {
    const filePath1 = '/path/to/file1.txt';
    const filePath2 = '/path/to/file2.txt';
    
    await changeTrackingService.registerCreate(filePath1, 'content1');
    await changeTrackingService.registerUpdate(filePath2, 'old', 'new');
    await changeTrackingService.registerUpdate(filePath1, 'old1', 'new1');
    
    const file1Changes = changeTrackingService.getChangesForFile(filePath1);
    expect(file1Changes).toHaveLength(2);
    
    const file2Changes = changeTrackingService.getChangesForFile(filePath2);
    expect(file2Changes).toHaveLength(1);
  });

  test('should get the last change', async () => {
    const filePath1 = '/path/to/file1.txt';
    const filePath2 = '/path/to/file2.txt';
    
    await changeTrackingService.registerCreate(filePath1, 'content1');
    const expectedChangeId = await changeTrackingService.registerUpdate(
      filePath2, 
      'old', 
      'new'
    );
    
    const lastChange = changeTrackingService.getLastChange();
    expect(lastChange).toBeDefined();
    expect(lastChange?.id).toBe(expectedChangeId);
    expect(lastChange?.filePath).toBe(filePath2);
  });

  test('should revert a file creation change', async () => {
    const filePath = '/tmp/test-create-revert.txt';
    const content = 'Test content for creation revert';
    
    // Write the file first
    await changeTrackingService.registerCreate(filePath, content);
    
    // Check that the change is tracked
    const changesBefore = changeTrackingService.getChanges();
    expect(changesBefore).toHaveLength(1);
    
    // The change tracking service itself doesn't write files, so we'll test 
    // the change tracking rather than actual file system changes
    const changeId = changesBefore[0].id;
    const success = await changeTrackingService.revertChange(changeId);
    
    expect(success).toBe(true);
    
    // After reverting, the change should no longer be tracked
    const changesAfter = changeTrackingService.getChanges();
    expect(changesAfter).toHaveLength(0);
  });

  test('should handle revert when change ID does not exist', async () => {
    const success = await changeTrackingService.revertChange('nonexistent-id');
    expect(success).toBe(false);
  });

  test('should clear all changes', () => {
    changeTrackingService.clearChanges();
    const changes = changeTrackingService.getChanges();
    expect(changes).toHaveLength(0);
  });

  test('should revert all changes', async () => {
    const filePath1 = '/path/to/file1.txt';
    const filePath2 = '/path/to/file2.txt';
    
    await changeTrackingService.registerCreate(filePath1, 'content1');
    await changeTrackingService.registerUpdate(filePath2, 'old', 'new');
    
    expect(changeTrackingService.getChanges()).toHaveLength(2);
    
    const success = await changeTrackingService.revertAllChanges();
    expect(success).toBe(true);
    
    const changesAfter = changeTrackingService.getChanges();
    expect(changesAfter).toHaveLength(0);
  });
});