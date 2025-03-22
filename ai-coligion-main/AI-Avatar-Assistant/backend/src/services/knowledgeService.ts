import * as dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT || 'us-west4-gcp-free';
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'erp-knowledge';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Pinecone client
let pinecone: Pinecone | null = null;
if (PINECONE_API_KEY) {
  try {
    pinecone = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
    console.log('Pinecone initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Pinecone:', error);
  }
}

// Initialize AI clients for embeddings
let openai: OpenAI | null = null;
let genAI: GoogleGenerativeAI | null = null;
let embeddingModel: GenerativeModel | null = null;

if (OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  if (genAI) {
    // Create embedding model
    embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    console.log('Gemini embedding model initialized');
  }
}

// Mock FAQ data as a fallback if no vector DB is available
const FAQ_DATA = [
  {
    question: "What is the IDMS ERP System?",
    answer: "The IDMS ERP System is a comprehensive enterprise resource planning solution designed specifically for manufacturing industries. It helps businesses streamline Sales, Purchase, Inventory, Production, Quality Control, Dispatch, Finance, and Accounts while ensuring full compliance with GST regulations."
  },
  {
    question: "What are the main modules of the IDMS ERP System?",
    answer: "IDMS ERP consists of the following major modules: Sales & NPD, Planning, Purchase, Stores, Production, Maintenance, Quality, Dispatch & Logistics, HR & Admin, Accounts & Finance, and Settings."
  },
  {
    question: "How is each module structured in the IDMS ERP?",
    answer: "Each module in IDMS follows a three-tier data structure: Masters (store static or reference data), Transactions (dynamic operations performed in the ERP), and Reports (provide real-time insights and data analysis)."
  },
  {
    question: "What is GST and why is it important for businesses?",
    answer: "GST (Goods and Services Tax) is an indirect tax levied on the supply of goods and services in India. It replaces multiple indirect taxes and ensures a unified taxation system. Businesses must comply with GST regulations to avoid penalties and ensure smooth operations."
  },
  {
    question: "How does IDMS help in GST compliance?",
    answer: "IDMS ERP integrates GST into every transaction, ensuring automatic tax calculations, validation of GSTIN, real-time invoice generation, and GST return filing support (GSTR-1, GSTR-3B, etc.)."
  },
  {
    question: "What are the different types of GST in IDMS?",
    answer: "IDMS handles four types of GST: CGST (Central Goods and Services Tax) for intra-state sales collected by Central Govt., SGST (State Goods and Services Tax) for intra-state sales collected by State Govt., IGST (Integrated Goods and Services Tax) for inter-state sales collected by Central Govt., and UTGST (Union Territory GST) for sales within UTs collected by UT Govt."
  },
  {
    question: "What is the role of HSN & SAC codes in IDMS?",
    answer: "HSN (Harmonized System of Nomenclature) codes classify goods, while SAC (Service Accounting Code) codes classify services for GST purposes. IDMS assigns these codes to each item and service for accurate taxation."
  },
  {
    question: "How does E-Invoicing work in IDMS?",
    answer: "E-invoices are generated digitally and validated through the Government's Invoice Registration Portal (IRP), which assigns a unique Invoice Reference Number (IRN) and QR code."
  },
  {
    question: "When is an E-Way Bill required?",
    answer: "If goods worth more than ₹50,000 are being transported, an E-Way Bill must be generated via IDMS. It contains transporter details, invoice information, and route details."
  },
  {
    question: "What is the Reverse Charge Mechanism (RCM) in GST?",
    answer: "Under RCM, instead of the supplier, the buyer is liable to pay GST to the government for certain transactions (e.g., purchases from unregistered dealers)."
  },
  {
    question: "Can IDMS generate GST returns automatically?",
    answer: "Yes, IDMS compiles sales and purchase data to generate GSTR-1 (Outward Supplies), GSTR-3B (Monthly Summary Return), and GSTR-2A (Auto-drafted Inward Supplies Report)."
  },
  {
    question: "How does IDMS help in reconciling GST mismatches?",
    answer: "IDMS provides detailed GST reports and mismatch reports, ensuring accurate tax data before filing returns."
  },
  {
    question: "What is GSTR-1 and how does IDMS help in filing it?",
    answer: "GSTR-1 is a monthly or quarterly return that details all outward supplies (sales) made by a business. IDMS automatically compiles and formats sales data (invoices, credit notes, and debit notes) and generates GSTR-1 reports for direct upload to the GST portal."
  },
  {
    question: "What is GSTR-3B and how does IDMS assist in its filing?",
    answer: "GSTR-3B is a monthly summary return of both inward and outward supplies, along with GST payable. IDMS consolidates sales and purchase transactions and auto-computes GST liabilities, enabling seamless 3B return filing."
  },
  {
    question: "How does IDMS handle ITC (Input Tax Credit)?",
    answer: "Input Tax Credit (ITC) allows businesses to claim GST paid on purchases against their GST liability on sales. IDMS maintains a ledger of ITC claims, matches them with GSTR-2A (auto-drafted supplier details from GSTN), and reconciles any discrepancies."
  },
  {
    question: "What happens if there is a GST mismatch in IDMS?",
    answer: "IDMS flags mismatches in GST returns (e.g., invoices missing from supplier records in GSTR-2A). It provides reconciliation reports, suggesting corrections before final filing."
  },
  {
    question: "How does IDMS manage GST for inter-state vs. intra-state transactions?",
    answer: "IDMS automatically differentiates between intra-state transactions (CGST & SGST applied), inter-state transactions (IGST applied), exports (Zero-rated supply with/without LUT), and reverse charge transactions (RCM applicable)."
  },
  {
    question: "How are HSN-wise summary reports generated in IDMS?",
    answer: "GST law mandates that invoices include HSN/SAC codes based on turnover limits. IDMS compiles HSN-wise tax summaries and prepares reports in GST-compliant format."
  },
  {
    question: "What happens if a sales invoice is cancelled after GST has been filed?",
    answer: "If an invoice is cancelled before GST filing, it is simply removed. If cancelled after GST return submission, IDMS ensures a Credit Note is issued, adjusting tax liabilities in the next GST cycle."
  },
  {
    question: "How does IDMS handle GST-exempt and zero-rated supplies?",
    answer: "IDMS supports GST-exempt goods (e.g., agricultural products, healthcare services), Zero-rated supplies (exports, supplies to SEZ), and GST-exempt customers (charitable organizations, government departments)."
  },
  {
    question: "How does IDMS automate GST payments?",
    answer: "IDMS calculates net GST liability, generates a Challan for GST payment (PMT-06), and facilitates online payments via Net Banking, UPI, or NEFT/RTGS."
  },
  {
    question: "How does IDMS generate audit reports for GST compliance?",
    answer: "IDMS maintains a detailed audit trail for GST ledger reconciliation (sales vs. purchases), invoice modifications & corrections, and GSTR-9 (Annual Return) & GSTR-9C (Reconciliation Statement)."
  },
  {
    question: "What does the Sales Module do in IDMS ERP?",
    answer: "The Sales Module manages customer orders, invoices, shipments, and payments. It handles B2B Customers data, SKU Master information, Payment Terms, and Logistics details. Transactions include Quotation, Sales Order (SO), Dispatch Request (DRN), Advanced Shipment Notice (ASN), Proforma Invoice, Service Invoice, E-Way Bill, Sales Credit/Debit Notes, and Cancellation of SO/DRN."
  },
  {
    question: "What does the Purchase Module do in IDMS ERP?",
    answer: "The Purchase Module procures raw materials and services required for production. It manages Supplier Master data, Item Master information, Payment Terms, and GST/P details. Transactions include Purchase Orders (PO), Supplementary PO (SPO), Amendments, Cancellations, Purchase Debit Notes, and Job Work Orders (for outsourced production)."
  },
  {
    question: "What does the Stores Module do in IDMS ERP?",
    answer: "The Stores Module manages inward and outward movement of raw materials, work-in-progress (WIP), and finished goods. It organizes Inventory Zones like Main Store and Stock Preparation Store. Transactions include Goods Receipt Note (GRN), Goods Issue Note (GIN), and Stock Transfer (GTE – Intra-movement of material)."
  },
  {
    question: "What does the Production Module do in IDMS ERP?",
    answer: "The Production Module manages the manufacturing process from raw material to finished product. It handles Raw Material Master data and Production Process Definitions. Transactions include Batch Card Entry (Production Plan), Goods Transfer Request (GTR), Work Orders, and Job Card Entries."
  },
  {
    question: "What does the Quality Module do in IDMS ERP?",
    answer: "The Quality Module ensures materials, WIP, and finished products meet required standards. It manages Inspection Checklists and Standard Specifications. Transactions include Material Inspection (MRN, PDIR Entries), Job Card Inspections, and Batch Release."
  },
  {
    question: "What does the Dispatch & Logistics Module do in IDMS ERP?",
    answer: "The Dispatch & Logistics Module manages order fulfillment, shipping, and invoicing. It maintains Shipping Modes and Transport Partners information. Transactions include Sales Order Dispatch (DRN) and Advance Shipment Notices (ASN)."
  },
  {
    question: "How do I reset my password in the ERP system?",
    answer: "To reset your password, click on the 'Forgot Password' link on the login page. Enter your registered email address, and you'll receive instructions to create a new password."
  }
];

