import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { ViewState } from '../../enums/view-state.enum';
import { ListingService } from '../../services/listing.service';
import { RabbitMqService } from '../../services/rabbit-mq.service';
import { PaginationComponent } from '../../components/header/pagination.component';

@Component({
  selector: 'app-all-cars',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './all-cars.component.html',
  styleUrls: ['./all-cars.component.css'],
})
export class AllCarsComponent implements OnInit, OnDestroy {
  VIEW_STATE = ViewState;
  @Output() viewChange = new EventEmitter<ViewState>();

  publicListings: any[] = [];
  isLoading: boolean = true;

  private priceDropSub: Subscription | null = null;
  opportunityQueue: any[] = [];
  activeOpportunities: any[] = [];

  // To track the number of processed items in the array
  private lastProcessedLength: number = 0;

  // Pagination variables
  currentPage: number = 1;
  readonly itemsPerPage: number = 15;

  highlightedCarId: number | null = null;

  constructor(
    private listingService: ListingService,
    private rabbitMqService: RabbitMqService
  ) {}

  ngOnInit(): void {
    this.fetchAllListings();
    this.setupPriceDropSubscription();
  }

  fetchAllListings(): void {
    this.isLoading = true;
    this.listingService.getAllPublicListings().subscribe({
      next: (data) => {
        this.publicListings = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching public listings:', err);
        this.isLoading = false;
      },
    });
  }

  setupPriceDropSubscription(): void {
    this.priceDropSub = this.rabbitMqService.priceDrops$.subscribe((dropsArray) => {
      if (!dropsArray || dropsArray.length === 0) return;

      // Always synchronize the prices on the table with the latest data
      for (const discountData of dropsArray) {
        const listing = this.publicListings.find(car => car.car_id === discountData.car_id);
        if (listing) {
          listing.old_price = discountData.old_price;
          listing.price = discountData.new_price;
        }
      }

      // Only add NEW discounts that have not been previously processed to the banner queue
      const newDrops = dropsArray.slice(this.lastProcessedLength);
      if (newDrops.length > 0) {
        this.opportunityQueue.push(...newDrops);
        this.lastProcessedLength = dropsArray.length;
        this.processQueue();
      }
    });
  }

  getDiscountPercentage(oldPrice: number, newPrice: number): number {
    if (!oldPrice || !newPrice) return 0;
      return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  }

  processQueue(): void {
    while (this.activeOpportunities.length < 3 && this.opportunityQueue.length > 0) {
      const nextOpportunity = this.opportunityQueue.shift();

      // Unshift places the newest notification at the top of the array
      this.activeOpportunities.unshift(nextOpportunity);

      // Set independent 7-second timer for each notification
      nextOpportunity.timeoutId = setTimeout(() => {
        this.closeOpportunity(nextOpportunity);
      }, 7000);
    }
  }

  closeOpportunity(opp: any, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevents the click from triggering onNotificationClick
    }

    if (opp.closing) return;

    // Trigger CSS fade/slide out animation
    opp.closing = true;
    clearTimeout(opp.timeoutId);

    // Wait for the animation (300ms) to finish before removing from DOM
    setTimeout(() => {
      this.activeOpportunities = this.activeOpportunities.filter(item => item !== opp);
      this.processQueue();
    }, 300);
  }

  // Display only the 15 cars that belong to the current page
  get paginatedListings(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.publicListings.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.publicListings.length / this.itemsPerPage);
  }

  // Update this to handle the event emitted by the child
  onPageChange(page: number): void {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Add this new method ---
  onNotificationClick(opp: any): void {
    const carIndex = this.publicListings.findIndex(c => c.car_id === opp.car_id);
    if (carIndex === -1) return;

    // Calculate the target page and navigate
    const targetPage = Math.floor(carIndex / this.itemsPerPage) + 1;
    this.currentPage = targetPage;

    // Set the highlighted car ID
    this.highlightedCarId = opp.car_id;

    // Wait for Angular to render the new page, then scroll
    setTimeout(() => {
      const element = document.getElementById('car-' + opp.car_id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Remove the highlight after 2 seconds
    setTimeout(() => {
      if (this.highlightedCarId === opp.car_id) {
        this.highlightedCarId = null;
      }
    }, 2000);
  }

  selectView(view: ViewState): void {
    this.viewChange.emit(view);
  }

  ngOnDestroy(): void {
    if (this.priceDropSub) {
      this.priceDropSub.unsubscribe();
    }
    this.activeOpportunities.forEach(opp => clearTimeout(opp.timeoutId));
  }
}
