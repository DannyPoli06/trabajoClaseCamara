import { Injectable, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos = signal<UserPhoto[]>([]);
  private PHOTO_STORAGE: string = 'photos';

public async addNewToGallery() {
  const capturedPhoto = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    quality: 100,
  });

  const savedImageFile = await this.savePicture(capturedPhoto);
  
  // Actualizamos la señal
  this.photos.update((photos) => [savedImageFile, ...photos]);

  // CHANGE: Guardamos la lista actualizada de fotos en Preferences
  Preferences.set({
    key: this.PHOTO_STORAGE,
    value: JSON.stringify(this.photos()),
  });
}


  private async savePicture(photo: Photo) {
    const base64Data = await this.base64FromPath(photo.webPath!);

    // Write the file to the data directory
    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    // Use webPath to display the new image instead of base64 since it's
    // already loaded into memory
    return {
      filepath: fileName,
      webviewPath: photo.webPath,
    };
  }

  private async base64FromPath(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('method did not return a string');
        }
      };
      reader.readAsDataURL(blob);
    });
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}