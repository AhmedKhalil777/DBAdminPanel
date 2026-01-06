import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.css'
})
export class TextFieldComponent {
  @Input() formGroup!: FormGroup;
  @Input() property!: any;
  @Input() isEditMode = false;

  getControl(): FormControl {
    return this.formGroup.get(this.property.name) as FormControl;
  }

  getFieldType(): string {
    if (this.property.inputType === 'number') return 'number';
    if (this.property.inputType === 'email') return 'email';
    if (this.property.inputType === 'password') return 'password';
    return 'text';
  }

  getFieldIcon(): string {
    if (this.property.isKey) return 'vpn_key';
    if (this.property.inputType === 'email') return 'email';
    if (this.property.inputType === 'number') return 'numbers';
    return 'text_fields';
  }
}

