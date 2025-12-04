import { Component, output, input, computed, signal, OutputEmitterRef } from '@angular/core';
import { Field, form, required, validate, ValidationError } from '@angular/forms/signals';

@Component({
  selector: 'app-time-input',
  standalone: true,
  imports: [Field],
  templateUrl: './time-input.component.html',
  styleUrl: './time-input.component.scss',
})
export class TimeInputComponent {
  now = input.required<number>();
  readonly timeInputModel = signal<string>('');
  readonly timeForm = form(this.timeInputModel, (form) => {
    required(form);
    validate(form, ({ value }) => validateTimeInput(value(), this.now()));
  });
  readonly clockIn = output<Date>();
  readonly clockOut = output<Date>();

  readonly time = computed<Date | null>(() => parseTimeValue(this.timeInputModel()));
  readonly nonRequiredErrors = computed(() =>
    this.timeForm()
      .errors()
      .filter((e: any) => e.kind !== 'required'),
  );

  punch(output: OutputEmitterRef<Date>) {
    const time = this.time();
    if (time === null || this.timeForm().invalid()) return;
    output.emit(time);
    this.timeInputModel.set('');
  }
}

export function validateTimeInput(value: string, now: number): ValidationError | null {
  if (!value) return null;
  const asDate = new Date(value);
  if (isNaN(asDate.getTime())) return { kind: 'invalid', message: 'Invalid date/time' };
  // Round now down to seconds since datetime-local doesn't include milliseconds
  const nowInSeconds = Math.floor(now / 1000) * 1000;
  // Allow up to 1 minute in the future
  const oneMinuteFromNow = nowInSeconds + 60 * 1000;
  if (asDate.getTime() > oneMinuteFromNow) {
    return { kind: 'future', message: 'Time cannot be in the future' };
  }
  return null;
}

export function parseTimeValue(value: string): Date | null {
  if (!value) return null;
  const asDate = new Date(value);
  return isNaN(asDate.getTime()) ? null : asDate;
}
