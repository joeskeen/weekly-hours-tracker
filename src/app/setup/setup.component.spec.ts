import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Injector,
  runInInjectionContext,
  signal,
  APP_ID,
  ɵChangeDetectionScheduler as ChangeDetectionScheduler,
  ɵEffectScheduler as EffectScheduler,
} from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SetupComponent } from './setup.component';
import { Setup, DayOfWeek } from '../storage.service';

describe('SetupComponent Logic', () => {
  let component: SetupComponent;
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

    injector = Injector.create({
      providers: [
        { provide: APP_ID, useValue: 'test-app' },
        { provide: ChangeDetectionScheduler, useValue: changeDetectionScheduler },
        { provide: EffectScheduler, useValue: effectScheduler },
      ],
    });
    runInInjectionContext(injector, () => {
      component = new SetupComponent();
    });
  });

  describe('daysOfWeek', () => {
    let result: DayOfWeek[];
    const action = () => (result = component.daysOfWeek());

    describe('when week starts on Sunday', () => {
      beforeEach(() => {
        (component.setup as any) = signal({
          targetHours: 40,
          weekStartsOn: 'Sun',
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          theme: { mode: 'light', primaryColor: '#007bff' },
        });
      });
      beforeEach(action);

      it('should start with Sunday', () => expect(result[0]).toBe('Sun'));
      it('should end with Saturday', () => expect(result[6]).toBe('Sat'));
      it('should have Monday second', () => expect(result[1]).toBe('Mon'));
    });

    describe('when week starts on Monday', () => {
      beforeEach(() => {
        (component.setup as any) = signal({
          targetHours: 40,
          weekStartsOn: 'Mon',
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          theme: { mode: 'light', primaryColor: '#007bff' },
        });
      });
      beforeEach(action);

      it('should start with Monday', () => expect(result[0]).toBe('Mon'));
      it('should end with Sunday', () => expect(result[6]).toBe('Sun'));
      it('should have Tuesday second', () => expect(result[1]).toBe('Tue'));
    });

    describe('when week starts on Wednesday', () => {
      beforeEach(() => {
        (component.setup as any) = signal({
          targetHours: 40,
          weekStartsOn: 'Wed',
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          theme: { mode: 'light', primaryColor: '#007bff' },
        });
      });
      beforeEach(action);

      it('should start with Wednesday', () => expect(result[0]).toBe('Wed'));
      it('should end with Tuesday', () => expect(result[6]).toBe('Tue'));
      it('should have Thursday second', () => expect(result[1]).toBe('Thu'));
    });

    describe('when week starts on Saturday', () => {
      beforeEach(() => {
        (component.setup as any) = signal({
          targetHours: 40,
          weekStartsOn: 'Sat',
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          theme: { mode: 'light', primaryColor: '#007bff' },
        });
      });
      beforeEach(action);

      it('should start with Saturday', () => expect(result[0]).toBe('Sat'));
      it('should end with Friday', () => expect(result[6]).toBe('Fri'));
      it('should have Sunday second', () => expect(result[1]).toBe('Sun'));
    });
  });
});

describe('SetupComponent Template', () => {
  let component: SetupComponent;
  let fixture: ComponentFixture<SetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupComponent);

    const mockSetup: Setup = {
      targetHours: 40,
      weekStartsOn: 'Sun',
      planned: { Sun: 0, Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0 },
      theme: { mode: 'light', primaryColor: '#3f51b5' },
    };
    fixture.componentRef.setInput('setup', mockSetup);

    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should render without errors', () => {
    expect(component).toBeTruthy();
  });
});
