import {getSession} from 'next-auth/react';

/**
 * Interface for a translation item in a batch
 */
export interface BatchTranslationItem {
    key: string;
    text: string;
}

/**
 * Interface for batch translation results
 */
export interface BatchTranslationResult {
    key: string;
    translatedText: string;
}

/**
 * Translates text using the AI translation API
 * @param text The text to translate
 * @param sourceLanguage The source language code (e.g., 'en', 'fr')
 * @param targetLanguage The target language code (e.g., 'en', 'fr')
 * @returns The translated text
 */
export async function translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
): Promise<string> {
    try {
        // Get the session to include the authentication token
        const session = await getSession();
        
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                sourceLanguage,
                targetLanguage,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return Promise.reject(new Error(error.message || 'Failed to translate text'));
        }

        // Get the response text
        const result = await response.text();

        // Clean up the result
        return result.trim();
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

/**
 * Translates multiple texts in a batch using the AI translation API
 * @param items Array of items to translate, each with a key and text
 * @param sourceLanguage The source language code (e.g., 'en', 'fr')
 * @param targetLanguage The target language code (e.g., 'en', 'fr')
 * @returns Array of translated items with keys and translated texts
 */
export async function translateBatch(
    items: BatchTranslationItem[],
    sourceLanguage: string,
    targetLanguage: string
): Promise<BatchTranslationResult[]> {
    try {
        // Get the session to include the authentication token
        const session = await getSession();
        if (!session?.user) {
            return Promise.reject(new Error('No user or token found.'));
        }
        
        const response = await fetch('/api/translate-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items,
                sourceLanguage,
                targetLanguage,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return Promise.reject(new Error(error.message || 'Failed to translate batch'));
        }

        // Get the response JSON
        return await response.json();
    } catch (error) {
        console.error('Batch translation error:', error);
        throw error;
    }
}

/**
 * Get the maximum number of translations allowed in a batch
 * @returns The maximum number of translations allowed in a batch
 */
export function getMaxBatchTranslations(): number {
    // Default to 10 if not set
    return parseInt(process.env.NEXT_PUBLIC_MAX_BATCH_TRANSLATIONS || '10', 10);
}

/**
 * Gets the full language name from a language code
 * @param code The language code (e.g., 'en', 'fr')
 * @returns The full language name (e.g., 'English', 'French')
 */
export function getLanguageName(code: string): string {
    const languageMap: Record<string, string> = {
        en: 'English',
        fr: 'French',
        es: 'Spanish',
        de: 'German',
        it: 'Italian',
        pt: 'Portuguese',
        nl: 'Dutch',
        ru: 'Russian',
        zh: 'Chinese',
        ja: 'Japanese',
        ko: 'Korean',
        ar: 'Arabic',
        hi: 'Hindi',
        bn: 'Bengali',
        pa: 'Punjabi',
        tr: 'Turkish',
        pl: 'Polish',
        uk: 'Ukrainian',
        vi: 'Vietnamese',
        th: 'Thai',
        bg: 'Bulgarian',
        el: 'Greek',
        cz: 'Czech'
    };

    return languageMap[code] || code;
}