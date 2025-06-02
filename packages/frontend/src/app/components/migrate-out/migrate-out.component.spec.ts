import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MigrateOutComponent } from './migrate-out.component';

describe('MigrateOutComponent', () => {
  let component: MigrateOutComponent;
  let fixture: ComponentFixture<MigrateOutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MigrateOutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MigrateOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
