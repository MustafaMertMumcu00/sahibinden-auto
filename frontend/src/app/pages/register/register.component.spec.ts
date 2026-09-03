import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { ViewState } from '../../enums/view-state.enum';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: any;

  beforeEach(async () => {
    // Create Mock for the AuthService
    mockAuthService = {
      signup: jasmine.createSpy('signup')
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;

    // Spy on the ViewState emitter and window alert
    spyOn(component.viewChange, 'emit');
    spyOn(window, 'alert');
    fixture.detectChanges();
  });

  // --- Category: Form Validation ---
  describe('Form Validation', () => {
    it('should set an error message and abort if username or password is missing', () => {
      component.username = '';
      component.password = '';

      component.onSubmit();

      expect(component.errorMessage).toBe('Username and password are required.');
      expect(mockAuthService.signup).not.toHaveBeenCalled();
    });

    it('should abort if only the username is provided', () => {
      component.username = 'newuser';
      component.password = '';

      component.onSubmit();

      expect(component.errorMessage).toBe('Username and password are required.');
      expect(mockAuthService.signup).not.toHaveBeenCalled();
    });
  });

  // --- Category: API Interaction & State Management ---
  describe('API Interaction', () => {
    it('should clear errors and set submitting state when valid data is submitted', () => {
      mockAuthService.signup.and.returnValue(of({}));

      component.username = 'newuser';
      component.password = 'securepass123';
      component.errorMessage = 'Previous error message';

      component.onSubmit();

      expect(component.errorMessage).toBe(''); // Error should be wiped
      expect(mockAuthService.signup).toHaveBeenCalledWith({ username: 'newuser', password: 'securepass123' });
    });

    it('should alert the user, reset loading state, and navigate to HOME on successful registration', () => {
      mockAuthService.signup.and.returnValue(of({ success: true }));

      component.username = 'newuser';
      component.password = 'securepass123';
      component.isSubmitting = true;

      component.onSubmit();

      expect(window.alert).toHaveBeenCalledWith('Account created successfully! You are now logged in.');
      expect(component.isSubmitting).toBeFalse();
      expect(component.viewChange.emit).toHaveBeenCalledWith(ViewState.HOME as any);
    });

    it('should display the backend error message if the username is already taken', () => {
      // Simulate a 400 Bad Request or 409 Conflict from the Flask backend
      const mockErrorResponse = { error: { error: 'Username already exists' } };
      mockAuthService.signup.and.returnValue(throwError(() => mockErrorResponse));

      component.username = 'existinguser';
      component.password = 'securepass123';

      component.onSubmit();

      expect(component.isSubmitting).toBeFalse();
      expect(component.errorMessage).toBe('Username already exists');
      expect(component.viewChange.emit).not.toHaveBeenCalled(); // Should not navigate
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('should use a fallback error message if the backend provides no specific text', () => {
      // Simulate a generic 500 Server Error without a specific JSON message
      mockAuthService.signup.and.returnValue(throwError(() => ({ status: 500 })));

      component.username = 'newuser';
      component.password = 'securepass123';

      component.onSubmit();

      expect(component.errorMessage).toBe('Registration failed. Username might be taken.');
    });
  });
});
