import { GameRoom, SessionUser } from "..";

declare module "express" {
  interface Locals {
   user?: SessionUser;
   room?: GameRoom;
  }
}