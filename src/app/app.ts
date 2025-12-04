import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  TimeEntry,
  Setup,
  StorageService,
  daysOfWeek,
} from './storage.service';
import { numberToDayOfWeek } from './week-utils';
import { SetupComponent } from './setup/setup.component';
import { WeeklyProgressComponent } from './weekly-progress/weekly-progress.component';
import { TimeEntriesListComponent } from './time-entries-list/time-entries-list.component';
import { EditEntryComponent } from './edit-entry/edit-entry.component';
import { interval, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { TimeInputComponent } from './time-input/time-input.component';
import { ThemeDirective } from './theme.directive';
import { SetupService } from './setup.service';
import { InstallPromptComponent } from './install-prompt/install-prompt.component';

function getStartOfWeek(ts: number, weekStartsOn: number): number {
  const d = new Date(ts);
  const day = d.getDay();
  // Calculate difference to week start
  const diff =
    d.getDate() - day + (day < weekStartsOn ? weekStartsOn - 7 : weekStartsOn);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

@Component({
  selector: 'app-root',
  imports: [
    SetupComponent,
    WeeklyProgressComponent,
    TimeEntriesListComponent,
    EditEntryComponent,
    TimeInputComponent,
    InstallPromptComponent,
  ],
  hostDirectives: [ThemeDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit {
  @ViewChild('exportBtn') exportBtnRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('exportDropdown') exportDropdownRef?: ElementRef<HTMLDivElement>;

  private readonly setupService = inject(SetupService);

  // Get last clock-in timestamp for current week
  readonly lastClockIn = computed(() => {
    const entries = this.weekEntries();
    if (!entries.length) return null;
    const last = [...entries].reverse().find((e) => e.in && !e.out);
    return last ? last.in : null;
  });
  readonly weekLabel = computed(() => {
    const d = new Date(this.selectedWeekStart());
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });
  readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);

  readonly title = signal('Weekly Hours Log');
  readonly timer$ = interval(60_000);
  readonly now$ = this.timer$.pipe(map(() => Date.now()));
  readonly now = toSignal(this.now$, { initialValue: Date.now() });

  readonly setup = this.setupService.setup;
  readonly showSetup = signal(false);
  readonly loading = signal(true);
  readonly timeEntries = signal<TimeEntry[]>([]);

  // Week selection state
  readonly selectedWeekStart = signal<number>(0);
  readonly previousWeekStart = computed(() => {
    const prev = new Date(this.selectedWeekStart());
    prev.setDate(prev.getDate() - 7);
    return getStartOfWeek(prev.getTime(), this.getWeekStartsOn());
  });
  readonly nextWeekStart = computed(() => {
    const next = new Date(this.selectedWeekStart());
    next.setDate(next.getDate() + 7);
    return getStartOfWeek(next.getTime(), this.getWeekStartsOn());
  });
  readonly canGoToNextWeek = computed(() => {
    const nowWeekStart = getStartOfWeek(this.now(), this.getWeekStartsOn());
    return this.nextWeekStart() <= nowWeekStart;
  });

  getWeekStartsOn(): number {
    const setup = this.setup();
    if (!setup) return 0; // Default to Sunday
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
      setup.weekStartsOn,
    );
  }

  getWeekId(ts: number): string {
    // ISO week format: YYYY-Www
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum =
      1 +
      Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      );
    return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  }

  // Filter entries for selected week
  readonly weekEntries = computed(() => {
    const start = this.selectedWeekStart();
    const end = start + 7 * 24 * 3600 * 1000;
    return this.timeEntries().filter(
      (entry) => entry.in >= start && entry.in < end,
    );
  });

  readonly completedHours = computed(() => {
    return this.weekEntries().reduce(
      (sum, entry) =>
        sum +
        (entry.out && entry.in
          ? (entry.out - entry.in) / 3600000
          : entry.in && !entry.out
            ? (this.now() - entry.in) / 3600000
            : 0),
      0,
    );
  });
  readonly remainingHours = computed(() => {
    const setup = this.setup();
    if (!setup) return undefined;
    return Math.max(0, setup.targetHours - this.completedHours());
  });

  readonly recommendedClockOut = computed(() => {
    const setup = this.setup();
    const lastIn = this.lastClockIn();
    if (!setup || !lastIn) return null;

    // Get today's date and entries
    const now = this.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 3600 * 1000;
    const todayEntries = this.weekEntries().filter(
      (e) => e.in >= todayStart && e.in < todayEnd,
    );

    // Calculate hours worked today (completed entries only, not current session)
    let hoursWorkedToday = 0;
    todayEntries.forEach((entry) => {
      if (entry.out) {
        hoursWorkedToday += (entry.out - entry.in) / 3600000;
      } else {
        hoursWorkedToday += (now - entry.in) / 3600000;
      }
    });

    // Find remaining planned work days in the week (including today)
    const plannedDays = Object.entries(setup.planned)
      .filter(([day, hrs]) => hrs > 0)
      .map(([day]) => day);
    const todayName = numberToDayOfWeek(new Date(now).getDay());
    const weekStart = this.selectedWeekStart();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart + i * 24 * 3600 * 1000);
      return numberToDayOfWeek(d.getDay());
    });
    const todayIdx = weekDays.indexOf(todayName);
    const remainingWorkDays = weekDays
      .slice(todayIdx)
      .filter((d) => plannedDays.includes(d));

    if (remainingWorkDays.length === 0) return null;

    // Calculate total hours completed this week (includes current session)
    const completedHours = this.completedHours();
    const targetHours = setup.targetHours;
    const plannedForToday =
      setup.planned[todayName as keyof typeof setup.planned];

    // Calculate hours completed before today
    const hoursCompletedBeforeToday = completedHours - hoursWorkedToday;

    // Calculate planned hours for days before today
    let plannedBeforeToday = 0;
    for (let i = 0; i < todayIdx; i++) {
      const dayName = weekDays[i];
      if (plannedDays.includes(dayName)) {
        plannedBeforeToday +=
          setup.planned[dayName as keyof typeof setup.planned];
      }
    }

    // Calculate deficit or surplus from previous days
    // Positive delta means behind schedule (need to catch up)
    // Negative delta means ahead of schedule (can ease off)
    const deltaFromPreviousDays =
      plannedBeforeToday - hoursCompletedBeforeToday;

    // Distribute the deficit/surplus across remaining work days
    // If behind (positive delta), add more hours per day
    // If ahead (negative delta), subtract hours per day
    const adjustmentPerDay = deltaFromPreviousDays / remainingWorkDays.length;

    // Today's target: planned + adjustment
    const todayTargetTotal = plannedForToday + adjustmentPerDay;

    // How much more to work today
    const todayRemaining = todayTargetTotal - hoursWorkedToday;

    if (todayRemaining <= 0) return null;

    // Recommend clock out time: now + todayRemaining
    const out = new Date(now + todayRemaining * 3600000);
    return out.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  });

  // Modal state for editing
  readonly editingIndex = signal<number | null>(null);
  readonly editingEntry = computed(() => {
    const idx = this.editingIndex();
    return idx !== null ? { ...this.timeEntries()[idx] } : null;
  });

  // Group by day, return array of { dayLabel, totalHours, entries } for selected week
  readonly groupedEntries = computed(() => {
    const groups: {
      [key: string]: {
        dayLabel: string;
        totalHours: number;
        entries: TimeEntry[];
      };
    } = {};
    this.weekEntries().forEach((entry) => {
      const dateObj = new Date(entry.in);
      // Use local date format (YYYY-MM-DD) for grouping to avoid UTC mismatches
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dayKey = `${year}-${month}-${day}`;
      if (!groups[dayKey]) {
        groups[dayKey] = {
          dayLabel: dateObj.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          totalHours: 0,
          entries: [],
        };
      }
      let hours = entry.out
        ? (entry.out - entry.in) / 3600000
        : (this.now() - entry.in) / 3600000;
      groups[dayKey].totalHours += hours;
      groups[dayKey].entries.push(entry);
    });
    return Object.values(groups);
  });

  constructor() {
    // Auto-save when entries change for current week
    effect(() => {
      const weekStart = this.selectedWeekStart();
      if (weekStart === 0) return; // Skip initial value before ngOnInit
      const weekId = this.getWeekId(weekStart);
      const entries = this.timeEntries();
      this.storage.saveTimesheet(weekId, entries);
    });
  }

  async ngOnInit() {
    // Load setup and entries
    const setup = await this.setupService.loadSetup();
    this.showSetup.set(!!setup);
    // Set initial week start
    const weekStartsOn = this.getWeekStartsOn();
    const initialWeekStart = getStartOfWeek(this.now(), weekStartsOn);
    this.selectedWeekStart.set(initialWeekStart);
    // Load entries for current week
    const weekId = this.getWeekId(initialWeekStart);
    const timesheet = await this.storage.loadTimesheet(weekId);
    this.timeEntries.set(timesheet ?? []);
    this.loading.set(false);
  }

  async previousWeek() {
    this.selectedWeekStart.set(this.previousWeekStart());
    await this.loadWeekEntries();
  }

  async nextWeek() {
    this.selectedWeekStart.set(this.nextWeekStart());
    await this.loadWeekEntries();
  }

  private async loadWeekEntries() {
    const weekId = this.getWeekId(this.selectedWeekStart());
    const entries = await this.storage.loadTimesheet(weekId);
    this.timeEntries.set(entries ?? []);
  }

  // Event handlers for edit/delete
  onEditEntry(entry: TimeEntry) {
    const index = this.timeEntries().findIndex((e) => e === entry);
    if (index !== -1) {
      this.editingIndex.set(index);
    }
  }
  onDeleteEntry(entry: TimeEntry) {
    this.timeEntries.update((entries) => entries.filter((e) => e !== entry));
  }

  onSaveEditEntry(updated: TimeEntry) {
    if (this.editingIndex() !== null) {
      const idx = this.editingIndex()!;
      this.timeEntries.update((entries) => {
        const newEntries = [...entries];
        newEntries[idx] = updated;
        return newEntries;
      });
      this.editingIndex.set(null);
    }
  }

  onCancelEditEntry() {
    this.editingIndex.set(null);
  }

  async onSaveSetup(setup: Setup) {
    await this.setupService.saveSetup(setup);
    this.showSetup.set(true);
  }

  toggleSetup() {
    this.showSetup.update((v) => !v);
  }

  // Simple export menu toggle
  readonly exportMenuOpen = signal(false);
  toggleExportMenu() {
    this.exportMenuOpen.update((v) => !v);
  }

  onExportButtonClick() {
    const opening = !this.exportMenuOpen();
    this.exportMenuOpen.set(opening);
    if (opening) {
      // Focus first item after render
      setTimeout(() => {
        const menu = this.exportDropdownRef?.nativeElement;
        const items = menu?.querySelectorAll<HTMLButtonElement>('.export-item');
        items && items[0]?.focus();
      });
    }
  }

  onExportButtonKeydown(event: KeyboardEvent) {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      this.onExportButtonClick();
    }
  }

  onExportMenuKeydown(event: KeyboardEvent) {
    const menu = this.exportDropdownRef?.nativeElement;
    const items = menu?.querySelectorAll<HTMLButtonElement>('.export-item');
    if (!items || items.length === 0) return;
    const currentIndex = Array.from(items).indexOf(
      this.document.activeElement as HTMLButtonElement,
    );
    switch (event.key) {
      case 'Escape':
        this.exportMenuOpen.set(false);
        this.exportBtnRef?.nativeElement?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        const next = items[(currentIndex + 1) % items.length];
        next?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prev = items[(currentIndex - 1 + items.length) % items.length];
        prev?.focus();
        break;
      case 'Home':
        event.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.exportMenuOpen()) return;
    const menu = this.exportDropdownRef?.nativeElement;
    const btn = this.exportBtnRef?.nativeElement;
    const target = event.target as Node;
    if (menu && btn && !menu.contains(target) && !btn.contains(target)) {
      this.exportMenuOpen.set(false);
    }
  }

  onClockIn(time: Date) {
    const now = this.now();
    if (time.getTime() > now) {
      throw new Error('Cannot clock in for a future time.');
    }
    this.timeEntries.update((entries) => [
      ...entries,
      { in: time.getTime(), out: null },
    ]);
    // Save handled by effect
  }

  onClockOut(time: Date) {
    this.timeEntries.update((entries) => {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && !lastEntry.out) {
        const updatedEntry = { ...lastEntry, out: time.getTime() };
        return [...entries.slice(0, -1), updatedEntry];
      } else {
        throw new Error('No active clock-in entry found.');
      }
    });
    // Save handled by effect
  }

  // Export current week's entries as CSV
  exportWeekCSV() {
    this.exportMenuOpen.set(false);
    const rows = [
      ['Date', 'Clock In', 'Clock Out', 'Duration (hours)'],
      ...this.weekEntries().map((e) => {
        const inDate = new Date(e.in);
        const outDate = e.out ? new Date(e.out) : null;
        const dateStr = inDate.toLocaleDateString();
        const inStr = inDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const outStr = outDate
          ? outDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';
        const durationHours =
          (e.out ? e.out - e.in : this.now() - e.in) / 3600000;
        return [dateStr, inStr, outStr, durationHours.toFixed(2)];
      }),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((v) =>
            typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v),
          )
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = this.document.createElement('a');
    const weekStart = new Date(this.selectedWeekStart());
    const label = weekStart.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    a.href = url;
    a.download = `time-entries-${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export current week's entries as JSON
  exportWeekJSON() {
    this.exportMenuOpen.set(false);
    const data = this.weekEntries().map((e) => ({ in: e.in, out: e.out }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = this.document.createElement('a');
    const weekStart = new Date(this.selectedWeekStart());
    const label = weekStart.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    a.href = url;
    a.download = `time-entries-${label}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
