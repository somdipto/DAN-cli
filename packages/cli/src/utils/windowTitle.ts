/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Computes the window title for the Qwen Code CLI application.
 *
 * @param folderName - The name of the current folder/workspace to display in the title
 * @returns The computed window title, either from CLI_TITLE environment variable or the default title
 */
export function computeWindowTitle(folderName: string): string {
  // Determine the command name from the executable
  const commandName = determineCommandName();
  const title = process.env['CLI_TITLE'] || `${commandName} - ${folderName}`;

  // Remove control characters that could cause issues in terminal titles
  return title.replace(
    // eslint-disable-next-line no-control-regex
    /[\x00-\x1F\x7F]/g,
    '',
  );
}

/**
 * Determines the command name used to invoke the CLI (either 'qwen' or 'dan')
 */
function determineCommandName(): string {
  if (process.argv[1]) {
    const commandPath = process.argv[1];
    if (commandPath.includes('dan')) {
      return 'Dan';
    }
  }
  return 'Qwen'; // Default to Qwen for backward compatibility
}
