import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewState } from '../../enums/view-state.enum';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
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
      .login({ username: this.username, password: this.password })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.selectView(ViewState.HOME);
        },
        error: (err) => {
          console.error('Login error:', err);
          this.errorMessage =
            err.error?.error || 'Invalid credentials. Please try again.';
          this.isSubmitting = false;
        },
      });
  }
}
