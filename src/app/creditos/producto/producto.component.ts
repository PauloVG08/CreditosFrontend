import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IProducto } from '../../interfaces/producto';
import { ToastrService } from 'ngx-toastr';
import { ProductosService } from '../../services/productos.service';
import { CatConceptoService } from '../../services/cat-concepto.service';
import { IConcepto } from '../../interfaces/concepto';

declare let Swal: any;

@Component({
    selector: 'app-producto',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './producto.component.html',
    styleUrls: ['./producto.component.scss']
})
export class ProductoComponent implements OnInit {
    modalTitle: string = '';
    productoForm: FormGroup;
    conceptoForm: FormGroup;
    productos: IProducto[] = [];
    allProductos: IProducto[] = [];
    conceptos: IConcepto[] = [];
    selectedConcepto: IConcepto | null = null;
    productoSeleccionado: IProducto | null = null;

    constructor(
        private elementRef: ElementRef,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private productosService: ProductosService,
        private conceptosService: CatConceptoService
    ) { 
        this.productoForm = this.fb.group({
            idProducto: [0],
            nombreProducto: ['', Validators.required],
            reca: [0, Validators.required],
            metodoCalculo: ['', Validators.required],
            subMetodo: ['', Validators.required],
            monto: [0, Validators.required],
            periodicidad: ['', Validators.required],
            numPagos: [0, Validators.required],
            interesAnual: [0, Validators.required],
            iva: [0, Validators.required],
            interesMoratorio: [0, Validators.required],
            pagoAnticipado: ['', Validators.required],
            aplicacionDePagos: ['', Validators.required],
            idEmpresa: [1],
            estatus: [1],
            detalleProductos: [[]]
        });

        this.conceptoForm = this.fb.group({
            idConcepto: [0],
            nombreConcepto: ['', Validators.required],
            valor: ['', Validators.required],
            tipoValor: ['', Validators.required],
            estatus: [1],
            idEmpresa: [1]
        });
    }

    ngOnInit(): void {
        this.obtenerProductos();
        this.obtenerConceptos();
    }

