import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { IDocumento } from '../../interfaces/documentos';
import { DocumentosService } from '../../services/documentos.service';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

declare let Swal: any;

@Component({
    selector: 'app-documentos',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './documentos.component.html',
    styleUrl: './documentos.component.scss',
    providers: [NgbModal]
})
export class DocumentosComponent implements OnInit {
    modalTitle: string = '';
    modalRef: any;
    documentoForm: FormGroup;
    documentos: IDocumento[] = [];
    @ViewChild('modalElement', { static: false }) modalElement!: ElementRef;
    filteredDocumentos: any[] = [];

    constructor(
        private elementRef: ElementRef,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private documentosService: DocumentosService
    ) {
        this.documentoForm = this.fb.group({
            idCatalogoDocumento: [0],
            nombre: ['', Validators.required],
            tipo: ['', Validators.required],
            estatus: [1],
            idEmpresa: [1]
            // idEmpresa: [0, Validators.required]
        });
    }

    ngOnInit(): void {
        this.obtenerDocumentos();
    }

    filterDocumentos(event: any): void {
        const searchTerm = event.target.value.toLowerCase();
        this.filteredDocumentos = this.documentos.filter(documento => 
            documento.nombre?.toLowerCase().includes(searchTerm) ||
            documento.tipo?.toLowerCase().includes(searchTerm) ||
            documento.idEmpresa?.toString().includes(searchTerm)
        );
    }

    onRegimenFiscalCambio(event: any): void {
        const selectedRegimen = event.target.value;
        this.filtrarDocumentos(selectedRegimen);
    }

    filtrarDocumentos(regimen: string): void {
        if (regimen) {
            console.log(regimen);
            this.filteredDocumentos = this.documentos.filter(documento => documento.tipo === regimen);
        } else {
          this.filteredDocumentos = this.documentos; // Si no hay un régimen seleccionado, muestra todos los documentos
        }
    }

    openModal(mode: 'add' | 'edit', documento?: IDocumento): void {
        this.modalTitle = mode === 'add' ? 'Agregar Documento' : 'Editar Documento';

        if (mode === 'add') {
            this.documentoForm.reset();
        } else if (mode === 'edit' && documento) {
            this.documentoForm.patchValue({
                idCatalogoDocumento: documento.idCatalogoDocumento,
                nombre: documento.nombre,
                tipo: documento.tipo,
                estatus: documento.estatus,
                idEmpresa: documento.idEmpresa
            })
        }

        const modalElement = this.elementRef.nativeElement.querySelector('#staticBackdrop');
        if (modalElement) {
            const modalInstance = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modalInstance.show();
        }
    }

    obtenerDocumentos() {
        this.documentosService.getDocumentos().subscribe(
            (data: IDocumento[]) => {
                this.documentos = data;
                this.filteredDocumentos = this.documentos;
                console.log(this.documentos);
            },
            (error) => {
                this.toastr.error('No se pudieron obtener los documentos. Inténtelo de nuevo más tarde.', 'Error');
            }
        )
    }

    async eliminar(documento: IDocumento) {
        const result = await Swal.fire({
            title: '¿Eliminar documento?',
            text: "¿Estás seguro de eliminar este documento?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.documentosService.eliminarDocumento(documento.idCatalogoDocumento).subscribe({
                next: () => {
                    this.toastr.success('Documento eliminado con éxito.', 'Eliminado');
                    this.obtenerDocumentos();
                },
                error: (error) => {
                    this.toastr.error('Error al eliminar el documento.', 'Error');
                }
            });
        }
    }

    guardar() {
        if (this.documentoForm.invalid){
            this.toastr.warning('Debe llenar todos los campos', 'Advertencia');
            return;
        }

        let documento: IDocumento = this.documentoForm.value;

        if(documento.idCatalogoDocumento){
            this.documentosService.actualizarDocumento(documento).subscribe({
                next: (response) => {
                    this.toastr.success('Documento actualizado con exito', 'Actualizado');
                    this.closeModal();
                    this.obtenerDocumentos();
                },
                error: (error) => {
                    this.toastr.error('Error al actualizar el documento', 'Error');
                }
            });
        } else {
            documento.idCatalogoDocumento = 0;
            documento.estatus = 1;
            documento.idEmpresa = 1;

            this.documentosService.guardarDocumento(documento).subscribe({
                next: (response) => {
                    this.toastr.success('Documento guardado con exito', 'Guardado');
                    this.closeModal();
                    this.obtenerDocumentos();
                },
                error: (error) => {
                    this.toastr.error('Error al guardar el documento', 'Error');
                }
            })
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

    onModalClose() {
        this.documentoForm.reset();
    }
}
