import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarSmallComponent } from './avatar-small.component';

describe('AvatarSmallComponent', () => {
  let component: AvatarSmallComponent;
  let fixture: ComponentFixture<AvatarSmallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarSmallComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarSmallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
