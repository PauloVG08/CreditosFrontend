import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ClientesService } from '../../services/clientes.service';
import { DocumentosService } from '../../services/documentos.service';
import { DocumentPorClienteService } from '../../services/documento-cliente.service';
import { ICliente } from '../../interfaces/cliente';
import { IDocumento } from '../../interfaces/documentos';
import { CommonModule } from '@angular/common';
import { INuevoDocumento } from '../../interfaces/nuevoDocumento';
import { ICDocumentoCliente } from '../../interfaces/documentoCliente';

@Component({
    selector: 'app-documentousuario',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, FormsModule],
    templateUrl: './documentousuario.component.html',
    styleUrls: ['./documentousuario.component.scss']
})
export class DocumentousuarioComponent implements OnInit {
    modalTitle: string = '';
    clienteNombre: string = ''; 
    clienteTipo: string = '';
    documentoCForm: FormGroup;
    documentosAsignarForm: FormGroup;
    clientes: ICliente[] = [];
    documentos: IDocumento[] = [];
    documentosCliente: any[] = [];
    documentosFaltantes: IDocumento[] = [];
    documentosSubidos: any[] = [];
    documentosTodos: any[] = [];
    documentosMostrar: ICDocumentoCliente[] = [];
    documentosFiltrados: IDocumento[] = [];
    documentosAsignadosIds: any[] = [];
    selectedFileName: { [key: number]: string } = {};
    idClienteSeleccionado: number = 0;
    selectedDocumento: IDocumento | null = null;
    documentoBase64: string = '';
    documentosModalForm: FormGroup;

    @ViewChild('fileInput') fileInput!: ElementRef;
    filteredClientes: any[] = [];

    constructor(
        private elementRef: ElementRef,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private clientesService: ClientesService,
        private documentosService: DocumentosService,
        private documentPorClienteService: DocumentPorClienteService
    ) {
        this.documentoCForm = this.fb.group({
            idDocumento: [0],
            idCliente: [1]
        });

        this.documentosAsignarForm = this.fb.group({});
        this.documentosModalForm = this.fb.group({});
    }

    ngOnInit(): void {
        this.obtenerClientes();
        this.obtenerDocumentos();
    }

