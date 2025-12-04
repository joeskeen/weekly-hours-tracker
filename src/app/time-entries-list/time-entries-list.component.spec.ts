import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { TimeEntriesListComponent } from './time-entries-list.component';

describe('TimeEntriesListComponent Template', () => {
  let component: TimeEntriesListComponent;
  let fixture: ComponentFixture<TimeEntriesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeEntriesListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeEntriesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should render without errors', () => {
    expect(component).toBeTruthy();
  });
});
