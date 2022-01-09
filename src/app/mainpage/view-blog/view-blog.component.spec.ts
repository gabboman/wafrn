import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewBlogComponent } from './view-blog.component';

describe('ViewBlogComponent', () => {
  let component: ViewBlogComponent;
  let fixture: ComponentFixture<ViewBlogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewBlogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewBlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
