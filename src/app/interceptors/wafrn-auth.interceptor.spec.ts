import { TestBed } from '@angular/core/testing';

import { WafrnAuthInterceptor } from './wafrn-auth.interceptor';

describe('WafrnAuthInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      WafrnAuthInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: WafrnAuthInterceptor = TestBed.inject(WafrnAuthInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
