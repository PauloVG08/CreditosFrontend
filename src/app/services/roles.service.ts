import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, throwError } from 'rxjs';
import { IRol } from '../interfaces/rol';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private apiUrl = 'https://financlick.somee.com/api/Rol';


  constructor(private http: HttpClient, private toastr: ToastrService) {}

  getRoles(): Observable<IRol[]> {
    const token = localStorage.getItem('token');
    if (!token) {
        return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
    });

    return this.http.get<IRol[]>(this.apiUrl, { headers }).pipe(
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
