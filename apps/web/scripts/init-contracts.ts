import * as fs from "fs";
import * as path from "path";

// Define the file you want to create
const targetFilePath = path.join(
  "src/contracts",
  "deployedLocalContracts.ts",
);

// Check if the file exists
if (!fs.existsSync(targetFilePath)) {
  // Content of the TypeScript file
  const content = `
/**
 * This file is autogenerated!
 * You should not edit it manually or your changes might be overwritten.
 */
import type { GenericContractsDeclaration } from "@/lib/contract";

const deployedLocalContracts = {} as const;

export default deployedLocalContracts satisfies GenericContractsDeclaration;
`;

  // Ensure the directory exists
  const dir = path.dirname(targetFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(targetFilePath, content, { encoding: "utf-8" });

  console.log(`File created: ${targetFilePath}`);
} else {
  console.log(`File already exists: ${targetFilePath}`);
}
