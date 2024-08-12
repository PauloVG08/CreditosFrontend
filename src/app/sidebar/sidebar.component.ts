import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { LoginService } from '../services/login.service';
import { IUsuario } from '../interfaces/usuario';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterOutlet],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
    expandedMenu: string | null = null;
    usuario: IUsuario | null = null;
    errorMessage: any;
    idRol: number | undefined = 0;
    nombreRol: string | undefined = '';

    constructor(private router: Router, private loginService: LoginService) {}

    ngOnInit(): void {
        this.loginService.obtenerUsuario().subscribe(
            (data) => {
                this.usuario = data;
                this.nombreRol = this.obtenerNombreRol();
                console.log(this.nombreRol);
            },
            (error) => {
                this.errorMessage = error;
            }
        );
    }

    obtenerNombreRol(): string | undefined {
        let nombreRol: string | undefined;
        switch (this.usuario?.idRol) {
            case 1:
                nombreRol = 'Administrador';
                break;
            case 2:
                nombreRol = 'Promotor';
                break;
            case 3:
                nombreRol = 'Administrador de la empresa';
                break;
            case 4:
                nombreRol = 'Agente de clientes';
                break;
            case 5:
                nombreRol = 'Agente de créditos';
                break;
            case 6:
                nombreRol = 'Agente de cobranza';
                break;
            default:
                return undefined;
        }
    
        this.nombreRol = nombreRol;
        return nombreRol;
    }
    

    getImageUrl(base64String: string | undefined): string {
        if (base64String) {
            base64String = this.limpiarBase64(base64String);
            return `data:image/${this.obtenerTipoImagen(base64String)};base64,${base64String}`;
        }
        return '/assets/images/user.jpg';
    }

    limpiarBase64(base64String: string): string {
        if (base64String.startsWith('data:image/jpeg;base64,')) {
            return base64String.replace('data:image/jpeg;base64,', '');
        }
        if (base64String.startsWith('data:image/png;base64,')) {
            return base64String.replace('data:image/png;base64,', '');
        }
        if (base64String.startsWith('data:image/gif;base64,')) {
            return base64String.replace('data:image/gif;base64,', '');
        }
        if (base64String.startsWith('data:image/webp;base64,')) {
            return base64String.replace('data:image/webp;base64,', '');
        }
        return base64String; 
    }

    obtenerTipoImagen(base64String: string): string {
        if (base64String.charAt(0) === '/') return 'jpeg';
        if (base64String.charAt(0) === 'i') return 'png';
        if (base64String.charAt(0) === 'R') return 'gif';
        if (base64String.charAt(0) === 'U') return 'webp';
        return 'jpeg';
    }

    toggleMenu(menu: string): void {
        if (this.expandedMenu === menu) {
            this.expandedMenu = null;
        } else {
            this.expandedMenu = menu;
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }
}
