import { UserProps } from "../types/user";

// for sending data to frontend
export interface PublicUserDTO extends Omit<UserProps,'password'> {}