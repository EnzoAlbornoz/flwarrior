/* eslint-disable import/no-extraneous-dependencies */
// Import Dependencies
import { expect, test } from "@jest/globals";
import Immutable from "immutable";

import { analyze } from "../lib/lexicalAnalyzer";

test("test analyze", () => {
    analyze("bing \n bong   begin   program se var1 - var2");
});
