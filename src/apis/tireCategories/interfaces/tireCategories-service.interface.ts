import { CreateTireCategoryInput } from '../dto/create-tireCategory.input';
import { UpdateTireCategoryInput } from '../dto/update-tireCategory.input';

export interface ITireCategoriesServiceCreate {
  createTireCategoryInput: CreateTireCategoryInput;
}

export interface ITireCategoriesServiceUpdate {
  updateTireCategoryInput: UpdateTireCategoryInput;
}
