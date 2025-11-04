/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Knowledge Graph for the organizational society of agents
 * Inspired by Palantir's ontology-based data integration approach
 */
export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode>;
  private edges: Map<string, KnowledgeEdge[]>;
  private indexes: Map<string, Set<string>>; // Index for fast retrieval

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.indexes = new Map();
  }

  /**
   * Add a node to the knowledge graph
   */
  async addNode(node: Omit<KnowledgeNode, 'id' | 'lastModified'>): Promise<string> {
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNode: KnowledgeNode = {
      ...node,
      id: nodeId,
      lastModified: Date.now()
    };

    this.nodes.set(nodeId, newNode);

    // Update indexes
    this.updateIndexesForNode(newNode);

    // Initialize edges list for this node
    if (!this.edges.has(nodeId)) {
      this.edges.set(nodeId, []);
    }

    return nodeId;
  }

  /**
   * Update indexes for a node
   */
  private updateIndexesForNode(node: KnowledgeNode): void {
    // Index by type
    const typeIndexKey = `type:${node.type}`;
    if (!this.indexes.has(typeIndexKey)) {
      this.indexes.set(typeIndexKey, new Set());
    }
    this.indexes.get(typeIndexKey)!.add(node.id);

    // Index by tags
    for (const tag of node.tags) {
      const tagIndexKey = `tag:${tag}`;
      if (!this.indexes.has(tagIndexKey)) {
        this.indexes.set(tagIndexKey, new Set());
      }
      this.indexes.get(tagIndexKey)!.add(node.id);
    }

    // Index content for text search
    const content = node.content.toLowerCase();
    const words = content.split(/\s+/);
    for (const word of words) {
      if (word.length > 2) { // Only index words longer than 2 characters
        const wordIndexKey = `word:${word}`;
        if (!this.indexes.has(wordIndexKey)) {
          this.indexes.set(wordIndexKey, new Set());
        }
        this.indexes.get(wordIndexKey)!.add(node.id);
      }
    }
  }

  /**
   * Add an edge between two nodes
   */
  async addEdge(fromNodeId: string, toNodeId: string, relationship: string, metadata?: any): Promise<void> {
    if (!this.nodes.has(fromNodeId) || !this.nodes.has(toNodeId)) {
      throw new Error('Both nodes must exist before creating an edge');
    }

    const edge: KnowledgeEdge = {
      from: fromNodeId,
      to: toNodeId,
      relationship,
      metadata: metadata || {},
      lastModified: Date.now()
    };

    if (!this.edges.has(fromNodeId)) {
      this.edges.set(fromNodeId, []);
    }

    // Check if edge already exists to avoid duplicates
    const existingEdges = this.edges.get(fromNodeId)!;
    const exists = existingEdges.some(
      e => e.from === fromNodeId && e.to === toNodeId && e.relationship === relationship
    );

    if (!exists) {
      existingEdges.push(edge);
    }
  }

  /**
   * Get a node by its ID
   */
  async getNode(nodeId: string): Promise<KnowledgeNode | null> {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Find nodes by type
   */
  async findNodesByType(type: string): Promise<KnowledgeNode[]> {
    const typeIndex = this.indexes.get(`type:${type}`);
    if (!typeIndex) {
      return [];
    }

    const nodes: KnowledgeNode[] = [];
    for (const nodeId of typeIndex) {
      const node = this.nodes.get(nodeId);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Find nodes by tag
   */
  async findNodesByTag(tag: string): Promise<KnowledgeNode[]> {
    const tagIndex = this.indexes.get(`tag:${tag}`);
    if (!tagIndex) {
      return [];
    }

    const nodes: KnowledgeNode[] = [];
    for (const nodeId of tagIndex) {
      const node = this.nodes.get(nodeId);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Search nodes by content
   */
  async searchNodes(query: string): Promise<KnowledgeNode[]> {
    const queryLower = query.toLowerCase();
    const results = new Set<string>();

    // Search through word indexes
    const words = queryLower.split(/\s+/);
    for (const word of words) {
      if (word.length > 2) {
        const wordIndex = this.indexes.get(`word:${word}`);
        if (wordIndex) {
          for (const nodeId of wordIndex) {
            results.add(nodeId);
          }
        }
      }
    }

    // Also try to find exact matches in content
    for (const [nodeId, node] of this.nodes) {
      if (node.content.toLowerCase().includes(queryLower)) {
        results.add(nodeId);
      }
    }

    // Convert to node array
    const nodes: KnowledgeNode[] = [];
    for (const nodeId of results) {
      const node = this.nodes.get(nodeId);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Get all edges for a node
   */
  async getNodeEdges(nodeId: string): Promise<KnowledgeEdge[]> {
    return this.edges.get(nodeId) || [];
  }

  /**
   * Get neighboring nodes within a certain distance
   */
  async getNeighbors(nodeId: string, distance: number = 1): Promise<KnowledgeNode[]> {
    if (distance < 1) return [];
    
    const visited = new Set<string>();
    const neighbors: KnowledgeNode[] = [];
    const queue: Array<{ id: string; distance: number }> = [{ id: nodeId, distance: 0 }];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.id) || current.distance >= distance) {
        continue;
      }
      
      visited.add(current.id);
      
      // Add neighbors up to the specified distance
      const edges = this.edges.get(current.id) || [];
      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          const node = this.nodes.get(edge.to);
          if (node) {
            neighbors.push(node);
          }
          
          if (current.distance + 1 < distance) {
            queue.push({ id: edge.to, distance: current.distance + 1 });
          }
        }
      }
    }
    
    return neighbors;
  }

  /**
   * Update a node's content
   */
  async updateNode(nodeId: string, updates: Partial<KnowledgeNode>): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    // Remove old indexes
    this.removeFromIndexes(node);

    // Update the node
    Object.assign(node, updates, { lastModified: Date.now() });

    // Add back to indexes with new content
    this.updateIndexesForNode(node);

    return true;
  }

  /**
   * Remove a node and its edges
   */
  async removeNode(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    // Remove from indexes
    this.removeFromIndexes(node);

    // Remove node
    this.nodes.delete(nodeId);

    // Remove edges from this node
    this.edges.delete(nodeId);

    // Remove edges to this node from other nodes
    for (const [fromNodeId, edges] of this.edges) {
      const filteredEdges = edges.filter(edge => edge.to !== nodeId);
      if (filteredEdges.length !== edges.length) {
        this.edges.set(fromNodeId, filteredEdges);
      }
    }

    return true;
  }

  /**
   * Remove node from all indexes
   */
  private removeFromIndexes(node: KnowledgeNode): void {
    // Remove from type index
    const typeIndex = this.indexes.get(`type:${node.type}`);
    if (typeIndex) {
      typeIndex.delete(node.id);
    }

    // Remove from tag indexes
    for (const tag of node.tags) {
      const tagIndex = this.indexes.get(`tag:${tag}`);
      if (tagIndex) {
        tagIndex.delete(node.id);
      }
    }

    // Remove from content indexes
    const content = node.content.toLowerCase();
    const words = content.split(/\s+/);
    for (const word of words) {
      if (word.length > 2) {
        const wordIndex = this.indexes.get(`word:${word}`);
        if (wordIndex) {
          wordIndex.delete(node.id);
        }
      }
    }
  }

  /**
   * Get the size of the knowledge graph
   */
  size(): { nodes: number; edges: number } {
    return {
      nodes: this.nodes.size,
      edges: Array.from(this.edges.values()).reduce((sum, edges) => sum + edges.length, 0)
    };
  }

  /**
   * Export the knowledge graph as a serializable object
   */
  export(): any {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.entries()).map(([from, edges]) => ({ from, edges }))
    };
  }

  /**
   * Import a knowledge graph from a serializable object
   */
  import(data: any): void {
    // Clear existing data
    this.nodes.clear();
    this.edges.clear();
    this.indexes.clear();

    // Load nodes
    for (const node of data.nodes) {
      this.nodes.set(node.id, node);
      this.updateIndexesForNode(node);
    }

    // Load edges
    for (const { from, edges } of data.edges) {
      this.edges.set(from, edges);
    }
  }
}

