import { processWithGemini } from '../services/geminiService.js';
import { processWithAdvancedGemini } from '../services/openaiService.js';
import { searchKnowledgeBase } from '../services/knowledgeService.js';
import { getContextualData } from '../services/contextService.js';
/**
 * Process user queries using selected AI model and knowledge base
 */
export const processQuery = async (req, res) => {
    try {
        const { query, conversationId, model = 'gemini' } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        // Get contextual data for the query
        const contextData = getContextualData(query, conversationId);
        // First attempt to find answers from the knowledge base
        const kbResult = await searchKnowledgeBase(query);
        // If we have a high-confidence match from the knowledge base, return it
        if (kbResult && kbResult.confidence > 0.8) {
            return res.json({
                answer: kbResult.answer,
                source: 'knowledge_base',
                context: contextData
            });
        }
        // Prepare context information
        const relevantInfo = kbResult && kbResult.confidence > 0.5
            ? `Consider this potentially relevant information: ${kbResult.answer}\n${contextData.suggestedContext}`
            : contextData.suggestedContext;
        // Process the query with the selected model
        let result;
        let source;
        if (model === 'advanced_gemini') {
            result = await processWithAdvancedGemini(query, conversationId, {
                relevantInfo,
                userHistory: `User has recently been looking at ${contextData.relevantModules.join(', ')}`,
                detectedIntent: contextData.detectedIntent
            });
            source = 'advanced_gemini_api';
        }
        else {
            // Default to Gemini
            result = await processWithGemini(query, conversationId, { relevantInfo });
            source = 'gemini_api';
        }
        return res.json({
            answer: result,
            source,
            context: contextData
        });
    }
    catch (error) {
        console.error('Error processing query:', error);
        return res.status(500).json({ error: 'Failed to process query' });
    }
};
