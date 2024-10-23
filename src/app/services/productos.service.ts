import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, throwError } from 'rxjs';
import { IProducto } from '../interfaces/producto';

@Injectable({
    providedIn: 'root'
})
export class ProductosService {
    private apiUrl = 'https://financlick.somee.com/api/Producto'

    constructor(private http: HttpClient, private toastr: ToastrService) { }

    getProductos(): Observable<IProducto[]> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = {
            'Authorization': `Bearer ${token}`
        };

        return this.http.get<IProducto[]>(this.apiUrl, { headers }).pipe(
            catchError(this.handleError)
        );
    }

    guardarProducto(producto: IProducto): Observable<IProducto> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }
        console.log(producto);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        return this.http.post<IProducto>(this.apiUrl, producto, { headers }).pipe(
            catchError(error => {
                console.error('Error saving producto:', error);
                this.toastr.error('No se pudo guardar el producto. Inténtelo de nuevo más tarde.', 'Error');
                return throwError(() => new Error('Error saving producto'));
            })
        )
    }

    actualizarProducto(producto: IProducto): Observable<IProducto> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        const headers = {
            'Authorization': `Bearer ${token}`
        };

        return this.http.put<IProducto>(`${this.apiUrl}/${producto.idProducto}`, producto, { headers }).pipe(
            catchError(error => {
                console.error('Error updating producto:', error);
                this.toastr.error('No se pudo actualizar el producto. Inténtelo de nuevo más tarde.', 'Error');
                return throwError(() => new Error('Error updating producto'));
            })
        )
    }

    eliminarProducto(id: number): Observable<void> {
        const token = localStorage.getItem('token');
        if (!token) {
            return throwError(() => new Error('No token found'));
        }

        return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }).pipe(
            catchError(error => {
                console.error('Error deleting producto:', error);
                this.toastr.error('No se pudo eliminar el producto. Inténtelo de nuevo más tarde.', 'Error');
                return throwError(() => new Error('Error deleting producto'));
            })
        )
    }

    private handleError(error: any): Observable<never> {
        const errorMessage = `Error: ${error.status} - ${error.message}`;
        console.error('Ocurrió un error:', errorMessage);
        this.toastr.error('No se pudieron obtener las empresas. Inténtelo de nuevo más tarde.', 'Error');
        return throwError(() => new Error('No se pudieron obtener las empresas. Inténtelo de nuevo más tarde.'));
    }
}
