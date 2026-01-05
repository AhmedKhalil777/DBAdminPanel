import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EntityMetadata {
  name: string;
  fullName: string;
  dbSetName: string;
  keyProperty: string;
  dbContextName: string;
  dbContextFullName: string;
  properties: PropertyMetadata[];
  apiEndpoints: ApiEndpoint[];
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
  private baseUrl = '/DBAdminPanel';

  constructor(private http: HttpClient) {}

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
}

