import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { CreditosService } from '../services/creditos.service';
import { ToastrService } from 'ngx-toastr';
import { DashboardService } from '../services/dashboard.service';
import { LoginService } from '../services/login.service';

Chart.register(...registerables);

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    idEmpresa: number = 0;
    totalMes: number = 0;
    statusChart: any;
    amortizationChart: any;
    paymentChart: any;

    constructor(
        private creditosService: CreditosService,
        private toastr: ToastrService,
        private dashboardService: DashboardService,
        private loginService: LoginService
    ) {}

    async ngOnInit() {
        await this.obtenerIDEmpresa();
    }

    async obtenerIDEmpresa() {
        this.loginService.obtenerUsuario().subscribe(
            (data) => {
                this.idEmpresa = data?.idEmpresa || 0;
                this.obtenerCreditos();
                this.obtenerAmortizaciones(this.idEmpresa);
                this.obtenerPagos(this.idEmpresa);
                this.obtenerTotalMes(this.idEmpresa);
            },
            (error) => {
                this.toastr.error('No se pudieron obtener los datos de la empresa. Inténtelo de nuevo más tarde.', 'Error');
            }
        );
    }

    obtenerCreditos() {
        this.creditosService.getCreditos().subscribe({
            next: (creditos) => {
                this.actualizarStatusChart(creditos);
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener los créditos. Inténtelo de nuevo más tarde.', 'Error');
            }
        });
    }

    actualizarStatusChart(creditos: any[]) {
        const estatusCounts = {
            solicitados: creditos.filter(credito => credito.estatus === 1).length,
            firmados: creditos.filter(credito => credito.estatus === 2).length,
            enCurso: creditos.filter(credito => credito.estatus === 3).length,
            finalizados: creditos.filter(credito => credito.estatus === 4).length
        };

        this.statusChart = new Chart('statusChart', {
            type: 'pie',
            data: {
                labels: ['Solicitados', 'Firmados', 'En curso', 'Finalizados'],
                datasets: [{
                    data: [estatusCounts.solicitados, estatusCounts.firmados, estatusCounts.enCurso, estatusCounts.finalizados],
                    backgroundColor: ['#4bc0c0', '#ff6384', '#36a2eb', '#ffcd56']
                }]
            },
            options: { plugins: { legend: { position: 'top' } } }
        });
    }

    obtenerAmortizaciones(idEmpresa: number) {
        this.dashboardService.getAmortizacionesPorEmpresa(idEmpresa).subscribe({
            next: (amortizaciones) => {
                this.actualizarAmortizationChart(amortizaciones);
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener las amortizaciones. Inténtelo de nuevo más tarde.', 'Error');
            }
        });
    }

    actualizarAmortizationChart(amortizaciones: any[]) {
        const estatusCounts = {
            pendiente: amortizaciones.filter(amortizacion => amortizacion.estatus === 1).length,
            corriendo: amortizaciones.filter(amortizacion => amortizacion.estatus === 2).length,
            conMoratorios: amortizaciones.filter(amortizacion => amortizacion.estatus === 3).length,
            pagada: amortizaciones.filter(amortizacion => amortizacion.estatus === 4).length
        };

        this.amortizationChart = new Chart('amortizationChart', {
            type: 'doughnut',
            data: {
                labels: ['Pendiente', 'Corriendo', 'Con Moratorios', 'Pagada'],
                datasets: [{
                    data: [estatusCounts.pendiente, estatusCounts.corriendo, estatusCounts.conMoratorios, estatusCounts.pagada],
                    backgroundColor: ['#ff6384', '#4bc0c0', '#ffcd56', '#36a2eb']
                }]
            },
            options: { plugins: { legend: { position: 'top' } } }
        });
    }

    obtenerPagos(idEmpresa: number) {
        this.dashboardService.getPagosPorEmpresa(idEmpresa).subscribe({
            next: (pagos) => {
                this.actualizarPaymentChart(pagos);
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener los pagos. Inténtelo de nuevo más tarde.', 'Error');
            }
        });
    }

    actualizarPaymentChart(pagos: any[]) {
        const estatusCounts = {
            cancelado: pagos.filter(pago => pago.estatus === 0).length,
            pendiente: pagos.filter(pago => pago.estatus === 1).length,
            pagado: pagos.filter(pago => pago.estatus === 2).length
        };

        this.paymentChart = new Chart('paymentChart', {
            type: 'pie',
            data: {
                labels: ['Cancelado', 'Pendiente', 'Pagado'],
                datasets: [{
                    data: [estatusCounts.cancelado, estatusCounts.pendiente, estatusCounts.pagado],
                    backgroundColor: ['#ff6384', '#4bc0c0', '#ffcd56']
                }]
            },
            options: { plugins: { legend: { position: 'top' } } }
        });
    }

    obtenerTotalMes(idEmpresa: number) {
        this.dashboardService.getTotalPagos(idEmpresa).subscribe({
            next: (total) => {
                this.totalMes = total;
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener los totales. Inténtelo de nuevo más tarde.', 'Error');
            }
        });
    }
}
