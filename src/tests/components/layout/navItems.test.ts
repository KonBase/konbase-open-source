import { describe, it, expect } from 'vitest';
import { navItems } from '@/components/layout/navigation/navItems'; // Adjust path if needed

describe('navItems', () => {
  it('should be an array', () => {
    expect(Array.isArray(navItems)).toBe(true);
  });

  it('should have items with required properties (title, path, icon)', () => {
    navItems.forEach(item => {
      expect(item).toHaveProperty('title');
      expect(typeof item.title).toBe('string');
      expect(item).toHaveProperty('path');
      expect(typeof item.path).toBe('string');
      expect(item).toHaveProperty('icon');
      // Check if submenu items also have required properties
      if (item.submenu) {
        expect(Array.isArray(item.submenu)).toBe(true);
        item.submenu.forEach(subItem => {
          expect(subItem).toHaveProperty('title');
          expect(typeof subItem.title).toBe('string');
          expect(subItem).toHaveProperty('path');
          expect(typeof subItem.path).toBe('string');
          expect(subItem).toHaveProperty('icon');
        });
      }
    });
  });
});
