import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Export project as ZIP file
export const exportProject = async (project) => {
    try {
        console.log('Starting export for project:', project.projectName);

        if (!project) {
            throw new Error('No project data provided');
        }

        if (!project.videoBlob) {
            throw new Error('Video blob not found in project');
        }

        const zip = new JSZip();

        // Add project metadata
        zip.file('project.json', JSON.stringify({
            projectName: project.projectName,
            videoName: project.videoName,
            createdAt: project.createdAt,
            lastModified: project.lastModified
        }, null, 2));

        // Add measurements data
        zip.file('measurements.json', JSON.stringify(project.measurements || [], null, 2));

        // Add narration data if exists
        if (project.narration) {
            zip.file('narration.json', JSON.stringify(project.narration, null, 2));
        }

        // Add video file
        console.log('Adding video file:', project.videoName);
        zip.file(project.videoName, project.videoBlob);

        // Generate ZIP blob
        console.log('Generating ZIP file...');
        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        console.log('ZIP generated, size:', blob.size, 'bytes');

        // Download using FileSaver.js
        const fileName = `${project.projectName}.zip`;
        console.log('Downloading file:', fileName);
        saveAs(blob, fileName);

        console.log('Export completed successfully');

        // Show message
        alert(`Export selesai!\n\nFile: ${fileName}\nUkuran: ${(blob.size / 1024 / 1024).toFixed(2)} MB\n\nCek folder Downloads Anda.`);

        return true;
    } catch (error) {
        console.error('Error exporting project:', error);
        alert('Gagal export proyek: ' + error.message);
        throw error;
    }
};

// Import project from ZIP file
export const importProject = async (zipFile) => {
    try {
        const zip = await JSZip.loadAsync(zipFile);

        // Extract project metadata
        const projectJsonFile = zip.file('project.json');
        if (!projectJsonFile) {
            throw new Error('Invalid project file: project.json not found');
        }
        const projectJson = JSON.parse(await projectJsonFile.async('string'));

        // Extract measurements
        const measurementsFile = zip.file('measurements.json');
        if (!measurementsFile) {
            throw new Error('Invalid project file: measurements.json not found');
        }
        const measurements = JSON.parse(await measurementsFile.async('string'));

        // Extract narration (optional)
        let narration = null;
        const narrationFile = zip.file('narration.json');
        if (narrationFile) {
            narration = JSON.parse(await narrationFile.async('string'));
        }

        // Extract video file
        const videoFile = zip.file(projectJson.videoName);
        if (!videoFile) {
            throw new Error(`Invalid project file: ${projectJson.videoName} not found`);
        }
        const videoBlob = await videoFile.async('blob');

        return {
            projectName: projectJson.projectName,
            videoName: projectJson.videoName,
            videoBlob,
            measurements,
            narration,
            createdAt: projectJson.createdAt,
            lastModified: projectJson.lastModified
        };
    } catch (error) {
        console.error('Error importing project:', error);
        throw error;
    }
};
