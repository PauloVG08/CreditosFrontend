import { Component, OnInit } from '@angular/core';
import { IProducto } from '../../interfaces/producto';
import { IConcepto } from '../../interfaces/concepto';
import { ISimulador } from '../../interfaces/simulador';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ICliente } from '../../interfaces/cliente';
import { ClientesService } from '../../services/clientes.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ICredito } from '../../interfaces/credito';
import { CreditosService } from '../../services/creditos.service';

declare let Swal: any;

@Component({
    selector: 'app-detalle-credito',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './detalle-credito.component.html',
    styleUrl: './detalle-credito.component.scss'
})
export class DetalleCreditoComponent implements OnInit{
    producto!: IProducto;
    conceptos!: IConcepto;
    simulacion!: ISimulador;
    clientes: ICliente[] = [];
    clienteSeleccionado: ICliente | undefined;
    credito: ICredito | undefined;
    montoFormateado: string = '';

    constructor(
        private router: Router,
        private toastr: ToastrService,
        private clientesService: ClientesService,
        private creditosService: CreditosService
    ) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras.state) {
            const { data } = navigation.extras.state;
            this.producto = data.producto;
            this.conceptos = data.conceptos;
            this.simulacion = data.simulacion;

            this.montoFormateado = this.simulacion.monto ? this.simulacion.monto.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '';
        }
    }

    ngOnInit(): void {
        if (!this.producto || !this.simulacion) {
            this.toastr.warning('Crea primero una simulación', 'Error de detalle de credito');
            this.router.navigate(['simulador']);
        }else{
            this.obtenerClientes();
        }
    }

    obtenerClientes(): void {
        this.clientesService.getClientes().subscribe({
            next: (data: ICliente[]) => {
                this.clientes = data;
            },
            error: (error) => {
                this.toastr.error('Error al obtener la lista de clientes', 'Error');
            }
        });
    }

    onClienteChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const idCliente = target.value;
        this.clienteSeleccionado = this.clientes.find(cliente => cliente.idCliente === +idCliente);
    }

    async insertar() {
        this.credito = {
            idCredito: 0,
            idProducto: this.producto.idProducto,
            monto: this.simulacion.monto,
            estatus: 1,
            iva: this.simulacion.iva,
            periodicidad: this.simulacion.periodicidad,
            fechaFirma: null,
            fechaActivacion: null,
            numPagos: this.simulacion.numPagos,
            interesOrdinario: this.simulacion.interesAnual,
            idPromotor: 0,
            idCliente: this.clienteSeleccionado!.idCliente,
            interesMoratorio: this.simulacion.interesMoratorio,
            avals: [],
            obligados: []
        }
    
        const result = await Swal.fire({
            title: '¿Agregar solicitud?',
            text: "Una vez generada la solicitud no podrá cambiar los datos.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, solicitar',
            cancelButtonText: 'Cancelar'
        });
    
        if (result.isConfirmed) {
            this.creditosService.insertarCredito(this.credito).subscribe({
                next: (response: ICredito | { error: string }) => {
                    if ('error' in response) {
                        console.log(response);
                        this.toastr.error(response.error, 'Error');
                    } else {
                        this.toastr.success('Solicitud exitosa', 'Credito solicitado');
                        this.router.navigate(['/creditos/seguimiento']);
                    }
                },
                error: (error) => {
                    this.toastr.error('Error al insertar el crédito', 'Error');
                }
            });
        }
    }
}
