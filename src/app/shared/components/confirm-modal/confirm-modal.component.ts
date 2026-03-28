import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
  @Input() visible: boolean = false;
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure?';

  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';

  @Input() loading: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    if (!this.loading) {
      this.confirm.emit();
    }
  }

  onCancel() {
    if (!this.loading) {
      this.cancel.emit();
    }
  }
}
