import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService, EntityMetadata } from '../../services/api.service';

@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDividerModule
  ],
  templateUrl: './entity-form.component.html',
  styleUrl: './entity-form.component.css'
})
export class EntityFormComponent implements OnInit {
  @Input() entityMetadata!: EntityMetadata;
  @Input() entity: any = null;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  formGroup!: FormGroup;
  isEditMode = false;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.isEditMode = this.entity !== null;
    // Initialize form with empty group first to prevent undefined errors
    this.formGroup = this.fb.group({});
    this.buildForm();
  }

  buildForm() {
    if (!this.entityMetadata || !this.entityMetadata.properties) {
      return;
    }
    
    const formControls: any = {};
    
    this.entityMetadata.properties.forEach(prop => {
      let value = this.isEditMode && this.entity 
        ? this.entity[prop.name] 
        : this.getDefaultValue(prop);
      
      // Convert DateTime strings to datetime-local format for input
      if (prop.inputType === 'datetime-local' && value) {
        value = this.formatDateTimeForInput(value);
      }
      // Convert Date strings to Date object for Material datepicker
      else if (prop.inputType === 'date' && value) {
        // Material datepicker expects a Date object, not a string
        const dateValue = new Date(value);
        value = !isNaN(dateValue.getTime()) ? dateValue : null;
      }
      
      const validators = prop.isKey && !this.isEditMode 
        ? [] 
        : prop.inputType === 'email' 
          ? [Validators.email] 
          : [];
      
      formControls[prop.name] = [value, validators];
    });

    this.formGroup = this.fb.group(formControls);
  }

  formatDateTimeForInput(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    
    // Format as YYYY-MM-DDTHH:mm:ss for datetime-local input
    // Use local time, not UTC, so the user sees their local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  formatDateForInput(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    
    // Format as YYYY-MM-DD for date input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  getDefaultValue(prop: any): any {
    if (prop.inputType === 'checkbox') return false;
    if (prop.inputType === 'number') return null;
    if (prop.inputType === 'date') return null;
    if (prop.inputType === 'datetime-local') return null;
    if (prop.inputType === 'time') return null;
    return '';
  }

  onSubmit() {
    if (this.formGroup.invalid) {
      return;
    }

    const data = { ...this.formGroup.value };
    
    // Convert values to proper types
    this.entityMetadata.properties.forEach(prop => {
      if (data[prop.name] !== null && data[prop.name] !== undefined && data[prop.name] !== '') {
        // Convert numeric string values to actual numbers
        if (prop.inputType === 'number' || prop.type?.toLowerCase().includes('decimal') || 
            prop.type?.toLowerCase().includes('float') || prop.type?.toLowerCase().includes('double') ||
            prop.type?.toLowerCase().includes('int') || prop.type?.toLowerCase().includes('long')) {
          const numValue = Number(data[prop.name]);
          if (!isNaN(numValue)) {
            data[prop.name] = numValue;
          }
        }
        // Convert datetime-local string to ISO string for DateTime fields
        else if (prop.inputType === 'datetime-local') {
          if (data[prop.name] && data[prop.name].trim() !== '') {
            // datetime-local format is YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
            // The value from the input is in local time
            const localDateTime = data[prop.name].trim();
            
            // Ensure the format includes seconds if missing
            let formattedDateTime = localDateTime;
            if (formattedDateTime.includes('T')) {
              const [datePart, timePart] = formattedDateTime.split('T');
              if (timePart && !timePart.includes(':')) {
                // Invalid format
                console.warn(`Invalid datetime format: ${localDateTime}`);
                data[prop.name] = null;
                return;
              }
              // Count colons in time part to determine if seconds are present
              const timeColons = (timePart.match(/:/g) || []).length;
              if (timeColons === 1) {
                // Only hours:minutes, add seconds
                formattedDateTime = `${datePart}T${timePart}:00`;
              }
            }
            
            // Parse the datetime-local string as local time
            // new Date() interprets the string in local time when it's in YYYY-MM-DDTHH:mm:ss format
            const dateValue = new Date(formattedDateTime);
            
            if (!isNaN(dateValue.getTime())) {
              // Convert to ISO string (UTC) for the API
              data[prop.name] = dateValue.toISOString();
            } else {
              console.error(`Failed to parse datetime: ${localDateTime} (formatted: ${formattedDateTime})`);
              data[prop.name] = null;
            }
          } else {
            data[prop.name] = null;
          }
        }
        // Convert Date object to ISO string for Date fields
        else if (prop.inputType === 'date') {
          if (data[prop.name] instanceof Date) {
            // Material datepicker returns a Date object
            const dateValue = data[prop.name] as Date;
            if (!isNaN(dateValue.getTime())) {
              // Set time to midnight UTC
              dateValue.setUTCHours(0, 0, 0, 0);
              data[prop.name] = dateValue.toISOString();
            }
          } else if (data[prop.name]) {
            // Fallback: if it's a string, try to parse it
            const dateValue = new Date(data[prop.name]);
            if (!isNaN(dateValue.getTime())) {
              dateValue.setUTCHours(0, 0, 0, 0);
              data[prop.name] = dateValue.toISOString();
            }
          } else {
            data[prop.name] = null;
          }
        }
        // Convert time string to proper format
        else if (prop.inputType === 'time') {
          // Keep as is or convert to proper time format if needed
          // Time-only fields are less common, so keeping the string value
        }
      } else if (prop.inputType === 'number' && (data[prop.name] === '' || data[prop.name] === null)) {
        // Set null for empty number fields
        data[prop.name] = null;
      } else if ((prop.inputType === 'date' || prop.inputType === 'datetime-local') && 
                 (data[prop.name] === '' || data[prop.name] === null)) {
        // Set null for empty date/datetime fields
        data[prop.name] = null;
      }
    });
    
    // Remove key property for create
    if (!this.isEditMode) {
      delete data[this.entityMetadata.keyProperty];
    }

    const observable = this.isEditMode
      ? this.apiService.updateEntity(
          this.entityMetadata.name,
          String(data[this.entityMetadata.keyProperty]),
          data
        )
      : this.apiService.createEntity(this.entityMetadata.name, data);

    observable.subscribe({
      next: () => {
        this.save.emit();
      },
      error: (error) => {
        console.error('Failed to save:', error);
        alert('Failed to save entity: ' + (error.error?.message || error.message));
      }
    });
  }

  onCancel() {
    this.cancel.emit();
  }

  getFieldType(prop: any): string {
    if (prop.inputType === 'number') return 'number';
    if (prop.inputType === 'email') return 'email';
    if (prop.inputType === 'password') return 'password';
    if (prop.inputType === 'date') return 'date';
    if (prop.inputType === 'datetime-local') return 'datetime-local';
    if (prop.inputType === 'time') return 'time';
    return 'text';
  }

  getFieldIcon(prop: any): string {
    if (prop.isKey) return 'vpn_key';
    if (prop.inputType === 'email') return 'email';
    if (prop.inputType === 'number') return 'numbers';
    if (prop.inputType === 'date') return 'calendar_today';
    if (prop.inputType === 'datetime-local') return 'event';
    if (prop.inputType === 'time') return 'schedule';
    return 'text_fields';
  }

}
