'use client';

import {useCallback, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {FileUpload} from '@/components/file-upload';
import {TranslationTable} from '@/components/translation-table';
import {ArrowLeft, Download, FileText, Languages, Maximize2, Minimize2, Sparkles, Trash2} from 'lucide-react';
import {Loader} from '@/components/ui/loader';
import {ConfirmationDialog} from '@/components/confirmation-dialog';

interface TranslationFile {
    name: string;
    content: Record<string, any>;
    language: string;
}

interface FlattenedTranslation {
    key: string;
    values: Record<string, string>;
    section: string;
    subsection?: string;
}

// View states
type ViewState = 'upload' | 'results';

export default function Home() {
    const [sourceFile, setSourceFile] = useState<TranslationFile | null>(null);
    const [targetFiles, setTargetFiles] = useState<TranslationFile[]>([]);
    const [translations, setTranslations] = useState<FlattenedTranslation[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewState, setViewState] = useState<ViewState>('upload');
    const [isFullWidth, setIsFullWidth] = useState(false);

    // Selection state
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    // Confirmation dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    const flattenObject = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
        const flattened: Record<string, string> = {};

        for (const key in obj) {
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (typeof obj[key] === 'object' && obj[key] !== null) {
                Object.assign(flattened, flattenObject(obj[key], newKey));
            } else {
                flattened[newKey] = obj[key]?.toString() || '';
            }
        }

        return flattened;
    };

    const processTranslations = useCallback(() => {
        if (!sourceFile) return;

        setIsProcessing(true);

        // Use setTimeout to allow the UI to update and show the loader
        setTimeout(() => {
            const sourceFlat = flattenObject(sourceFile.content);
            const allKeys = Object.keys(sourceFlat);

            const processed: FlattenedTranslation[] = allKeys.map(key => {
                const values: Record<string, string> = {
                    [sourceFile.language]: sourceFlat[key]
                };

                targetFiles.forEach(file => {
                    const targetFlat = flattenObject(file.content);
                    values[file.language] = targetFlat[key] || '';
                });

                const parts = key.split('.');
                const section = parts[0];
                const subsection = parts.length > 2 ? parts.slice(0, -1).join('.') : undefined;

                return {
                    key,
                    values,
                    section,
                    subsection
                };
            });

            setTranslations(processed);
            setIsProcessing(false);
            setViewState('results');
        }, 500); // Small delay to show the loader
    }, [sourceFile, targetFiles]);

    const handleSourceFileUpload = (file: TranslationFile) => {
        setSourceFile(file);
        setTranslations([]);
        setViewState('upload');
    };

    const handleTargetFileUpload = (file: TranslationFile) => {
        setTargetFiles(prev => {
            const existing = prev.find(f => f.language === file.language);
            if (existing) {
                return prev.map(f => f.language === file.language ? file : f);
            }
            return [...prev, file];
        });
        setTranslations([]);
    };

    const removeTargetFile = (language: string) => {
        setTargetFiles(prev => prev.filter(f => f.language !== language));
        setTranslations([]);
    };

    const updateTranslation = (key: string, language: string, value: string) => {
        setTranslations(prev =>
            prev.map(translation =>
                translation.key === key
                    ? {...translation, values: {...translation.values, [language]: value}}
                    : translation
            )
        );
    };

    const deleteTranslation = (key: string) => {
        setKeyToDelete(key);
        setIsBulkDelete(false);
        setIsDeleteDialogOpen(true);
    };

    const deleteBulkTranslations = () => {
        setIsBulkDelete(true);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (isBulkDelete) {
            // Delete all selected keys
            setTranslations(prev => prev.filter(translation => !selectedKeys.has(translation.key)));
            setSelectedKeys(new Set());
        } else if (keyToDelete) {
            // Delete single key
            setTranslations(prev => prev.filter(translation => translation.key !== keyToDelete));
            setKeyToDelete(null);
        }
    };

    const handleSelectionChange = (keys: Set<string>) => {
        setSelectedKeys(keys);
    };

    const downloadFile = async (language: string) => {
        const fileTranslations = translations.reduce((acc, translation) => {
            const keys = translation.key.split('.');
            let current = acc;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = translation.values[language] || '';
            return acc;
        }, {} as Record<string, any>);

        const blob = new Blob([JSON.stringify(fileTranslations, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${language}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getAllLanguages = () => {
        const languages = new Set<string>();
        if (sourceFile) languages.add(sourceFile.language);
        targetFiles.forEach(file => languages.add(file.language));
        return Array.from(languages);
    };

    const getMissingCount = () => {
        return translations.reduce((count, translation) => {
            const missing = Object.values(translation.values).filter(value => !value).length;
            return count + missing;
        }, 0);
    };

    const goBackToUpload = () => {
        setViewState('upload');
    };

    const toggleFullWidth = () => {
        setIsFullWidth(prev => !prev);
    };

    // Render the header section
    const renderHeader = () => (
        <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
                <div
                    className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                    <Languages className="w-8 h-8 text-cyan-400"/>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Translation Manager
                </h1>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Manage your next-intl translations with ease. Upload your source file and target translations to
                compare, edit, and export your localization files.
            </p>
        </div>
    );

    // Render the upload view
    const renderUploadView = () => (
        <>
            {renderHeader()}

            {/* File Upload Section */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Source File */}
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-cyan-400">
                            <FileText className="w-5 h-5"/>
                            Source Language
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sourceFile ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-cyan-300">{sourceFile.name}</p>
                                            <p className="text-sm text-gray-400">Language: {sourceFile.language}</p>
                                        </div>
                                        <Badge variant="secondary"
                                               className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                                            {Object.keys(flattenObject(sourceFile.content)).length} keys
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSourceFile(null)}
                                    className="border-gray-700 hover:border-gray-600"
                                >
                                    Change Source File
                                </Button>
                            </div>
                        ) : (
                            <FileUpload
                                onFileUpload={handleSourceFileUpload}
                                accept=".json"
                                label="Drop your source translation file here"
                                description="Upload your primary language file (e.g., en.json)"
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Target Files */}
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-400">
                            <Sparkles className="w-5 h-5"/>
                            Target Languages
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {targetFiles.map((file) => (
                                <div key={file.language}
                                     className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-purple-300">{file.name}</p>
                                            <p className="text-sm text-gray-400">Language: {file.language}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary"
                                                   className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                                {Object.keys(flattenObject(file.content)).length} keys
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeTargetFile(file.language)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <FileUpload
                                onFileUpload={handleTargetFileUpload}
                                accept=".json"
                                label="Add target translation files"
                                description="Upload translation files for other languages"
                                className="border-dashed border-purple-500/30 hover:border-purple-500/50"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Process Button */}
            {sourceFile && targetFiles.length > 0 && (
                <div className="text-center mb-8">
                    <Button
                        onClick={processTranslations}
                        disabled={isProcessing}
                        size="lg"
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0 px-8 py-3 text-lg font-medium"
                    >
                        {isProcessing ? (
                            <div className="flex items-center gap-2">
                                <Loader size="sm" className="mr-2"/>
                                Processing...
                            </div>
                        ) : (
                            'Process Translations'
                        )}
                    </Button>
                </div>
            )}

            {/* Loading State */}
            {isProcessing && (
                <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl max-w-md w-full">
                        <Loader size="lg" className="mx-auto mb-4" text="Processing translations..."/>
                        <p className="text-center text-gray-400 mt-4">
                            Analyzing and comparing translation keys across all files...
                        </p>
                    </div>
                </div>
            )}
        </>
    );

    // Render the results view
    const renderResultsView = () => (
        <>
            <div className={`transition-all duration-300 ${isFullWidth ? 'max-w-none' : 'max-w-7xl mx-auto'}`}>
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goBackToUpload}
                            className="border-gray-700 hover:border-gray-600"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2"/>
                            Back to Upload
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFullWidth}
                            className="border-gray-700 hover:border-gray-600"
                        >
                            {isFullWidth ? (
                                <>
                                    <Minimize2 className="w-4 h-4 mr-2"/>
                                    Collapse View
                                </>
                            ) : (
                                <>
                                    <Maximize2 className="w-4 h-4 mr-2"/>
                                    Expand View
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-cyan-300">Translation Results</h2>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                                {translations.length} keys
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                                {getAllLanguages().length} languages
                            </Badge>
                            {getMissingCount() > 0 && (
                                <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">
                                    {getMissingCount()} missing
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Download Buttons */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {getAllLanguages().map(language => (
                            <Button
                                key={language}
                                onClick={() => downloadFile(language)}
                                variant="outline"
                                size="sm"
                                className="border-gray-700 hover:border-gray-600"
                            >
                                <Download className="w-4 h-4 mr-2"/>
                                Download {language}.json
                            </Button>
                        ))}
                    </div>

                    {/* Translation Table */}
                    <TranslationTable
                        translations={translations}
                        languages={getAllLanguages()}
                        onUpdateTranslation={updateTranslation}
                        onDeleteTranslation={deleteTranslation}
                        selectedKeys={selectedKeys}
                        onSelectionChange={handleSelectionChange}
                    />
                </div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <div
                className={`container mx-auto px-4 py-8 ${viewState === 'upload' || !isFullWidth ? 'max-w-7xl' : 'max-w-none'}`}>
                {viewState === 'upload' ? renderUploadView() : renderResultsView()}
            </div>

            {/* Bottom Toolbar for Bulk Actions */}
            {selectedKeys.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
                    <div
                        className={`max-w-3xl w-full bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-800 p-3 shadow-xl transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-5`}>
                        <div className="flex items-center gap-24 justify-between">
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary"
                                       className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-3 py-1.5">
                                    {selectedKeys.size} {selectedKeys.size === 1 ? 'key' : 'keys'} selected
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedKeys(new Set())}
                                    className="text-gray-400 hover:text-gray-300 h-8"
                                >
                                    Clear
                                </Button>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={deleteBulkTranslations}
                                    className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                                >
                                    <Trash2 className="w-4 h-4 mr-2"/>
                                    Delete Selected
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog for Deleting Translation */}
            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title={isBulkDelete ? "Delete Selected Translations" : "Delete Translation"}
                description={isBulkDelete
                    ? `Are you sure you want to delete ${selectedKeys.size} selected translation ${selectedKeys.size === 1 ? 'key' : 'keys'}? This action cannot be undone.`
                    : `Are you sure you want to delete the translation key "${keyToDelete}"? This action cannot be undone.`
                }
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}