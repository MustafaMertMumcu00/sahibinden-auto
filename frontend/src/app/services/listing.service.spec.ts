import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ListingService, Listing } from './listing.service';

describe('ListingService', () => {
  let service: ListingService;
  let httpMock: HttpTestingController;

  const expectedApiUrl = 'http://localhost:5000/api/listings';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ListingService]
    });

    service = TestBed.inject(ListingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Category: Public Marketplace Listings ---
  describe('getAllPublicListings()', () => {
    it('should send a GET request to the root /api/listings URL', () => {
      const mockListings = [
        { car_id: 1, brand: 'Toyota', model: 'Corolla', price: 500000 },
        { car_id: 2, brand: 'BMW', model: '320i', price: 900000 }
      ];

      service.getAllPublicListings().subscribe(listings => {
        expect(listings.length).toBe(2);
        expect(listings).toEqual(mockListings);
      });

      const req = httpMock.expectOne(expectedApiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBeTrue();

      req.flush(mockListings);
    });
  });

  // --- Category: Authenticated User Garage Listings ---
  describe('getMyListings()', () => {
    it('should send a GET request to the scoped /api/listings/me endpoint', () => {
      const mockUserListings = [
        { car_id: 1, brand: 'Toyota', model: 'Corolla', price: 500000 }
      ];

      service.getMyListings().subscribe(listings => {
        expect(listings.length).toBe(1);
        expect(listings).toEqual(mockUserListings);
      });

      const req = httpMock.expectOne(`${expectedApiUrl}/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBeTrue();

      req.flush(mockUserListings);
    });
  });

  // --- Category: Create Listing ---
  describe('createListing()', () => {
    it('should send a POST request with the new listing payload', () => {
      const newListingPayload: Listing = {
        brand_id: 1,
        model_id: 2,
        fuel_id: 1,
        year: 2022,
        km: 30000,
        price: 750000
      };

      const mockResponse = { message: 'Listing created successfully', car_id: 10 };

      service.createListing(newListingPayload).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(expectedApiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newListingPayload);
      expect(req.request.withCredentials).toBeTrue();

      req.flush(mockResponse);
    });
  });

  // --- Category: Delete Listing ---
  describe('deleteListing()', () => {
    it('should send a DELETE request targeting the specific car resource URL', () => {
      const carIdToDelete = 15;
      const mockResponse = { message: 'Listing deleted successfully' };

      service.deleteListing(carIdToDelete).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${expectedApiUrl}/${carIdToDelete}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBeTrue();

      req.flush(mockResponse);
    });
  });
});
