import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';

import { del, get, put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

export type ImageType = 'user' | 'product';

export const IMAGE_TYPES: ImageType[] = ['user', 'product'];

export interface StoredImage {
  stream: Readable;
  contentType: string;
}

/**
 * Where the product and user pictures live. The database only keeps the file name,
 * so moving between the two stores does not touch the rows.
 */
export abstract class ImageStorage {
  abstract save(type: ImageType, name: string, file: Buffer, contentType: string): Promise<void>;
  abstract read(type: ImageType, name: string): Promise<StoredImage | null>;
  abstract remove(type: ImageType, name: string): Promise<void>;
}

const CONTENT_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
};

const contentTypeOf = (name: string) =>
  CONTENT_TYPES[name.split('.').pop()?.toLowerCase()] || 'application/octet-stream';

/** Local folder, for development and the docker setup */
export class DiskImageStorage extends ImageStorage {
  constructor(private root: string) {
    super();
  }

  async save(type: ImageType, name: string, file: Buffer) {
    await fs.promises.mkdir(path.join(this.root, type), { recursive: true });
    await fs.promises.writeFile(this.pathOf(type, name), file);
  }

  async read(type: ImageType, name: string) {
    const file = this.pathOf(type, name);
    if (!fs.existsSync(file)) {
      return null;
    }
    return { stream: fs.createReadStream(file), contentType: contentTypeOf(name) };
  }

  async remove(type: ImageType, name: string) {
    await fs.promises.rm(this.pathOf(type, name), { force: true });
  }

  private pathOf(type: ImageType, name: string) {
    return path.join(this.root, type, name);
  }
}

/** Private Vercel Blob store: a serverless function forgets whatever it writes to disk */
export class BlobImageStorage extends ImageStorage {
  constructor(private token: string) {
    super();
  }

  async save(type: ImageType, name: string, file: Buffer, contentType: string) {
    await put(`${type}/${name}`, file, {
      access: 'private',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      token: this.token,
    });
  }

  async read(type: ImageType, name: string) {
    const result = await get(`${type}/${name}`, { access: 'private', token: this.token });
    if (!result || result.statusCode !== 200) {
      return null;
    }
    return {
      stream: Readable.fromWeb(result.stream as ReadableStream),
      contentType: result.blob.contentType,
    };
  }

  async remove(type: ImageType, name: string) {
    await del(`${type}/${name}`, { token: this.token });
  }
}
