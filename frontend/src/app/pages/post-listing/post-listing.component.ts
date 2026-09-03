import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewState } from '../../enums/view-state.enum';
import { ListingService, Listing } from '../../services/listing.service';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-post-listing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-listing.component.html',
  styleUrls: ['./post-listing.component.css'],
})
export class PostListingComponent implements OnInit {
  VIEW_STATE = ViewState;
  @Output() viewChange = new EventEmitter<ViewState>();

  // Arrays to hold our dropdown data
  brands: any[] = [];
  models: any[] = [];
  fuels: any[] = [];

  // Form payload variables matching the new PostgreSQL schema
  brand_id: number | null = null;
  model_id: number | null = null;
  fuel_id: number | null = null;
  year: number | null = null;
  km: number | null = null;
  price: number | null = null;

  isSubmitting: boolean = false;

  constructor(
    private listingService: ListingService,
    private catalogService: CatalogService,
  ) {}

  ngOnInit(): void {
    this.loadCatalogData();
  }

  // Fetch Brands and Fuels when the page loads
  loadCatalogData(): void {
    this.catalogService.getBrands().subscribe({
      next: (data) => (this.brands = data),
      error: (err) => console.error('Error fetching brands', err),
    });

    this.catalogService.getFuels().subscribe({
      next: (data) => (this.fuels = data),
      error: (err) => console.error('Error fetching fuels', err),
    });
  }

  // Triggered automatically when a user selects a brand from the dropdown
  onBrandSelect(): void {
    this.model_id = null; // Reset model if they change the brand
    this.models = [];

    if (this.brand_id) {
      this.catalogService.getModelsByBrand(this.brand_id).subscribe({
        next: (data) => (this.models = data),
        error: (err) => console.error('Error fetching models', err),
      });
    }
  }

  selectView(view: ViewState): void {
    this.viewChange.emit(view);
  }

  onSubmit(): void {
    if (
      !this.brand_id ||
      !this.model_id ||
      !this.fuel_id ||
      !this.year ||
      !this.km ||
      !this.price
    ) {
      alert('Please fill in all fields before publishing.');
      return;
    }

    this.isSubmitting = true;

    const newListing: Listing = {
      brand_id: Number(this.brand_id),
      model_id: Number(this.model_id),
      fuel_id: Number(this.fuel_id),
      year: Number(this.year),
      km: Number(this.km),
      price: Number(this.price),
    };

    this.listingService.createListing(newListing).subscribe({
      next: () => {
        alert('Listing created successfully!');
        this.isSubmitting = false;
        // Assuming HOME or DASHBOARD is where they go after posting
        this.selectView(ViewState.HOME);
      },
      error: (err) => {
        console.error('Submission error:', err);
        alert('Failed to create listing. Please ensure you are logged in.');
        this.isSubmitting = false;
      },
    });
  }
}
