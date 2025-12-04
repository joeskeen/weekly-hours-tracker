import { ComponentFixture, getTestBed, TestBed } from '@angular/core/testing';
import {
  Injector,
  APP_ID,
  runInInjectionContext,
  ɵChangeDetectionScheduler as ChangeDetectionScheduler,
  ɵEffectScheduler as EffectScheduler,
  signal,
} from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TimeInputComponent,
  validateTimeInput,
  parseTimeValue,
} from './time-input.component';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

describe('validateTimeInput', () => {
  let value: string;
  let now: number;
  let result: ReturnType<typeof validateTimeInput>;
  const action = () => (result = validateTimeInput(value, now));

  beforeEach(() => {
    now = new Date('2024-01-15T12:00:00').getTime();
    value = '2024-01-15T10:00:00';
  });

  describe('with empty string', () => {
    beforeEach(() => (value = ''));
    beforeEach(action);
    it('should return null', () => expect(result).toBeNull());
  });

  describe('with invalid date string', () => {
    beforeEach(() => (value = 'not-a-date'));
    beforeEach(action);

    it('should return invalid error', () =>
      expect(result).toEqual({
        kind: 'invalid',
        message: 'Invalid date/time',
      }));
  });

  describe('with valid past date', () => {
    beforeEach(action);
    it('should return null', () => expect(result).toBeNull());
  });

  describe('with future date', () => {
    beforeEach(() => (value = '2024-01-15T14:00:00'));
    beforeEach(action);

    it('should return future error', () =>
      expect(result).toEqual({
        kind: 'future',
        message: 'Time cannot be in the future',
      }));
  });

  describe('with one minute in future', () => {
    beforeEach(() => (value = '2024-01-15T12:01:00'));
    beforeEach(action);

    it('should return null', () => expect(result).toBeNull());
  });

  describe('with more than one minute in future', () => {
    beforeEach(() => (value = '2024-01-15T12:01:01'));
    beforeEach(action);

    it('should return future error', () =>
      expect(result).toEqual({
        kind: 'future',
        message: 'Time cannot be in the future',
      }));
  });

  describe('with exact now time', () => {
    beforeEach(() => (value = '2024-01-15T12:00:00'));
    beforeEach(action);

    it('should return null', () => expect(result).toBeNull());
  });

  describe('with now plus milliseconds', () => {
    beforeEach(() => {
      now = new Date('2024-01-15T12:00:00.789').getTime();
      value = '2024-01-15T12:00:00';
    });
    beforeEach(action);

    it('should return null', () => expect(result).toBeNull());
  });
});

describe('parseTimeValue', () => {
  let value: string;
  let result: Date | null;
  const action = () => (result = parseTimeValue(value));

  beforeEach(() => (value = '2024-01-15T10:30:00'));

  describe('with empty string', () => {
    beforeEach(() => (value = ''));
    beforeEach(action);

    it('should return null', () => expect(result).toBeNull());
  });

  describe('with invalid date string', () => {
    beforeEach(() => (value = 'not-a-date'));
    beforeEach(action);

    it('should return null', () => expect(result).toBeNull());
  });
  describe('with valid date string', () => {
    beforeEach(action);

    it('should return Date object', () => expect(result).toBeInstanceOf(Date));

    it('should parse correct time', () =>
      expect(result?.getTime()).toBe(
        new Date('2024-01-15T10:30:00').getTime(),
      ));
  });

  describe('with ISO 8601 format', () => {
    beforeEach(() => (value = '2024-01-15T14:45:30.123Z'));
    beforeEach(action);

    it('should return Date object', () => expect(result).toBeInstanceOf(Date));

    it('should parse correct time', () =>
      expect(result?.getTime()).toBe(
        new Date('2024-01-15T14:45:30.123Z').getTime(),
      ));
  });
});

