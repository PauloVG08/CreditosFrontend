import { Injectable } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { IQuejasSugerencias } from '../interfaces/quejas_sugerencias';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class QuejasService {
    private apiUrl = 'https://localhost:5000/api/QuejaSugerencium';

    constructor(private http: HttpClient, private toastr: ToastrService) { }

    getQuejas(): Observable<any[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.http.get<any[]>(this.apiUrl, { headers }).pipe(
            catchError(this.handleError)
        );
    }

    guardarQueja(queja: IQuejasSugerencias): Observable<IQuejasSugerencias> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });

        return this.http.post<IQuejasSugerencias>(this.apiUrl, queja, { headers })
            .pipe(
                catchError(error => {
                console.error('Error saving company:', error);
                return throwError(() => new Error('Error saving company'));
                })
            );
    }

    actualizarQueja(queja: IQuejasSugerencias): Observable<IQuejasSugerencias> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        return this.http.put<IQuejasSugerencias>(`${this.apiUrl}/${queja.idQuejaSugerencia}`, queja, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).pipe(
        catchError(error => {
            console.error('Error al actualizar la queja', error);
            return throwError(() => new Error('Error al actualizar la queja'));
        })
        );
    }

    eliminarQueja(id: number | null): Observable<void> {
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
                console.error('Error al eliminar la queja', error);
                return throwError(() => new Error('Error al eliminar la queja'));
            })
        );
    }

    private handleError(error: any): Observable<never> {
        const errorMessage = `Error: ${error.status} - ${error.message}`;
        console.error('Ocurrió un error:', errorMessage);
        this.toastr.error('No se pudieron obtener las quejas. Inténtelo de nuevo más tarde.', 'Error');
        return throwError(() => new Error('No se pudieron obtener las quejas. Inténtelo de nuevo más tarde.'));
    }
}
