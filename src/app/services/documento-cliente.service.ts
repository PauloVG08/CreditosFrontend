import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { INuevoDocumento } from '../interfaces/nuevoDocumento';
import { ICDocumentoCliente } from '../interfaces/documentoCliente';

@Injectable({
    providedIn: 'root'
})
export class DocumentPorClienteService {
    private apiUrl = 'https://financlick.somee.com/api/DocumentoCliente';

    constructor(private http: HttpClient) {}

    getDocumentosCliente(id: number): Observable<any[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.http.get<any[]>(`${this.apiUrl}/cliente/${id}`, { headers }).pipe(
            catchError(this.handleError)
        );
    }

    guardarDocumento(documento: INuevoDocumento): Observable<void> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        return this.http.post<void>(`${this.apiUrl}/subir`, documento, { headers }).pipe(
            catchError(this.handleError)
        );
    }

    asignarDocumento(idCliente: number, idDocumento: number): Observable<string> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        const payload = {
            idCliente,
            idDocumento
        };

        return this.http.post<string>(`${this.apiUrl}/asignar`, payload, {
            headers,
            responseType: 'text' as 'json'
        }).pipe(
            catchError(this.handleError)
        );
    }

    desasignarDocumento(idCliente: number, idDocumento: number): Observable<string> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        const payload = {
            idCliente,
            idDocumento
        };

        return this.http.post<string>(`${this.apiUrl}/desasignar`, payload, {
            headers,
            responseType: 'text' as 'json'
        }).pipe(
            catchError(this.handleError)
        );
    }

    // documento-cliente.service.ts
    getDocumentosAsignados(idCliente: number): Observable<ICDocumentoCliente[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        return this.http.get<ICDocumentoCliente[]>(`${this.apiUrl}/cliente/${idCliente}`, { headers });
    }

    actualizarEstatus(idDocumentoCliente: number, estatus: number): Observable<void> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        return this.http.put<void>(`${this.apiUrl}/cambiar-estatus/${idDocumentoCliente}/${estatus}`, {}, { headers }).pipe(
            catchError(this.handleError)
        );
    }

    asignarDocumentosPorTipo(idCliente: number, tipo: 'FISICA' | 'MORAL'): Observable<void> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }
    
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
    
        const endpoint = tipo === 'FISICA' ? 'asignar-todos-fisica' : 'asignar-todos-moral';
    
        return this.http.post<void>(`${this.apiUrl}/${endpoint}/${idCliente}`, {}, { headers }).pipe(
            catchError(this.handleError)
        );
    }

    private handleError(error: any): Observable<never> {
        // Manejo de errores
        console.error('An error occurred', error);
        return throwError(() => new Error('An error occurred while fetching data'));
    }
}

