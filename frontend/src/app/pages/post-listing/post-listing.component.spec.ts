import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostListingComponent } from './post-listing.component';
import { ListingService } from '../../services/listing.service';
import { CatalogService } from '../../services/catalog.service';
import { ViewState } from '../../enums/view-state.enum';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('PostListingComponent', () => {
  let component: PostListingComponent;
  let fixture: ComponentFixture<PostListingComponent>;
  let mockListingService: any;
  let mockCatalogService: any;

  beforeEach(async () => {
    // Create Mocks for Catalog and Listing services
    mockCatalogService = {
      getBrands: jasmine.createSpy('getBrands').and.returnValue(of([{ brand_id: 1, brand_name: 'Toyota' }])),
      getFuels: jasmine.createSpy('getFuels').and.returnValue(of([{ fuel_id: 1, fuel_name: 'Petrol' }])),
      getModelsByBrand: jasmine.createSpy('getModelsByBrand').and.returnValue(of([{ model_id: 1, model_name: 'Corolla' }]))
    };

    mockListingService = {
      createListing: jasmine.createSpy('createListing').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [PostListingComponent, FormsModule],
      providers: [
        { provide: ListingService, useValue: mockListingService },
        { provide: CatalogService, useValue: mockCatalogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PostListingComponent);
    component = fixture.componentInstance;

    // Spy on the global alert and ViewState emitter
    spyOn(window, 'alert');
    spyOn(component.viewChange, 'emit');
  });

  // --- Category: Initialization ---
  describe('Initialization', () => {
    it('should load brands and fuels from the catalog service on init', () => {
      fixture.detectChanges(); // Triggers ngOnInit -> loadCatalogData

      expect(mockCatalogService.getBrands).toHaveBeenCalled();
      expect(mockCatalogService.getFuels).toHaveBeenCalled();
      expect(component.brands.length).toBe(1);
      expect(component.fuels.length).toBe(1);
    });
  });

  // --- Category: Dependent Dropdown Logic ---
  describe('Brand Selection (Dependent Dropdown)', () => {
    it('should clear models and model_id, then fetch new models when a brand is selected', () => {
      // Simulate previously selected data
      component.model_id = 99;
      component.models = [{ model_id: 99, model_name: 'Old Model' }];

      // Simulate user picking Brand ID 1
      component.brand_id = 1;
      component.onBrandSelect();

      expect(component.model_id).toBeNull(); // Verifies the UI selection is reset
      expect(mockCatalogService.getModelsByBrand).toHaveBeenCalledWith(1);
      expect(component.models[0].model_name).toBe('Corolla'); // Gets the new mock data
    });

    it('should only clear models but NOT fetch if the user deselects a brand', () => {
      component.brand_id = null; // User returns dropdown to default empty state
      component.onBrandSelect();

      expect(component.models.length).toBe(0);
      expect(mockCatalogService.getModelsByBrand).not.toHaveBeenCalled();
    });
  });

  // --- Form Validation & Submission ---
  describe('Form Submission', () => {
    it('should abort and show an alert if any field is missing', () => {
      // Partially fill the form
      component.brand_id = 1;
      component.model_id = 1;
      component.fuel_id = null; // Missing fuel

      component.onSubmit();

      expect(window.alert).toHaveBeenCalledWith('Please fill in all fields before publishing.');
      expect(mockListingService.createListing).not.toHaveBeenCalled();
    });

    it('should successfully submit casted numbers, show alert, and navigate Home', () => {
      // Angular's <select> often binds values as strings.
      // We must prove the component casts them safely back to numbers for PostgreSQL.
      component.brand_id = '1' as any;
      component.model_id = '1' as any;
      component.fuel_id = '1' as any;
      component.year = '2023' as any;
      component.km = '15000' as any;
      component.price = '950000' as any;

      component.onSubmit();

      expect(component.isSubmitting).toBeFalse();
      expect(window.alert).toHaveBeenCalledWith('Listing created successfully!');

      // Verify payload is strictly numbers
      expect(mockListingService.createListing).toHaveBeenCalledWith({
        brand_id: 1,
        model_id: 1,
        fuel_id: 1,
        year: 2023,
        km: 15000,
        price: 950000
      });

      expect(component.viewChange.emit).toHaveBeenCalledWith(ViewState.HOME as any);
    });

    it('should alert the user and stop loading if the API request fails', () => {
      // Mock an API failure (e.g. 401 Unauthorized)
      mockListingService.createListing.and.returnValue(throwError(() => new Error('API Error')));

      component.brand_id = 1;
      component.model_id = 1;
      component.fuel_id = 1;
      component.year = 2020;
      component.km = 50000;
      component.price = 500000;

      component.onSubmit();

      expect(component.isSubmitting).toBeFalse();
      expect(window.alert).toHaveBeenCalledWith('Failed to create listing. Please ensure you are logged in.');
      expect(component.viewChange.emit).not.toHaveBeenCalled();
    });
  });
});
