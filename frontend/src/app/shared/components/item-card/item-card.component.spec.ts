import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ItemCardComponent } from './item-card.component';
import { Item } from '../../../core/models';

describe('ItemCardComponent', () => {
  let component: ItemCardComponent;
  let fixture: ComponentFixture<ItemCardComponent>;

  const mockItem: Item = {
    id: '1',
    title: 'Test Item',
    description: 'Test Description',
    category: 'bags',
    status: 'lost',
    imageUrl: 'test.jpg',
    date: '2024-01-01',
    time: '10:00',
    location: 'Test Location',
    contactName: 'Test User',
    contactPhone: '08123456789',
    createdAt: new Date()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemCardComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ItemCardComponent);
    component = fixture.componentInstance;
    component.item = mockItem;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display item title', () => {
    expect(component.item.title).toBe('Test Item');
  });
});
