import { IEmpresa } from "./empresa"
import { IUsuario } from "./usuario"

export interface IQuejasSugerencias {
    idQuejaSugerencia: number,
    idEmpresa: number,
    tipo: string,
    descripcion: string,
    fechaRegistro: string,
    estatus: number,
    fechaResolucion?: string
    responsable?: number,
    prioridad?: number,
    comentarios?: string,
}