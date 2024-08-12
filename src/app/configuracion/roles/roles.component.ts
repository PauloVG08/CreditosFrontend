import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IRol } from '../../interfaces/rol';
import { RolesService } from '../../services/roles.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
  roles: IRol[] = [];

  constructor(
    private rolService: RolesService,
    private toastr: ToastrService,
  ) {
  }
  obtenerRoles() {
    this.rolService.getRoles().subscribe({
        next: (roles) => {
            this.roles = roles;
        },
        error: (error) => {
            this.toastr.error('No se pudieron obtener los pagos. Inténtelo de nuevo más tarde.', 'Error');
        }
    })
  }

  ngOnInit(): void {
    this.obtenerRoles();
  }

}