/**
 * Interface for knowledge graph nodes
 */
export interface KnowledgeNode {
  id: string;
  content: string;
  type: string; // 'fact', 'process', 'relationship', 'event', 'concept', etc.
  tags: string[]; // Categories or labels for the node
  metadata?: any; // Additional structured data
  connections?: string[]; // IDs of directly connected nodes (deprecated, use edges instead)
  lastModified: number;
}

/**
 * Interface for knowledge graph edges
 */
interface KnowledgeEdge {
  from: string; // Node ID
  to: string; // Node ID
  relationship: string; // Type of relationship ('causes', 'part-of', 'related-to', etc.)
  metadata?: any; // Additional structured data about the relationship
  lastModified: number;
}

/**
 * Service class that integrates the knowledge graph with the organizational system
 */
export class OrganizationalKnowledgeService {
  private graph: KnowledgeGraph;
  private orgCoordinator: any; // We'll pass the OrganizationCoordinator later

  constructor() {
    this.graph = new KnowledgeGraph();
  }

  /**
   * Initialize with the organization coordinator
   */
  async initialize(orgCoordinator: any): Promise<void> {
    this.orgCoordinator = orgCoordinator;
    
    // Add organizational structure as knowledge nodes
    await this.indexOrganizationalStructure();
    
    // Add policies and procedures
    await this.indexOrganizationalPolicies();
    
    // Add project knowledge
    await this.indexProjectKnowledge();
  }

