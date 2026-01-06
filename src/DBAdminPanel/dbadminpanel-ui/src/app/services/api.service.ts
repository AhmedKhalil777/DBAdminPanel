import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EntityMetadata {
  name: string;
  fullName: string;
  dbSetName: string;
  keyProperty: string;
  dbContextName: string;
  dbContextFullName: string;
  databaseType?: string;
  sqlSamples?: SqlSample[];
  properties: PropertyMetadata[];
  apiEndpoints: ApiEndpoint[];
}

export interface SqlSample {
  name: string;
  sql: string;
  description?: string;
}

export interface PropertyMetadata {
  name: string;
  type: string;
  inputType: string;
  isKey: boolean;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getAllMetadata(): Observable<EntityMetadata[]> {
    return this.http.get<EntityMetadata[]>(`${this.baseUrl}/api/metadata`);
  }

  getEntityMetadata(entityName: string): Observable<EntityMetadata> {
    return this.http.get<EntityMetadata>(`${this.baseUrl}/api/metadata/${entityName}`);
  }

  getAllEntities(entityName: string, page?: number, pageSize?: number): Observable<{data: any[], totalCount: number, page: number, pageSize: number}> {
    let url = `${this.baseUrl}/${entityName}/api`;
    const params: string[] = [];
    if (page !== undefined && page !== null) {
      params.push(`page=${page}`);
    }
    if (pageSize !== undefined && pageSize !== null) {
      params.push(`pageSize=${pageSize}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<{data: any[], totalCount: number, page: number, pageSize: number}>(url);
  }

  getEntityById(entityName: string, id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${entityName}/api/${id}`);
  }

  createEntity(entityName: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${entityName}/api`, data);
  }

  updateEntity(entityName: string, id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${entityName}/api/${id}`, data);
  }

  deleteEntity(entityName: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${entityName}/api/${id}`);
  }

  getDiagramData(): Observable<DiagramTableInfo[]> {
    return this.http.get<DiagramTableInfo[]>(`${this.baseUrl}/api/diagram`);
  }

  executeSql(sql: string, dbContextName?: string | null): Observable<SqlExecutionResult> {
    const url = `${this.baseUrl}/api/sql/execute`;
    const body: any = { sql };
    if (dbContextName) {
      body.dbContextName = dbContextName;
    }
    return this.http.post<SqlExecutionResult>(url, body);
  }
}

export interface DiagramTableInfo {
  name: string;
  fullName: string;
  tableName: string;
  dbContextName: string;
  modelFilePath: string;
  columns: DiagramColumnInfo[];
  relations: DiagramRelationInfo[];
}

export interface DiagramColumnInfo {
  name: string;
  type: string;
  fullType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface DiagramRelationInfo {
  fromTable: string;
  toTable: string;
  fromColumn: string;
  toColumn: string;
  relationshipType: string;
}

export interface SqlExecutionResult {
  hasResult: boolean;
  columns?: string[];
  rows?: any[][];
  rowCount?: number;
  rowsAffected?: number;
  executionTime?: number;
}

