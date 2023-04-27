import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleNotificationComponent } from './single-notification.component';

describe('SingleNotificationComponent', () => {
  let component: SingleNotificationComponent;
  let fixture: ComponentFixture<SingleNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SingleNotificationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
