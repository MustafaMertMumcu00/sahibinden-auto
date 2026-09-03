import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewState } from '../../enums/view-state.enum';
import { ListingService } from '../../services/listing.service';
import { AuthService } from '../../services/auth.service';
import { PaginationComponent } from '../../components/header/pagination.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  VIEW_STATE = ViewState;
  @Output() viewChange = new EventEmitter<ViewState>();

  myListings: any[] = [];
  isLoading: boolean = true;

  constructor(
    private listingService: ListingService,
    private authService: AuthService,
  ) {}

  currentPage: number = 1;
  readonly itemsPerPage: number = 15;

  ngOnInit(): void {
    this.fetchMyListings();
  }

  fetchMyListings(): void {
    this.isLoading = true;
    this.listingService.getMyListings().subscribe({
      next: (data) => {
        this.myListings = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching listings:', err);
        this.isLoading = false;
        // If unauthorized, boot them back to login
        if (err.status === 401) {
          this.selectView(ViewState.LOGIN);
        }
      },
    });
  }

  deleteListing(carId: number): void {
    if (confirm('Are you sure you want to delete this car listing?')) {
      this.listingService.deleteListing(carId).subscribe({
        next: () => {
          // Instantly remove the deleted car from the UI array without reloading the page
          this.myListings = this.myListings.filter(
            (car) => car.car_id !== carId,
          );
        },
        error: (err) => {
          console.error('Error deleting listing:', err);
          alert('Failed to delete the listing.');
        },
      });
    }
  }

  logout(): void {
    this.myListings = [];

    this.authService.logout().subscribe({
      next: () => {
        this.selectView(ViewState.LOGIN);
      },
      error: (err) => {
        console.error('Logout error:', err);
        this.selectView(ViewState.LOGIN);
      },
    });
  }

  selectView(view: ViewState): void {
    this.viewChange.emit(view);
  }

  get paginatedGarageListings(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.myListings.slice(startIndex, startIndex + this.itemsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
