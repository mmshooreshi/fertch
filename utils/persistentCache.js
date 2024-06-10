import { DiskStore } from 'cache-manager-fs-hash';

const diskStore = new DiskStore({
    path: 'diskcache', // Path for cached files
    ttl: 60 * 60 * 1000, // Time to live in milliseconds
    zip: true, // Zip files to save disk space
});

const get = async (key) => {
    try {
        return await diskStore.get(key);
    } catch (error) {
        throw new Error(`Error getting cache for key ${key}: ${error}`);
    }
};

const set = async (key, value, ttl) => {
    try {
        await diskStore.set(key, value, ttl);
    } catch (error) {
        throw new Error(`Error setting cache for key ${key}: ${error}`);
    }
};

const del = async (key) => {
    try {
        await diskStore.del(key);
    } catch (error) {
        throw new Error(`Error deleting cache for key ${key}: ${error}`);
    }
};

const reset = async () => {
    try {
        await diskStore.reset();
    } catch (error) {
        throw new Error(`Error resetting cache: ${error}`);
    }
};

export { get, set, del, reset };