// Precompute FAQ embeddings (in a real system, this would be stored in a vector database)
let faqEmbeddings: Array<{question: string; answer: string; embedding: number[] | null}> = 
  FAQ_DATA.map(faq => ({...faq, embedding: null}));

// Sample ERP knowledge data for Pinecone if it's empty
const SAMPLE_ERP_DATA = [
  { id: 'erp001', text: 'To reset your password in the ERP system, click on the "Forgot Password" link on the login page and follow the instructions sent to your email.' },
  { id: 'erp002', text: 'Financial reports can be accessed from the Reports module. Go to Reports > Financial and select the type of report you need.' },
  { id: 'erp003', text: 'Creating a new purchase order requires navigating to Procurement > Purchase Orders and clicking the "New Order" button.' },
  { id: 'erp004', text: 'If you encounter an error in the ERP system, note the error code and contact IT support with details about what you were doing.' },
  { id: 'erp005', text: 'Adding new users to the ERP system is restricted to administrators. Contact your system administrator for user creation.' },
  { id: 'erp006', text: 'Inventory management features can be found under the Stock module, allowing you to track items, manage warehouses, and process transfers.' },
  { id: 'erp007', text: 'The difference between a purchase order and a purchase requisition is that requisitions are internal requests while orders are sent to vendors.' },
  { id: 'erp008', text: 'Customer returns can be processed through the Sales module by creating a return merchandise authorization (RMA).' }
];

