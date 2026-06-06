import axios, { AxiosProgressEvent, AxiosError } from 'axios';

export interface UploadResult {
  success: boolean;
  message?: string;
  data?: any;
}

export class UploadHelper {
  /**
   * Upload a file to a storage provider.
   *
   * Retries are handled by the caller (StorageHandler) across providers;
   * this method attempts the upload exactly once.
   */
  public static async upload(
    hostname: string, 
    fileId: string, 
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      const result = await this.executeUpload(hostname, fileId, file, onProgress);
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Upload failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Execute upload using Axios (modern, clean API with progress)
   */
  private static async executeUpload(
    hostname: string, 
    fileId: string, 
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const formData = new FormData();
    // fid must be appended before the file part so the streaming parser
    // on the provider sees it before breaking out of the multipart loop.
    formData.append('fid', fileId);
    formData.append('file', file);

    try {
      const response = await axios.post(`https://${hostname}/api/v1/upload`, formData, {
        timeout: 5 * 60 * 1000,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Axios has built-in upload progress!
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });

      return {
        success: true,
        data: response.data,
        message: 'File uploaded successfully'
      };
      
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Server responded with error status
        throw new Error(
          `Server error: ${axiosError.response.status} - ${
            (axiosError.response.data as any).message || axiosError.message
          }`
        );
      } else if (axiosError.request) {
        // Request was made but no response
        throw new Error('Network error: No response from server');
      } else {
        // Something else went wrong
        throw new Error(`Upload error: ${axiosError.message}`);
      }
    }
  }
}
