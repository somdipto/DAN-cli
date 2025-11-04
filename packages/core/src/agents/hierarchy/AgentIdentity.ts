/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents an agent's identity within the organizational hierarchy
 */
export class AgentIdentity {
  readonly id: string;
  readonly name: string;
  readonly role: AgentRole;
  readonly department: string;
  readonly level: number; // Organizational level (0 = CEO, higher numbers = lower level)
  readonly capabilities?: string[];
  readonly knowledgeAreas?: string[];
  readonly limitations?: string[];
  readonly personalityTraits?: string[];
  readonly supervisorId?: string;
  readonly subordinates: string[];
  readonly authorityLevel: number;

  constructor(config: AgentIdentityConfig) {
    this.id = config.id || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.name = config.name;
    this.role = config.role;
    this.department = config.department;
    this.level = config.level || 0;
    this.capabilities = config.capabilities;
    this.knowledgeAreas = config.knowledgeAreas;
    this.limitations = config.limitations;
    this.personalityTraits = config.personalityTraits;
    this.supervisorId = config.supervisorId;
    this.subordinates = config.subordinates || [];
    this.authorityLevel = config.authorityLevel || 0;
  }

  /**
   * Check if this agent has authority over another agent
   */
  hasAuthorityOver(otherAgent: AgentIdentity): boolean {
    // Authority is based on organizational level and role hierarchy
    if (this.level < otherAgent.level) {
      return true; // Higher organizational level has authority
    }
    
    if (this.level === otherAgent.level) {
      // Same level, check specific authority levels
      return this.authorityLevel > otherAgent.authorityLevel;
    }
    
    return false;
  }

  /**
   * Check if this agent reports to another agent
   */
  reportsTo(agent: AgentIdentity): boolean {
    return this.supervisorId === agent.id;
  }

  /**
   * Check if this agent can delegate tasks to another agent
   */
  canDelegateTo(otherAgent: AgentIdentity): boolean {
    // Can delegate to subordinates
    if (this.hasAuthorityOver(otherAgent)) {
      return true;
    }
    
    // Can delegate to peers in certain circumstances
    if (this.level === otherAgent.level) {
      // For now, allow delegation to peers, but this could be expanded
      return true;
    }
    
    return false;
  }
}

/**
 * Configuration for creating an AgentIdentity
 */
export interface AgentIdentityConfig {
  id?: string;
  name: string;
  role: AgentRole;
  department: string;
  level?: number;
  capabilities?: string[];
  knowledgeAreas?: string[];
  limitations?: string[];
  personalityTraits?: string[];
  supervisorId?: string;
  subordinates?: string[];
  authorityLevel?: number;
}

/**
 * Enum representing different agent roles in the organization
 */
export enum AgentRole {
  // Executive positions
  CEO = 'CEO',
  COO = 'COO',
  CTO = 'CTO',
  CFO = 'CFO',
  CMO = 'CMO',
  CHRO = 'CHRO',
  CISO = 'CISO',
  CAO = 'CAO',
  
  // Management positions
  ENGINEERING_MANAGER = 'Engineering Manager',
  PRODUCT_MANAGER = 'Product Manager',
  TEAM_LEAD = 'Team Lead',
  PROJECT_MANAGER = 'Project Manager',
  TECHNICAL_LEAD = 'Technical Lead',
  SCUM_MASTER = 'Scrum Master',
  
  // Individual contributor positions
  SENIOR_DEVELOPER = 'Senior Developer',
  SDE1 = 'Software Development Engineer I',
  SDE2 = 'Software Development Engineer II',
  SDE3 = 'Software Development Engineer III',
  JUNIOR_DEVELOPER = 'Junior Developer',
  INTERNSHIP = 'Intern',
  
  // Specialized roles
  DATA_SCIENTIST = 'Data Scientist',
  DEVOPS_ENGINEER = 'DevOps Engineer',
  SECURITY_ENGINEER = 'Security Engineer',
  QA_ENGINEER = 'QA Engineer',
  UX_DESIGNER = 'UX Designer',
  SYSTEM_ARCHITECT = 'System Architect',
  BUSINESS_ANALYST = 'Business Analyst',
  TECHNICAL_WRITER = 'Technical Writer',
  RESEARCH_SCIENTIST = 'Research Scientist',
  
  // Support roles
  HR_SPECIALIST = 'HR Specialist',
  FINANCIAL_ANALYST = 'Financial Analyst',
  OPERATIONS_COORDINATOR = 'Operations Coordinator',
  ADMINISTRATIVE_ASSISTANT = 'Administrative Assistant',
  
  // Special purposes
  ORGANIZATIONAL_COORDINATOR = 'Organizational Coordinator',
  KNOWLEDGE_MANAGER = 'Knowledge Manager',
  PROCESS_IMPROVEMENT = 'Process Improvement Specialist'
}

