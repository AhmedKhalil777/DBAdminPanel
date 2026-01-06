import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TimePickerComponent } from '../time-picker/time-picker.component';

@Component({
  selector: 'app-datetime-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TimePickerComponent
  ],
  templateUrl: './datetime-field.component.html',
  styleUrl: './datetime-field.component.css'
})
export class DateTimeFieldComponent {
  @Input() formGroup!: FormGroup;
  @Input() property!: any;

  getDateControl(): FormControl {
    return this.formGroup.get(this.property.name + '_date') as FormControl;
  }

  getTimeControl(): FormControl {
    return this.formGroup.get(this.property.name + '_time') as FormControl;
  }
}

