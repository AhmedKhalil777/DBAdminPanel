import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface DatePickerData {
  date: Date | null;
  propertyName: string;
}

@Component({
  selector: 'app-date-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule
  ],
  templateUrl: './date-picker-dialog.component.html',
  styleUrl: './date-picker-dialog.component.css'
})
export class DatePickerDialogComponent {
  dialogRef = inject(MatDialogRef<DatePickerDialogComponent>);
  data = inject<DatePickerData>(MAT_DIALOG_DATA);

  selectedDate: Date | null;

  constructor() {
    this.selectedDate = this.data.date;
  }

  onConfirm() {
    this.dialogRef.close(this.selectedDate);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}

