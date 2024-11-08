import { Component, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagosService } from '../services/pagos.service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-notificaciones',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './notificaciones.component.html',
    styleUrls: ['./notificaciones.component.scss']
})
export class NotificacionesComponent implements OnInit {
    amortizacionesProximas: any[] = [];

    constructor(private pagosService: PagosService) {}

    ngOnInit(): void {
        this.pagosService.getAmortizacionesProximasAVencer().subscribe({
            next: (data) => {
                this.amortizacionesProximas = data;
            },
            error: (error) => console.error('Error fetching amortizations:', error)
        });
    }
}
