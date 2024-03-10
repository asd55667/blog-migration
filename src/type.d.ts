export interface ICategory {
    key: string;
    title: string;
    total: number;
    children: ICategory[];
}