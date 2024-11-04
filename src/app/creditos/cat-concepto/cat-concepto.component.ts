import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { IConcepto } from '../../interfaces/concepto';
import { CatConceptoService } from '../../services/cat-concepto.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

declare let Swal: any;

@Component({
    selector: 'app-cat-concepto',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './cat-concepto.component.html',
    styleUrls: ['./cat-concepto.component.scss'],
    providers: [NgbModal]
})
export class CatConceptoComponent implements OnInit {
    modalTitle: string = '';
    modalRef: any;
    conceptoForm: FormGroup;
    conceptos: IConcepto[] = [];
    allConceptos: IConcepto[] = [];

    constructor(
        private elementRef: ElementRef,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private conceptosService: CatConceptoService
    ) {
        this.conceptoForm = this.fb.group({
            idConcepto: [0],
            nombreConcepto: ['', Validators.required],
            valor: ['', [Validators.required, Validators.min(0)]],
            tipoValor: ['', Validators.required],
            iva: [0, [Validators.required, Validators.min(0)]],
            estatus: [1],
            idEmpresa: [1]
        });
    }

    ngOnInit(): void {
        this.obtenerConceptos();
    }

    openModal(mode: 'add' | 'edit', concepto?: IConcepto): void {
        this.modalTitle = mode === 'add' ? 'Agregar Concepto' : 'Editar Concepto';

        if (mode === 'add') {
            this.conceptoForm.reset({
                idConcepto: 0,
                nombreConcepto: '',
                valor: '',
                tipoValor: '',
                iva: 0,
                estatus: 1,
                idEmpresa: 1
            });
        } else if (mode === 'edit' && concepto) {
            this.conceptoForm.patchValue({
                idConcepto: concepto.idConcepto,
                nombreConcepto: concepto.nombreConcepto,
                valor: concepto.valor,
                tipoValor: concepto.tipoValor,
                iva: concepto.iva,
                estatus: concepto.estatus,
                idEmpresa: concepto.idEmpresa
            });
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

    obtenerConceptos() {
        this.conceptosService.getConceptos().subscribe({
            next: (conceptos) => {
                this.conceptos = conceptos;
                this.allConceptos = [...conceptos];
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener los documentos. Inténtelo de nuevo más tarde.', 'Error');
            }
        });
    }

    guardar() {
        if (this.conceptoForm.invalid) {
            this.toastr.warning('Asegurese de llenar los campos correctamente', 'Advertencia');
            return;
        }

        let concepto: IConcepto = this.conceptoForm.value;
        console.log(concepto);

        if (concepto.idConcepto === 0) {
            concepto.estatus = 1;
            concepto.idEmpresa = 1;

            this.conceptosService.guardarConcepto(concepto).subscribe({
                next: () => {
                    this.toastr.success('Concepto guardado con éxito', 'Guardado');
                    this.obtenerConceptos();
                    this.closeModal();
                },
                error: (error) => {
                    this.toastr.error('Error al guardar el concepto', 'Error');
                }
            });
        } else {
            this.conceptosService.actualizarConcepto(concepto).subscribe({
                next: (response) => {
                    this.toastr.success('Concepto actualizado con éxito', 'Actualizado');
                    this.obtenerConceptos();
                    this.closeModal();
                },
                error: (error) => {
                    this.toastr.error('Error al actualizar el concepto', 'Error');
                }
            });
        }
    }

    async eliminar(concepto: IConcepto) {
        const result = await Swal.fire({
            title: '¿Eliminar concepto?',
            text: "¿Estás seguro de eliminar este concepto?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.conceptosService.eliminarConcepto(concepto.idConcepto).subscribe({
                next: () => {
                    this.toastr.success('Concepto eliminado con éxito.', 'Eliminado');
                    this.obtenerConceptos();
                },
                error: (error) => {
                    this.toastr.error('Error al eliminar el concepto.', 'Error');
                }
            });
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
        this.conceptoForm.reset();
    }

    filterConceptos(event: any): void {
        const searchTerm = event.target.value.toLowerCase();
        if (searchTerm) {
            this.conceptos = this.allConceptos.filter(concepto =>
                concepto.nombreConcepto?.toLowerCase().includes(searchTerm) ||
                concepto.tipoValor?.toLowerCase().includes(searchTerm) ||
                concepto.valor?.toString().toLowerCase().includes(searchTerm) ||
                concepto.iva?.toString().toLowerCase().includes(searchTerm) 
            );
        } else {
            this.conceptos = [...this.allConceptos];
        }
    }
}
