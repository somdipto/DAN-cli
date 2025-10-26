/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandKind } from './types.js';
import type {
  CommandContext,
  MessageActionReturn,
  SlashCommand,
} from './types.js';


const formatChange = (change: any, index: number): string => { // Using any to avoid complex import issues
  const timestamp = change.timestamp.toLocaleTimeString();
  const operation = change.operation.toUpperCase();
  const colorStart = '\u001b[36m'; // Cyan color
  const colorReset = '\u001b[0m'; // Reset color

  return `${colorStart}${index + 1}.${colorReset} [${timestamp}] ${operation}: ${change.filePath}`;
};

const changesCommand: SlashCommand = {
  name: 'changes',
  description: 'List all file changes made during this session',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext): Promise<MessageActionReturn> => {
    const config = context.services.config;
    if (!config) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Configuration service not available',
      };
    }
    const changeTrackingService = config.getChangeTrackingService();
    const changes = changeTrackingService.getChanges();

    if (changes.length === 0) {
      return {
        type: 'message',
        messageType: 'info',
        content: 'No changes have been made during this session.',
      };
    }

    const changesList = changes
      .map((change, index) => formatChange(change, index))
      .join('\n');

    return {
      type: 'message',
      messageType: 'info',
      content: `File changes made during this session:\n\n${changesList}`,
    };
  },
};

const revertCommand: SlashCommand = {
  name: 'revert',
  description: 'Revert changes made during this session. Usage: /revert [last|all|<file_path>|<change_number>]',
  kind: CommandKind.BUILT_IN,
  action: async (
    context: CommandContext,
    args: string
  ): Promise<MessageActionReturn> => {
    const config = context.services.config;
    if (!config) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Configuration service not available',
      };
    }
    const changeTrackingService = config.getChangeTrackingService();
    const changes = changeTrackingService.getChanges();
    
    if (changes.length === 0) {
      return {
        type: 'message',
        messageType: 'info',
        content: 'No changes available to revert.',
      };
    }

    const arg = args.trim().toLowerCase();

    if (arg === 'all') {
      // Revert all changes
      await changeTrackingService.revertAllChanges();
      return {
        type: 'message',
        messageType: 'info',
        content: 'All changes have been reverted.',
      };
    } else if (arg === 'last' || arg === '') {
      // Revert last change
      const lastChange = changeTrackingService.getLastChange();
      if (lastChange) {
        const success = await changeTrackingService.revertChange(lastChange.id);
        if (success) {
          return {
            type: 'message',
            messageType: 'info',
            content: `Last change to ${lastChange.filePath} has been reverted.`,
          };
        } else {
          return {
            type: 'message',
            messageType: 'error',
            content: 'Failed to revert the last change.',
          };
        }
      } else {
        return {
          type: 'message',
          messageType: 'info',
          content: 'No changes available to revert.',
        };
      }
    } else if (!isNaN(parseInt(arg))) {
      // Revert change by number
      const changeIndex = parseInt(arg) - 1;
      if (changeIndex >= 0 && changeIndex < changes.length) {
        const change = changes[changeIndex];
        const success = await changeTrackingService.revertChange(change.id);
        if (success) {
          return {
            type: 'message',
            messageType: 'info',
            content: `Change #${arg} to ${change.filePath} has been reverted.`,
          };
        } else {
          return {
            type: 'message',
            messageType: 'error',
            content: `Failed to revert change #${arg}.`,
          };
        }
      } else {
        return {
          type: 'message',
          messageType: 'error',
          content: `Invalid change number: ${arg}. Please specify a number between 1 and ${changes.length}.`,
        };
      }
    } else {
      // Revert changes for a specific file
      try {
        // Verify the file path is valid before attempting to revert
        const path = require('node:path');
        const absolutePath = path.isAbsolute(arg) ? arg : path.resolve(arg);
        
        const changesForFile = changeTrackingService.getChangesForFile(absolutePath);
        if (changesForFile.length > 0) {
          const success = await changeTrackingService.revertChangesForFile(absolutePath);
          if (success) {
            return {
              type: 'message',
              messageType: 'info',
              content: `All changes to ${absolutePath} have been reverted.`,
            };
          } else {
            return {
              type: 'message',
              messageType: 'error',
              content: `Failed to revert changes for ${absolutePath}.`,
            };
          }
        } else {
          return {
            type: 'message',
            messageType: 'info',
            content: `No changes found for file: ${absolutePath}.`,
          };
        }
      } catch (error) {
        return {
          type: 'message',
          messageType: 'error',
          content: `Error processing file path: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  },
};

export const changeCommands = [
  changesCommand,
  revertCommand,
];