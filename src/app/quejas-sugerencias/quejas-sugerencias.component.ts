import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IQuejasSugerencias } from '../interfaces/quejas_sugerencias';
import { ToastrService } from 'ngx-toastr';
import { QuejasService } from '../services/quejas.service';
import { LoginService } from '../services/login.service';
import { IUsuario } from '../interfaces/usuario';
import { EmpresasService } from '../services/empresas.service';
import { IEmpresa } from '../interfaces/empresa';

declare let Swal: any;

@Component({
    selector: 'app-quejas-sugerencias',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './quejas-sugerencias.component.html',
    styleUrl: './quejas-sugerencias.component.scss'
})
export class QuejasSugerenciasComponent implements OnInit {
    modalTitle: string = '';
    quejaForm: FormGroup;
    quejas: IQuejasSugerencias[] = [];
    usuario: IUsuario | null = null;
    empresa: IEmpresa | null = null;

    constructor(
        private elementRef: ElementRef,
        private fb: FormBuilder,
        private quejasService: QuejasService,
        private toastr: ToastrService,
        private loginService: LoginService,
        private empresaService: EmpresasService
    ) {
        this.quejaForm = this.fb.group({
            idQuejaSugerencia: [0, Validators.required],
            idEmpresa: [1, Validators.required],
            tipo: ['', Validators.required],
            descripcion: ['', Validators.required],
            fechaRegistro: ['', Validators.required],
            estatus: [1, Validators.required],
            fechaResolucion: [''],
            responsable: [null],
            prioridad: [0],
            comentarios: ['']
        });        
    }

    ngOnInit(): void {
        this.obtenerQuejas();
    }

    obtenerQuejas(){
        this.quejasService.getQuejas().subscribe({
            next: (quejas) => {
                this.quejas = quejas;
            },
            error: (error) => {
                this.toastr.error('Error al obtener las quejas o sugerencias', "Error");
            }
        })
    }

    openModalDetalles(queja: IQuejasSugerencias) {
        if (queja.idQuejaSugerencia == 0) {
            this.toastr.error('No se encontró el ID de la queja.');
            return;
        }
    
        this.modalTitle = 'Detalles de la queja o sugerencia';
    
        const fechaRegistro = queja.fechaRegistro 
            ? new Date(queja.fechaRegistro).toISOString().split('T')[0] 
            : null;
    
        // Función para obtener el texto de la prioridad
        const getPrioridadTexto = (prioridad: number): string => {
            switch (prioridad) {
                case 1:
                    return 'Alta';
                case 2:
                    return 'Media';
                case 3:
                    return 'Baja';
                default:
                    return 'Sin prioridad';
            }
        };

        const getEstatusTexto = (estatus: number): string => {
            switch (estatus) {
                case 1:
                    return 'Pendiente';
                case 2:
                    return 'En revisión';
                case 3:
                    return 'Resuelto';
                case 4:
                    return 'Rechazada';
                default:
                    return 'Desconocido';
            }
        };

        const getTipoTexto = (tipo: string): string => {
            switch (tipo) {
                case 'Q':
                    return 'Queja';
                case 'S':
                    return 'Sugerencia';
                default:
                    return 'Desconocido';
            }
        };

        const prioridadTexto = queja.prioridad !== undefined ? getPrioridadTexto(queja.prioridad) : 'Sin prioridad';
        const estatusTexto = queja.estatus !== undefined ? getEstatusTexto(queja.estatus) : 'Desconocido';
        const tipoTexto = queja.tipo !== undefined ? getTipoTexto(queja.tipo) : 'Desconocido';
    
        this.quejaForm.patchValue({
            idQuejaSugerencia: queja.idQuejaSugerencia,
            idEmpresa: queja.idEmpresa,
            tipo: tipoTexto,
            descripcion: queja.descripcion,
            fechaRegistro: fechaRegistro,
            estatus: estatusTexto,
            fechaResolucion: queja.fechaResolucion,
            responsable: null,
            prioridad: prioridadTexto,
            comentarios: queja.comentarios
        });
    
        console.log(this.quejaForm.value);

        this.quejaForm.disable();
    
        const modalElement = this.elementRef.nativeElement.querySelector('#staticBackdrop');
        if (modalElement) {
            const modalInstance = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modalInstance.show();
        }
    }

