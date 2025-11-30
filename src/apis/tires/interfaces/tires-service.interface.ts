import { CreateTireInput } from '../dto/create-tire.input';
import { UpdateTireInput } from '../dto/update-tire.input';

export interface ITiresServiceCreate {
  createTireInput: CreateTireInput;
}

export interface ITiresServiceUpdate {
  updateTireInput: UpdateTireInput;
}
