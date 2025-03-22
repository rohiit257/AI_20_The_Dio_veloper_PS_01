import * as dotenv from 'dotenv';

dotenv.config();

// In-memory storage for user context (would use a database in production)
const userContexts = new Map<string, UserContext>();

// ERP modules and common issues for contextual awareness
const ERP_MODULES = [
  'Finance',
  'Accounting',
  'Inventory',
  'Sales',
  'Purchasing',
  'HR',
  'Payroll',
  'CRM',
  'Manufacturing',
  'Project Management'
];

// Common ERP tasks
const COMMON_TASKS = {
  'Finance': ['Creating reports', 'Budget planning', 'Financial analysis', 'Audit preparation'],
  'Accounting': ['Journal entries', 'Reconciliation', 'Tax reporting', 'Financial closing'],
  'Inventory': ['Stock tracking', 'Inventory valuation', 'Warehouse management', 'Stocktaking'],
  'Sales': ['Order processing', 'Quotation management', 'Sales forecasting', 'Customer management'],
  'Purchasing': ['Purchase requisitions', 'Vendor management', 'Order tracking', 'Procurement analysis'],
  'HR': ['Employee onboarding', 'Performance management', 'Time tracking', 'Recruitment'],
  'Payroll': ['Salary processing', 'Tax calculations', 'Benefits management', 'Compliance reporting'],
  'CRM': ['Lead management', 'Customer support', 'Campaign tracking', 'Customer data analysis'],
  'Manufacturing': ['Production planning', 'Quality management', 'Bill of materials', 'Capacity planning'],
  'Project Management': ['Task assignment', 'Resource allocation', 'Timeline tracking', 'Budget monitoring']
};

export interface UserContext {
  conversationId: string;
  recentModules: string[];
  recentQueries: string[];
  detectedIssues: string[];
  preferredExplanationStyle?: 'technical' | 'simple' | 'visual';
  lastInteractionTime: Date;
}

export interface ContextualData {
  relevantModules: string[];
  suggestedContext: string;
  detectedIntent: string;
  possibleFollowUps: string[];
}

/**
 * Analyze user query to extract context and intent
 */
export const analyzeQuery = (query: string): { modules: string[], intent: string } => {
  const lowerQuery = query.toLowerCase();
  const detectedModules = [];
  let primaryIntent = 'general_information';
  
  // Check for modules mentioned
  for (const module of ERP_MODULES) {
    if (lowerQuery.includes(module.toLowerCase())) {
      detectedModules.push(module);
    }
  }
  
  // Detect common intents
  if (lowerQuery.includes('how to') || lowerQuery.includes('how do i')) {
    primaryIntent = 'how_to';
  } else if (lowerQuery.includes('error') || lowerQuery.includes('issue') || lowerQuery.includes('problem') || lowerQuery.includes('not working')) {
    primaryIntent = 'troubleshooting';
  } else if (lowerQuery.includes('compare') || lowerQuery.includes('difference between') || lowerQuery.includes('vs')) {
    primaryIntent = 'comparison';
  } else if (lowerQuery.includes('best practice') || lowerQuery.includes('recommend')) {
    primaryIntent = 'recommendation';
  } else if (lowerQuery.includes('setup') || lowerQuery.includes('configure')) {
    primaryIntent = 'configuration';
  }
  
  return {
    modules: detectedModules.length > 0 ? detectedModules : ['General'],
    intent: primaryIntent
  };
};

/**
 * Get contextual information for a query
 */
export const getContextualData = (query: string, conversationId?: string): ContextualData => {
  // Analyze the current query
  const { modules, intent } = analyzeQuery(query);
  
  // Get or create user context
  let userContext: UserContext;
  if (conversationId && userContexts.has(conversationId)) {
    userContext = userContexts.get(conversationId)!;
  } else if (conversationId) {
    userContext = {
      conversationId,
      recentModules: [],
      recentQueries: [],
      detectedIssues: [],
      lastInteractionTime: new Date()
    };
    userContexts.set(conversationId, userContext);
  } else {
    // No conversation ID, create temporary context
    userContext = {
      conversationId: 'temp',
      recentModules: [],
      recentQueries: [],
      detectedIssues: [],
      lastInteractionTime: new Date()
    };
  }
  
  // Update user context
  userContext.recentQueries.push(query);
  if (userContext.recentQueries.length > 5) {
    userContext.recentQueries.shift(); // Keep only last 5 queries
  }
  
  modules.forEach(module => {
    if (!userContext.recentModules.includes(module)) {
      userContext.recentModules.push(module);
      if (userContext.recentModules.length > 3) {
        userContext.recentModules.shift(); // Keep only last 3 modules
      }
    }
  });
  
  if (intent === 'troubleshooting') {
    userContext.detectedIssues.push(query);
    if (userContext.detectedIssues.length > 3) {
      userContext.detectedIssues.shift(); // Keep only last 3 issues
    }
  }
  
  userContext.lastInteractionTime = new Date();
  
  // Save updated context
  if (conversationId) {
    userContexts.set(conversationId, userContext);
  }
  
  // Generate suggested context based on user history
  let suggestedContext = '';
  
  if (userContext.recentModules.length > 0) {
    suggestedContext += `User is focusing on ${userContext.recentModules.join(', ')} modules. `;
  }
  
  if (userContext.detectedIssues.length > 0) {
    suggestedContext += `User has been troubleshooting issues related to: ${userContext.detectedIssues.join('; ')}. `;
  }
  
  // Generate possible follow-up questions
  const possibleFollowUps: string[] = [];
  
  if (intent === 'how_to' && modules[0] !== 'General') {
    // Suggest task-specific follow-ups
    const tasks = COMMON_TASKS[modules[0] as keyof typeof COMMON_TASKS];
    if (tasks) {
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      possibleFollowUps.push(`What's the best way to handle ${task}?`);
      possibleFollowUps.push(`Are there any shortcuts for ${task}?`);
    }
  }
  
  if (intent === 'troubleshooting') {
    possibleFollowUps.push('What are common errors in this process?');
    possibleFollowUps.push('How can I prevent this issue in the future?');
  }
  
  // Always provide some generic follow-ups
  possibleFollowUps.push('What best practices should I follow?');
  
  return {
    relevantModules: userContext.recentModules,
    suggestedContext,
    detectedIntent: intent,
    possibleFollowUps
  };
};

/**
 * Clear user context data when session ends
 */
export const clearUserContext = (conversationId: string): boolean => {
  if (userContexts.has(conversationId)) {
    userContexts.delete(conversationId);
    return true;
  }
  return false;
}; 