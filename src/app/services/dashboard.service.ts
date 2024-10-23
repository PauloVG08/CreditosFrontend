import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = 'https://financlick.somee.com/api/Credito';
    private apiUrlPago = 'https://financlick.somee.com/api/Pagos';

    constructor(private httpClient: HttpClient, private toastr: ToastrService) { }

    getAmortizacionesPorEmpresa(idEmpresa: number): Observable<any[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.httpClient.get<any[]>(`${this.apiUrl}/amortizaciones/empresa/${idEmpresa}`, { headers }).pipe(
            catchError(error => {
                const errorMessage = `Error: ${error.status} - ${error.message}`;
                return throwError(() => new Error('No se pudieron obtener las amortizaciones. Intente de nuevo.'));
            })
        );
    }

    getPagosPorEmpresa(idEmpresa: number): Observable<any[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.httpClient.get<any[]>(`${this.apiUrl}/pagos/empresa/${idEmpresa}`, { headers }).pipe(
            catchError(error => {
                const errorMessage = `Error: ${error.status} - ${error.message}`;
                return throwError(() => new Error('No se pudieron obtener los pagos. Intente de nuevo.'));
            })
        );
    }

    getTotalPagos(idEmpresa: number): Observable<any> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.httpClient.get<any>(`${this.apiUrlPago}/PagosRecibidosUltimoMes/${idEmpresa}`, { headers }).pipe(
            catchError(error => {
                const errorMessage = `Error: ${error.status} - ${error.message}`;
                return throwError(() => new Error('No se pudieron obtener los pagos. Intente de nuevo.'));
            })
        );
    }
}