/**
 * Generate embeddings using Gemini
 */
async function generateGeminiEmbedding(text: string): Promise<number[]> {
  if (!embeddingModel) {
    throw new Error('Gemini embedding model not initialized');
  }
  
  try {
    const embeddingResult = await embeddingModel.embedContent(text);
    const embedding = embeddingResult.embedding.values;
    return embedding;
  } catch (error) {
    console.error('Error generating Gemini embedding:', error);
    throw error;
  }
}

/**
 * Initialize Pinecone index and populate with sample data if needed
 * This would typically be done during service startup
 */
export const initializePineconeIndex = async (): Promise<boolean> => {
  if (!pinecone || !PINECONE_API_KEY) {
    console.log('Pinecone not initialized or API key missing');
    return false;
  }

  try {
    // Check if index exists, if not create it
    const indexList = await pinecone.listIndexes();
    
    // Check if our index exists in the list
    const indexExists = indexList.indexes?.some((index: any) => index.name === PINECONE_INDEX) || false;
    
    // Get the target dimension based on our preferred embedding model
    const targetDimension = embeddingModel ? 768 : 1536; // Gemini uses 768, OpenAI uses 1536
    
    if (!indexExists) {
      console.log(`Creating new Pinecone index: ${PINECONE_INDEX} with dimension ${targetDimension}`);
      
      await pinecone.createIndex({
        name: PINECONE_INDEX,
        dimension: targetDimension,
        metric: 'cosine',
        spec: { 
          serverless: { 
            cloud: 'aws', 
            region: 'us-east-1' 
          }
        }
      });
      
      // Wait for index to be ready
      console.log('Waiting for index to initialize...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    } else {
      // Index already exists, we need to get its dimension
      const index = pinecone.index(PINECONE_INDEX);
      const stats = await index.describeIndexStats();
      console.log('Index stats:', stats);
      
      // Check if the existing index dimension matches our embedding model
      if (stats.dimension !== targetDimension) {
        console.warn(`WARNING: Pinecone index dimension (${stats.dimension}) doesn't match embedding model dimension (${targetDimension})`);
        console.warn('To fix this, you need to delete the index and recreate it with the correct dimension.');
        
        if (stats.totalRecordCount && stats.totalRecordCount > 0) {
          console.log('Using existing index with current data. Embeddings will not be added.');
          return true;
        }
      }
    }
    
    const index = pinecone.index(PINECONE_INDEX);
    
    // Check if index has data
    const stats = await index.describeIndexStats();
    console.log('Index stats:', stats);
    
    // If index is empty and we have an embedding model (either OpenAI or Gemini)
    // Make sure embedding dimension matches index dimension
    if (
      (!stats.totalRecordCount || stats.totalRecordCount === 0) && 
      ((embeddingModel && stats.dimension === 768) || (openai && stats.dimension === 1536))
    ) {
      console.log('Populating index with sample ERP data');
      
      // Create embeddings for sample data using available model
      const embeddings = await Promise.all(
        SAMPLE_ERP_DATA.map(async (item) => {
          let values: number[];
          
          // Use the appropriate embedding model based on the index dimension
          if (embeddingModel && stats.dimension === 768) {
            // Use Gemini for embeddings
            values = await generateGeminiEmbedding(item.text);
          } else if (openai && stats.dimension === 1536) {
            // Use OpenAI embeddings
            const response = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: item.text
            });
            values = response.data[0].embedding;
          } else {
            throw new Error(`No suitable embedding model for index dimension ${stats.dimension}`);
          }
          
          return {
            id: item.id,
            values: values,
            metadata: { text: item.text }
          };
        })
      );
      
      // Upsert embeddings to Pinecone
      await index.upsert(embeddings);
      console.log('Sample ERP data loaded into Pinecone');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Pinecone index:', error);
    return false;
  }
};

