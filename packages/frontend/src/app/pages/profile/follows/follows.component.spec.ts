import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowsComponent } from './follows.component';

describe('FollowsComponent', () => {
  let component: FollowsComponent;
  let fixture: ComponentFixture<FollowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FollowsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FollowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
