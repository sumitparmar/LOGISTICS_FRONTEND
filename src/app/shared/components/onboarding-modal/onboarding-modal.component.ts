import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-onboarding-modal',
  templateUrl: './onboarding-modal.component.html',
  styleUrls: ['./onboarding-modal.component.scss'],
})
export class OnboardingModalComponent {
  @Output() selected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  choose(mode: string) {
    this.selected.emit(mode);
  }

  close() {
    this.closed.emit();
  }
}
