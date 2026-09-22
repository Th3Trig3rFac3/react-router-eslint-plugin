import { route } from "@react-router/dev/routes";

export default [
  route("shared", "./routes/two.tsx"),
  route("users/:id/:id", "./routes/users.tsx"),
];
