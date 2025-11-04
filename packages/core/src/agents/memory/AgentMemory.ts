/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Agent's memory system with both short-term and long-term storage
 */
import { KnowledgeGraph, type KnowledgeNode } from './KnowledgeGraph.js';

export class AgentMemory {
  private readonly agentId: string;
  private shortTermMemory: MemoryEntry[];
  private longTermMemory: Map<string, MemoryEntry>;
  private selfModel: any;
  private experiences: ExperienceEntry[];
  private knowledgeGraph: KnowledgeGraph;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.shortTermMemory = [];
    this.longTermMemory = new Map();
    this.selfModel = {};
    this.experiences = [];
    this.knowledgeGraph = new KnowledgeGraph();
  }

  /**
   * Initialize the memory system
   */
  async initialize(): Promise<void> {
    // In a real implementation, this might load from persistent storage
    console.log(`Initializing memory for agent ${this.agentId}`);
  }

  /**
   * Store a message in memory
   */
  async storeMessage(message: any): Promise<void> {
    const memoryEntry: MemoryEntry = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'message',
      timestamp: Date.now(),
      content: message,
      tags: ['message']
    };

    this.shortTermMemory.push(memoryEntry);
    
    // Move older entries to long-term memory if short-term is full
    if (this.shortTermMemory.length > 10) {
      const oldEntry = this.shortTermMemory.shift();
      if (oldEntry) {
        this.longTermMemory.set(oldEntry.id, oldEntry);
      }
    }
  }

  /**
   * Retrieve relevant context for a query
   */
  async retrieveRelevantContext(query: string): Promise<string[]> {
    const relevantContext: string[] = [];

    // Look in short-term memory
    for (const entry of this.shortTermMemory) {
      if (entry.content && typeof entry.content === 'object') {
        if (JSON.stringify(entry.content).toLowerCase().includes(query.toLowerCase())) {
          relevantContext.push(JSON.stringify(entry.content));
        }
      } else if (typeof entry.content === 'string') {
        if (entry.content.toLowerCase().includes(query.toLowerCase())) {
          relevantContext.push(entry.content);
        }
      }
    }

    // Look in long-term memory
    for (const [, entry] of this.longTermMemory) {
      if (entry.content && typeof entry.content === 'object') {
        if (JSON.stringify(entry.content).toLowerCase().includes(query.toLowerCase())) {
          relevantContext.push(JSON.stringify(entry.content));
        }
      } else if (typeof entry.content === 'string') {
        if (entry.content.toLowerCase().includes(query.toLowerCase())) {
          relevantContext.push(entry.content);
        }
      }
    }

    // Limit to 5 most relevant contexts
    return relevantContext.slice(0, 5);
  }

  /**
   * Store the agent's self-model
   */
  async storeSelfModel(selfModel: any): Promise<void> {
    this.selfModel = { ...selfModel, lastUpdated: Date.now() };
  }

  /**
   * Retrieve the agent's self-model
   */
  async getSelfModel(): Promise<any> {
    return { ...this.selfModel };
  }

  /**
   * Store an experience
   */
  async storeExperience(experience: ExperienceEntry): Promise<void> {
    this.experiences.push({
      ...experience,
      timestamp: Date.now()
    });

    // Keep only the most recent 100 experiences
    if (this.experiences.length > 100) {
      this.experiences = this.experiences.slice(-100);
    }
  }

  /**
   * Get recent experiences
   */
  async getRecentExperiences(count: number = 10): Promise<ExperienceEntry[]> {
    return this.experiences.slice(-count);
  }

  /**
   * Get experience summary
   */
  async getExperienceSummary(): Promise<any> {
    return {
      interactionsCount: this.experiences.length,
      lastInteraction: this.experiences.length > 0 ? this.experiences[this.experiences.length - 1].timestamp : null,
      commonTopics: this.getCommonTopics(),
      successPatterns: this.getSuccessPatterns()
    };
  }

  /**
   * Get common topics from experiences
   */
  private getCommonTopics(): string[] {
    // This would analyze experiences to find common topics
    // For now, returning a placeholder
    return ['general-inquiry', 'task-completion', 'problem-solving'];
  }

  /**
   * Get success patterns from experiences
   */
  private getSuccessPatterns(): any[] {
    // This would analyze experiences to find patterns of success
    // For now, returning a placeholder
    return [
      { pattern: 'detailed-inquiry', successRate: 0.85 },
      { pattern: 'collaborative-task', successRate: 0.92 }
    ];
  }

  /**
   * Add to knowledge graph
   */
  async addToKnowledgeGraph(node: Omit<KnowledgeNode, 'id' | 'lastModified'>): Promise<string> {
    return await this.knowledgeGraph.addNode(node);
  }

  /**
   * Query knowledge graph
   */
  async queryKnowledgeGraph(query: string): Promise<KnowledgeNode[]> {
    return await this.knowledgeGraph.searchNodes(query);
  }

  /**
   * Get all memories
   */
  getAllMemories(): { shortTerm: MemoryEntry[]; longTerm: MemoryEntry[] } {
    return {
      shortTerm: [...this.shortTermMemory],
      longTerm: Array.from(this.longTermMemory.values())
    };
  }
}

/**
 * Interface for memory entries
 */
interface MemoryEntry {
  id: string;
  type: string; // 'message', 'experience', 'knowledge', etc.
  timestamp: number;
  content: any;
  tags: string[];
}

/**
 * Interface for experience entries
 */
interface ExperienceEntry {
  id?: string;
  type: string; // 'task-completion', 'collaboration', 'decision', etc.
  timestamp?: number;
  context: string;
  action: string;
  outcome: string;
  feedback?: string;
  confidence?: number;
}
