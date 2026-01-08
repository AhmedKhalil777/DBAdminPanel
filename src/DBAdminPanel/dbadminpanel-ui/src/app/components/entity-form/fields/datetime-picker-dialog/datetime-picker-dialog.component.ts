import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface DateTimePickerData {
  date: Date | null;
  hours: number;
  minutes: number;
  propertyName: string;
}

@Component({
  selector: 'app-datetime-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule
  ],
  templateUrl: './datetime-picker-dialog.component.html',
  styleUrl: './datetime-picker-dialog.component.css'
})
export class DateTimePickerDialogComponent {
  dialogRef = inject(MatDialogRef<DateTimePickerDialogComponent>);
  data = inject<DateTimePickerData>(MAT_DIALOG_DATA);

  selectedDate: Date | null;
  hours: number;
  minutes: number;

  hoursList: number[] = Array.from({ length: 24 }, (_, i) => i);
  minutesList: number[] = Array.from({ length: 60 }, (_, i) => i);

  constructor() {
    this.selectedDate = this.data.date;
    this.hours = this.data.hours;
    this.minutes = this.data.minutes;
  }

  onConfirm() {
    if (this.selectedDate) {
      // Set the time on the date
      const resultDate = new Date(this.selectedDate);
      resultDate.setHours(this.hours);
      resultDate.setMinutes(this.minutes);
      resultDate.setSeconds(0);
      resultDate.setMilliseconds(0);
      this.dialogRef.close(resultDate);
    } else {
      this.dialogRef.close(null);
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  formatTime(value: number): string {
    return String(value).padStart(2, '0');
  }
}

