import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CodigoPostalService {

  private apiUrl = environment.apiCP;
  private apiKey = environment.apiKey;

  constructor(private http: HttpClient) {}

  getCodigosPostales(cp: string): Observable<any> {
    const headers = new HttpHeaders({
      'APIKEY': this.apiKey
    });

    const requestOptions = {
      headers: headers,
      responseType: 'text' as 'json',  // Ajusta para obtener respuesta en texto similar a fetch
    };

    return this.http.get<any>(`${this.apiUrl}/codigo_postal?cp=${cp}`, requestOptions).pipe(
      catchError((error) => {
        console.error('Error al obtener el Código Postal:', error);
        return throwError(() => new Error('Something went wrong; please try again later.'));
      })
    );
  }
}
