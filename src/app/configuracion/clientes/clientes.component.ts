import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ClientesService } from '../../services/clientes.service';
import { ICliente } from '../../interfaces/cliente';
import { IDatosClienteFisica } from '../../interfaces/datosClienteFisica';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, ValueChangeEvent } from '@angular/forms';
import { IPersonaMoral } from '../../interfaces/personaMoral';
import { IDatosClienteMoral } from '../../interfaces/datosClienteMoral';
import { IPersona } from '../../interfaces/persona';
import { ICatalogoDocumento } from '../../interfaces/catalogoDocumento';
import { ToastrService } from 'ngx-toastr';
import { IUsuarioCliente } from '../../interfaces/usuarioCliente';
import { CodigoPostalService } from '../../services/codigo-postal.service';

declare let Swal: any;

@Component({
    selector: 'app-clientes',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './clientes.component.html',
    styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit {
    modalTitle: string = '';
    codigoPostalBusqueda = '';
    clienteForm: FormGroup;
    clientes: ICliente[] = [];
    mostrarFisica: boolean = false;
    @ViewChild('modalElement', { static: false }) modalElement!: ElementRef;
    filteredClientes: any[] = [];
    datosLoginForm: FormGroup;
    idClienteSeleccionado: number = 0;
    usuarioCliente: IUsuarioCliente = {} as IUsuarioCliente;
    passwordVisible: boolean = false;

    constructor(
        private clientesService: ClientesService,
        private cpService: CodigoPostalService,
        private fb: FormBuilder,
        private elementRef: ElementRef,
        private toastr: ToastrService
    ) {
        this.clienteForm = this.fb.group({
            idCliente: [0],
            regimenFiscal: ['', Validators.required],
            idEmpresa: [0],
            estatus: [1, Validators.required],
            datosClienteFisicas: this.fb.array([this.createDatosClienteFisicaGroup({} as IDatosClienteFisica)]),
            datosClienteMorals: this.fb.array([this.createDatosClienteMoralGroup({} as IDatosClienteMoral)]),
        });
        this.datosLoginForm = this.fb.group({
            idUsuarioCliente: [0],
            idCliente: [0],
            usuario: ['', Validators.required],
            contrasenia: ['', Validators.required],
            estatus: [1],
        });
    }

    ngOnInit(): void {
        this.obtenerClientes();
    }

    obtenerCodigoPostalChange(event: any): void {
    
        this.codigoPostalBusqueda = event.target.value;
        console.log(this.codigoPostalBusqueda);
    
        
    }
    
    obtenerCodigoPostal(): void {
        this.cpService.getCodigosPostales(this.codigoPostalBusqueda).subscribe({
            next: (response: any) => {
                // const codigoPostal = response[0];
                console.log(response);
            },
            error: (error) => {
                console.error('Error al obtener el Código Postal:', error);
            }, 
            }
        );
    }

    filterClientes(event: any): void {
        const searchTerm = event.target.value.toLowerCase();
        this.filteredClientes = this.clientes.filter(cliente => 
            cliente.regimenFiscal?.toLowerCase().includes(searchTerm) ||
            (cliente.datosClienteFisicas && cliente.datosClienteFisicas[0] && cliente.datosClienteFisicas[0].idPersonaNavigation && cliente.datosClienteFisicas[0].idPersonaNavigation.nombre?.toLowerCase().includes(searchTerm)) ||
            (cliente.datosClienteMorals && cliente.datosClienteMorals[0] && cliente.datosClienteMorals[0].nombreRepLegal?.toLowerCase().includes(searchTerm))
        );
    }

    onRegimenFiscalCambio(event: any): void {
        const selectedRegimen = event.target.value;
        this.filtrarClientes(selectedRegimen);
    }

    filtrarClientes(regimen: string): void {
        if (regimen) {
            this.filteredClientes = this.clientes.filter(cliente => cliente.regimenFiscal === regimen);
        } else {
          this.filteredClientes = this.clientes; // Si no hay un régimen seleccionado, muestra todos los clientes
        }
    }

    obtenerClientes(): void {
        this.clientesService.getClientes().subscribe({
            next: (data: ICliente[]) => {
                this.clientes = data;
                console.log(this.clientes);
                this.filteredClientes = this.clientes;
            },
            error: (error) => {
                this.toastr.error('Error al obtener la lista de clientes', 'Error');
            }
        });
    }

    get datosClienteFisicas(): FormArray {
        return this.clienteForm.get('datosClienteFisicas') as FormArray;
    }

    get datosClienteMorals(): FormArray {
        return this.clienteForm.get('datosClienteMorals') as FormArray;
    }

    openModal(mode: 'add' | 'edit', cliente?: ICliente): void {
        this.modalTitle = mode === 'add' ? 'Agregar Cliente' : 'Editar Cliente';

        if (mode === 'add') {
            this.clienteForm.reset({
                idCliente: 0,
                regimenFiscal: '',
                idEmpresa: 1,
                estatus: 1,
                datosClienteFisicas: this.fb.array([]),
                datosClienteMorals: this.fb.array([])
            });
            this.mostrarFisica = false;
            // Habilitar el campo de regimenFiscal en modo agregar
            this.clienteForm.get('regimenFiscal')?.enable();
        } else if (mode === 'edit' && cliente) {
            this.mostrarFisica = cliente.regimenFiscal === 'FISICA';

            this.clienteForm.patchValue({
                idCliente: cliente.idCliente,
                regimenFiscal: cliente.regimenFiscal || '',
                idEmpresa: cliente.idEmpresa || 0,
                estatus: cliente.estatus,
            });

            // Deshabilitar el campo de regimenFiscal en modo editar
            this.clienteForm.get('regimenFiscal')?.disable();

            // Limpiar y llenar FormArray datosClienteFisicas
            this.datosClienteFisicas.clear();
            if (cliente.datosClienteFisicas) {
                cliente.datosClienteFisicas.forEach(fisica => {
                    this.datosClienteFisicas.push(this.createDatosClienteFisicaGroup(fisica));
                });
            }

            // Limpiar y llenar FormArray datosClienteMorals
            this.datosClienteMorals.clear();
            if (cliente.datosClienteMorals) {
                cliente.datosClienteMorals.forEach(moral => {
                    this.datosClienteMorals.push(this.createDatosClienteMoralGroup(moral));
                });
            }
        }

        const modal = new (window as any).bootstrap.Modal(this.elementRef.nativeElement.querySelector('#staticBackdrop') as HTMLElement, {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();
    }

    guardar(): void {
        const regimenFiscalControl = this.clienteForm.get('regimenFiscal');
        if (regimenFiscalControl) {
            regimenFiscalControl.enable();
        }
    
        const regimenFiscal = this.clienteForm.get('regimenFiscal')?.value;
        const idCliente = this.clienteForm.get('idCliente')?.value;
        let clienteData = this.clienteForm.value;
    
        // Validar campos según el régimen fiscal
        if (regimenFiscal === 'FISICA') {
            if (!this.validateDatosClienteFisicas()) {
                this.toastr.warning('Por favor, complete todos los campos obligatorios de Persona Física.', 'Formulario inválido');
                return;
            }
            clienteData.datosClienteMorals = [];
        } else if (regimenFiscal === 'MORAL') {
            if (!this.validateDatosClienteMorals()) {
                this.toastr.warning('Por favor, complete todos los campos obligatorios de Persona Moral.', 'Formulario inválido');
                return;
            }
            clienteData.datosClienteFisicas = [];
        }
    
        clienteData.datosClienteFisicas = clienteData.datosClienteFisicas || [];
        clienteData.datosClienteMorals = clienteData.datosClienteMorals || [];
    
        const tieneDatosFisicos = clienteData.datosClienteFisicas.length > 0;
        const tieneDatosMorales = clienteData.datosClienteMorals.length > 0;
        console.log('Datos a enviar:', clienteData);
    
        if (idCliente === 0) {
            if (tieneDatosFisicos || tieneDatosMorales) {
                // Insertar cliente
                this.clientesService.insertarCliente(clienteData).subscribe({
                    next: (nuevoCliente) => {
                        this.obtenerClientes();
                        this.closeModal();
                        this.toastr.success('Cliente insertado correctamente', 'Éxito');

                        // Asignar documentos automáticamente según el régimen fiscal sin mostrar mensaje de éxito
                        const tipo = clienteData.regimenFiscal;
                        this.clientesService.asignarDocumentosPorTipo(nuevoCliente.idCliente, tipo).subscribe({
                            error: () => this.toastr.error('Error al asignar documentos automáticamente', 'Error')
                        });
                    },
                    error: () => {
                        this.toastr.error('Error al insertar el cliente', 'Error');
                    }
                });
            } else {
                this.toastr.error('Por favor, ingrese datos del cliente', 'Formulario inválido');
            }
        } else {
            if (this.clienteForm.valid) {
                this.clientesService.actualizarCliente(clienteData).subscribe({
                    next: () => {
                        this.obtenerClientes();
                        this.closeModal();
                        this.toastr.success('Cliente editado correctamente', 'Éxito');
                    },
                    error: () => this.toastr.error('Error al actualizar el cliente', 'Error')
                });
            } else {
                this.toastr.error('Por favor, complete los campos obligatorios', 'Formulario inválido');
            }
        }
    
        if (regimenFiscalControl && this.modalTitle === 'Editar Cliente') {
            regimenFiscalControl.disable();
        }
    }    

    // Validar los campos de persona física
    validateDatosClienteFisicas(): boolean {
        let esValido = true;
        this.datosClienteFisicas.controls.forEach(control => {
            if (!control.valid) {
                esValido = false;
            }
        });
        return esValido;
    }

    // Validar los campos de persona moral
    validateDatosClienteMorals(): boolean {
        let esValido = true;
        this.datosClienteMorals.controls.forEach(control => {
            if (!control.valid) {
                esValido = false;
            }
        });
        return esValido;
    }

    replaceEmptyIds(data: any): void {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key] === null || data[key] === undefined) {
                    data[key] = 0;
                } else if (typeof data[key] === 'object') {
                    this.replaceEmptyIds(data[key]);
                }
            }
        }
    }

    closeModal() {
        const modalElement = this.elementRef.nativeElement.querySelector('#staticBackdrop');
        if (modalElement) {
            const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
        this.onModalClose();
    }

    onModalClose(): void {
        this.clienteForm.reset();

        const datosClienteFisicasControl = this.clienteForm.get('datosClienteFisicas') as FormArray;
        const datosClienteMoralsControl = this.clienteForm.get('datosClienteMorals') as FormArray;

        if (datosClienteFisicasControl) {
            datosClienteFisicasControl.clear(); 
        }

        if (datosClienteMoralsControl) {
            datosClienteMoralsControl.clear();
        }

        const regimenFiscalControl = this.clienteForm.get('regimenFiscal');
        if (regimenFiscalControl) {
            regimenFiscalControl.setValue(''); 
        }
    }

    async eliminar(cliente: ICliente) {
        const result = await Swal.fire({
            title: '¿Eliminar cliente?',
            text: "¿Estás seguro de eliminar este cliente?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.clientesService.eliminarCliente(cliente.idCliente).subscribe({
                next: () => {
                    this.toastr.success('Cliente eliminado con éxito.', 'Eliminado');
                    this.obtenerClientes();
                },
                error: (error) => {
                    this.toastr.error('Error al eliminar el cliente.', 'Error');
                }
            });
        }
    }

    onRegimenFiscalChange(event: any): void {
        const selectedValue = event.target.value;
        this.mostrarFisica = selectedValue === 'FISICA';

        if (this.mostrarFisica) {
            this.datosClienteFisicas.clear();
            this.datosClienteFisicas.push(this.createDatosClienteFisicaGroup({} as IDatosClienteFisica));
        } else {
            this.datosClienteMorals.clear();
            this.datosClienteMorals.push(this.createDatosClienteMoralGroup({} as IDatosClienteMoral));
        }
    }

    // ------------- Sección de llenado de FormGroups -----------
    createDatosClienteFisicaGroup(fisica: IDatosClienteFisica): FormGroup {
        return this.fb.group({
            idClienteFisica: [fisica.idClienteFisica || 0],
            idPersona: [fisica.idPersona || 0],
            idCliente: [fisica.idCliente || 0],
            idPersonaNavigation: this.createPersonaGroup(fisica.idPersonaNavigation || {} as IPersona)
        });
    }

    createDatosClienteMoralGroup(moral: IDatosClienteMoral): FormGroup {
        return this.fb.group({
            idClienteMoral: [moral.idClienteMoral || 0],
            idPersonaMoral: [moral.idPersonaMoral || 0],
            nombreRepLegal: [moral.nombreRepLegal],
            rfcrepLegal: [moral.rfcrepLegal],
            idCliente: [moral.idCliente || 0],
            idPersonaMoralNavigation: this.createPersonaMoralGroup(moral.idPersonaMoralNavigation || {} as IPersonaMoral)
        });
    }

    createPersonaGroup(persona: IPersona): FormGroup {
        return this.fb.group({
            idPersona: [persona.idPersona || 0],
            nombre: [persona.nombre, Validators.required],
            apellidoPaterno: [persona.apellidoPaterno, Validators.required],
            apellidoMaterno: [persona.apellidoMaterno, Validators.required],
            fechaNacimiento: [persona.fechaNacimiento, Validators.required],
            paisNacimiento: [persona.paisNacimiento],
            estadoNacimiento: [persona.estadoNacimiento, Validators.required],
            genero: [persona.genero, Validators.required],
            rfc: [persona.rfc, Validators.required],
            curp: [persona.curp, Validators.required],
            claveElector: [persona.claveElector],
            nacionalidad: [persona.nacionalidad],
            estadoCivil: [persona.estadoCivil],
            regimenMatrimonial: [persona.regimenMatrimonial],
            nombreConyuge: [persona.nombreConyuge],
            calle: [persona.calle, Validators.required],
            numExterior: [persona.numExterior, Validators.required],
            numInterior: [persona.numInterior],
            colonia: [persona.colonia, Validators.required],
            codigoPostal: [persona.codigoPostal, Validators.required],
            paisResidencia: [persona.paisResidencia, Validators.required],
            estadoResidencia: [persona.estadoResidencia, Validators.required],
            ciudadResidencia: [persona.ciudadResidencia, Validators.required],
            email: [persona.email, Validators.required],
            telefono: [persona.telefono]
        });
    }

    createPersonaMoralGroup(personaMoral: IPersonaMoral): FormGroup {
        return this.fb.group({
            idPersonaMoral: [personaMoral.idPersonaMoral || 0],
            razonSocial: [personaMoral.razonSocial, Validators.required],
            razonComercial: [personaMoral.razonComercial],
            fechaConstitucion: [personaMoral.fechaConstitucion, Validators.required],
            rfc: [personaMoral.rfc, Validators.required],
            nacionalidad: [personaMoral.nacionalidad, Validators.required],
            paisRegistro: [personaMoral.paisRegistro, Validators.required],
            estadoRegistro: [personaMoral.estadoRegistro, Validators.required],
            ciudadRegistro: [personaMoral.ciudadRegistro, Validators.required],
            numEscritura: [personaMoral.numEscritura, Validators.required],
            fechaRppc: [personaMoral.fechaRppc],
            nombreNotario: [personaMoral.nombreNotario],
            numNotario: [personaMoral.numNotario],
            folioMercantil: [personaMoral.folioMercantil],
            calle: [personaMoral.calle, Validators.required],
            numExterior: [personaMoral.numExterior, Validators.required],
            numInterior: [personaMoral.numInterior],
            colonia: [personaMoral.colonia, Validators.required],
            codigoPostal: [personaMoral.codigoPostal, Validators.required],
            paisResidencia: [personaMoral.paisResidencia, Validators.required],
            estadoResidencia: [personaMoral.estadoResidencia, Validators.required],
            ciudadResidencia: [personaMoral.ciudadResidencia, Validators.required],
        });
    }

    createClienteGroup(cliente: ICliente): FormGroup {
        return this.fb.group({
            idCliente: [cliente.idCliente || 0],
            regimenFiscal: [cliente.regimenFiscal, Validators.required],
            idEmpresa: [cliente.idEmpresa || 1],
            estatus: [cliente.estatus],
            datosClienteFisicas: this.fb.array([]),
            datosClienteMorals: this.fb.array([]),
        });
    }

    createCatalogoDocumentoGroup(catalogoDocumento: ICatalogoDocumento): FormGroup {
        return this.fb.group({
            idCatalogoDocumento: [catalogoDocumento.idCatalogoDocumento || 0],
            nombre: [catalogoDocumento.nombre],
            tipo: [catalogoDocumento.tipo],
            estatus: [catalogoDocumento.estatus]
        });
    }

    async guardarLogin() {
        this.datosLoginForm.patchValue({ estatus: 1 });

        if (!this.datosLoginForm.valid) {
            this.toastr.warning('Por favor, complete todos los campos obligatorios.', 'Formulario inválido');
            return;
        }

        if(this.datosLoginForm.get('idUsuarioCliente')?.value == 0){
            // Guardar nuevo usuario
            this.clientesService.addUsuarioCliente(this.datosLoginForm.value).subscribe({
                next: () => {
                    this.obtenerUsuarioCliente();
                    this.toastr.success('Usuario guardado correctamente', 'Éxito');
                    this.onModalCloseLogin();
                },
                error: (error) => this.toastr.error('Ocurrio un error al guardar el usuario', 'Error')
            })
        }else {
            // Actualizar usuario
            this.clientesService.updateUsuarioCliente(this.datosLoginForm.value).subscribe({
                next: () => {
                    this.obtenerUsuarioCliente();
                    this.toastr.success('Usuario actualizado correctamente', 'Éxito');
                    this.onModalCloseLogin();
                },
                error: (error) => this.toastr.error('Ocurrio un error al actualizar el usuario', 'Error')
            })
        }
    }

    obtenerUsuarioCliente(): Promise<void> {
        return new Promise((resolve) => {
            this.clientesService.getUsuarioCliente(this.idClienteSeleccionado).subscribe({
                next: (data: IUsuarioCliente | null) => {
                    if (data) {
                        this.usuarioCliente = data;
                    } else {
                        this.usuarioCliente = {
                            idUsuarioCliente: 0,
                            idCliente: this.idClienteSeleccionado,
                            usuario: '',
                            contrasenia: '',
                            estatus: 1
                        };
                    }
                    resolve();
                }
            });
        });
    }
    
    async openModalLogin(idCliente: number) {
        this.idClienteSeleccionado = idCliente;
        await this.obtenerUsuarioCliente();

        this.datosLoginForm.patchValue({
            idUsuarioCliente: this.usuarioCliente.idUsuarioCliente,
            idCliente: this.usuarioCliente.idCliente,
            usuario: this.usuarioCliente.usuario,
            contrasenia: this.usuarioCliente.contrasenia,
            estatus: this.usuarioCliente.estatus
        });
    
        const modal = new (window as any).bootstrap.Modal(this.elementRef.nativeElement.querySelector('#modalLogin') as HTMLElement, {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();
    }

    onModalCloseLogin(){
        this.datosLoginForm.reset();
        this.idClienteSeleccionado = 0;

        const modalElement = this.elementRef.nativeElement.querySelector('#modalLogin');
        if (modalElement) {
            const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    }

    togglePasswordVisibility() {
        this.passwordVisible = !this.passwordVisible;
    }

    limitarCaracteres(event: any, maxLength: number): void {
        const input = event.target;
        maxLength = maxLength;
        if (input.value.length > maxLength) {
            input.value = input.value.slice(0, maxLength);
        }
    }
}
