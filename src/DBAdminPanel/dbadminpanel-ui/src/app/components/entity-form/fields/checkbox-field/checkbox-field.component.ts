import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-checkbox-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule
  ],
  templateUrl: './checkbox-field.component.html',
  styleUrl: './checkbox-field.component.css'
})
export class CheckboxFieldComponent {
  @Input() formGroup!: FormGroup;
  @Input() property!: any;

  getControl(): FormControl {
    return this.formGroup.get(this.property.name) as FormControl;
  }
}

