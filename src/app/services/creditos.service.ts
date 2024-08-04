import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, throwError } from 'rxjs';
import { ICredito } from '../interfaces/credito';
import { IAmortizacionActiva } from '../interfaces/amortizacionActiva';

@Injectable({
    providedIn: 'root'
})
export class CreditosService {
    private apiUrl = 'https://localhost:5000/api/Credito';

    constructor(private http: HttpClient, private toastr: ToastrService) { }

    getCreditos(): Observable<ICredito[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.http.get<ICredito[]>(this.apiUrl, { headers }).pipe(
            catchError(error => {
                const errorMessage = `Error: ${error.status} - ${error.message}`;
                console.error('Ocurrió un error:', errorMessage);
                this.toastr.error('No se pudieron obtener las empresas. Inténtelo de nuevo más tarde.', 'Error');
                return throwError(() => new Error('No se pudieron obtener las empresas. Inténtelo de nuevo más tarde.'));
            })
        );
    }

    insertarCredito(credito: ICredito): Observable<ICredito> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        return this.http.post<ICredito>(this.apiUrl, credito, {
            headers}).pipe(
                catchError(error => {
                    console.error('Error saving client:', error);
                    this.toastr.error('Error al guardar el cliente.');
                    return throwError(() => new Error('Error saving client'));
                })
            )
    }

    actualizarCredito(credito: ICredito): Observable<ICredito> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }
        console.log(credito);

        return this.http.put<ICredito>(`${this.apiUrl}/${credito.idCredito}`, credito, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).pipe(
            catchError(error => {
                console.error('Error updating client:', error);
                this.toastr.error('Error al actualizar el cliente.');
                return throwError(() => new Error('Error updating client'));
            })
        )
    }

    eliminarCredito(id: number | null): Observable<void> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        return this.http.delete<void>(`${this.apiUrl}/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).pipe(
            catchError(error => {
                console.error('Error al eliminar la empresa', error);
                return throwError(() => new Error('Error al eliminar la empresa'));
            })
        );
    }

    obtenerAmortizaciones(idCredito: number): Observable<IAmortizacionActiva[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }
        return this.http.get<any>(`${this.apiUrl}/Amortizaciones/${idCredito}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).pipe(
            catchError(error => {
                console.error('Error al obtener las amortizaciones', error);
                return throwError(() => new Error('Error al obtener las amortizaciones'));
            })
        );
    }
}
