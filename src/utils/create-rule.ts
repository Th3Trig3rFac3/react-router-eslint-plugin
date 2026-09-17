import { ESLintUtils } from "@typescript-eslint/utils";

export interface ReactRouterRuleDocs {
  recommended?: boolean | "warn";
  requiresTypeChecking?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<ReactRouterRuleDocs>(
  (name) =>
    `https://github.com/Th3Trig3rFac3/react-router-eslint-plugin/blob/main/docs/rules/${name}.md`,
);
