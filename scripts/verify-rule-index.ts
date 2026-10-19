/* global console */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyRuleIndex } from "./rule-index.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
console.log(verifyRuleIndex(root));