    openModal(mode: 'add' | 'edit', producto?: IProducto): void {
        this.modalTitle = mode === 'add' ? 'Agregar Producto' : 'Editar Producto';

        if (mode === 'add') {
            this.productoForm.reset({
                idProducto: 0,
                nombreProducto: '',
                reca: null,
                metodoCalculo: 'AMORTIZADO',
                subMetodo: '',
                monto: null,
                periodicidad: '',
                numPagos: null,
                interesAnual: null,
                iva: null,
                interesMoratorio: null,
                pagoAnticipado: '',
                aplicacionDePagos: '',
                idEmpresa: 1,
                estatus: 1,
                detalleProductos: []
            });
        } else if (mode === 'edit' && producto) {
            this.productoForm.patchValue({
                idProducto: producto.idProducto,
                nombreProducto: producto.nombreProducto,
                reca: producto.reca,
                metodoCalculo: producto.metodoCalculo,
                subMetodo: producto.subMetodo,
                monto: producto.monto,
                periodicidad: producto.periodicidad,
                numPagos: producto.numPagos,
                interesAnual: producto.interesAnual,
                iva: producto.iva,
                interesMoratorio: producto.interesMoratorio,
                pagoAnticipado: producto.pagoAnticipado,
                aplicacionDePagos: producto.aplicacionDePagos,
                idEmpresa: producto.idEmpresa,
                estatus: producto.estatus,
                detalleProductos: producto.detalleProductos
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

    obtenerProductos() {
        this.productosService.getProductos().subscribe({
            next: (productos) => {
                this.productos = productos;
                this.allProductos = [...productos];
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener los productos. Inténtelo de nuevo más tarde.', 'Error');
            }
        })
    }

    guardar() {
        if (this.productoForm.invalid) {
            this.toastr.error('Llena todos los campos.', 'Error');
            return;
        }

        let producto = this.productoForm.value;

        if (producto.idProducto === 0) {
            producto.estatus = 1;
            producto.idEmpresa = 1;
            producto.detalleProductos = [];

            this.productosService.guardarProducto(producto).subscribe({
                next: () => {
                    this.toastr.success('Producto guardado con éxito', 'Guardado');
                    this.obtenerProductos();
                    this.closeModal();
                },
                error: (error) => {
                    this.toastr.error('No se pudo guardar el producto. Inténtelo de nuevo más tarde.', 'Error');
                }
            });
        } else {
            this.productosService.actualizarProducto(producto).subscribe({
                next: (response) => {
                    this.toastr.success('Producto actualizado con éxito', 'Actualizado');
                    this.obtenerProductos();
                    this.closeModal();
                },
                error: (error) => {
                    this.toastr.error('No se pudo actualizar el producto. Inténtelo de nuevo más tarde.', 'Error');
                }
            });
        }
    }

    async eliminar(producto: IProducto) {
        const result = await Swal.fire({
            title: '¿Eliminar producto?',
            text: "¿Estás seguro de eliminar este producto?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.productosService.eliminarProducto(producto.idProducto).subscribe({
                next: () => {
                    this.toastr.success('Producto eliminado con éxito.', 'Eliminado');
                    this.obtenerProductos();
                },
                error: (error) => {
                    this.toastr.error('Error al eliminar el producto.', 'Error');
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
        this.productoForm.reset();
    }

    obtenerConceptos() {
        this.conceptosService.getConceptos().subscribe({
            next: (conceptos) => {
                this.conceptos = conceptos;
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener los documentos. Inténtelo de nuevo más tarde.', 'Error');
            }
        });
    }

    openModalConcepto(producto: IProducto): void {
        this.productoSeleccionado = { ...producto, detalleProductos: producto.detalleProductos || [] };

        this.selectedConcepto = null;
        this.conceptoForm.reset();
        this.conceptoForm.get('tipoValor')?.enable();

        const modalElement = this.elementRef.nativeElement.querySelector('#modalConcepto');
        if (modalElement) {
            const modalInstance = new (window as any).bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
            modalInstance.show();
        }
    }

    onConceptoChange(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const selectedId = parseInt(selectElement.value, 10);
        this.selectedConcepto = this.conceptos.find(concepto => concepto.idConcepto === selectedId) || null;

        if (this.selectedConcepto) {
            this.conceptoForm.patchValue({
                idConcepto: this.selectedConcepto.idConcepto,
                nombreConcepto: this.selectedConcepto.nombreConcepto,
                valor: this.selectedConcepto.valor,
                tipoValor: this.selectedConcepto.tipoValor
            });
            this.conceptoForm.get('tipoValor')?.disable();
        }
    }

    onModalCloseConceptos(): void {
        this.conceptoForm.reset();
        this.selectedConcepto = null;
        this.conceptoForm.get('tipoValor')?.enable();
        const selectElement = this.elementRef.nativeElement.querySelector('#conceptosSelect') as HTMLSelectElement;
        if (selectElement) {
            selectElement.value = "";
        }
    }

    guardarConcepto(): void {
        if (this.selectedConcepto && this.productoSeleccionado) {
            const nuevoDetalleProducto = {
                idDetalleProductos: 0,
                idProducto: this.productoSeleccionado.idProducto,
                valor: this.conceptoForm.get('valor')?.value,
                tipoValor: this.selectedConcepto.tipoValor,
                iva: this.selectedConcepto.iva,
                idConcepto: this.selectedConcepto.idConcepto,
                estatus: 1
            };

            const detalleExistente = this.productoSeleccionado.detalleProductos?.find(detalle => 
                detalle.idConcepto === nuevoDetalleProducto.idConcepto
            );

            if (!detalleExistente) {
                this.productoSeleccionado.detalleProductos!.push(nuevoDetalleProducto);
            }

            console.log(this.productoSeleccionado);

            this.productosService.actualizarProducto(this.productoSeleccionado).subscribe({
                next: () => {
                    this.toastr.success('Concepto guardado con éxito', 'Guardado');
                    this.obtenerProductos();
                    this.closeModalConcepto();
                },
                error: (error) => {
                    this.toastr.error('No se pudo guardar el concepto. Inténtelo de nuevo más tarde.', 'Error');
                }
            });
        }
    }

    closeModalConcepto() {
        const modalElement = this.elementRef.nativeElement.querySelector('#modalConcepto');
        if (modalElement) {
            const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
        this.onModalCloseConceptos();
    }

    getFilteredConceptos(): IConcepto[] {
        if (!this.productoSeleccionado || !this.productoSeleccionado.detalleProductos) {
            return this.conceptos;
        }
        const conceptoIds = this.productoSeleccionado.detalleProductos.map(detalle => detalle.idConcepto);
        return this.conceptos.filter(concepto => !conceptoIds.includes(concepto.idConcepto));
    }

    getConceptoNombre(idConcepto: number): string {
        const concepto = this.conceptos.find(concepto => concepto.idConcepto === idConcepto);
        return concepto ? concepto.nombreConcepto : 'Desconocido';
    }

    eliminarConcepto(idConcepto: number): void {
        if (this.productoSeleccionado) {
            this.productoSeleccionado.detalleProductos = this.productoSeleccionado.detalleProductos?.filter(
                detalle => detalle.idConcepto !== idConcepto
            ) || [];

            // Actualizar el producto en la base de datos o en el estado
            this.productosService.actualizarProducto(this.productoSeleccionado).subscribe({
                next: () => {
                    this.toastr.success('Concepto eliminado con éxito', 'Eliminado');
                    this.obtenerProductos();
                    this.closeModalConcepto();
                },
                error: (error) => {
                    this.toastr.error('No se pudo eliminar el concepto. Inténtelo de nuevo más tarde.', 'Error');
                }
            });
        }
    }

    async preguntaEliminar(idConcepto: number) {
        const result = await Swal.fire({
            title: '¿Eliminar este concepto del producto?',
            text: "¿Estás seguro de eliminar este concepto?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            this.eliminarConcepto(idConcepto);
        }
    }

    filterProductos(event: any): void {
        const searchTerm = event.target.value.toLowerCase();
        if (searchTerm) {
            this.productos = this.allProductos.filter(producto =>
                producto.nombreProducto?.toLowerCase().includes(searchTerm) ||
                producto.reca?.toString().includes(searchTerm) ||
                producto.monto?.toString().includes(searchTerm) ||
                producto.periodicidad?.toLowerCase().includes(searchTerm) ||
                producto.numPagos?.toString().includes(searchTerm)
            );
        } else {
            this.productos = [...this.allProductos];
        }
    }

    limitarCaracteres(event: any, maxLength: number): void {
        const input = event.target;
        if (input.value.length > maxLength) {
            input.value = input.value.slice(0, maxLength);
        }
    }
}
