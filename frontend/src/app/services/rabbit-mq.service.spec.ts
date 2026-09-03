import { TestBed } from '@angular/core/testing';
import { RabbitMqService } from './rabbit-mq.service';
import { Subject } from 'rxjs';
import { RxStomp } from '@stomp/rx-stomp';

describe('RabbitMqService', () => {
  let service: RabbitMqService;
  let messageSubject: Subject<any>;
  let mockRxStomp: jasmine.SpyObj<RxStomp>;

  beforeEach(() => {
    messageSubject = new Subject<any>();

    // Create a spy object for RxStomp methods
    mockRxStomp = jasmine.createSpyObj('RxStomp', ['configure', 'activate', 'watch']);
    mockRxStomp.watch.and.returnValue(messageSubject.asObservable());

    // Intercept RxStomp constructor calls to return our mock instance
    spyOn(RxStomp.prototype, 'configure').and.callFake(mockRxStomp.configure);
    spyOn(RxStomp.prototype, 'activate').and.callFake(mockRxStomp.activate);
    spyOn(RxStomp.prototype, 'watch').and.callFake(mockRxStomp.watch);

    TestBed.configureTestingModule({
      providers: [RabbitMqService]
    });

    service = TestBed.inject(RabbitMqService);
  });

  it('should be created and activate STOMP connection', () => {
    expect(service).toBeTruthy();
    expect(RxStomp.prototype.configure).toHaveBeenCalled();
    expect(RxStomp.prototype.activate).toHaveBeenCalled();
    expect(RxStomp.prototype.watch).toHaveBeenCalledWith('/exchange/price_drops');
  });

  // --- Category: Initial State ---
  describe('priceDrops$', () => {
    it('should initialize with an empty array', (done) => {
      service.priceDrops$.subscribe((drops) => {
        expect(drops).toEqual([]);
        done();
      });
    });

    // --- Category: Processing Incoming Messages ---
    it('should append incoming STOMP message payloads to priceDrops$', (done) => {
      const mockDiscount = { car_id: 1, old_price: 100000, new_price: 85000 };
      const mockStompMessage = { body: JSON.stringify(mockDiscount) };

      let emissionCount = 0;

      service.priceDrops$.subscribe((drops) => {
        emissionCount++;
        // Skip the initial BehaviorSubject value []
        if (emissionCount === 2) {
          expect(drops.length).toBe(1);
          expect(drops[0]).toEqual(mockDiscount);
          done();
        }
      });

      // Simulate incoming message over WebSocket
      messageSubject.next(mockStompMessage);
    });

    it('should accumulate multiple incoming price drop notifications in sequence', (done) => {
      const discount1 = { car_id: 1, new_price: 80000 };
      const discount2 = { car_id: 2, new_price: 450000 };

      let emissionCount = 0;

      service.priceDrops$.subscribe((drops) => {
        emissionCount++;
        if (emissionCount === 3) {
          expect(drops.length).toBe(2);
          expect(drops[0]).toEqual(discount1);
          expect(drops[1]).toEqual(discount2);
          done();
        }
      });

      messageSubject.next({ body: JSON.stringify(discount1) });
      messageSubject.next({ body: JSON.stringify(discount2) });
    });
  });
});
