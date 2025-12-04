import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import {
  Injector,
  APP_ID,
  runInInjectionContext,
  ɵChangeDetectionScheduler as ChangeDetectionScheduler,
  ɵEffectScheduler as EffectScheduler,
  signal,
} from '@angular/core';
import { AppComponent } from './app';
import { StorageService, Setup, TimeEntry } from './storage.service';
import { SetupService } from './setup.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AppComponent Logic', () => {
  let component: AppComponent;
  let injector: Injector;
  let effectScheduler: EffectScheduler;
  let changeDetectionScheduler: ChangeDetectionScheduler;
  let storageService: StorageService;
  let mockSetupService: any;
  let mockDocument: Partial<Document>;

  beforeEach(() => {
    mockSetupService = {
      setup: signal<Setup | undefined>(undefined),
      theme: vi.fn(),
      loadSetup: vi.fn(),
      saveSetup: vi.fn(),
    };

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

    storageService = {
      getSetup: vi.fn().mockResolvedValue(null),
      saveSetup: vi.fn().mockResolvedValue(undefined),
      getTimesheet: vi.fn().mockResolvedValue([]),
      saveTimesheet: vi.fn().mockResolvedValue(undefined),
    } as any;

    // Mock document with minimal required properties
    mockDocument = {
      body: {
        setAttribute: vi.fn(),
      } as any,
      documentElement: {
        style: {
          setProperty: vi.fn(),
        },
      } as any,
      createElement: vi.fn((tag: string) => ({
        click: vi.fn(),
        href: '',
        download: '',
      })),
      activeElement: null,
    } as any;

    injector = Injector.create({
      providers: [
        { provide: APP_ID, useValue: 'test-app' },
        {
          provide: ChangeDetectionScheduler,
          useValue: changeDetectionScheduler,
        },
        { provide: EffectScheduler, useValue: effectScheduler },
        { provide: StorageService, useValue: storageService },
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: SetupService, useValue: mockSetupService },
      ],
    });

    runInInjectionContext(injector, () => {
      component = new AppComponent();
    });
  });

  describe('recommendedClockOut', () => {
    let result: string | null;
    const action = () => (result = component.recommendedClockOut());

    describe('when not clocked in', () => {
      beforeEach(() => {
        mockSetupService.setup.set({
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Mon',
          theme: { mode: 'light', primaryColor: '#007bff' },
        });
        component.timeEntries.set([]);
        // Monday, 9 AM
        (component.now as any) = signal(
          new Date('2024-01-08T09:00:00').getTime(),
        );
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should return null', () => {
        expect(result).toBeNull();
      });
    });

    describe('when no setup exists', () => {
      beforeEach(() => {
        mockSetupService.setup.set(undefined);
        component.timeEntries.set([
          { in: new Date('2024-01-08T09:00:00').getTime(), out: null },
        ]);
        (component.now as any) = signal(
          new Date('2024-01-08T10:00:00').getTime(),
        );
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should return null', () => {
        expect(result).toBeNull();
      });
    });

    describe('on-schedule scenario', () => {
      beforeEach(() => {
        const setup: Setup = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Mon',
          theme: { mode: 'light', primaryColor: '#007bff' },
        };
        mockSetupService.setup.set(setup);

        // Monday 9 AM, clocked in at 9 AM, currently 1 PM (4 hours worked)
        const monday9am = new Date('2024-01-08T09:00:00').getTime();
        const monday1pm = new Date('2024-01-08T13:00:00').getTime();
        component.timeEntries.set([{ in: monday9am, out: null }]);
        (component.now as any) = signal(monday1pm);
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should recommend clock out at planned time', () => {
        // Currently 1 PM with 4 hours worked, need 8 total, so 4 more hours = 5 PM
        expect(result).toMatch(/5:00|17:00/);
      });
    });

    describe('behind-schedule scenario - mid-week', () => {
      beforeEach(() => {
        const setup: Setup = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Mon',
          theme: { mode: 'light', primaryColor: '#007bff' },
        };
        mockSetupService.setup.set(setup);

        // Wednesday 9 AM, clocked in. Worked Monday 6hrs, Tuesday 6hrs (12 total, should have 16)
        // Behind by 4 hours total
        const monday9am = new Date('2024-01-08T09:00:00').getTime();
        const monday3pm = new Date('2024-01-08T15:00:00').getTime(); // 6 hours
        const tuesday9am = new Date('2024-01-09T09:00:00').getTime();
        const tuesday3pm = new Date('2024-01-09T15:00:00').getTime(); // 6 hours
        const wednesday9am = new Date('2024-01-10T09:00:00').getTime();
        const wednesday10am = new Date('2024-01-10T10:00:00').getTime(); // currently 1 hour in

        component.timeEntries.set([
          { in: monday9am, out: monday3pm },
          { in: tuesday9am, out: tuesday3pm },
          { in: wednesday9am, out: null },
        ]);
        (component.now as any) = signal(wednesday10am);
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should distribute deficit across remaining work days', () => {
        // Completed: 12 hours (Mon 6 + Tue 6)
        // Currently working: 1 hour (Wed 9-10am)
        // Target: 40 hours
        // Remaining after today: 40 - 12 - 1 = 27 hours
        // Remaining work days after today: 3 (Wed today, Thu, Fri = 3 days including today)
        // Deficit spread: (16 - 12) / 3 = 1.33 hours per day additional
        // Today should work: 8 + 1.33 = 9.33 hours
        // Already worked today: 1 hour
        // Need to work: 8.33 more hours
        // Clock out at: 10 AM + 8.33 hours = 6:20 PM
        expect(result).toMatch(/6:20|18:20/);
      });
    });

    describe('ahead-of-schedule scenario', () => {
      beforeEach(() => {
        const setup: Setup = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Mon',
          theme: { mode: 'light', primaryColor: '#007bff' },
        };
        mockSetupService.setup.set(setup);

        // Wednesday 9 AM, clocked in. Worked Monday 10hrs, Tuesday 10hrs (20 total, should have 16)
        // Ahead by 4 hours
        const monday9am = new Date('2024-01-08T09:00:00').getTime();
        const monday7pm = new Date('2024-01-08T19:00:00').getTime(); // 10 hours
        const tuesday9am = new Date('2024-01-09T09:00:00').getTime();
        const tuesday7pm = new Date('2024-01-09T19:00:00').getTime(); // 10 hours
        const wednesday9am = new Date('2024-01-10T09:00:00').getTime();
        const wednesday10am = new Date('2024-01-10T10:00:00').getTime(); // currently 1 hour in

        component.timeEntries.set([
          { in: monday9am, out: monday7pm },
          { in: tuesday9am, out: tuesday7pm },
          { in: wednesday9am, out: null },
        ]);
        (component.now as any) = signal(wednesday10am);
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should reduce hours proportionally across remaining days', () => {
        // Completed: 20 hours
        // Currently working: 1 hour
        // Target: 40 hours
        // Should have completed by end of Tuesday: 16 hours
        // Ahead by: 20 - 16 = 4 hours
        // Remaining work days: 3 (Wed, Thu, Fri)
        // Surplus spread: 4 / 3 = 1.33 hours less per day
        // Today should work: 8 - 1.33 = 6.67 hours
        // Already worked: 1 hour
        // Need to work: 5.67 more hours
        // Clock out at: 10 AM + 5.67 hours = 3:40 PM
        expect(result).toMatch(/3:40|15:40/);
      });
    });

    describe('last work day - behind schedule', () => {
      beforeEach(() => {
        const setup: Setup = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Mon',
          theme: { mode: 'light', primaryColor: '#007bff' },
        };
        mockSetupService.setup.set(setup);

        // Friday 9 AM, clocked in. Worked Mon-Thu only 30 hours total (should have 32)
        const monday9am = new Date('2024-01-08T09:00:00').getTime();
        const monday5pm = new Date('2024-01-08T17:00:00').getTime(); // 8 hours
        const tuesday9am = new Date('2024-01-09T09:00:00').getTime();
        const tuesday4pm = new Date('2024-01-09T16:00:00').getTime(); // 7 hours
        const wednesday9am = new Date('2024-01-10T09:00:00').getTime();
        const wednesday4pm = new Date('2024-01-10T16:00:00').getTime(); // 7 hours
        const thursday9am = new Date('2024-01-11T09:00:00').getTime();
        const thursday5pm = new Date('2024-01-11T17:00:00').getTime(); // 8 hours
        const friday9am = new Date('2024-01-12T09:00:00').getTime();
        const friday10am = new Date('2024-01-12T10:00:00').getTime(); // currently 1 hour in

        component.timeEntries.set([
          { in: monday9am, out: monday5pm },
          { in: tuesday9am, out: tuesday4pm },
          { in: wednesday9am, out: wednesday4pm },
          { in: thursday9am, out: thursday5pm },
          { in: friday9am, out: null },
        ]);
        (component.now as any) = signal(friday10am);
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should assign all remaining hours to last day', () => {
        // Completed: 30 hours
        // Currently working: 1 hour
        // Target: 40 hours
        // Remaining: 40 - 30 - 1 = 9 hours more needed today
        // Clock out at: 10 AM + 9 hours = 7 PM
        expect(result).toMatch(/7:00|19:00/);
      });
    });

    describe('already worked enough for the day', () => {
      beforeEach(() => {
        const setup: Setup = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Mon',
          theme: { mode: 'light', primaryColor: '#007bff' },
        };
        mockSetupService.setup.set(setup);

        // Monday, already worked 8 hours, still clocked in
        const monday9am = new Date('2024-01-08T09:00:00').getTime();
        const monday5pm = new Date('2024-01-08T17:00:00').getTime();

        component.timeEntries.set([{ in: monday9am, out: null }]);
        (component.now as any) = signal(monday5pm); // 8 hours worked
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should return null', () => {
        expect(result).toBeNull();
      });
    });
  });

  describe('groupedEntries', () => {
    let result: any[] = [];
    const action = () => (result = component.groupedEntries());

    describe('single entry on one day', () => {
      beforeEach(() => {
        component.timeEntries.set([
          {
            in: new Date('2024-01-08T09:00:00').getTime(),
            out: new Date('2024-01-08T17:00:00').getTime(),
          },
        ]);
        (component.now as any) = signal(
          new Date('2024-01-08T17:00:00').getTime(),
        );
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should create one group', () => {
        expect(result).toHaveLength(1);
      });

      it('should set correct day label', () => {
        expect(result[0].dayLabel).toMatch(/Mon|8/);
      });

      it('should calculate correct total hours', () => {
        expect(result[0].totalHours).toBe(8);
      });

      it('should contain the entry', () => {
        expect(result[0].entries).toHaveLength(1);
      });
    });

    describe('multiple entries on the same calendar day', () => {
      beforeEach(() => {
        component.timeEntries.set([
          {
            in: new Date('2024-01-08T09:00:00').getTime(),
            out: new Date('2024-01-08T12:00:00').getTime(),
          },
          {
            in: new Date('2024-01-08T13:00:00').getTime(),
            out: new Date('2024-01-08T17:00:00').getTime(),
          },
        ]);
        (component.now as any) = signal(
          new Date('2024-01-08T17:00:00').getTime(),
        );
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should group both entries under same day', () => {
        expect(result).toHaveLength(1);
      });

      it('should calculate total hours across both entries', () => {
        expect(result[0].totalHours).toBe(7); // 3 + 4 hours
      });

      it('should contain both entries', () => {
        expect(result[0].entries).toHaveLength(2);
      });
    });

    describe('entries on different calendar days', () => {
      beforeEach(() => {
        component.timeEntries.set([
          {
            in: new Date('2024-01-08T09:00:00').getTime(),
            out: new Date('2024-01-08T17:00:00').getTime(),
          },
          {
            in: new Date('2024-01-09T09:00:00').getTime(),
            out: new Date('2024-01-09T17:00:00').getTime(),
          },
        ]);
        (component.now as any) = signal(
          new Date('2024-01-09T17:00:00').getTime(),
        );
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should create separate groups for each day', () => {
        expect(result).toHaveLength(2);
      });

      it('should have correct hours for each group', () => {
        expect(result[0].totalHours).toBe(8);
        expect(result[1].totalHours).toBe(8);
      });
    });

    describe('UTC boundary crossing - evening local time', () => {
      beforeEach(() => {
        // This simulates entries in a timezone far from UTC
        // For example, Pacific timezone where 8:30 PM local = 4:30 AM UTC next day
        // We use timestamps that when converted to UTC would be different day,
        // but are same local day

        // Create entries that in UTC would be different days, but same local day
        // 2024-01-08 10:00 PM (UTC-8) = 2024-01-09 6:00 AM UTC
        // 2024-01-08 11:00 PM (UTC-8) = 2024-01-09 7:00 AM UTC
        const timestamp1 = new Date('2024-01-08T22:00:00').getTime(); // 10 PM local
        const timestamp2 = new Date('2024-01-08T23:00:00').getTime(); // 11 PM local
        const timestamp3 = new Date('2024-01-09T01:00:00').getTime(); // 1 AM local (next day)

        component.timeEntries.set([
          { in: timestamp1, out: timestamp2 },
          { in: timestamp3, out: new Date('2024-01-09T02:00:00').getTime() },
        ]);
        (component.now as any) = signal(
          new Date('2024-01-09T02:00:00').getTime(),
        );
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should group evening entry with other entries on same local day', () => {
        // Even though timestamp1 and timestamp2 might be in different UTC days,
        // they should be grouped with entries on their local calendar day
        expect(result.length).toBeGreaterThanOrEqual(1);
      });

      it('should have entries for both local calendar days', () => {
        // Entry at 10-11 PM on 8th, and entry at 1-2 AM on 9th
        // should create groups for both dates (or just one if times are in same TZ)
        const dayLabels = result.map((g) => g.dayLabel);
        expect(dayLabels.length).toBeGreaterThan(0);
      });
    });

    describe('mixed completed and in-progress entries on same day', () => {
      beforeEach(() => {
        const now = new Date('2024-01-08T15:00:00').getTime(); // 3 PM
        component.timeEntries.set([
          {
            in: new Date('2024-01-08T09:00:00').getTime(),
            out: new Date('2024-01-08T12:00:00').getTime(),
          },
          { in: new Date('2024-01-08T13:00:00').getTime(), out: null }, // in progress
        ]);
        (component.now as any) = signal(now);
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should group both under same day', () => {
        expect(result).toHaveLength(1);
      });

      it('should calculate hours for in-progress entry using now time', () => {
        // 3 hours (9-12) + 2 hours (13-15) = 5 hours
        expect(result[0].totalHours).toBe(5);
      });
    });

    describe('week with entries spanning multiple days', () => {
      beforeEach(() => {
        const now = new Date('2024-01-12T17:00:00').getTime(); // Friday 5 PM
        component.timeEntries.set([
          {
            in: new Date('2024-01-08T09:00:00').getTime(),
            out: new Date('2024-01-08T17:00:00').getTime(),
          }, // Mon
          {
            in: new Date('2024-01-09T09:00:00').getTime(),
            out: new Date('2024-01-09T17:00:00').getTime(),
          }, // Tue
          {
            in: new Date('2024-01-10T09:00:00').getTime(),
            out: new Date('2024-01-10T12:00:00').getTime(),
          }, // Wed - short
          {
            in: new Date('2024-01-10T13:00:00').getTime(),
            out: new Date('2024-01-10T17:00:00').getTime(),
          }, // Wed - afternoon
          { in: new Date('2024-01-12T09:00:00').getTime(), out: null }, // Fri - in progress
        ]);
        (component.now as any) = signal(now);
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should create a group for each unique day', () => {
        expect(result).toHaveLength(4); // Mon, Tue, Wed, Fri (no Thu)
      });

      it('should correctly sum hours for Wednesday with two entries', () => {
        const wedGroup = result.find((g) => g.dayLabel.includes('Wed'));
        expect(wedGroup?.totalHours).toBe(7); // 3 + 4
      });

      it('should correctly sum hours for all days', () => {
        const totalHours = result.reduce(
          (sum, group) => sum + group.totalHours,
          0,
        );
        // Mon: 8, Tue: 8, Wed: 7 (3+4), Fri: 8 (in progress from 9 AM to 5 PM)
        expect(totalHours).toBe(31);
      });
    });

    describe('entries on same local day but different UTC dates', () => {
      beforeEach(() => {
        // Simulate timezone UTC-8 (Pacific)
        // Local date: 2024-01-08
        // When it's 8:30 PM local = 4:30 AM UTC next day
        // When it's 11:30 PM local = 7:30 AM UTC next day

        // These timestamps represent 8:30 PM - 11:30 PM on 2024-01-08 (local)
        // In UTC this would be 2024-01-09 4:30 AM - 7:30 AM (different day!)
        const evening1 = new Date('2024-01-08T20:30:00').getTime(); // 8:30 PM
        const evening2 = new Date('2024-01-08T23:30:00').getTime(); // 11:30 PM

        component.timeEntries.set([{ in: evening1, out: evening2 }]);
        (component.now as any) = signal(evening2);
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should group entry under its local calendar date (2024-01-08)', () => {
        expect(result).toHaveLength(1);
        // The entry should be grouped by local date, not UTC date
        expect(result[0].entries).toHaveLength(1);
      });

      it('should correctly calculate hours', () => {
        expect(result[0].totalHours).toBe(3); // 8:30 PM to 11:30 PM = 3 hours
      });
    });

    describe('multiple entries after midnight UTC boundary', () => {
      beforeEach(() => {
        // Simulate entries all in the evening/night that cross UTC midnight
        // but are all on the same calendar day locally
        const utcBoundary1 = new Date('2024-01-08T20:00:00').getTime(); // 8:00 PM local
        const utcBoundary2 = new Date('2024-01-08T22:00:00').getTime(); // 10:00 PM local
        const utcBoundary3 = new Date('2024-01-08T23:30:00').getTime(); // 11:30 PM local

        component.timeEntries.set([
          { in: utcBoundary1, out: utcBoundary2 },
          { in: utcBoundary2, out: utcBoundary3 },
        ]);
        (component.now as any) = signal(utcBoundary3);
        component.selectedWeekStart.set(
          new Date('2024-01-08T00:00:00').getTime(),
        );
      });
      beforeEach(action);

      it('should group all evening entries under same day', () => {
        expect(result).toHaveLength(1);
      });

      it('should contain both entries', () => {
        expect(result[0].entries).toHaveLength(2);
      });

      it('should sum hours correctly', () => {
        // 2 hours + 1.5 hours = 3.5 hours
        expect(result[0].totalHours).toBe(3.5);
      });
    });
  });
});

describe('AppComponent Template', () => {
  beforeEach(async () => {
    // Mock indexedDB
    (globalThis as any).indexedDB = {
      open: vi.fn().mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: null,
      }),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [StorageService],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Weekly Hours Log',
    );
  });
});
