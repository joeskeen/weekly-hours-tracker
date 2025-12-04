import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TimeEntry } from '../storage.service';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'tr[app-entry-item]',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './entry-item.component.html',
  styleUrl: './entry-item.component.scss',
})
export class EntryItemComponent {
  @Input() entry!: TimeEntry;
  @Input() now!: number;
  @Output() editEntry = new EventEmitter<TimeEntry>();
  @Output() deleteEntry = new EventEmitter<TimeEntry>();

  editEntryClicked() {
    this.editEntry.emit(this.entry);
  }
  deleteEntryClicked() {
    this.deleteEntry.emit(this.entry);
  }
}
