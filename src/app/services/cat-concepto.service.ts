import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, throwError } from 'rxjs';
import { IConcepto } from '../interfaces/concepto';

@Injectable({
    providedIn: 'root'
})
export class CatConceptoService {
    private apiUrl = 'https://financlick.somee.com/api/CatConcepto';

    constructor(private http: HttpClient, private toastr: ToastrService) { }

    getConceptos(): Observable<IConcepto[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = {
            'Authorization': `Bearer ${token}`
        };

        return this.http.get<IConcepto[]>(this.apiUrl, { headers }).pipe(
            catchError(this.handleError)
        )
    }

    guardarConcepto(concepto: IConcepto): Observable<IConcepto> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        return this.http.post<IConcepto>(this.apiUrl, concepto, { headers }).pipe(
            catchError(error => {
                console.error('Error saving concepto:', error);
                this.toastr.error('No se pudo guardar el concepto. Inténtelo de nuevo más tarde.', 'Error');
                return throwError(() => new Error('Error saving concepto'));
            })
        )
    }

    actualizarConcepto(concepto: IConcepto): Observable<IConcepto> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        return this.http.put<IConcepto>(`${this.apiUrl}/${concepto.idConcepto}`, concepto, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).pipe(
            catchError(error => {
                console.error('Error updating concepto:', error);
                this.toastr.error('No se pudo actualizar el concepto. Inténtelo de nuevo más tarde.', 'Error');
                return throwError(() => new Error('Error updating concepto'));
            })
        )
    }

    eliminarConcepto(id: number): Observable<void> {
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
                console.error('Error al eliminar el concepto:', error);
                return throwError(() => new Error('Error al eliminar el concepto'));
            })
        );
    }

    private handleError(error: any): Observable<never> {
        const errorMessage = `Error: ${error.status} - ${error.message}`;
        console.error('Ocurrió un error:', errorMessage);
        this.toastr.error('No se pudieron obtener las empresas. Inténtelo de nuevo más tarde.', 'Error');
        return throwError(() => new Error('No se pudieron obtener las empresas. Inténtelo de nuevo más tarde.'));
    }
}
