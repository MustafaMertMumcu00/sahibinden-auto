import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { ViewState } from '../../enums/view-state.enum';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent] // Standalone components go in imports, not declarations
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Test: Initialization
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // Test: Default Input State
  it('should have isLoggedIn default to false', () => {
    expect(component.isLoggedIn).toBeFalse();
  });

  // Test: Output Emission
  it('should emit the correct ViewState when selectView is called', () => {
    // Arrange: Spy on the EventEmitter to track if it gets called
    spyOn(component.viewChange, 'emit');

    // Using a mock view state
    const targetView = ViewState.ALL_CARS;

    // Act: Trigger the method exactly as the HTML template would
    component.selectView(targetView);

    // Assert: Verify the event went out with the exact data requested
    expect(component.viewChange.emit).toHaveBeenCalledWith(targetView);
  });
});
