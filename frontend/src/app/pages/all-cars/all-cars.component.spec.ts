import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  flush,
} from '@angular/core/testing';
import { AllCarsComponent } from './all-cars.component';
import { ListingService } from '../../services/listing.service';
import { RabbitMqService } from '../../services/rabbit-mq.service';
import { of, Subject } from 'rxjs';
import { ViewState } from '../../enums/view-state.enum';

describe('AllCarsComponent', () => {
  let component: AllCarsComponent;
  let fixture: ComponentFixture<AllCarsComponent>;
  let mockListingService: any;
  let rabbitMqSubject: Subject<any[]>;

  // Generate 20 mock cars to test pagination spanning multiple pages
  const mockCars: any[] = [];

  for (let i = 0; i < 20; i++) {
    mockCars.push({
      car_id: i + 1,
      brand: 'Brand',
      model: `Model ${i + 1}`,
      price: 1000,
      old_price: null,
    });
  }

  beforeEach(async () => {
    rabbitMqSubject = new Subject<any[]>();

    mockListingService = {
      getAllPublicListings: jasmine
        .createSpy('getAllPublicListings')
        .and.returnValue(of(mockCars)),
    };

    const mockRabbitMqService = {
      priceDrops$: rabbitMqSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [AllCarsComponent], // Includes PaginationComponent automatically since it's in imports
      providers: [
        { provide: ListingService, useValue: mockListingService },
        { provide: RabbitMqService, useValue: mockRabbitMqService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AllCarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Triggers ngOnInit
  });

  // --- Category 1: Math & Utilities ---
  describe('Utility Methods', () => {
    it('should correctly calculate the discount percentage', () => {
      expect(component.getDiscountPercentage(100, 80)).toBe(20);
      expect(component.getDiscountPercentage(50000, 45000)).toBe(10);
    });

    it('should return 0 if prices are invalid or missing', () => {
      expect(component.getDiscountPercentage(0, 80)).toBe(0);
      expect(component.getDiscountPercentage(100, 0)).toBe(0);
    });
  });

  // --- Category 2: RabbitMQ Data Sync & Queue Management ---
  describe('RabbitMQ Queue Logic', () => {
    it('should update the table prices when a discount arrives', () => {
      // Act: Simulate RabbitMQ sending a discount for car_id 1
      rabbitMqSubject.next([{ car_id: 1, old_price: 1000, new_price: 800 }]);

      // Assert: The actual car data in the array should be mutated
      const updatedCar = component.publicListings.find((c) => c.car_id === 1);
      expect(updatedCar.old_price).toBe(1000);
      expect(updatedCar.price).toBe(800);
    });

    it('should show a maximum of 3 notifications at once and queue the rest', () => {
      // Act: Send 5 discounts simultaneously
      const discounts = [
        { car_id: 1 },
        { car_id: 2 },
        { car_id: 3 },
        { car_id: 4 },
        { car_id: 5 },
      ];
      rabbitMqSubject.next(discounts);

      // Assert: 3 active on screen, 2 waiting in the invisible queue
      expect(component.activeOpportunities.length).toBe(3);
      expect(component.opportunityQueue.length).toBe(2);
    });

    it('should remove banner after animation and process the next item in queue', fakeAsync(() => {
      // Arrange: Send 4 items. 3 active, 1 queued.
      rabbitMqSubject.next([
        { car_id: 1 },
        { car_id: 2 },
        { car_id: 3 },
        { car_id: 4 },
      ]);

      const itemToClose = component.activeOpportunities[0];

      // Act: Manually close one
      component.closeOpportunity(itemToClose);
      expect(itemToClose.closing).toBeTrue();

      // Fast-forward time by 300ms (the CSS animation delay)
      tick(300);

      // Assert: Item 1 is gone, Item 4 was pulled from the queue
      expect(component.activeOpportunities.length).toBe(3);
      expect(
        component.activeOpportunities.some(
          (opp) => opp.car_id === itemToClose.car_id,
        ),
      ).toBeFalse();
      expect(component.opportunityQueue.length).toBe(0); // Queue is empty now

      flush(); // Clean up
    }));
  });

  // --- Category 3: Pagination Navigation from Notifications ---
  describe('Notification Click Navigation', () => {
    it('should jump to the correct page and set the highlight ID when a notification is clicked', fakeAsync(() => {
      // Arrange: We have 20 cars. 15 per page. Car ID 18 is on Page 2.
      const targetCarId = 18;

      // Setup mock DOM element for scrollIntoView
      const mockElement = document.createElement('div');
      spyOn(mockElement, 'scrollIntoView');
      spyOn(document, 'getElementById').and.returnValue(mockElement);

      // Act: Click a notification for Car 18
      component.onNotificationClick({ car_id: targetCarId });

      // Assert Step 1: Page should change immediately
      expect(component.currentPage).toBe(2);
      expect(component.highlightedCarId).toBe(targetCarId);

      // Assert Step 2: Fast-forward 100ms to allow DOM to render and scrolling to fire
      tick(100);
      expect(document.getElementById).toHaveBeenCalledWith('car-18');
      expect(mockElement.scrollIntoView).toHaveBeenCalled();

      // Assert Step 3: Fast-forward 2000ms for highlight removal
      tick(2000);
      expect(component.highlightedCarId).toBeNull();
    }));

    it('should do nothing if the car does not exist in the public listings', () => {
      component.currentPage = 1;
      component.onNotificationClick({ car_id: 999 }); // Non-existent car
      expect(component.currentPage).toBe(1); // Page shouldn't change
      expect(component.highlightedCarId).toBeNull();
    });
  });
});
