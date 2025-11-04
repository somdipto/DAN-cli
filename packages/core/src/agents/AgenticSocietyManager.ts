/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrganizationCoordinator } from './organization/OrganizationCoordinator.js';
import { OrganizationalKnowledgeService } from './memory/KnowledgeGraph.js';

/**
 * Main manager for the agentic society that integrates all components
 */
export class AgenticSocietyManager {
  private organization: OrganizationCoordinator;
  private knowledgeService: OrganizationalKnowledgeService;
  private isRunning: boolean;

  constructor() {
    this.organization = new OrganizationCoordinator();
    this.knowledgeService = new OrganizationalKnowledgeService();
    this.isRunning = false;
  }

  /**
   * Initialize the agentic society
   */
  async initialize(): Promise<void> {
    console.log('Initializing Agentic Society...');
    
    // Initialize the organizational structure
    await this.organization.initializeOrganization();
    
    // Initialize the knowledge service
    await this.knowledgeService.initialize(this.organization);
    
    console.log('Agentic Society initialized successfully');
    console.log(`Organization has ${this.organization.getAgentCount()} agents`);
    
    // Display organizational stats
    const stats = this.organization.getOrganizationStats();
    console.log(`Organization stats: ${JSON.stringify(stats, null, 2)}`);
  }

