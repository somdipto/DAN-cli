/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agent } from '../framework/Agent.js';
import { AgentIdentity, AgentRole, createExecutiveIdentity } from '../hierarchy/AgentIdentity.js';

/**
 * Manages the organizational society of agents with hierarchical structure
 */
export class OrganizationCoordinator {
  private agents: Map<string, Agent>;
  private agentRegistry: Map<string, AgentIdentity>;
  private activeProjects: Map<string, Project>;
  private communicationChannels: Map<string, CommunicationChannel>;

  constructor() {
    this.agents = new Map();
    this.agentRegistry = new Map();
    this.activeProjects = new Map();
    this.communicationChannels = new Map();
  }

  /**
   * Initialize the organization with executive leadership
   */
  async initializeOrganization(): Promise<void> {
    console.log('Initializing organizational structure...');
    
    // Create the CEO
    const ceoIdentity = createExecutiveIdentity(
      'Alice Johnson',
      AgentRole.CEO,
      'Executive'
    );
    const ceoAgent = new Agent(ceoIdentity);
    await ceoAgent.initialize();
    this.agents.set(ceoIdentity.id, ceoAgent);
    this.agentRegistry.set(ceoIdentity.id, ceoIdentity);

    // Create other C-level executives
    const ctoIdentity = createExecutiveIdentity(
      'Bob Smith',
      AgentRole.CTO,
      'Technology',
      [ceoIdentity.id] // Reports to CEO
    );
    const ctoAgent = new Agent(ctoIdentity);
    await ctoAgent.initialize();
    this.agents.set(ctoIdentity.id, ctoAgent);
    this.agentRegistry.set(ctoIdentity.id, ctoIdentity);

    const cfoIdentity = createExecutiveIdentity(
      'Carol Davis',
      AgentRole.CFO,
      'Finance',
      [ceoIdentity.id]
    );
    const cfoAgent = new Agent(cfoIdentity);
    await cfoAgent.initialize();
    this.agents.set(cfoIdentity.id, cfoAgent);
    this.agentRegistry.set(cfoIdentity.id, cfoIdentity);

    const cooIdentity = createExecutiveIdentity(
      'David Wilson',
      AgentRole.COO,
      'Operations',
      [ceoIdentity.id]
    );
    const cooAgent = new Agent(cooIdentity);
    await cooAgent.initialize();
    this.agents.set(cooIdentity.id, cooAgent);
    this.agentRegistry.set(cooIdentity.id, cooIdentity);

    // Create communication channels
    await this.createCommunicationChannels();

    console.log('Organizational structure initialized');
  }

  /**
   * Create communication channels for the organization
   */
  private async createCommunicationChannels(): Promise<void> {
    // Executive channel
    this.communicationChannels.set('executive-channel', {
      id: 'executive-channel',
      name: 'Executive Leadership',
      type: 'group',
      participants: [
        this.agentRegistry.get('Alice Johnson')?.id || '', 
        this.agentRegistry.get('Bob Smith')?.id || '',
        this.agentRegistry.get('Carol Davis')?.id || '',
        this.agentRegistry.get('David Wilson')?.id || ''
      ]
    });

    // All-hands channel
    this.communicationChannels.set('all-hands-channel', {
      id: 'all-hands-channel',
      name: 'All Hands',
      type: 'broadcast',
      participants: Array.from(this.agentRegistry.keys())
    });
  }

  /**
   * Add an agent to the organization
   */
  async addAgent(identity: AgentIdentity): Promise<Agent> {
    if (this.agents.has(identity.id)) {
      throw new Error(`Agent with ID ${identity.id} already exists`);
    }

    const agent = new Agent(identity);
    await agent.initialize();
    
    this.agents.set(identity.id, agent);
    this.agentRegistry.set(identity.id, identity);

    // If the agent reports to someone, update the supervisor's subordinates list
    if (identity.supervisorId) {
      const supervisorIdentity = this.agentRegistry.get(identity.supervisorId);
      if (supervisorIdentity) {
        if (!supervisorIdentity.subordinates.includes(identity.id)) {
          supervisorIdentity.subordinates.push(identity.id);
        }
      }
    }

    return agent;
  }

