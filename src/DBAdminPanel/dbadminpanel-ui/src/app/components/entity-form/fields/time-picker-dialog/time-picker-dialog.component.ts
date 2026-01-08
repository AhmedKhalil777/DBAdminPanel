import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

export interface TimePickerData {
  hours: number;
  minutes: number;
}

@Component({
  selector: 'app-time-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './time-picker-dialog.component.html',
  styleUrl: './time-picker-dialog.component.css'
})
export class TimePickerDialogComponent {
  dialogRef = inject(MatDialogRef<TimePickerDialogComponent>);
  data = inject<TimePickerData>(MAT_DIALOG_DATA);

  hours: number;
  minutes: number;

  hoursList: number[] = Array.from({ length: 24 }, (_, i) => i);
  minutesList: number[] = Array.from({ length: 60 }, (_, i) => i);

  constructor() {
    this.hours = this.data.hours;
    this.minutes = this.data.minutes;
  }

  onConfirm() {
    this.dialogRef.close({ hours: this.hours, minutes: this.minutes });
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  formatTime(value: number): string {
    return String(value).padStart(2, '0');
  }
}