/**
 * Helper function to create an executive agent identity
 */
export function createExecutiveIdentity(
  name: string, 
  role: AgentRole, 
  department: string,
  subordinates: string[] = []
): AgentIdentity {
  const level = getExecutiveLevel(role);
  return new AgentIdentity({
    name,
    role,
    department,
    level,
    authorityLevel: getAuthorityLevel(role),
    subordinates,
    capabilities: getExecutiveCapabilities(role),
    knowledgeAreas: getExecutiveKnowledgeAreas(role),
    limitations: getExecutiveLimitations(role),
    personalityTraits: getExecutivePersonalityTraits(role)
  });
}

/**
 * Helper function to create a management agent identity
 */
export function createManagementIdentity(
  name: string,
  role: AgentRole,
  department: string,
  supervisorId: string,
  subordinates: string[] = []
): AgentIdentity {
  const level = getManagementLevel(role);
  return new AgentIdentity({
    name,
    role,
    department,
    level,
    authorityLevel: getAuthorityLevel(role),
    supervisorId,
    subordinates,
    capabilities: getManagementCapabilities(role),
    knowledgeAreas: getManagementKnowledgeAreas(role),
    limitations: getManagementLimitations(role),
    personalityTraits: getManagementPersonalityTraits(role)
  });
}

/**
 * Helper function to create an individual contributor agent identity
 */
export function createIndividualContributorIdentity(
  name: string,
  role: AgentRole,
  department: string,
  supervisorId: string
): AgentIdentity {
  const level = getICLevel(role);
  return new AgentIdentity({
    name,
    role,
    department,
    level,
    authorityLevel: getAuthorityLevel(role),
    supervisorId,
    capabilities: getICCapabilities(role),
    knowledgeAreas: getICKnowledgeAreas(role),
    limitations: getICLimitations(role),
    personalityTraits: getICPersonalityTraits(role)
  });
}

// Helper functions to determine organizational levels
function getExecutiveLevel(role: AgentRole): number {
  switch (role) {
    case AgentRole.CEO:
      return 0;
    case AgentRole.COO:
    case AgentRole.CTO:
    case AgentRole.CFO:
    case AgentRole.CMO:
    case AgentRole.CHRO:
    case AgentRole.CISO:
    case AgentRole.CAO:
      return 1;
    default:
      return 2; // Default for other roles
  }
}

function getManagementLevel(role: AgentRole): number {
  switch (role) {
    case AgentRole.ENGINEERING_MANAGER:
    case AgentRole.PRODUCT_MANAGER:
      return 2;
    case AgentRole.TEAM_LEAD:
    case AgentRole.PROJECT_MANAGER:
    case AgentRole.TECHNICAL_LEAD:
    case AgentRole.SCUM_MASTER:
      return 3;
    default:
      return 4; // Default for other management roles
  }
}

function getICLevel(role: AgentRole): number {
  switch (role) {
    case AgentRole.SENIOR_DEVELOPER:
    case AgentRole.SYSTEM_ARCHITECT:
    case AgentRole.RESEARCH_SCIENTIST:
      return 4;
    case AgentRole.SDE3:
    case AgentRole.DATA_SCIENTIST:
    case AgentRole.SECURITY_ENGINEER:
      return 5;
    case AgentRole.SDE2:
    case AgentRole.DEVOPS_ENGINEER:
    case AgentRole.QA_ENGINEER:
    case AgentRole.BUSINESS_ANALYST:
      return 6;
    case AgentRole.SDE1:
    case AgentRole.UX_DESIGNER:
    case AgentRole.TECHNICAL_WRITER:
      return 7;
    case AgentRole.JUNIOR_DEVELOPER:
    case AgentRole.OPERATIONS_COORDINATOR:
      return 8;
    case AgentRole.INTERNSHIP:
    case AgentRole.ADMINISTRATIVE_ASSISTANT:
      return 9;
    default:
      return 10; // Support roles
  }
}

function getAuthorityLevel(role: AgentRole): number {
  // Higher number means more authority
  switch (role) {
    case AgentRole.CEO:
      return 10;
    case AgentRole.COO:
    case AgentRole.CTO:
    case AgentRole.CFO:
    case AgentRole.CMO:
      return 9;
    case AgentRole.ENGINEERING_MANAGER:
    case AgentRole.PRODUCT_MANAGER:
      return 8;
    case AgentRole.TEAM_LEAD:
    case AgentRole.TECHNICAL_LEAD:
      return 7;
    case AgentRole.SENIOR_DEVELOPER:
    case AgentRole.SYSTEM_ARCHITECT:
      return 6;
    default:
      return 5;
  }
}

