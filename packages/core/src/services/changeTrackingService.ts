/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { type Config } from '../config/config.js';

/**
 * Represents a single file modification change
 */
export interface FileChange {
  id: string;
  filePath: string;
  operation: 'create' | 'update' | 'delete';
  originalContent: string | null;
  newContent: string | null;
  timestamp: Date;
  toolName?: string;
}

/**
 * Service for tracking file changes during CLI sessions
 */
export class ChangeTrackingService {
  private changes: FileChange[] = [];
  private changeListeners: Array<(change: FileChange) => void> = [];

  constructor(_config: Config) {
    // Config parameter is reserved for future use
  }

  /**
   * Add a listener for when changes occur
   */
  addChangeListener(listener: (change: FileChange) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove a listener for changes
   */
  removeChangeListener(listener: (change: FileChange) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Notify listeners about a change
   */
  private notifyChangeListeners(change: FileChange): void {
    for (const listener of this.changeListeners) {
      try {
        listener(change);
      } catch (error) {
        console.error('Error in change listener:', error);
      }
    }
  }

  /**
   * Register a file creation change
   */
  async registerCreate(
    filePath: string,
    newContent: string,
    toolName?: string
  ): Promise<string> {
    const changeId = this.generateId();
    const change: FileChange = {
      id: changeId,
      filePath,
      operation: 'create',
      originalContent: null,
      newContent,
      timestamp: new Date(),
      toolName,
    };

    this.changes.push(change);
    this.notifyChangeListeners(change);
    return changeId;
  }

  /**
   * Register a file update change
   */
  async registerUpdate(
    filePath: string,
    originalContent: string,
    newContent: string,
    toolName?: string
  ): Promise<string> {
    // Check if there's already a change for this file in the current session
    const existingChangeIndex = this.changes.findIndex(
      (change) => change.filePath === filePath
    );

    if (existingChangeIndex !== -1) {
      // If there's an existing change, update it
      const existingChange = this.changes[existingChangeIndex];
      const changeId = this.generateId();
      const updatedChange: FileChange = {
        id: changeId,
        filePath,
        operation: 'update',
        originalContent: existingChange.originalContent, // Preserve original from first change
        newContent,
        timestamp: new Date(),
        toolName,
      };
      
      // Replace the existing change
      this.changes[existingChangeIndex] = updatedChange;
      this.notifyChangeListeners(updatedChange);
      return changeId;
    } else {
      // Register as a new change
      const changeId = this.generateId();
      const change: FileChange = {
        id: changeId,
        filePath,
        operation: 'update',
        originalContent,
        newContent,
        timestamp: new Date(),
        toolName,
      };

      this.changes.push(change);
      this.notifyChangeListeners(change);
      return changeId;
    }
  }

  /**
   * Register a file deletion change
   */
  async registerDelete(
    filePath: string,
    originalContent: string,
    toolName?: string
  ): Promise<string> {
    const changeId = this.generateId();
    const change: FileChange = {
      id: changeId,
      filePath,
      operation: 'delete',
      originalContent,
      newContent: null,
      timestamp: new Date(),
      toolName,
    };

    this.changes.push(change);
    this.notifyChangeListeners(change);
    return changeId;
  }

  /**
   * Get all tracked changes
   */
  getChanges(): FileChange[] {
    return [...this.changes];
  }

  /**
   * Get changes for a specific file
   */
  getChangesForFile(filePath: string): FileChange[] {
    return this.changes.filter((change) => change.filePath === filePath);
  }

  /**
   * Get the most recent change
   */
  getLastChange(): FileChange | undefined {
    return this.changes.length > 0 ? this.changes[this.changes.length - 1] : undefined;
  }

  /**
   * Revert a specific change by ID
   */
  async revertChange(changeId: string): Promise<boolean> {
    const changeIndex = this.changes.findIndex((change) => change.id === changeId);

    if (changeIndex === -1) {
      return false; // Change not found
    }

    const change = this.changes[changeIndex];

    try {
      if (change.operation === 'create') {
        // For create operations, we delete the file
        if (fs.existsSync(change.filePath)) {
          fs.unlinkSync(change.filePath);
        }
      } else if (change.operation === 'delete') {
        // For delete operations, we restore the original content
        if (change.originalContent !== null) {
          const dirName = path.dirname(change.filePath);
          if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
          }
          fs.writeFileSync(change.filePath, change.originalContent);
        }
      } else if (change.operation === 'update' && change.originalContent !== null) {
        // For update operations, we restore the original content
        fs.writeFileSync(change.filePath, change.originalContent);
      }

      // Remove the change from tracking
      this.changes.splice(changeIndex, 1);
      return true;
    } catch (error) {
      console.error(`Failed to revert change ${changeId}:`, error);
      return false;
    }
  }

  /**
   * Revert all changes
   */
  async revertAllChanges(): Promise<boolean> {
    // Process changes in reverse order to avoid conflicts
    const changesCopy = [...this.changes].reverse();
    
    for (const change of changesCopy) {
      await this.revertChange(change.id);
    }

    return true;
  }

  /**
   * Revert changes for a specific file
   */
  async revertChangesForFile(filePath: string): Promise<boolean> {
    const fileChanges = this.changes.filter((change) => change.filePath === filePath);
    
    for (const change of fileChanges) {
      await this.revertChange(change.id);
    }

    return true;
  }

  /**
   * Clear all tracked changes
   */
  clearChanges(): void {
    this.changes = [];
  }

  /**
   * Generate a unique ID for a change
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}