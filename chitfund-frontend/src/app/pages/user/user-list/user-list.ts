import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor } from '@angular/common';
import { User } from '../../../models/user.model';
import { UserService } from '../userService';
import { debounceTime, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  imports: [NgFor, FormsModule],
  standalone: true,
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList  implements OnInit {
  users: User[] = [];

  // pagination
  page = 1;
  limit = 10;
  limitOptions = [5, 10, 20, 50];
  totalPages = 0;
  totalRecords = 0;
  loading = false;

  // search
  searchTerm = '';
  filterBy: 'name' | 'phone' | 'email' = 'name';
  searchChanged = new Subject<string>();

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
    this.searchChanged.pipe(debounceTime(500)).subscribe(() => {
      this.page = 1;
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers(
      this.page,
      this.limit,
      this.searchTerm || undefined,
      this.searchTerm ? this.filterBy : undefined
    ).subscribe({
      next: (res) => {
        console.log('Users returned:', res.users);
        // Backend expected response shape:
        // { success:true, page, limit, totalPages, totalRecords, users: [...] }
        if (res && res.users) {
          this.users = res.users;
          this.totalRecords = res.totalRecords ?? res.total ?? 0;
          this.totalPages = res.totalPages ?? Math.ceil((this.totalRecords || 0) / this.limit);
        } else if (Array.isArray(res)) {
          // fallback if backend returns plain array
          this.users = res;
          this.totalRecords = res.length;
          this.totalPages = Math.ceil(this.totalRecords / this.limit);
        } else {
          // unexpected shape — be resilient
          this.users = res.data ?? res.users ?? [];
          this.totalRecords = res.totalRecords ?? this.users.length;
          this.totalPages = Math.ceil(this.totalRecords / this.limit);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.loading = false;
      }
    });
  }

  changePage(p: number) {
    if (p < 1 || (this.totalPages && p > this.totalPages)) return;
    this.page = p;
    this.loadUsers();
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadUsers();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadUsers();
    }
  }
  onSearchChange(value: string) {
  this.searchChanged.next(value); // emit the value to Subject
}

  onLimitChange(e: any) {
    this.limit = Number(e.target.value);
    this.page = 1;
    this.loadUsers();
  }

  onSearch() {
    this.page = 1;
    this.loadUsers();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterBy = 'name';
    this.page = 1;
    this.loadUsers();
  }

  // optional helper to format dates (if your user has createdAt)
  formatDate(d: any) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
  }

  // page list for pagination UI
  get pageList(): number[] {
    if (!this.totalPages) return [];
    const pages: number[] = [];
    const maxShown = 7;
    const start = Math.max(1, Math.min(this.page - Math.floor(maxShown / 2), this.totalPages - maxShown + 1));
    const end = Math.min(this.totalPages, start + maxShown - 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // navigation actions
  editUser(id: string) {
    this.router.navigate([`/dashboard/users/edit/${id}`]);
  }

  goToCreate() {
    this.router.navigate(['/dashboard/users/create']);
  }

  deleteUser(id: string) {
    this.userService.deleteUser(id).subscribe(() => {
      console.log('User deleted successfully');
      alert('User deleted successfully');
      this.loadUsers(); // reload after delete
    }, (error) => {
      console.error('Error deleting user:', error);
    });
  }
}