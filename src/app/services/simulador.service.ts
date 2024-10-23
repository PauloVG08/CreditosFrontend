import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ISimulador } from '../interfaces/simulador';
import { ToastrService } from 'ngx-toastr';
import { IAmortizacion } from '../interfaces/amortizacion';

@Injectable({
    providedIn: 'root'
})
export class SimuladorService {
    private apiUrl = 'https://financlick.somee.com/api/simulacion';

    constructor(private http: HttpClient, private toastr: ToastrService) { }

    calcularSimulador(): Observable<ISimulador> {
        return this.http.get<ISimulador>(this.apiUrl).pipe(
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Ha sucedido un error.';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error de red o cliente: ${error.error.message}`;
        } else {
            errorMessage = `Error interno del servidor ${error.status}, ` +
                            `Error: ${error.error}`;
        }
        return throwError(() => new Error(errorMessage));
    }

    obtenerSimulacion(datosSimulacion: ISimulador): Observable<IAmortizacion[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        return this.http.post<IAmortizacion[]>(this.apiUrl, datosSimulacion, { headers }).pipe(
            catchError(error => {
                console.error('Error obtaining simulacion:', error);
                this.toastr.error('No se pudo realizar la simulación. Inténtelo de nuevo más tarde.', 'Error');
                return throwError(() => new Error('Error saving simulacion'));
            })
        );
    }
}
