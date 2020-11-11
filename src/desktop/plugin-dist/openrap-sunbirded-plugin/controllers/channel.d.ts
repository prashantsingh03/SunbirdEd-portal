import { Manifest } from "@project-sunbird/ext-framework-server/models";
export declare class Channel {
    private databaseSdk;
    private fileSDK;
    constructor(manifest: Manifest);
    insert(): Promise<void>;
    get(req: any, res: any): void;
}