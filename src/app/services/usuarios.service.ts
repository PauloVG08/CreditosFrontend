import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { IUsuarioRol } from '../interfaces/usuarioRol';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private apiUrl = 'https://localhost:5000/api/Usuario';


  constructor(private http: HttpClient, private toastr: ToastrService) {}


  getUsuarios(): Observable<IUsuarioRol[]> {
    const token = localStorage.getItem('token');
    if (!token) {
        return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });

    return this.http.get<IUsuarioRol[]>(this.apiUrl, { headers }).pipe(
        catchError(this.handleError)
    );
  }

  guardarUsuario(usuario: IUsuarioRol): Observable<IUsuarioRol> {
    const token = localStorage.getItem('token');
    if (!token) {
        return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });

    return this.http.post<IUsuarioRol>(this.apiUrl, usuario, { headers }).pipe(
        catchError(this.handleError)
    );
  }

  actualizarUsuario(id: number, usuario: IUsuarioRol): Observable<IUsuarioRol> {
    const token = localStorage.getItem('token');
    if (!token) {
        return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });

    return this.http.put<IUsuarioRol>(`${this.apiUrl}/${id}`, usuario, { headers }).pipe(
        catchError(this.handleError)
    );
  }

  eliminarUsuario(id: number): Observable<IUsuarioRol> {
    const token = localStorage.getItem('token');
    if (!token) {
        return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });

    return this.http.delete<IUsuarioRol>(`${this.apiUrl}/${id}`, { headers }).pipe(
        catchError(this.handleError)
    );
  }


  private handleError(error: any): Observable<never> {
  const errorMessage = `Error: ${error.status} - ${error.message}`;
  console.error('Ocurrió un error:', errorMessage);
  this.toastr.error('No se pudieron obtener los roles. Inténtelo de nuevo más tarde.', 'Error');
  return throwError(() => new Error('No se pudieron obtener los roles. Inténtelo de nuevo más tarde.'));
  }
}
