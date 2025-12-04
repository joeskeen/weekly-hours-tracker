import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditEntryComponent } from './edit-entry.component';
import { TimeEntry } from '../storage.service';

describe('EditEntryComponent Logic', () => {
  let component: EditEntryComponent;
  let injector: Injector;

  beforeEach(() => {
    injector = Injector.create({ providers: [] });
    runInInjectionContext(injector, () => {
      component = new EditEntryComponent();
    });
  });

  describe('ngOnInit', () => {
    const action = () => component.ngOnInit();

    describe('when entry has both in and out times', () => {
      beforeEach(() => {
        component.entry = {
          in: Date.UTC(2024, 0, 15, 9, 0, 0),
          out: Date.UTC(2024, 0, 15, 17, 0, 0),
        };
      });
      beforeEach(action);

      it('should set clockIn to ISO string', () =>
        expect(component.clockIn).toBe(
          new Date(Date.UTC(2024, 0, 15, 9, 0, 0)).toISOString().slice(0, 16),
        ));
      it('should set clockOut to ISO string', () =>
        expect(component.clockOut).toBe(
          new Date(Date.UTC(2024, 0, 15, 17, 0, 0)).toISOString().slice(0, 16),
        ));
    });

    describe('when entry has no out time', () => {
      beforeEach(() => {
        component.entry = { in: Date.UTC(2024, 0, 15, 9, 0, 0), out: null };
      });
      beforeEach(action);

      it('should set clockIn to ISO string', () =>
        expect(component.clockIn).toBe(
          new Date(Date.UTC(2024, 0, 15, 9, 0, 0)).toISOString().slice(0, 16),
        ));
      it('should set clockOut to empty string', () => expect(component.clockOut).toBe(''));
    });
  });

  describe('saveEditEntry', () => {
    let emittedEntry: TimeEntry | undefined;
    const action = () => component.saveEditEntry();

    beforeEach(() => {
      emittedEntry = undefined;
      component.save.subscribe((entry: TimeEntry) => (emittedEntry = entry));
      globalThis.alert = vi.fn();
    });

    describe('when times are valid', () => {
      beforeEach(() => {
        component.clockIn = '2024-01-15T09:00';
        component.clockOut = '2024-01-15T17:00';
      });
      beforeEach(action);

      it('should emit entry with correct in time', () =>
        expect(emittedEntry?.in).toBe(new Date('2024-01-15T09:00').getTime()));
      it('should emit entry with correct out time', () =>
        expect(emittedEntry?.out).toBe(new Date('2024-01-15T17:00').getTime()));
    });

    describe('when clockOut is empty', () => {
      beforeEach(() => {
        component.clockIn = '2024-01-15T09:00';
        component.clockOut = '';
      });
      beforeEach(action);

      it('should emit entry with null out time', () => expect(emittedEntry?.out).toBeNull());
    });

    describe('when clockIn is empty', () => {
      beforeEach(() => {
        component.clockIn = '';
        component.clockOut = '2024-01-15T17:00';
      });
      beforeEach(action);

      it('should show alert', () => expect(globalThis.alert).toHaveBeenCalledWith('Invalid times'));
      it('should not emit', () => expect(emittedEntry).toBeUndefined());
    });

    describe('when clockOut is before clockIn', () => {
      beforeEach(() => {
        component.clockIn = '2024-01-15T17:00';
        component.clockOut = '2024-01-15T09:00';
      });
      beforeEach(action);

      it('should show alert', () => expect(globalThis.alert).toHaveBeenCalledWith('Invalid times'));
      it('should not emit', () => expect(emittedEntry).toBeUndefined());
    });

    describe('when clockOut equals clockIn', () => {
      beforeEach(() => {
        component.clockIn = '2024-01-15T09:00';
        component.clockOut = '2024-01-15T09:00';
      });
      beforeEach(action);

      it('should show alert', () => expect(globalThis.alert).toHaveBeenCalledWith('Invalid times'));
      it('should not emit', () => expect(emittedEntry).toBeUndefined());
    });
  });

  describe('cancelEditEntry', () => {
    let cancelled: boolean;
    const action = () => component.cancelEditEntry();

    beforeEach(() => {
      cancelled = false;
      component.cancel.subscribe(() => (cancelled = true));
    });
    beforeEach(action);

    it('should emit cancel event', () => expect(cancelled).toBe(true));
  });
});

describe('EditEntryComponent Template', () => {
  let component: EditEntryComponent;
  let fixture: ComponentFixture<EditEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEntryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEntryComponent);
    component = fixture.componentInstance;
    component.entry = { in: Date.now(), out: null };
    await fixture.whenStable();
  });

  it('should render without errors', () => {
    expect(component).toBeTruthy();
  });
});
