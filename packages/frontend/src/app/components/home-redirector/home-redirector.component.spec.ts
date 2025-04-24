import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeRedirectorComponent } from './home-redirector.component';

describe('HomeRedirectorComponent', () => {
  let component: HomeRedirectorComponent;
  let fixture: ComponentFixture<HomeRedirectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeRedirectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeRedirectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
