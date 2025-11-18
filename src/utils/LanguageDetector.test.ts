/**
 * Tests for LanguageDetector
 */

import { describe, it, expect } from 'vitest';
import { LanguageDetector } from './LanguageDetector';
import { Language } from '../models';

describe('LanguageDetector', () => {
  const detector = new LanguageDetector();

  describe('detect with file extension', () => {
    it('should detect JavaScript from .js extension', () => {
      const code = 'console.log("hello");';
      expect(detector.detect(code, '.js')).toBe(Language.JAVASCRIPT);
    });

    it('should detect JavaScript from .jsx extension', () => {
      const code = 'const App = () => <div>Hello</div>;';
      expect(detector.detect(code, '.jsx')).toBe(Language.JAVASCRIPT);
    });

    it('should detect TypeScript from .ts extension', () => {
      const code = 'const x: number = 5;';
      expect(detector.detect(code, '.ts')).toBe(Language.TYPESCRIPT);
    });

    it('should detect TypeScript from .tsx extension', () => {
      const code = 'const App: React.FC = () => <div>Hello</div>;';
      expect(detector.detect(code, '.tsx')).toBe(Language.TYPESCRIPT);
    });
  });

  describe('detect from content', () => {
    it('should detect TypeScript from interface declaration', () => {
      const code = 'interface User { name: string; age: number; }';
      expect(detector.detect(code)).toBe(Language.TYPESCRIPT);
    });

    it('should detect TypeScript from type annotations', () => {
      const code = 'function greet(name: string): void { console.log(name); }';
      expect(detector.detect(code)).toBe(Language.TYPESCRIPT);
    });

    it('should detect JavaScript from function declaration', () => {
      const code = 'function hello() { return "world"; }';
      expect(detector.detect(code)).toBe(Language.JAVASCRIPT);
    });

    it('should detect JavaScript from const declaration', () => {
      const code = 'const x = 42;';
      expect(detector.detect(code)).toBe(Language.JAVASCRIPT);
    });

    it('should return UNKNOWN for empty code', () => {
      expect(detector.detect('')).toBe(Language.UNKNOWN);
    });

    it('should return UNKNOWN for unrecognizable code', () => {
      const code = 'print("Hello World")';
      expect(detector.detect(code)).toBe(Language.UNKNOWN);
    });
  });

  describe('isSupported', () => {
    it('should return true for JavaScript', () => {
      expect(detector.isSupported(Language.JAVASCRIPT)).toBe(true);
    });

    it('should return true for TypeScript', () => {
      expect(detector.isSupported(Language.TYPESCRIPT)).toBe(true);
    });

    it('should return false for UNKNOWN', () => {
      expect(detector.isSupported(Language.UNKNOWN)).toBe(false);
    });
  });
});
