import { route } from "@react-router/dev/routes";
import fragments from "./parts/extra";

export default [route("shared", "./routes/one.tsx"), ...fragments];
