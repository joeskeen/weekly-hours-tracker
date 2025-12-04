import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { EntryItemComponent } from './entry-item.component';
import { TimeEntry } from '../storage.service';

describe('EntryItemComponent Logic', () => {
  let component: EntryItemComponent;
  let injector: Injector;

  beforeEach(() => {
    injector = Injector.create({ providers: [] });
    runInInjectionContext(injector, () => {
      component = new EntryItemComponent();
    });
  });

  describe('editEntryClicked', () => {
    let emittedEntry: TimeEntry | undefined;
    const action = () => component.editEntryClicked();

    beforeEach(() => {
      emittedEntry = undefined;
      component.entry = { in: 123456789, out: 987654321 };
      component.editEntry.subscribe((entry: TimeEntry) => (emittedEntry = entry));
    });
    beforeEach(action);

    it('should emit the entry', () => expect(emittedEntry).toEqual(component.entry));
  });

  describe('deleteEntryClicked', () => {
    let emittedEntry: TimeEntry | undefined;
    const action = () => component.deleteEntryClicked();

    beforeEach(() => {
      emittedEntry = undefined;
      component.entry = { in: 123456789, out: 987654321 };
      component.deleteEntry.subscribe((entry: TimeEntry) => (emittedEntry = entry));
    });
    beforeEach(action);

    it('should emit the entry', () => expect(emittedEntry).toEqual(component.entry));
  });
});

describe('EntryItemComponent Template', () => {
  let component: EntryItemComponent;
  let fixture: ComponentFixture<EntryItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntryItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntryItemComponent);
    component = fixture.componentInstance;

    const mockEntry: TimeEntry = { in: Date.now(), out: Date.now() + 3600000 };
    component.entry = mockEntry;
    component.now = Date.now();

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should render without errors', () => {
    expect(component).toBeTruthy();
  });
});