  /**
   * Create a new project and assign agents
   */
  async createProject(projectConfig: ProjectConfig): Promise<Project> {
    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const project: Project = {
      id: projectId,
      name: projectConfig.name,
      description: projectConfig.description,
      status: 'planning',
      createdDate: Date.now(),
      dueDate: projectConfig.dueDate,
      owner: projectConfig.ownerId,
      participants: projectConfig.participantIds || [],
      tasks: [],
      resources: projectConfig.resources || {},
      progress: 0,
      budget: projectConfig.budget
    };

    this.activeProjects.set(projectId, project);

    // Notify participants about the project
    for (const participantId of project.participants) {
      const agent = this.agents.get(participantId);
      if (agent) {
        await agent.processMessage({
          id: `msg-${Date.now()}-proj-${projectId}`,
          senderId: project.owner,
          recipientId: participantId,
          content: `You have been assigned to project "${project.name}": ${project.description}`,
          context: [JSON.stringify(project)],
          timestamp: Date.now(),
          metadata: { projectRef: projectId }
        });
      }
    }

    return project;
  }

  /**
   * Assign a task to an agent
   */
  async assignTask(agentId: string, task: Task): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent with ID ${agentId} does not exist`);
    }

    const agent = this.agents.get(agentId)!;
    
    await agent.processMessage({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: task.assignedBy || 'system',
      recipientId: agentId,
      content: `Task assigned: ${task.description}`,
      context: [task.context || ''],
      timestamp: Date.now(),
      metadata: { taskRef: task.id, priority: task.priority }
    });
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get an agent's identity
   */
  getAgentIdentity(agentId: string): AgentIdentity | undefined {
    return this.agentRegistry.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by role
   */
  getAgentsByRole(role: AgentRole): Agent[] {
    const agents: Agent[] = [];
    
    for (const [id, identity] of this.agentRegistry) {
      if (identity.role === role) {
        const agent = this.agents.get(id);
        if (agent) {
          agents.push(agent);
        }
      }
    }
    
    return agents;
  }

  /**
   * Get agents by department
   */
  getAgentsByDepartment(department: string): Agent[] {
    const agents: Agent[] = [];
    
    for (const [id, identity] of this.agentRegistry) {
      if (identity.department === department) {
        const agent = this.agents.get(id);
        if (agent) {
          agents.push(agent);
        }
      }
    }
    
    return agents;
  }

  /**
   * Facilitate communication between agents
   */
  async facilitateCommunication(fromAgentId: string, toAgentId: string, message: string): Promise<void> {
    const senderAgent = this.agents.get(fromAgentId);
    const recipientAgent = this.agents.get(toAgentId);

    if (!senderAgent || !recipientAgent) {
      throw new Error(`One or both agents not found: ${fromAgentId}, ${toAgentId}`);
    }

    // Check if the sender has permission to communicate with the recipient
    const senderIdentity = this.agentRegistry.get(fromAgentId);
    const recipientIdentity = this.agentRegistry.get(toAgentId);

    if (senderIdentity && recipientIdentity) {
      // Allow communication if:
      // 1. Sender has authority over recipient
      // 2. Sender reports to recipient
      // 3. Same level (peers)
      // 4. Special cross-functional permissions
      if (
        senderIdentity.hasAuthorityOver(recipientIdentity) ||
        recipientIdentity.hasAuthorityOver(senderIdentity) ||
        senderIdentity.level === recipientIdentity.level
      ) {
        await senderAgent.communication.sendMessage(toAgentId, message);
      } else {
        throw new Error(`Agent ${fromAgentId} does not have permission to communicate with agent ${toAgentId}`);
      }
    }
  }

  /**
   * Get organizational hierarchy visualization
   */
  getOrganizationalHierarchy(): OrganizationNode {
    // Find root nodes (those without supervisors)
    const rootNodes: OrganizationNode[] = [];
    
    for (const [id, identity] of this.agentRegistry) {
      if (!identity.supervisorId) {
        rootNodes.push(this.buildHierarchyNode(id));
      }
    }
    
    return {
      id: 'organization-root',
      name: 'Organizational Structure',
      role: 'Organization Root',
      department: 'Enterprise',
      level: -1,
      children: rootNodes
    };
  }

  /**
   * Build a hierarchy node for visualization
   */
  private buildHierarchyNode(agentId: string): OrganizationNode {
    const identity = this.agentRegistry.get(agentId);
    if (!identity) {
      throw new Error(`Agent identity not found for ID: ${agentId}`);
    }

    const children: OrganizationNode[] = [];
    for (const subId of identity.subordinates) {
      children.push(this.buildHierarchyNode(subId));
    }

    return {
      id: identity.id,
      name: identity.name,
      role: identity.role,
      department: identity.department,
      level: identity.level,
      children
    };
  }

  /**
   * Start all agents in the organization
   */
  async startAllAgents(): Promise<void> {
    for (const [id, agent] of this.agents) {
      await agent.start();
      console.log(`Started agent: ${this.agentRegistry.get(id)?.name} (${this.agentRegistry.get(id)?.role})`);
    }
  }

  /**
   * Stop all agents in the organization
   */
  async stopAllAgents(): Promise<void> {
    for (const [id, agent] of this.agents) {
      await agent.stop();
      console.log(`Stopped agent: ${this.agentRegistry.get(id)?.name} (${this.agentRegistry.get(id)?.role})`);
    }
  }

  /**
   * Get the number of agents in the organization
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Get statistics about the organization
   */
  getOrganizationStats(): OrganizationStats {
    const departmentsSet = new Set<string>();
    const rolesSet = new Set<string>();

    // Calculate department and role diversity
    for (const identity of this.agentRegistry.values()) {
      departmentsSet.add(identity.department);
      rolesSet.add(identity.role);
    }

    const stats: OrganizationStats = {
      totalAgents: this.agents.size,
      departments: Array.from(departmentsSet),
      roles: Array.from(rolesSet),
      projects: this.activeProjects.size,
      avgDepth: 0 // Will calculate this below
    };

    // Calculate average depth of hierarchy
    if (this.agentRegistry.size > 0) {
      let totalDepth = 0;
      for (const identity of this.agentRegistry.values()) {
        totalDepth += identity.level;
      }
      stats.avgDepth = totalDepth / this.agentRegistry.size;
    }

    return stats;
  }
}

/**
 * Interface for projects
 */
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold' | 'cancelled';
  createdDate: number;
  dueDate?: number;
  owner: string; // Agent ID
  participants: string[]; // Agent IDs
  tasks: Task[];
  resources: Record<string, any>;
  progress: number; // 0-100
  budget?: number;
}

/**
 * Interface for tasks
 */
interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Agent ID
  assignedBy?: string; // Agent ID
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdDate: number;
  dueDate?: number;
  context?: string;
}

/**
 * Interface for projects configuration
 */
interface ProjectConfig {
  name: string;
  description: string;
  ownerId: string; // Agent ID
  participantIds?: string[]; // Agent IDs
  dueDate?: number;
  budget?: number;
  resources?: Record<string, any>;
}

/**
 * Interface for organizational hierarchy nodes
 */
interface OrganizationNode {
  id: string;
  name: string;
  role: AgentRole | string;
  department: string;
  level: number;
  children?: OrganizationNode[];
}

/**
 * Interface for communication channels
 */
interface CommunicationChannel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'broadcast' | 'public';
  participants: string[];
}

/**
 * Interface for organization statistics
 */
interface OrganizationStats {
  totalAgents: number;
  departments: string[];
  roles: string[];
  projects: number;
  avgDepth: number;
}