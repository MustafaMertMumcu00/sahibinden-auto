import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';

  // The critical configuration to ensure session cookies are sent/received
  private httpOptions = {
    withCredentials: true,
  };

  constructor(private http: HttpClient) {}

  signup(credentials: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/signup`,
      credentials,
      this.httpOptions,
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/login`,
      credentials,
      this.httpOptions,
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, this.httpOptions);
  }
}
