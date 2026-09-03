import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Listing {
  brand_id: number;
  model_id: number;
  fuel_id: number;
  year: number;
  km: number;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class ListingService {
  private apiUrl = 'http://localhost:5000/api/listings';
  private httpOptions = { withCredentials: true };

  constructor(private http: HttpClient) {}

  getAllPublicListings(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, this.httpOptions);
  }

  getMyListings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me`, this.httpOptions);
  }

  createListing(listingData: any): Observable<any> {
    return this.http.post(this.apiUrl, listingData, this.httpOptions);
  }

  deleteListing(carId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${carId}`, this.httpOptions);
  }
}
