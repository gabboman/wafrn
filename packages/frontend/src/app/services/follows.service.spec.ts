import { TestBed } from '@angular/core/testing';

import { FollowsService } from './follows.service';

describe('FollowsService', () => {
  let service: FollowsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FollowsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
