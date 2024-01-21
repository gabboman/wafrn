import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingUsersComponent } from './pending-users.component';

describe('PendingUsersComponent', () => {
  let component: PendingUsersComponent;
  let fixture: ComponentFixture<PendingUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingUsersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PendingUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
