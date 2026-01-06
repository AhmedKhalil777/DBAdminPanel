import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService, EntityMetadata } from '../../services/api.service';
import { TextFieldComponent } from './fields/text-field/text-field.component';
import { DateFieldComponent } from './fields/date-field/date-field.component';
import { DateTimeFieldComponent } from './fields/datetime-field/datetime-field.component';
import { TimeFieldComponent } from './fields/time-field/time-field.component';
import { CheckboxFieldComponent } from './fields/checkbox-field/checkbox-field.component';

@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    TextFieldComponent,
    DateFieldComponent,
    DateTimeFieldComponent,
    TimeFieldComponent,
    CheckboxFieldComponent
  ],
  templateUrl: './entity-form.component.html',
  styleUrl: './entity-form.component.css'
})
export class EntityFormComponent implements OnInit, OnChanges {
  @Input() entityMetadata!: EntityMetadata;
  @Input() entity: any = null;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  formGroup!: FormGroup;
  isEditMode = false;
  formReady = false;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    // Initialize empty formGroup in constructor to ensure it's always available
    this.formGroup = this.fb.group({});
  }

  ngOnInit() {
    this.updateEditMode();
    this.buildForm();
    this.formReady = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    // Rebuild form when entity or entityMetadata changes
    if (changes['entity'] || changes['entityMetadata']) {
      this.updateEditMode();
      // Only rebuild if formGroup is already initialized (after ngOnInit)
      if (this.formGroup) {
        this.buildForm();
      }
    }
  }

  updateEditMode() {
    this.isEditMode = this.entity !== null && this.entity !== undefined;
  }

  buildForm() {
    if (!this.entityMetadata || !this.entityMetadata.properties) {
      this.formReady = false;
      return;
    }
    
    // Temporarily set formReady to false to prevent rendering during rebuild
    this.formReady = false;
    
    const formControls: any = {};
    
    this.entityMetadata.properties.forEach(prop => {
      let value = this.isEditMode && this.entity 
        ? this.entity[prop.name] 
        : this.getDefaultValue(prop);
      
      // For datetime-local, create separate date and time controls
      if (prop.inputType === 'datetime-local') {
        if (value) {
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            // Split into date (Date object) and time (HH:mm string)
            formControls[`${prop.name}_date`] = [dateValue, []];
            const hours = String(dateValue.getHours()).padStart(2, '0');
            const minutes = String(dateValue.getMinutes()).padStart(2, '0');
            formControls[`${prop.name}_time`] = [`${hours}:${minutes}`, []];
          } else {
            formControls[`${prop.name}_date`] = [null, []];
            formControls[`${prop.name}_time`] = ['', []];
          }
        } else {
          formControls[`${prop.name}_date`] = [null, []];
          formControls[`${prop.name}_time`] = ['', []];
        }
      }
      // Convert Date strings to Date object for Material datepicker
      else if (prop.inputType === 'date') {
        // Material datepicker expects a Date object, not a string
        if (value) {
          const dateValue = new Date(value);
          value = !isNaN(dateValue.getTime()) ? dateValue : null;
        }
        const validators = prop.isKey && !this.isEditMode ? [] : [];
        formControls[prop.name] = [value, validators];
      }
      else {
        const validators = prop.isKey && !this.isEditMode 
          ? [] 
          : prop.inputType === 'email' 
            ? [Validators.email] 
            : [];
        formControls[prop.name] = [value, validators];
      }
    });

    // Update form controls in place to maintain form directive connection
    // Remove controls that no longer exist
    const existingKeys = Object.keys(this.formGroup.controls);
    const newKeys = Object.keys(formControls);
    
    // Remove controls that are no longer needed
    existingKeys.forEach(key => {
      if (!newKeys.includes(key)) {
        this.formGroup.removeControl(key);
      }
    });
    
    // Add or update controls
    newKeys.forEach(key => {
      if (this.formGroup.get(key)) {
        // Update existing control value
        const control = this.formGroup.get(key)!;
        control.setValue(formControls[key][0], { emitEvent: false });
        // Update validators if needed
        control.setValidators(formControls[key][1]);
        control.updateValueAndValidity({ emitEvent: false });
      } else {
        // Add new control
        this.formGroup.addControl(key, this.fb.control(formControls[key][0], formControls[key][1]));
      }
    });
    
    // Mark form as ready after all controls are added
    // Use setTimeout to ensure Angular change detection has processed the control additions
    setTimeout(() => {
      this.formReady = true;
    }, 0);
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
      // Handle datetime-local fields: combine date and time
      if (prop.inputType === 'datetime-local') {
        const dateValue = data[`${prop.name}_date`];
        const timeValue = data[`${prop.name}_time`];
        
        // Remove the separate date and time controls from data
        delete data[`${prop.name}_date`];
        delete data[`${prop.name}_time`];
        
        if (dateValue instanceof Date && timeValue && timeValue.trim() !== '') {
          // Combine date and time
          const timeParts = timeValue.trim().split(':');
          if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0], 10) || 0;
            const minutes = parseInt(timeParts[1], 10) || 0;
            const seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) || 0 : 0;
            
            // Create a new date with the selected date and time
            const combinedDate = new Date(dateValue);
            combinedDate.setHours(hours, minutes, seconds, 0);
            
            if (!isNaN(combinedDate.getTime())) {
              data[prop.name] = combinedDate.toISOString();
            } else {
              data[prop.name] = null;
            }
          } else {
            data[prop.name] = null;
          }
        } else if (dateValue instanceof Date) {
          // Only date selected, set time to midnight
          const combinedDate = new Date(dateValue);
          combinedDate.setHours(0, 0, 0, 0);
          data[prop.name] = combinedDate.toISOString();
        } else {
          data[prop.name] = null;
        }
      }
      else if (data[prop.name] !== null && data[prop.name] !== undefined && data[prop.name] !== '') {
        // Convert numeric string values to actual numbers
        if (prop.inputType === 'number' || prop.type?.toLowerCase().includes('decimal') || 
            prop.type?.toLowerCase().includes('float') || prop.type?.toLowerCase().includes('double') ||
            prop.type?.toLowerCase().includes('int') || prop.type?.toLowerCase().includes('long')) {
          const numValue = Number(data[prop.name]);
          if (!isNaN(numValue)) {
            data[prop.name] = numValue;
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
      } else if (prop.inputType === 'date' && 
                 (data[prop.name] === '' || data[prop.name] === null)) {
        // Set null for empty date fields
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


}