    closeModalDetalle() {
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
        this.quejaForm.enable();
        this.quejaForm.reset();
    }

    openModal(mode: 'add' | 'edit', queja?: IQuejasSugerencias): void {
        this.modalTitle = mode === 'add' ? 'Agregar queja o sugerencia' : 'Editar queja o sugerencia';

        if (mode === 'add') {
            this.quejaForm.reset();
        } else if (mode === 'edit' && queja) {
            this.quejaForm.patchValue({
                idQuejaSugerencia: queja.idQuejaSugerencia,
                idEmpresa: queja.idEmpresa,
                tipo: queja.tipo,
                descripcion: queja.descripcion,
                fechaRegistro: queja.fechaRegistro,
                estatus: queja.estatus,
                fechaResolucion: queja.fechaResolucion,
                responsable: null,
                prioridad: queja.prioridad,
                comentarios: queja.comentarios
            });
        }

        const modalElement = this.elementRef.nativeElement.querySelector('#modalge');
        if (modalElement) {
            const modalInstance = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modalInstance.show();
        }
    }

    closeModalGE() {
        const modalElement = this.elementRef.nativeElement.querySelector('#modalge');
        if (modalElement) {
            const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
        this.onModalClose();
    }

    async guardar() {
        let queja = this.quejaForm.value;

        if (queja.idQuejaSugerencia) {
            if (this.quejaForm.invalid) {
                this.toastr.warning('Debe llenar todos los campos');
                return;
            }

            this.quejasService.actualizarQueja(queja).subscribe({
                next: (response) => {
                    this.toastr.success('Queja o sugerencia actualizada con éxito', "Actualizado");
                    this.closeModalGE();
                    this.obtenerQuejas();
                },
                error: (error) => {
                    this.toastr.error('Error al actualizar la queja o sugerencia', "Error");
                }
            });
        } else {
            await this.obtenerUsuario();
            await this.obtenerEmpresa(this.usuario?.idEmpresa);

            this.quejaForm.patchValue({
                idQuejaSugerencia: 0,
                idEmpresa: this.empresa?.idEmpresa, 
                tipo: queja.tipo,
                descripcion: queja.descripcion,
                fechaRegistro: new Date(),
                estatus: 1,
                fechaResolucion: null,
                prioridad: 0,
                comentarios: ''
            });

            if (!this.quejaForm.value.descripcion) {
                this.toastr.warning('La descripción es obligatoria');
                return;
            }

            if (this.quejaForm.invalid) {
                this.toastr.warning('Debe llenar todos los campos obligatorios');
                return;
            }

            this.quejasService.guardarQueja(this.quejaForm.value).subscribe({
                next: (response) => {
                    this.toastr.success('Queja o sugerencia guardada con éxito', "Guardado");
                    this.closeModalGE();
                    this.obtenerQuejas();
                },
                error: (error) => {
                    this.toastr.error('Error al guardar la queja o sugerencia', "Error");
                }
            });
        }
    }    

    obtenerUsuario(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.loginService.obtenerUsuario().subscribe({
                next: (response) => {
                    this.usuario = response;
                    resolve();
                },
                error: (error) => {
                    this.toastr.error('Error al obtener el usuario', "Error");
                    reject();
                }
            });
        });
    }
    
    obtenerEmpresa(idEmpresa: number | undefined): Promise<void> {
        return new Promise((resolve, reject) => {
            this.empresaService.getEmpresa(idEmpresa).subscribe({
                next: (response) => {
                    this.empresa = response;
                    resolve();
                },
                error: (error) => {
                    this.toastr.error('Error al obtener la empresa', "Error");
                    reject();
                }
            });
        });
    }    

    async eliminar(queja: IQuejasSugerencias) {
        const result = await Swal.fire({
            title: '¿Eliminar queja?',
            text: "¿Estás seguro de eliminar esta queja?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.quejasService.eliminarQueja(queja.idQuejaSugerencia).subscribe({
                next: () => {
                    this.toastr.success('Queja eliminada con éxito.', 'Eliminado');
                    this.obtenerQuejas();
                },
                error: (error) => {
                    this.toastr.error('Error al eliminar la queja.', 'Error');
                }
            });
        }
    }
}
