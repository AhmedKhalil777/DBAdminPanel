import { Component, input, signal, computed, effect, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DeleteConfirmationModalComponent, DeleteConfirmationData } from '../delete-confirmation-modal/delete-confirmation-modal.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService, EntityMetadata } from '../../services/api.service';
import { TypeUtilsService } from '../../services/type-utils.service';
import { DateTimePickerDialogComponent, DateTimePickerData } from '../entity-form/fields/datetime-picker-dialog/datetime-picker-dialog.component';
import { DatePickerDialogComponent, DatePickerData } from '../entity-form/fields/date-picker-dialog/date-picker-dialog.component';
import { TimePickerDialogComponent, TimePickerData } from '../entity-form/fields/time-picker-dialog/time-picker-dialog.component';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ],
  templateUrl: './entity-table.component.html',
  styleUrl: './entity-table.component.css'
})
export class EntityTableComponent {
  entityMetadata = input.required<EntityMetadata>();
  
  // Signals for reactive state
  data = signal<any[]>([]);
  displayedColumns = signal<string[]>([]);
  currentPage = signal(0);
  pageSize = signal(10);
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalItems = signal(0);
  isLoading = signal(false);
  columnsReady = signal(false);
  
  // Inline editing state
  editingRowId = signal<string | number | null>(null);
  newRow = signal<any | null>(null);
  editingForms = signal<Map<string | number, FormGroup>>(new Map());
  
  private previousEntityName: string | null = null;

  // Computed signals
  hasData = computed(() => this.data().length > 0);
  isEmpty = computed(() => !this.isLoading() && this.data().length === 0);
  showTable = computed(() => !this.isLoading() && this.displayedColumns().length > 0 && this.columnsReady());

  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private typeUtils = inject(TypeUtilsService);

  constructor() {
    // Effect to handle entity metadata changes
    effect(() => {
      const metadata = this.entityMetadata();
      if (metadata && metadata.properties && metadata.properties.length > 0) {
        const currentEntityName = metadata.name;
        
        // Only reload if the entity name actually changed
        if (currentEntityName !== this.previousEntityName) {
          this.previousEntityName = currentEntityName;
          
          // Reset state for new entity
          this.data.set([]);
          this.displayedColumns.set([]);
          this.currentPage.set(0);
          this.totalItems.set(0);
          this.editingRowId.set(null);
          this.newRow.set(null);
          this.editingForms.set(new Map());
          this.columnsReady.set(false);
          this.isLoading.set(true);
          
          this.setupDisplayedColumns();
          this.loadData();
        }
      } else {
        this.displayedColumns.set([]);
        this.columnsReady.set(false);
      }
    });
  }


