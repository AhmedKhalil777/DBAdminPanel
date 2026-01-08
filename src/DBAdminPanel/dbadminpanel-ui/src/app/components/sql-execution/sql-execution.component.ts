import { Component, inject, signal, computed, input, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, EntityMetadata, SqlSample } from '../../services/api.service';
import { SqlThemeService, SqlTheme } from '../../services/sql-theme.service';
import { SqlAutocompleteService, AutocompleteItem } from '../../services/sql-autocomplete.service';

interface SqlResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
}

interface SqlExecutionLog {
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

@Component({
  selector: 'app-sql-execution',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './sql-execution.component.html',
  styleUrl: './sql-execution.component.css'
})
export class SqlExecutionComponent implements AfterViewInit {
  private apiService = inject(ApiService);
  private themeService = inject(SqlThemeService);
  private autocompleteService = inject(SqlAutocompleteService);
  
  dbContextName = input<string | null>(null);
  entityMetadata = input<EntityMetadata | null>(null);
  
  themes = this.themeService.getThemes();
  currentTheme = this.themeService.currentTheme;
  
  sqlQuery = signal<string>('');
  isExecuting = signal(false);
  sqlResult = signal<SqlResult | null>(null);
  executionLogs = signal<SqlExecutionLog[]>([]);
  rowsAffected = signal<number | null>(null);
  executionTime = signal<number | null>(null);
  
  // Autocomplete state
  autocompleteItems = signal<AutocompleteItem[]>([]);
  autocompleteVisible = signal(false);
  autocompleteSelectedIndex = signal(0);
  autocompletePosition = signal({ top: 0, left: 0 });
  cursorPosition = signal(0);
  
  sqlSamples = computed(() => {
    const metadata = this.entityMetadata();
    if (!metadata?.sqlSamples || metadata.sqlSamples.length === 0) {
      // Generate default samples if none provided
      return this.generateDefaultSamples(metadata);
    }
    return metadata.sqlSamples;
  });
  
  databaseType = computed(() => {
    return this.entityMetadata()?.databaseType || 'Unknown';
  });
  
  displayedColumns = computed(() => {
    const result = this.sqlResult();
    return result?.columns || [];
  });
  
  dataSource = computed(() => {
    const result = this.sqlResult();
    if (!result) return [];
    
    return result.rows.map(row => {
      const obj: any = {};
      result.columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });
  });
  
  @ViewChild('sqlInput', { static: false }) sqlInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('lineNumbers', { static: false }) lineNumbers!: ElementRef<HTMLDivElement>;
  @ViewChild('highlightedCode', { static: false }) highlightedCode!: ElementRef<HTMLDivElement>;
  @ViewChild('autocompleteDropdown', { static: false }) autocompleteDropdown!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    this.setupSyntaxHighlighting();
    // Ensure theme is applied (service loads it in constructor, but ensure it's applied)
    this.themeService.applyTheme(this.themeService.currentTheme());
  }
  
  changeTheme(themeName: string) {
    this.themeService.setTheme(themeName);
  }

  onSqlInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.sqlQuery.set(target.value);
    this.cursorPosition.set(target.selectionStart);
    this.updateLineNumbers();
    this.highlightSyntax();
    this.updateAutocomplete(target);
  }
  
  onSqlKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLTextAreaElement;
    
    // Handle autocomplete navigation
    if (this.autocompleteVisible()) {
      const items = this.autocompleteItems();
      let selectedIndex = this.autocompleteSelectedIndex();
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        this.autocompleteSelectedIndex.set(selectedIndex);
        this.scrollAutocompleteIntoView();
        return;
      }
      
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        this.autocompleteSelectedIndex.set(selectedIndex);
        this.scrollAutocompleteIntoView();
        return;
      }
      
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        this.insertAutocompleteSuggestion(selectedIndex, target);
        return;
      }
      
      if (event.key === 'Escape') {
        event.preventDefault();
        this.hideAutocomplete();
        return;
      }
    }
    
    // Trigger autocomplete on letters, numbers, underscore, @, $, dot, and space
    // Space triggers autocomplete for the next word
    if (/[a-zA-Z0-9_@$]/.test(event.key) || event.key === '.' || event.key === ' ') {
      setTimeout(() => this.updateAutocomplete(target), 0);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // For other single character keys (except modifiers), hide autocomplete
      this.hideAutocomplete();
    }
  }
  
  updateAutocomplete(textarea: HTMLTextAreaElement) {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    const suggestions = this.autocompleteService.getSuggestions(
      text,
      cursorPos,
      this.entityMetadata()
    );
    
    if (suggestions.length > 0) {
      this.autocompleteItems.set(suggestions);
      this.autocompleteSelectedIndex.set(0);
      this.updateAutocompletePosition(textarea, cursorPos);
      this.autocompleteVisible.set(true);
    } else {
      this.hideAutocomplete();
    }
  }
  
  updateAutocompletePosition(textarea: HTMLTextAreaElement, cursorPos: number) {
    // Calculate line and column for the cursor position
    const text = textarea.value;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length - 1;
    const currentColumn = lines[currentLine].length;
    
    // Get textarea styling
    const styles = getComputedStyle(textarea);
    const lineHeight = parseFloat(styles.lineHeight) || 21;
    const paddingTop = parseFloat(styles.paddingTop) || 12;
    const paddingLeft = parseFloat(styles.paddingLeft) || 12;
    
    // Calculate character width more accurately for monospace font
    const fontFamily = styles.fontFamily || 'monospace';
    const fontSize = parseFloat(styles.fontSize) || 14;
    // For monospace fonts (Courier New), use more accurate width
    const charWidth = fontFamily.includes('monospace') || fontFamily.includes('Courier') 
      ? fontSize * 0.6  // More accurate for monospace
      : fontSize * 0.55;
    
    // Position dropdown absolutely within sql-editor container (relative to textarea position)
    // Top: padding + line number * line height + one more line height to appear below cursor
    const top = paddingTop + (currentLine * lineHeight) + lineHeight + 2;
    // Left: padding + column position * character width
    const left = paddingLeft + (currentColumn * charWidth);
    
    this.autocompletePosition.set({ top, left });
  }
  
  insertAutocompleteSuggestion(index: number, textarea: HTMLTextAreaElement) {
    const items = this.autocompleteItems();
    if (index < 0 || index >= items.length) return;
    
    const item = items[index];
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // Get word boundaries
    const wordStart = this.autocompleteService.getWordStartPosition(text, cursorPos);
    const wordEnd = cursorPos;
    
    // Insert the suggestion
    const before = text.substring(0, wordStart);
    const after = text.substring(wordEnd);
    const newText = before + item.value + after;
    const newCursorPos = wordStart + item.value.length;
    
    this.sqlQuery.set(newText);
    this.cursorPosition.set(newCursorPos);
    
    // Update textarea
    setTimeout(() => {
      textarea.value = newText;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
      this.updateLineNumbers();
      this.highlightSyntax();
      this.hideAutocomplete();
    }, 0);
  }
  
  selectAutocompleteItem(index: number) {
    if (this.sqlInput?.nativeElement) {
      this.insertAutocompleteSuggestion(index, this.sqlInput.nativeElement);
    }
  }
  
  onSqlBlur() {
    // Delay hiding autocomplete to allow click events on dropdown items
    setTimeout(() => this.hideAutocomplete(), 200);
  }
  
  hideAutocomplete() {
    this.autocompleteVisible.set(false);
    this.autocompleteItems.set([]);
    this.autocompleteSelectedIndex.set(0);
  }
  
  scrollAutocompleteIntoView() {
    // Scroll the selected item into view
    setTimeout(() => {
      const dropdown = this.autocompleteDropdown?.nativeElement;
      if (dropdown) {
        const selectedItem = dropdown.querySelector('.autocomplete-item.selected');
        if (selectedItem) {
          selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, 0);
  }

  setupSyntaxHighlighting() {
    // Use effect to watch sqlQuery changes
    setTimeout(() => {
      if (this.sqlInput && this.sqlInput.nativeElement) {
        this.sqlInput.nativeElement.addEventListener('input', () => {
          const value = this.sqlInput.nativeElement.value;
          this.sqlQuery.set(value);
          this.updateLineNumbers();
          this.highlightSyntax();
        });
        
        this.sqlInput.nativeElement.addEventListener('scroll', () => {
          this.syncScroll();
        });
        
        this.updateLineNumbers();
        this.highlightSyntax();
      }
    }, 0);
  }

  updateLineNumbers() {
    if (!this.lineNumbers || !this.sqlInput) return;
    
    const lines = this.sqlQuery().split('\n').length;
    const lineNumbersHtml = Array.from({ length: lines }, (_, i) => 
      `<div class="line-number">${i + 1}</div>`
    ).join('');
    
    this.lineNumbers.nativeElement.innerHTML = lineNumbersHtml;
  }

  highlightSyntax() {
    if (!this.highlightedCode || !this.sqlInput) return;
    
    const sql = this.sqlQuery();
    const highlighted = this.highlightSql(sql);
    this.highlightedCode.nativeElement.innerHTML = highlighted;
  }

  highlightSql(sql: string): string {
    if (!sql) return '';
    
    // Token-based approach: Parse SQL character by character into tokens
    // This naturally handles multi-line constructs
    
    interface Token {
      type: 'comment' | 'string' | 'keyword' | 'function' | 'number' | 'identifier' | 'operator' | 'whitespace' | 'newline' | 'text';
      value: string;
    }
    
    const tokens: Token[] = [];
    let pos = 0;
    const len = sql.length;
    
    // SQL keywords (sorted by length, longest first to avoid partial matches)
    const keywords = new Set([
      'AUTO_INCREMENT', 'DATETIME', 'NVARCHAR', 'VARBINARY', 'ROLLBACK', 'TRANSACTION',
      'REFERENCES', 'CONSTRAINT', 'IDENTITY', 'EXECUTE', 'ELSEIF', 'DATABASE',
      'PROCEDURE', 'FUNCTION', 'TRIGGER', 'SCHEMA', 'DISTINCT', 'OFFSET',
      'DECLARE', 'COMMIT', 'REVOKE', 'SELECT', 'INSERT', 'UPDATE', 'DELETE',
      'CREATE', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'INNER', 'OUTER', 'WHERE',
      'ORDER', 'GROUP', 'HAVING', 'UNION', 'LIMIT', 'COUNT', 'CASE', 'WHEN',
      'THEN', 'ELSE', 'BEGIN', 'END', 'FROM', 'JOIN', 'LEFT', 'RIGHT', 'FULL',
      'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN',
      'EXISTS', 'BY', 'TOP', 'SUM', 'AVG', 'MAX', 'MIN', 'SET', 'EXEC', 'USE',
      'GRANT', 'GO', 'IF', 'PRIMARY', 'KEY', 'FOREIGN', 'DEFAULT', 'CHECK',
      'UNIQUE', 'INT', 'VARCHAR', 'CHAR', 'NCHAR', 'TEXT', 'NTEXT', 'INTEGER',
      'BIGINT', 'SMALLINT', 'TINYINT', 'DECIMAL', 'NUMERIC', 'FLOAT', 'REAL',
      'DOUBLE', 'BIT', 'BOOLEAN', 'DATE', 'TIME', 'TIMESTAMP', 'YEAR', 'BINARY',
      'IMAGE', 'BLOB', 'CLOB', 'XML', 'JSON', 'UUID', 'GUID', 'ALL'
    ]);
    
    // SQL functions
    const functions = new Set([
      'ABS', 'ACOS', 'ASIN', 'ATAN', 'ATN2', 'AVG', 'CEILING', 'COUNT', 'COS', 'COT',
      'DEGREES', 'EXP', 'FLOOR', 'LOG', 'LOG10', 'MAX', 'MIN', 'PI', 'POWER', 'RADIANS',
      'RAND', 'ROUND', 'SIGN', 'SIN', 'SQRT', 'SQUARE', 'SUM', 'TAN', 'GETDATE', 'GETUTCDATE',
      'YEAR', 'MONTH', 'DAY', 'DATEADD', 'DATEDIFF', 'DATEPART', 'DATENAME', 'CAST', 'CONVERT',
      'ISNULL', 'COALESCE', 'NULLIF', 'LEN', 'LENGTH', 'SUBSTRING', 'LEFT', 'RIGHT', 'TRIM',
      'LTRIM', 'RTRIM', 'UPPER', 'LOWER', 'REPLACE', 'REVERSE', 'STUFF', 'CHARINDEX',
      'PATINDEX', 'CONCAT', 'FORMAT', 'PARSE', 'TRY_CAST', 'TRY_CONVERT', 'TRY_PARSE'
    ]);
    
    // Tokenize the SQL
    while (pos < len) {
      const char = sql[pos];
      const remaining = sql.substring(pos);
      
      // Newline
      if (char === '\n') {
        tokens.push({ type: 'newline', value: '\n' });
        pos++;
        continue;
      }
      
      // Whitespace (skip but preserve for formatting)
      if (/\s/.test(char)) {
        let whitespace = '';
        while (pos < len && /\s/.test(sql[pos]) && sql[pos] !== '\n') {
          whitespace += sql[pos];
          pos++;
        }
        tokens.push({ type: 'whitespace', value: whitespace });
        continue;
      }
      
      // Multi-line comment /* ... */
      if (remaining.startsWith('/*')) {
        const endIndex = remaining.indexOf('*/');
        if (endIndex !== -1) {
          const value = remaining.substring(0, endIndex + 2);
          tokens.push({ type: 'comment', value });
          pos += value.length;
          continue;
        } else {
          // Unclosed comment - take rest of string
          tokens.push({ type: 'comment', value: remaining });
          break;
        }
      }
      
      // Single-line comment -- ...
      if (remaining.startsWith('--')) {
        const endIndex = remaining.indexOf('\n');
        const value = endIndex !== -1 ? remaining.substring(0, endIndex) : remaining;
        tokens.push({ type: 'comment', value });
        pos += value.length;
        continue;
      }
      
      // Single-quoted string '...'
      if (char === "'") {
        let value = "'";
        pos++;
        while (pos < len) {
          if (sql[pos] === "'") {
            value += "'";
            pos++;
            // Check for escaped quote ('')
            if (pos < len && sql[pos] === "'") {
              value += "'";
              pos++;
              continue;
            }
            break;
          }
          value += sql[pos];
          pos++;
        }
        tokens.push({ type: 'string', value });
        continue;
      }
      
      // Double-quoted string "..."
      if (char === '"') {
        let value = '"';
        pos++;
        while (pos < len) {
          if (sql[pos] === '"') {
            value += '"';
            pos++;
            // Check for escaped quote ("")
            if (pos < len && sql[pos] === '"') {
              value += '"';
              pos++;
              continue;
            }
            break;
          }
          value += sql[pos];
          pos++;
        }
        tokens.push({ type: 'string', value });
        continue;
      }
      
      // Number
      if (/\d/.test(char)) {
        let value = '';
        while (pos < len && /[\d.]/.test(sql[pos])) {
          value += sql[pos];
          pos++;
        }
        tokens.push({ type: 'number', value });
        continue;
      }
      
      // Word (identifier, keyword, or function)
      if (/[a-zA-Z_@]/.test(char)) {
        let value = '';
        while (pos < len && /[a-zA-Z0-9_@$]/.test(sql[pos])) {
          value += sql[pos];
          pos++;
        }
        
        const upperValue = value.toUpperCase();
        
        // Check if it's a keyword
        if (keywords.has(upperValue)) {
          tokens.push({ type: 'keyword', value });
          continue;
        }
        
        // Check if it's a function (followed by opening parenthesis)
        if (pos < len && sql[pos] === '(' && functions.has(upperValue)) {
          tokens.push({ type: 'function', value });
          continue;
        }
        
        // Otherwise it's an identifier
        tokens.push({ type: 'identifier', value });
        continue;
      }
      
      // Operators and punctuation
      const operators = ['=', '<', '>', '!', '+', '-', '*', '/', '%', '&', '|', '^', '~', '(', ')', '[', ']', ',', ';', '.'];
      if (operators.includes(char)) {
        tokens.push({ type: 'operator', value: char });
        pos++;
        continue;
      }
      
      // Other characters
      tokens.push({ type: 'text', value: char });
      pos++;
    }
    
    // Build highlighted HTML from tokens
    const escapeHtml = (text: string): string => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    let result = '';
    for (const token of tokens) {
      const escaped = escapeHtml(token.value);
      
      switch (token.type) {
        case 'comment':
          result += `<span class="sql-comment">${escaped}</span>`;
          break;
        case 'string':
          result += `<span class="sql-string">${escaped}</span>`;
          break;
        case 'keyword':
          result += `<span class="sql-keyword">${escaped}</span>`;
          break;
        case 'function':
          result += `<span class="sql-function">${escaped}</span>`;
          break;
        case 'number':
          result += `<span class="sql-number">${escaped}</span>`;
          break;
        case 'newline':
          result += '<br>';
          break;
        case 'whitespace':
        case 'identifier':
        case 'operator':
        case 'text':
        default:
          result += escaped;
          break;
      }
    }
    
    return result;
  }

  syncScroll() {
    if (this.sqlInput && this.highlightedCode && this.lineNumbers) {
      const scrollTop = this.sqlInput.nativeElement.scrollTop;
      this.highlightedCode.nativeElement.scrollTop = scrollTop;
      this.lineNumbers.nativeElement.scrollTop = scrollTop;
    }
  }

  executeSql() {
    const query = this.sqlQuery().trim();
    if (!query) {
      this.addLog('warning', 'Please enter a SQL query');
      return;
    }

    this.isExecuting.set(true);
    this.sqlResult.set(null);
    this.rowsAffected.set(null);
    this.executionTime.set(null);
    this.executionLogs.set([]);
    
    const startTime = performance.now();
    this.addLog('info', 'Executing SQL query...');

    this.apiService.executeSql(query, this.dbContextName()).subscribe({
      next: (response) => {
        const endTime = performance.now();
        const executionTimeMs = Math.round(endTime - startTime);
        this.executionTime.set(executionTimeMs);
        
        if (response.hasResult) {
          // Query returned results
          this.sqlResult.set({
            columns: response.columns || [],
            rows: response.rows || [],
            rowCount: response.rowCount || 0
          });
          this.addLog('success', `Query executed successfully. Returned ${response.rowCount || 0} row(s) in ${executionTimeMs}ms`);
        } else {
          // Query didn't return results (INSERT, UPDATE, DELETE, etc.)
          this.rowsAffected.set(response.rowsAffected || 0);
          this.addLog('success', `Query executed successfully. ${response.rowsAffected || 0} row(s) affected in ${executionTimeMs}ms`);
        }
        
        this.isExecuting.set(false);
      },
      error: (error) => {
        const endTime = performance.now();
        const executionTimeMs = Math.round(endTime - startTime);
        this.executionTime.set(executionTimeMs);
        
        const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
        this.addLog('error', `Query failed: ${errorMessage}`);
        this.isExecuting.set(false);
      }
    });
  }

  addLog(level: SqlExecutionLog['level'], message: string) {
    const logs = this.executionLogs();
    logs.push({
      timestamp: new Date(),
      level,
      message
    });
    this.executionLogs.set([...logs]);
  }

  clearQuery() {
    this.sqlQuery.set('');
    this.sqlResult.set(null);
    this.rowsAffected.set(null);
    this.executionTime.set(null);
    this.executionLogs.set([]);
    if (this.sqlInput) {
      this.sqlInput.nativeElement.value = '';
    }
    this.updateLineNumbers();
    this.highlightSyntax();
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '<em>NULL</em>';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return String(value);
  }

  loadSample(sample: SqlSample) {
    this.sqlQuery.set(sample.sql);
    this.updateLineNumbers();
    this.highlightSyntax();
  }

  generateDefaultSamples(metadata: EntityMetadata | null): SqlSample[] {
    if (!metadata) {
      return [];
    }

    // Note: This fallback should ideally not be needed if backend provides samples
    // Use dbSetName (actual table name) instead of entity name (class name)
    // dbSetName contains the actual database table name (e.g., "Users" not "User")
    const tableName = metadata.dbSetName || metadata.name;
    const keyProperty = metadata.keyProperty;
    const dbType = metadata.databaseType || 'PostgreSQL'; // Default to PostgreSQL
    const properties = metadata.properties.filter(p => !p.isKey);
    // Use double quotes for PostgreSQL identifiers
    const allProperties = metadata.properties.map(p => `"${p.name}"`).join(', ');
    
    const samples: SqlSample[] = [];

    // SELECT 1000 - PostgreSQL syntax with quoted identifiers
    const limitClause = dbType === 'SQL Server' ? 'TOP 1000' : 'LIMIT 1000';
    const selectQuery = dbType === 'SQL Server'
      ? `SELECT ${limitClause} ${allProperties}\nFROM "${tableName}";`
      : `SELECT ${allProperties}\nFROM "${tableName}"\n${limitClause};`;
    samples.push({
      name: 'Select 1000',
      description: `Select first 1000 records from ${tableName}`,
      sql: selectQuery
    });

    // SELECT with WHERE - PostgreSQL syntax with quoted identifiers
    if (properties.length > 0) {
      const firstProp = properties[0];
      const whereQuery = dbType === 'SQL Server'
        ? `SELECT ${limitClause} ${allProperties}\nFROM "${tableName}"\nWHERE "${firstProp.name}" = 'value';`
        : `SELECT ${allProperties}\nFROM "${tableName}"\nWHERE "${firstProp.name}" = 'value'\n${limitClause};`;
      samples.push({
        name: 'Select with WHERE',
        description: `Select records with condition on ${firstProp.name}`,
        sql: whereQuery
      });
    }

    // INSERT - PostgreSQL syntax with quoted identifiers
    if (properties.length > 0) {
      const insertProps = properties.map(p => `"${p.name}"`).join(', ');
      const insertValues = properties.map(p => {
        if (p.type.includes('String') || p.type.includes('DateTime')) return "'value'";
        if (p.type.includes('Boolean')) return 'true';
        if (p.type.includes('Int') || p.type.includes('Decimal')) return '0';
        return 'NULL';
      }).join(', ');
      
      samples.push({
        name: 'Insert',
        description: `Insert a new record into ${tableName}`,
        sql: `INSERT INTO "${tableName}" (${insertProps})\nVALUES (${insertValues});`
      });
    }

    // UPDATE - PostgreSQL syntax with quoted identifiers
    if (properties.length > 0) {
      const firstProp = properties[0];
      samples.push({
        name: 'Update',
        description: `Update records in ${tableName}`,
        sql: `UPDATE "${tableName}"\nSET "${firstProp.name}" = 'new_value'\nWHERE "${keyProperty}" = 1;`
      });
    }

    // DELETE - PostgreSQL syntax with quoted identifiers
    samples.push({
      name: 'Delete',
      description: `Delete a record from ${tableName}`,
      sql: `DELETE FROM "${tableName}"\nWHERE "${keyProperty}" = 1;`
    });

    // UPDATE MANY - PostgreSQL syntax with quoted identifiers
    if (properties.length > 0) {
      const firstProp = properties[0];
      samples.push({
        name: 'Update Many',
        description: `Update multiple records in ${tableName}`,
        sql: `UPDATE "${tableName}"\nSET "${firstProp.name}" = 'new_value'\nWHERE "${firstProp.name}" = 'old_value';`
      });
    }

    // INSERT MANY - PostgreSQL syntax with quoted identifiers
    if (properties.length > 0 && dbType !== 'SQL Server') {
      const insertProps = properties.map(p => `"${p.name}"`).join(', ');
      samples.push({
        name: 'Insert Many',
        description: `Insert multiple records into ${tableName}`,
        sql: `INSERT INTO "${tableName}" (${insertProps})\nVALUES\n  ('value1', 'value2', ...),\n  ('value1', 'value2', ...);`
      });
    }

    return samples;
  }
}