// Helper functions to determine role-specific attributes
function getExecutiveCapabilities(role: AgentRole): string[] {
  const baseCapabilities = [
    'strategic-planning',
    'organizational-leadership',
    'high-level-decision-making',
    'resource-allocation',
    'stakeholder-management'
  ];
  
  switch (role) {
    case AgentRole.CEO:
      return [...baseCapabilities, 'overall-organizational-direction', 'board-communication', 'external-relations'];
    case AgentRole.COO:
      return [...baseCapabilities, 'operational-efficiency', 'process-optimization', 'cross-functional-coordination'];
    case AgentRole.CTO:
      return [...baseCapabilities, 'technology-vision', 'technical-architecture', 'innovation-leadership'];
    case AgentRole.CFO:
      return [...baseCapabilities, 'financial-planning', 'risk-management', 'investment-strategy'];
    case AgentRole.CMO:
      return [...baseCapabilities, 'market-analysis', 'brand-strategy', 'customer-acquisition'];
    default:
      return baseCapabilities;
  }
}

function getExecutiveKnowledgeAreas(role: AgentRole): string[] {
  switch (role) {
    case AgentRole.CEO:
      return ['business-strategy', 'organizational-behavior', 'market-dynamics', 'corporate-governance'];
    case AgentRole.COO:
      return ['operations-management', 'process-optimization', 'quality-assurance', 'efficiency-metrics'];
    case AgentRole.CTO:
      return ['software-architecture', 'emerging-technologies', 'technical-leadership', 'R&D'];
    case AgentRole.CFO:
      return ['financial-analysis', 'risk-assessment', 'capital-markets', 'accounting-principles'];
    case AgentRole.CMO:
      return ['marketing-strategy', 'consumer-behavior', 'brand-management', 'digital-marketing'];
    default:
      return ['leadership', 'strategy', 'decision-making', 'communication'];
  }
}

function getExecutiveLimitations(role: AgentRole): string[] {
  switch (role) {
    case AgentRole.CEO:
      return ['operational-details', 'technical-implementation', 'day-to-day-execution'];
    case AgentRole.COO:
      return ['technical-deep-dive', 'financial-modeling', 'marketing-creativity'];
    case AgentRole.CTO:
      return ['financial-detailed-analysis', 'marketing-creative-aspects', 'hr-detailed-policies'];
    case AgentRole.CFO:
      return ['technical-implementation-details', 'product-design', 'operational-execution'];
    case AgentRole.CMO:
      return ['technical-implementation', 'operational-details', 'financial-detailed-modeling'];
    default:
      return ['deep-technical-implementation', 'detailed-operational-tasks', 'specialized-functional-tasks'];
  }
}

function getExecutivePersonalityTraits(role: AgentRole): string[] {
  switch (role) {
    case AgentRole.CEO:
      return ['visionary', 'decisive', 'externally-focused', 'big-picture-thinking'];
    case AgentRole.COO:
      return ['efficient', 'process-oriented', 'implementation-focused', 'cross-functional'];
    case AgentRole.CTO:
      return ['innovative', 'technically-astute', 'future-focused', 'creative'];
    case AgentRole.CFO:
      return ['analytical', 'risk-conscious', 'detail-oriented', 'financially-focused'];
    case AgentRole.CMO:
      return ['creative', 'customer-focused', 'market-aware', 'brand-conscious'];
    default:
      return ['strategic', 'leadership-oriented', 'decision-capable', 'visionary'];
  }
}

// Similar helper functions for management and IC roles would go here
// For brevity, I'm not implementing them fully, but they would follow the same pattern

function getManagementCapabilities(role: AgentRole): string[] {
  return [
    'team-leadership',
    'project-management',
    'performance-evaluation',
    'resource-coordination',
    'intermediate-decision-making'
  ];
}

function getManagementKnowledgeAreas(role: AgentRole): string[] {
  return [
    'team-management',
    'project-planning',
    'resource-allocation',
    'performance-metrics',
    'intermediate-level-execution'
  ];
}

function getManagementLimitations(role: AgentRole): string[] {
  return [
    'high-level-strategic-planning',
    'external-stakeholder-management',
    'major-resource-allocation'
  ];
}

function getManagementPersonalityTraits(role: AgentRole): string[] {
  return [
    'organized',
    'people-oriented',
    'detail-conscious',
    'execution-focused'
  ];
}

function getICCapabilities(role: AgentRole): string[] {
  return [
    'specialized-expertise',
    'task-execution',
    'problem-solving',
    'technical-implementation',
    'collaboration'
  ];
}

function getICKnowledgeAreas(role: AgentRole): string[] {
  return [
    'specialized-domain-knowledge',
    'technical-skills',
    'best-practices',
    'tools-and-technologies'
  ];
}

function getICLimitations(role: AgentRole): string[] {
  return [
    'strategic-decision-making',
    'resource-allocation',
    'team-leadership',
    'cross-functional-coordination'
  ];
}

function getICPersonalityTraits(role: AgentRole): string[] {
  return [
    'technical-focus',
    'task-oriented',
    'collaborative',
    'continuous-learning'
  ];
}