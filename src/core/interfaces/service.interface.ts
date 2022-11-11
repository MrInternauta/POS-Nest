export interface IService {
  findAll(page: number, limit: number): any[];
  findOne(id: number): any;
  create(entity: any): any;
  update(id: number, payload: any): any;
  delete(id: number): boolean;
}
