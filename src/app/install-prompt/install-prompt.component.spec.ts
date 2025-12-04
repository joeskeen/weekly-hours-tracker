import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstallPromptComponent } from './install-prompt.component';

describe('InstallPromptComponent', () => {
  let component: InstallPromptComponent;
  let fixture: ComponentFixture<InstallPromptComponent>;

  beforeEach(async () => {
    // Clear session storage before each test
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [InstallPromptComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InstallPromptComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show prompt initially', () => {
    expect(component.showPrompt()).toBe(false);
  });

  it('should not show prompt if already dismissed in session', () => {
    sessionStorage.setItem('installPromptDismissed', 'true');
    const newFixture = TestBed.createComponent(InstallPromptComponent);
    const newComponent = newFixture.componentInstance;
    expect(newComponent.dismissed()).toBe(true);
  });

  it('should dismiss and store in session storage', () => {
    component.dismiss();
    expect(component.dismissed()).toBe(true);
    expect(component.showPrompt()).toBe(false);
    expect(sessionStorage.getItem('installPromptDismissed')).toBe('true');
  });

  describe('template', () => {
    it('should not render prompt when showPrompt is false', () => {
      component.showPrompt.set(false);
      fixture.detectChanges();
      const promptElement =
        fixture.nativeElement.querySelector('.install-prompt');
      expect(promptElement).toBeNull();
    });

    it('should not render prompt when dismissed is true', () => {
      component.showPrompt.set(true);
      component.dismissed.set(true);
      fixture.detectChanges();
      const promptElement =
        fixture.nativeElement.querySelector('.install-prompt');
      expect(promptElement).toBeNull();
    });

    it('should render prompt when showPrompt is true and not dismissed', () => {
      component.showPrompt.set(true);
      component.dismissed.set(false);
      fixture.detectChanges();
      const promptElement =
        fixture.nativeElement.querySelector('.install-prompt');
      expect(promptElement).toBeTruthy();
    });

    it('should show install button', () => {
      component.showPrompt.set(true);
      fixture.detectChanges();
      const installBtn = fixture.nativeElement.querySelector('.install-btn');
      expect(installBtn).toBeTruthy();
      expect(installBtn.textContent).toContain('Install');
    });

    it('should show later button', () => {
      component.showPrompt.set(true);
      fixture.detectChanges();
      const laterBtn = fixture.nativeElement.querySelector('.later-btn');
      expect(laterBtn).toBeTruthy();
      expect(laterBtn.textContent).toContain('Maybe Later');
    });

    it('should show close button', () => {
      component.showPrompt.set(true);
      fixture.detectChanges();
      const closeBtn = fixture.nativeElement.querySelector('.close-btn');
      expect(closeBtn).toBeTruthy();
    });

    it('should call dismiss when close button is clicked', () => {
      component.showPrompt.set(true);
      fixture.detectChanges();
      const dismissSpy = vi.spyOn(component, 'dismiss');
      const closeBtn = fixture.nativeElement.querySelector('.close-btn');
      closeBtn.click();
      expect(dismissSpy).toHaveBeenCalled();
    });

    it('should call dismiss when later button is clicked', () => {
      component.showPrompt.set(true);
      fixture.detectChanges();
      const dismissSpy = vi.spyOn(component, 'dismiss');
      const laterBtn = fixture.nativeElement.querySelector('.later-btn');
      laterBtn.click();
      expect(dismissSpy).toHaveBeenCalled();
    });

    it('should call install when install button is clicked', () => {
      component.showPrompt.set(true);
      fixture.detectChanges();
      const installSpy = vi.spyOn(component, 'install');
      const installBtn = fixture.nativeElement.querySelector('.install-btn');
      installBtn.click();
      expect(installSpy).toHaveBeenCalled();
    });
  });
});