  setupDisplayedColumns() {
    const metadata = this.entityMetadata();
    if (!metadata || !metadata.properties || metadata.properties.length === 0) {
      this.displayedColumns.set([]);
      this.columnsReady.set(false);
      return;
    }
    // Ensure we only include columns that have properties with valid names
    const propertyNames = metadata.properties
      .filter(p => p && p.name && typeof p.name === 'string' && p.name.trim() !== '')
      .map(p => p.name);
    
    this.displayedColumns.set([
      ...propertyNames,
      'actions'
    ]);
    
    // Mark columns as ready after change detection to ensure template is rendered
    // Use requestAnimationFrame to ensure DOM is updated before marking as ready
    this.columnsReady.set(false);
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.columnsReady.set(true);
        this.cdr.detectChanges();
      });
    });
  }

  validProperties = computed(() => {
    const metadata = this.entityMetadata();
    if (!metadata || !metadata.properties) {
      return [];
    }
    return metadata.properties.filter(
      p => p && p.name && typeof p.name === 'string' && p.name.trim() !== ''
    );
  });

  loadData() {
    const metadata = this.entityMetadata();
    if (!metadata || !metadata.name) {
      this.isLoading.set(false);
      return;
    }
    
    this.isLoading.set(true);
    // Use 1-based page index for API (Material paginator uses 0-based)
    const apiPage = this.currentPage() + 1;
    this.apiService.getAllEntities(metadata.name, apiPage, this.pageSize()).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.data.set(response.data || []);
        this.totalItems.set(response.totalCount || 0);
        console.log('Loaded data:', this.data());
        console.log('Total items:', this.totalItems());
        console.log('Entity metadata properties:', metadata.properties);
        
        // Ensure displayedColumns are set before rendering
        if (this.displayedColumns().length === 0) {
          this.setupDisplayedColumns();
        } else {
          // Reset columnsReady and wait for column definitions to be registered
          this.columnsReady.set(false);
          this.cdr.detectChanges();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this.columnsReady.set(true);
              this.cdr.detectChanges();
            });
          });
        }
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load data:', error);
        this.data.set([]);
        this.totalItems.set(0);
        this.isLoading.set(false);
        this.columnsReady.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  paginatedData = computed(() => {
    // Data is already paginated from the server
    return this.data();
  });

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    // Reload data with new pagination parameters
    this.loadData();
  }

  createNew() {
    const metadata = this.entityMetadata();
    if (!metadata || !metadata.properties) {
      console.error('No metadata available');
      return;
    }
    
    // Cancel any existing edit first
    if (this.editingRowId() !== null) {
      this.cancelEdit(this.editingRowId());
    }
    
    const newRowData: any = {};
    metadata.properties.forEach(prop => {
      newRowData[prop.name] = this.getDefaultValue(prop);
    });
    
    // Set newRow first, then create form
    this.newRow.set(newRowData);
    
    // Create form synchronously
    this.createFormForRow(null, newRowData);
    
    // Force change detection
    this.cdr.markForCheck();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  edit(row: any) {
    const metadata = this.entityMetadata();
    const rowId = this.getRowId(row);
    this.editingRowId.set(rowId);
    
    // Extract values using getRowValue to ensure consistent property access
    const rowData: any = {};
    metadata.properties.forEach(prop => {
      rowData[prop.name] = this.getRowValue(row, prop.name);
    });
    
    this.createFormForRow(rowId, rowData);
  }

  getRowId(row: any): string | number {
    const metadata = this.entityMetadata();
    const keyProp = metadata.properties.find(p => p.isKey);
    if (keyProp) {
      return this.getRowValue(row, keyProp.name) ?? `temp-${Date.now()}`;
    }
    return `temp-${Date.now()}`;
  }

  createFormForRow(rowId: string | number | null, rowData: any) {
    const metadata = this.entityMetadata();
    const formControls: { [key: string]: FormControl } = {};
    
    metadata.properties.forEach(prop => {
      // Get value from rowData, handling null/undefined
      let value = rowData[prop.name];
      if (value === null || value === undefined) {
        value = this.getDefaultValue(prop);
      }
      
      // Handle date inputs - convert string to Date object
      if (prop.inputType === 'date' && value) {
        if (typeof value === 'string') {
          const dateValue = new Date(value);
          value = !isNaN(dateValue.getTime()) ? dateValue : null;
        } else if (value instanceof Date) {
          // Already a Date object
          value = value;
        }
      }
      
      // Handle datetime-local inputs
      if (prop.inputType === 'datetime-local' && value) {
        if (typeof value === 'string') {
          const dateValue = new Date(value);
          value = !isNaN(dateValue.getTime()) ? dateValue : null;
        }
      }
      
      // Handle boolean/checkbox inputs
      if (prop.inputType === 'checkbox' || prop.inputType === 'boolean') {
        value = value === true || value === 'true' || value === 1;
      }
      
      // Handle number inputs
      if (prop.inputType === 'number' && value !== null && value !== undefined) {
        const numValue = Number(value);
        value = isNaN(numValue) ? 0 : numValue;
      }
      
      const validators = prop.isKey && rowId === null ? [] : 
                       prop.inputType === 'email' ? [Validators.email] : [];
      
      // Create proper FormControl instance
      formControls[prop.name] = new FormControl(value, validators);
    });
    
    const formGroup = new FormGroup(formControls);
    const forms = new Map(this.editingForms());
    if (rowId === null) {
      forms.set('new', formGroup);
      console.log('Form created for new row, form valid:', formGroup.valid);
    } else {
      forms.set(rowId, formGroup);
    }
    this.editingForms.set(forms);
    
    // Force change detection after a tick
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('Change detection triggered, newRow:', this.newRow(), 'forms:', Array.from(this.editingForms().keys()));
    }, 0);
  }

  getDefaultValue(prop: any): any {
    if (prop.inputType === 'checkbox' || prop.inputType === 'boolean') {
      return false;
    }
    if (prop.inputType === 'number') {
      return 0;
    }
    if (prop.inputType === 'date' || prop.inputType === 'datetime-local') {
      return null;
    }
    return '';
  }

  saveRow(rowId: string | number | null) {
    const forms = this.editingForms();
    const formGroup = rowId === null ? forms.get('new') : forms.get(rowId);
    
    if (!formGroup || formGroup.invalid) {
      return;
    }
    
    const metadata = this.entityMetadata();
    const formValue = formGroup.value;
    
    // Convert date objects to ISO strings
    metadata.properties.forEach(prop => {
      if (prop.inputType === 'date' && formValue[prop.name] instanceof Date) {
        formValue[prop.name] = formValue[prop.name].toISOString().split('T')[0];
      }
      if (prop.inputType === 'datetime-local' && formValue[prop.name] instanceof Date) {
        formValue[prop.name] = formValue[prop.name].toISOString();
      }
    });
    
    if (rowId === null) {
      // Create new
      this.apiService.createEntity(metadata.name, formValue).subscribe({
        next: () => {
          this.cancelEdit(null);
          this.loadData();
        },
        error: (error) => {
          console.error('Failed to create:', error);
          alert('Failed to create entity: ' + (error.error?.message || error.message));
        }
      });
    } else {
      // Update existing
      this.apiService.updateEntity(metadata.name, String(rowId), formValue).subscribe({
        next: () => {
          this.cancelEdit(rowId);
          this.loadData();
        },
        error: (error) => {
          console.error('Failed to update:', error);
          alert('Failed to update entity: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  cancelEdit(rowId: string | number | null) {
    if (rowId === null) {
      this.newRow.set(null);
    } else {
      this.editingRowId.set(null);
    }
    const forms = new Map(this.editingForms());
    forms.delete(rowId === null ? 'new' : rowId);
    this.editingForms.set(forms);
  }

  isEditing(rowId: string | number | null): boolean {
    if (rowId === null) {
      return this.newRow() !== null;
    }
    return this.editingRowId() === rowId;
  }

  getFormGroup(rowId: string | number | null): FormGroup | null {
    const forms = this.editingForms();
    return rowId === null ? forms.get('new') ?? null : forms.get(rowId) ?? null;
  }

  getFormControl(formGroup: FormGroup, propName: string): FormControl | null {
    const control = formGroup.get(propName);
    return control instanceof FormControl ? control : null;
  }

  getColumnWidth(propName: string): number | null {
    // Return null to let table auto-size, or calculate based on column count
    return null;
  }

  openDatePicker(control: FormControl, propertyName: string) {
    const currentValue = control.value;
    let dateValue: Date | null = null;
    
    if (currentValue) {
      if (currentValue instanceof Date) {
        dateValue = currentValue;
      } else if (typeof currentValue === 'string') {
        dateValue = new Date(currentValue);
        if (isNaN(dateValue.getTime())) {
          dateValue = null;
        }
      }
    }

    const dialogRef = this.dialog.open(DatePickerDialogComponent, {
      width: '400px',
      data: {
        date: dateValue,
        propertyName: propertyName
      } as DatePickerData
    });

    dialogRef.afterClosed().subscribe((result: Date | null) => {
      if (result !== null) {
        control.setValue(result);
        control.markAsTouched();
      }
    });
  }

  openDateTimePicker(control: FormControl, propertyName: string) {
    const currentValue = control.value;
    let dateValue: Date | null = null;
    let hours = 0;
    let minutes = 0;
    
    if (currentValue) {
      if (currentValue instanceof Date) {
        dateValue = currentValue;
        hours = dateValue.getHours();
        minutes = dateValue.getMinutes();
      } else if (typeof currentValue === 'string') {
        dateValue = new Date(currentValue);
        if (!isNaN(dateValue.getTime())) {
          hours = dateValue.getHours();
          minutes = dateValue.getMinutes();
        } else {
          dateValue = null;
        }
      }
    }

    const dialogRef = this.dialog.open(DateTimePickerDialogComponent, {
      width: '450px',
      data: {
        date: dateValue,
        hours: hours,
        minutes: minutes,
        propertyName: propertyName
      } as DateTimePickerData
    });

    dialogRef.afterClosed().subscribe((result: Date | null) => {
      if (result !== null) {
        control.setValue(result);
        control.markAsTouched();
      }
    });
  }

  openTimePicker(control: FormControl, propertyName: string) {
    const currentValue = control.value || '';
    const currentTime = currentValue ? currentValue.split(':') : ['00', '00'];
    
    const dialogRef = this.dialog.open(TimePickerDialogComponent, {
      width: '300px',
      data: {
        hours: parseInt(currentTime[0]) || 0,
        minutes: parseInt(currentTime[1]) || 0
      } as TimePickerData
    });

    dialogRef.afterClosed().subscribe((result: { hours: number; minutes: number } | null) => {
      if (result) {
        const timeString = `${String(result.hours).padStart(2, '0')}:${String(result.minutes).padStart(2, '0')}`;
        control.setValue(timeString);
        control.markAsTouched();
      }
    });
  }

  formatDateValue(value: any): string {
    if (!value) return 'Select date';
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    return 'Select date';
  }

  formatDateTimeValue(value: any): string {
    if (!value) return 'Select date & time';
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    return 'Select date & time';
  }

  formatTimeValue(value: any): string {
    if (!value) return 'Select time';
    if (typeof value === 'string') {
      return value;
    }
    return 'Select time';
  }

  delete(entity: any) {
    const metadata = this.entityMetadata();
    const id = this.getRowValue(entity, metadata.keyProperty);
    
    if (id === null || id === undefined) {
      console.error('Cannot delete: ID is null or undefined', { entity, keyProperty: metadata.keyProperty });
      alert('Failed to delete: ID not found');
      return;
    }

    // Create display name from entity properties
    const displayName = this.formatEntityDisplayName(entity, metadata);

    const dialogData: DeleteConfirmationData = {
      entityName: metadata.name,
      entityId: id,
      displayName: displayName
    };

    const dialogRef = this.dialog.open(DeleteConfirmationModalComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.apiService.deleteEntity(metadata.name, String(id)).subscribe({
          next: () => {
            this.loadData();
          },
          error: (error) => {
            console.error('Failed to delete:', error);
            alert('Failed to delete entity: ' + (error.error?.message || error.message));
          }
        });
      }
    });
  }

  formatEntityDisplayName(entity: any, metadata: EntityMetadata): string {
    // Try to create a meaningful display name from entity properties
    // First try key property
    const keyValue = this.getRowValue(entity, metadata.keyProperty);
    if (keyValue !== null && keyValue !== undefined) {
      return `ID: ${keyValue}`;
    }
    
    // Try common name fields
    const nameFields = ['name', 'title', 'label', 'description'];
    for (const field of nameFields) {
      const value = this.getRowValue(entity, field);
      if (value !== null && value !== undefined && value !== '') {
        return String(value);
      }
    }
    
    // Fallback to first non-key property
    const firstProp = metadata.properties.find(p => !p.isKey);
    if (firstProp) {
      const value = this.getRowValue(entity, firstProp.name);
      if (value !== null && value !== undefined && value !== '') {
        return String(value);
      }
    }
    
    return `Entity #${keyValue || 'Unknown'}`;
  }


  getRowValue(row: any, propertyName: string): any {
    if (!row || !propertyName) return null;
    
    // Try exact match first
    if (row.hasOwnProperty(propertyName)) {
      return row[propertyName];
    }
    
    // Try case-insensitive match
    const lowerPropName = propertyName.toLowerCase();
    for (const key in row) {
      if (row.hasOwnProperty(key) && key.toLowerCase() === lowerPropName) {
        return row[key];
      }
    }
    
    // Try camelCase if property is PascalCase
    const camelCase = propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
    if (row.hasOwnProperty(camelCase)) {
      return row[camelCase];
    }
    
    // Try PascalCase if property is camelCase
    const pascalCase = propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
    if (row.hasOwnProperty(pascalCase)) {
      return row[pascalCase];
    }
    
    return null;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return String(value);
  }

  getPropertyType(propName: string): string {
    const metadata = this.entityMetadata();
    const prop = metadata.properties.find(p => p.name === propName);
    const rawType = prop?.type || 'string';
    // Normalize the type string to remove backticks and format nicely
    return this.typeUtils.getDisplayType(rawType);
  }

  getPropertyIcon(type: string): string {
    if (!type) return 'code';
    const typeLower = type.toLowerCase();
    if (typeLower.includes('int') || typeLower.includes('number') || typeLower.includes('decimal')) {
      return 'numbers';
    }
    if (typeLower.includes('date') || typeLower.includes('time')) {
      return 'calendar_today';
    }
    if (typeLower.includes('bool')) {
      return 'toggle_on';
    }
    if (typeLower.includes('string') || typeLower.includes('text')) {
      return 'text_fields';
    }
    return 'code';
  }

  trackByPropertyName(index: number, prop: any): string {
    return (prop && prop.name && typeof prop.name === 'string') ? prop.name : `prop-${index}`;
  }
}