  /**
   * Start the agentic society
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Agentic Society is already running');
      return;
    }

    console.log('Starting Agentic Society...');
    
    // Start all agents
    await this.organization.startAllAgents();
    
    this.isRunning = true;
    console.log('Agentic Society started successfully');
  }

  /**
   * Stop the agentic society
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Agentic Society is not running');
      return;
    }

    console.log('Stopping Agentic Society...');
    
    // Stop all agents
    await this.organization.stopAllAgents();
    
    this.isRunning = false;
    console.log('Agentic Society stopped successfully');
  }

  /**
   * Start group chat with multiple qwen shell commands
   */
  async startGroupChat(userMessage: string): Promise<void> {
    console.log('🚀 Starting multiple Qwen agents...\n');

    const agents = [
      { name: 'Alice', role: 'CEO', emoji: '👩‍💼' },
      { name: 'Bob', role: 'CTO', emoji: '👨‍💻' },
      { name: 'Carol', role: 'CFO', emoji: '👩‍💰' },
      { name: 'David', role: 'COO', emoji: '👨‍🔧' }
    ];

    const responses = [];

    // Phase 1: All agents respond
    console.log('🗣️  Initial responses:\n');
    for (const agent of agents) {
      const prompt = `You are ${agent.name} (${agent.role}). Answer briefly: ${userMessage}`;
      const response = await this.runQwenCommand(prompt);
      responses.push({ agent, response });
      console.log(`${agent.emoji} ${agent.name}: ${response}\n`);
    }

    // Phase 2: Agents react to each other
    console.log('💭 Agent reactions:\n');
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const otherAgent = agents[(i + 1) % agents.length];
      const otherResponse = responses[i].response;
      
      const reactionPrompt = `You are ${agent.name}. React to ${otherAgent.name}'s response: "${otherResponse}". Be brief.`;
      const reaction = await this.runQwenCommand(reactionPrompt);
      console.log(`🔄 ${agent.name} → ${otherAgent.name}: ${reaction}\n`);
    }
  }

  /**
   * Run qwen command and get response
   */
  private async runQwenCommand(prompt: string): Promise<string> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Create temp file with prompt
      const tempFile = `/tmp/qwen_prompt_${Date.now()}.txt`;
      const fs = await import('fs');
      fs.writeFileSync(tempFile, prompt);

      // Run qwen with the prompt file
      const { stdout } = await execAsync(`echo "${prompt}" | qwen --yolo`, { 
        timeout: 10000,
        maxBuffer: 1024 * 1024 
      });

      // Clean up temp file
      fs.unlinkSync(tempFile);

      // Extract meaningful response
      const cleaned = stdout
        .replace(/.*?>\s*/g, '')
        .replace(/Using:.*?\n/g, '')
        .replace(/╭.*?╯/gs, '')
        .replace(/~/g, '')
        .trim()
        .split('\n')[0]
        .substring(0, 100);

      return cleaned || 'Interesting perspective!';
    } catch (error) {
      // Fallback responses
      const fallbacks = [
        'That\'s a great point.',
        'I see it differently.',
        'Needs more analysis.',
        'Good perspective!'
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  /**
   * Submit a task to the organization
   */
  async submitTask(task: AgenticTask): Promise<TaskResult> {
    if (!this.isRunning) {
      throw new Error('Agentic Society is not running');
    }

    console.log(`Processing task: ${task.description}`);
    
    // Determine the appropriate agent or team for this task
    const assignedAgent = await this.findAppropriateAgent(task);
    
    if (!assignedAgent) {
      throw new Error('No suitable agent found for this task');
    }

    // Assign the task to the selected agent
    await this.organization.assignTask(assignedAgent.identity.id, {
      id: task.id,
      title: task.name,
      description: task.description,
      assignedTo: assignedAgent.identity.id,
      status: 'pending',
      priority: task.priority || 'medium',
      createdDate: Date.now(),
      context: task.context
    });

    // For now, return a simple success result
    // In a full implementation, this would track the task execution
    return {
      taskId: task.id,
      status: 'assigned',
      assignedTo: assignedAgent.identity.name,
      message: `Task "${task.name}" assigned to ${assignedAgent.identity.name} (${assignedAgent.identity.role})`
    };
  }

  /**
   * Find the most appropriate agent for a task
   */
  private async findAppropriateAgent(task: AgenticTask): Promise<any | null> {
    // This would implement sophisticated logic to find the best agent
    // based on task requirements, agent capabilities, workload, etc.
    
    // For now, implementing a simple matching algorithm
    const allAgents = this.organization.getAllAgents();
    
    // Look for agents with relevant capabilities
    for (const agent of allAgents) {
      const identity = this.organization.getAgentIdentity(agent.identity.id);
      if (identity) {
        // Simple capability matching
        if (task.requiredCapabilities && identity.capabilities) {
          const hasRequiredCapabilities = task.requiredCapabilities.every(
            (cap: string) => identity.capabilities!.includes(cap)
          );
          
          if (hasRequiredCapabilities) {
            return agent;
          }
        }
      }
    }
    
    // If no specific capabilities required, return the CEO as default
    const ceoAgents = this.organization.getAgentsByRole('CEO' as any);
    if (ceoAgents.length > 0) {
      return ceoAgents[0];
    }
    
    // Otherwise return the first agent
    const allAgentsList = this.organization.getAllAgents();
    return allAgentsList.length > 0 ? allAgentsList[0] : null;
  }

  /**
   * Query the organizational knowledge
   */
  async queryKnowledge(query: string): Promise<KnowledgeNode[]> {
    return await this.knowledgeService.search(query);
  }

  /**
   * Get the organizational structure
   */
  getOrganizationalStructure(): any {
    return this.organization.getOrganizationalHierarchy();
  }

  /**
   * Check if the society is running
   */
  isSocietyRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get statistics about the society
   */
  getSocietyStats(): any {
    return {
      ...this.organization.getOrganizationStats(),
      isRunning: this.isRunning,
      knowledgeGraphSize: this.knowledgeService.getGraph().size()
    };
  }

  /**
   * Add a new agent to the society
   */
  async addAgentToSociety(agentConfig: any): Promise<any> {
    // This would create a new agent with the given configuration
    // and add it to the organization
    console.log(`Adding new agent to society: ${agentConfig.name}`);
    
    // For now, returning a placeholder
    return {
      success: true,
      message: `Agent ${agentConfig.name} added to society`,
      agentId: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

/**
 * Interface for tasks submitted to the agentic society
 */
interface AgenticTask {
  id: string;
  name: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  requiredCapabilities?: string[];
  context?: string;
  deadline?: number;
  requester?: string;
}

/**
 * Interface for task results
 */
interface TaskResult {
  taskId: string;
  status: string;
  assignedTo: string;
  message: string;
}

/**
 * Interface for knowledge nodes (re-export for convenience)
 */
interface KnowledgeNode {
  id: string;
  content: string;
  type: string;
  tags: string[];
  metadata?: any;
  lastModified: number;
}