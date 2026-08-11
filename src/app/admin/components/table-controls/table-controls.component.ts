import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-table-controls',
  templateUrl: './table-controls.component.html',
  styleUrls: ['./table-controls.component.scss'],
})
export class TableControlsComponent {
  @Input() page: number = 1;
  @Input() totalPages: number = 1;
  @Input() total: number = 0;
  @Input() limit: number = 10;
  @Input() limitOptions: number[] = [5, 10, 20, 50];
  @Input() showPageSize: boolean = true;
  @Input() search: string = '';
  @Output() pageChange = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchChange.emit(input.value);
  }

  onLimitChange(limit: number) {
    this.limitChange.emit(limit);
  }
}
