import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../subscription.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './subscription-list.html',
  styleUrl: './subscription-list.css'
})
export class SubscriptionList implements OnInit {

  subscriptions: any[] = [];
  page = 1;
  limit = 10;
  limitOptions = [5, 10, 20, 50];
  totalPages = 0;
  totalRecords = 0;
  loading = false;

  // search UI
  searchTerm = '';
  filterBy: 'username' | 'phone' | 'planId' | 'status' = 'username';

  searchChanged = new Subject<string>();

  constructor(private subscriptionService: SubscriptionService) { }


  ngOnInit(): void {
    this.loadSubscriptions();
    this.searchChanged.pipe(debounceTime(500)).subscribe(() => {
      this.page = 1;
      this.loadSubscriptions();
    });
  }

  loadSubscriptions(): void {
    this.loading = true;
    this.subscriptionService.getSubscriptions(this.page, this.limit, this.searchTerm || undefined, this.searchTerm ? this.filterBy : undefined)
      .subscribe({
        next: (res) => {
          // Backend expected response shape:
          // { success:true, page, limit, totalPages, totalRecords, subscriptions: [...] }
          if (res && res.subscriptions) {
            this.subscriptions = res.subscriptions;
            this.totalRecords = res.totalRecords ?? res.total ?? 0;
            this.totalPages = res.totalPages ?? Math.ceil((this.totalRecords || 0) / this.limit);
          } else if (Array.isArray(res)) {
            // fallback if backend returns plain array
            this.subscriptions = res;
            this.totalRecords = res.length;
            this.totalPages = Math.ceil(this.totalRecords / this.limit);
          } else {
            // unexpected shape — try to be resilient
            this.subscriptions = res.data ?? res.subscriptions ?? [];
            this.totalRecords = res.totalRecords ?? this.subscriptions.length;
            this.totalPages = Math.ceil(this.totalRecords / this.limit);
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load subscriptions', err);
          this.loading = false;
        }
      });
  }

  changePage(p: number) {
    if (p < 1 || (this.totalPages && p > this.totalPages)) return;
    this.page = p;
    this.loadSubscriptions();
  }

  next() { if (this.page < this.totalPages) { this.page++; this.loadSubscriptions(); } }
  prev() { if (this.page > 1) { this.page--; this.loadSubscriptions(); } }

  onLimitChange(e: any) {
    this.limit = Number(e.target.value);
    this.page = 1;
    this.loadSubscriptions();
  }

  onSearch() {
    this.page = 1;
    this.loadSubscriptions();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterBy = 'username';
    this.page = 1;
    this.loadSubscriptions();
  }

  // helper to display a short date safely
  formatDate(d: any) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
  }

  // optional: return array of page numbers for clickable pages
  get pageList(): number[] {
    if (!this.totalPages) return [];
    const pages: number[] = [];
    const maxShown = 7;
    const start = Math.max(1, Math.min(this.page - Math.floor(maxShown / 2), this.totalPages - maxShown + 1));
    const end = Math.min(this.totalPages, start + maxShown - 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
