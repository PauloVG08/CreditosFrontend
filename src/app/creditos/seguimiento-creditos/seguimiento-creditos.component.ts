import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ICredito } from '../../interfaces/credito';
import { CreditosService } from '../../services/creditos.service';
import { ICliente } from '../../interfaces/cliente';
import { ClientesService } from '../../services/clientes.service';
import { LoginService } from '../../services/login.service';
import { IUsuario } from '../../interfaces/usuario';

declare let Swal: any;

@Component({
    selector: 'app-seguimiento-creditos',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './seguimiento-creditos.component.html',
    styleUrls: ['./seguimiento-creditos.component.scss']
})
export class SeguimientoCreditosComponent implements OnInit {
    creditos: ICredito[] = [];
    clientes: ICliente[] = [];
    usuarios: IUsuario[] = [];
    creditoForm: FormGroup;
    personaForm: FormGroup;
    personaMoralForm: FormGroup;
    mostrarFisica: boolean = false;
    mostrarMoral: boolean = false;
    datosPersona: Array<any> = [];
    datosPersonaMoral: Array<any> = [];
    regimenFiscal: string = '';
    creditoSeleccionado: ICredito = {} as ICredito;
    avalSeleccionado: any;
    obligadoSeleccionado: any;
    selectedEntity: any;
    fechaFirma: string = '';
    fechaActivacion: string = '';
    idPromotorSeleccionado: number | null = null;
    mostrarPromotor: boolean = false;
    nombrePromotor: string = '';

    constructor(
        private elementRef: ElementRef,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private creditosService: CreditosService,
        private clientesService: ClientesService,
        private loginService: LoginService
    ) { 
        this.creditoForm = this.fb.group({
            idCredito: [0],
            idProducto: [0, Validators.required],
            monto: [0, Validators.required],
            estatus: [0],
            iva: [0, Validators.required],
            periodicidad: ['', Validators.required],
            fechaFirma: [null],
            fechaActivacion: [null],
            numPagos: [0, Validators.required],
            interesOrdinario: [0, Validators.required],
            idPromotor: [0],
            idCliente: [0, Validators.required],
            interesMoratorio: [0, Validators.required],
            avals: this.fb.array([]), 
            obligados: this.fb.array([]), 
        });

        this.personaForm = this.fb.group({
            idPersona: [],
            nombre: ['', Validators.required],
            apellidoPaterno: ['', Validators.required],
            apellidoMaterno: ['', Validators.required],
            fechaNacimiento: ['', Validators.required],
            paisNacimiento: ['MEXICO', Validators.required],
            estadoNacimiento: ['', Validators.required],
            genero: ['', Validators.required],
            rfc: ['', Validators.required],
            curp: ['', Validators.required],
            claveElector: [''],
            nacionalidad: ['MEXICANA', Validators.required],
            estadoCivil: [''],
            regimenMatrimonial: [''],
            nombreConyuge: [''],
            calle: ['', Validators.required],
            numExterior: ['', Validators.required],
            numInterior: [''],
            colonia: ['', Validators.required],
            codigoPostal: ['', Validators.required],
            paisResidencia: ['MEXICO', Validators.required],
            estadoResidencia: ['GUANAJUATO', Validators.required],
            ciudadResidencia: ['LEON', Validators.required],
            email: ['', Validators.required],
            telefono: ['']
        });

        this.personaMoralForm = this.fb.group({
            idPersonaMoral: [0],
            razonSocial: ['', Validators.required],
            razonComercial: [''],
            fechaConstitucion: ['', Validators.required],
            rfc: ['', Validators.required],
            nacionalidad: ['MEXICANA', Validators.required],
            paisRegistro: ['MEXICO', Validators.required],
            estadoRegistro: ['GUANAJUATO', Validators.required],
            ciudadRegistro: ['LEON', Validators.required],
            numEscritura: ['123456789', Validators.required],
            fechaRppc: [null],
            nombreNotario: [''],
            numNotario: [''],
            folioMercantil: [''],
            calle: ['', Validators.required],
            numExterior: ['', Validators.required],
            numInterior: [''],
            colonia: ['', Validators.required],
            codigoPostal: ['', Validators.required],
            paisResidencia: ['MEXICO', Validators.required],
            estadoResidencia: ['GUANAJUATO', Validators.required],
            ciudadResidencia: ['LEON', Validators.required],
        });
    }

