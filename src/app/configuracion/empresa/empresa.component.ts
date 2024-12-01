import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresasService } from '../../services/empresas.service';
import { ToastrService } from 'ngx-toastr';
import { IEmpresa } from '../../interfaces/empresa';
import { ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

declare let Swal: any;

@Component({
    selector: 'app-empresa',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './empresa.component.html',
    styleUrls: ['./empresa.component.scss'],
    providers: [NgbModal],
})
export class EmpresaComponent implements OnInit {
    modalTitle: string = '';
    empresaForm: FormGroup;
    empresas: IEmpresa[] = [];
    selectedImage: string | ArrayBuffer | null = null;
    modalRef: any;
    @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
    @ViewChild('modalElement', { static: false }) modalElement!: ElementRef;
    filteredEmpresas: any[] = [];

    constructor(
        private elementRef: ElementRef,
        private fb: FormBuilder,
        private empresasService: EmpresasService,
        private toastr: ToastrService
    ) {
        this.empresaForm = this.fb.group({
            idEmpresa: [0],
            nombreEmpresa: ['', Validators.required],
            razonSocial: ['', Validators.required],
            fechaConstitucion: ['', Validators.required],
            numeroEscritura: ['', Validators.required],
            nombreNotario: ['', Validators.required],
            numeroNotario: ['', Validators.required],
            folioMercantil: ['', Validators.required],
            rfc: ['', [Validators.required, Validators.minLength(12)]],
            nombreRepresentanteLegal: ['', Validators.required],
            numeroEscrituraRepLeg: ['', Validators.required],
            fechaInscripcion: ['', Validators.required],
            calle: ['', Validators.required],
            colonia: ['', Validators.required],
            cp: ['', Validators.required],
            telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
            estado: ['', Validators.required],
            localidad: ['', Validators.required],
            numExterior: ['', Validators.required],
            numInterior: [''],
            email: ['', Validators.required],
            estatus: [1],
            logo: [''],
        });
    }

    async ngOnInit() {
        await this.obtenerEmpresas();
    }

    //Método para buscar empresas
    filterEmpresas(event: any): void {
        const searchTerm = event.target.value.toLowerCase();
        this.filteredEmpresas = this.empresas.filter(empresa => 
            empresa.razonSocial.toLowerCase().includes(searchTerm) ||
            empresa.nombreRepresentanteLegal.toLowerCase().includes(searchTerm) ||
            empresa.rfc.toLowerCase().includes(searchTerm) ||
            empresa.estado.toLowerCase().includes(searchTerm)
        );
    }

    openModal(mode: 'add' | 'edit', empresa?: IEmpresa): void {
        this.modalTitle = mode === 'add' ? 'Agregar Empresa' : 'Editar Empresa';

        if (mode === 'add') {
            this.empresaForm.reset();
            this.selectedImage = null;
        } else if (mode === 'edit' && empresa) {
            this.empresaForm.patchValue({
                idEmpresa: empresa.idEmpresa,
                nombreEmpresa: empresa.nombreEmpresa,
                razonSocial: empresa.razonSocial,
                fechaConstitucion: empresa.fechaConstitucion,
                numeroEscritura: empresa.numeroEscritura,
                nombreNotario: empresa.nombreNotario,
                numeroNotario: empresa.numeroNotario,
                folioMercantil: empresa.folioMercantil,
                rfc: empresa.rfc,
                nombreRepresentanteLegal: empresa.nombreRepresentanteLegal,
                numeroEscrituraRepLeg: empresa.numeroEscrituraRepLeg,
                fechaInscripcion: empresa.fechaInscripcion,
                calle: empresa.calle,
                colonia: empresa.colonia,
                cp: empresa.cp,
                telefono: empresa.telefono,
                estado: empresa.estado,
                localidad: empresa.localidad,
                numExterior: empresa.numExterior,
                numInterior: empresa.numInterior,
                email: empresa.email,
                estatus: empresa.estatus,
                logo: empresa.logo
            });
            this.selectedImage = empresa.logo ?? null;
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
        this.empresaForm.reset();
        this.selectedImage = null;

        if (this.fileInput) {
            (this.fileInput.nativeElement as HTMLInputElement).value = '';
        }
    }

    obtenerEmpresas() {
        this.empresasService.getEmpresas().subscribe(
            (data: any[]) => {
                this.empresas = data;
                console.log(this.empresas);
                this.filteredEmpresas = this.empresas;
            },
            (error) => {
                this.toastr.error('No se pudieron obtener las empresas. Inténtelo de nuevo más tarde.', 'Error');
            }
        )
    }

    guardar(): void {
        this.empresaForm.patchValue({ estatus: 1 });

        const rfc = this.empresaForm.get('rfc')?.value;
        console.log(rfc);
        console.log(rfc.length);
        if (!rfc || (rfc.length-1 !== 12-1 && rfc.length-1 !== 13)) {
            this.toastr.warning('El RFC debe tener 12 o 13 caracteres.');
            return;
        }

        const telefono = this.empresaForm.get('telefono')?.value;
        console.log(telefono.length);
        if (!telefono || telefono.length-1 !== 10) {
            this.toastr.warning('El teléfono debe tener exactamente 10 caracteres.');
            return;
        }

        const soloNumeros = /^[0-9]+$/;
        if (!soloNumeros.test(telefono)) {
            this.toastr.warning('El teléfono debe contener solo números.');
            return;
        }

        /*if (this.empresaForm.invalid || !this.selectedImage) {
            this.toastr.warning('Debe llenar todos los campos y seleccionar una imagen.');
            return;
        }*/

        const formatDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        let empresa: IEmpresa = this.empresaForm.value;

        const fechaConstitucionDate = new Date(empresa.fechaConstitucion);
        const fechaInscripcionDate = new Date(empresa.fechaInscripcion);

        empresa.fechaConstitucion = formatDate(fechaConstitucionDate);
        empresa.fechaInscripcion = formatDate(fechaInscripcionDate);
        empresa.estatus = 1;
        empresa.logo = this.selectedImage as string;

        if (empresa.idEmpresa) {
            this.empresasService.actualizarEmpresa(empresa).subscribe({
                next: (response) => {
                    this.toastr.success('Empresa actualizada con éxito.', "Actualizado");
                    this.closeModal();
                    this.obtenerEmpresas();
                },
                error: (error) => {
                    this.toastr.error('Error al actualizar la empresa.', 'Error');
                }
            });
        } else {
            empresa.idEmpresa = 0;
            this.empresasService.guardarEmpresa(empresa).subscribe({
                next: (response) => {
                    this.toastr.success('Empresa guardada con éxito.', "Guardado");
                    this.closeModal();
                    this.obtenerEmpresas();
                },
                error: (error) => {
                    this.toastr.error('Error al guardar la empresa.', 'Error');
                }
            });
        }
    }

    async eliminar(empresa: IEmpresa) {
        const result = await Swal.fire({
            title: '¿Eliminar empresa?',
            text: "¿Estás seguro de eliminar esta empresa?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.empresasService.eliminarEmpresa(empresa.idEmpresa).subscribe({
                next: () => {
                    this.toastr.success('Empresa eliminada con éxito.', 'Eliminado');
                    this.obtenerEmpresas();
                },
                error: (error) => {
                    this.toastr.error('Error al eliminar la empresa.', 'Error');
                }
            });
        }
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.selectedImage = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    handleReaderLoaded(e: any) {
        this.selectedImage = e.target.result;
    }

    limitarCaracteres(event: any, maxLength: number): void {
        const input = event.target;
        maxLength = maxLength;
        if (input.value.length > maxLength) {
            input.value = input.value.slice(0, maxLength);
        }
    }
}
