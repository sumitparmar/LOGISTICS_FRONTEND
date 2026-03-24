import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent {
  @Input() columns: any[] = [];
  @Input() data: any[] = [];

  // Prevent unnecessary DOM re-render (important for performance)
  trackByFn(index: number, item: any): any {
    return item?.id || index;
  }
}
