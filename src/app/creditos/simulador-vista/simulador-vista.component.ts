import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SimuladorService } from '../../services/simulador.service';
import { ISimulador } from '../../interfaces/simulador';
import { IAmortizacion } from '../../interfaces/amortizacion';
import { ProductosService } from '../../services/productos.service';
import { IProducto } from '../../interfaces/producto';
import { CatConceptoService } from '../../services/cat-concepto.service';
import { IConcepto } from '../../interfaces/concepto';

@Component({
    selector: 'app-simulador-vista',
    standalone: true,
    imports: [
        CommonModule, 
        ReactiveFormsModule
    ],
    templateUrl: './simulador-vista.component.html',
    styleUrls: ['./simulador-vista.component.scss']
})
export class SimuladorVistaComponent implements OnInit {
    simuladorForm: FormGroup;
    mostrarTabla: boolean = false;
    datosSimulador: ISimulador | null = null;
    amortizaciones: IAmortizacion[] = [];
    productos: IProducto[] = [];
    productoElegido: IProducto = {} as IProducto;
    conceptos: IConcepto[] = [];
    montoFormateado: string = ''; // Para mostrar el monto con comas

    constructor(
        private fb: FormBuilder,
        private toastr: ToastrService, 
        private simuladorService: SimuladorService,
        private productosService: ProductosService,
        private conceptosService: CatConceptoService,
        private router: Router
    ) {
        this.simuladorForm = this.fb.group({
            productoNombre: ['', Validators.required],
            metodoCalculo: ['AMORTIZADO', Validators.required],
            subMetodoCalculo: ['', Validators.required],
            monto: ['', [Validators.required, Validators.min(1), Validators.pattern('^[0-9]+(\\.[0-9]+)?$')]], // monto no puede ser 0 o negativo
            numPagos: [null, [Validators.required, Validators.min(1), Validators.pattern('^[0-9]+$')]], // número de pagos positivo
            periodicidad: ['', Validators.required],
            fechaInicio: ['', Validators.required],
            interesAnual: [null, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+(\\.[0-9]+)?$')]], // interés anual positivo
            iva: ['', [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+(\\.[0-9]+)?$')]], // IVA positivo
            ivaExento: [false],
            interesMoratorio: ['', [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+(\\.[0-9]+)?$')]], // interés moratorio positivo
        });
    }

    formatCurrency(event: any) {
        let value = event.target.value.replace(/,/g, '').replace(/\./g, '');
        
        if (!isNaN(value) && value !== '') {
            const decimalValue = parseFloat(value) / 100;
            
            this.simuladorForm.get('monto')?.setValue(decimalValue, { emitEvent: false });
            
            this.montoFormateado = decimalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            event.target.value = this.montoFormateado;
        } else {
            this.montoFormateado = '';
        }
    }

    ngOnInit(): void {
        this.obtenerProductos();
    }
    
    listenerProducto(){
        let nombre = this.simuladorForm.get('productoNombre')?.value;
        this.productos.forEach(producto => {
            if(producto?.nombreProducto == nombre){
                this.llenarForm(producto);
                this.productoElegido = producto;
            }
        });
    }

    llenarForm(producto: IProducto) {
        this.simuladorForm.patchValue({
            metodoCalculo: producto?.metodoCalculo,
            subMetodoCalculo: producto?.subMetodo,
            monto: producto?.monto, // Establece el valor sin formato en el formulario
            numPagos: producto?.numPagos,
            periodicidad: producto?.periodicidad,
            interesAnual: producto?.interesAnual,
            interesMoratorio: producto?.interesMoratorio,
            iva: producto?.iva
        });

        // Formatea el monto para mostrarlo con comas en el campo de entrada
        this.montoFormateado = producto?.monto ? producto.monto.toLocaleString('en-US') : '';
    }

    validarIntereses(producto: IProducto) {
        const interesOrdinarioForm = this.simuladorForm.get('interesAnual')?.value;
        const interesMoratorioForm = this.simuladorForm.get('interesMoratorio')?.value;
        const interesOrdinario = producto?.interesAnual;
        const interesMoratorio = producto?.interesMoratorio;
    
        // Verifica si los valores son válidos antes de compararlos
        if (interesOrdinarioForm !== undefined && interesMoratorioForm !== undefined && 
            interesOrdinario !== undefined && interesMoratorio !== undefined) {
    
            if (interesOrdinarioForm > interesOrdinario) {
                this.simuladorForm.get('interesAnual')?.setErrors({ 'invalid': true });
                this.toastr.error('El interes anual no puede ser mayor al definido en el producto.', 'Error');
            } else {
                this.simuladorForm.get('interesAnual')?.setErrors(null);
            }
    
            if (interesMoratorioForm > interesMoratorio) {
                this.simuladorForm.get('interesMoratorio')?.setErrors({ 'invalid': true });
                this.toastr.error('El interes moratorio no puede ser mayor al definido en el producto.', 'Error');
            } else {
                this.simuladorForm.get('interesMoratorio')?.setErrors(null);
            }
        }
    }
    

    obtenerProductos() {
        this.productosService.getProductos().subscribe({
            next: (productos) => {
                this.productos = productos;
            },
            error: (error) => {
                this.toastr.error('No se pudieron obtener los productos. Inténtelo de nuevo más tarde.', 'Error');
            }
        })
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

    simular() {
        this.validarIntereses(this.productoElegido);
        this.obtenerConceptos();
        if (this.simuladorForm.invalid) {
            this.toastr.error('Verifica los datos ingresados.', 'Error');
            return;
        }

        let simulacion: ISimulador = {
            metodoCalculo: this.simuladorForm.get('metodoCalculo')?.value,
            subMetodoCalculo: this.simuladorForm.get('subMetodoCalculo')?.value,
            monto: this.simuladorForm.get('monto')?.value,
            numPagos: this.simuladorForm.get('numPagos')?.value,
            periodicidad: this.simuladorForm.get('periodicidad')?.value,
            fechaInicio: this.simuladorForm.get('fechaInicio')?.value,
            interesAnual: this.simuladorForm.get('interesAnual')?.value,
            interesMoratorio: this.simuladorForm.get('interesMoratorio')?.value,
            iva: this.simuladorForm.get('iva')?.value,
            ivaExento: this.simuladorForm.get('ivaExento')?.value
        };

        this.simuladorService.obtenerSimulacion(simulacion).subscribe({
            next: (amortizaciones: IAmortizacion[]) => {
                this.toastr.success('Se ha generado la simulación.', 'Simulación');
                this.amortizaciones = amortizaciones;
                this.mostrarTabla = true;
            },
            error: (error) => {
                this.toastr.error('No se pudo generar la simulación. Inténtelo de nuevo más tarde.', 'Error');
                console.error('Error al obtener la simulación:', error);
            }
        });
    }

    limpiar() {
        this.simuladorForm.reset({
            metodo: '',
            submetodo: '',
            monto: '',
            numpagos: null,
            formaPago: '',
            fechaInicio: '',
            interesAnual: null,
            iva: 16,
            ivaExento: false,
            catValor: ''
        });
        this.amortizaciones = [];
        this.mostrarTabla = false;
        this.toastr.info('Los campos se han limpiado.', 'Formulario Limpio');
    }

    limitarCaracteres(event: any, maxLength: number): void {
        const input = event.target;
        if (input.value.length > maxLength) {
            input.value = input.value.slice(0, maxLength);
        }
    }

    calcularMontoConceptos(tipoValor: string, cantidad: number): string {
        if (tipoValor.toLowerCase() === 'porcentaje') {
            let resultado = (this.productoElegido?.reca * cantidad) / 100;
            return "$" + resultado.toFixed(2);
        } else {
            return "$" + cantidad.toFixed(2);
        }
    }

    calcularDias(fechaInicio: Date, fechaFin: Date): number {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        const diferencia = Math.abs(fin.getTime() - inicio.getTime());
        return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    }

    abrirCredito() {
        const data = {
            producto: this.productoElegido,
            conceptos: this.conceptos,
            simulacion: this.simuladorForm.value
        };

        this.router.navigate(['creditos/detalleCredito'], {
            state: { data }
        });
    }
}
