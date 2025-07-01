'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function TranslationTable({ 
  translations, 
  languages, 
  onUpdateTranslation 
}: TranslationTableProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<string | null>(null);

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
    
    return { total, missing, complete: total - missing };
  };

  const handleCellEdit = (key: string, language: string, value: string) => {
    onUpdateTranslation(key, language, value);
    setEditingCell(null);
  };

  const groupedTranslations = groupTranslationsBySection();

  return (
    <div className="space-y-4">
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:bg-gray-700"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-cyan-400" />
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
                      <Check className="w-3 h-3 mr-1" />
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
                        <th className="text-left p-4 font-semibold text-gray-300 min-w-[300px]">
                          Translation Key
                        </th>
                        {languages.map(language => (
                          <th key={language} className="text-left p-4 font-semibold text-gray-300 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <span className="uppercase text-xs px-2 py-1 bg-gray-700 rounded">
                                {language}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sectionTranslations.map((translation, index) => (
                        <tr 
                          key={translation.key}
                          className={cn(
                            'border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors',
                            index % 2 === 0 ? 'bg-gray-900/20' : 'bg-gray-900/40'
                          )}
                        >
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
                                      <div className="flex items-center gap-2 text-red-300">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm italic">Missing translation</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-200 text-sm leading-5">
                                        {value}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
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