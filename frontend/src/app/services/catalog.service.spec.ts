import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  const expectedApiUrl = 'http://localhost:5000/api/catalog';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CatalogService]
    });

    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Category: Brands ---
  describe('getBrands()', () => {
    it('should send a GET request to fetch all car brands', () => {
      const mockBrands = [
        { brand_id: 1, brand_name: 'Toyota' },
        { brand_id: 2, brand_name: 'BMW' }
      ];

      service.getBrands().subscribe(brands => {
        expect(brands.length).toBe(2);
        expect(brands).toEqual(mockBrands);
      });

      const req = httpMock.expectOne(`${expectedApiUrl}/brands`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBeTrue();

      req.flush(mockBrands);
    });
  });

  // --- Category: Nested Models by Brand ---
  describe('getModelsByBrand()', () => {
    it('should send a GET request to the RESTful nested endpoint /brands/:id/models', () => {
      const brandId = 1;
      const mockModels = [
        { model_id: 10, model_name: 'Corolla' },
        { model_id: 11, model_name: 'Yaris' }
      ];

      service.getModelsByBrand(brandId).subscribe(models => {
        expect(models.length).toBe(2);
        expect(models).toEqual(mockModels);
      });

      // Verifies the exact RESTful URL hierarchy
      const req = httpMock.expectOne(`${expectedApiUrl}/brands/${brandId}/models`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBeTrue();

      req.flush(mockModels);
    });
  });

  // --- Category: Fuels ---
  describe('getFuels()', () => {
    it('should send a GET request to fetch fuel options', () => {
      const mockFuels = [
        { fuel_id: 1, fuel_type: 'Gasoline' },
        { fuel_id: 2, fuel_type: 'Electric' }
      ];

      service.getFuels().subscribe(fuels => {
        expect(fuels.length).toBe(2);
        expect(fuels).toEqual(mockFuels);
      });

      const req = httpMock.expectOne(`${expectedApiUrl}/fuels`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBeTrue();

      req.flush(mockFuels);
    });
  });
});
