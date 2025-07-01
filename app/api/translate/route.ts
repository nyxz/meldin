import {openai} from '@ai-sdk/openai';
import {generateText} from 'ai';
import {NextRequest, NextResponse} from 'next/server';


export async function POST(req: NextRequest) {
    try {
        const {text, sourceLanguage, targetLanguage} = await req.json();

        if (!text || !sourceLanguage || !targetLanguage) {
            return NextResponse.json(
                {error: 'Missing required fields: text, sourceLanguage, targetLanguage'},
                {status: 400}
            );
        }

        // Create the prompt for translation
        const prompt = `You are a professional translator. Provide accurate translations without additional commentary.
    
    Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
    Maintain the same tone, formality level, and meaning. Only return the translated text without any explanations.
    
    Text to translate: "${text}"`;

        // Get the model from environment variables or use a default
        const modelName = process.env.AI_MODEL || 'gpt-3.5-turbo';

        // Use the generateText function from the AI SDK
        const {text: translatedText} = await generateText({
            model: openai(modelName),
            prompt: prompt,
            temperature: 0.3,
            maxTokens: 1000,
        });

        // Return a response with the translated text
        return new Response(translatedText);
    } catch (error) {
        console.error('Error in translation API:', error);
        return NextResponse.json(
            {error: 'Failed to translate text'},
            {status: 500}
        );
    }
}