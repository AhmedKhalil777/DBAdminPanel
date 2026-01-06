import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-time-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './time-field.component.html',
  styleUrl: './time-field.component.css'
})
export class TimeFieldComponent {
  @Input() formGroup!: FormGroup;
  @Input() property!: any;

  getControl(): FormControl {
    return this.formGroup.get(this.property.name) as FormControl;
  }
}

