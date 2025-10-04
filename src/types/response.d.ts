export interface ErrorProps{
    success:boolean,
    status:number,
    message:string,
    data?:null,
}

export type UniformResponseFormat<T> = {
    success:boolean,
    status:number,
    message:string,
    data: T | null,
}

export type PaginationQuery = {
    page:number;
    limit:number;
}
