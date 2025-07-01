import { getSession } from 'next-auth/react';

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
            throw new Error(error.message || 'Failed to translate text');
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