    ngOnInit(): void { 
        this.obtenerCreditosYClientes();
    }

    obtenerCreditosYClientes() {
        this.clientesService.getClientes().subscribe(
            (clientes: ICliente[]) => {
                this.clientes = clientes;
                this.obtenerCreditos();
            }
        );
    }

    obtenerCreditos() {
        this.creditosService.getCreditos().subscribe(
            (creditos: ICredito[]) => {
                this.creditos = creditos.map(credito => {
                    const cliente = this.clientes.find(c => c.idCliente === credito.idCliente);
                    let nombreCliente = 'N/A';
                    let regimenFiscal = 'N/A';
                    let idCliente = credito.idCliente;
    
                    if (cliente) {
                        regimenFiscal = cliente.regimenFiscal || 'N/A';
                        idCliente = cliente.idCliente;
    
                        if (cliente.regimenFiscal === 'MORAL' && cliente.datosClienteMorals!.length > 0) {
                            nombreCliente = cliente.datosClienteMorals![0].nombreRepLegal;
                        } else if (cliente.regimenFiscal === 'FISICA' && cliente.datosClienteFisicas!.length > 0) {
                            const persona = cliente.datosClienteFisicas![0].idPersonaNavigation!;
                            nombreCliente = `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno}`;
                        }
                    }
                    return { ...credito, nombreCliente, regimenFiscal, idCliente };
                });
                console.log(this.creditos);
            }
        );
    }

