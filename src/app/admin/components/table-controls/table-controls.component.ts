import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-table-controls',
  templateUrl: './table-controls.component.html',
  styleUrls: ['./table-controls.component.scss'],
})
export class TableControlsComponent {
  @Input() page: number = 1;
  @Input() totalPages: number = 1;
  @Input() search: string = '';
  @Output() pageChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();

  nextPage() {
    if (this.page < this.totalPages) {
      this.pageChange.emit(this.page + 1);
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.pageChange.emit(this.page - 1);
    }
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchChange.emit(input.value);
  }
}