  /**
   * Index the organizational structure in the knowledge graph
   */
  private async indexOrganizationalStructure(): Promise<void> {
    if (!this.orgCoordinator) return;
    
    // Get organizational hierarchy
    const hierarchy = this.orgCoordinator.getOrganizationalHierarchy();
    
    // Recursively add organizational nodes
    await this.addOrganizationNode(hierarchy);
  }

  /**
   * Add an organization node to the knowledge graph
   */
  private async addOrganizationNode(node: any, parentPath: string = ''): Promise<void> {
    // Add this organizational entity as a node
    const nodeId = await this.graph.addNode({
      content: `Organizational Unit: ${node.name} (${node.role}) in ${node.department}`,
      type: 'organizational-unit',
      tags: ['organization', node.role, node.department],
      metadata: {
        name: node.name,
        role: node.role,
        department: node.department,
        level: node.level,
        path: `${parentPath}/${node.name}`
      }
    });

    // Add edges representing relationships
    if (parentPath) {
      await this.graph.addEdge(
        nodeId,
        parentPath, // This would need to be the node ID of the parent
        'reports-to'
      );
    }

    // Recursively add children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await this.addOrganizationNode(child, nodeId);
      }
    }
  }

  /**
   * Index organizational policies and procedures
   */
  private async indexOrganizationalPolicies(): Promise<void> {
    // Add company policies as knowledge nodes
    const policies = [
      { name: 'Code of Conduct', type: 'policy', content: 'Company-wide code of conduct and ethical guidelines' },
      { name: 'Security Policy', type: 'policy', content: 'Information security and data protection policies' },
      { name: 'Development Process', type: 'procedure', content: 'Software development lifecycle procedures' },
      { name: 'Communication Protocol', type: 'procedure', content: 'Internal communication standards and protocols' }
    ];

    for (const policy of policies) {
      await this.graph.addNode({
        content: policy.content,
        type: policy.type,
        tags: ['policy', policy.name.toLowerCase().replace(/\s+/g, '-')],
        metadata: { name: policy.name }
      });
    }
  }

  /**
   * Index project knowledge
   */
  private async indexProjectKnowledge(): Promise<void> {
    if (!this.orgCoordinator) return;
    
    // Get active projects
    // This would require accessing the org coordinator's project system
    // For now, adding a placeholder approach
    console.log('Indexing project knowledge...');
  }

  /**
   * Add knowledge from agent interactions
   */
  async addKnowledgeFromInteraction(agentId: string, interaction: any): Promise<void> {
    // Extract key information from the interaction
    const knowledgeSegments = this.extractKnowledgeSegments(interaction);

    for (const segment of knowledgeSegments) {
      await this.graph.addNode({
        content: segment.content,
        type: segment.type,
        tags: segment.tags,
        metadata: {
          sourceAgent: agentId,
          sourceInteraction: interaction.id,
          timestamp: Date.now(),
          ...segment.metadata
        }
      });

      // Create relationships based on context
      if (interaction.context) {
        for (const _ of interaction.context) {
          // This would connect to related knowledge nodes
          // Implementation depends on how context is structured
        }
      }
    }
  }

  /**
   * Extract knowledge segments from an interaction
   */
  private extractKnowledgeSegments(interaction: any): Array<{
    content: string;
    type: string;
    tags: string[];
    metadata?: any;
  }> {
    // This would parse an interaction to extract discrete pieces of knowledge
    // For now, returning a simple representation
    return [{
      content: interaction.content || interaction.message || 'General interaction',
      type: 'interaction',
      tags: ['agent-interaction'],
      metadata: { interactionType: 'general' }
    }];
  }

  /**
   * Search for knowledge relevant to a query
   */
  async search(query: string): Promise<KnowledgeNode[]> {
    return await this.graph.searchNodes(query);
  }

  /**
   * Find related knowledge to a specific node
   */
  async findRelated(nodeId: string, distance: number = 1): Promise<KnowledgeNode[]> {
    return await this.graph.getNeighbors(nodeId, distance);
  }

  /**
   * Get the underlying knowledge graph
   */
  getGraph(): KnowledgeGraph {
    return this.graph;
  }
}