    async eliminar(credito: ICredito) {
        const result = await Swal.fire({
            title: '¿Eliminar crédito?',
            text: "¿Estás seguro de eliminar este credito?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.creditosService.eliminarCredito(credito.idCredito).subscribe({
                next: () => {
                    this.toastr.success('Crédito eliminado con éxito.', 'Eliminado');
                    this.obtenerCreditosYClientes();
                },
                error: (error) => {
                    this.toastr.error('Error al eliminar el cliente.', 'Error');
                }
            });
        }
    }

    openModalAval(credito: ICredito) {
        this.creditoSeleccionado = credito;

        const modalElement = this.elementRef.nativeElement.querySelector('#staticBackdrop') as HTMLElement;
        if (modalElement) {
            const modal = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();
        } else {
            console.error('Modal element not found');
        }
    }

    openModalObligados(credito: ICredito) {
        this.creditoSeleccionado = credito;

        const modalElement = this.elementRef.nativeElement.querySelector('#modalObligados') as HTMLElement;
        if (modalElement) {
            const modal = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();
        } else {
            console.error('Modal element not found');
        }
    }

    guardarAval() {
        const limpiarAvales = (avales: any[]) => {
            return avales.map(aval => {
                const nuevoAval = { ...aval };
                delete nuevoAval.idAval;
                delete nuevoAval.idPersona;
                delete nuevoAval.idPersonaMoral;
                delete nuevoAval.idPersonaNavigation?.idPersona;
                delete nuevoAval.idPersonaMoralNavigation?.idPersonaMoral;
                delete nuevoAval.idCredito;
                return nuevoAval;
            });
        };

        if (this.creditoSeleccionado.avals) {
            this.creditoSeleccionado.avals = limpiarAvales(this.creditoSeleccionado.avals);
        } else {
            this.creditoSeleccionado.avals = [];
        }

        if (this.regimenFiscal === 'FISICA') {
            console.log(this.personaForm.value);
            if (!this.personaForm.valid) {
                this.toastr.warning('Por favor, completa todos los campos obligatorios.');
                return;
            }

            const persona = this.personaForm.value;
            delete persona.idPersona;

            this.creditoSeleccionado.avals.push({
                idPersonaNavigation: persona
            });

        } else if (this.regimenFiscal === 'MORAL') {
            console.log(this.personaMoralForm.value);
            if (!this.personaMoralForm.valid) {
                this.toastr.warning('Por favor, completa todos los campos obligatorios.');
                return;
            }

            const personaMoral = this.personaMoralForm.value;
            delete personaMoral.idPersona;
            delete personaMoral.idPersonaMoral;

            this.creditoSeleccionado.avals.push({
                idPersonaMoralNavigation: personaMoral
            });
        } else {
            this.toastr.warning('Por favor, selecciona un tipo de persona');
        }

        this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
            next: (response) => {
                this.toastr.success('Aval guardado correctamente.');
                this.onModalClose();
            },
            error: () => {
                this.toastr.error('Error al guardar el aval.');
            }
        });
    }


    onModalClose() {
        const modalElement = this.elementRef.nativeElement.querySelector('#staticBackdrop');
        if (modalElement) {
            const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

        const modalElement2 = this.elementRef.nativeElement.querySelector('#modalObligados');
        if (modalElement2) {
            const modalInstance2 = (window as any).bootstrap.Modal.getInstance(modalElement2);
            if (modalInstance2) {
                modalInstance2.hide();
            }
        }

        const modalElement3 = this.elementRef.nativeElement.querySelector('#modalDetalles');
        if (modalElement3) {
            const modalInstance3 = (window as any).bootstrap.Modal.getInstance(modalElement3);
            if (modalInstance3) {
                modalInstance3.hide();
            }
        }

        const modalElement4 = this.elementRef.nativeElement.querySelector('#modalEditarFisicas');
        if (modalElement4) {
            const modalInstance4 = (window as any).bootstrap.Modal.getInstance(modalElement4);
            if (modalInstance4) {
                modalInstance4.hide();
            }
        }

        const modalElement5 = this.elementRef.nativeElement.querySelector('#editarMorales');
        if (modalElement5) {
            const modalInstance5 = (window as any).bootstrap.Modal.getInstance(modalElement5);
            if (modalInstance5) {
                modalInstance5.hide();
            }
        }

        const modalElement6 = this.elementRef.nativeElement.querySelector('#firmarCredito');
        if (modalElement6) {
            const modalInstance6 = (window as any).bootstrap.Modal.getInstance(modalElement6);
            if (modalInstance6) {
                modalInstance6.hide();
            }
        }

        const modalElement7 = this.elementRef.nativeElement.querySelector('#aceptarCredito');
        if (modalElement7) {
            const modalInstance7 = (window as any).bootstrap.Modal.getInstance(modalElement7);
            if (modalInstance7) {
                modalInstance7.hide();
            }
        }

        this.creditoForm.reset();
        this.creditoSeleccionado = {} as ICredito;
        this.personaForm.reset();
        this.personaMoralForm.reset();
        this.regimenFiscal = '';
        this.mostrarFisica = false;
        this.mostrarMoral = false;
        this.selectedEntity = null;
        this.avalSeleccionado = null;
        this.obligadoSeleccionado = null;
        this.datosPersona = [];
        this.datosPersonaMoral = [];
        this.fechaFirma = '';
        this.fechaActivacion = '';
        this.idPromotorSeleccionado = null;
        this.mostrarPromotor = false;
        this.usuarios = [];
        this.nombrePromotor = '';
        this.idPromotorSeleccionado = null;
    }

    onRegimenFiscalChange(event: any): void {
        const selectedValue = event.target.value;
        this.mostrarFisica = selectedValue === 'FISICA';
        this.mostrarMoral = selectedValue === 'MORAL';
    }

    guardarObligado() {
        const limpiarObligados = (obligados: any[]) => {
            return obligados.map(obligado => {
                const nuevoObligado = { ...obligado };
                delete nuevoObligado.idPersona;
                delete nuevoObligado.idPersonaMoral;
                delete nuevoObligado.idPersonaNavigation?.idPersona;
                delete nuevoObligado.idPersonaMoralNavigation?.idPersonaMoral;
                delete nuevoObligado.idCredito;
                return nuevoObligado;
            });
        };

        if (this.creditoSeleccionado.obligados) {
            this.creditoSeleccionado.obligados = limpiarObligados(this.creditoSeleccionado.obligados);
        } else {
            this.creditoSeleccionado.obligados = [];
        }
    
        if (this.regimenFiscal === 'FISICA') {
            if (!this.personaForm.valid) {
                this.toastr.warning('Por favor, completa todos los campos obligatorios.');
                return;
            }
    
            const persona = this.personaForm.value;
            delete persona.idPersona;
    
            this.creditoSeleccionado.obligados.push({
                idPersonaNavigation: persona
            });
    
        } else if (this.regimenFiscal === 'MORAL') {
            if (!this.personaMoralForm.valid) {
                this.toastr.warning('Por favor, completa todos los campos obligatorios.');
                return;
            }

            const personaMoral = this.personaMoralForm.value;
            delete personaMoral.idPersona;
            delete personaMoral.idPersonaMoral;

            this.creditoSeleccionado.obligados.push({
                idPersonaMoralNavigation: personaMoral
            });
        } else {
            this.toastr.warning('Por favor, selecciona un tipo de persona');
        }

        this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
            next: (response) => {
                this.toastr.success('Obligado guardado correctamente.');
                this.onModalClose();
            },
            error: () => {
                this.toastr.error('Error al guardar el obligado.');
            }
        });
    }

    openModalDetalles(credito: ICredito) {
        this.creditoSeleccionado = credito;
        if(this.creditoSeleccionado.idPromotor == 0){
            this.mostrarPromotor = false;
        }else{
            this.mostrarPromotor = true;
        }

        this.loginService.getUsuarios().subscribe((data) => {
            this.usuarios = data.filter(user => user.idUsuario === this.creditoSeleccionado.idPromotor);
            this.nombrePromotor = this.usuarios[0].nombre + ' ' + this.usuarios[0].apellidoPaterno + ' ' + this.usuarios[0].apellidoMaterno;
        });

        const modalElement = this.elementRef.nativeElement.querySelector('#modalDetalles') as HTMLElement;
        if (modalElement) {
            const modal = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();
        } else {
            console.error('Modal element not found');
        }
    }

    onModalCloseDetalles() {}

    guardarEdicionAval() {
        let index = -1;

        // Encontrar el índice del aval seleccionado
        if (this.avalSeleccionado.idPersonaNavigation) {
            index = this.creditoSeleccionado.avals!.findIndex(a =>
                a.idPersonaNavigation?.nombre === this.avalSeleccionado.idPersonaNavigation.nombre &&
                a.idPersonaNavigation?.apellidoPaterno === this.avalSeleccionado.idPersonaNavigation.apellidoPaterno &&
                a.idPersonaNavigation?.apellidoMaterno === this.avalSeleccionado.idPersonaNavigation.apellidoMaterno
            );
        } else if (this.avalSeleccionado.idPersonaMoralNavigation) {
            index = this.creditoSeleccionado.avals!.findIndex(a =>
                a.idPersonaMoralNavigation?.razonSocial === this.avalSeleccionado.idPersonaMoralNavigation.razonSocial &&
                a.idPersonaMoralNavigation?.razonComercial === this.avalSeleccionado.idPersonaMoralNavigation.razonComercial &&
                a.idPersonaMoralNavigation?.rfc === this.avalSeleccionado.idPersonaMoralNavigation.rfc
            );
        }
    
        if (index !== -1) {
            // Actualizar el aval seleccionado con los datos del formulario
            if (this.avalSeleccionado.idPersonaNavigation) {
                this.creditoSeleccionado.avals![index].idPersonaNavigation = { ...this.personaForm.value };
            } else if (this.avalSeleccionado.idPersonaMoralNavigation) {
                this.creditoSeleccionado.avals![index].idPersonaMoralNavigation = { ...this.personaMoralForm.value };
            }
        } else {
            console.error('Aval seleccionado no encontrado en el crédito.');
            return;
        }

        this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
            next: (response) => {
                this.toastr.success('Datos actualizados correctamente.');
                this.onModalClose();
            },
            error: (error) => {
                console.error('Error actualizando los datos:', error);
                this.toastr.error('Error al actualizar los datos.');
            }
        });
    }

    async eliminarAvalPregunta(aval: any) {
        if(this.creditoSeleccionado.estatus != 1) {
            this.toastr.error('No se pueden borrar los datos de un crédito activo');
            return;
        }
        const result = await Swal.fire({
            title: '¿Eliminar Aval?',
            text: "¿Estás seguro de eliminar este aval?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.eliminarAval(aval);
        }
    }

    eliminarAval(aval: any) {
        let index = -1;

        if (aval.idPersonaNavigation) {
            // Comparación para persona física
            index = this.creditoSeleccionado.avals!.findIndex(a => 
                a.idPersonaNavigation?.nombre === aval.idPersonaNavigation.nombre &&
                a.idPersonaNavigation?.apellidoPaterno === aval.idPersonaNavigation.apellidoPaterno &&
                a.idPersonaNavigation?.apellidoMaterno === aval.idPersonaNavigation.apellidoMaterno
            );
        } else if (aval.idPersonaMoralNavigation) {
            // Comparación para persona moral
            index = this.creditoSeleccionado.avals!.findIndex(a => 
                a.idPersonaMoralNavigation?.razonSocial === aval.idPersonaMoralNavigation.razonSocial &&
                a.idPersonaMoralNavigation?.razonComercial === aval.idPersonaMoralNavigation.razonComercial &&
                a.idPersonaMoralNavigation?.rfc === aval.idPersonaMoralNavigation.rfc
            );
        }

        if (index !== -1) {
            this.creditoSeleccionado.avals!.splice(index, 1);
        }

        this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
            next: (response) => {
                this.toastr.success('Aval eliminado correctamente.');
                this.onModalClose();
            },
            error: () => {
                this.toastr.error('Error al guardar el aval.');
            }
        });
    }

    guardarEdicionObligado() {
        let index = -1;

        if (this.obligadoSeleccionado.idPersonaNavigation) {
            index = this.creditoSeleccionado.obligados!.findIndex(o =>
                o.idPersonaNavigation?.nombre === this.obligadoSeleccionado.idPersonaNavigation.nombre &&
                o.idPersonaNavigation?.apellidoPaterno === this.obligadoSeleccionado.idPersonaNavigation.apellidoPaterno &&
                o.idPersonaNavigation?.apellidoMaterno === this.obligadoSeleccionado.idPersonaNavigation.apellidoMaterno
            );
        } else if (this.obligadoSeleccionado.idPersonaMoralNavigation) {
            index = this.creditoSeleccionado.obligados!.findIndex(o =>
                o.idPersonaMoralNavigation?.razonSocial === this.obligadoSeleccionado.idPersonaMoralNavigation.razonSocial &&
                o.idPersonaMoralNavigation?.razonComercial === this.obligadoSeleccionado.idPersonaMoralNavigation.razonComercial &&
                o.idPersonaMoralNavigation?.rfc === this.obligadoSeleccionado.idPersonaMoralNavigation.rfc
            );
        }
    
        if (index !== -1) {
            if (this.obligadoSeleccionado.idPersonaNavigation) {
                this.creditoSeleccionado.obligados![index].idPersonaNavigation = { ...this.personaForm.value };
            } else if (this.obligadoSeleccionado.idPersonaMoralNavigation) {
                this.creditoSeleccionado.obligados![index].idPersonaMoralNavigation = { ...this.personaMoralForm.value };
            }
        } else {
            console.error('Obligado seleccionado no encontrado en el crédito.');
            return;
        }

        this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
            next: (response) => {
                this.toastr.success('Datos actualizados correctamente.');
                this.onModalClose();
            },
            error: (error) => {
                console.error('Error actualizando los datos:', error);
                this.toastr.error('Error al actualizar los datos.');
            }
        });
    }

    async eliminarObligadoPregunta(obligado: any) {
        if(this.creditoSeleccionado.estatus != 1) {
            this.toastr.error('No se pueden borrar los datos de un crédito activo');
            return;
        }
        const result = await Swal.fire({
            title: '¿Eliminar Obligado?',
            text: "¿Estás seguro de eliminar este obligado?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.eliminarObligado(obligado);
        }
    }

    eliminarObligado(obligado: any) {
        let index = -1;

        if (obligado.idPersonaNavigation) {
            // Comparación para persona física
            index = this.creditoSeleccionado.obligados!.findIndex(a => 
                a.idPersonaNavigation?.nombre === obligado.idPersonaNavigation.nombre &&
                a.idPersonaNavigation?.apellidoPaterno === obligado.idPersonaNavigation.apellidoPaterno &&
                a.idPersonaNavigation?.apellidoMaterno === obligado.idPersonaNavigation.apellidoMaterno
            );
        } else if (obligado.idPersonaMoralNavigation) {
            // Comparación para persona moral
            index = this.creditoSeleccionado.obligados!.findIndex(a => 
                a.idPersonaMoralNavigation?.razonSocial === obligado.idPersonaMoralNavigation.razonSocial &&
                a.idPersonaMoralNavigation?.razonComercial === obligado.idPersonaMoralNavigation.razonComercial &&
                a.idPersonaMoralNavigation?.rfc === obligado.idPersonaMoralNavigation.rfc
            );
        }
    
        if (index !== -1) {
            this.creditoSeleccionado.obligados!.splice(index, 1);
        }

        this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
            next: (response) => {
                this.toastr.success('Obligado eliminado correctamente.');
                this.onModalClose();
            },
            error: () => {
                this.toastr.error('Error al guardar el obligado.');
            }
        });
    }

    openModalEditar(entity: any, tipo: string) {
        this.selectedEntity = entity;

        if (!this.selectedEntity) {
            console.error('Entity is not defined');
            return;
        }

        if(tipo === 'aval') {
            if (this.selectedEntity.idPersonaNavigation) {
                this.personaForm.patchValue(this.selectedEntity.idPersonaNavigation);
                this.avalSeleccionado = this.selectedEntity;

                const modalElement = this.elementRef.nativeElement.querySelector('#modalEditarFisicas') as HTMLElement;
                if (modalElement) {
                    const modal = new (window as any).bootstrap.Modal(modalElement, {
                        backdrop: 'static',
                        keyboard: false
                    });
                    modal.show();
                } else {
                    console.error('Modal element not found');
                }
            } else if (this.selectedEntity.idPersonaMoralNavigation) {
                this.personaMoralForm.patchValue(this.selectedEntity.idPersonaMoralNavigation);
                this.avalSeleccionado = this.selectedEntity;
    
                const modalElement = this.elementRef.nativeElement.querySelector('#editarMorales') as HTMLElement;
                if (modalElement) {
                    const modal = new (window as any).bootstrap.Modal(modalElement, {
                        backdrop: 'static',
                        keyboard: false
                    });
                    modal.show();
                } else {
                    console.error('Modal element not found');
                }
            }
        } else if(tipo === 'obligado') {
            if (this.selectedEntity.idPersonaNavigation) {
                this.personaForm.patchValue(this.selectedEntity.idPersonaNavigation);
                this.obligadoSeleccionado = this.selectedEntity;
    
                const modalElement = this.elementRef.nativeElement.querySelector('#modalEditarFisicas') as HTMLElement;
                if (modalElement) {
                    const modal = new (window as any).bootstrap.Modal(modalElement, {
                        backdrop: 'static',
                        keyboard: false
                    });
                    modal.show();
                } else {
                    console.error('Modal element not found');
                }
            } else if (this.selectedEntity.idPersonaMoralNavigation) {
                this.personaMoralForm.patchValue(this.selectedEntity.idPersonaMoralNavigation);
                this.obligadoSeleccionado = this.selectedEntity;

                const modalElement = this.elementRef.nativeElement.querySelector('#editarMorales') as HTMLElement;
                if (modalElement) {
                    const modal = new (window as any).bootstrap.Modal(modalElement, {
                        backdrop: 'static',
                        keyboard: false
                    });
                    modal.show();
                } else {
                    console.error('Modal element not found');
                }
            }
        }
    }

    guardarEdicion(){
        if(this.creditoSeleccionado.estatus != 1) {
            this.toastr.error('No se pueden editar los datos de este credito');
            return;
        }
        if(this.avalSeleccionado){
            if(this.avalSeleccionado.idPersonaNavigation){
                if(!this.personaForm.valid){
                    this.toastr.warning('Por favor, completa todos los campos obligatorios.');
                    return;
                }else{
                    this.guardarEdicionAval();
                }
            } else if(this.avalSeleccionado.idPersonaMoralNavigation){
                if(!this.personaMoralForm.valid){
                    this.toastr.warning('Por favor, completa todos los campos obligatorios.');
                    return;
                }else{
                    this.guardarEdicionAval();
                }
            }
        }
        else if (this.obligadoSeleccionado){
            if(this.obligadoSeleccionado.idPersonaNavigation){
                if(!this.personaForm.valid){
                    this.toastr.warning('Por favor, completa todos los campos obligatorios.');
                    return;
                }else{
                    this.guardarEdicionObligado();
                }
            } else if(this.obligadoSeleccionado.idPersonaMoralNavigation){
                if(!this.personaMoralForm.valid){
                    this.toastr.warning('Por favor, completa todos los campos obligatorios.');
                    return;
                }else{
                    this.guardarEdicionObligado();
                }
            }
        }
    }

    openModalFirma(credito: ICredito) {
        this.creditoSeleccionado = credito;

        const modalElement = this.elementRef.nativeElement.querySelector('#firmarCredito') as HTMLElement;
        if (modalElement) {
            const modal = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();
        } else {
            console.error('Modal element not found');
        }
    }

    openModalAceptar(credito: ICredito) {
        this.creditoSeleccionado = credito;

        const modalElement = this.elementRef.nativeElement.querySelector('#aceptarCredito') as HTMLElement;
        if (modalElement) {
            const modal = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();
        } else {
            console.error('Modal element not found');
        }
    }

    guardarFirma(){
        if(!this.fechaFirma){
            this.toastr.warning('Por favor, selecciona una fecha.');
            return;
        }

        if(this.creditoSeleccionado.idPromotor == 0){
            this.toastr.warning('Por favor, selecciona un promotor primero.');
            return;
        }

        this.creditoSeleccionado.fechaFirma = this.fechaFirma;
        this.creditoSeleccionado.estatus = 2;

        this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
            next: (response) => {
                this.toastr.success('Crédito firmado correctamente.');
                this.onModalClose();
            },
            error: () => {
                this.toastr.error('Error al firmar el crédito.');
            }
        });
    }

    guardarActivacion() {
        if (!this.fechaActivacion) {
            this.toastr.warning('Por favor, selecciona una fecha.');
            return;
        }

        // Verificar que la fecha de firma esté definida
        if (!this.creditoSeleccionado.fechaFirma) {
            this.toastr.error('La fecha de aceptación no está definida.');
            return;
        }

        const fechaActivacionDate = new Date(this.fechaActivacion);
        const fechaFirmaDate = new Date(this.creditoSeleccionado.fechaFirma);

        if (fechaActivacionDate < fechaFirmaDate) {
            this.toastr.warning('La fecha de activación no puede ser anterior a la fecha de firma.');
            return;
        }

        this.creditoSeleccionado.fechaActivacion = this.fechaActivacion;
        this.creditoSeleccionado.estatus = 3;

        this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
            next: (response) => {
                this.toastr.success('Crédito activado correctamente.');
                this.onModalClose();
            },
            error: () => {
                this.toastr.error('Error al activar el crédito.');
            }
        });
    }

    openModalPromotor(credito: ICredito) {
        this.creditoSeleccionado = credito;
        const selectElement = this.elementRef.nativeElement.querySelector('#promotorSelect') as HTMLSelectElement;
        if (selectElement) {
            selectElement.value = ""; 
        }
        this.ngAfterViewChecked();

        this.loginService.getUsuarios().subscribe((data) => {
            this.usuarios = data.filter(user => user.idRol === 2);
        });
    
        const modalElement = this.elementRef.nativeElement.querySelector('#promotorModal') as HTMLElement;
        if (modalElement) {
            const modal = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();
        } else {
            console.error('Modal element not found');
        }
    }

    onModalClosePromotor() {
        this.idPromotorSeleccionado = null;
        this.ngAfterViewChecked();

        const modalElement = this.elementRef.nativeElement.querySelector('#promotorModal');
        if (modalElement) {
            const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    }

    ngAfterViewChecked() {
        if (this.idPromotorSeleccionado === null) {
            const selectElement = this.elementRef.nativeElement.querySelector('#promotorSelect') as HTMLSelectElement;
            if (selectElement) {
                selectElement.value = "";
            }
        }
    }

    async asignarPromotor() {
        if (!this.idPromotorSeleccionado) {
            this.toastr.warning('Por favor, selecciona un promotor.');
            return;
        }
        console.log(this.idPromotorSeleccionado);

        const result = await Swal.fire({
            title: '¿Asignar promotor?',
            text: "¿Estás seguro de asignar a este promotor? No podra cambiarlo posteriormente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, asignar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.creditoSeleccionado.idPromotor = this.idPromotorSeleccionado;

            this.creditosService.actualizarCredito(this.creditoSeleccionado).subscribe({
                next: (response) => {
                    this.toastr.success('Promotor asignado correctamente.');
                    this.onModalClosePromotor();
                    this.obtenerCreditosYClientes();
                },
                error: () => {
                    this.toastr.error('Error al asignar el promotor.');
                }
            });
        }
    }
}
