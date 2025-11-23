// IndexedDB wrapper for Motion Analysis data
const DB_NAME = 'MotionAnalysisDB';
const DB_VERSION = 2; // Updated version for projects
const STORE_NAME = 'measurements';
const PROJECTS_STORE = 'projects';

// Initialize database
export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create measurements store if not exists
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                objectStore.createIndex('videoName', 'videoName', { unique: false });
            }

            // Create projects store if not exists
            if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id', autoIncrement: true });
                projectStore.createIndex('projectName', 'projectName', { unique: true });
                projectStore.createIndex('createdAt', 'createdAt', { unique: false });
                projectStore.createIndex('lastModified', 'lastModified', { unique: false });
            }
        };
    });
};

// Save measurement session
export const saveMeasurementSession = async (videoName, measurements, narration = null) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const data = {
            videoName: videoName || 'Untitled',
            timestamp: new Date().toISOString(),
            measurements: measurements,
            narration: narration
        };

        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get all sessions
export const getAllSessions = async () => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get session by ID
export const getSessionById = async (id) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Delete session
export const deleteSession = async (id) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Update session
export const updateSession = async (id, videoName, measurements, narration = null) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const data = {
            id: id,
            videoName: videoName || 'Untitled',
            timestamp: new Date().toISOString(),
            measurements: measurements,
            narration: narration
        };

        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// ===== PROJECT MANAGEMENT FUNCTIONS =====

// Save new project
export const saveProject = async (projectName, videoBlob, videoName, measurements = [], narration = null) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE);

        const data = {
            projectName,
            videoBlob,
            videoName,
            measurements,
            narration,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get all projects
export const getAllProjects = async () => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Get project by name
export const getProjectByName = async (projectName) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE);
        const index = store.index('projectName');
        const request = index.get(projectName);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Update project
export const updateProject = async (projectName, updates) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise(async (resolve, reject) => {
        try {
            // First get the existing project
            const project = await getProjectByName(projectName);
            if (!project) {
                reject(new Error('Project not found'));
                return;
            }

            const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
            const store = transaction.objectStore(PROJECTS_STORE);

            const updatedData = {
                ...project,
                ...updates,
                lastModified: new Date().toISOString()
            };

            const request = store.put(updatedData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
};

// Delete project
export const deleteProject = async (projectName) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise(async (resolve, reject) => {
        try {
            // First get the project to get its ID
            const project = await getProjectByName(projectName);
            if (!project) {
                reject(new Error('Project not found'));
                return;
            }

            const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
            const store = transaction.objectStore(PROJECTS_STORE);
            const request = store.delete(project.id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
};

// Get project by ID
export const getProjectById = async (id) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Delete project by ID
export const deleteProjectById = async (id) => {
    const db = await initDB();
    const PROJECTS_STORE = 'projects';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
