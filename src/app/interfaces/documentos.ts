export interface IDocumento {
    idCatalogoDocumento: number
    nombre: string
    tipo: string
    estatus: number
    idEmpresa?: number
    estatusSeguimiento?: number
}