import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WafrnMediaComponent } from './wafrn-media.component';

describe('WafrnMediaComponent', () => {
  let component: WafrnMediaComponent;
  let fixture: ComponentFixture<WafrnMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WafrnMediaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WafrnMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
