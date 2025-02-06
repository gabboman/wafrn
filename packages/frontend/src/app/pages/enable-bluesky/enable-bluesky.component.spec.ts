import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableBlueskyComponent } from './enable-bluesky.component';

describe('EnableBlueskyComponent', () => {
  let component: EnableBlueskyComponent;
  let fixture: ComponentFixture<EnableBlueskyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnableBlueskyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnableBlueskyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
