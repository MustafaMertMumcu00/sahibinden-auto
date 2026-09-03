import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ViewState } from './enums/view-state.enum';
import { RabbitMqService } from './services/rabbit-mq.service';
import { ListingService } from './services/listing.service';
import { AuthService } from './services/auth.service';
import { CatalogService } from './services/catalog.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    // Mock services to prevent child components from making real API/WebSocket calls
    const mockRabbitMqService = { priceDrops$: of([]) };
    const mockListingService = {
      getAllPublicListings: jasmine.createSpy('getAllPublicListings').and.returnValue(of([])),
      getMyListings: jasmine.createSpy('getMyListings').and.returnValue(of([]))
    };
    const mockAuthService = {};
    const mockCatalogService = {
      getBrands: jasmine.createSpy('getBrands').and.returnValue(of([])),
      getFuels: jasmine.createSpy('getFuels').and.returnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: RabbitMqService, useValue: mockRabbitMqService },
        { provide: ListingService, useValue: mockListingService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: CatalogService, useValue: mockCatalogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Category: Initialization ---
  describe('Initialization', () => {
    it('should create the app', () => {
      expect(component).toBeTruthy();
    });

    it('should default to the ALL_CARS view and not be logged in', () => {
      expect(component.currentView).toBe(ViewState.ALL_CARS);
      expect(component.isLoggedIn).toBeFalse();
    });
  });

  // Category: View & State Management ---
  describe('onViewChange()', () => {
    it('should set isLoggedIn to true when navigating to HOME', () => {
      component.onViewChange(ViewState.HOME);
      expect(component.currentView).toBe(ViewState.HOME);
      expect(component.isLoggedIn).toBeTrue();
    });

    it('should set isLoggedIn to true when navigating to POST_LISTING', () => {
      component.onViewChange(ViewState.POST_LISTING);
      expect(component.currentView).toBe(ViewState.POST_LISTING);
      expect(component.isLoggedIn).toBeTrue();
    });

    it('should set isLoggedIn to false when navigating to LOGIN', () => {
      // Simulate being logged in first
      component.isLoggedIn = true;

      component.onViewChange(ViewState.LOGIN);

      expect(component.currentView).toBe(ViewState.LOGIN);
      expect(component.isLoggedIn).toBeFalse();
    });

    it('should set isLoggedIn to false when navigating to REGISTER', () => {
      component.isLoggedIn = true;

      component.onViewChange(ViewState.REGISTER);

      expect(component.currentView).toBe(ViewState.REGISTER);
      expect(component.isLoggedIn).toBeFalse();
    });

    it('should update currentView but leave isLoggedIn unchanged if navigating back to ALL_CARS', () => {
      // Simulate user logged in, viewing their garage
      component.isLoggedIn = true;

      // User navigates back to the public marketplace
      component.onViewChange(ViewState.ALL_CARS);

      expect(component.currentView).toBe(ViewState.ALL_CARS);
      expect(component.isLoggedIn).toBeTrue(); // They shouldn't be logged out just by visiting the homepage
    });
  });
});
