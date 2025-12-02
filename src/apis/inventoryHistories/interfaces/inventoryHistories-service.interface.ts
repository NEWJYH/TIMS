import { User } from 'src/apis/users/entities/user.entity';
import { FetchInventoryHistoryInput } from '../dto/fetch-inventoryHistory.input';

export interface IInventoryHistoriesServiceFindAll {
  user: User;
  fetchInventoryHistoryInput: FetchInventoryHistoryInput;
}
