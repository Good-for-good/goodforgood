import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize the Google Drive API client
function getDriveClient() {
  try {
    // Debug logging
    console.log('=== Google Drive Client Debug ===');
    console.log('Initializing Google Drive client...');
    console.log('Service account email configured:', !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('Private key configured:', !!process.env.GOOGLE_PRIVATE_KEY);
    console.log('Cloud backup enabled:', process.env.NEXT_PUBLIC_ENABLE_CLOUD_BACKUP === 'true');
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing required Google Drive credentials');
    }

    // Debug the private key format (safely)
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    console.log('Private key starts with:', privateKey.substring(0, 27));
    console.log('Private key ends with:', privateKey.slice(-25));
    console.log('Private key length:', privateKey.length);
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    // Test the auth configuration
    console.log('Testing Google Auth configuration...');
    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('=== Google Drive Client Error ===');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to initialize Google Drive client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const googleDriveService = {
  /**
   * Upload a file to Google Drive
   */
  uploadFile: async (fileName: string, content: string, mimeType = 'application/json'): Promise<string> => {
    try {
      console.log('Attempting to upload file:', fileName);
      const drive = getDriveClient();
      
      // Convert string content to readable stream
      const contentStream = new Readable();
      contentStream.push(content);
      contentStream.push(null);

      // Get the backup folder ID, create if doesn't exist
      const folderName = 'GoodForGood Backups';
      console.log('Getting/Creating folder:', folderName);
      const folderId = await googleDriveService.getOrCreateFolder(folderName);
      console.log('Using folder ID:', folderId);

      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType,
        body: contentStream,
      };

      console.log('Creating file in Google Drive...');
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id,webViewLink',
      });

      console.log('File created successfully:', response.data);
      return response.data.webViewLink || '';
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw new Error(`Failed to upload file to Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get or create a folder in Google Drive
   */
  getOrCreateFolder: async (folderName: string): Promise<string> => {
    const drive = getDriveClient();

    try {
      // Check if folder already exists
      const response = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id!;
      }

      // Create new folder if it doesn't exist
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      return folder.data.id!;
    } catch (error) {
      console.error('Error getting/creating folder in Google Drive:', error);
      throw new Error('Failed to get/create folder in Google Drive');
    }
  },

  /**
   * List all backup files in the backup folder
   */
  listBackups: async (): Promise<Array<{ name: string; id: string; webViewLink: string }>> => {
    const drive = getDriveClient();
    const folderName = 'GoodForGood Backups';

    try {
      const folderId = await googleDriveService.getOrCreateFolder(folderName);

      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, webViewLink)',
        orderBy: 'createdTime desc',
      });

      return response.data.files?.map(file => ({
        name: file.name!,
        id: file.id!,
        webViewLink: file.webViewLink!,
      })) || [];
    } catch (error) {
      console.error('Error listing backup files:', error);
      throw new Error('Failed to list backup files');
    }
  },

  /**
   * Delete a file from Google Drive
   */
  deleteFile: async (fileId: string): Promise<void> => {
    const drive = getDriveClient();

    try {
      await drive.files.delete({
        fileId,
      });
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  },

  /**
   * Download a file from Google Drive
   */
  downloadFile: async (fileId: string): Promise<string> => {
    const drive = getDriveClient();

    try {
      const response = await drive.files.get({
        fileId,
        alt: 'media',
      }, {
        responseType: 'text',
      });

      // When using alt: 'media', the response.data contains the file content as string
      return response.data as unknown as string;
    } catch (error) {
      console.error('Error downloading file from Google Drive:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  },
}; 