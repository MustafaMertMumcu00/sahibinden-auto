import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { ListingService } from '../../services/listing.service';
import { AuthService } from '../../services/auth.service';
import { ViewState } from '../../enums/view-state.enum';
import { of, throwError } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockListingService: any;
  let mockAuthService: any;

  const mockListings = [
    { car_id: 1, brand: 'Toyota', model: 'Corolla' },
    { car_id: 2, brand: 'Honda', model: 'Civic' },
  ];

  beforeEach(async () => {
    // Create Mocks for external dependencies
    mockListingService = {
      getMyListings: jasmine
        .createSpy('getMyListings')
        .and.returnValue(of(mockListings)),
      deleteListing: jasmine.createSpy('deleteListing').and.returnValue(of({})),
    };

    mockAuthService = {
      logout: jasmine.createSpy('logout').and.returnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: ListingService, useValue: mockListingService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;

    // Spy on the ViewState emitter
    spyOn(component.viewChange, 'emit');
  });

  // --- Category 1: Initialization & Data Fetching ---
  describe('Initialization', () => {
    it('should fetch user listings on init and turn off loading state', () => {
      fixture.detectChanges(); // Triggers ngOnInit -> fetchMyListings

      expect(mockListingService.getMyListings).toHaveBeenCalled();
      expect(component.myListings.length).toBe(2);
      expect(component.isLoading).toBeFalse();
    });

    it('should boot the user to the LOGIN view if fetching returns a 401 Unauthorized', () => {
      // Override the mock to simulate a session expiration/401 error
      mockListingService.getMyListings.and.returnValue(
        throwError(() => ({ status: 401 })),
      );

      fixture.detectChanges(); // Triggers ngOnInit

      expect(component.isLoading).toBeFalse();
      expect(component.viewChange.emit).toHaveBeenCalledWith(
        ViewState.LOGIN as any,
      );
    });
  });

  // --- Category 2: Destructive Actions (Delete) ---
  describe('Delete Listing', () => {
    beforeEach(() => {
      fixture.detectChanges(); // Load initial data
      spyOn(window, 'confirm');
      spyOn(window, 'alert');
    });

    it('should cancel deletion if the user clicks Cancel in the confirm dialog', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false); // User clicks Cancel

      component.deleteListing(1);

      expect(mockListingService.deleteListing).not.toHaveBeenCalled();
      expect(component.myListings.length).toBe(2); // List remains unchanged
    });

    it('should delete the listing and instantly remove it from the UI if user clicks OK', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true); // User clicks OK

      component.deleteListing(1);

      expect(mockListingService.deleteListing).toHaveBeenCalledWith(1);
      expect(component.myListings.length).toBe(1); // One item removed
      expect(
        component.myListings.find((car) => car.car_id === 1),
      ).toBeUndefined();
    });

    it('should show an alert if the API delete request fails', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);
      mockListingService.deleteListing.and.returnValue(
        throwError(() => new Error('API failed')),
      );

      component.deleteListing(1);

      expect(window.alert).toHaveBeenCalledWith(
        'Failed to delete the listing.',
      );
      expect(component.myListings.length).toBe(2); // UI shouldn't change on failure
    });
  });

  // --- Category 3: Session Management (Logout) ---
  describe('Logout', () => {
    it('should clear local listings and redirect to login on successful logout', () => {
      fixture.detectChanges();

      component.logout();

      expect(component.myListings.length).toBe(0); // Clears data immediately
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(component.viewChange.emit).toHaveBeenCalledWith(
        ViewState.LOGIN as any,
      );
    });
  });

  // --- Category 4: Pagination logic ---
  describe('Pagination', () => {
    it('should correctly slice paginatedGarageListings', () => {
      // Generate 20 fake listings to test page overflow
      component.myListings = [];

      for (let i = 0; i < 20; i++) {
        component.myListings.push({
          car_id: i,
        });
      }
      component.currentPage = 2; // Jump to page 2 (should show items 15-19)

      const paged = component.paginatedGarageListings;

      expect(paged.length).toBe(5); // 20 total - 15 on page 1 = 5 on page 2
      expect(paged[0].car_id).toBe(15);
    });

    it('should update current page and scroll to top on page change', () => {
      const scrollToSpy = spyOn(window, 'scrollTo');

      component.onPageChange(3);

      expect(component.currentPage).toBe(3);
      expect(scrollToSpy as jasmine.Spy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });
  });
});
