import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewState } from '../../enums/view-state.enum';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  VIEW_STATE = ViewState;

  // Receives the login status from app.component
  @Input() isLoggedIn: boolean = false;

  // Sends click events back up to app.component
  @Output() viewChange = new EventEmitter<ViewState>();

  selectView(view: ViewState): void {
    this.viewChange.emit(view);
  }
}
