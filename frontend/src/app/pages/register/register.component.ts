import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewState } from '../../enums/view-state.enum';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  VIEW_STATE = ViewState;
  @Output() viewChange = new EventEmitter<ViewState>();

  username = '';
  password = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  selectView(view: ViewState): void {
    this.viewChange.emit(view);
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Username and password are required.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService
      .signup({ username: this.username, password: this.password })
      .subscribe({
        next: (res) => {
          alert('Account created successfully! You are now logged in.');
          this.isSubmitting = false;
          this.selectView(ViewState.HOME);
        },
        error: (err) => {
          console.error('Registration error:', err);
          this.errorMessage =
            err.error?.error || 'Registration failed. Username might be taken.';
          this.isSubmitting = false;
        },
      });
  }
}