// Initialize Pinecone on module load (this will run when the service starts)
if (PINECONE_API_KEY) {
  initializePineconeIndex().then(success => {
    if (success) {
      console.log('Pinecone index initialized successfully');
    } else {
      console.warn('Pinecone index initialization failed, falling back to local search');
    }
  });
}

interface KnowledgeResult {
  answer: string;
  confidence: number;
  context?: string;
}

/**
 * Search knowledge base for relevant information
 */
export const searchKnowledgeBase = async (query: string): Promise<KnowledgeResult | null> => {
  try {
    // If Pinecone is configured, use it
    if (PINECONE_API_KEY && pinecone) {
      return await searchPinecone(query);
    }
    
    // If OpenAI is available, use semantic search
    if (openai) {
      return await searchWithOpenAI(query);
    }
    
    // If Gemini is available, use semantic search
    if (genAI && embeddingModel) {
      return await searchWithGemini(query);
    }
    
    // Otherwise fall back to simple FAQ matching
    return searchLocalFAQ(query);
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    // Fallback to local FAQ on error
    return searchLocalFAQ(query);
  }
};

/**
 * Search Pinecone vector database
 */
const searchPinecone = async (query: string): Promise<KnowledgeResult | null> => {
  try {
    if (!pinecone || !PINECONE_API_KEY) {
      console.warn('Pinecone not properly initialized');
      throw new Error('Vector search dependencies not configured');
    }
    
    // Get the index
    const index = pinecone.index(PINECONE_INDEX);
    
    // Get index stats to determine dimension
    const stats = await index.describeIndexStats();
    const indexDimension = stats.dimension;
    
    // Check if we have a compatible embedding model for this index dimension
    const hasCompatibleModel = 
      (embeddingModel && indexDimension === 768) || 
      (openai && indexDimension === 1536);
    
    if (!hasCompatibleModel) {
      console.warn(`No suitable embedding model for index dimension ${indexDimension}`);
      console.log('Falling back to local search...');
      
      // Try Gemini embeddings for local search
      if (embeddingModel) {
        return await searchWithGemini(query);
      }
      // Try OpenAI embeddings for local search
      else if (openai) {
        return await searchWithOpenAI(query);
      }
      // Last resort: keyword matching
      else {
        return searchLocalFAQ(query);
      }
    }
    
    // Get embedding for the query using available model that matches the index dimension
    let queryEmbedding: number[];
    
    if (embeddingModel && indexDimension === 768) {
      // Use Gemini for embeddings
      queryEmbedding = await generateGeminiEmbedding(query);
    } else if (openai && indexDimension === 1536) {
      // Use OpenAI embeddings
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query
      });
      queryEmbedding = embedding.data[0].embedding;
    } else {
      throw new Error(`No suitable embedding model for index dimension ${indexDimension}`);
    }
    
    // Query Pinecone
    const queryResponse = await index.query({
      topK: 3,
      vector: queryEmbedding,
      includeValues: false,
      includeMetadata: true
    });
    
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      // Get the top match
      const topMatch = queryResponse.matches[0];
      
      // If the score is too low, consider it a non-match
      if (topMatch.score && topMatch.score < 0.70) {
        console.log(`Pinecone match score too low: ${topMatch.score}`);
        return null;
      }
      
      // Return the answer and metadata
      const metadata = topMatch.metadata as { text: string };
      
      return {
        answer: metadata.text,
        confidence: topMatch.score || 0.8,
        context: `Retrieved from knowledge base with score ${topMatch.score?.toFixed(2) || 'unknown'}`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching Pinecone:', error);
    
    // If Pinecone search fails, fall back to local search
    if (embeddingModel) {
      console.log('Falling back to Gemini embeddings for local search...');
      return await searchWithGemini(query);
    } else if (openai) {
      console.log('Falling back to OpenAI embeddings for local search...');
      return await searchWithOpenAI(query);
    } else {
      console.log('Falling back to keyword-based search...');
      return searchLocalFAQ(query);
    }
  }
};

