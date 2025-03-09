import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkPreviewComponent } from './link-preview.component';

describe('LinkPreviewComponent', () => {
  let component: LinkPreviewComponent;
  let fixture: ComponentFixture<LinkPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinkPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
