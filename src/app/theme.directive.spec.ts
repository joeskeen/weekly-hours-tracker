import { DOCUMENT } from '@angular/common';
import {
  Injector,
  runInInjectionContext,
  ɵChangeDetectionScheduler as ChangeDetectionScheduler,
  ɵEffectScheduler as EffectScheduler,
} from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeDirective, adjustColorBrightness } from './theme.directive';
import { SetupService } from './setup.service';
import type { Theme } from './storage.service';

describe('ThemeDirective Logic', () => {
  let directive: ThemeDirective;
  let mockSetupService: Partial<SetupService>;
  let mockDocument: Partial<Document>;
  let injector: Injector;

  beforeEach(() => {
    const effectScheduler = {
      add: vi.fn(),
      remove: vi.fn(),
      schedule: vi.fn(),
      flush: vi.fn(),
    } as any;

    const changeDetectionScheduler = {
      notify: vi.fn(),
      runningTick: false,
    } as any;

    mockDocument = {
      body: { setAttribute: vi.fn() } as any,
      documentElement: { style: { setProperty: vi.fn() } } as any,
    } as any;

    mockSetupService = {
      theme: vi.fn() as any,
    } as Partial<SetupService>;

    injector = Injector.create({
      providers: [
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: EffectScheduler, useValue: effectScheduler },
        { provide: ChangeDetectionScheduler, useValue: changeDetectionScheduler },
        { provide: SetupService, useValue: mockSetupService },
      ],
    });

    runInInjectionContext(injector, () => (directive = new ThemeDirective()));
  });

  describe('applyTheme', () => {
    let theme: Theme;
    const action = () => directive.applyTheme(theme);

    describe('when theme is light mode', () => {
      beforeEach(() => (theme = { mode: 'light', primaryColor: '#007bff' }));
      beforeEach(action);

      it('should set data-theme attribute to light', () =>
        expect(mockDocument.body!.setAttribute).toHaveBeenCalledWith('data-theme', 'light'));

      it('should set primary color CSS variable', () =>
        expect(mockDocument.documentElement!.style.setProperty).toHaveBeenCalledWith(
          '--primary-color',
          '#007bff',
        ));

      it('should set darker hover color', () => {
        const calls = (mockDocument.documentElement!.style.setProperty as any).mock.calls;
        const hoverCall = calls.find((call: any[]) => call[0] === '--primary-hover');
        expect(hoverCall?.[1]).toMatch(/^#[0-9a-f]{6}$/);
      });
    });

    describe('when theme is dark mode', () => {
      beforeEach(() => (theme = { mode: 'dark', primaryColor: '#4a9eff' }));
      beforeEach(action);

      it('should set data-theme attribute to dark', () =>
        expect(mockDocument.body!.setAttribute).toHaveBeenCalledWith('data-theme', 'dark'));

      it('should set primary color CSS variable', () =>
        expect(mockDocument.documentElement!.style.setProperty).toHaveBeenCalledWith(
          '--primary-color',
          '#4a9eff',
        ));

      it('should set lighter hover color', () => {
        const calls = (mockDocument.documentElement!.style.setProperty as any).mock.calls;
        const hoverCall = calls.find((call: any[]) => call[0] === '--primary-hover');
        expect(hoverCall?.[1]).toMatch(/^#[0-9a-f]{6}$/);
      });
    });
  });
});

describe('adjustColorBrightness', () => {
  let color: string;
  let percent: number;
  let result: string;
  const action = () => (result = adjustColorBrightness(color, percent));

  beforeEach(() => {
    color = '#ffffff';
    percent = 0;
  });

  describe('when percent is negative', () => {
    beforeEach(() => (percent = -20));
    beforeEach(action);
    it('should darken the color', () => expect(result).toBe('#ebebeb')); // 255 - 20 = 235 = 0xeb
  });

  describe('when percent is positive', () => {
    beforeEach(() => {
      color = '#000000';
      percent = 20;
    });

    beforeEach(action);

    it('should lighten the color', () => expect(result).toBe('#141414')); // 0 + 20 = 20 = 0x14
  });

  describe('when color has # prefix', () => {
    beforeEach(() => (color = '#abcdef'));
    beforeEach(action);
    it('should handle it correctly', () => expect(result).toMatch(/^#[0-9a-f]{6}$/));
  });

  describe('when result would be below 0', () => {
    beforeEach(() => {
      color = '#000000';
      percent = -50;
    });

    beforeEach(action);

    it('should clamp at 0', () => expect(result).toBe('#000000'));
  });

  describe('when result would exceed 255', () => {
    beforeEach(() => {
      color = '#ffffff';
      percent = 50;
    });

    beforeEach(action);

    it('should clamp at 255', () => expect(result).toBe('#ffffff'));
  });
});
