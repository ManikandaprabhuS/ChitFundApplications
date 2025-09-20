import { Component } from '@angular/core';
import { User } from '../../../models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../userService';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-edit',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.css'
})
export class UserEdit {

  userId!: string;
   user: User = {
     name: '',
     username: '',
     email: '',
     phone: '',
     address: '',
     pincode: '',
     role: 'user',
     _id: '',
     password: ''
   };

   constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id')!;
    console.log('Editing user with ID:', this.userId);
    this.loadUser();
  }

  loadUser() {
    console.log('Loading user with ID:', this.userId);
    this.userService.getUserById(this.userId).subscribe((res: any) => {
      console.log(res);
      this.user = res;
    }, error => {
      console.error('Error loading user:', error);
    });
  }

  updateUser() {
    this.userService.updateUser(this.userId, this.user).subscribe(() => {
      console.log('User updated successfully');
      alert('User updated successfully');
      this.router.navigate(['/dashboard/users']);
    }, (error) => {
      console.error('Error updating user:', error);
    });
  }

  cancel() {
    this.router.navigate(['/dashboard/users']); // Navigate back to user list
  }
}
