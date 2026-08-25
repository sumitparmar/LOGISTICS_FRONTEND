import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { FeedbackPageComponent } from './feedback-page.component';

const routes: Routes = [{ path: '', component: FeedbackPageComponent }];

@NgModule({
  declarations: [FeedbackPageComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, RouterModule.forChild(routes)],
})
export class FeedbackModule {}
