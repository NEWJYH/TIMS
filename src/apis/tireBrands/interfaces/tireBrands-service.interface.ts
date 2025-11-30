import { CreateTireBrandInput } from '../dto/create-tireBrand.input';
import { UpdateTireBrandInput } from '../dto/update-tireBrand.input';

export interface ITireBrandServiceCreate {
  createTireBrandInput: CreateTireBrandInput;
}

export interface ITireBrandServiceUpdate {
  updateTireBrandInput: UpdateTireBrandInput;
}
