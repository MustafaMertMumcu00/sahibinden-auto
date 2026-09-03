import { Injectable } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import { BehaviorSubject, Observable } from 'rxjs';

const rxStompConfig: RxStompConfig = {
  brokerURL: 'ws://localhost:15674/ws',
  connectHeaders: {
    login: 'guest',
    passcode: 'guest',
  },
  heartbeatIncoming: 0,
  heartbeatOutgoing: 20000,
  reconnectDelay: 5000,
};

@Injectable({
  providedIn: 'root'
})
export class RabbitMqService {
  private rxStomp: RxStomp;

  private priceDropSubject = new BehaviorSubject<any[]>([]);
  public priceDrops$: Observable<any[]> = this.priceDropSubject.asObservable();

  constructor() {
    this.rxStomp = new RxStomp();
    this.rxStomp.configure(rxStompConfig);
    this.rxStomp.activate();

    this.rxStomp
      .watch('/exchange/price_drops')
      .subscribe((message) => {

        const discountData = JSON.parse(message.body);
        const currentPriceDrops = this.priceDropSubject.value;

        currentPriceDrops.push(discountData);

        this.priceDropSubject.next(currentPriceDrops);
      });
  }
}



