import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CreditosService } from '../../services/creditos.service';
import { PagosService } from '../../services/pagos.service';
import { ICredito } from '../../interfaces/credito';
import { IAmortizacionActiva } from '../../interfaces/amortizacionActiva';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { IPagoAplicado } from '../../interfaces/pagoAplicado';
import { IPago } from '../../interfaces/pago';
import { ClientesService } from '../../services/clientes.service';
import { ICliente } from '../../interfaces/cliente';

@Component({
    selector: 'app-pagos',
    standalone: true,
    imports: [CommonModule, MatExpansionModule, MatCardModule, ReactiveFormsModule],
    templateUrl: './pagos.component.html',
    styleUrls: ['./pagos.component.scss'],
})
export class PagosComponent implements OnInit {
    modalTitle: string = '';
    pagoForm: FormGroup;
    creditos: ICredito[] = [];
    creditosActivos: ICredito[] = [];
    creditoSeleccionado: ICredito = {} as ICredito;
    amortizacionesAct: IAmortizacionActiva[] = [];
    mostrarAmortizaciones: boolean = false;
    mostrarTablaCreditos: boolean = true;
    mostrarPagos: boolean = false;
    idCreditoSeleccionado: number = 0;
    idPagoAAplicar: number = 0;
    estatusAmortizacion: string = '';
    pagoAplicado: IPagoAplicado = { idCredito: 0, montoPago: 0 };
    pagos: IPago[] = [];
    cliente: ICliente = {} as ICliente;
    nombreCliente: string = '';


    constructor(
        private elementRef: ElementRef,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private creditosService: CreditosService,
        private pagosService: PagosService,
        private clientesService: ClientesService
    ) {
        this.pagoForm = this.fb.group({
        idCredito: [{ value: 0, disabled: true }, Validators.required],
        montoPago: [0, Validators.required],
    });

    }

    ngOnInit(): void {
        this.obtenerCreditos();
        
    }

    obtenerPagos(idCredito: number) {
        this.pagosService.getPagos(idCredito).subscribe({
            next: (pagos) => {
                this.pagos = pagos;
                this.mostrarPagos = true;
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener los pagos. Inténtelo de nuevo más tarde.', 'Error');
            }
        })
    }


    obtenerCreditos() {
        this.creditosService.getCreditos().subscribe({
            next: (creditos) => {
                this.creditos = creditos;
                if(this.creditos.length > 0) {
                    this.creditosActivos = this.creditos.filter(credito => credito.estatus === 3);
                }
                //console.log(this.creditosActivos);
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener los productos. Inténtelo de nuevo más tarde.', 'Error');
            }
        })
    }
    obtenerAmortizaciones(idCredito: number) {
        this.calcularMoratorios(idCredito);
        this.creditosService.obtenerAmortizaciones(idCredito).subscribe({
            next: (amortizaciones) => {
                this.amortizacionesAct = amortizaciones;
                //console.log(this.amortizacionesAct);
                this.idCreditoSeleccionado = idCredito;
                //console.log("Id Credito: " + this.idCreditoSeleccionado);
                this.mostrarAmortizaciones = true;
                this.mostrarTablaCreditos = false;
                this.obtenerPagos(idCredito);
                
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener las amortizaciones. Inténtelo de nuevo más tarde.', 'Error');
            }
    })
    //this.verificarCredito(idCredito);
    }


    calcularMoratorios(idCredito: number) {
        this.creditosService.actualizarMoratorios(idCredito).subscribe({
            next: (response) => {
                //console.log(response);
                //this.actualizarTablas();
            },
            error: (error) => {
                this.toastr.error('No se pudieron actualizar los moratorios. Inténtelo de nuevo más tarde.', 'Error');
            }
        })
    }

    actualizarTablas() {
        this.obtenerPagos(this.idCreditoSeleccionado);
        this.obtenerCreditos();
        this.obtenerAmortizaciones(this.idCreditoSeleccionado);
    }


