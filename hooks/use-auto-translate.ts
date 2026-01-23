import {useCallback, useRef, useState} from 'react';
import {BatchTranslationItem, getLanguageName, getMaxBatchTranslations, translateBatch} from '@/lib/ai-translation';

export type AutoTranslateStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

interface AutoTranslateState {
    status: AutoTranslateStatus;
    currentLanguage: string | null;
    currentBatch: number;
    totalBatches: number;
    translatedCount: number;
    totalCount: number;
    error: string | null;
}

interface AutoTranslateOptions {
    onTranslate: (key: string, language: string, value: string) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
}

export function useAutoTranslate({onTranslate, onComplete, onError}: AutoTranslateOptions) {
    const [state, setState] = useState<AutoTranslateState>({
        status: 'idle',
        currentLanguage: null,
        currentBatch: 0,
        totalBatches: 0,
        translatedCount: 0,
        totalCount: 0,
        error: null,
    });

    const isPausedRef = useRef(false);
    const isStoppedRef = useRef(false);

    const translateBatchWithRetry = useCallback(
        async (
            items: BatchTranslationItem[],
            sourceLanguage: string,
            targetLanguage: string,
            maxBatchSize: number
        ): Promise<void> => {
            let currentBatchSize = Math.min(items.length, maxBatchSize);
            let remainingItems = [...items];

            while (remainingItems.length > 0) {
                if (isStoppedRef.current) {
                    throw new Error('Translation stopped by user');
                }

                while (isPausedRef.current) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    if (isStoppedRef.current) {
                        throw new Error('Translation stopped by user');
                    }
                }

                const currentBatch = remainingItems.slice(0, currentBatchSize);

                try {
                    const results = await translateBatch(
                        currentBatch,
                        getLanguageName(sourceLanguage),
                        getLanguageName(targetLanguage)
                    );

                    results.forEach((result) => {
                        const cleanResult = result.translatedText.replace(/^["']|["']$/g, '').trim();
                        onTranslate(result.key, targetLanguage, cleanResult);
                    });

                    remainingItems = remainingItems.slice(currentBatchSize);

                    setState((prev) => ({
                        ...prev,
                        translatedCount: prev.translatedCount + currentBatch.length,
                    }));

                    currentBatchSize = Math.min(remainingItems.length, maxBatchSize);
                } catch (error) {
                    if (currentBatchSize === 1) {
                        const failedKey = currentBatch[0].key;
                        console.error(`Failed to translate key: ${failedKey}`, error);

                        remainingItems = remainingItems.slice(1);
                        currentBatchSize = Math.min(remainingItems.length, maxBatchSize);

                        if (remainingItems.length === 0) {
                            throw new Error(`Translation failed for key: ${failedKey}`);
                        }
                    } else {
                        currentBatchSize = Math.max(1, Math.floor(currentBatchSize / 2));
                        console.log(`Retrying with smaller batch size: ${currentBatchSize}`);
                    }
                }
            }
        },
        [onTranslate]
    );

    const startAutoTranslate = useCallback(
        async (
            keysToTranslate: Array<{ key: string; sourceText: string }>,
            sourceLanguage: string,
            targetLanguages: string[]
        ) => {
            isPausedRef.current = false;
            isStoppedRef.current = false;

            const maxBatchSize = getMaxBatchTranslations();
            const totalItems = keysToTranslate.length * targetLanguages.length;

            setState({
                status: 'running',
                currentLanguage: null,
                currentBatch: 0,
                totalBatches: 0,
                translatedCount: 0,
                totalCount: totalItems,
                error: null,
            });

            try {
                for (const targetLanguage of targetLanguages) {
                    if (isStoppedRef.current) {
                        setState((prev) => ({...prev, status: 'stopped'}));
                        return;
                    }

                    setState((prev) => ({
                        ...prev,
                        currentLanguage: targetLanguage,
                    }));

                    const itemsForLanguage = keysToTranslate.map((item) => ({
                        key: item.key,
                        text: item.sourceText,
                    }));

                    await translateBatchWithRetry(
                        itemsForLanguage,
                        sourceLanguage,
                        targetLanguage,
                        maxBatchSize
                    );
                }

                setState((prev) => ({...prev, status: 'idle', currentLanguage: null}));
                if (onComplete) {
                    onComplete();
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Translation failed';
                setState((prev) => ({
                    ...prev,
                    status: 'error',
                    error: errorMessage,
                }));
                if (onError) {
                    onError(errorMessage);
                }
            }
        },
        [translateBatchWithRetry, onComplete, onError]
    );

    const pause = useCallback(() => {
        isPausedRef.current = true;
        setState((prev) => ({...prev, status: 'paused'}));
    }, []);

    const resume = useCallback(() => {
        isPausedRef.current = false;
        setState((prev) => ({...prev, status: 'running'}));
    }, []);

    const stop = useCallback(() => {
        isStoppedRef.current = true;
        isPausedRef.current = false;
        setState((prev) => ({...prev, status: 'stopped'}));
    }, []);

    return {
        state,
        startAutoTranslate,
        pause,
        resume,
        stop,
    };
}
