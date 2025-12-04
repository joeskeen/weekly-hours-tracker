import { Component, Input, Output, EventEmitter } from '@angular/core';
import { EntryItemComponent } from '../entry-item/entry-item.component';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-time-entries-list',
  imports: [EntryItemComponent, DecimalPipe],
  templateUrl: './time-entries-list.component.html',
  styleUrl: './time-entries-list.component.scss',
})
export class TimeEntriesListComponent {
  @Input() groupedEntries: any[] = [];
  @Input() now!: number;
  @Output() editEntry = new EventEmitter<any>();
  @Output() deleteEntry = new EventEmitter<any>();

  onEditEntry(entry: any) {
    this.editEntry.emit(entry);
  }
  onDeleteEntry(entry: any) {
    this.deleteEntry.emit(entry);
  }
}
