import { TestBed } from '@angular/core/testing';
import { Plan } from '../../models/plan.model';
import { PlanService } from './plan';

describe('PlanService', () => {
  let service: PlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
