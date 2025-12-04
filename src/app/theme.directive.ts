import { Directive, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SetupService } from './setup.service';
import type { Theme } from './storage.service';

function adjustColorBrightness(color: string, percent: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

@Directive({
  selector: '[appTheme]',
  standalone: true,
})
export class ThemeDirective {
  private readonly setupService = inject(SetupService);
  private readonly document = inject(DOCUMENT);

  constructor() {
    effect(() => {
      const theme = this.setupService.theme();
      if (theme) {
        this.applyTheme(theme);
      }
    });
  }

  applyTheme(theme: Theme): void {
    const body = this.document.body;
    body.setAttribute('data-theme', theme.mode);
    this.document.documentElement.style.setProperty('--primary-color', theme.primaryColor);

    // Adjust hover color (slightly darker/lighter depending on mode)
    const hoverColor = adjustColorBrightness(theme.primaryColor, theme.mode === 'dark' ? 20 : -20);
    this.document.documentElement.style.setProperty('--primary-hover', hoverColor);
  }
}

export { adjustColorBrightness };