    filterDocumentosCliente(event: any): void {
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

    obtenerDocumentosCliente(idCliente: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.documentPorClienteService.getDocumentosCliente(idCliente).subscribe(
                (data: ICDocumentoCliente[]) => {
                    this.documentosCliente = data;
                    resolve();
                },
                (error) => {
                    this.toastr.error('No se pudieron obtener los documentos. Inténtelo de nuevo más tarde.', 'Error');
                    reject(error);
                }
            );
        });
    }

    obtenerClientes(): void {
        this.clientesService.getClientes().subscribe({
            next: (data: ICliente[]) => {
                this.clientes = data;
                this.filteredClientes = this.clientes;
            },
            error: (error) => {
                this.toastr.error('Error al obtener la lista de clientes', 'Error');
            }
        });
    }

    obtenerDocumentos(): void {
        this.documentosService.getDocumentos().subscribe(
            (data: IDocumento[]) => {
                this.documentos = data;
            },
            (error) => {
                this.toastr.error('No se pudieron obtener los documentos. Inténtelo de nuevo más tarde.', 'Error');
            }
        );
    }

    openDocumentosModal(idCliente: number, regimenFiscal: string): void {
        const cliente = this.clientes.find(c => c.idCliente === idCliente);
        if (cliente) {
            if (regimenFiscal === 'MORAL') {
                this.clienteNombre = cliente.datosClienteMorals && cliente.datosClienteMorals.length > 0
                    ? cliente.datosClienteMorals[0].nombreRepLegal || 'N/A'
                    : 'N/A';
                this.clienteTipo = 'Moral';
            } else {
                this.clienteNombre = cliente.datosClienteFisicas && cliente.datosClienteFisicas.length > 0
                    ? cliente.datosClienteFisicas[0].idPersonaNavigation
                        ? (cliente.datosClienteFisicas[0].idPersonaNavigation.nombre + ' '
                            + cliente.datosClienteFisicas[0].idPersonaNavigation.apellidoPaterno + ' '
                            + cliente.datosClienteFisicas[0].idPersonaNavigation.apellidoMaterno)
                        : 'N/A'
                    : 'N/A';
                this.clienteTipo = 'Física';
            }
        }

        this.idClienteSeleccionado = idCliente;

        this.documentPorClienteService.getDocumentosAsignados(idCliente).subscribe({
            next: (documentosAsignados) => {
                // Crear un mapa de documentos asignados para referencia rápida
                const documentosAsignadosMap = new Map<number, any>();
                documentosAsignados.forEach(doc => {
                    documentosAsignadosMap.set(doc.idDocumento, doc);
                });

                // Filtrar documentos que están en documentosAsignados y agregar estatusSeguimiento
                const documentosAsignadosIds = Array.from(documentosAsignadosMap.keys());
                const filtrar = this.documentos
                    .filter(doc => doc.tipo === regimenFiscal && documentosAsignadosIds.includes(doc.idCatalogoDocumento))
                    .map(doc => {
                        const asignado = documentosAsignadosMap.get(doc.idCatalogoDocumento);
                        return {
                            ...doc,
                            estatusSeguimiento: asignado ? asignado.estatus : 0,
                            documentoBase64: asignado ? asignado.documentoBase64 : '',
                            iDocumentoCliente: asignado ? asignado.idDocumentoCliente : 0
                        };
                    });

                this.documentosFaltantes = filtrar.filter(doc => doc.estatusSeguimiento === 4);
                this.documentosSubidos = filtrar.filter(doc => doc.estatusSeguimiento !== 4);
                this.documentosTodos = filtrar;

                // Mostrar el modal
                const modalElement = this.elementRef.nativeElement.querySelector('#documentosModal');
                if (modalElement) {
                    const modalInstance = new (window as any).bootstrap.Modal(modalElement, {
                        backdrop: 'static',
                        keyboard: false
                    });
                    modalInstance.show();
                }
            },
            error: (error) => {
                console.error('Error al obtener los documentos del cliente:', error);
                this.toastr.error('No se pudo obtener los documentos. Inténtelo de nuevo más tarde.', 'Error');
            }
        });
        this.modalTitle = `Documentos del Cliente: ${this.clienteNombre} (${this.clienteTipo})`;
    }

    async guardarDocumento(): Promise<void> {
        if (!this.selectedDocumento) {
            this.toastr.warning('Debe seleccionar un documento.', 'Advertencia');
            return;
        }

        if (!this.documentoBase64) {
            this.toastr.warning('Debe seleccionar un archivo para subir.', 'Advertencia');
            return;
        }

        try {
            await this.obtenerDocumentosCliente(this.idClienteSeleccionado);
            const documentoExistente = this.documentosCliente.find(doc => doc.idDocumento === this.selectedDocumento?.idCatalogoDocumento);

            if (!documentoExistente) {
                this.toastr.error('El documento seleccionado no es válido.', 'Error');
                return;
            }

            const data = {
                idDocumentoCliente: documentoExistente.idDocumentoCliente,
                documentoBase64: this.documentoBase64,
                estatus: 3
            };

            // Llamar a guardarDocumento en el servicio
            this.documentPorClienteService.guardarDocumento(data).subscribe({
                next: (response) => {
                    this.toastr.success('Documento guardado exitosamente.', 'Éxito');
                    // Cerrar el modal
                    const modalElement = this.elementRef.nativeElement.querySelector('#documentosModal');
                    if (modalElement) {
                        const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
                        modalInstance.hide();
                    }
                    // Limpiar selección
                    this.onModalClose();
                },
                error: (error) => {
                    console.error('Error al guardar el documento:', error);
                    this.toastr.error('No se pudo guardar el documento. Inténtelo de nuevo más tarde.', 'Error');
                }
            });
        } catch (error) {
            console.error('Error al obtener los documentos del cliente:', error);
        }
    }

    onModalClose(): void {
        this.documentoCForm.reset();
        this.documentosFiltrados = [];
        this.documentosFaltantes = [];
        this.documentosSubidos = [];
        this.selectedDocumento = null;
        this.documentoBase64 = '';
        this.selectedFileName = {};
        this.fileInput.nativeElement.value = '';

        this.documentoCForm.get('documentoSelect')?.reset();
    }

    onDocumentoSelect(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const selectedId = +selectElement.value;

        this.selectedDocumento = this.documentosFaltantes.find(doc => doc.idCatalogoDocumento === selectedId) || null;
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        this.selectedFileName[this.selectedDocumento?.idCatalogoDocumento || 0] = file.name;

        const reader = new FileReader();
        reader.onload = () => {
            this.documentoBase64 = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    // openAsignarDocumentosModal(idCliente: number, regimenFiscal: string): void {
    //     const cliente = this.clientes.find(c => c.idCliente === idCliente);
    //     if (cliente) {
    //         if (regimenFiscal === 'MORAL') {
    //             this.clienteNombre = cliente.datosClienteMorals && cliente.datosClienteMorals.length > 0
    //                 ? cliente.datosClienteMorals[0].nombreRepLegal || 'N/A'
    //                 : 'N/A';
    //             this.clienteTipo = 'Moral';
    //         } else {
    //             this.clienteNombre = cliente.datosClienteFisicas && cliente.datosClienteFisicas.length > 0
    //                 ? cliente.datosClienteFisicas[0].idPersonaNavigation
    //                     ? (cliente.datosClienteFisicas[0].idPersonaNavigation.nombre + ' '
    //                         + cliente.datosClienteFisicas[0].idPersonaNavigation.apellidoPaterno + ' '
    //                         + cliente.datosClienteFisicas[0].idPersonaNavigation.apellidoMaterno)
    //                     : 'N/A'
    //                 : 'N/A';
    //             this.clienteTipo = 'Física';
    //         }
    //     }

    //     this.idClienteSeleccionado = idCliente;

    //     this.documentPorClienteService.getDocumentosAsignados(idCliente).subscribe({
    //         next: (documentosAsignados) => {
    //             console.log(documentosAsignados);
    //             this.documentosAsignadosIds = documentosAsignados.map(doc => doc.idDocumento);

    //             // Filtrar todos los documentos del régimen fiscal seleccionado
    //             this.documentosFiltrados = this.documentos.filter(doc => doc.tipo === regimenFiscal);

    //             this.documentosAsignarForm = this.fb.group({});

    //             this.documentosFiltrados.forEach(documento => {
    //                 const isAsignado = this.documentosAsignadosIds.includes(documento.idCatalogoDocumento);
    //                 this.documentosAsignarForm.addControl(
    //                     documento.idCatalogoDocumento.toString(),
    //                     new FormControl({ value: isAsignado, disabled: true }) // Deshabilitar todos los checkboxes
    //                 );
    //             });

    //             const modalElement = this.elementRef.nativeElement.querySelector('#asignarModal');
    //             if (modalElement) {
    //                 const modalInstance = new (window as any).bootstrap.Modal(modalElement, {
    //                     backdrop: 'static',
    //                     keyboard: false
    //                 });
    //                 modalInstance.show();
    //             }
    //         },
    //         error: (error) => {
    //             console.error('Error al obtener documentos asignados:', error);
    //             this.toastr.error('No se pudo obtener la lista de documentos asignados. Inténtelo de nuevo más tarde.', 'Error');
    //         }
    //     });
    //     this.modalTitle = `Asignar documentos a: ${this.clienteNombre} (${this.clienteTipo})`;
    // }

    // toggleAsignacion(idDocumento: number): void {
    //     let idCliente = this.idClienteSeleccionado;
    //     const isAsignado = this.documentosAsignadosIds.includes(idDocumento);

    //     if (isAsignado) {
    //         this.desasignarDocumento(idDocumento);
    //     } else {
    //         this.asignarDocumento(idDocumento);
    //     }
    // }

    // asignarDocumento(idDocumento: number): void {
    //     let idCliente = this.idClienteSeleccionado;
    //     console.log(idCliente, idDocumento);

    //     this.documentPorClienteService.asignarDocumento(idCliente, idDocumento).subscribe({
    //         next: (response) => {
    //             this.toastr.success('Documento asignado exitosamente.', 'Éxito');
    //             this.documentosAsignadosIds.push(idDocumento);
    //             console.log(this.documentosAsignadosIds);
    //             this.cerrarModalAsignar();
    //         },
    //         error: (error) => {
    //             console.error('Error al asignar el documento:', error);
    //             this.toastr.error('No se pudo asignar el documento. Inténtelo de nuevo más tarde.', 'Error');
    //         }
    //     });
    // }

    // desasignarDocumento(idDocumento: number): void {
    //     let idCliente = this.idClienteSeleccionado;
    //     console.log(idCliente, idDocumento);

    //     this.documentPorClienteService.desasignarDocumento(idCliente, idDocumento).subscribe({
    //         next: (response) => {
    //             this.toastr.success('Documento asignado exitosamente.', 'Éxito');
    //             this.documentosAsignadosIds = this.documentosAsignadosIds.filter(id => id !== idDocumento);
    //             console.log(this.documentosAsignadosIds);
    //             this.cerrarModalAsignar();
    //         },
    //         error: (error) => {
    //             console.error('Error al asignar el documento:', error);
    //             this.toastr.error('No se pudo asignar el documento. Inténtelo de nuevo más tarde.', 'Error');
    //         }
    //     });
    // }

    cerrarModalAsignar(): void {
        const modalElement = this.elementRef.nativeElement.querySelector('#asignarModal');
        if (modalElement) {
            const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
        }
    }

    verDocumento(base64: string): void {
        if (base64.startsWith('data:application/pdf;base64,')) {
            base64 = base64.replace('data:application/pdf;base64,', '');
        }

        try {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url);
        } catch (error) {
            console.error('Failed to open PDF:', error);
            this.toastr.error('No se pudo abrir el documento PDF. Inténtelo de nuevo más tarde.', 'Error');
        }
    }

    onModalCloseAsignar(): void {
        this.documentosFiltrados = [];
        this.documentosAsignarForm.reset();
    }

    getEstatusTexto(estatus: number): string {
        switch (estatus) {
            case 4:
                return 'Pendiente';
            case 3:
                return 'Por Revisar';
            case 2:
                return 'Rechazado';
            case 1:
                return 'Aprobado';
            default:
                return 'Desconocido';
        }
    }

    estatusOptions = [
        { value: 4, text: 'Pendiente' },
        { value: 3, text: 'Por Revisar' },
        { value: 2, text: 'Rechazado' },
        { value: 1, text: 'Aprobado' }
    ];

    getEstatusOptions(selectedEstatus: number): { value: number, text: string }[] {
        const allOptions = [
            { value: 4, text: 'Pendiente' },
            { value: 3, text: 'Por Revisar' },
            { value: 2, text: 'Rechazado' },
            { value: 1, text: 'Aprobado' }
        ];
    
        return allOptions.sort((a, b) => {
            if (a.value === selectedEstatus) return -1;
            if (b.value === selectedEstatus) return 1;
            return 0;
        });
    }

    actualizarEstatus(documento: any): void {
        const idDocumentoCliente = documento.iDocumentoCliente;
        const estatus = documento.estatusSeguimiento;
        console.log(idDocumentoCliente, estatus);

        this.documentPorClienteService.actualizarEstatus(idDocumentoCliente, estatus).subscribe(
            (response) => {
                this.toastr.success('El estatus fue cambiado exitosamente.', 'Éxito');
                const modalElement = this.elementRef.nativeElement.querySelector('#documentosModal');
                if (modalElement) {
                    const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
                    modalInstance.hide();
                }
            },
            (error) => {
                console.error('Error al actualizar el estatus', error);
            }
        );
    }
}
