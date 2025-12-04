import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateSetup,
  validateTimeEntry,
  validateTimesheet,
  isSetupValid,
  type Setup,
  type TimeEntry,
  StorageService,
  INDEXED_DB,
} from './storage.service';
import { Injector, runInInjectionContext } from '@angular/core';
import { IDBFactory } from 'fake-indexeddb';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    const injector = Injector.create({
      providers: [{ provide: INDEXED_DB, useValue: new IDBFactory() }],
    });
    runInInjectionContext(injector, () => {
      storageService = new StorageService();
    });
  });

  describe('saveSetup', () => {
    let setup: Setup = {} as Setup;
    let result: Promise<void>;
    const action = () => (result = storageService.saveSetup(setup));
    beforeEach(() => {
      setup = {
        targetHours: 40,
        planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
        weekStartsOn: 'Sun',
        theme: { mode: 'light', primaryColor: '#317727' },
      };
    });
    describe('when saving a valid setup', () => {
      beforeEach(() => Promise.all([action()]));
      it('should complete without error', async () => {
        await expect(result).resolves.toBeUndefined();
      });
    });
  });
  describe('loadSetup', () => {
    let result: Promise<Setup>;
    const action = () => (result = storageService.loadSetup());

    describe('when no setup exists', () => {
      beforeEach(() => Promise.all([action()]));
      it('should return default setup', async () => {
        const setup = await result;
        expect(setup).toEqual({
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        });
      });
    });

    describe('when setup exists', () => {
      let savedSetup: Setup;
      beforeEach(async () => {
        savedSetup = {
          targetHours: 35,
          planned: { Mon: 7, Tue: 7, Wed: 7, Thu: 7, Fri: 7, Sat: 0, Sun: 0 },
          weekStartsOn: 'Mon',
          theme: { mode: 'dark', primaryColor: '#FF5733' },
        };
        await storageService.saveSetup(savedSetup);
      });
      beforeEach(() => Promise.all([action()]));
      it('should return the saved setup', async () => {
        const setup = await result;
        expect(setup).toMatchObject(savedSetup);
      });
    });
  });
  describe('saveTimesheet', () => {
    let week = '';
    let timesheet: TimeEntry[] = [];
    let result: Promise<void>;
    const action = () =>
      (result = storageService.saveTimesheet(week, timesheet));

    describe('when saving a valid timesheet', () => {
      beforeEach(() => {
        week = '2024-W01';
        timesheet = [
          { in: 1000, out: 2000 },
          { in: 3000, out: null },
        ];
      });
      beforeEach(() => Promise.all([action()]));
      it('should complete without error', async () => {
        await expect(result).resolves.toBeUndefined();
      });
    });

    describe('when saving an empty timesheet', () => {
      beforeEach(() => {
        week = '2024-W02';
        timesheet = [];
      });
      beforeEach(() => Promise.all([action()]));
      it('should complete without error', async () => {
        await expect(result).resolves.toBeUndefined();
      });
    });
  });
  describe('loadTimesheet', () => {
    let week = '';
    let result: Promise<TimeEntry[]>;
    const action = () => (result = storageService.loadTimesheet(week));

    describe('when no timesheet exists for the week', () => {
      beforeEach(() => {
        week = '2024-W99';
      });
      beforeEach(() => Promise.all([action()]));
      it('should return empty array', async () => {
        await expect(result).resolves.toEqual([]);
      });
    });

    describe('when timesheet exists for the week', () => {
      let savedTimesheet: TimeEntry[];
      beforeEach(async () => {
        week = '2024-W10';
        savedTimesheet = [
          { in: 1000, out: 2000 },
          { in: 3000, out: 4000 },
          { in: 5000, out: null },
        ];
        await storageService.saveTimesheet(week, savedTimesheet);
      });
      beforeEach(() => Promise.all([action()]));
      it('should return the saved timesheet', async () => {
        await expect(result).resolves.toEqual(savedTimesheet);
      });
    });
  });
  describe('clearAll', () => {
    let result: Promise<void>;
    const action = () => (result = storageService.clearAll());

    describe('when clearing all data', () => {
      beforeEach(async () => {
        // Save some data first
        const setup: Setup = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
        await storageService.saveSetup(setup);
        await storageService.saveTimesheet('2024-W01', [
          { in: 1000, out: 2000 },
        ]);
      });
      beforeEach(() => Promise.all([action()]));
      it('should complete without error', async () => {
        await expect(result).resolves.toBeUndefined();
      });
      it('should clear setup data', async () => {
        await result;
        const loadedSetup = await storageService.loadSetup();
        // Should return default setup after clearing
        expect(loadedSetup.targetHours).toBe(40);
      });
      it('should clear timesheet data', async () => {
        await result;
        const loadedTimesheet = await storageService.loadTimesheet('2024-W01');
        expect(loadedTimesheet).toEqual([]);
      });
    });
  });
});

