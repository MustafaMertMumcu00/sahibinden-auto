import { Component } from '@angular/core';
import { ViewState } from './enums/view-state.enum';
import { CommonModule } from '@angular/common';

import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PostListingComponent } from './pages/post-listing/post-listing.component';
import { AllCarsComponent } from './pages/all-cars/all-cars.component';
import { RabbitMqService } from './services/rabbit-mq.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    PostListingComponent,
    CommonModule,
    AllCarsComponent,
  ], // importing components
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor(private rabbitMqService: RabbitMqService) {}

  VIEW_STATE = ViewState;

  // starting at the all_cars page
  currentView: ViewState = ViewState.ALL_CARS;

  isLoggedIn: boolean = false;

  onViewChange(selectedView: ViewState): void {
    this.currentView = selectedView;

    if (
      selectedView === ViewState.HOME ||
      selectedView === ViewState.POST_LISTING
    ) {
      this.isLoggedIn = true;
    } else if (
      selectedView === ViewState.LOGIN ||
      selectedView === ViewState.REGISTER
    ) {
      this.isLoggedIn = false;
    }
  }
}
