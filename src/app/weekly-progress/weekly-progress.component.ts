import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-weekly-progress',
  templateUrl: './weekly-progress.component.html',
  styleUrl: './weekly-progress.component.scss',
  imports: [DecimalPipe],
})
export class WeeklyProgressComponent {
  readonly completedHours = input.required<number>();
  readonly remainingHours = input.required<number>();
  readonly targetHours = input.required<number>();

  readonly progressPercent = computed(() =>
    Math.min(100, Math.round((this.completedHours() / this.targetHours()) * 100))
  );
}
