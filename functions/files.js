import { promises as fs } from 'fs';

async function exists(path) {
    try {
        const stat = await fs.stat(path);
        return true;
    }
    catch (e) {
        return false;
    }
}

export async function load(file_path) {
    if (! await exists(file_path)) {
        save(file_path, JSON.stringify([]));
    }

    return await fs.readFile(file_path);
}

export async function save(file_path, data) {
    await fs.writeFile(file_path, data);
}