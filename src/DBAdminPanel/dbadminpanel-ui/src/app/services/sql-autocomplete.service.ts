import { Injectable, inject } from '@angular/core';
import { EntityMetadata } from './api.service';
import { TypeUtilsService } from './type-utils.service';

export interface AutocompleteItem {
  label: string;
  value: string;
  type: 'function' | 'table' | 'column' | 'keyword';
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SqlAutocompleteService {
  private typeUtils = inject(TypeUtilsService);
  private readonly sqlFunctions = [
    { name: 'ABS', description: 'Returns the absolute value of a number' },
    { name: 'ACOS', description: 'Returns the arccosine of a number' },
    { name: 'AVG', description: 'Returns the average value of a set' },
    { name: 'COUNT', description: 'Returns the number of rows' },
    { name: 'MAX', description: 'Returns the maximum value' },
    { name: 'MIN', description: 'Returns the minimum value' },
    { name: 'SUM', description: 'Returns the sum of values' },
    { name: 'UPPER', description: 'Converts string to uppercase' },
    { name: 'LOWER', description: 'Converts string to lowercase' },
    { name: 'LENGTH', description: 'Returns the length of a string' },
    { name: 'SUBSTRING', description: 'Extracts a substring from a string' },
    { name: 'TRIM', description: 'Removes leading and trailing spaces' },
    { name: 'CAST', description: 'Converts a value to a different data type' },
    { name: 'COALESCE', description: 'Returns the first non-null value' },
    { name: 'ISNULL', description: 'Replaces NULL with a specified value' },
    { name: 'DATEADD', description: 'Adds a time interval to a date' },
    { name: 'DATEDIFF', description: 'Returns the difference between two dates' },
    { name: 'GETDATE', description: 'Returns the current date and time' },
    { name: 'YEAR', description: 'Extracts the year from a date' },
    { name: 'MONTH', description: 'Extracts the month from a date' },
    { name: 'DAY', description: 'Extracts the day from a date' }
  ];

  private readonly sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
    'TABLE', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON',
    'AS', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'LIKE', 'BETWEEN', 'IS', 'NULL',
    'ORDER', 'BY', 'GROUP', 'HAVING', 'UNION', 'ALL', 'DISTINCT', 'TOP', 'LIMIT',
    'OFFSET', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'SET', 'VALUES'
  ];

