import { Component, computed, input, model, output } from '@angular/core';
import { DayOfWeek, Setup, daysOfWeek } from '../storage.service';
import { Field, form, max, min, required, validate } from '@angular/forms/signals';

@Component({
  selector: 'app-setup',
  imports: [Field],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
})
export class SetupComponent {
  readonly setup = model.required<Setup>();
  readonly saveSetup = output<Setup>();
  readonly setupForm = form(this.setup, (form) => {
    required(form.targetHours);

    Object.values(form.planned).forEach((field) => {
      min(field, 0);
      max(field, 24);
    });

    validate(form, ({ value }) => {
      const model = value();
      const totalPlanned = Object.values(model.planned).reduce((sum, hours) => sum + hours, 0);
      if (totalPlanned > model.targetHours) {
        return { kind: 'plannedExceedsTarget', message: 'Total planned hours exceed target hours' };
      }
      return null;
    });
  });
  readonly daysOfWeek = computed<DayOfWeek[]>(() => {
    const startIndex = daysOfWeek.indexOf(this.setup().weekStartsOn);
    return [...daysOfWeek.slice(startIndex), ...daysOfWeek.slice(0, startIndex)] as DayOfWeek[];
  });
}
