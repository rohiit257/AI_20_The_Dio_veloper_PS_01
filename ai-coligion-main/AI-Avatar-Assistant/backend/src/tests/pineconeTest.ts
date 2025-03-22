import * as dotenv from 'dotenv';
import { searchKnowledgeBase, initializePineconeIndex } from '../services/knowledgeService.js';

// Load environment variables
dotenv.config();

/**
 * Simple test script to verify Pinecone integration
 */
const testPinecone = async () => {
  try {
    console.log('Testing Pinecone integration...');
    
    // Step 1: Initialize Pinecone
    console.log('1. Initializing Pinecone index...');
    const initialized = await initializePineconeIndex();
    console.log(`   Index initialization: ${initialized ? 'SUCCESS' : 'FAILED'}`);
    
    if (!initialized) {
      console.error('Unable to initialize Pinecone index. Check your API key and environment.');
      process.exit(1);
    }
    
    // Step 2: Test queries
    console.log('\n2. Testing knowledge base queries...');
    
    const testQueries = [
      'How do I reset my password?',
      'Where can I find financial reports?',
      'How do I create a purchase order?',
      'What do I do if I get an error?',
      'Can you explain the difference between requisition and purchase order?'
    ];
    
    for (const query of testQueries) {
      console.log(`\nQuery: "${query}"`);
      const result = await searchKnowledgeBase(query);
      
      if (result) {
        console.log(`✅ MATCH FOUND (confidence: ${result.confidence.toFixed(2)})`);
        console.log(`Answer: ${result.answer}`);
        console.log(`Context: ${result.context || 'None'}`);
      } else {
        console.log('❌ NO MATCH FOUND');
      }
    }
    
    console.log('\nPinecone test complete!');
  } catch (error) {
    console.error('Error during Pinecone test:', error);
  }
};

// Run the test
testPinecone(); 