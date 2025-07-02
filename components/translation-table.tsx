'use client';

import {useEffect, useState} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Checkbox} from '@/components/ui/checkbox';
import {AlertCircle, Check, ChevronDown, ChevronRight, MinusCircle, Sparkles, Trash2} from 'lucide-react';
import {cn} from '@/lib/utils';
import {AITranslationDialog} from '@/components/ai-translation-dialog';

interface FlattenedTranslation {
    key: string;
    values: Record<string, string>;
    section: string;
    subsection?: string;
}

interface TranslationTableProps {
    translations: FlattenedTranslation[];
    languages: string[];
    onUpdateTranslation: (key: string, language: string, value: string) => void;
    onDeleteTranslation?: (key: string) => void;
    selectedKeys?: Set<string>;
    onSelectionChange?: (keys: Set<string>) => void;
}

export function TranslationTable({
                                     translations,
                                     languages,
                                     onUpdateTranslation,
                                     onDeleteTranslation,
                                     selectedKeys = new Set<string>(),
                                     onSelectionChange
                                 }: TranslationTableProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [localSelectedKeys, setLocalSelectedKeys] = useState<Set<string>>(selectedKeys);

    // AI Translation state
    const [isTranslationDialogOpen, setIsTranslationDialogOpen] = useState(false);
    const [translationDialogData, setTranslationDialogData] = useState<{
        key: string;
        sourceLanguage: string;
        targetLanguage: string;
        sourceText: string;
        isBatch?: boolean;
        batchItems?: Array<{key: string, text: string}>;
    } | null>(null);

    // Sync with parent component's selection state
    useEffect(() => {
        setLocalSelectedKeys(selectedKeys);
    }, [selectedKeys]);

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const groupTranslationsBySection = () => {
        const groups: Record<string, FlattenedTranslation[]> = {};

        translations.forEach(translation => {
            const section = translation.section;
            if (!groups[section]) {
                groups[section] = [];
            }
            groups[section].push(translation);
        });

        return groups;
    };

    const getSectionStats = (sectionTranslations: FlattenedTranslation[]) => {
        const total = sectionTranslations.length * languages.length;
        const missing = sectionTranslations.reduce((count, translation) => {
            return count + Object.values(translation.values).filter(value => !value).length;
        }, 0);

        return {total, missing, complete: total - missing};
    };

    const handleCellEdit = (key: string, language: string, value: string) => {
        onUpdateTranslation(key, language, value);
        setEditingCell(null);
    };

    // AI Translation handling
    const openTranslationDialog = (key: string, targetLanguage: string) => {
        const translation = translations.find(t => t.key === key);
        if (!translation) return;

        // Find the source language (first non-empty value, preferably the first language)
        const sourceLanguage = languages.find(lang => translation.values[lang]) || languages[0];
        const sourceText = translation.values[sourceLanguage] || '';

        if (!sourceText) {
            alert('No source text available for translation');
            return;
        }

        setTranslationDialogData({
            key,
            sourceLanguage,
            targetLanguage,
            sourceText,
            isBatch: false
        });
        setIsTranslationDialogOpen(true);
    };
    
    // Batch AI Translation handling
    const openBatchTranslationDialog = (targetLanguage: string) => {
        if (localSelectedKeys.size === 0) {
            alert('Please select at least one translation to translate');
            return;
        }
        
        // Get the source language (first language in the list)
        const sourceLanguage = languages[0];
        
        // Collect all selected translations
        const selectedTranslations = translations.filter(t => 
            localSelectedKeys.has(t.key) && t.values[sourceLanguage]
        );
        
        if (selectedTranslations.length === 0) {
            alert('No source texts available for translation');
            return;
        }
        
        // Create batch items
        const batchItems = selectedTranslations.map(t => ({
            key: t.key,
            text: t.values[sourceLanguage] || ''
        }));
        
        // Use the first item's text as the sample text
        const sampleText = batchItems[0].text;
        
        setTranslationDialogData({
            key: 'batch', // Special key for batch translations
            sourceLanguage,
            targetLanguage,
            sourceText: sampleText,
            isBatch: true,
            batchItems
        });
        setIsTranslationDialogOpen(true);
    };

    // Selection handling
    const toggleSelection = (key: string, event?: React.MouseEvent) => {
        // If shift key is pressed, we want to select a range
        if (event?.shiftKey && localSelectedKeys.size > 0) {
            // Find the last selected key and current key indices
            const allKeys = translations.map(t => t.key);
            const lastSelectedKey = Array.from(localSelectedKeys).pop();
            const lastSelectedIndex = allKeys.indexOf(lastSelectedKey || '');
            const currentIndex = allKeys.indexOf(key);

            if (lastSelectedIndex !== -1 && currentIndex !== -1) {
                // Select all keys in the range
                const start = Math.min(lastSelectedIndex, currentIndex);
                const end = Math.max(lastSelectedIndex, currentIndex);

                const newSelection = new Set(localSelectedKeys);
                for (let i = start; i <= end; i++) {
                    newSelection.add(allKeys[i]);
                }

                updateSelection(newSelection);
                return;
            }
        }

        // Normal toggle behavior
        const newSelection = new Set(localSelectedKeys);
        if (newSelection.has(key)) {
            newSelection.delete(key);
        } else {
            newSelection.add(key);
        }

        updateSelection(newSelection);
    };

    const toggleSectionSelection = (section: string, selected: boolean) => {
        const sectionKeys = translations
            .filter(t => t.section === section)
            .map(t => t.key);

        const newSelection = new Set(localSelectedKeys);

        if (selected) {
            // Add all keys from this section
            sectionKeys.forEach(key => newSelection.add(key));
        } else {
            // Remove all keys from this section
            sectionKeys.forEach(key => newSelection.delete(key));
        }

        updateSelection(newSelection);
    };

    const updateSelection = (newSelection: Set<string>) => {
        setLocalSelectedKeys(newSelection);
        if (onSelectionChange) {
            onSelectionChange(newSelection);
        }
    };

    const isSectionFullySelected = (section: string): boolean => {
        const sectionKeys = translations
            .filter(t => t.section === section)
            .map(t => t.key);

        return sectionKeys.every(key => localSelectedKeys.has(key));
    };

    const isSectionPartiallySelected = (section: string): boolean => {
        const sectionKeys = translations
            .filter(t => t.section === section)
            .map(t => t.key);

        const hasSelected = sectionKeys.some(key => localSelectedKeys.has(key));
        const allSelected = sectionKeys.every(key => localSelectedKeys.has(key));

        return hasSelected && !allSelected;
    };

    const groupedTranslations = groupTranslationsBySection();

    return (
        <div className="space-y-4">
            {/* AI Translation Dialog */}
            {translationDialogData && (
                <AITranslationDialog
                    isOpen={isTranslationDialogOpen}
                    onClose={() => setIsTranslationDialogOpen(false)}
                    onTranslate={onUpdateTranslation}
                    sourceText={translationDialogData.sourceText}
                    sourceLanguage={translationDialogData.sourceLanguage}
                    targetLanguage={translationDialogData.targetLanguage}
                    translationKey={translationDialogData.key}
                />
            )}

            {Object.entries(groupedTranslations).map(([section, sectionTranslations]) => {
                const isExpanded = expandedSections.has(section);
                const stats = getSectionStats(sectionTranslations);

                return (
                    <Card key={section} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm overflow-hidden">
                        {/* Section Header */}
                        <div
                            className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors border-b border-gray-800"
                            onClick={() => toggleSection(section)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={`section-${section}`}
                                            checked={isSectionFullySelected(section)}
                                            data-state={
                                                isSectionFullySelected(section)
                                                    ? 'checked'
                                                    : isSectionPartiallySelected(section)
                                                        ? 'indeterminate'
                                                        : 'unchecked'
                                            }
                                            onCheckedChange={(checked) => toggleSectionSelection(section, !!checked)}
                                            className="border-gray-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                        />
                                        {isSectionPartiallySelected(section) && (
                                            <MinusCircle
                                                className="h-4 w-4 text-cyan-400 absolute pointer-events-none"/>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-gray-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSection(section);
                                        }}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-cyan-400"/>
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-cyan-400"/>
                                        )}
                                    </Button>
                                    <h3 className="text-lg font-semibold text-cyan-300">{section}</h3>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="bg-gray-800 text-gray-300 border-gray-700"
                                    >
                                        {sectionTranslations.length} keys
                                    </Badge>
                                    {stats.missing > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="bg-red-500/20 text-red-300 border-red-500/30"
                                        >
                                            {stats.missing} missing
                                        </Badge>
                                    )}
                                    {stats.missing === 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-green-500/20 text-green-300 border-green-500/30"
                                        >
                                            <Check className="w-3 h-3 mr-1"/>
                                            Complete
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section Content */}
                        {isExpanded && (
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="border-b border-gray-800 bg-gray-800/30">
                                            <th className="text-center p-4 w-[40px]">
                                                {/* Empty header for checkbox column */}
                                            </th>
                                            <th className="text-left p-4 font-semibold text-gray-300 min-w-[300px]">
                                                Translation Key
                                            </th>
                                            {languages.map((language, index) => (
                                                <th key={language}
                                                    className="text-left p-4 font-semibold text-gray-300 min-w-[200px]">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="uppercase text-xs px-2 py-1 bg-gray-700 rounded">
                                                                {language}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Only show batch translate button for non-source languages */}
                                                        {index > 0 && localSelectedKeys.size > 0 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 text-xs hover:bg-purple-500/20 hover:text-purple-300"
                                                                onClick={() => openBatchTranslationDialog(language)}
                                                                title={`Translate selected items to ${language}`}
                                                            >
                                                                <Sparkles className="w-3 h-3 mr-1" />
                                                                Batch AI
                                                            </Button>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                            {onDeleteTranslation && (
                                                <th className="text-center p-4 font-semibold text-gray-300 w-[80px]">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {sectionTranslations.map((translation, index) => (
                                            <tr
                                                key={translation.key}
                                                className={cn(
                                                    'border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors',
                                                    index % 2 === 0 ? 'bg-gray-900/20' : 'bg-gray-900/40',
                                                    localSelectedKeys.has(translation.key) && 'bg-cyan-500/10'
                                                )}
                                                onClick={(e) => {
                                                    // Don't trigger selection when clicking on editable cells or buttons
                                                    if (
                                                        e.target instanceof HTMLInputElement ||
                                                        e.target instanceof HTMLButtonElement ||
                                                        (e.target as HTMLElement).closest('button') ||
                                                        (e.target as HTMLElement).closest('input')
                                                    ) {
                                                        return;
                                                    }
                                                    toggleSelection(translation.key, e);
                                                }}
                                            >
                                                <td className="p-4 text-center">
                                                    <Checkbox
                                                        checked={localSelectedKeys.has(translation.key)}
                                                        onCheckedChange={(checked) => {
                                                            toggleSelection(translation.key);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="border-gray-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-mono text-sm text-gray-300">
                                                        {translation.key.replace(`${section}.`, '')}
                                                    </div>
                                                </td>
                                                {languages.map(language => {
                                                    const value = translation.values[language] || '';
                                                    const cellId = `${translation.key}-${language}`;
                                                    const isEditing = editingCell === cellId;
                                                    const isEmpty = !value;

                                                    return (
                                                        <td key={language} className="p-4">
                                                            {isEditing ? (
                                                                <Input
                                                                    defaultValue={value}
                                                                    autoFocus
                                                                    onBlur={(e) => handleCellEdit(translation.key, language, e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleCellEdit(translation.key, language, e.currentTarget.value);
                                                                        }
                                                                        if (e.key === 'Escape') {
                                                                            setEditingCell(null);
                                                                        }
                                                                    }}
                                                                    className="bg-gray-800 border-gray-700 text-gray-100"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className={cn(
                                                                        'p-2 rounded cursor-pointer min-h-[2.5rem] flex items-center transition-all',
                                                                        isEmpty
                                                                            ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                                                                            : 'bg-gray-800/50 hover:bg-gray-700/50 border border-transparent hover:border-gray-600'
                                                                    )}
                                                                    onClick={() => setEditingCell(cellId)}
                                                                >
                                                                    {isEmpty ? (
                                                                        <div
                                                                            className="flex items-center justify-between gap-2">
                                                                            <div
                                                                                className="flex items-center gap-2 text-red-300">
                                                                                <AlertCircle className="w-4 h-4"/>
                                                                                <span className="text-sm italic">Missing translation</span>
                                                                            </div>
                                                                            {language !== languages[0] && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openTranslationDialog(translation.key, language);
                                                                                    }}
                                                                                    className="h-6 px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                                                                    title="Translate with AI"
                                                                                >
                                                                                    <Sparkles className="w-3 h-3 mr-1"/>
                                                                                    AI
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span
                                                                            className="text-gray-200 text-sm leading-5">
                                                                            {value}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                {onDeleteTranslation && (
                                                    <td className="p-2 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onDeleteTranslation(translation.key)}
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                                                            title="Delete this translation key"
                                                        >
                                                            <Trash2 className="w-4 h-4"/>
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}