describe('TimeInputComponent Logic', () => {
  let component: TimeInputComponent;
  let injector: Injector;
  let effectScheduler: EffectScheduler;
  let changeDetectionScheduler: ChangeDetectionScheduler;
  const now = new Date('2024-01-15T18:00:00').getTime();

  beforeEach(() => {
    effectScheduler = {
      add: vi.fn(),
      remove: vi.fn(),
      schedule: vi.fn(),
      flush: vi.fn(),
    } as any;

    changeDetectionScheduler = {
      notify: vi.fn(),
      runningTick: false,
    } as any;

    injector = Injector.create({
      providers: [
        { provide: APP_ID, useValue: 'test-app' },
        {
          provide: ChangeDetectionScheduler,
          useValue: changeDetectionScheduler,
        },
        { provide: EffectScheduler, useValue: effectScheduler },
      ],
    });

    runInInjectionContext(injector, () => {
      component = new TimeInputComponent();
      (component.now as any) = signal(now);
    });
  });

  describe('nonRequiredErrors computed signal', () => {
    let value: any[];
    const action = () => (value = component.nonRequiredErrors());

    describe('with empty value', () => {
      beforeEach(() => component.timeInputModel.set(''));
      beforeEach(action);
      it('should return empty array', () => expect(value).toEqual([]));
    });

    describe('with valid value', () => {
      beforeEach(() => component.timeInputModel.set('2024-01-15T10:00:00'));
      beforeEach(action);
      it('should return empty array', () => expect(value).toEqual([]));
    });

    describe('with invalid value', () => {
      beforeEach(() => component.timeInputModel.set('not-a-date'));
      beforeEach(action);
      it('should return one error', () => expect(value.length).toBe(1));
      it('should be invalid error', () =>
        expect(value[0].kind).toBe('invalid'));
    });

    describe('with future value', () => {
      beforeEach(() => component.timeInputModel.set('2024-01-15T20:00:00'));
      beforeEach(action);
      it('should return one error', () => expect(value.length).toBe(1));
      it('should be future error', () => expect(value[0].kind).toBe('future'));
    });
  });

  describe('punch', () => {
    let emit: ReturnType<typeof vi.fn<(d: Date) => void>>;
    let emitter: { emit: (d: Date) => void };
    const action = () => component.punch(emitter as any);

    beforeEach(() => {
      emit = vi.fn<(d: Date) => void>();
      emitter = { emit };
    });

    describe('with valid time', () => {
      beforeEach(() => component.timeInputModel.set('2024-01-15T10:00:00'));
      let wasInvalid: boolean;
      beforeEach(() => (wasInvalid = component.timeForm().invalid()));
      beforeEach(action);
      it('should call emit', () => expect(emit).toHaveBeenCalledTimes(1));
      it('should pass correct date', () =>
        expect(emit.mock.calls[0][0].getTime()).toBe(
          new Date('2024-01-15T10:00:00').getTime(),
        ));
      it('should clear model', () =>
        expect(component.timeInputModel()).toBe(''));
      it('should have been valid before punch', () =>
        expect(wasInvalid).toBe(false));
      it('should be invalid after clearing', () =>
        expect(component.timeForm().invalid()).toBe(true));
    });

    describe('with empty time', () => {
      beforeEach(() => component.timeInputModel.set(''));
      beforeEach(action);
      it('should not call emit', () => expect(emit).not.toHaveBeenCalled());
      it('should leave model empty', () =>
        expect(component.timeInputModel()).toBe(''));
      it('should have invalid form', () =>
        expect(component.timeForm().invalid()).toBe(true));
    });

    describe('with invalid time', () => {
      beforeEach(() => component.timeInputModel.set('invalid'));
      beforeEach(action);
      it('should not call emit', () => expect(emit).not.toHaveBeenCalled());
      it('should retain invalid value', () =>
        expect(component.timeInputModel()).toBe('invalid'));
      it('should have invalid form', () =>
        expect(component.timeForm().invalid()).toBe(true));
    });

    describe('with future time (form invalid)', () => {
      beforeEach(() => component.timeInputModel.set('2024-01-15T20:00:00'));
      beforeEach(action);
      it('should not call emit', () => expect(emit).not.toHaveBeenCalled());
      it('should retain future value', () =>
        expect(component.timeInputModel()).toBe('2024-01-15T20:00:00'));
      it('should have invalid form', () =>
        expect(component.timeForm().invalid()).toBe(true));
    });
  });
});

describe('TimeInputComponent Template', () => {
  let component: TimeInputComponent;
  let fixture: ComponentFixture<TimeInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeInputComponent);
    fixture.componentRef.setInput('now', Date.now());
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render without errors', () =>
    expect(fixture.nativeElement).toBeTruthy());
});
