'use client';

import {useState} from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {AlertCircle, Loader, Sparkles} from 'lucide-react';
import {
    BatchTranslationItem, 
    BatchTranslationResult, 
    getLanguageName, 
    getMaxBatchTranslations, 
    translateBatch, 
    translateText
} from '@/lib/ai-translation';

interface AITranslationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onTranslate: (key: string, language: string, value: string) => void;
    sourceText: string;
    sourceLanguage: string;
    targetLanguage: string;
    translationKey: string;
    isBatch?: boolean;
    batchItems?: BatchTranslationItem[];
}

export function AITranslationDialog({
                                        isOpen,
                                        onClose,
                                        onTranslate,
                                        sourceText,
                                        sourceLanguage,
                                        targetLanguage,
                                        translationKey,
                                        isBatch = false,
                                        batchItems = []
                                    }: AITranslationDialogProps) {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    
    const maxBatchSize = getMaxBatchTranslations();
    
    // Check if batch size exceeds the limit
    const batchSizeExceeded = isBatch && batchItems.length > maxBatchSize;
    const batchItemsToProcess = isBatch ? batchItems.slice(0, maxBatchSize) : [];

    const handleTranslate = async () => {
        setIsTranslating(true);
        setError(null);

        try {
            if (isBatch && batchItems.length > 0) {
                // Batch translation
                setBatchProgress({ current: 0, total: batchItemsToProcess.length });
                
                const results = await translateBatch(
                    batchItemsToProcess,
                    getLanguageName(sourceLanguage),
                    getLanguageName(targetLanguage)
                );
                
                // Apply all translations
                results.forEach(result => {
                    const cleanResult = result.translatedText.replace(/^["']|["']$/g, '').trim();
                    onTranslate(result.key, targetLanguage, cleanResult);
                });
                
                onClose();
            } else {
                // Single translation
                const result = await translateText(
                    sourceText,
                    getLanguageName(sourceLanguage),
                    getLanguageName(targetLanguage)
                );

                // Clean up the result - remove any quotes or extra whitespace
                const cleanResult = result.replace(/^["']|["']$/g, '').trim();

                setTranslatedText(cleanResult);
                onTranslate(translationKey, targetLanguage, cleanResult);
                onClose();
            }
        } catch (err) {
            setError('Failed to translate text. Please try again.');
            console.error('Translation error:', err);
        } finally {
            setIsTranslating(false);
            setBatchProgress({ current: 0, total: 0 });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-purple-400"/>
                        <span>{isBatch ? 'Batch AI Translation' : 'AI Translation'}</span>
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {isBatch 
                            ? `Translate ${batchItemsToProcess.length} items using AI from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}`
                            : `Translate text using AI from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
                    {isBatch ? (
                        <>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-300">Batch Translation Details:</div>
                                <div className="p-3 bg-gray-800 rounded-md text-gray-200 border border-gray-700">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <span>Items to translate:</span>
                                            <span className="font-medium text-cyan-400">{batchItemsToProcess.length}</span>
                                        </div>
                                        {batchSizeExceeded && (
                                            <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-300 text-sm">
                                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium">Batch size limit exceeded</p>
                                                    <p>Only the first {maxBatchSize} items will be translated in this batch.</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-400 mb-1">Sample item:</p>
                                            <div className="p-2 bg-gray-700/50 rounded border border-gray-600 text-sm">
                                                {sourceText || <span className="text-gray-500 italic">No sample available</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-300">Source Text ({sourceLanguage}):</div>
                            <div className="p-3 bg-gray-800 rounded-md text-gray-200 border border-gray-700">
                                {sourceText || <span className="text-gray-500 italic">No source text available</span>}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300">
                            {error}
                        </div>
                    )}
                    
                    {isTranslating && isBatch && batchProgress.total > 0 && (
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-md text-cyan-300">
                            <div className="flex items-center gap-2">
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Translating batch...</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <div className="flex gap-3 w-full justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-gray-700 hover:bg-gray-800 hover:text-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTranslate}
                            disabled={isTranslating || (isBatch ? batchItemsToProcess.length === 0 : !sourceText)}
                            className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white"
                        >
                            {isTranslating ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin"/>
                                    {isBatch ? `Translating ${batchItemsToProcess.length} items...` : 'Translating...'}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2"/>
                                    {isBatch ? `Translate ${batchItemsToProcess.length} items` : 'Translate with AI'}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}