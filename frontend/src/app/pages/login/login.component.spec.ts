import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { ViewState } from '../../enums/view-state.enum';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;

  beforeEach(async () => {
    // Create Mock for the AuthService
    mockAuthService = {
      login: jasmine.createSpy('login')
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule], // FormsModule required for ngModel
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    // Spy on the ViewState emitter
    spyOn(component.viewChange, 'emit');
    fixture.detectChanges();
  });

  // --- Category: Form Validation ---
  describe('Form Validation', () => {
    it('should set an error message and abort if username or password is missing', () => {
      component.username = '';
      component.password = '';

      component.onSubmit();

      expect(component.errorMessage).toBe('Username and password are required.');
      expect(mockAuthService.login).not.toHaveBeenCalled(); // API should not be hit
    });

    it('should abort if only password is provided', () => {
      component.username = '';
      component.password = 'secret123';

      component.onSubmit();

      expect(component.errorMessage).toBe('Username and password are required.');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  // --- Category: API Interaction & State Management ---
  describe('API Interaction', () => {
    it('should clear errors and set submitting state when valid data is submitted', () => {
      // Mock an API that never resolves so we can check the 'isSubmitting' state
      mockAuthService.login.and.returnValue(of({}));

      component.username = 'testuser';
      component.password = 'password123';
      component.errorMessage = 'Previous error';

      component.onSubmit();

      expect(component.errorMessage).toBe(''); // Error should be wiped
      expect(mockAuthService.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
    });

    it('should navigate to HOME view on successful login and reset loading state', () => {
      mockAuthService.login.and.returnValue(of({ success: true }));

      component.username = 'testuser';
      component.password = 'password123';
      component.isSubmitting = true;

      component.onSubmit();

      expect(component.isSubmitting).toBeFalse();
      expect(component.viewChange.emit).toHaveBeenCalledWith(ViewState.HOME as any);
    });

    it('should display the backend error message on a failed login', () => {
      // Simulate a 401 Unauthorized response from the Flask backend
      const mockErrorResponse = { error: { error: 'Incorrect password' } };
      mockAuthService.login.and.returnValue(throwError(() => mockErrorResponse));

      component.username = 'testuser';
      component.password = 'wrongpassword';

      component.onSubmit();

      expect(component.isSubmitting).toBeFalse();
      expect(component.errorMessage).toBe('Incorrect password');
      expect(component.viewChange.emit).not.toHaveBeenCalled(); // Should not navigate
    });

    it('should use a fallback error message if the backend provides no specific text', () => {
      // Simulate a generic 500 Server Error without a specific message
      mockAuthService.login.and.returnValue(throwError(() => ({ status: 500 })));

      component.username = 'testuser';
      component.password = 'password123';

      component.onSubmit();

      expect(component.errorMessage).toBe('Invalid credentials. Please try again.');
    });
  });
});
