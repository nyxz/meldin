import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import {openai} from '@ai-sdk/openai';
import {generateText} from 'ai';
import {BatchTranslationResult} from '@/lib/ai-translation';

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({message: 'Unauthorized'}, {status: 401});
        }

        // Parse request body
        const body = await req.json();
        const {items, sourceLanguage, targetLanguage} = body;

        // Validate request
        if (!items || !Array.isArray(items) || !sourceLanguage || !targetLanguage) {
            return NextResponse.json(
                {message: 'Invalid request. Missing required parameters.'},
                {status: 400}
            );
        }

        // Check if the batch size is within limits
        const maxBatchSize = parseInt(process.env.MAX_BATCH_TRANSLATIONS || '10', 10);
        if (items.length > maxBatchSize) {
            return NextResponse.json(
                {message: `Batch size exceeds maximum limit of ${maxBatchSize} items.`},
                {status: 400}
            );
        }

        // Prepare the prompt for batch translation
        const prompt = `You are a professional translator. Translate the given texts accurately while preserving the meaning and tone.
    
    Translate the following texts from ${sourceLanguage} to ${targetLanguage}. 
    Return a JSON array with objects containing "key" and "translatedText" properties.
    Do not include any explanations, just the JSON array.
    
    Input:
    ${JSON.stringify(items)}`;

        // Get the model from environment variables or use a default
        const modelName = process.env.AI_MODEL || 'gpt-3.5-turbo';

        // Use the generateText function from the AI SDK
        const {text: content} = await generateText({
            model: openai(modelName),
            prompt: prompt,
            temperature: 0.3,
            maxTokens: 2000,
        });

        // Parse the JSON response
        let results: BatchTranslationResult[];
        try {
            // Find the JSON array in the response (in case there's any extra text)
            const jsonMatch = content.match(/\[.*]/s);
            if (!jsonMatch) {
                return Promise.reject(new Error('No valid JSON array found in the response'));
            }

            results = JSON.parse(jsonMatch[0]);

            // Validate the structure of the results
            if (!Array.isArray(results) || !results.every(item =>
                typeof item === 'object' &&
                'key' in item &&
                'translatedText' in item
            )) {
                return Promise.reject(new Error('Invalid response format'));
            }
        } catch (error) {
            console.error('Error parsing AI response:', error);
            console.error('Raw response:', content);
            return NextResponse.json(
                {message: 'Failed to parse translation results'},
                {status: 500}
            );
        }

        // Return the translated texts
        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Translation error:', error);
        return NextResponse.json(
            {message: error.message || 'An error occurred during translation'},
            {status: 500}
        );
    }
}