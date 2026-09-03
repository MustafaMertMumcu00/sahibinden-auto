import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const expectedApiUrl = 'http://localhost:5000/api/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Provides a mock HttpClient
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Automatically verifies that no stray HTTP requests are left open after each test
  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Category: Signup ---
  describe('signup()', () => {
    it('should send a POST request to /signup with credentials and cookies enabled', () => {
      const mockCredentials = { username: 'testuser', password: 'password123' };
      const mockResponse = { message: 'User created successfully' };

      // Trigger the service method
      service.signup(mockCredentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      // Intercept the exact HTTP request
      const req = httpMock.expectOne(`${expectedApiUrl}/signup`);

      // Verify the request properties
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCredentials);
      expect(req.request.withCredentials).toBeTrue(); // Crucial for session cookies

      // Simulate the server sending back the mock response
      req.flush(mockResponse);
    });
  });

  // --- Category: Login ---
  describe('login()', () => {
    it('should send a POST request to /login with credentials and cookies enabled', () => {
      const mockCredentials = { username: 'testuser', password: 'password123' };
      const mockResponse = { message: 'Login successful' };

      service.login(mockCredentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${expectedApiUrl}/login`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCredentials);
      expect(req.request.withCredentials).toBeTrue();

      req.flush(mockResponse);
    });
  });

  // --- Category: Logout ---
  describe('logout()', () => {
    it('should send a POST request to /logout with an empty body and cookies enabled', () => {
      const mockResponse = { message: 'Logged out' };

      service.logout().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${expectedApiUrl}/logout`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({}); // Verifies the empty payload
      expect(req.request.withCredentials).toBeTrue(); // Crucial to tell Flask which session to destroy

      req.flush(mockResponse);
    });
  });
});
