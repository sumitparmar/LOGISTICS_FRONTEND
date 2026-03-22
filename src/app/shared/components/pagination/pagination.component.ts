import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent {
  @Input() total: number = 0;
  @Input() page: number = 1;
  @Input() limit: number = 5;

  @Input() limitOptions: number[] = [5, 10, 20, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(Math.ceil(this.total / this.limit), 1);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  next() {
    if (this.page < this.totalPages) {
      this.pageChange.emit(this.page + 1);
    }
  }

  prev() {
    if (this.page > 1) {
      this.pageChange.emit(this.page - 1);
    }
  }

  goTo(page: number) {
    if (page !== this.page) {
      this.pageChange.emit(page);
    }
  }

  changeLimit(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.limitChange.emit(value);
  }
}