/**
 * Search using OpenAI embeddings
 */
const searchWithOpenAI = async (query: string): Promise<KnowledgeResult | null> => {
  try {
    if (!openai) {
      throw new Error('OpenAI not initialized');
    }
    
    // Get embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Generate embeddings for FAQs if not already computed
    for (let i = 0; i < faqEmbeddings.length; i++) {
      if (!faqEmbeddings[i].embedding) {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: faqEmbeddings[i].question
        });
        faqEmbeddings[i].embedding = response.data[0].embedding;
      }
    }
    
    // Find the most similar FAQ
    let bestMatch: {index: number, similarity: number} = {index: -1, similarity: 0};
    
    for (let i = 0; i < faqEmbeddings.length; i++) {
      const embedding = faqEmbeddings[i].embedding;
      if (embedding) {
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        
        if (similarity > bestMatch.similarity) {
          bestMatch = {index: i, similarity: similarity};
        }
      }
    }
    
    // If we found a reasonable match
    if (bestMatch.similarity > 0.75) {
      return {
        answer: FAQ_DATA[bestMatch.index].answer,
        confidence: bestMatch.similarity,
        context: `This information relates to ${FAQ_DATA[bestMatch.index].question}`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error with OpenAI search:', error);
    return null;
  }
};

/**
 * Search using Gemini embeddings
 */
const searchWithGemini = async (query: string): Promise<KnowledgeResult | null> => {
  try {
    if (!embeddingModel) {
      throw new Error('Gemini embedding model not initialized');
    }
    
    // Get embedding for the query
    const queryEmbedding = await generateGeminiEmbedding(query);
    
    // Generate embeddings for FAQs if not already computed
    for (let i = 0; i < faqEmbeddings.length; i++) {
      if (!faqEmbeddings[i].embedding) {
        const embedding = await generateGeminiEmbedding(faqEmbeddings[i].question);
        faqEmbeddings[i].embedding = embedding;
      }
    }
    
    // Find the most similar FAQ
    let bestMatch: {index: number, similarity: number} = {index: -1, similarity: 0};
    
    for (let i = 0; i < faqEmbeddings.length; i++) {
      const embedding = faqEmbeddings[i].embedding;
      if (embedding) {
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        
        if (similarity > bestMatch.similarity) {
          bestMatch = {index: i, similarity: similarity};
        }
      }
    }
    
    // If we found a reasonable match
    if (bestMatch.similarity > 0.75) {
      return {
        answer: FAQ_DATA[bestMatch.index].answer,
        confidence: bestMatch.similarity,
        context: `This information relates to ${FAQ_DATA[bestMatch.index].question} (using Gemini embeddings)`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error with Gemini search:', error);
    return null;
  }
};

/**
 * Simple local FAQ search as fallback
 */
const searchLocalFAQ = (query: string): KnowledgeResult | null => {
  // Extremely simple keyword matching for demo purposes
  
  const queryLower = query.toLowerCase();
  
  for (const faq of FAQ_DATA) {
    // Check for keyword matches in the question
    const questionLower = faq.question.toLowerCase();
    
    // Get the main keywords from the question
    const keywords = questionLower
      .replace(/[?,.-]/g, '')
      .split(' ')
      .filter(word => word.length > 3);
    
    // Count how many keywords match
    const matchingKeywords = keywords.filter(keyword => 
      queryLower.includes(keyword)
    );
    
    // If more than 30% of keywords match, consider it a hit
    if (matchingKeywords.length > 0 && matchingKeywords.length / keywords.length >= 0.3) {
      return {
        answer: faq.answer,
        confidence: 0.7 * (matchingKeywords.length / keywords.length)
      };
    }
  }
  
  return null;
};

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
} 