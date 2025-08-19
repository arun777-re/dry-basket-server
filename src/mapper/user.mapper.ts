import { UserProps } from "../types/user";
import { PublicUserDTO } from "../dtos/user.dto";

// convert data to db to client
export const toPublicUserDTO = (user: UserProps): PublicUserDTO => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  isActive: user.isActive,
});
