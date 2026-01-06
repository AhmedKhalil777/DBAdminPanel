import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TimePickerDialogComponent } from '../time-picker-dialog/time-picker-dialog.component';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.css'
})
export class TimePickerComponent {
  @Input() label = 'Time';
  @Input() placeholder = 'HH:mm';
  
  private _formControl!: FormControl;
  
  @Input() 
  set formControl(control: AbstractControl) {
    this._formControl = control as FormControl;
  }
  
  get formControl(): FormControl {
    return this._formControl;
  }
  
  private dialog = inject(MatDialog);

  openTimePicker(): void {
    if (this.formControl.disabled) return;
    
    const currentValue = this.formControl.value || '';
    const currentTime = currentValue ? currentValue.split(':') : ['00', '00'];
    
    const dialogRef = this.dialog.open(TimePickerDialogComponent, {
      width: '300px',
      data: {
        hours: parseInt(currentTime[0]) || 0,
        minutes: parseInt(currentTime[1]) || 0
      }
    });

    dialogRef.afterClosed().subscribe((result: { hours: number; minutes: number } | null) => {
      if (result) {
        const timeString = `${String(result.hours).padStart(2, '0')}:${String(result.minutes).padStart(2, '0')}`;
        this.formControl.setValue(timeString);
        this.formControl.markAsTouched();
      }
    });
  }

  getDisplayValue(): string {
    return this.formControl.value || '';
  }
}