  getSuggestions(
    text: string,
    cursorPosition: number,
    entityMetadata: EntityMetadata | null
  ): AutocompleteItem[] {
    const suggestions: AutocompleteItem[] = [];
    
    // Get the current word being typed
    const word = this.getCurrentWord(text, cursorPosition);
    // If no word but we're at start of new word (after space), show suggestions
    if (!word || word.trim().length === 0) {
      const beforeCursor = text.substring(0, cursorPosition);
      const trimmed = beforeCursor.trimEnd();
      // Check if we're right after a space or at start of line
      if (trimmed.length === 0 || /[\s\(\)]/.test(trimmed.slice(-1))) {
        // Show all suggestions for new word
        const lowerWord = '';
        return this.getAllSuggestionsForContext(lowerWord, beforeCursor, entityMetadata);
      }
      return suggestions;
    }
    
    const lowerWord = word.toLowerCase();
    
    // Get context (what comes before the word)
    const beforeCursor = text.substring(0, cursorPosition);
    const context = this.getContext(beforeCursor);
    
    // Suggest based on context
    if (context === 'function' || context === 'general') {
      // Add functions
      this.sqlFunctions.forEach(func => {
        if (func.name.toLowerCase().startsWith(lowerWord)) {
          suggestions.push({
            label: func.name,
            value: func.name,
            type: 'function',
            description: func.description
          });
        }
      });
    }
    
    if (context === 'table' || context === 'general' || context === 'from') {
      // Add table names from metadata
      // Use dbSetName (actual table name) instead of entity name (class name)
      if (entityMetadata) {
        const tableName = entityMetadata.dbSetName || entityMetadata.name;
        if (tableName.toLowerCase().startsWith(lowerWord)) {
          suggestions.push({
            label: tableName,
            value: `"${tableName}"`,
            type: 'table',
            description: `Table: ${tableName}`
          });
        }
      }
    }
    
    if (context === 'column' || context === 'general' || context === 'select' || context === 'where') {
      // Add column names from metadata
      if (entityMetadata?.properties) {
        entityMetadata.properties.forEach(prop => {
          if (prop.name.toLowerCase().startsWith(lowerWord)) {
            suggestions.push({
              label: prop.name,
              value: `"${prop.name}"`,
              type: 'column',
              description: `${prop.name} (${this.typeUtils.getDisplayType(prop.type)})`
            });
        }
        });
      }
    }
    
    if (context === 'general') {
      // Add keywords
      this.sqlKeywords.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(lowerWord)) {
          suggestions.push({
            label: keyword,
            value: keyword,
            type: 'keyword',
            description: `SQL keyword: ${keyword}`
          });
        }
      });
    }
    
    // Sort suggestions: functions first, then tables, then columns, then keywords
    return suggestions.sort((a, b) => {
      const order = { function: 0, table: 1, column: 2, keyword: 3 };
      const orderDiff = order[a.type] - order[b.type];
      if (orderDiff !== 0) return orderDiff;
      return a.label.localeCompare(b.label);
    });
  }

  private getCurrentWord(text: string, cursorPosition: number): string {
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);
    
    // Find word boundaries - match alphanumeric, underscore, @, $, and dots (for table.column)
    const beforeMatch = beforeCursor.match(/([a-zA-Z_@$][a-zA-Z0-9_@$.]*)$/);
    const afterMatch = afterCursor.match(/^([a-zA-Z0-9_@$.]*)/);
    
    const before = beforeMatch ? beforeMatch[1] : '';
    const after = afterMatch ? afterMatch[1] : '';
    
    return before + after;
  }

  private getContext(text: string): 'function' | 'table' | 'column' | 'select' | 'from' | 'where' | 'general' {
    // Remove comments and strings
    const cleaned = text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/--.*$/gm, '')
      .replace(/'([^']|'')*'/g, '')
      .replace(/"([^"]|"")*"/g, '');
    
    // Check for common patterns
    const lastKeyword = cleaned.match(/\b(SELECT|FROM|WHERE|JOIN|ON|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/gi);
    if (!lastKeyword) return 'general';
    
    const last = lastKeyword[lastKeyword.length - 1].toUpperCase();
    
    switch (last) {
      case 'SELECT':
        return 'select';
      case 'FROM':
      case 'JOIN':
        return 'from';
      case 'WHERE':
      case 'ON':
        return 'where';
      default:
        return 'general';
    }
  }

  getWordStartPosition(text: string, cursorPosition: number): number {
    const beforeCursor = text.substring(0, cursorPosition);
    // Match alphanumeric, underscore, @, $, and dots (for table.column)
    const match = beforeCursor.match(/([a-zA-Z_@$][a-zA-Z0-9_@$.]*)$/);
    return match ? cursorPosition - match[1].length : cursorPosition;
  }

  private getAllSuggestionsForContext(
    lowerWord: string,
    beforeCursor: string,
    entityMetadata: EntityMetadata | null
  ): AutocompleteItem[] {
    const suggestions: AutocompleteItem[] = [];
    const context = this.getContext(beforeCursor);
    
    // Add all relevant suggestions based on context
    if (context === 'function' || context === 'general') {
      this.sqlFunctions.forEach(func => {
        if (!lowerWord || func.name.toLowerCase().startsWith(lowerWord)) {
          suggestions.push({
            label: func.name,
            value: func.name,
            type: 'function',
            description: func.description
          });
        }
      });
    }
    
    if (context === 'table' || context === 'general' || context === 'from') {
      if (entityMetadata) {
        // Use dbSetName (actual table name) instead of entity name (class name)
        const tableName = entityMetadata.dbSetName || entityMetadata.name;
        if (!lowerWord || tableName.toLowerCase().startsWith(lowerWord)) {
          suggestions.push({
            label: tableName,
            value: `"${tableName}"`,
            type: 'table',
            description: `Table: ${tableName}`
          });
        }
      }
    }
    
    if (context === 'column' || context === 'general' || context === 'select' || context === 'where') {
      if (entityMetadata?.properties) {
        entityMetadata.properties.forEach(prop => {
          if (!lowerWord || prop.name.toLowerCase().startsWith(lowerWord)) {
            suggestions.push({
              label: prop.name,
              value: `"${prop.name}"`,
              type: 'column',
              description: `${prop.name} (${this.typeUtils.getDisplayType(prop.type)})`
            });
          }
        });
      }
    }
    
    if (context === 'general') {
      this.sqlKeywords.forEach(keyword => {
        if (!lowerWord || keyword.toLowerCase().startsWith(lowerWord)) {
          suggestions.push({
            label: keyword,
            value: keyword,
            type: 'keyword',
            description: `SQL keyword: ${keyword}`
          });
        }
      });
    }
    
    return suggestions.sort((a, b) => {
      const order = { function: 0, table: 1, column: 2, keyword: 3 };
      const orderDiff = order[a.type] - order[b.type];
      if (orderDiff !== 0) return orderDiff;
      return a.label.localeCompare(b.label);
    });
  }
}

