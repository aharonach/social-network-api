import { promises as fs } from "fs";

async function exists(path) {
    try {
        const stat = await fs.stat(path)
        return true;
    }
    catch (e) {
        return false;
    }
}