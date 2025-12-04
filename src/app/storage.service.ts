import { Injectable, InjectionToken, inject } from '@angular/core';

export const INDEXED_DB = new InjectionToken<IDBFactory>('IndexedDB', {
  providedIn: 'root',
  factory: () => indexedDB,
});

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private dbName = 'TimeTrackingSetup';
  private setupStore = 'setup';
  private timesheetStore = 'timesheet';
  private indexedDB = inject(INDEXED_DB);

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.indexedDB.open(this.dbName, 2);
      request.onupgradeneeded = function (e) {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('setup')) {
          db.createObjectStore('setup', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('timesheet')) {
          db.createObjectStore('timesheet', { keyPath: 'week' });
        }
      };
      request.onsuccess = function (e) {
        resolve((e.target as IDBOpenDBRequest).result);
      };
      request.onerror = function (e) {
        reject(e);
      };
    });
  }

  async saveSetup(setup: Setup): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.setupStore, 'readwrite');
      const store = tx.objectStore(this.setupStore);
      store.put({ id: 1, ...setup });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async loadSetup(): Promise<Setup> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.setupStore, 'readonly');
      const store = tx.objectStore(this.setupStore);
      const req = store.get(1);
      req.onsuccess = () => {
        const data = req.result;
        if (!data) {
          resolve(defaultSetup);
          return;
        }
        const validated = validateSetup(data);
        resolve(validated ?? defaultSetup);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveTimesheet(week: string, entries: TimeEntry[]): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.timesheetStore, 'readwrite');
      const store = tx.objectStore(this.timesheetStore);
      store.put({ week, entries });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async loadTimesheet(week: string): Promise<TimeEntry[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.timesheetStore, 'readonly');
      const store = tx.objectStore(this.timesheetStore);
      const req = store.get(week);
      req.onsuccess = () => {
        const data = req.result;
        if (!data || !data.entries) {
          resolve([]);
          return;
        }
        const validated = validateTimesheet(data.entries);
        resolve(validated ?? []);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx1 = db.transaction(this.setupStore, 'readwrite');
      tx1.objectStore(this.setupStore).clear();
      const tx2 = db.transaction(this.timesheetStore, 'readwrite');
      tx2.objectStore(this.timesheetStore).clear();
      tx2.oncomplete = () => resolve();
      tx2.onerror = () => reject(tx2.error);
    });
  }
}

export const daysOfWeek = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const;
export type DayOfWeek = (typeof daysOfWeek)[number];

export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
}

export interface TimeEntry {
  in: number; // timestamp
  out: number | null; // timestamp or null if incomplete
}

export interface Setup {
  targetHours: number;
  planned: Record<DayOfWeek, number>; // planned hours per day (Mon-Sun)
  weekStartsOn: DayOfWeek;
  theme: Theme;
}

const defaultSetup: Setup = {
  targetHours: 40,
  planned: {
    Mon: 8,
    Tue: 8,
    Wed: 8,
    Thu: 8,
    Fri: 8,
    Sat: 0,
    Sun: 0,
  },
  weekStartsOn: 'Sun',
  theme: {
    mode: 'light',
    primaryColor: '#317727',
  },
};

export function isSetupValid(setup: Setup): boolean {
  if (setup.targetHours <= 0) return false;
  const totalPlanned = Object.values(setup.planned).reduce(
    (sum, hours) => sum + hours,
    0,
  );
  if (totalPlanned > setup.targetHours) return false;
  return true;
}

export function validateSetup(data: any): Setup | null {
  if (!data || typeof data !== 'object') return null;

  // Check required fields exist and have correct types
  if (typeof data.targetHours !== 'number' || data.targetHours <= 0)
    return null;
  if (!data.planned || typeof data.planned !== 'object') return null;
  if (!data.weekStartsOn || typeof data.weekStartsOn !== 'string') return null;
  if (!data.theme || typeof data.theme !== 'object') return null;

  // Validate theme
  if (data.theme.mode !== 'light' && data.theme.mode !== 'dark') return null;
  if (typeof data.theme.primaryColor !== 'string') return null;

  // Validate weekStartsOn is a valid day
  if (!daysOfWeek.includes(data.weekStartsOn as DayOfWeek)) return null;

  // Validate planned hours for all days
  for (const day of daysOfWeek) {
    if (typeof data.planned[day] !== 'number' || data.planned[day] < 0)
      return null;
  }

  const setup = data as Setup;
  return isSetupValid(setup) ? setup : null;
}

export function validateTimeEntry(data: any): TimeEntry | null {
  if (!data || typeof data !== 'object') return null;
  if (typeof data.in !== 'number' || data.in <= 0) return null;
  if (
    data.out !== null &&
    (typeof data.out !== 'number' || data.out <= data.in)
  )
    return null;
  return data as TimeEntry;
}

export function validateTimesheet(data: any): TimeEntry[] | null {
  if (!Array.isArray(data)) return null;
  const entries: TimeEntry[] = [];
  for (const item of data) {
    const entry = validateTimeEntry(item);
    if (!entry) return null; // Invalid entry found
    entries.push(entry);
  }
  return entries;
}
