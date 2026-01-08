import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TypeUtilsService {
  /**
   * Normalizes a .NET type string by removing backticks, generic notation, and formatting it nicely.
   * Handles cases like:
   * - System.Nullable`1[System.DateTime] -> DateTime?
   * - System.String -> string
   * - System.Int32 -> int
   * - System.DateTime -> DateTime
   */
  normalizeTypeString(type: string): string {
    if (!type) return 'unknown';
    
    // Remove backticks and everything after them (generic type notation)
    let normalized = type.replace(/`\d+.*$/, '');
    
    // Handle generic types like Nullable`1[System.DateTime]
    // Extract the inner type from brackets
    const genericMatch = normalized.match(/\[([^\]]+)\]/);
    if (genericMatch) {
      const innerType = genericMatch[1];
      // Remove the generic part and keep the inner type
      normalized = innerType;
    }
    
    // Remove namespace prefixes (everything before the last dot)
    const lastDotIndex = normalized.lastIndexOf('.');
    if (lastDotIndex >= 0) {
      normalized = normalized.substring(lastDotIndex + 1);
    }
    
    // Check if it's nullable (either has ? or was originally Nullable<T>)
    const isNullable = type.includes('Nullable') || type.endsWith('?');
    
    // Map common .NET types to simpler names
    const typeMap: { [key: string]: string } = {
      'Int32': 'int',
      'Int64': 'long',
      'Int16': 'short',
      'String': 'string',
      'Boolean': 'bool',
      'DateTime': 'DateTime',
      'DateTimeOffset': 'DateTimeOffset',
      'DateOnly': 'DateOnly',
      'TimeOnly': 'TimeOnly',
      'Decimal': 'decimal',
      'Double': 'double',
      'Single': 'float',
      'Guid': 'Guid',
      'Byte': 'byte',
      'Char': 'char',
      'Object': 'object'
    };
    
    // Apply type mapping
    if (typeMap[normalized]) {
      normalized = typeMap[normalized];
    }
    
    // Add nullable indicator if needed
    if (isNullable && !normalized.endsWith('?')) {
      normalized += '?';
    }
    
    return normalized;
  }

  /**
   * Formats a type string for display in diagrams (shorter format)
   * Removes nullable indicators (? and Nullable) since Mermaid doesn't support them in type names
   * Returns only valid identifier characters (alphanumeric and underscore) for Mermaid parsing
   */
  formatTypeForDiagram(type: string): string {
    if (!type) return 'unknown';
    
    // First normalize the type
    let normalized = this.normalizeTypeString(type);
    
    // Remove nullable indicator (?) - Mermaid doesn't support it in type names
    // Nullability is indicated separately in the diagram syntax
    normalized = normalized.replace(/\?$/, '');
    
    // Remove any "nullable" prefix or suffix (case-insensitive)
    normalized = normalized.replace(/^nullable\s+/i, '').replace(/\s+nullable$/i, '');
    
    // Trim whitespace
    normalized = normalized.trim();
    
    // Map to even shorter names for diagrams
    const diagramTypeMap: { [key: string]: string } = {
      'int': 'int',
      'long': 'long',
      'short': 'short',
      'string': 'string',
      'bool': 'bool',
      'DateTime': 'datetime',
      'DateTimeOffset': 'datetime',
      'DateOnly': 'date',
      'TimeOnly': 'time',
      'decimal': 'decimal',
      'double': 'double',
      'float': 'float',
      'Guid': 'guid',
      'byte': 'byte',
      'char': 'char',
      'object': 'object'
    };
    
    // Check map first (without ?)
    if (diagramTypeMap[normalized]) {
      return diagramTypeMap[normalized];
    }
    
    // Fallback: lowercase the type name and remove any characters that aren't valid for Mermaid identifiers
    // Mermaid ER diagrams expect type names to be simple identifiers (alphanumeric and underscores)
    let result = normalized.toLowerCase();
    // Replace any non-alphanumeric characters (except underscore) with underscore
    result = result.replace(/[^a-z0-9_]/g, '_');
    // Remove multiple consecutive underscores
    result = result.replace(/_+/g, '_');
    // Remove leading/trailing underscores
    result = result.replace(/^_+|_+$/g, '');
    
    // If we ended up with an empty string, return a default
    return result || 'unknown';
  }

  /**
   * Gets a display-friendly type name (keeps full type but cleaned)
   */
  getDisplayType(type: string): string {
    return this.normalizeTypeString(type);
  }

  /**
   * Checks if a type is nullable
   */
  isNullableType(type: string): boolean {
    return type.includes('Nullable') || type.endsWith('?') || type.includes('`1');
  }
}

