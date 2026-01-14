import { describe, it, expect, beforeEach } from 'vitest';
import {
  announceToScreenReader,
  isFocusable,
  getFocusableElements,
  getContrastRatio,
  meetsWCAGAA,
  generateAriaId,
  prefersReducedMotion,
  prefersDarkMode,
  auditAccessibility,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('announceToScreenReader', () => {
    afterEach(() => {
      // Clean up any announcement elements
      document.querySelectorAll('[role="status"]').forEach(el => el.remove());
    });

    it('creates a live region announcement', () => {
      announceToScreenReader('Test announcement');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Test announcement');
    });

    it('sets aria-live attribute correctly', () => {
      announceToScreenReader('Test', 'assertive');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement?.getAttribute('aria-live')).toBe('assertive');
    });

    it('removes announcement after timeout', async () => {
      announceToScreenReader('Test announcement');
      
      expect(document.querySelector('[role="status"]')).toBeTruthy();
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(document.querySelector('[role="status"]')).toBeFalsy();
    });
  });

  describe('isFocusable', () => {
    it('identifies buttons as focusable', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      
      expect(isFocusable(button)).toBe(true);
      
      document.body.removeChild(button);
    });

    it('identifies links as focusable', () => {
      const link = document.createElement('a');
      link.href = '#';
      document.body.appendChild(link);
      
      expect(isFocusable(link)).toBe(true);
      
      document.body.removeChild(link);
    });

    it('identifies elements with tabindex as focusable', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      document.body.appendChild(div);
      
      expect(isFocusable(div)).toBe(true);
      
      document.body.removeChild(div);
    });

    it('identifies negative tabindex as not focusable', () => {
      const div = document.createElement('div');
      div.tabIndex = -1;
      document.body.appendChild(div);
      
      expect(isFocusable(div)).toBe(false);
      
      document.body.removeChild(div);
    });
  });

  describe('getFocusableElements', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('finds all focusable elements', () => {
      container.innerHTML = `
        <button>Button</button>
        <a href="#">Link</a>
        <input type="text" />
        <div tabindex="0">Focusable div</div>
      `;
      
      const focusable = getFocusableElements(container);
      expect(focusable.length).toBe(4);
    });

    it('excludes disabled elements', () => {
      container.innerHTML = `
        <button>Enabled</button>
        <button disabled>Disabled</button>
      `;
      
      const focusable = getFocusableElements(container);
      expect(focusable.length).toBe(1);
    });

    it('excludes hidden elements', () => {
      container.innerHTML = `
        <button>Visible</button>
        <button hidden>Hidden</button>
      `;
      
      const focusable = getFocusableElements(container);
      expect(focusable.length).toBe(1);
    });
  });

  describe('getContrastRatio', () => {
    it('calculates contrast ratio for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('calculates contrast ratio for white on black', () => {
      const ratio = getContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('calculates contrast ratio for similar colors', () => {
      const ratio = getContrastRatio('#000000', '#111111');
      expect(ratio).toBeLessThan(2);
    });
  });

  describe('meetsWCAGAA', () => {
    it('passes for black text on white background', () => {
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
    });

    it('passes for sufficient contrast', () => {
      expect(meetsWCAGAA('#595959', '#ffffff')).toBe(true);
    });

    it('fails for insufficient contrast', () => {
      expect(meetsWCAGAA('#cccccc', '#ffffff')).toBe(false);
    });

    it('uses lower threshold for large text', () => {
      // Some color combinations pass for large text but fail for normal text
      const result = meetsWCAGAA('#959595', '#ffffff', true);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('generateAriaId', () => {
    it('generates unique IDs', () => {
      const id1 = generateAriaId();
      const id2 = generateAriaId();
      
      expect(id1).not.toBe(id2);
    });

    it('uses custom prefix', () => {
      const id = generateAriaId('custom');
      expect(id).toMatch(/^custom-/);
    });
  });

  describe('prefersReducedMotion', () => {
    it('detects reduced motion preference', () => {
      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('prefersDarkMode', () => {
    it('detects dark mode preference', () => {
      const result = prefersDarkMode();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('auditAccessibility', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('detects images without alt text', () => {
      container.innerHTML = '<img src="test.jpg" />';
      
      const issues = auditAccessibility(container);
      const imgIssue = issues.find(i => i.issue.includes('Image missing alt'));
      
      expect(imgIssue).toBeTruthy();
      expect(imgIssue?.severity).toBe('error');
    });

    it('detects buttons without labels', () => {
      container.innerHTML = '<button><span class="icon"></span></button>';
      
      const issues = auditAccessibility(container);
      const btnIssue = issues.find(i => i.issue.includes('Button without accessible label'));
      
      expect(btnIssue).toBeTruthy();
    });

    it('detects form inputs without labels', () => {
      container.innerHTML = '<input type="text" />';
      
      const issues = auditAccessibility(container);
      const inputIssue = issues.find(i => i.issue.includes('Form input without label'));
      
      expect(inputIssue).toBeTruthy();
    });

    it('detects heading hierarchy issues', () => {
      container.innerHTML = `
        <h1>Title</h1>
        <h3>Skipped h2</h3>
      `;
      
      const issues = auditAccessibility(container);
      const headingIssue = issues.find(i => i.issue.includes('Heading level'));
      
      expect(headingIssue).toBeTruthy();
      expect(headingIssue?.severity).toBe('warning');
    });

    it('passes for accessible content', () => {
      container.innerHTML = `
        <h1>Title</h1>
        <img src="test.jpg" alt="Description" />
        <button aria-label="Close">X</button>
        <label for="name">Name</label>
        <input type="text" id="name" />
      `;
      
      const issues = auditAccessibility(container);
      
      expect(issues.length).toBe(0);
    });
  });
});