describe('Storage Validation Functions', () => {
  describe('isSetupValid', () => {
    let setup: Setup;
    let result: boolean;
    const action = () => (result = isSetupValid(setup));

    describe('when targetHours is positive and totalPlanned <= targetHours', () => {
      beforeEach(() => {
        setup = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return true', () => expect(result).toBe(true));
    });

    describe('when targetHours is zero', () => {
      beforeEach(() => {
        setup = {
          targetHours: 0,
          planned: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return false', () => expect(result).toBe(false));
    });

    describe('when targetHours is negative', () => {
      beforeEach(() => {
        setup = {
          targetHours: -10,
          planned: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return false', () => expect(result).toBe(false));
    });

    describe('when totalPlanned exceeds targetHours', () => {
      beforeEach(() => {
        setup = {
          targetHours: 40,
          planned: {
            Mon: 10,
            Tue: 10,
            Wed: 10,
            Thu: 10,
            Fri: 10,
            Sat: 5,
            Sun: 5,
          },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return false', () => expect(result).toBe(false));
    });

    describe('when totalPlanned equals targetHours', () => {
      beforeEach(() => {
        setup = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return true', () => expect(result).toBe(true));
    });
  });

  describe('validateSetup', () => {
    let data: any;
    let result: Setup | null;
    const action = () => (result = validateSetup(data));

    describe('when data is null', () => {
      beforeEach(() => (data = null));
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when data is not an object', () => {
      beforeEach(() => (data = 'not an object'));
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when targetHours is missing', () => {
      beforeEach(() => {
        data = {
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when targetHours is not a number', () => {
      beforeEach(() => {
        data = {
          targetHours: '40',
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when targetHours is zero', () => {
      beforeEach(() => {
        data = {
          targetHours: 0,
          planned: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when planned is missing', () => {
      beforeEach(() => {
        data = {
          targetHours: 40,
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when planned has invalid day hours', () => {
      beforeEach(() => {
        data = {
          targetHours: 40,
          planned: {
            Mon: 'eight',
            Tue: 8,
            Wed: 8,
            Thu: 8,
            Fri: 8,
            Sat: 0,
            Sun: 0,
          },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when planned has negative hours', () => {
      beforeEach(() => {
        data = {
          targetHours: 40,
          planned: { Mon: -8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when weekStartsOn is invalid', () => {
      beforeEach(() => {
        data = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Monday',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when theme mode is invalid', () => {
      beforeEach(() => {
        data = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'auto', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when theme primaryColor is missing', () => {
      beforeEach(() => {
        data = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when totalPlanned exceeds targetHours', () => {
      beforeEach(() => {
        data = {
          targetHours: 40,
          planned: {
            Mon: 10,
            Tue: 10,
            Wed: 10,
            Thu: 10,
            Fri: 10,
            Sat: 5,
            Sun: 5,
          },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when data is valid', () => {
      beforeEach(() => {
        data = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'light', primaryColor: '#317727' },
        };
      });
      beforeEach(action);
      it('should return the setup object', () => expect(result).toEqual(data));
    });

    describe('when data has extra properties', () => {
      beforeEach(() => {
        data = {
          targetHours: 40,
          planned: { Mon: 8, Tue: 8, Wed: 8, Thu: 8, Fri: 8, Sat: 0, Sun: 0 },
          weekStartsOn: 'Sun',
          theme: { mode: 'dark', primaryColor: '#FF5733' },
          extraProp: 'ignored',
        };
      });
      beforeEach(action);
      it('should return the setup object with extra properties', () =>
        expect(result).toEqual(data));
    });
  });

  describe('validateTimeEntry', () => {
    let data: any;
    let result: TimeEntry | null;
    const action = () => (result = validateTimeEntry(data));

    describe('when data is null', () => {
      beforeEach(() => (data = null));
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when data is not an object', () => {
      beforeEach(() => (data = 'not an object'));
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when in is missing', () => {
      beforeEach(() => {
        data = { out: Date.now() };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when in is not a number', () => {
      beforeEach(() => {
        data = { in: '2024-01-15', out: null };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when in is zero', () => {
      beforeEach(() => {
        data = { in: 0, out: null };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when in is negative', () => {
      beforeEach(() => {
        data = { in: -1000, out: null };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when out is not a number and not null', () => {
      beforeEach(() => {
        data = { in: Date.now(), out: '2024-01-15' };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when out is less than in', () => {
      beforeEach(() => {
        data = { in: 2000, out: 1000 };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when out equals in', () => {
      beforeEach(() => {
        data = { in: 1000, out: 1000 };
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when entry is valid with out as null', () => {
      beforeEach(() => {
        data = { in: Date.now(), out: null };
      });
      beforeEach(action);
      it('should return the entry', () => expect(result).toEqual(data));
    });

    describe('when entry is valid with out timestamp', () => {
      beforeEach(() => {
        data = { in: 1000, out: 2000 };
      });
      beforeEach(action);
      it('should return the entry', () => expect(result).toEqual(data));
    });
  });

  describe('validateTimesheet', () => {
    let data: any;
    let result: TimeEntry[] | null;
    const action = () => (result = validateTimesheet(data));

    describe('when data is null', () => {
      beforeEach(() => (data = null));
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when data is not an array', () => {
      beforeEach(() => (data = { entries: [] }));
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when array is empty', () => {
      beforeEach(() => (data = []));
      beforeEach(action);
      it('should return empty array', () => expect(result).toEqual([]));
    });

    describe('when array contains invalid entry', () => {
      beforeEach(() => {
        data = [
          { in: 1000, out: 2000 },
          { in: 'invalid', out: null },
          { in: 3000, out: 4000 },
        ];
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when array contains entry with out <= in', () => {
      beforeEach(() => {
        data = [
          { in: 1000, out: 2000 },
          { in: 3000, out: 3000 },
        ];
      });
      beforeEach(action);
      it('should return null', () => expect(result).toBeNull());
    });

    describe('when all entries are valid', () => {
      beforeEach(() => {
        data = [
          { in: 1000, out: 2000 },
          { in: 3000, out: null },
          { in: 4000, out: 5000 },
        ];
      });
      beforeEach(action);
      it('should return the entries array', () => expect(result).toEqual(data));
    });

    describe('when array has single valid entry', () => {
      beforeEach(() => {
        data = [{ in: 1000, out: 2000 }];
      });
      beforeEach(action);
      it('should return the entries array', () => expect(result).toEqual(data));
    });
  });
});
