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
import {Loader, Sparkles} from 'lucide-react';
import {getLanguageName, translateText} from '@/lib/ai-translation';

interface AITranslationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onTranslate: (key: string, language: string, value: string) => void;
    sourceText: string;
    sourceLanguage: string;
    targetLanguage: string;
    translationKey: string;
}

export function AITranslationDialog({
                                        isOpen,
                                        onClose,
                                        onTranslate,
                                        sourceText,
                                        sourceLanguage,
                                        targetLanguage,
                                        translationKey
                                    }: AITranslationDialogProps) {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleTranslate = async () => {
        setIsTranslating(true);
        setError(null);

        try {
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
        } catch (err) {
            setError('Failed to translate text. Please try again.');
            console.error('Translation error:', err);
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-purple-400"/>
                        <span>AI Translation</span>
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Translate text using AI
                        from {getLanguageName(sourceLanguage)} to {getLanguageName(targetLanguage)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-300">Source Text ({sourceLanguage}):</div>
                        <div className="p-3 bg-gray-800 rounded-md text-gray-200 border border-gray-700">
                            {sourceText || <span className="text-gray-500 italic">No source text available</span>}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300">
                            {error}
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
                            disabled={isTranslating || !sourceText}
                            className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white"
                        >
                            {isTranslating ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin"/>
                                    Translating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2"/>
                                    Translate with AI
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}