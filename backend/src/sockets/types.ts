import { Socket } from "socket.io";

import User from "../database/models/userModel";


export interface AuthenticatedSocket
  extends Socket {

  data: {
    user: User;
  };

}