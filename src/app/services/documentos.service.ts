import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { IDocumento } from '../interfaces/documentos';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class DocumentosService {
    private apiUrl = 'https://financlick.somee.com/api/Documento';

    constructor(private http: HttpClient, private toastr: ToastrService) { }

    getDocumentos(): Observable<IDocumento[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.http.get<IDocumento[]>(this.apiUrl, { headers }).pipe(
            catchError(this.handleError)
        )
    }

    guardarDocumento(documento: IDocumento): Observable<IDocumento>{
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }
        
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        })

        return this.http.post<IDocumento>(this.apiUrl, documento, { headers }).pipe(
            catchError(error => {
                console.error('Error saving document:', error);
                this.toastr.error('No se pudo guardar el documento. Inténtelo de nuevo más tarde.', 'Error');
                return throwError(() => new Error('Error saving document'));
            })
        )
    }

    actualizarDocumento(documento: IDocumento): Observable<IDocumento> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        return this.http.put<IDocumento>(`${this.apiUrl}/${documento.idCatalogoDocumento}`, documento, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).pipe(
        catchError(error => {
            console.error('Error al actualizar el documento:', error);
            return throwError(() => new Error('Error al actualizar el documento'));
        })
        );
    }

    eliminarDocumento(id: number | null): Observable<void> {
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
                console.error('Error al eliminar el documento:', error);
                return throwError(() => new Error('Error al eliminar el documento'));
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
