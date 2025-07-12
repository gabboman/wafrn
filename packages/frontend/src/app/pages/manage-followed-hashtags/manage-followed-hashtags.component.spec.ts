import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageFollowedHashtagsComponent } from './manage-followed-hashtags.component';

describe('ManageFollowedHashtagsComponent', () => {
  let component: ManageFollowedHashtagsComponent;
  let fixture: ComponentFixture<ManageFollowedHashtagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageFollowedHashtagsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageFollowedHashtagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
