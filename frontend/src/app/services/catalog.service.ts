import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private apiUrl = 'http://localhost:5000/api/catalog';
  private httpOptions = { withCredentials: true };

  constructor(private http: HttpClient) {}

  getBrands(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/brands`, this.httpOptions);
  }

  getModelsByBrand(brandId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/brands/${brandId}/models`,
      this.httpOptions,
    );
  }

  getFuels(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/fuels`, this.httpOptions);
  }
}
