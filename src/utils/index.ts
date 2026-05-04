/**
 * Utility functions for XML and document processing.
 */

/**
 * Simple XML helper utilities.
 */
export class XmlHelpers {
  /**
   * Find a child element by tag name (with namespace).
   */
  static findElement(parent: any, tag: string): any | null {
    if (!parent || typeof parent !== 'object') return null;
    return parent[tag] || null;
  }

  /**
   * Find all child elements by tag name.
   */
  static findElements(parent: any, tag: string): any[] {
    if (!parent || typeof parent !== 'object') return [];
    const val = parent[tag];
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }

  /**
   * Get attribute value from an element.
   */
  static getAttr(elem: any, attr: string, defaultValue: string = ''): string {
    if (!elem || typeof elem !== 'object') return defaultValue;
    return elem[attr] || defaultValue;
  }
}
