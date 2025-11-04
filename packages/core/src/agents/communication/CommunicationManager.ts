/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Agent, AgentMessage, AgentResponse } from '../framework/Agent.js';

/**
 * Manages communication between agents in the organizational society
 */
export class CommunicationManager {
  private agent: Agent;
  private messageQueue: AgentMessage[];
  private activeConversations: Map<string, Conversation>;
  
  constructor(agent: Agent) {
    this.agent = agent;
    this.messageQueue = [];
    this.activeConversations = new Map();
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(recipientId: string, content: string, context?: any): Promise<AgentResponse> {
    // Check if the agent has permission to send to the recipient
    const recipientAgent = await this.findAgentById(recipientId);
    if (!recipientAgent) {
      throw new Error(`Recipient agent ${recipientId} not found`);
    }

    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: this.agent.identity.id,
      recipientId,
      content,
      context: context ? [context] : [],
      timestamp: Date.now(),
      metadata: {
        senderRole: this.agent.identity.role,
        senderName: this.agent.identity.name
      }
    };

    // Add to message queue
    this.messageQueue.push(message);

    // Attempt direct delivery if possible
    try {
      const response = await recipientAgent.processMessage(message);
      return response;
    } catch (error) {
      console.warn(`Direct delivery failed, placing in queue: ${error}`);
      return {
        id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        senderId: recipientId,
        content: "Message queued for delivery. Recipient is currently unavailable.",
        timestamp: Date.now(),
        metadata: { deliveryStatus: 'queued' }
      };
    }
  }

  /**
   * Broadcast a message to multiple agents
   */
  async broadcastMessage(recipients: string[], content: string, context?: any): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];
    
    for (const recipientId of recipients) {
      try {
        const response = await this.sendMessage(recipientId, content, context);
        responses.push(response);
      } catch (error) {
        console.error(`Error sending message to ${recipientId}: ${error}`);
      }
    }
    
    return responses;
  }

  /**
   * Initiate a conversation with another agent
   */
  async startConversation(recipientId: string, topic: string, initialMessage: string): Promise<Conversation> {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: Conversation = {
      id: conversationId,
      participants: [this.agent.identity.id, recipientId],
      topic,
      startTime: Date.now(),
      messages: [],
      status: 'active',
      context: { topic }
    };

    // Add to active conversations
    this.activeConversations.set(conversationId, conversation);

    // Send initial message
    const response = await this.sendMessage(recipientId, initialMessage);
    conversation.messages.push({
      id: `msg-${Date.now()}-init`,
      senderId: this.agent.identity.id,
      content: initialMessage,
      timestamp: Date.now()
    }, {
      id: `msg-${Date.now()}-resp`,
      senderId: recipientId,
      content: response.content,
      timestamp: Date.now()
    });

    return conversation;
  }

  /**
   * Join an existing conversation
   */
  async joinConversation(conversationId: string): Promise<Conversation | null> {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    if (!conversation.participants.includes(this.agent.identity.id)) {
      // Check if the agent is allowed to join
      if (this.agent.identity.role === 'CEO' || this.agent.identity.role === 'COO') {
        conversation.participants.push(this.agent.identity.id);
      } else {
        throw new Error(`Agent ${this.agent.identity.id} does not have permission to join conversation ${conversationId}`);
      }
    }

    return conversation;
  }

  /**
   * Find an agent by ID in the organization
   */
  private async findAgentById(agentId: string): Promise<Agent | null> {
    // This would typically query a global registry of agents
    // For now, returning null to indicate that we'd need a global registry
    console.warn(`Finding agent by ID ${agentId} would require a global agent registry`);
    return null;
  }

  /**
   * Process incoming messages from the queue
   */
  async processMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          // Process the message based on its type and destination
          await this.handleIncomingMessage(message);
        } catch (error) {
          console.error(`Error processing message ${message.id}: ${error}`);
          this.returnErrorMessage(message, `Error processing message: ${error}`);
        }
      }
    }
  }

  /**
   * Handle an incoming message
   */
  private async handleIncomingMessage(message: AgentMessage): Promise<void> {
    if (message.recipientId && message.recipientId !== this.agent.identity.id) {
      // Forward to the correct recipient
      await this.forwardMessage(message);
      return;
    }

    // Process the message with the agent
    const response = await this.agent.processMessage(message);

    // Handle the response
    if (message.senderId) {
      await this.sendMessage(message.senderId, response.content);
    }
  }

  /**
   * Forward a message to the correct recipient
   */
  private async forwardMessage(message: AgentMessage): Promise<void> {
    // Find the correct recipient
    const recipientAgent = await this.findAgentById(message.recipientId!);
    if (recipientAgent) {
      await recipientAgent.processMessage(message);
    } else {
      // If the recipient isn't available, add to the recipient's queue
      // This would require a global message queue system
      console.warn(`Recipient ${message.recipientId} not found, message potentially lost`);
    }
  }

  /**
   * Return an error message to the sender
   */
  private async returnErrorMessage(originalMessage: AgentMessage, error: string): Promise<void> {
    if (originalMessage.senderId) {
      await this.sendMessage(
        originalMessage.senderId,
        `Error: ${error}`,
        { originalMessageId: originalMessage.id, error }
      );
    }
  }

  /**
   * Check for queued messages for this agent
   */
  async checkForMessages(): Promise<AgentMessage[]> {
    const relevantMessages: AgentMessage[] = [];
    
    for (let i = this.messageQueue.length - 1; i >= 0; i--) {
      const message = this.messageQueue[i];
      if (message.recipientId === this.agent.identity.id || !message.recipientId) {
        relevantMessages.push(message);
      }
    }
    
    return relevantMessages;
  }

  /**
   * Get status of active conversations
   */
  getActiveConversations(): Conversation[] {
    return Array.from(this.activeConversations.values());
  }

  /**
   * End a conversation
   */
  endConversation(conversationId: string): boolean {
    return this.activeConversations.delete(conversationId);
  }
}

/**
 * Interface for conversations
 */
interface Conversation {
  id: string;
  participants: string[];
  topic: string;
  startTime: number;
  messages: Array<{ id: string; senderId: string; content: string; timestamp: number }>;
  status: 'active' | 'ended' | 'paused';
  context: any;
}
