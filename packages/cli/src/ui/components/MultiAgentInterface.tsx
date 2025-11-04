/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgenticSocietyManager } from '@qwen-code/qwen-code-core';

import { Text, Box } from 'ink';
import { useState, useEffect } from 'react';

interface MultiAgentInterfaceProps {
  societyManager: AgenticSocietyManager;
}

export const MultiAgentInterface = ({ societyManager }: MultiAgentInterfaceProps) => {
  const [status, setStatus] = useState('Initializing agentic society...');
  const [societyStats, setSocietyStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSociety = async () => {
      try {
        await societyManager.initialize();
        await societyManager.start();
        
        setStatus('Agentic society is running');
        setSocietyStats(societyManager.getSocietyStats());
      } catch (err) {
        setError(`Error initializing society: ${err}`);
        setStatus('Error');
      }
    };

    initializeSociety();

    // Clean up when component unmounts
    return () => {
      // In a real implementation, we would properly stop the society
      // societyManager.stop();
    };
  }, []);

  if (error) {
    return <Box><Text color="red">{error}</Text></Box>;
  }

  return (
    <Box flexDirection="column">
      <Text color="green">DAN Agentic Society</Text>
      <Text>Status: {status}</Text>
      {societyStats && (
        <Box flexDirection="column">
          <Text>Agents: {societyStats.totalAgents}</Text>
          <Text>Departments: {societyStats.departments?.length}</Text>
          <Text>Projects: {societyStats.projects}</Text>
          <Text>Knowledge Nodes: {societyStats.knowledgeGraphSize?.nodes}</Text>
          <Text>Knowledge Edges: {societyStats.knowledgeGraphSize?.edges}</Text>
        </Box>
      )}
      <Text color="gray">Press Ctrl+C to exit</Text>
    </Box>
  );
};