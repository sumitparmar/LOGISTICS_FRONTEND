import { Component, Input, Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent {
  @Output() rowClick = new EventEmitter<any>();

  @Input() columns: any[] = [];
  @Input() data: any[] = [];
  trackByFn(index: number, item: any): any {
    return item?.id || index;
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }
}
