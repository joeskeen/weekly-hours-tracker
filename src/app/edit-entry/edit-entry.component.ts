import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimeEntry } from '../storage.service';

@Component({
  selector: 'app-edit-entry',
  imports: [FormsModule],
  templateUrl: './edit-entry.component.html',
  styleUrl: './edit-entry.component.scss',
})
export class EditEntryComponent {
  @Input() entry!: TimeEntry;
  @Output() save = new EventEmitter<TimeEntry>();
  @Output() cancel = new EventEmitter<void>();

  clockIn: string = '';
  clockOut: string = '';

  ngOnInit() {
    if (this.entry) {
      this.clockIn = this.entry.in
        ? this.formatDateTimeLocal(this.entry.in)
        : '';
      this.clockOut = this.entry.out
        ? this.formatDateTimeLocal(this.entry.out)
        : '';
    }
  }

  private formatDateTimeLocal(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  saveEditEntry() {
    const inTime = this.clockIn ? this.parseLocalDateTime(this.clockIn) : null;
    const outTime = this.clockOut
      ? this.parseLocalDateTime(this.clockOut)
      : null;
    if (!inTime || (outTime && outTime <= inTime)) {
      alert('Invalid times');
      return;
    }
    this.save.emit({ in: inTime, out: outTime });
  }

  private parseLocalDateTime(dateTimeString: string): number {
    // dateTimeString is in format "YYYY-MM-DDTHH:mm"
    const [datePart, timePart] = dateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create a date in local time
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date.getTime();
  }

  cancelEditEntry() {
    this.cancel.emit();
  }
}
