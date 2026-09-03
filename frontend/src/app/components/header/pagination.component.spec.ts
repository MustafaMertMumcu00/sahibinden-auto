import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;

    // Set default standard values for most tests
    component.currentPage = 1;
    component.itemsPerPage = 15;
    component.totalItems = 150; // 10 pages total
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Total Pages Calculation ---
  describe('totalPages', () => {
    it('should correctly calculate total pages with a remainder', () => {
      component.totalItems = 35; // 35 / 15 = 2.33 -> 3 pages
      expect(component.totalPages).toBe(3);
    });

    it('should return 1 when totalItems is 0 to prevent empty pagination', () => {
      component.totalItems = 0;
      expect(component.totalPages).toBe(1);
    });
  });

  // --- Sliding Window Logic (visiblePages) ---
  describe('visiblePages', () => {
    it('should show pages 1 to 5 when near the start', () => {
      component.currentPage = 2;
      expect(component.visiblePages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should center the active page when in the middle', () => {
      component.currentPage = 5;
      // 5-2 to 5+2 = [3, 4, 5, 6, 7]
      expect(component.visiblePages).toEqual([3, 4, 5, 6, 7]);
    });

    it('should stick to the end bound when near the last page', () => {
      component.currentPage = 9; // Total pages is 10
      // 10-4 to 10 = [6, 7, 8, 9, 10]
      expect(component.visiblePages).toEqual([6, 7, 8, 9, 10]);
    });

    it('should return fewer than 5 pages if totalPages is less than 5', () => {
      component.totalItems = 30; // 30 / 15 = 2 pages
      expect(component.visiblePages).toEqual([1, 2]);
    });
  });

  // --- Navigation Output Logic (goToPage) ---
  describe('goToPage', () => {
    beforeEach(() => {
      spyOn(component.pageChange, 'emit');
    });

    it('should emit pageChange for a valid new page', () => {
      component.goToPage(3);
      expect(component.pageChange.emit).toHaveBeenCalledWith(3);
    });

    it('should NOT emit if the target page is the current page', () => {
      component.goToPage(1); // Already on page 1
      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });

    it('should NOT emit if target page is less than 1', () => {
      component.goToPage(0);
      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });

    it('should NOT emit if target page exceeds totalPages', () => {
      component.goToPage(11); // Max is 10
      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });
  });
});
