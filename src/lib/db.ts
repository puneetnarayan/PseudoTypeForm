import * as fileDb from "./db-file";
import * as githubDb from "./db-github";

// GITHUB_DATA_TOKEN present -> persist to a JSON file committed to a GitHub
// branch (see db-github.ts). Otherwise -> a local file under ./data, which
// is what `npm run dev` uses with zero setup.
const impl = githubDb.isGithubDataConfigured() ? githubDb : fileDb;

export const listForms = impl.listForms;
export const getForm = impl.getForm;
export const createForm = impl.createForm;
export const updateForm = impl.updateForm;
export const deleteForm = impl.deleteForm;
export const listResponses = impl.listResponses;
export const addResponse = impl.addResponse;