    verificarCredito(idCredito: number) {
        this.idCreditoSeleccionado = idCredito;
        let amortizaciones = this.amortizacionesAct;
        let contador: number = 0;

        amortizaciones.forEach(am => {
        if (am.estatus === 4){
            contador++;
        }
        });

        //console.log("Contador: " + contador);

        if (amortizaciones.length === contador) {
        this.creditoSeleccionado = this.creditosActivos.filter(credito => credito.idCredito === idCredito)[0];
        //console.log(this.creditoSeleccionado);

        this.creditoSeleccionado.estatus = 4;
        
        this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
            next: (response) => {
                this.toastr.success('Crédito modificado correctamente.');
                this.regresar();
            },
            error: () => {
                this.toastr.error('Error al modificar el crédito.');
            }
        });

        } else {
        //console.log("Credito al corriente");
        }
        //this.actualizarTablas();
    }

    aplicarPago() {
        const idPago = this.idPagoAAplicar;
        this.pagosService.aplicarPago(idPago).subscribe({
        next: (response: string) => {
            this.closeModalAplicar();
            this.toastr.success("El pago se aplicó con exito", 'Éxito');
            this.actualizarTablas();
        },
        error: (error) => {
            console.error('Error al aplicar el pago:', error);
            if (error.error && error.error.message) {
            this.toastr.error(error.error.message, 'Error');
            } else {
            this.toastr.error('Ocurrió un error al aplicar el pago. Por favor, inténtelo de nuevo.', 'Error');
            }
        }
        });
        
        this.verificarCredito(this.idCreditoSeleccionado);
    }


    registrarPago() {
        if (this.pagoForm.valid) {
        const { idCredito, montoPago } = this.pagoForm.value;
        this.pagoAplicado.idCredito = this.idCreditoSeleccionado;

        if (montoPago <= 0) {
            this.toastr.warning('Por favor, introduce un valor mayor a 0.');
            return;
        }else {
            this.pagoAplicado.montoPago = montoPago;
        }

        this.pagosService.registrarPago(this.pagoAplicado).subscribe({
            next: (response: string) => {
            this.pagoForm.patchValue({ montoPago: 0 });
            this.toastr.success("Pago Registrado Con Éxito", 'Éxito');  // Muestra el mensaje del servidor
            this.modalTitle = '';
            this.closeModal();
            this.obtenerPagos(this.idCreditoSeleccionado);
            },
            error: (error) => {
            console.error('Error al registrar el pago:', error);
            }
        });
        }
    }


    regresar() {
        this.mostrarAmortizaciones = false;
        this.mostrarTablaCreditos = true;
        this.mostrarPagos = false;
    }

    openModal() {
        this.modalTitle = 'Registrar Pago';

        const modalElement = this.elementRef.nativeElement.querySelector('#modalPago');
        if (modalElement) {
        const modalInstance = new (window as any).bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });
        modalInstance.show();
        }
    }

    openModalAplicar(idPago: number) {
        this.idPagoAAplicar = idPago;
        this.modalTitle = 'Aplicar Pago';

        const modalElement = this.elementRef.nativeElement.querySelector('#modalAplicar');
        if (modalElement) {
        const modalInstance = new (window as any).bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });
        modalInstance.show();
        }
    }

    onModalClose() {
        //this.pagoForm.reset();
    }

    closeModal() {
        const modalElement = this.elementRef.nativeElement.querySelector('#modalPago');
        if (modalElement) {
            const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
        this.onModalClose();
    }

    closeModalAplicar() {
    const modalElement = this.elementRef.nativeElement.querySelector('#modalAplicar');
    if (modalElement) {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
    this.onModalClose();
    }

    getStatusClass(status: number): string {
        switch (status) {
            case 1:
                this.estatusAmortizacion = 'Pendiente';
                return 'pending-status';
            case 2:
                this.estatusAmortizacion = 'Corriendo';
                return 'running-status';
            case 3:
                this.estatusAmortizacion = 'Con Moratorio';
                return 'moratorium-status';
            case 4:
                this.estatusAmortizacion = 'Pagada';
                return 'paid-status';
            default:
            return '';
        }
    }

    async openModalDetalle(credito: ICredito) {
        this.creditoSeleccionado = credito;
        try {
            await this.obtenerCliente(credito.idCliente);
            this.modalTitle = 'Detalle del crédito';

            if(this.cliente.regimenFiscal === 'MORAL') {
                this.nombreCliente = this.cliente.datosClienteMorals![0].nombreRepLegal;
            }else{
                this.nombreCliente = this.cliente.datosClienteFisicas![0].idPersonaNavigation!.nombre + ' ' + this.cliente.datosClienteFisicas![0].idPersonaNavigation!.apellidoPaterno + ' ' + this.cliente.datosClienteFisicas![0].idPersonaNavigation!.apellidoMaterno;
            }

            const modalElement = this.elementRef.nativeElement.querySelector('#modalDetalle');
            if (modalElement) {
                const modalInstance = new (window as any).bootstrap.Modal(modalElement, {
                    backdrop: 'static',
                    keyboard: false
                });
                modalInstance.show();
            }
        } catch (error) {
            console.error('Error al abrir el modal', error);
        }
    }

    obtenerCliente(idCliente: number): Promise<ICliente> {
        return new Promise((resolve, reject) => {
            this.clientesService.getCliente(idCliente).subscribe({
                next: (data: ICliente) => {
                    this.cliente = data;
                    resolve(data);
                },
                error: (error) => {
                    this.toastr.error('Error al obtener la lista de clientes', 'Error');
                    reject(error);
                }
            });
        });
    }

    closeModaDetalle() {
        const modalElement = this.elementRef.nativeElement.querySelector('#modalDetalle');
        if (modalElement) {
            const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

        this.nombreCliente = '';
        this.creditoSeleccionado = {} as ICredito;
    }
}
