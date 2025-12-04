import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { WeeklyProgressComponent } from './weekly-progress.component';

describe('WeeklyProgressComponent Logic', () => {
  let component: WeeklyProgressComponent;
  let injector: Injector;

  beforeEach(() => {
    injector = Injector.create({ providers: [] });
    runInInjectionContext(injector, () => {
      component = new WeeklyProgressComponent();
    });
  });

  describe('progressPercent', () => {
    let result: number;
    const action = () => (result = component.progressPercent());

    describe('when completed is less than target', () => {
      beforeEach(() => {
        (component.completedHours as any) = signal(30);
        (component.targetHours as any) = signal(40);
      });
      beforeEach(action);

      it('should return percentage rounded', () => expect(result).toBe(75));
    });

    describe('when completed equals target', () => {
      beforeEach(() => {
        (component.completedHours as any) = signal(40);
        (component.targetHours as any) = signal(40);
      });
      beforeEach(action);

      it('should return 100', () => expect(result).toBe(100));
    });

    describe('when completed exceeds target', () => {
      beforeEach(() => {
        (component.completedHours as any) = signal(50);
        (component.targetHours as any) = signal(40);
      });
      beforeEach(action);

      it('should cap at 100', () => expect(result).toBe(100));
    });

    describe('when target is zero', () => {
      beforeEach(() => {
        (component.completedHours as any) = signal(10);
        (component.targetHours as any) = signal(0);
      });
      beforeEach(action);

      it('should return Infinity capped at 100', () => expect(result).toBe(100));
    });

    describe('when completed is fractional', () => {
      beforeEach(() => {
        (component.completedHours as any) = signal(33.333);
        (component.targetHours as any) = signal(40);
      });
      beforeEach(action);

      it('should round to nearest integer', () => expect(result).toBe(83));
    });

    describe('when completed is very small', () => {
      beforeEach(() => {
        (component.completedHours as any) = signal(0.1);
        (component.targetHours as any) = signal(40);
      });
      beforeEach(action);

      it('should round to zero', () => expect(result).toBe(0));
    });
  });
});

describe('WeeklyProgressComponent Template', () => {
  let component: WeeklyProgressComponent;
  let fixture: ComponentFixture<WeeklyProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyProgressComponent);
    fixture.componentRef.setInput('completedHours', 30);
    fixture.componentRef.setInput('remainingHours', 10);
    fixture.componentRef.setInput('targetHours', 40);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should render without errors', () => {
    expect(component).toBeTruthy();
  });
});
