import { Component, OnInit } from '@angular/core';
import { Plan } from '../../../models/plan.model';
import { PlanService } from '../plan';
import { Router } from '@angular/router';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-plan-list',
  imports: [NgFor],
  standalone: true,
  templateUrl: './plan-list.html',
  styleUrl: './plan-list.css'
})
export class PlanList implements OnInit{
  plans: any[] = [];

  constructor(private planService: PlanService, private router: Router) {}

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.planService.getPlans().subscribe((data: any) => {
      console.log(data);
      this.plans = data;
    }, error => {
      console.error('Error loading plans:', error);
    });
  }
  deletePlan(id: string) {
    if (confirm('Are you sure you want to delete this plan?')) {
      this.planService.deletePlan(id).subscribe(() => {
        console.log('Plan deleted successfully');
        alert('Plan deleted successfully');
        this.loadPlans();
      }, error => {
        console.error('Error deleting plan:', error);
      });
    }
  }
editPlan(id: string) {
  //alert('Plan edit function called for ID: ' + id);
    this.router.navigate([`/dashboard/plans/edit/${id}`]);
  }
goToCreate() {
    this.router.navigate(['/dashboard/plans/create']);
  }

}
